# Dev Log

Chronological notes on repo setup, architecture decisions, implementation progress, blockers, and follow-ups.

---

## 2026-03-30

### Phase 9 slice 3 — structured JSON logging for production

- Updated `worker/src/lib/logger.ts`: when `NODE_ENV=production`, `logWorkerEvent` emits a single JSON line per event — `{"level":"info","ts":"<ISO>","event":"<label>",...payload}` — suitable for log aggregators (CloudWatch, Datadog, etc.)
- When `NODE_ENV` is unset or not `production`, behaviour is unchanged (human-readable two-line output)
- Updated `worker/src/lib/createHealthServer.ts` to use `logWorkerEvent` instead of a bare `console.log`

**Verification**: `npm run build --workspace @turo-automation/worker` — clean compile

### Phase 9 slice 2 — worker health check HTTP endpoint

- Added `worker/src/lib/createHealthServer.ts` — minimal `node:http` server that responds to `GET /healthz` with `200 {"status":"ok"}`
- Updated `worker/src/index.ts` to start the health server before `runScheduled()` when `WORKER_MODE=scheduled`; run-once mode is unchanged
- Documented `HEALTHZ_PORT` (default 3001) in `.env.example`

**Verification**: `npm run build --workspace @turo-automation/worker` — clean compile

### Phase 9 slice 1 — GitHub Actions CI workflow

- Added `.github/workflows/ci-turo-automation.yml` to build and test the TypeScript stack on every PR and push to `main` that touches `turo-automation/` code
- Workflow runs `npm ci --ignore-scripts` (skips Playwright browser download), `npm run build`, and `npm test` in the `turo-automation/` working directory on Node 22
- Updated `docs/planning/implementation-roadmap.md` to define Phase 9 and mark Phase 8 complete
- Updated `docs/planning/daily-plan.md` to reflect Phase 9 start

**Verification**: workflow YAML linted by eye; will execute on first PR that touches turo-automation code

### Phase 8 kickoff — production deployment readiness

- All Phases 0–7 merged through PR #114 (Phase 7 roadmap closeout).
- Started Phase 8: production deployment readiness.

### Phase 8 slices 2–3: `.dockerignore` and `docker-compose.yml`

- Added `turo-automation/.dockerignore` — excludes `node_modules`, `dist`, `test`, `data`, `browser-agent-py`, Playwright artifacts, `.env` secrets, Supabase local state, and editor noise from the build context.
- Added `turo-automation/docker-compose.yml` — starts the worker with `env_file: .env`, mounts `./data:/data:ro` for CSV trip import, and defaults `restart: "no"` for run-once mode. `WORKER_MODE=scheduled` and `WORKER_SEND_APPROVED_DRAFTS` are forwarded from the host environment.
- Phase 8 (production deployment readiness) is now complete.

### Phase 8 slice 1: `Dockerfile.worker`

- Added `turo-automation/Dockerfile.worker` — a two-stage Docker build for the worker package.
  - **Builder stage**: installs all workspace deps with `--ignore-scripts` (prevents Playwright browser download), then compiles `@turo-automation/shared` and `@turo-automation/worker`.
  - **Runtime stage**: copies only `node_modules` (workspace symlinks intact), compiled `shared/dist`, and `worker/dist`. No source, no dev tools.
- Default `CMD` runs the worker once (`run-once` mode); set `WORKER_MODE=scheduled` for the keep-alive mode.
- Updated `docs/planning/implementation-roadmap.md` to define Phase 8 (slices 1–3) and mark slice 1 complete.
- Updated `docs/planning/daily-plan.md` for 2026-03-30.

### Blockers
- Browser-agent new flows remain blocked: `business`, `more`, `switch-to-guest` modules probe URLs that return blocked/403 with the current saved session. No new browser-agent read-only flows until a real authenticated session is available.

### Next
- Phase 8 slice 2: add `.dockerignore` to keep the build context lean.
- Phase 8 slice 3: `docker-compose.yml` for local end-to-end development (worker + env wiring).

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

