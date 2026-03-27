-- Migration: extend job_runs job_name check for explicit approved message sends
-- Depends on: 0002_turo_ops_incidents_messages_jobs.sql

alter table public.job_runs
  drop constraint if exists job_runs_job_name_check;

alter table public.job_runs
  add constraint job_runs_job_name_check check (job_name in (
    'today_ops_snapshot',
    'trip_import',
    'lifecycle_tasks',
    'late_return_scan',
    'generate_drafts',
    'send_approved_message_drafts',
    'daily_digest'
  ));
