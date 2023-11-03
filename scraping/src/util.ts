import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";

export function reduceObject<T>(objects: T[]): T {
  return objects.reduce((o, i) => {
    const [key, value] = Object.entries(i)[0];
    return Object.assign(o, { [key]: value });
  }, {}) as T;
}

export function normalizeString(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, "");
}

type Callback<T, R> = (_: T) => Promise<R>;

export async function withBrowser<R>(fn: Callback<Browser, R>) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--single-process",
      "--proxy-server='direct://'",
      "--proxy-bypass-list=*",
      "--deterministic-fetch",
    ],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

export async function withPage<R>(browser: Browser, fn: Callback<Page, R>) {
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

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