## 2026-03-29

### Business / more / switch-to-guest inventory

- Probed the obvious business routes (`/us/en/earnings`, `/us/en/host/earnings`, `/us/en/business`, `/us/en/host/business`, `/us/en/insights`, `/us/en/host/insights`) with the saved browser state and each returned `blocked`
- Probed the obvious more/settings routes (`/us/en/more`, `/us/en/host/more`, `/us/en/settings`, `/us/en/host/settings`) with the saved browser state and each returned `blocked`
- Probed the obvious switch-to-guest routes (`/us/en/switch-to-guest`, `/us/en/host/switch-to-guest`) with the saved browser state and each returned `blocked`
- Updated the Milestone 2 plan and daily plan to keep business, more, and switch-to-guest as docs-only until a reachable page appears

### Profile read-only flow

- Added `browser-agent-py/src/turo_browser_agent/modules/user_profile/check.py` as the first Milestone 2 profile/account check flow
- Wired `profile-check` into the Python CLI and kept a legacy `flows/profile_check.py` shim for compatibility
- Added profile parser coverage and CLI dispatch tests
- Updated browser-agent and repo planning docs to mark `profile-check` as implemented and to narrow the remaining scaffold packages to business/more/switch-to-guest

### Verification

- `turo-automation/browser-agent-py/.venv/bin/python -m unittest discover -s turo-automation/browser-agent-py/tests -p 'test_*.py'`
- `BROWSER_AGENT_HEADLESS=true turo-automation/browser-agent-py/.venv/bin/python -m turo_browser_agent profile-check`

### Result

- The command booted successfully and resolved `https://turo.com/us/en/account`
- Live host response returned `blocked` with HTTP 403 and captured screenshot/HTML artifacts
- Assumption: the host account URL is correct, but full read-only extraction still needs a logged-in session that can get past Turo's blocking layer

### Vehicles read-only flow

- Added `browser-agent-py/src/turo_browser_agent/modules/vehicles/list.py` as the first Milestone 2 vehicles summary flow
- Wired `vehicles-list` into the Python CLI and kept a legacy `flows/vehicles_list.py` shim for compatibility
- Added vehicle parser coverage and CLI dispatch tests
- Updated browser-agent and repo planning docs to mark `vehicles:list` as implemented and to narrow the remaining scaffold packages to business/more/profile/switch-to-guest

### Verification

- `turo-automation/browser-agent-py/.venv/bin/python -m unittest discover -s turo-automation/browser-agent-py/tests -p 'test_*.py'`
- `BROWSER_AGENT_HEADLESS=true turo-automation/browser-agent-py/.venv/bin/python -m turo_browser_agent vehicles-list`

### Result

- The command booted successfully and resolved `https://turo.com/us/en/vehicles`
- Live host response returned `blocked` with HTTP 403 and captured screenshot/HTML artifacts
- Assumption: the host vehicles URL is correct, but full read-only extraction still needs a logged-in session that can get past Turo's blocking layer

### Milestone 2 tracking closeout

- Marked the blocked business, more, and switch-to-guest inventory slice complete in `docs/planning/implementation-roadmap.md` and `docs/planning/milestone-2-modular-host-systems.md`
- Kept `docs/planning/daily-plan.md` aligned with the current blocker state so the next browser-agent step stays docs-only until a reachable page appears

### Top-level plan alignment

- Updated `docs/plan.md` to describe the current browser-agent read-only coverage and keep the blocked route inventory visible in the high-level plan

### Browser-agent subtree docs alignment

- Updated `browser-agent-py/README.md` and `browser-agent-py/docs/ARCHITECTURE.md` so the package-level docs state that business, more, and switch-to-guest remain docs-only while the saved session is blocked

### Root README alignment

- Updated `turo-automation/README.md` so the package overview reflects the current browser-agent read-only coverage and the blocked docs-only routes

