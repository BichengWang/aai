# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-27

## Objective
Harden web mutation actor identity before broader guest-send automation.

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
- [x] 23/23 automated tests pass
- [x] README with setup instructions and adapter mode table
- [x] Architecture docs updated

## Today's Priorities
- [x] Replace placeholder `web.reviewer` actor strings with a defined operator identity source
- [ ] Define the explicit guest-send path after approval
- [ ] Decide whether web mutations stay direct-to-Supabase or move behind an API/worker boundary

## Risks / Open Questions
- Should incident actions remain direct Supabase client calls from the web, or move behind a worker/API boundary later?
- When does an approved message draft actually get sent on the guest-facing channel?
- What should production set `VITE_OPERATOR_IDENTITY` to, and should it later come from auth context instead of build-time config?

## Next Suggested Step
Define the explicit guest-send path after approval, then decide whether web mutations stay direct-to-Supabase or move behind an API/worker boundary.
