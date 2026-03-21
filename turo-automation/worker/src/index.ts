import { createWorkerApp } from "./app/createWorkerApp.js";

async function main() {
  const workerApp = createWorkerApp();
  const mode = process.env["WORKER_MODE"];

  if (mode === "scheduled") {
    await workerApp.runScheduled();
  } else {
    await workerApp.run();
  }
}

void main().catch((error: unknown) => {
  console.error("[worker] fatal", error);
  process.exitCode = 1;
});
