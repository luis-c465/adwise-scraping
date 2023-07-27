import chalk from "chalk";
import getResult from "scraping";

console.log(chalk.green("Starting the browser, this may take a while ..."));
(async () => {
  console.log(await getResult());
})();
// withBrowser(async (browser) => {
//   const progressBar = new SingleBar(
//     {
//       format: `${chalk.green(
//         "{bar}"
//       )} {percentage}% || {value}/{total} publications || {duration}s`,
//     },
//     Presets.shades_classic
//   );
//   const { stats, urls } = await getUrlsAndStats(BASEURL, browser);

//   console.log(
//     chalk.bold.blue("Professor Dr. Kemal Akkaya Google Scholar Stats:")
//   );
//   Object.entries(stats).forEach(([key, value]) => {
//     console.log(`${key}: ${value}`);
//   });

//   console.log(
//     chalk.bold.magenta(
//       `\nUsed to update google scholar stats on https://adwise.fiu.edu/publications\n\n`
//     )
//   );

//   console.log(chalk.bold.blue("Scraping publications from google scholar"));

//   progressBar.start(urls.length, 0);

//   if (!urls) {
//     console.error(chalk.red("No urls found, exiting ..."));
//     progressBar.stop();
//     return;
//   }

//   const results = await pMap(
//     urls,
//     async (url) => {
//       const result = await getResult(url, browser);
//       const withTag = addTags(result);
//       const bibtex = getBibtex(withTag);

//       progressBar.increment();

//       return bibtex;
//     },
//     { concurrency: 10 }
//   );

//   const data = results.filter((r) => r !== null).join("\n\n");
//   await fs.writeFile("./data/results.bib", data, {
//     encoding: "utf-8",
//   });

//   progressBar.stop();
//   console.log(
//     `${chalk.bold("Output is in")} => ${chalk.gray("./data/results.bib")}\n`
//   );
// });
