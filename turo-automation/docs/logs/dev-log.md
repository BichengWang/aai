# Dev Log

Chronological notes on repo setup, architecture decisions, implementation progress, blockers, and follow-ups.

---

## 2026-03-19

### Repo bootstrap
- Created `turo-automation/` under `/Users/mac/my-code/altair-ai-llc`
- Added docs-first structure:
  - `docs/architecture/`
  - `docs/logs/`
  - `docs/planning/`
  - `docs/product/`
  - `docs/runbooks/`
- Added application folders:
  - `web/`
  - `worker/`
  - `shared/`
- Added root `README.md`
- Added `docs/planning/daily-plan.md`
- Added `docs/logs/dev-log.md`

### Initial direction
- Goal: automate Turo host daily operations without over-automating risky workflows on day 1
- Recommendation: start with detection, task routing, message drafting, and approvals before enabling autonomous guest-facing sends
- MVP focus areas:
  1. trip ops dashboard
  2. task orchestration
  3. guest messaging draft workflow
  4. incident / late-return alerting
  5. daily summary reporting

### Added runbook
- Added `docs/runbooks/ai-workflow-hourly.md`
- Established the hourly development loop: review state, choose one highest-priority PR, implement incrementally, verify, update PR, and keep docs synchronized with reality

### First runbook execution
- Reviewed current repo state, open PRs, recent commits, and docs inventory
- Chose the highest-priority ready task: document the implementation roadmap and draft the MVP data model
- Added `docs/planning/implementation-roadmap.md`
- Added `docs/architecture/data-model.md`
- Updated `docs/planning/daily-plan.md` to reflect completed planning work and the next executable step

### Second runbook execution
- Reviewed current repo state again from `main`
- Confirmed there were no open PRs and the next ready task was the app skeleton milestone
- Initialized an executable workspace under `turo-automation/` with:
  - `package.json` and npm workspaces
  - `tsconfig.base.json`
  - `web/` Vite + React shell
  - `worker/` TypeScript worker entrypoint
  - `shared/` shared package for common exports
  - `.gitignore` for local build artifacts and dependencies
- Updated the root `README.md` to describe package roles
- Updated `docs/planning/daily-plan.md` to mark the app skeleton milestone complete

### Third runbook execution
- Synced back to `main` after the app skeleton merged
- Selected the next highest-priority ready task: create the first persistence slice for the MVP domain
- Added `turo-automation/supabase/migrations/0001_turo_ops_core.sql`
- Implemented initial tables for:
  - `vehicles`
  - `guests`
  - `trips`
  - `tasks`
- Added indexes, `updated_at` triggers, and baseline authenticated RLS policies for those tables
- Updated `docs/planning/daily-plan.md` to mark the schema milestone complete and point to the dashboard shell as the next task

### Decision
- The next highest-priority implementation PR should build the first internal dashboard shell for vehicles, trips, tasks, and incidents
- Reason: the docs foundation, app skeleton, and initial persistence layer now exist; the next smallest useful increment is turning that structure into an operator-facing UI shape

### Verification
- Verified the migration file against existing SQL conventions in `homepage/supabase/workspace.sql`
- Assumption: Supabase CLI is not installed locally, so verification was limited to SQL consistency review rather than CLI lint/apply

### Pending
- Build the first internal dashboard shell beyond placeholder content
- Add worker job framework for scheduled automation
- Connect shared domain models to persistence and UI
- Add incident and messaging schema slices

---

## 2026-03-20

### Interface-first architecture PR
- Re-architected `turo-automation` around explicit package boundaries while keeping the existing `web`, `worker`, and `shared` package topology
- Added shared modules for:
  - domain entities and status unions
  - repository and integration ports
  - typed use-case contracts and result envelopes
  - fixture-backed in-memory repositories and adapters
- Added a canonical `TodayOpsSnapshot` read model to serve as the first dashboard contract
- Added use cases for:
  - today ops snapshot
  - trip import
  - lifecycle task generation
  - message draft creation
  - approval request
  - late return detection
  - daily digest creation

