# Implementation Roadmap

A pragmatic path for building the Turo Automation MVP in small, reviewable PRs.

## Guiding Principle
Prefer small increments that create an operational backbone before adding sophisticated automation.

## Phase 0 — Foundation ✓
Objective: establish shared language, plan, and architecture.

PR slices:
1. docs scaffold and MVP spec ✓
2. hourly AI workflow runbook ✓
3. data model draft + implementation roadmap ✓

## Phase 1 — Operational Backbone ✓
Objective: create the minimum system needed to view trips and manage work.

PR slices:
1. initialize `web/`, `worker/`, and `shared/` ✓
2. create shared TypeScript domain models, ports, use-cases, and fixtures ✓
3. add Supabase schema + migrations for vehicles, guests, trips, tasks ✓
4. build fixture-backed ops dashboard shell ✓
5. add missing schema slices (incidents, trip_events, message_threads, message_drafts, approval_requests, job_runs) ✓
6. add Supabase-backed repository adapters in `shared/src/adapters/supabase/` ✓
7. wire worker + web to Supabase adapters (env-gated, fixture fallback) ✓

## Phase 2 — Real Notifications + Import
Objective: connect the system to real external services.

PR slices:
1. Slack notifier adapter (`SLACK_WEBHOOK_URL` env var)
2. trip import-source adapter (CSV / Turo export)
3. `.env.example` with required environment variable documentation
4. approval state transitions via UI actions
5. templated pre-trip and return reminder drafts

## Phase 3 — Automation Engine
Objective: reduce repetitive manual work with safe background jobs.

PR slices:
1. scheduled worker framework (cron / queue)
2. trip lifecycle task generation from real trips
3. late return detection with real Slack alerts
4. daily ops digest to Slack
5. incident creation from predefined triggers

## Phase 4 — Reliability + Extensions
Objective: improve correctness, visibility, and operator trust.

PR slices:
1. audit log / event timeline improvements
2. retry + failure handling for worker jobs
3. operational runbooks and alert tuning
4. richer analytics and utilization reporting

## Current Highest-Priority Next PR
Wire the Slack notifier adapter so that approval requests and daily digests reach the ops channel:
- add `shared/src/adapters/slack/notifier.ts` implementing `OpsNotifier` via incoming webhook
- gate on `SLACK_WEBHOOK_URL` env var; noop if absent
- replace `createNoopNotifier()` in `worker/src/adapters/createSupabaseAdapters.ts`

## Why This Is Next
- the Supabase repository adapters now exist and the build/tests pass
- the notifier is the last stub in the worker's real-data path
- once notifications fire, the daily digest and approval workflow are operationally useful

## Rules for Future PRs
- one highest-priority PR at a time
- prefer reviewable increments over broad scaffolding
- update `docs/` whenever implementation changes reality
- do not mark milestones complete without code and verification
