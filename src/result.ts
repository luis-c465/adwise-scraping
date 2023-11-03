import pMap from "@cjs-exporter/p-map";
import { Result } from "./main";
import { loadPage } from "./urls";
import { normalizeString } from "./util";

export default async function getResult(url: string): Promise<Result> {
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

  const tableInfo = await pMap(tableInfoElms, async (e) => [
    normalizeString(e.find(".gsc_oci_field").text()),
    e.find(".gsc_oci_value").text(),
  ]);

  const obj = Object.fromEntries(tableInfo);
  return {
    ...obj,
    title,
    url: linkUrl,
    year: obj.publicationDate ?? obj?.publicationDate?.split("/")[0],
    authors: obj.authors ?? obj?.authors?.split(","),
  } as unknown as Result;
}
