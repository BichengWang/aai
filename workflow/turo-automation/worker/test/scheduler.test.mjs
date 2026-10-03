import test from "node:test";
import assert from "node:assert/strict";
import { createJobScheduler } from "../dist/scheduler/createJobScheduler.js";
import { withRetry } from "../dist/scheduler/withRetry.js";

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test("slow jobs skip ticks while other jobs continue and resume after completion", { timeout: 3_000 }, async (t) => {
  const releaseSlowJob = deferred();
  const otherJobRepeated = deferred();
  const slowJobRepeated = deferred();
  let slowRuns = 0;
  let otherRuns = 0;
  let activeSlowRuns = 0;
  let maxActiveSlowRuns = 0;

  const scheduler = createJobScheduler([
    {
      name: "slow-job",
      intervalMs: 10,
      async run() {
        slowRuns++;
        activeSlowRuns++;
        maxActiveSlowRuns = Math.max(maxActiveSlowRuns, activeSlowRuns);
        try {
          if (slowRuns === 1) await releaseSlowJob.promise;
          else slowJobRepeated.resolve();
        } finally {
          activeSlowRuns--;
        }
      },
    },
    {
      name: "other-job",
      intervalMs: 10,
      async run() {
        if (++otherRuns === 4) otherJobRepeated.resolve();
      },
    },
  ]);
  t.after(() => {
    releaseSlowJob.resolve();
    scheduler.stop();
  });

  scheduler.start();
  await otherJobRepeated.promise;
  assert.equal(slowRuns, 1, "interval ticks must not overlap an unfinished run");
  releaseSlowJob.resolve();
  await slowJobRepeated.promise;
  assert.equal(maxActiveSlowRuns, 1);
});

test("jobs remain busy during retry backoff and resume after exhausted retries", { timeout: 3_000 }, async (t) => {
  const releaseRetry = deferred();
  const retryStarted = deferred();
  const otherJobRepeated = deferred();
  const nextRunStarted = deferred();
  let attempts = 0;
  let otherRuns = 0;

  const scheduler = createJobScheduler([
    {
      name: "retry-job",
      intervalMs: 10,
      maxAttempts: 2,
      retryDelayMs: 500,
      async run() {
        const attempt = ++attempts;
        if (attempt === 1) throw new Error("first attempt failed");
        if (attempt === 2) {
          retryStarted.resolve();
          await releaseRetry.promise;
          throw new Error("retry failed");
        }
        nextRunStarted.resolve();
      },
    },
    {
      name: "other-job",
      intervalMs: 10,
      async run() {
        if (++otherRuns === 4) otherJobRepeated.resolve();
      },
    },
  ]);
  t.after(() => {
    releaseRetry.resolve();
    scheduler.stop();
  });

  scheduler.start();
  await otherJobRepeated.promise;
  assert.equal(attempts, 1, "ticks must not start runs during retry backoff");
  await retryStarted.promise;
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(attempts, 2, "ticks must not overlap the active retry");
  releaseRetry.resolve();
  await nextRunStarted.promise;
  assert.equal(attempts, 3, "the next tick must run after retries are exhausted");
});

test("JobScheduler runs each job immediately on start", async () => {
  const ran = [];

  const scheduler = createJobScheduler([
    {
      name: "job-a",
      intervalMs: 60_000,
      async run() {
        ran.push("a");
      },
    },
    {
      name: "job-b",
      intervalMs: 60_000,
      async run() {
        ran.push("b");
      },
    },
  ]);

  scheduler.start();

  // Allow microtasks to flush
  await new Promise((resolve) => setImmediate(resolve));

  scheduler.stop();

  assert.deepEqual(ran.sort(), ["a", "b"]);
});

test("JobScheduler isolates job failures — other jobs still run", async () => {
  const ran = [];

  const scheduler = createJobScheduler([
    {
      name: "job-fail",
      intervalMs: 60_000,
      async run() {
        throw new Error("intentional failure");
      },
    },
    {
      name: "job-ok",
      intervalMs: 60_000,
      async run() {
        ran.push("ok");
      },
    },
  ]);

  scheduler.start();

  await new Promise((resolve) => setImmediate(resolve));

  scheduler.stop();

  assert.deepEqual(ran, ["ok"]);
});

test("JobScheduler stop clears intervals", () => {
  const scheduler = createJobScheduler([
    {
      name: "job-repeat",
      intervalMs: 10,
      async run() {},
    },
  ]);

  scheduler.start();
  scheduler.stop();

  // If stop() didn't clear the interval, the test would hang
  assert.ok(true, "stop() returned without hanging");
});

test("withRetry succeeds on first attempt", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    return 42;
  }, "test-job", { maxAttempts: 3, delayMs: 0 });
  assert.equal(result, 42);
  assert.equal(calls, 1);
});

test("withRetry retries on failure and eventually succeeds", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    if (calls < 3) throw new Error("transient failure");
    return "ok";
  }, "test-job", { maxAttempts: 3, delayMs: 0 });
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("withRetry throws after maxAttempts exhausted", async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      withRetry(async () => {
        calls++;
        throw new Error("permanent failure");
      }, "test-job", { maxAttempts: 2, delayMs: 0 }),
    /permanent failure/,
  );
  assert.equal(calls, 2);
});

test("JobScheduler retries a failing job before giving up", async () => {
  let attempts = 0;
  const scheduler = createJobScheduler([
    {
      name: "flaky-job",
      intervalMs: 60_000,
      maxAttempts: 3,
      retryDelayMs: 0,
      async run() {
        attempts++;
        if (attempts < 3) throw new Error("transient");
      },
    },
  ]);

  scheduler.start();
  // Allow micro and macro tasks to flush across 3 attempts
  await new Promise((resolve) => setTimeout(resolve, 50));
  scheduler.stop();

  assert.equal(attempts, 3, "should have attempted 3 times");
});
