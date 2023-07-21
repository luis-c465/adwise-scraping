/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { spawnSync } from "child_process";
import { database, storage } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import getData from "scraping";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp();

// in the function's body
export const scraping = onSchedule("*/5 * * * *", async () => {
  spawnSync("pnpm", ["exec", "playwright", "install", "firefox"]);

  const { bibtex, num } = await getData();

  const db = database();
  const ref = await db.ref("tmp").child("tmp").child("entries").get();
  const oldNum = ref.val();

  if (oldNum === num) {
    logger.info("No new entries found, exiting ...");
    return;
  }

  const stor = storage();
  stor.bucket().file("results.bib").save(bibtex);
});
