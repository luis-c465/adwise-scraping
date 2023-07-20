import { map as pMap } from "bluebird";
import chalk from "chalk";
import { Presets, SingleBar } from "cli-progress";
import { promises as fs } from "fs";
import { random } from "lodash";
import { firefox } from "playwright";
import { getBibtex } from "./bibtex";
import getResult from "./result";
import { PubData, addTags } from "./tags";
import getUrlsAndStats from "./urls";
import { wait } from "./util";

const BASEURL =
  "https://scholar.google.com/citations?hl=en&user=63HyXSkAAAAJ&pagesize=100&view_op=list_works&sortby=pubdate&cstart=0";

main();

async function main() {
  const progressBar = new SingleBar(
    {
      format: `${chalk.green(
        "{bar}"
      )} {percentage}% || {value}/{total} publications || {duration}s`,
    },
    Presets.shades_classic
  );

  const pubData: PubData = JSON.parse(
    await fs.readFile("./assets/pub.json", {
      encoding: "utf-8",
    })
  );

  const browser = await firefox.launch();
  let context = await browser.newContext();

  const { stats, urls } = await getUrlsAndStats(BASEURL, { browser, context });
  await context.close();

  console.log(
    chalk.bold.blue("Professor Dr. Kemal Akkaya Google Scholar Stats:")
  );
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log(
    chalk.bold.magenta(
      `\nUsed to update google scholar stats on https://adwise.fiu.edu/publications\n\n`
    )
  );

  console.log(chalk.bold.blue("Scraping publications from google scholar"));

  progressBar.start(urls.length, 0);

  if (!urls) {
    console.error(chalk.red("No urls found, exiting ..."));
    progressBar.stop();
    return;
  }

  const results = await pMap(
    urls,
    async (url) => {
      const context = await browser.newContext();
      const result = await getResult(url, {
        browser,
        context,
      });
      const withTag = addTags(result, pubData);
      const bibtex = getBibtex(withTag);

      progressBar.increment();
      context.close();

      await wait(random(100, 900));

      return bibtex;
    },
    { concurrency: 5 }
  );

  const data = results.filter((r) => r !== null).join("\n\n");
  await fs.writeFile("./data/results.bib", data, {
    encoding: "utf-8",
  });

  browser.close();

  progressBar.stop();
  console.log(
    `${chalk.bold("Output is in")} => ${chalk.gray("./data/results.bib")}\n`
  );
}
