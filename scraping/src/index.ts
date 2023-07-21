import { map as pMap } from "bluebird";
import * as pubData from "./assets/pub.json";
// import { promises as fs } from "fs";
import { random } from "lodash";
import { firefox } from "playwright";
import { getBibtex } from "./bibtex";
import { BASEURL } from "./main";
import getResult from "./result";
import { addTags } from "./tags";
import getUrlsAndStats from "./urls";
import { wait } from "./util";

export default async function getData() {
  // const pubData: PubData = JSON.parse(
  //   await fs.readFile("./assets/pub.json", {
  //     encoding: "utf-8",
  //   })
  // );

  const browser = await firefox.launch();
  let context = await browser.newContext();

  const { urls } = await getUrlsAndStats(BASEURL, {
    browser,
    context,
  });

  await context.close();

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

      context.close();

      await wait(random(100, 900));

      return bibtex;
    },
    { concurrency: 5 }
  );

  const bibtex = results.filter((r) => r !== null).join("\n\n");
  browser.close();

  return { bibtex, urls, num: results.length, results };
}
