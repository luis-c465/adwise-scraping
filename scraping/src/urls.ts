import { random } from "lodash";
import type { PageArgs } from "./types.js";
import { wait } from "./util.js";

export type PersonData = {
  citations: number;
  "h-index": number;
  "i10-index": number;
};

/**
 * Gets the urls from a google scholar citations page
 */
export default async function getUrlsAndStats(
  url: string,
  { context }: PageArgs
) {
  await context.newPage();
  const page = await context.newPage();
  await page.goto(url);

  while (true) {
    const showMoreBtn = page.locator("#gsc_bpf_more");
    const isDisabled = await showMoreBtn.isDisabled();
    if (!isDisabled) {
      await showMoreBtn.click();
      await wait(random(700, 1500));
    } else {
      break;
    }
  }

  const stats = await page.$$eval("#gsc_rsb_st tbody tr", (stats) => {
    const data = stats.map((stat) => stat.children[1].textContent);
    return {
      citations: parseInt(data[0]),
      "h-index": parseInt(data[1]),
      "i10-index": parseInt(data[2]),
    } as PersonData;
  });

  const urls = await page.$$eval(
    "a[href*='citation_for_view']",
    (links: HTMLAnchorElement[]) => links.map((link) => link.href)
  );

  await page.close();

  return { urls, stats };
}
