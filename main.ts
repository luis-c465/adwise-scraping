import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import pMap from "p-map";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

const baseUrl = "https://scholar.google.com/citations?user=63HyXSkAAAAJ";
const url =
    "https://scholar.google.com/citations?hl=en&user=63HyXSkAAAAJ&view_op=list_works&sortby=pubdate";

type Result = {
    title: string;
    url: string;
    year: string;
    date: string;

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

async function main() {
    await withBrowser(async (browser) => {
        const urls = await withPage(browser, async (page) => {
            // Load all the publications published by Kemal in google scholar
            await page.goto(url);
            while (true) {
                const showMoreBtn = await page.$(
                    "#gsc_bpf_more:not([disabled])"
                );
                if (showMoreBtn) {
                    await showMoreBtn.click();
                    await wait(1000);
                } else {
                    break;
                }
            }

            const publicationsTable = await page.$("#gsc_a_b");
            const urls = await publicationsTable.$$("a[href^='/citations'");
            return await Promise.all(
                urls.map((el) => el.evaluate((el) => el.href))
            );
        });

        if (!urls) {
            console.error("urls is null");
            return;
        }

        const results = await pMap(
            urls,
            async (url) => {
                return withPage(browser, async (page) => {
                    await page.goto(url);

                    const [title, linkUrl] = await page.$eval(
                        "a.gsc_oci_title_link",
                        (el) => [el.textContent, el.href]
                    );

                    const table = await page.$("#gsc_oci_table");
                    const tableInfoElms = (await table.$$(".gs_scl")).filter(
                        (elm) =>
                            elm.evaluate(
                                (el) =>
                                    !el.textContent &&
                                    !el.textContent.includes(
                                        "Total citations"
                                    ) &&
                                    !el.textContent.includes("Scholar articles")
                            )
                    );

                    const tableInfo = await Promise.all(
                        tableInfoElms.map(async (e) => [
                            await e.$eval(".gsc_oci_field", (el) =>
                                el.textContent
                                    .replace(
                                        /(?:^\w|[A-Z]|\b\w)/g,
                                        (word, index) =>
                                            index === 0
                                                ? word.toLowerCase()
                                                : word.toUpperCase()
                                    )
                                    .replace(/\s+/g, "")
                            ),
                            await e.$eval(
                                ".gsc_oci_value",
                                (el) => el.textContent
                            ),
                        ])
                    );

                    const obj = Object.fromEntries(tableInfo);
                    const finalObj = {
                        ...obj,
                        title,
                        url: linkUrl,
                        year: obj.publicationDate
                            ? obj?.publicationDate?.split("/")[0]
                            : null,
                        authors: obj.authors ? obj?.authors?.split(",") : null,
                    } as unknown as Result;

                    // return getBibtex(finalObj);
                    return finalObj;
                });
            },
            { concurrency: 10, stopOnError: true }
        );

        await fs.writeFile(
            "./data/results.json",
            JSON.stringify(results, null, 2),
            {
                encoding: "utf-8",
            }
        );
    });
}
main();

function getBibtex(obj: Result) {
    const type = obj.url.includes("ieee.org")
        ? "inproceedings"
        : obj.url.includes("patent/US")
        ? "patent"
        : "article";

    return `@${type}{kem${nanoid(6)}
      ${Object.entries(obj).map(([key, value], i, arr) => {
          if (!key || !value) {
              return "";
          }

          const space = i !== arr.length - 1 ? "," : "";
          return `${key} = \{${value}\}${space}\n`;
      })}
    }`;
}

type Callback<T, R> = (_: T) => Promise<R>;

async function withBrowser<R>(fn: Callback<Browser, R>) {
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: null,
    });
    try {
        return await fn(browser);
    } finally {
        await browser.close();
    }
}

async function withPage<R>(browser: Browser, fn: Callback<Page, R>) {
    const page = await browser.newPage();
    try {
        return await fn(page);
    } catch (e) {
        console.error(e);
        return null;
    } finally {
        await page.close();
    }
}
// const withPage =
//     (browser: Browser) =>
//     async <R>(fn: Callback<Page, R>) => {
//         const page = await browser.newPage();
//         try {
//             return await fn(page);
//         } catch (e) {
//             console.error(e);
//             return null;
//         } finally {
//             await page.close();
//         }
//     };

async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function camelize(str: string) {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, "");
}
