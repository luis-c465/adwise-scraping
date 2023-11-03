import pMap from "@cjs-exporter/p-map";
import chalk from "chalk";
import { Presets, SingleBar } from "cli-progress";
import { promises as fs } from "fs";
import { getBibtex } from "./bibtex";
import getResult from "./result";
import { PubData, addTags } from "./tags";
import getUrlsAndStats from "./urls";

export type Result = {
  title: string;
  url: string;
  scholarUrl: string;
  year: string;
  date: string;
  description: string;

  articles: string;

  [key: string]: string | string[] | null;
} & (
  | {
      inventors: string[];
      office: string;
      number: string;
    }
  | {
      authors: string[];
    }
  | {
      journal: string;
      volume: string;
      pages: string;
    }
);

main();

async function main() {
  // format: "Scraping google scholar \n" + chalk.green("{bar}") + "| {percentage}% || {value}/{total} publications || {duration}s",
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

  const { stats, urls } = await getUrlsAndStats();
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
      const result = await getResult(url);
      const withTag = addTags(result, pubData);
      const bibtex = getBibtex(withTag);

      progressBar.increment();

      return bibtex;
    },
    { concurrency: 10, stopOnError: true }
  );

  const data = results.filter((r) => r !== null).join("\n\n");
  await fs.writeFile("./data/results.bib", data, {
    encoding: "utf-8",
  });

  progressBar.stop();
  console.log(
    `${chalk.bold("Output is in")} => ${chalk.gray("./data/results.bib")}\n`
  );
}
