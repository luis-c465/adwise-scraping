import * as cheerio from "cheerio";
import fetch from "node-fetch-commonjs";

export type PersonData = {
  citations: number;
  "h-index": number;
  "i10-index": number;
};

const BASEURL =
  "https://scholar.google.com/citations?hl=en&user=63HyXSkAAAAJ&pagesize=100&view_op=list_works&sortby=pubdate&cstart=0";

/**
 * Gets the urls from a google scholar citations page
 */
export default async function getUrlsAndStats() {
  const $ = await loadPage(BASEURL);

  const table = $("#gsc_rsb_st tbody");
  const stats: PersonData = {
    citations: parseInt(table.eq(0).eq(1).text()),
    "h-index": parseInt(table.eq(1).eq(1).text()),
    "i10-index": parseInt(table.eq(2).eq(1).text()),
  };

  let urls = $("a[href^='/citations']")
    .map((i, e) => $(e).attr("href"))
    .toArray();

  while (true) {
    const url = new URL(BASEURL);
    const params = new URLSearchParams(url.search);
    const cstart = +params.get("cstart") + 100;
    params.set("cstart", `${cstart}`);
    url.search = params.toString();

    const t$ = await loadPage(url.toString());

    const moreUrls = t$("a[href^='/citations']")
      .map((i, a) => $(a).attr("href"))
      .toArray();

    urls = [...urls, ...moreUrls];

    // If the load more button is not disabled
    const showMoreBtn = $("#gsc_bpf_more:not([disabled])");
    if (showMoreBtn.length === 0) {
      break;
    }
  }

  return { urls, stats };
}

export async function loadPage(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  return cheerio.load(html);
}
