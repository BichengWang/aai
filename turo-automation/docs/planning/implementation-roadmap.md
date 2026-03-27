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

## Phase 2 — Real Notifications + Import ✓
Objective: connect the system to real external services.

PR slices:
1. Slack notifier adapter (`SLACK_WEBHOOK_URL` env var) ✓
2. trip import-source adapter (CSV / Turo export) ✓
3. `.env.example` with required environment variable documentation ✓
4. approval state transitions via UI actions ✓
5. templated pre-trip and return reminder drafts ✓

## Phase 3 — Automation Engine ✓
Objective: reduce repetitive manual work with safe background jobs.

PR slices:
1. scheduled worker framework (`WORKER_MODE=scheduled`, interval-based) ✓
2. trip lifecycle task generation from real trips ✓ (GenerateLifecycleTasks use case + scheduler)
3. late return detection with real Slack alerts ✓ (DetectLateReturns + Slack notifier)
4. daily ops digest to Slack ✓ (BuildDailyDigest + scheduled)
5. auto-generate pre-trip and return reminder drafts ✓ (GenerateMessageDrafts use case)
6. incident creation from predefined triggers ✓ (DetectTripAnomalies: late returns + issue-status trips)

## Phase 4 — Reliability + Extensions ✓
Objective: improve correctness, visibility, and operator trust.

PR slices:
1. audit log / event timeline improvements ✓ (`GetTripTimeline` use case)
2. retry + failure handling for worker jobs ✓ (`withRetry` wrapper in scheduler)
3. operational runbooks and alert tuning ✓ (`host-ops-daily.md`, `incident-response.md`)
4. richer analytics and utilization reporting ✓ (`GetVehicleUtilization` use case)

## Phase 5 — Dashboard Enrichment ✓
Objective: surface the new data from Phases 3–4 in the operator UI.

PR slices:
1. trip timeline panel in OpsDashboard (wire `GetTripTimeline` to selected-trip view) ✓
2. vehicle utilization panel (wire `GetVehicleUtilization` to dashboard sidebar) ✓
3. incident list panel with status transitions (surface `DetectTripAnomalies` output) ✓

## Phase 6 — Production Workflow Hardening (next)
Objective: tighten identity, mutation boundaries, and guest-send safety before broader rollout.

PR slices:
1. actor identity model for approval / incident mutations ✓
2. explicit guest-send path after approval ✓
3. decide whether web mutations stay direct-to-Supabase or move behind an API/worker boundary

## Current Highest-Priority Next PR
Phase 6 item 3: decide whether web mutations stay direct-to-Supabase or move behind an API/worker boundary:
- decide where approval and incident mutations should live
- keep the explicit guest-send path auditable as the next safety gate
- align the implementation boundary with the eventual production auth model

## Why This Is Next
- Phase 6 items 1 and 2 are now implemented on `main`
- The remaining open decision is the mutation boundary, not the draft send transition

## Rules for Future PRs
- one highest-priority PR at a time
- prefer reviewable increments over broad scaffolding
- update `docs/` whenever implementation changes reality
- do not mark milestones complete without code and verification
