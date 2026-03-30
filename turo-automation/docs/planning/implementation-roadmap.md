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

## Phase 7 — Modular Host Systems
Objective: reshape browser automation to match the Turo host product surface and make future page coverage easier to extend safely.

PR slices:
1. define the host-page-aligned module architecture and migrate shared core utilities
2. refactor existing session, trips, and inbox flows into the new module structure
3. add first `calendar-system` read-only flow
4. add first `vehicles-system` read-only flow
5. add first `user-profile-system` read-only flow
6. document or lightly probe `business-system`, `more-system`, and `switch-to-guest` for the next safe increments ✓

## Current Status
- Milestone 1 is complete through the first 10-PR browser-agent hardening batch (#83–#92 merged).
- The first Milestone 2 structural slice has landed: `browser-agent-py` now has host-aligned module packages with compatibility shims.
- The blocked business, more, and switch-to-guest surfaces are documented in the Milestone 2 plan; the next safe browser-agent step is docs-only until a reachable page appears.

## Rules for Future PRs
- one highest-priority PR at a time
- prefer reviewable increments over broad scaffolding
- update `docs/` whenever implementation changes reality
- do not mark milestones complete without code and verification