### Legacy browser-agent README alignment

- Updated `browser-agent/README.md` so the TypeScript package is clearly identified as the legacy runner while `browser-agent-py/` holds the current host-browser workflow

### Browser-agent package cross-link

- Added a direct cross-link in `browser-agent/README.md` to the current `browser-agent-py/README.md` coverage so the package split is visible in both package docs

### Calendar read-only flow

- Added `browser-agent-py/src/turo_browser_agent/modules/calendar/list.py` as the first Milestone 2 read-only calendar summary flow
- Wired `calendar-list` into the Python CLI and kept a legacy `flows/calendar_list.py` shim for compatibility
- Added calendar parser coverage and CLI dispatch tests
- Updated browser-agent and repo planning docs to mark `calendar:list` as implemented and to narrow the remaining scaffold packages to vehicles/business/more/profile/switch-to-guest

### Verification

- `turo-automation/browser-agent-py/.venv/bin/python -m unittest discover -s turo-automation/browser-agent-py/tests -p 'test_*.py'`
- `BROWSER_AGENT_HEADLESS=true turo-automation/browser-agent-py/.venv/bin/python -m turo_browser_agent calendar-list`

### Result

- The command booted successfully and resolved `https://turo.com/us/en/calendar`
- Live host response returned `blocked` with HTTP 403 and captured screenshot/HTML artifacts
- Assumption: the host calendar URL is correct, but full read-only extraction still needs a logged-in session that can get past Turo's blocking layer

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

### Incident action use case (Iter 37)

- Added `createActOnIncidentUseCase()` to `shared/src/application/index.ts`
  - updates incident status through `IncidentRepository`
  - stamps `ownerId`, `resolvedAt`, and `updatedAt`
  - returns a typed not-found error when the incident does not exist
- Added a contract test covering the resolved transition path
- Updated `docs/planning/daily-plan.md` to mark incident action use-case support complete

**Verification**: `npm test` — 24/24 pass

### Incident context read model (Iter 38)

- Enriched `TodayOpsIncidentItem` in `shared/src/application/index.ts` with:
  - `externalTripId`
  - `vehicleLabel`
  - `ownerId`
- Updated `buildTodayOpsSnapshotModel()` to derive trip and vehicle context for each active incident
- Added contract assertions covering the richer incident snapshot payload

**Verification**: `npm test` — 24/24 pass

### Incident dashboard context (Iter 39)

- Updated `web/src/features/OpsDashboard.tsx` incident rows to show:
  - vehicle label
  - trip external ID
  - current owner assignment
- Promoted incident severity to a pill so status and severity read distinctly in the dashboard
- Updated `docs/planning/daily-plan.md` to mark richer incident context complete

**Verification**: `npm test` — 24/24 pass

### Incident rows open trip timeline (Iter 40)

- Updated `web/src/features/OpsDashboard.tsx` so active-incident rows:
  - reuse the selected-trip timeline behavior already used by pickup/return rows
  - are keyboard accessible when a trip is attached to the incident
  - show selected-row styling when the trip timeline is open from an incident

**Verification**: `npm test` — 24/24 pass

### Web incident action client (Iter 41)

- Added `web/src/lib/incidentActions.ts`
  - mirrors the existing approval action pattern
  - uses `createActOnIncidentUseCase()` with the Supabase incident repository
  - returns `null` when the web app is running fixture-only with no Supabase env

**Verification**: `npm test` — 24/24 pass

### Incident dashboard actions (Iter 42)

- Updated `web/src/features/OpsDashboard.tsx` to add incident status controls:
  - `Investigate`
  - `Waiting`
  - `Resolve`
- Wired the buttons to `actOnIncident()` behind the Supabase env gate
- Added local incident status state so the row reflects the returned status immediately after action

**Verification**: `npm test` — 24/24 pass

### Dashboard refresh after actions (Iter 43)

