import { map as pMap } from "bluebird";
import { getBibtex } from "./bibtex";
import { getResult } from "./result";
import { addTags } from "./tags";
import { getUrlsAndStats } from "./urls";
import { withBrowser } from "./util";

export const BASEURL =
  "https://scholar.google.com/citations?hl=en&user=63HyXSkAAAAJ&pagesize=100&view_op=list_works&sortby=pubdate&cstart=0";

const getData = () =>
  withBrowser(async (browser) => {
    const { urls } = await getUrlsAndStats(BASEURL, browser);

    const results = await pMap(
      urls,
      async (url) => {
        const result = await getResult(url, browser);
        const withTag = addTags(result);
        const bibtex = getBibtex(withTag);

        return bibtex;
      },
      { concurrency: 10 }
    );

    const bibtex = results.filter((r) => r !== null).join("\n\n");

    return { bibtex, urls, num: results.length, results };
  });
export default getData;

export * from "./bibtex";
export * from "./result";
export * from "./tags";
export * from "./urls";
export * from "./util";
