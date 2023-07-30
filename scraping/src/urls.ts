import { Browser } from "puppeteer";
import { wait, withPage } from "./util.js";

export type PersonData = {
  citations: number;
  "h-index": number;
  "i10-index": number;
};

/**
 * Gets the urls from a google scholar citations page
 */
export const getUrlsAndStats = (url: string, browser: Browser) =>
  withPage(browser, async (page) => {
    await page.goto(url);

    while (true) {
      const showMoreBtn = await page.$("#gsc_bpf_more:not([disabled])");
      if (showMoreBtn) {
        await showMoreBtn.click();
        await wait(1000);
      } else {
        break;
      }
    }

    const stats = await page.$$eval("#gsc_rsb_st tbody tr", (stats) => {
      const [citations, hIndex, i10Index] = stats.map((stat) =>
        parseInt(stat.children[1].textContent)
      );
      return {
        citations,
        "h-index": hIndex,
        "i10-index": i10Index,
      } as PersonData;
    });

    const urls = await page.$$eval(
      "a[href*='citation_for_view']",
      (links: HTMLAnchorElement[]) => links.map((link) => link.href)
    );

    return { urls, stats };
  });
