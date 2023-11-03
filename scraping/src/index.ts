import { map } from "bluebird";
import { getBibtex } from "./bibtex";
import { getResult } from "./result";
import { addTags } from "./tags";
import { getUrlsAndStats } from "./urls";

export const BASEURL =
  "https://scholar.google.com/citations?hl=en&user=63HyXSkAAAAJ&pagesize=100&view_op=list_works&sortby=pubdate&cstart=0";

export default async function getData() {
  const { urls } = await getUrlsAndStats(BASEURL);

  const results = await map(
    urls,
    async (url) => {
      const result = await getResult(url);
      const withTag = addTags(result);
      const bibtex = getBibtex(withTag);

      return bibtex;
    },
    {
      concurrency: 10,
    }
  );

  const bibtex = results.filter((r) => r !== null).join("\n\n");

  return { bibtex, urls, num: results.length, results };
}

export * from "./bibtex";
export * from "./result";
export * from "./tags";
export * from "./urls";
export * from "./util";
