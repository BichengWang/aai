# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-27

## Objective
Move the highest-priority read-only browser-assist flows forward so live host session work can be verified on real Turo pages while the dashboard/worker stack stays stable.

## Completed
- [x] Shared domain, ports, fixtures, and use-case contracts
- [x] Fixture-backed ops dashboard shell (web)
- [x] Fixture-backed worker job runner
- [x] Supabase migration 0001: vehicles, guests, trips, tasks
- [x] Supabase migration 0002: incidents, trip_events, message_threads, message_drafts, approval_requests, job_runs
- [x] Supabase-backed repository adapters for all entities (in `shared/src/adapters/supabase/`)
- [x] VehicleRepository + GuestRepository ports + Supabase adapters
- [x] Import use-case upserts guests/vehicles when repos provided (fixes FK constraint gap)
- [x] Worker env-gated: `SUPABASE_URL` → Supabase mode; absent → fixture mode
- [x] Web env-gated: `VITE_SUPABASE_URL` → Supabase snapshot; absent → fixture snapshot
- [x] Slack notifier adapter (`SLACK_WEBHOOK_URL`)
- [x] CSV trip import adapter (`TRIP_IMPORT_CSV_PATH`)
- [x] `.env.example` with all required env vars
- [x] Approval action in the web dashboard (approve/reject pending draft)
- [x] Message template rendering for draft bodies
- [x] Scheduled worker mode with retry handling
- [x] Trip timeline side panel in the web dashboard
- [x] Vehicle utilization panel in the web dashboard
- [x] Centralized direct web Supabase mutation boundary with helper coverage
- [x] Browser agent read-only flows: `health:smoke`, `session:bootstrap`, `session:check`, `trips:list`, `trip-get`, `messages-list`
- [x] Architecture and workflow docs updated through PR #82 closeout
- [x] Shared safe browser body-text capture helper across browser-agent live flows
- [x] Failure artifact capture for `health:smoke` and `session:check`

## Today's Priorities
- [ ] Start the next 10-PR batch on browser-agent hardening, not new guest-facing capability
- [ ] Keep the next increments read-only and centered on live-session verification, parser resilience, artifact quality, and operator usability
- [ ] Prefer the smallest complete slices that can be tested locally and merged directly into `main`
- [ ] Keep the repo docs synchronized with the implemented browser-agent behavior after each merge

## Risks / Open Questions
- Which browser-agent read model is the next highest-value addition after trips, trip detail, and messages list?
- Are there any weak spots in live-session verification or parser robustness that should be fixed before adding more surface area?
- When should browser-agent outputs begin feeding the dashboard/worker stack, and what proof should be required first?

## Next Suggested Step
Use repo truth to select the next browser-agent batch, starting with the smallest high-signal read-only improvements around selector centralization, parser resilience, and artifact/operator ergonomics.
