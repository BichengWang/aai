import {
  appName,
  createBuildDailyDigestUseCase,
  createDetectLateReturnsUseCase,
  createGenerateLifecycleTasksUseCase,
  createGetTodayOpsSnapshotUseCase,
  createImportTripsUseCase,
  type JobName,
  type JobRun,
  type JobRunRepository,
} from "@turo-automation/shared";
import { createFixtureAdapters } from "../adapters/createFixtureAdapters.js";
import { createSupabaseAdapters } from "../adapters/createSupabaseAdapters.js";
import { runDailyDigestJob } from "../jobs/runDailyDigestJob.js";
import { runImportTripsJob } from "../jobs/runImportTripsJob.js";
import { runLateReturnScanJob } from "../jobs/runLateReturnScanJob.js";
import { runLifecycleTasksJob } from "../jobs/runLifecycleTasksJob.js";
import { runTodayOpsSnapshotJob } from "../jobs/runTodayOpsSnapshotJob.js";
import { logUseCaseResult, logWorkerEvent } from "../lib/logger.js";
import { getWorkerNowIso, getWorkerToday } from "../lib/time.js";

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
  };
}
