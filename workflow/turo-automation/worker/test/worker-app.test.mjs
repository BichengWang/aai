import test from "node:test";
import assert from "node:assert/strict";
import { createWorkerApp } from "../dist/app/createWorkerApp.js";

test("worker app runs fixture-backed jobs without adapter-specific wiring", async () => {
  const workerApp = createWorkerApp();

  await assert.doesNotReject(async () => {
    await workerApp.run();
  });
});