### Web shell refactor
- Replaced the placeholder milestone card with a fixture-backed dashboard shell
- Moved UI composition into `web/src/app`, `web/src/features`, `web/src/ui`, and `web/src/lib`
- Kept the web package consuming only `@turo-automation/shared` exports

### Worker bootstrap refactor
- Replaced the placeholder worker log output with fixture-backed job execution
- Added worker bootstrap, job modules, adapter assembly, logger, and clock helpers
- Kept the worker package consuming only `@turo-automation/shared` exports

### Verification
- `npm run build`
- `npm test`

### Next
- Implement real Supabase-backed repository adapters
- Add missing persistence slices for incidents, messages, approvals, and job runs
- Replace fixture context in the web app and worker with persistence-backed adapters

---

## 2026-03-21

### Supabase schema + adapter PR

- Added `supabase/migrations/0002_turo_ops_incidents_messages_jobs.sql` with:
  - `incidents` — type, severity, status, summary, trip/vehicle FK
  - `trip_events` — append-only event log per trip
  - `message_threads` — per-trip guest messaging threads
  - `message_drafts` — drafts with approval status and state
  - `approval_requests` — one per draft, tracks reviewer and outcome
  - `job_runs` — persisted worker job audit trail
  - Indexes, RLS policies, and `updated_at` triggers consistent with migration 0001

### Supabase-backed repository adapters

- Added `@supabase/supabase-js` to `shared` package
- Added `shared/src/adapters/supabase/`:
  - `client.ts` — factory that reads `SUPABASE_URL` + `SUPABASE_KEY` from env; throws at call time (not import time) to keep fixture-only builds working
  - `tripRepository.ts` — implements `TripRepository` with full upsert and trip event support
  - `taskRepository.ts` — implements `TaskRepository`
  - `incidentRepository.ts` — implements `IncidentRepository`
  - `messageRepository.ts` — implements `MessageRepository` (threads, drafts, approval requests)
  - `jobRunRepository.ts` — implements `JobRunRepository`
  - `index.ts` — barrel re-export for all adapter factories
- All adapters exported from `shared/src/index.ts`

### Worker wiring

- Added `worker/src/adapters/createSupabaseAdapters.ts`:
  - fetches active vehicles and guests from Supabase on boot
  - creates all Supabase-backed repositories
  - stubs `tripImportSource` (noop, returns empty rows) and `notifier` (noop, does not call Slack)
- Updated `worker/src/app/createWorkerApp.ts`:
  - env-gated: reads `SUPABASE_URL` + `SUPABASE_KEY` to decide adapter mode
  - `mode: supabase` when both vars are set; `mode: fixture` otherwise
  - no change to use-case wiring or job sequence

### Web wiring

- Added `web/src/lib/loadSnapshot.ts`:
  - if `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` are set, queries Supabase and runs the snapshot use-case against real repos
  - otherwise falls back to `getFixtureTodayOpsSnapshot()` from shared
- Updated `web/src/app/AppShell.tsx` to call `loadSnapshot()` instead of `getFixtureTodayOpsSnapshot()` directly
- Masthead now reflects actual data mode (Supabase-backed vs fixture-backed)

### Verification

- `npm run build` — clean
- `npm test` — 4/4 pass (all fixture-backed contract and worker tests pass unchanged)

### Assumptions

- `tripImportSource` stub returns empty rows when Supabase is active; a real CSV/API import adapter is the next planned slice
- `notifier` stub returns `{ accepted: false, externalId: null }` when Supabase is active; the Slack webhook adapter is the next planned slice
- Vehicles and guests are fetched once at worker boot time; a cache/refresh mechanism is deferred

### Next

- Implement Slack notifier adapter (`SLACK_WEBHOOK_URL` env var)
- Implement real trip import-source adapter
- Add `.env.example` documenting required environment variables

### Slack notifier adapter

- Added `shared/src/adapters/slack/notifier.ts` with:
  - `createSlackNotifier(webhookUrl)` — posts to a Slack incoming webhook
  - `createEnvSlackNotifier()` — reads `SLACK_WEBHOOK_URL`; returns no-op when absent