- Updated `web/src/app/AppShell.tsx` to expose a reusable dashboard reload path
- Wired `OpsDashboard` callbacks so both approval actions and incident actions reload snapshot/utilization data after success
- Updated `docs/planning/daily-plan.md` to mark incident actions with refresh complete

**Verification**: `npm test` — 24/24 pass

### README sync to implemented workflow (Iter 44)

- Updated `README.md` to reflect current `main` reality:
  - worker runs six jobs and supports scheduled mode
  - web dashboard now includes timeline drill-down, utilization, and approval/incident actions
  - `npm test` currently validates 24 automated tests
  - dashboard mutations require `VITE_SUPABASE_*` web env vars

**Verification**: docs-only sync against current implementation

### Phase 5 docs closeout (Iter 45)

- Updated `docs/planning/implementation-roadmap.md`:
  - marked Phase 5 complete
  - added Phase 6 planning around production mutation hardening
- Updated `docs/architecture/overview.md` to move dashboard incident actions from planned to implemented reality
- Updated `docs/runbooks/host-ops-daily.md` with the current incident workflow:
  - incident rows open the trip timeline
  - operators can Investigate / Waiting / Resolve directly in the dashboard
- Updated `docs/planning/daily-plan.md` to mark docs alignment complete and point next work at production actor identity

**Verification**: docs-only sync against current implementation

### Live browser-backed health check

- Added `browser-agent/src/classify.ts` to conservatively classify Turo page state from URL/title/body text
- Added `browser-agent/src/browser.ts` to snapshot minimal page metadata from a live Playwright page
- Upgraded `browser-agent` `health:smoke` to perform a live read-only Playwright navigation to `TURO_BASE_URL`
- `health:smoke` now returns:
  - whether a local storage state file exists
  - final URL
  - page title
  - conservative page classification (`authenticated`, `unauthenticated`, `unknown`)
- Browser is always closed after the check; no writes are performed
- Added tests for page classification and pre-launch runtime/state detection

**Verification**: `npm test` — 36/36 pass

### Read-only trip list scaffold

- Updated `browser-agent/src/runtime.ts` so browser-agent flows reuse the saved Playwright storage state when `browser-agent/storage/state.json` exists
- Added `browser-agent/src/flows/tripsList.ts` and wired a new `trips:list` CLI command
- Extended `browser-agent/src/browser.ts` with conservative trip-link extraction from the host trips page
- Added runtime and trip-extraction tests plus README updates for the new read-only command surface

**Verification**: `npm test` — 39/39 pass

### Live session check classification

- Upgraded `browser-agent/src/flows/sessionCheck.ts` from file-existence only to a live read-only session inspection
- `session:check` now reports `authenticated`, `stale_state`, `unknown`, or `missing_state`
- Added injectable inspection path for tests so session classification logic is covered without requiring a live browser login in CI
- Updated browser-agent README to document the more accurate session status contract

**Verification**: `npm test` — 43/43 pass

### Authenticated browser follow-up blocker

- Checked the local repo for `browser-agent/storage/state.json` after publishing PR #69 and confirmed it is missing
- Stopped before implementing trip-detail or richer authenticated extraction logic because there is no safe way to verify selectors against a logged-in Turo host session yet
- Updated planning docs so the next step is explicit: bootstrap a browser session, confirm `session:check` returns `authenticated`, then continue read-only extraction work

### Browser blocker docs sync (Iter 1 of rerun)

- Synced `main` after PR #69 merged and re-verified that `browser-agent/storage/state.json` is still absent locally
- Cleaned `docs/planning/daily-plan.md` so the current objective and next-step guidance point directly at the authenticated session bootstrap blocker
- Stopped the rerun after this docs iteration because the next implementation slice depends on a real logged-in browser session and cannot be safely verified without it

**Verification**: `test -f browser-agent/storage/state.json && echo STATE_PRESENT || echo STATE_MISSING` → `STATE_MISSING`

### Protected-route session check correction

