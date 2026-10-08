import {
  appName,
  createBuildDailyDigestUseCase,
  createDetectLateReturnsUseCase,
  createGenerateLifecycleTasksUseCase,
  createGenerateMessageDraftsUseCase,
  createGetTodayOpsSnapshotUseCase,
  createImportTripsUseCase,
  createSendApprovedMessageDraftsUseCase,
  type BuildDailyDigestData,
  type JobName,
  type JobRun,
  type JobRunRepository,
  type UseCaseResult,
} from "@turo-automation/shared";
import { createFixtureAdapters } from "../adapters/createFixtureAdapters.js";
import { createSupabaseAdapters } from "../adapters/createSupabaseAdapters.js";
import { runDailyDigestJob } from "../jobs/runDailyDigestJob.js";
import { runGenerateMessageDraftsJob } from "../jobs/runGenerateMessageDraftsJob.js";
import { runImportTripsJob } from "../jobs/runImportTripsJob.js";
import { runLateReturnScanJob } from "../jobs/runLateReturnScanJob.js";
import { runLifecycleTasksJob } from "../jobs/runLifecycleTasksJob.js";
import { runSendApprovedMessageDraftsJob } from "../jobs/runSendApprovedMessageDraftsJob.js";
import { runTodayOpsSnapshotJob } from "../jobs/runTodayOpsSnapshotJob.js";
import { readPositiveIntEnv } from "../lib/env.js";
import { logUseCaseResult, logWorkerEvent } from "../lib/logger.js";
import { getWorkerNowIso, getWorkerToday } from "../lib/time.js";
import { createJobScheduler } from "../scheduler/createJobScheduler.js";

function buildJobRun(params: {
  jobName: JobName;
  startedAt: string;
  finishedAt: string;
  summary: string;
  issueCount: number;
  ok: boolean;
}): JobRun {
  return {
    id: `${params.jobName}-${params.startedAt}`,
    jobName: params.jobName,
    status: params.ok ? "completed" : "failed",
    startedAt: params.startedAt,
    finishedAt: params.finishedAt,
    summary: params.summary,
    issueCount: params.issueCount,
  };
}

function readTruthyEnvFlag(value: string | undefined): boolean {
  return Boolean(value && ["1", "true", "yes", "on"].includes(value.toLowerCase()));
}

type AnyAdapters =
  | Awaited<ReturnType<typeof createSupabaseAdapters>>
  | ReturnType<typeof createFixtureAdapters>;

function buildUseCases(adapters: AnyAdapters) {
  const getTodayOpsSnapshot = createGetTodayOpsSnapshotUseCase({
    tripRepository: adapters.tripRepository,
    taskRepository: adapters.taskRepository,
    incidentRepository: adapters.incidentRepository,
    messageRepository: adapters.messageRepository,
    jobRunRepository: adapters.jobRunRepository,
    guests: adapters.guests,
    vehicles: adapters.vehicles,
  });
  const importTrips = createImportTripsUseCase({
    tripImportSource: adapters.tripImportSource,
    tripRepository: adapters.tripRepository,
    ...("guestRepository" in adapters && { guestRepository: adapters.guestRepository }),
    ...("vehicleRepository" in adapters && { vehicleRepository: adapters.vehicleRepository }),
  });
  const generateLifecycleTasks = createGenerateLifecycleTasksUseCase({
    tripRepository: adapters.tripRepository,
    taskRepository: adapters.taskRepository,
    vehicles: adapters.vehicles,
  });
  const detectLateReturns = createDetectLateReturnsUseCase({
    tripRepository: adapters.tripRepository,
    incidentRepository: adapters.incidentRepository,
    notifier: adapters.notifier,
    vehicles: adapters.vehicles,
  });
  const buildDailyDigest = createBuildDailyDigestUseCase({
    getTodayOpsSnapshot,
    notifier: adapters.notifier,
  });
  const generateMessageDrafts = createGenerateMessageDraftsUseCase({
    tripRepository: adapters.tripRepository,
    messageRepository: adapters.messageRepository,
    notifier: adapters.notifier,
    guests: adapters.guests,
    vehicles: adapters.vehicles,
  });
  const sendApprovedMessageDrafts = createSendApprovedMessageDraftsUseCase({
    messageRepository: adapters.messageRepository,
  });
  return {
    getTodayOpsSnapshot,
    importTrips,
    generateLifecycleTasks,
    detectLateReturns,
    buildDailyDigest,
    generateMessageDrafts,
    sendApprovedMessageDrafts,
  };
}

