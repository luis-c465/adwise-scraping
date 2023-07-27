/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { database, storage } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import "firebase-functions/logger/compat";
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import getData from "scraping";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp();

// in the function's body
export const scraping = onSchedule(
  { schedule: "*/5 * * * *", cpu: 2, memory: "4GiB" },
  async () => {
    const { bibtex, num } = await getData();

    const db = database();
    const ref = db.ref("tmp").child("tmp").child("entries");
    const oldNum: number = (await ref.get()).val();

    if (oldNum === num) {
      console.info("No new entries found, exiting ...");
      return;
    }

    ref.set(num);

    const stor = storage();
    stor.bucket().file("results.bib").save(bibtex);
  }
);

export const testScraping = onRequest(
  {
    cpu: 2,
    memory: "4GiB",
    maxInstances: 1,
  },
  async () => {
    const { bibtex, num } = await getData();

    const db = database();
    const ref = db.ref("tmp").child("tmp").child("entries");
    const oldNum: number = (await ref.get()).val();

    if (oldNum === num) {
      console.info("No new entries found, exiting ...");
      return;
    }

    ref.set(num);

    const stor = storage();
    stor.bucket().file("results.bib").save(bibtex);
  }
);
