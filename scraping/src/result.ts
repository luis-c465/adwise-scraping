import pmap from "promise.map";
import { loadPage, normalizeString } from "./util";

export type Result = {
  title: string;
  url: string;
  scholarUrl: string;
  year: string;
  publicationDate: string;
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
      conference: string;
    }
  | {
      journal: string;
      volume: string;
      pages: string;
    }
);

export async function getResult(url: string) {
  const $ = await loadPage(url);

  const titleElm = $("a.gsc_oci_title_link");
  const title = titleElm.text();
  const linkUrl = titleElm.attr("href");

  const table = $("#gsc_oci_table");
  const tableInfoElms = table
    .find(".gs_scl")
    .children()
    .filter((elm) => {
      const text = this.text();

      return (
        !text &&
        !text.includes("Total citations") &&
        !text.includes("Scholar articles")
      );
    })
    .toArray()
    .map((e) => $(e));

  const tableInfo = await pmap(tableInfoElms, async (e) => [
    normalizeString(e.find(".gsc_oci_field").text()),
    e.find(".gsc_oci_value").text(), {}
  ], 10);

  const obj = Object.fromEntries(tableInfo);
  return {
    ...obj,
    title,
    url: linkUrl,
    year: obj.publicationDate ?? obj?.publicationDate?.split("/")[0],
    authors: obj.authors ?? obj?.authors?.split(","),
  } as unknown as Result;

}
