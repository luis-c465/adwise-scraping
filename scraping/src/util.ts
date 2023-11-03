import * as cheerio from "cheerio";
import type { Browser, Page } from "puppeteer";
import puppeteer from "puppeteer";
import { Worker, isMainThread, parentPort } from "worker_threads";

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

export async function loadPage(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  return cheerio.load(html);
}

interface Options {
  numThreads: number;
}

export function runInParallel<T, R>(
  values: T[],
  task: (value: T) => R,
  options: Options
): Promise<R[]> {
  if (isMainThread) {
    return new Promise<R[]>((resolve, reject) => {
      const { numThreads } = options;
      const chunks = chunkArray(values, numThreads);

      let finishedWorkers = 0;
      let results: R[] = [];

      const onWorkerMessage = (_workerIndex: number, workerResults: R[]) => {
        results = results.concat(workerResults);
        finishedWorkers++;

        if (finishedWorkers === numThreads) {
          resolve(results);
        }
      };

      const onWorkerError = (error: any) => {
        reject(error);
      };

      for (let i = 0; i < numThreads; i++) {
        const worker = new Worker(__filename);
        const chunk = chunks[i];

        worker.on("message", (workerResults: R[]) => {
          onWorkerMessage(i, workerResults);
        });

        worker.on("error", onWorkerError);

        worker.postMessage({ task, data: chunk });
      }
    });
  } else {
    // Worker thread logic
    parentPort?.on(
      "message",
      async ({ task, data }: { task: (value: T) => R; data: T[] }) => {
        const workerResults = await Promise.all(data.map(task));
        parentPort?.postMessage(workerResults);
      }
    );

    return Promise.resolve([]);
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