- Updated `browser-agent-py/run` to prefer the repo-local `.venv/bin/python` when present so the checked-in wrapper can actually reuse the installed Playwright dependency during local verification
- Tightened `browser-agent-py` `session-check` so it verifies the protected host trips route instead of the public Turo homepage
- Added `checkedUrl` to the `session-check` JSON payload so the verification target is explicit in artifacts/output
- Updated browser-agent docs and the daily plan to reflect the corrected definition of an authenticated session
- Re-verified the current supposedly unblocked state and found it still redirects protected host routes to `/login`, so the browser follow-up remains blocked on a truly host-authenticated session

**Verification**:
- `./run session-check` → `status: login_required`, `checkedUrl: https://turo.com/us/en/trips`, final URL redirects to `/login`
- `BROWSER_AGENT_USE_CDP_ATTACH=true BROWSER_AGENT_CDP_URL=http://127.0.0.1:9222 ./run session-check` → still redirects protected route to `/login`
- `BROWSER_AGENT_USE_CDP_ATTACH=true BROWSER_AGENT_CDP_URL=http://127.0.0.1:9222 .venv/bin/python /tmp/check_host.py` → public host-tools page loads, but protected `/us/en/trips` and `/us/en/account` routes redirect to login

---

## 2026-03-24

### Read-only browser trip detail slice

- Added `browser-agent-py/src/turo_browser_agent/flows/trip_get.py`
  - accepts a reservation ID, reservation path, or full reservation URL
  - opens the reservation detail page read-only
  - returns `login_required` when the session is bounced to login
  - extracts a conservative structured summary plus screenshot/HTML artifacts when the page loads
- Added `browser-agent-py/src/turo_browser_agent/parsers.py`
  - shared trip-list normalization
  - reservation target resolution for `trip-get`
  - conservative trip-detail parsing from headings, badges, key lines, and page text
- Updated `browser-agent-py/src/turo_browser_agent/cli.py` so handlers receive trailing command arguments and wired the new `trip-get` command
- Hardened artifact capture so screenshot failures do not suppress HTML capture or the main workflow result
- Updated browser-agent docs plus repo planning/architecture docs to reflect that `trip-get` now exists and `messages-list` is the next read-only slice

### Verification

- `python3 -m unittest discover -s browser-agent-py/tests -p 'test_*.py'`

## 2026-03-25

### Shared page-state hardening

- Added `browser-agent-py/src/turo_browser_agent/page_state.py` with shared conservative detection helpers for login-required and blocked pages
- Wired the shared page-state helpers into:
  - `browser-agent-py/src/turo_browser_agent/flows/health_smoke.py`
  - `browser-agent-py/src/turo_browser_agent/flows/session_bootstrap.py`
  - `browser-agent-py/src/turo_browser_agent/flows/session_check.py`
  - `browser-agent-py/src/turo_browser_agent/flows/trips_list.py`
  - `browser-agent-py/src/turo_browser_agent/flows/trip_get.py`
- Added focused tests for login-required and blocked-page detection
- Synced browser-agent docs and the daily plan to reflect the shared hardening layer

### Verification

- `python3 -m unittest discover -s browser-agent-py/tests -p 'test_*.py'`

## 2026-03-27

### Read-only messages list slice

- Added `browser-agent-py/src/turo_browser_agent/flows/messages_list.py`
  - opens a conservative host messages URL read-only
  - reuses shared login-required and blocked-page detection
  - extracts a conservative structured thread summary plus screenshot/HTML artifacts when the page loads
- Added `normalize_message_thread` to `browser-agent-py/src/turo_browser_agent/parsers.py`
  - keeps thread title, guest, reservation id, unread flag, and raw text together
- Wired `messages-list` into `browser-agent-py/src/turo_browser_agent/cli.py`
- Updated browser-agent docs and the repo docs to reflect the new messages-list command surface
- Added parser and CLI coverage for the new command

### Verification

- `python3 -m unittest discover -s browser-agent-py/tests -p 'test_*.py'`

