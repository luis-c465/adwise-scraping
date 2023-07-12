import chalk from "chalk";
import { Presets, SingleBar } from "cli-progress";
import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import pMap from "p-map";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

const url =
    "https://scholar.google.com/citations?hl=en&user=63HyXSkAAAAJ&view_op=list_works&sortby=pubdate";

type Result = {
    title: string;
    url: string;
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

type PubData = {
    [key: string]: {
        publications: {
            year: number;
            fullText: string;
        }[];
    };
};

async function main(browser: Browser) {
    // format: "Scraping google scholar \n" + chalk.green("{bar}") + "| {percentage}% || {value}/{total} publications || {duration}s",
    const progressBar = new SingleBar(
        {
            format: `${chalk.green(
                "{bar}"
            )} {percentage}% || {value}/{total} publications || {duration}s`,
        },
        Presets.shades_classic
    );

    const pubData: PubData = JSON.parse(
        await fs.readFile("./assets/pub.json", {
            encoding: "utf-8",
        })
    );

    const urls = await withPage(browser, async (page) => {
        // Load all the publications published by Kemal in google scholar
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

        const publicationsTable = await page.$("#gsc_a_b");
        const urls = await publicationsTable.$$("a[href^='/citations'");

        const statsTable = await page.$$("#gsc_rsb_st tbody tr");
        const stats = await Promise.all(
            statsTable.map((stat) =>
                stat.evaluate(({ children }) => [
                    children[0].textContent,
                    children[1].textContent,
                ])
            )
        );

        console.log(
            chalk.bold.blue("Professor Dr. Kemal Akkaya Google Scholar Stats:")
        );
        stats.forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });

        console.log(
            chalk.bold.magenta(
                `\nUsed to update google scholar stats on https://adwise.fiu.edu/publications\n\n`
            )
        );

        return await Promise.all(
            urls.map((el) => el.evaluate((el) => el.href))
        );
    });

    console.log(chalk.bold.blue("Scraping publications from google scholar"));

    progressBar.start(urls.length, 0);

    if (!urls) {
        console.error("urls is null");
        progressBar.stop();
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
                                !el.textContent.includes("Total citations") &&
                                !el.textContent.includes("Scholar articles")
                        )
                );

                const tableInfo = await Promise.all(
                    tableInfoElms.map(async (e) => [
                        await e.$eval(".gsc_oci_field", (el) =>
                            el.textContent
                                .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                                    index === 0
                                        ? word.toLowerCase()
                                        : word.toUpperCase()
                                )
                                .replace(/\s+/g, "")
                        ),
                        await e.$eval(".gsc_oci_value", (el) => el.textContent),
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

                const withTag = addTags(finalObj, pubData);
                const bibtex = getBibtex(withTag);

                progressBar.increment();

                return bibtex;
            });
        },
        { concurrency: 10, stopOnError: true }
    );

    const data = results.filter((r) => r !== null).join("\n\n");
    await fs.writeFile("./data/results.bib", data, {
        encoding: "utf-8",
    });

    progressBar.stop();
    console.log(
        `${chalk.bold("Output is in")} => ${chalk.gray(
            "./data/results.bib"
        )}\n`
    );
}
withBrowser(main);

function addTags(obj: Result, pubData: PubData) {
    if (obj.tags) {
        return { ...obj, tags: obj.tags };
    }

    const likelyHoods = Object.entries(pubData).map(([key, value]) => {
        return {
            [key]: Math.max(
                ...value.publications.map(({ fullText }) =>
                    similarity(obj.title, fullText)
                )
            ),
        };
    });

    const likelyHood = reduceObject(likelyHoods);

    const [highestLikelyHood] = Object.entries(likelyHood).reduce(
        (prev, curr) => {
            return prev[1] > curr[1] ? prev : curr;
        }
    );

    return { ...obj, tags: highestLikelyHood };
}

function similarity(s1: string, s2: string) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }
    return (
        (longerLength - editDistance(longer, shorter)) /
        parseFloat(longerLength as never as string)
    );
}

function editDistance(s1: string, s2: string) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue =
                            Math.min(Math.min(newValue, lastValue), costs[j]) +
                            1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function reduceObject<T>(objects: T[]): T {
    return objects.reduce((o, i) => {
        const [key, value] = Object.entries(i)[0];
        return Object.assign(o, { [key]: value });
    }, {}) as T;
}

function getBibtex(obj: Result) {
    if (!shouldBeIncluded(obj)) {
        return null;
    }

    const type = obj.url.includes("ieee.org")
        ? "inproceedings"
        : obj.url.includes("patent/US")
        ? "patent"
        : "article";

    // Comment this out bc this is only for some minor fuckups
    const year = (obj?.publicationDate as string)?.split("/")[0];
    const description = obj?.description
        ?.replaceAll(/[^ -~]+/g, "")
        .replaceAll("%", " percent");
    const authors = (
        (obj?.authors as string[]) || (obj?.inventors as string)?.split(",")
    )
        ?.map((s) => s.trim())
        ?.join(" and ");

    const newObj: any = {
        ...obj,
        pub_year: year,
        year,
        date: null,
        publicationDate: null,
        author: authors,
        authors,
        school: "Florida International University",
        number: obj?.issue,
        pages: (obj?.pages as string)?.replaceAll("-", "--"),
        description: null,
        abstract: description,
    };

    return `@${type}{kem${nanoid(6)}
      ${Object.entries(newObj)
          .filter(
              ([key, value]) =>
                  key &&
                  value &&
                  !["scholarArticles", "totalCitations"].includes(key)
          )
          .map(([key, value]) => {
              if (!key || !value) {
                  return "";
              }

              return `${key} = \{${value}\}`;
          })
          .join(",\n")}
    }`;
}

function shouldBeIncluded(obj: Result) {
    const index = /index/i;
    return (
        !(
            (obj?.description?.match(index) ?? false) ||
            obj?.title?.match(index)
        ) &&
        (obj?.publicationDate ?? false)
    );
}

type Callback<T, R> = (_: T) => Promise<R>;

async function withBrowser<R>(fn: Callback<Browser, R>) {
    console.log(chalk.green("Starting browser... This may take a while"));

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
async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
