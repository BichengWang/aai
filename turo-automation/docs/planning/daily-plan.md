# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-29

## Objective
Continue Milestone 2 by adding the first vehicles-system read-only flow after the browser-agent calendar module.

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
- [x] Failure artifact capture across all browser-agent read-only flows
- [x] Browser-agent host-module skeleton: `core`, `trips`, `inbox`, plus scaffolded `calendar`, `business`, `more`, `user_profile`, and `switch_to_guest` packages
- [x] Browser-agent calendar read-only flow: `calendar:list`
- [x] Browser-agent vehicles read-only flow: `vehicles:list`

## Today's Priorities
- [x] Close the first browser-agent batch with 10 merged PRs (#83–#92)
- [x] Create the Milestone 2 module plan aligned to the Turo host page structure
- [x] Refactor current trips/inbox/session flows into explicit module ownership
- [x] Start the Milestone 2 development loop with the first new page coverage slice
- [x] Add the first vehicles-system read-only slice

## Risks / Open Questions
- Does the live host session resolve `https://turo.com/us/en/calendar`, or should the calendar flow discover the page via navigation?
- Which module should follow vehicles: profile or business?
- How much command-surface compatibility should be preserved while moving flows into explicit module boundaries?

## Next Suggested Step
Verify the new vehicles flow on a real logged-in host session, then move to the next Milestone 2 page module once the route and extraction shape are confirmed.
