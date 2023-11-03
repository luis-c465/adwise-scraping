import { join } from "path";
import type { Configuration } from "puppeteer";

export default {
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
} as Configuration;
