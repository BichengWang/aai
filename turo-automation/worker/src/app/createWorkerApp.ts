import {
  appName,
  createBuildDailyDigestUseCase,
  createDetectLateReturnsUseCase,
  createGenerateLifecycleTasksUseCase,
  createGenerateMessageDraftsUseCase,
  createGetTodayOpsSnapshotUseCase,
  createImportTripsUseCase,
  type JobName,
  type JobRun,
  type JobRunRepository,
} from "@turo-automation/shared";
import { createFixtureAdapters } from "../adapters/createFixtureAdapters.js";
import { createSupabaseAdapters } from "../adapters/createSupabaseAdapters.js";
import { runDailyDigestJob } from "../jobs/runDailyDigestJob.js";
import { runGenerateMessageDraftsJob } from "../jobs/runGenerateMessageDraftsJob.js";
import { runImportTripsJob } from "../jobs/runImportTripsJob.js";
import { runLateReturnScanJob } from "../jobs/runLateReturnScanJob.js";
import { runLifecycleTasksJob } from "../jobs/runLifecycleTasksJob.js";
import { runTodayOpsSnapshotJob } from "../jobs/runTodayOpsSnapshotJob.js";
import { logUseCaseResult, logWorkerEvent } from "../lib/logger.js";
import { getWorkerNowIso, getWorkerToday } from "../lib/time.js";
import { createJobScheduler } from "../scheduler/createJobScheduler.js";

function buildJobRun(params: {
  jobName: JobName;
  startedAt: string;
  summary: string;
  issueCount: number;
  ok: boolean;
}): JobRun {
  return {
    id: `${params.jobName}-${params.startedAt}`,
    jobName: params.jobName,
    status: params.ok ? "completed" : "failed",
    startedAt: params.startedAt,
    finishedAt: params.startedAt,
    summary: params.summary,
    issueCount: params.issueCount,
  };
}

async function persistJobRun(
  jobRunRepository: JobRunRepository,
  jobRun: JobRun
) {
  await jobRunRepository.saveJobRun(jobRun);
}

const useSupabase = Boolean(
  process.env["SUPABASE_URL"] && process.env["SUPABASE_KEY"]
);

