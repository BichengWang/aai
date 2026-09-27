import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRun } from "../../domain/index.js";
import type { JobRunRepository } from "../../ports/index.js";

interface JobRunRow {
  id: string;
  job_name: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  summary: string;
  issue_count: number;
}

function rowToJobRun(r: JobRunRow): JobRun {
  return {
    id: r.id,
    jobName: r.job_name as JobRun["jobName"],
    status: r.status as JobRun["status"],
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    summary: r.summary,
    issueCount: r.issue_count,
  };
}

function jobRunToRow(j: JobRun): JobRunRow {
  return {
    id: j.id,
    job_name: j.jobName,
    status: j.status,
    started_at: j.startedAt,
    finished_at: j.finishedAt,
    summary: j.summary,
    issue_count: j.issueCount,
  };
}

export function createSupabaseJobRunRepository(
  client: SupabaseClient
): JobRunRepository {
  return {
    async listJobRuns() {
      const { data, error } = await client
        .from("job_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(`listJobRuns: ${error.message}`);
      return (data as JobRunRow[]).map(rowToJobRun);
    },

    async saveJobRun(jobRun) {
      const row = jobRunToRow(jobRun);
      const { data, error } = await client
        .from("job_runs")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();
      if (error) throw new Error(`saveJobRun: ${error.message}`);
      return rowToJobRun(data as JobRunRow);
    },
  };
}
