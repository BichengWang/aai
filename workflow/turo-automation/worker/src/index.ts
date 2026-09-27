import { createWorkerApp } from "./app/createWorkerApp.js";
import { createHealthServer } from "./lib/createHealthServer.js";
import { logWorkerEvent } from "./lib/logger.js";

const KNOWN_MODES = new Set(["scheduled", "run-once", ""]);

async function main() {
  const workerApp = createWorkerApp();
  const mode = process.env["WORKER_MODE"] ?? "";

  if (!KNOWN_MODES.has(mode)) {
    logWorkerEvent("boot.config.warning", {
      message: `Unrecognised WORKER_MODE="${mode}". Valid values: "scheduled" or unset (run-once). Defaulting to run-once.`,
    });
  }

  if (mode === "scheduled") {
    createHealthServer();
    await workerApp.runScheduled();
  } else {
    await workerApp.run();
  }
}

void main().catch((error: unknown) => {
  logWorkerEvent("boot.fatal", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exitCode = 1;
});
