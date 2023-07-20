import type { PageArgs } from "./types";
import { normalizeString } from "./util";

export type Result = {
  title: string;
  url: string;
  scholarUrl: string;
  year: string;
  date: string;
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
    }
  | {
      journal: string;
      volume: string;
      pages: string;
    }
);

export default async function getResult(
  url: string,
  { context }: PageArgs
): Promise<Result> {
  const page = await context.newPage();
  await page.goto(url);

  if ((await page.getByText("detected unusual traffic").count()) > 0) {
    console.log(await page.content());
  }

  const titleElm = await page.$("a.gsc_oci_title_link");
  const title = await titleElm.textContent();
  const linkUrl = await titleElm.getAttribute("href");

  const tableInfoElms = page
    .locator("#gsc_oci_table .gs_scl")
    .filter({ hasNotText: "Total citations" })
    .filter({ hasNotText: "Scholar articles" });

  const tableInfo = await tableInfoElms.evaluateAll((elms) =>
    elms.map((e) => [
      e.querySelector(".gsc_oci_field").textContent,
      e.querySelector(".gsc_oci_value").textContent,
    ])
  );

  const normalizedInfo = tableInfo.map(([key, value]) => [
    normalizeString(key),
    value,
  ]);

  const obj = Object.fromEntries(normalizedInfo);

  await page.close();

  return {
    ...obj,
    title,
    url: linkUrl,
    scholarUrl: url,
    year: obj.publicationDate ? obj?.publicationDate?.split("/")[0] : null,
    authors: obj.authors ? obj?.authors?.split(",") : null,
  } as Result;
}