interface JobContext {
  /** Who triggered the run, recorded on created records ("worker.bootstrap" or "scheduler"). */
  actor: string;
}

interface WorkerJob<T = unknown> {
  name: JobName;
  run(context: JobContext): Promise<UseCaseResult<T>>;
}

/**
 * Wrap a use-case call as a worker job: run it, log the result, and record a
 * `job_runs` row with real start/finish timestamps.
 */
function defineJob<T>(
  name: JobName,
  jobRunRepository: JobRunRepository,
  execute: (params: { now: string; today: string; actor: string }) => Promise<UseCaseResult<T>>,
  summarize: (data: T) => string
): WorkerJob<T> {
  return {
    name,
    async run({ actor }) {
      const startedAt = getWorkerNowIso();
      const result = await execute({ now: startedAt, today: getWorkerToday(), actor });
      logUseCaseResult(name, result);
      await jobRunRepository.saveJobRun(
        buildJobRun({
          jobName: name,
          startedAt,
          finishedAt: getWorkerNowIso(),
          summary: summarize(result.data),
          issueCount: result.issues.length,
          ok: result.ok,
        })
      );
      return result;
    },
  };
}

/**
 * Scheduled mode ticks the digest hourly so it goes out soon after start-up or
 * the day rolling over, but posts it only once per day. A day counts as sent
 * once Slack accepts the digest, so a failed or unconfigured post is retried
 * on the next tick. Recent `job_runs` seed the guard so a restart does not
 * repost.
 */