export function createWorkerApp() {
  const generatedAt = getWorkerNowIso();
  const today = getWorkerToday();

  return {
    async run() {
      const mode = useSupabase ? "supabase" : "fixture";
      logWorkerEvent("boot", { appName, mode });

      const adapters = useSupabase
        ? await createSupabaseAdapters()
        : createFixtureAdapters();

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
        // Optional: upsert guests/vehicles before trips to satisfy FK constraints
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

      const snapshotResult = await runTodayOpsSnapshotJob({
        useCase: getTodayOpsSnapshot,
        today,
        generatedAt,
      });
      logUseCaseResult("today_ops_snapshot", snapshotResult);
      await persistJobRun(
        adapters.jobRunRepository,
        buildJobRun({
          jobName: "today_ops_snapshot",
          startedAt: generatedAt,
          summary: `Snapshot contains ${snapshotResult.data.summary.pickupCount} pickups.`,
          issueCount: snapshotResult.issues.length,
          ok: snapshotResult.ok,
        })
      );

      const importResult = await runImportTripsJob({
        useCase: importTrips,
        triggeredBy: "worker.bootstrap",
        importedAt: generatedAt,
      });
      logUseCaseResult("trip_import", importResult);
      await persistJobRun(
        adapters.jobRunRepository,
        buildJobRun({
          jobName: "trip_import",
          startedAt: generatedAt,
          summary: `Imported ${importResult.data.importedTrips.length} trips.`,
          issueCount: importResult.issues.length,
          ok: importResult.ok,
        })
      );

      const lifecycleResult = await runLifecycleTasksJob({
        useCase: generateLifecycleTasks,
        asOf: generatedAt,
        createdBy: "worker.bootstrap",
      });
      logUseCaseResult("lifecycle_tasks", lifecycleResult);
      await persistJobRun(
        adapters.jobRunRepository,
        buildJobRun({
          jobName: "lifecycle_tasks",
          startedAt: generatedAt,
          summary: `Created ${lifecycleResult.data.createdTasks.length} lifecycle tasks.`,
          issueCount: lifecycleResult.issues.length,
          ok: lifecycleResult.ok,
        })
      );

      const lateReturnResult = await runLateReturnScanJob({
        useCase: detectLateReturns,
        asOf: generatedAt,
        openedBy: "worker.bootstrap",
      });
      logUseCaseResult("late_return_scan", lateReturnResult);
      await persistJobRun(
        adapters.jobRunRepository,
        buildJobRun({
          jobName: "late_return_scan",
          startedAt: generatedAt,
          summary: `Created ${lateReturnResult.data.incidentsCreated.length} late return incidents.`,
          issueCount: lateReturnResult.issues.length,
          ok: lateReturnResult.ok,
        })
      );

      const generateDraftsResult = await runGenerateMessageDraftsJob({
        useCase: generateMessageDrafts,
        asOf: generatedAt,
        requestedBy: "worker.bootstrap",
      });
      logUseCaseResult("generate_drafts", generateDraftsResult);
      await persistJobRun(
        adapters.jobRunRepository,
        buildJobRun({
          jobName: "generate_drafts",
          startedAt: generatedAt,
          summary: `Generated ${generateDraftsResult.data.createdDrafts.length} message drafts.`,
          issueCount: generateDraftsResult.issues.length,
          ok: generateDraftsResult.ok,
        })
      );

      const dailyDigestResult = await runDailyDigestJob({
        useCase: buildDailyDigest,
        today,
        generatedAt,
        channel: "slack://host-ops",
      });
      logUseCaseResult("daily_digest", dailyDigestResult);
      await persistJobRun(
        adapters.jobRunRepository,
        buildJobRun({
          jobName: "daily_digest",
          startedAt: generatedAt,
          summary: "Daily digest dispatched.",
          issueCount: dailyDigestResult.issues.length,
          ok: dailyDigestResult.ok,
        })
      );
    },

    /**
     * Start the worker in scheduled mode.
     * Jobs run immediately on start, then repeat at their configured intervals.
     * The scheduler keeps the process alive until SIGTERM or SIGINT.
     *
     * Default intervals (overridable via env vars):
     *   INTERVAL_IMPORT_MS              default  5 min
     *   INTERVAL_LIFECYCLE_MS           default 15 min
     *   INTERVAL_LATE_RETURN_MS         default 15 min
     *   INTERVAL_GENERATE_DRAFTS_MS     default 30 min
     *   INTERVAL_DAILY_DIGEST_MS        default  1 hour
     */
    async runScheduled() {
      const mode = useSupabase ? "supabase" : "fixture";
      logWorkerEvent("boot.scheduled", { appName, mode });

      const adapters = useSupabase
        ? await createSupabaseAdapters()
        : createFixtureAdapters();

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

      const env = process.env;
      const intervalImport = Number(env["INTERVAL_IMPORT_MS"] ?? 5 * 60_000);
      const intervalLifecycle = Number(env["INTERVAL_LIFECYCLE_MS"] ?? 15 * 60_000);
      const intervalLateReturn = Number(env["INTERVAL_LATE_RETURN_MS"] ?? 15 * 60_000);
      const intervalGenerateDrafts = Number(env["INTERVAL_GENERATE_DRAFTS_MS"] ?? 30 * 60_000);
      const intervalDailyDigest = Number(env["INTERVAL_DAILY_DIGEST_MS"] ?? 60 * 60_000);

      const scheduler = createJobScheduler([
        {
          name: "trip_import",
          intervalMs: intervalImport,
          async run() {
            const now = getWorkerNowIso();
            const result = await runImportTripsJob({
              useCase: importTrips,
              triggeredBy: "scheduler",
              importedAt: now,
            });
            logUseCaseResult("trip_import", result);
            await persistJobRun(
              adapters.jobRunRepository,
              buildJobRun({
                jobName: "trip_import",
                startedAt: now,
                summary: `Imported ${result.data.importedTrips.length} trips.`,
                issueCount: result.issues.length,
                ok: result.ok,
              })
            );
          },
        },
        {
          name: "lifecycle_tasks",
          intervalMs: intervalLifecycle,
          async run() {
            const now = getWorkerNowIso();
            const result = await runLifecycleTasksJob({
              useCase: generateLifecycleTasks,
              asOf: now,
              createdBy: "scheduler",
            });
            logUseCaseResult("lifecycle_tasks", result);
            await persistJobRun(
              adapters.jobRunRepository,
              buildJobRun({
                jobName: "lifecycle_tasks",
                startedAt: now,
                summary: `Created ${result.data.createdTasks.length} lifecycle tasks.`,
                issueCount: result.issues.length,
                ok: result.ok,
              })
            );
          },
        },
        {
          name: "late_return_scan",
          intervalMs: intervalLateReturn,
          async run() {
            const now = getWorkerNowIso();
            const result = await runLateReturnScanJob({
              useCase: detectLateReturns,
              asOf: now,
              openedBy: "scheduler",
            });
            logUseCaseResult("late_return_scan", result);
            await persistJobRun(
              adapters.jobRunRepository,
              buildJobRun({
                jobName: "late_return_scan",
                startedAt: now,
                summary: `Created ${result.data.incidentsCreated.length} late return incidents.`,
                issueCount: result.issues.length,
                ok: result.ok,
              })
            );
          },
        },
        {
          name: "generate_drafts",
          intervalMs: intervalGenerateDrafts,
          async run() {
            const now = getWorkerNowIso();
            const result = await runGenerateMessageDraftsJob({
              useCase: generateMessageDrafts,
              asOf: now,
              requestedBy: "scheduler",
            });
            logUseCaseResult("generate_drafts", result);
            await persistJobRun(
              adapters.jobRunRepository,
              buildJobRun({
                jobName: "generate_drafts",
                startedAt: now,
                summary: `Generated ${result.data.createdDrafts.length} message drafts.`,
                issueCount: result.issues.length,
                ok: result.ok,
              })
            );
          },
        },
        {
          name: "daily_digest",
          intervalMs: intervalDailyDigest,
          async run() {
            const now = getWorkerNowIso();
            const today = getWorkerToday();
            const result = await runDailyDigestJob({
              useCase: buildDailyDigest,
              today,
              generatedAt: now,
              channel: "slack://host-ops",
            });
            logUseCaseResult("daily_digest", result);
            await persistJobRun(
              adapters.jobRunRepository,
              buildJobRun({
                jobName: "daily_digest",
                startedAt: now,
                summary: "Daily digest dispatched.",
                issueCount: result.issues.length,
                ok: result.ok,
              })
            );
          },
        },
      ]);

      scheduler.start();

      // Graceful shutdown
      const shutdown = () => {
        logWorkerEvent("scheduler.shutdown", { signal: "received" });
        scheduler.stop();
        process.exit(0);
      };
      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);

      logWorkerEvent("scheduler.running", { message: "Worker is scheduled and running." });
    },
  };
}
