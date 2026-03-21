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