## 2026-03-27

### Web actor identity source

- Added `web/src/lib/operatorIdentity.ts` to centralize the web mutation actor identity source from `VITE_OPERATOR_IDENTITY`
- Updated approval and incident action helpers to use the shared operator identity source when present
- Updated `OpsDashboard` to stop hardcoding `web.reviewer` and to disable approval/incident mutations when identity or Supabase config is missing
- Documented the new `VITE_OPERATOR_IDENTITY` env var in `.env.example`
- Advanced the roadmap to mark the actor identity slice complete and move the next priority to explicit guest-send safety

### Verification

- `npm run build`
- `npm test`

## 2026-03-27

### Milestone 2 host-module skeleton

- Created `browser-agent-py/src/turo_browser_agent/modules/` and grouped the existing browser flows by host-aligned ownership:
  - `modules/core/` for `health:smoke`, `session:bootstrap`, and `session:check`
  - `modules/trips/` for `trips:list` and `trip-get`
  - `modules/inbox/` for `messages:list`
- Added scaffold packages for the next Milestone 2 pages:
  - `modules/calendar/`
  - `modules/vehicles/`
  - `modules/business/`
  - `modules/more/`
  - `modules/user_profile/`
  - `modules/switch_to_guest/`
- Updated `browser-agent-py/src/turo_browser_agent/cli.py` to import from the new module packages
- Left `browser-agent-py/src/turo_browser_agent/flows/` as compatibility shims so the existing command surface stays stable during the migration
- Updated browser-agent docs and repo planning docs to describe the module layout and current Milestone 2 position

### Verification

- Not yet run. Code is staged for focused browser-agent test verification next.

## 2026-03-27

### Explicit guest-send path

- Added `shared/src/application/index.ts::createSendApprovedMessageDraftsUseCase` to transition approved drafts from `ready_for_review` to `sent`
- Added `worker/src/jobs/runSendApprovedMessageDraftsJob.ts` and wired it into `worker/src/app/createWorkerApp.ts` behind the explicit `WORKER_SEND_APPROVED_DRAFTS` gate
- Added migration `supabase/migrations/0003_turo_ops_send_approved_message_drafts.sql` so `job_runs.job_name` accepts the new explicit send job
- Added a shared contract test proving approved drafts transition to sent and update their thread state
- Updated docs and environment examples to describe the explicit send gate and the new next-priority boundary decision

### Verification

- `npm run build`
- `npm test`

### Web Supabase boundary centralization

- Added `web/src/lib/supabaseClient.ts` to centralize web Supabase config parsing and client creation
- Updated the web approval, incident, snapshot, trip timeline, utilization, and dashboard mutation paths to reuse the shared helper and explicit gating
- Kept the direct-to-Supabase boundary intentionally narrow so it can be swapped later if an API layer becomes necessary

### Verification

- `npm run build`
- `npm test`

### Web Supabase helper coverage

- Added env-driven helper exports in `web/src/lib/supabaseClient.ts` so the gating logic can be tested without depending on Vite runtime globals
- Added `web/test/supabaseClient.test.ts` to cover config parsing, gating, and client creation
- Updated the root `npm test` script to run the new TS test file through `tsx`

### Verification

- `npm test`

## 2026-03-29

### Phase 7 roadmap closeout

- Updated `docs/planning/implementation-roadmap.md` to mark Phase 7 slices 1–5 complete — all browser-agent module work was already landed in PRs #103–#106; only the ✓ markers were missing
- Updated `docs/plan.md` to replace the stale "Next Implementation Plan" (Supabase adapters were done in 2026-03-21) with current-state documentation across all phases and accurate next-step guidance
- Updated `docs/planning/daily-plan.md` to record the Phase 7 closeout and sharpen the next suggested step

**Verification**: docs-only sync against current `main` implementation; no code changes

**Blockers**: browser-agent further read-only extraction requires a real authenticated host session past Turo's blocking layer
