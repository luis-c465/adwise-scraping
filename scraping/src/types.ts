import { type Browser, type BrowserContext } from "playwright";

export type PageArgs = {
  browser: Browser;
  context: BrowserContext;
};