- Wired into `createSupabaseAdapters` — replaces the inline no-op notifier
- Added `.env.example` with documentation for `SUPABASE_URL`, `SUPABASE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `SLACK_WEBHOOK_URL`

### Architecture docs

- Rewrote `docs/architecture/overview.md` to reflect implemented adapter layer, env-gating pattern, and active/planned integrations table

### CSV trip import-source adapter

- Added `worker/src/adapters/csv/tripImportSource.ts`:
  - `createCsvTripImportSource(filePath)` — reads a CSV file and maps rows to `TripImportRow[]`
  - `createEnvCsvTripImportSource()` — reads `TRIP_IMPORT_CSV_PATH`; returns no-op when absent
  - Built-in CSV parser handles quoted fields; skips rows missing required fields
- Wired into `createSupabaseAdapters` — replaces the inline noop import source
- Added `TRIP_IMPORT_CSV_PATH` to `.env.example` with expected column documentation
- Added 3 CSV adapter unit tests (`worker/test/csv-import.test.mjs`)
- Updated root `package.json` test script to include CSV tests

### Verification

- `npm test` — 7/7 pass

### Next

- Add sample trips.csv to help operators get started without configuring a full import pipeline
- Consider a simple Turo-export → CSV mapping script
- Wire the Slack notifier to the web approval workflow (approval button → Slack notification)

### VehicleRepository + GuestRepository ports (fix import FK constraint gap)

- Added `VehicleRepository` and `GuestRepository` interfaces to `shared/src/ports/index.ts`
- Added `createInMemoryVehicleRepository` and `createInMemoryGuestRepository` to `shared/src/application/index.ts`
- Added Supabase implementations: `shared/src/adapters/supabase/vehicleRepository.ts` and `guestRepository.ts`
- Updated `createImportTripsUseCase` to accept optional `guestRepository?` and `vehicleRepository?` — when provided, derives and upserts guests/vehicles from CSV rows before saving trips (fixes FK constraint failures on real Supabase)
- Updated `createSupabaseAdapters` to use the new repos instead of raw array fetches
- Updated `createWorkerApp.ts` to pass repos to import use-case in Supabase mode

**Verification**: `npm test` — 7/7 pass

### Next

- Add approval action endpoint (approve/reject a pending message draft)
- Consider web API route for approval actions backed by Supabase
- Improve coverage: add test for CSV import guest/vehicle upsert path

### Approval actions wired to web dashboard (Iter 23)

- Updated `web/src/features/OpsDashboard.tsx`:
  - Added `actOnApproval` import from `../lib/approvalActions`
  - Per-row approve/reject buttons appear when `approval.status === "pending"` and row not yet actioned
  - Local `actioningId` + `actionedIds` state prevents double-submission and shows "actioned" pill after success
  - `onApprovalActioned?` callback prop available for parent to trigger reload
- Added `web/src/lib/approvalActions.ts` with `actOnApproval(approvalRequestId, decision, reviewedBy)` — noop when Supabase env absent

**Verification**: `npm run build` + `npm test` — 9/9 pass, clean build

**Phase 2 status**: items 1–4 complete; item 5 (templated message bodies) is next

### Message body template renderer (Iter 25)

- Added `renderMessageTemplate(ctx)` to `shared/src/application/index.ts`:
  - Supports `pretrip_reminder`, `return_reminder`, `incident_notice` template keys
  - Renders real guest name, vehicle nickname, trip ID, and dates into the message body
  - Falls back to `[templateKey] Trip ... — Vehicle — Guest` for unknown keys
- Updated `createCreateMessageDraftUseCase` to accept optional `guests[]` and `vehicles[]`; renders template body when present
- Added 3 contract tests: template rendering assertions for pre-trip and return reminder, plus end-to-end draft creation test

**Verification**: `npm test` — 12/12 pass

### Scheduled worker framework (Iter 26)

- Added `worker/src/scheduler/createJobScheduler.ts`:
  - `createJobScheduler(jobs[])` takes `{name, intervalMs, run}` entries
  - Each job runs immediately on `start()`, then repeats at `intervalMs`
  - Job failures are caught, logged, and isolated — they do not affect other jobs
  - `stop()` clears all intervals for graceful shutdown
- Added `runScheduled()` to `createWorkerApp()`:
  - Same use-case wiring as `run()` but feeds a `JobScheduler`
  - Job intervals configurable via env vars (`INTERVAL_IMPORT_MS`, `INTERVAL_LIFECYCLE_MS`, etc.)
  - Registers `SIGTERM` / `SIGINT` handlers for graceful shutdown
- Updated `worker/src/index.ts`: reads `WORKER_MODE` env var; `scheduled` → `runScheduled()`, else `run()`
- Added `WORKER_MODE` and interval vars to `.env.example`
- Added 3 scheduler unit tests

**Verification**: `npm test` — 15/15 pass

### Phase 3 completion: DetectTripAnomalies + GenerateMessageDrafts (Iters 28–30)

- Added `createGenerateMessageDraftsUseCase()`:
  - Scans upcoming/active trips within configurable window (default 24h)
  - Creates `pretrip_reminder` and `return_reminder` drafts with real template bodies
  - Idempotent via `tripId:templateKey` deduplication
  - Wired to both `run()` and `runScheduled()` at 30-min interval
- Added `computeTripIssueIncidents()` + `createDetectTripAnomaliesUseCase()`:
  - Combines late return detection + trip-issue incident creation
  - Issue-status trips with return in the future get a new `other` incident
  - Late-return path unchanged; overlap prevented by return-time check
- Added `generate_drafts` to `JobName` domain type
- Created PR #53 covering all Phase 2 + Phase 3 work

**Verification**: `npm test` — 17/17 pass

### Phase 4: Reliability + Extensions (Iters 31–32)

- Added `worker/src/scheduler/withRetry.ts`:
  - `withRetry(fn, label, opts)` with exponential backoff
  - Default: 3 attempts, 2s base delay, factor 2
  - Wired into `createJobScheduler` — each job auto-retried on failure
  - Per-job `maxAttempts` and `retryDelayMs` overrides available
- Added 4 `withRetry` unit tests + 1 scheduler retry integration test
- Added `createGetTripTimelineUseCase()`:
  - Aggregates `TripEvent`, `Task`, `Incident`, and `MessageDraft` for a tripId
  - Returns entries sorted by timestamp ascending
  - Contract test verifies all 4 entry kinds and sort order

**Verification**: `npm test` — 22/22 pass

### GetVehicleUtilization use case (Iter 34)

- Added `VehicleUtilizationItem` type and `GetVehicleUtilizationUseCase` to `shared/src/application/index.ts`:
  - Accepts an array of trips and a date range; computes per-vehicle utilization rate
  - Utilization = booked days / total days in range (capped at 1.0)
  - Contract test verifies correct rate calculation and zero-rate for unboked vehicles
- Added contract test in `shared/test/contracts.test.mjs`

**Verification**: `npm test` — 23/23 pass

### Roadmap update (Iter 35)

- Marked Phase 3 and Phase 4 fully complete in `docs/planning/implementation-roadmap.md`
- Added Phase 5 — Dashboard Enrichment with 3 planned PR slices:
  1. Trip timeline panel (wire `GetTripTimeline` to selected-trip view)
  2. Vehicle utilization panel (wire `GetVehicleUtilization` to sidebar)
  3. Incident list panel with status transitions
- Current highest-priority: Phase 5 item 1 (trip timeline panel)

### Docs baseline sync (Iter 36)

- Updated `docs/planning/daily-plan.md` to reflect implemented `main` reality:
  - Phase 2-4 work already complete
  - trip timeline and vehicle utilization dashboard slices already shipped
  - incident workflow is now the highest-priority ready task
- Updated `docs/planning/implementation-roadmap.md`:
  - marked Phase 5 items 1 and 2 complete
  - promoted Phase 5 item 3 (incident list panel with status transitions) to the active next PR
- Updated `docs/architecture/overview.md` to include the trip timeline and vehicle utilization dashboard surfaces

**Verification**: docs-only sync against current `main` implementation