async function createDailyDigestGuard(jobRunRepository: JobRunRepository) {
  const today = getWorkerToday();
  let lastSentDay: string | undefined;
  try {
    const recentRuns = await jobRunRepository.listJobRuns();
    const sentToday = recentRuns.some(
      (run) =>
        run.jobName === "daily_digest" &&
        run.status === "completed" &&
        run.startedAt.startsWith(today)
    );
    if (sentToday) lastSentDay = today;
  } catch (error) {
    logWorkerEvent("boot.config.warning", {
      message: `Could not read job_runs to seed the daily digest guard: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }, "warn");
  }

  return (job: WorkerJob<BuildDailyDigestData>, context: JobContext) => async () => {
    const day = getWorkerToday();
    if (lastSentDay === day) {
      logWorkerEvent("scheduler.job_skip", { name: job.name, reason: "already_sent_today", day });
      return;
    }
    const result = await job.run(context);
    if (result.ok && result.data.notificationAccepted) lastSentDay = day;
  };
}

function buildJobs(adapters: AnyAdapters) {
  const useCases = buildUseCases(adapters);
  const repo = adapters.jobRunRepository;

  return {
    todayOpsSnapshot: defineJob(
      "today_ops_snapshot",
      repo,
      ({ now, today }) =>
        runTodayOpsSnapshotJob({ useCase: useCases.getTodayOpsSnapshot, today, generatedAt: now }),
      (data) => `Snapshot contains ${data.summary.pickupCount} pickups.`
    ),
    tripImport: defineJob(
      "trip_import",
      repo,
      ({ now, actor }) =>
        runImportTripsJob({ useCase: useCases.importTrips, triggeredBy: actor, importedAt: now }),
      (data) => `Imported ${data.importedTrips.length} trips.`
    ),
    lifecycleTasks: defineJob(
      "lifecycle_tasks",
      repo,
      ({ now, actor }) =>
        runLifecycleTasksJob({ useCase: useCases.generateLifecycleTasks, asOf: now, createdBy: actor }),
      (data) => `Created ${data.createdTasks.length} lifecycle tasks.`
    ),
    lateReturnScan: defineJob(
      "late_return_scan",
      repo,
      ({ now, actor }) =>
        runLateReturnScanJob({ useCase: useCases.detectLateReturns, asOf: now, openedBy: actor }),
      (data) => `Created ${data.incidentsCreated.length} late return incidents.`
    ),
    generateDrafts: defineJob(
      "generate_drafts",
      repo,
      ({ now, actor }) =>
        runGenerateMessageDraftsJob({
          useCase: useCases.generateMessageDrafts,
          asOf: now,
          requestedBy: actor,
        }),
      (data) => `Generated ${data.createdDrafts.length} message drafts.`
    ),
    sendApprovedDrafts: defineJob(
      "send_approved_message_drafts",
      repo,
      ({ now, actor }) =>
        runSendApprovedMessageDraftsJob({
          useCase: useCases.sendApprovedMessageDrafts,
          sentAt: now,
          triggeredBy: actor,
        }),
      (data) => `Sent ${data.sentDrafts.length} approved message drafts.`
    ),
    dailyDigest: defineJob(
      "daily_digest",
      repo,
      ({ now, today }) =>
        runDailyDigestJob({
          useCase: useCases.buildDailyDigest,
          today,
          generatedAt: now,
          channel: "slack://host-ops",
        }),
      () => "Daily digest dispatched."
    ),
  };
}

const hasSupabaseUrl = Boolean(process.env["SUPABASE_URL"]);
const hasSupabaseKey = Boolean(process.env["SUPABASE_KEY"]);
const useSupabase = hasSupabaseUrl && hasSupabaseKey;

// Warn when partial Supabase config is detected so operators can catch
// misconfiguration early rather than debugging a silent fixture fallback.
if (hasSupabaseUrl !== hasSupabaseKey) {
  const missing = hasSupabaseUrl ? "SUPABASE_KEY" : "SUPABASE_URL";
  logWorkerEvent("boot.config.warning", {
    message: `${missing} is not set — falling back to fixture adapters. Set both SUPABASE_URL and SUPABASE_KEY to enable Supabase persistence.`,
  }, "warn");
}

export function createWorkerApp() {
  return {
    async run() {
      const mode = useSupabase ? "supabase" : "fixture";
      logWorkerEvent("boot", { appName, mode });

      const adapters = useSupabase
        ? await createSupabaseAdapters()
        : createFixtureAdapters();
      const jobs = buildJobs(adapters);
      const context = { actor: "worker.bootstrap" };

      await jobs.todayOpsSnapshot.run(context);
      await jobs.tripImport.run(context);
      await jobs.lifecycleTasks.run(context);
      await jobs.lateReturnScan.run(context);
      await jobs.generateDrafts.run(context);
      if (readTruthyEnvFlag(process.env["WORKER_SEND_APPROVED_DRAFTS"])) {
        await jobs.sendApprovedDrafts.run(context);
      }
      await jobs.dailyDigest.run(context);
    },

    /**
     * Start the worker in scheduled mode.
     * Jobs run immediately on start, then repeat at their configured intervals.
     * Returns the scheduler so the caller can stop it on shutdown.
     *
     * Default intervals (overridable via env vars):
     *   INTERVAL_IMPORT_MS              default  5 min
     *   INTERVAL_LIFECYCLE_MS           default 15 min
     *   INTERVAL_LATE_RETURN_MS         default 15 min
     *   INTERVAL_GENERATE_DRAFTS_MS     default 30 min
     *   INTERVAL_DAILY_DIGEST_MS        default  1 hour
     *   INTERVAL_SEND_APPROVED_MS       default  5 min (only when WORKER_SEND_APPROVED_DRAFTS is on)
     */
    async runScheduled() {
      const mode = useSupabase ? "supabase" : "fixture";
      logWorkerEvent("boot.scheduled", { appName, mode });

      const adapters = useSupabase
        ? await createSupabaseAdapters()
        : createFixtureAdapters();
      const jobs = buildJobs(adapters);
      const context = { actor: "scheduler" };

      const onceDaily = await createDailyDigestGuard(adapters.jobRunRepository);

      const schedule = (
        job: WorkerJob,
        envVar: string,
        defaultMs: number,
        run: () => Promise<unknown> = () => job.run(context)
      ) => ({
        name: job.name,
        intervalMs: readPositiveIntEnv(envVar, defaultMs),
        run: async () => {
          await run();
        },
      });

      const scheduler = createJobScheduler([
        schedule(jobs.tripImport, "INTERVAL_IMPORT_MS", 5 * 60_000),
        schedule(jobs.lifecycleTasks, "INTERVAL_LIFECYCLE_MS", 15 * 60_000),
        schedule(jobs.lateReturnScan, "INTERVAL_LATE_RETURN_MS", 15 * 60_000),
        schedule(jobs.generateDrafts, "INTERVAL_GENERATE_DRAFTS_MS", 30 * 60_000),
        ...(readTruthyEnvFlag(process.env["WORKER_SEND_APPROVED_DRAFTS"])
          ? [schedule(jobs.sendApprovedDrafts, "INTERVAL_SEND_APPROVED_MS", 5 * 60_000)]
          : []),
        schedule(
          jobs.dailyDigest,
          "INTERVAL_DAILY_DIGEST_MS",
          60 * 60_000,
          onceDaily(jobs.dailyDigest, context)
        ),
      ]);

      scheduler.start();
      logWorkerEvent("scheduler.running", { message: "Worker is scheduled and running." });
      return scheduler;
    },
  };
}
