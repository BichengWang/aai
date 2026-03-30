# Turo Automation Plan

## Current Baseline
- `shared` now owns domain models, ports, fixture data, and use-case contracts
- `web` renders the host dashboard through `TodayOpsSnapshot`
- `worker` runs fixture-backed jobs through the shared interfaces
- build and contract tests pass locally

## Current State
All Phases 0–7 are complete. The TypeScript web/worker/shared stack is production-ready with Supabase-backed persistence, and `browser-agent-py/` covers read-only host flows through Phase 7.

### TypeScript stack (complete)
- Supabase-backed repositories for all entities (trips, tasks, incidents, messages, approvals, job runs)
- Env-gated worker (Supabase mode / fixture fallback) with six scheduled jobs
- Env-gated web dashboard with timeline, utilization, approval, and incident actions
- Explicit guest-send path with `WORKER_SEND_APPROVED_DRAFTS` gate
- Operator identity sourced from `VITE_OPERATOR_IDENTITY`

### Browser agent (`browser-agent-py/`, complete through Phase 7)
- `modules/core/` — `health:smoke`, `session:bootstrap`, `session:check`
- `modules/trips/` — `trips:list`, `trip-get`
- `modules/inbox/` — `messages-list`
- `modules/calendar/` — `calendar:list`
- `modules/vehicles/` — `vehicles:list`
- `modules/user_profile/` — `profile-check`
- `modules/business/`, `modules/more/`, `modules/switch_to_guest/` — scaffolded, docs-only (blocked in saved session)

## Next Steps
- Browser agent: wait for a real authenticated host session that can get past Turo's blocking layer before adding further read-only extraction flows.
- TypeScript stack: identify Phase 8 priorities (e.g., richer trip-import source, API layer, or production deployment hardening) once operational usage reveals new gaps.

## Constraints

## Constraints
- keep the existing `web` / `worker` / `shared` package topology
- do not introduce unattended Turo interaction
- keep guest-facing communication approval-gated
- prefer reviewable PR slices over broad integration work
- before sending a PR, do a brief self-review of the final diff
- when opening PRs from the workflow loop, target `main` and add `--label auto-merge`
- treat work as done only after it is merged into `main`
