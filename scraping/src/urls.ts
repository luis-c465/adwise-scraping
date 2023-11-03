import { CheerioAPI } from "cheerio";
import { loadPage, wait } from "./util.js";

const SCHOLAR_URL = "https://scholar.google.com";;

export type PersonData = {
  citations: number;
  "h-index": number;
  "i10-index": number;
};

/**
 * Gets the urls from a google scholar citations page
 */
export async function getUrlsAndStats(url: string) {
  const $main = await loadPage(url);

  const table = $main("#gsc_rsb_st tbody");
  const stats: PersonData = {
    citations: parseInt(table.eq(0).eq(1).text()),
    "h-index": parseInt(table.eq(1).eq(1).text()),
    "i10-index": parseInt(table.eq(2).eq(1).text()),
  };

  let urls = $main("a[href^='/citations']")
    .map((i, e) => {
        const elm = e as never as HTMLLinkElement;
        return elm.href;
    })
    .toArray();

  let start = 0;
  while (true) {
    const link = new URL(url);
    const params = new URLSearchParams(link.search);
    params.set("cstart", `${start}`);
    link.search = params.toString();

    const $next = await loadPage(link.toString());

    const moreUrls = $next("a[href^='/citations']")
      .map((i, a) => {
        const elm = a as never as HTMLLinkElement;
        return elm.href;
      })
      .toArray();

    urls = [...urls, ...moreUrls];
    start += 100;
    await wait(200)

    // If the load more button is not disabled
    const showMoreBtn = $next("#gsc_bpf_more").not("[disabled]");
    if (showMoreBtn.length === 0) {
      break;
    }

  }

  return { urls, stats };
}

function getLinks($: CheerioAPI) {
  return $("a")
    .map((i, e) => `$(e).attr("href")`)
    .toArray();
}
