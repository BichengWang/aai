import { createWorkerApp } from "./app/createWorkerApp.js";
import { createHealthServer } from "./lib/createHealthServer.js";
import { readPositiveIntEnv } from "./lib/env.js";
import { logWorkerEvent } from "./lib/logger.js";

const KNOWN_MODES = new Set(["scheduled", "run-once", ""]);

async function main() {
  const workerApp = createWorkerApp();
  const mode = process.env["WORKER_MODE"] ?? "";

  if (!KNOWN_MODES.has(mode)) {
    logWorkerEvent("boot.config.warning", {
      message: `Unrecognised WORKER_MODE="${mode}". Valid values: "scheduled" or unset (run-once). Defaulting to run-once.`,
    }, "warn");
  }

  if (mode === "scheduled") {
    const healthServer = await createHealthServer();
    const scheduler = await workerApp.runScheduled();

    // Stop scheduling, let in-flight jobs finish (bounded so the orchestrator's
    // kill deadline is not reached first), then exit. A second signal falls
    // through to Node's default handler and exits immediately.
    const shutdown = async (signal: NodeJS.Signals) => {
      logWorkerEvent("scheduler.shutdown", { signal });
      healthServer.close();
      const drained = await scheduler.stop({
        timeoutMs: readPositiveIntEnv("WORKER_SHUTDOWN_TIMEOUT_MS", 8_000),
      });
      process.exit(drained ? 0 : 1);
    };
    process.once("SIGTERM", (signal) => void shutdown(signal));
    process.once("SIGINT", (signal) => void shutdown(signal));
  } else {
    await workerApp.run();
  }
}

void main().catch((error: unknown) => {
  logWorkerEvent("boot.fatal", {
    error: error instanceof Error ? error.message : String(error),
  }, "error");
  process.exitCode = 1;
});
