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

## Phase 6 — Production Workflow Hardening ✓
Objective: tighten identity, mutation boundaries, and guest-send safety before broader rollout.

PR slices:
1. actor identity model for approval / incident mutations ✓
2. explicit guest-send path after approval ✓
3. decide whether web mutations stay direct-to-Supabase or move behind an API/worker boundary ✓

## Phase 7 — Modular Host Systems ✓
Objective: reshape browser automation to match the Turo host product surface and make future page coverage easier to extend safely.

PR slices:
1. define the host-page-aligned module architecture and migrate shared core utilities ✓
2. refactor existing session, trips, and inbox flows into the new module structure ✓
3. add first `calendar-system` read-only flow ✓
4. add first `vehicles-system` read-only flow ✓
5. add first `user-profile-system` read-only flow ✓
6. document or lightly probe `business-system`, `more-system`, and `switch-to-guest` for the next safe increments ✓

## Phase 8 — Production Deployment Readiness ✓
Objective: make the TypeScript worker stack operable in a containerised production environment.

PR slices:
1. `Dockerfile.worker` — multi-stage build for the worker ✓
2. `.dockerignore` — keep build context lean ✓
3. `docker-compose.yml` — local end-to-end development (worker + data volume mount) ✓

## Phase 9 — CI/CD and Production Observability ✓
Objective: protect the main branch with automated CI and add the observability needed to operate the containerised worker in production.

PR slices:
1. GitHub Actions CI workflow — build and test the TypeScript stack on every PR and push to main ✓
2. Worker health check HTTP endpoint — `GET /healthz` for container orchestrator liveness probes ✓
3. Structured JSON logging — replace `console.*` with JSON-structured output when `NODE_ENV=production` ✓
4. Docker image publish — GitHub Actions workflow to build and push the worker image to GHCR on merge to main ✓

## Phase 10 — Operational Readiness
Objective: fill the gaps between a working containerised stack and a smoothly operable production deployment — configuration completeness, operator-facing documentation, and runtime quality-of-life improvements.

PR slices:
1. Config completeness — add missing `INTERVAL_GENERATE_DRAFTS_MS` to `.env.example`; note: also incorrectly added `docs/samples/trips.csv` (corrected in slice 5) ✓
2. Job run duration tracking — record actual `finishedAt` timestamps in `buildJobRun` so operators can see real job durations in `job_runs` ✓
3. Structured fatal error logging — replace `console.error` in `worker/src/index.ts` with `logWorkerEvent("boot.fatal", ...)` for consistent JSON output in production ✓
4. Per-job `startedAt` in run-once mode — capture individual start timestamps for each job in `run()` so `job_runs` shows accurate per-job timing ✓
5. Sample CSV consolidation — remove duplicate `docs/samples/trips.csv`; point `.env.example` default to `data/trips.sample.csv` ✓
6. Extract shared use-case setup helper — `buildUseCases(adapters)` eliminates duplicated 40-line blocks in `run()` and `runScheduled()` ✓
7. Phase 10 closeout — refresh sample CSV dates to April 2026; close out Phase 10 docs ✓

## Current Status
- All Phases 0–10 are complete.
- The TypeScript worker stack is containerised, CI-protected, observable, and publishable to GHCR.
- `browser-agent-py/` has host-aligned module packages (`core`, `trips`, `inbox`, `calendar`, `vehicles`, `user_profile`) with read-only flows verified.
- `business`, `more`, and `switch-to-guest` modules are scaffolded but remain docs-only; each probed URL returns blocked/403 with the current saved session.
- The next browser-agent implementation step requires a real authenticated host session before adding new read-only extraction flows.
- Phase 11 scope should be driven by operational usage of the deployed worker stack; no pre-defined scope yet.

## Rules for Future PRs
- one highest-priority PR at a time
- prefer reviewable increments over broad scaffolding
- update `docs/` whenever implementation changes reality
- do not mark milestones complete without code and verification
