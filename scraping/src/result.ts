import type { Browser } from "puppeteer";
import { withPage } from "./util";

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

export const getResult = (url: string, browser: Browser) =>
  withPage(browser, async (page) => {
    await page.goto(url);

    const [title, linkUrl] = await page.$eval(
      "a.gsc_oci_title_link",
      (el: HTMLAnchorElement) => [el.textContent, el.href]
    );

    const tableInfoElms = (await page.$$("#gsc_oci_table .gs_scl")).filter(
      (elm) =>
        elm.evaluate(
          (el) =>
            !el.textContent &&
            !el.textContent.includes("Total citations") &&
            !el.textContent.includes("Scholar articles")
        )
    );

    const tableInfo = await Promise.all(
      tableInfoElms.map(async (e) => [
        await e.$eval(".gsc_oci_field", (el) =>
          el.textContent
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, "")
        ),
        await e.$eval(".gsc_oci_value", (el) => el.textContent),
      ])
    );

    const obj = Object.fromEntries(tableInfo);

    return {
      ...obj,
      title,
      url: linkUrl,
      scholarUrl: url,
      year: obj.publicationDate ? obj?.publicationDate?.split("/")[0] : null,
      authors: obj.authors ? obj?.authors?.split(",") : null,
    } as Result;
  });
