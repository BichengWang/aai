# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-27

## Objective
Harden and verify the centralized direct-to-Supabase web boundary before any future API split.

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
- [x] Define the explicit guest-send path after approval
- [x] Decide whether web mutations stay direct-to-Supabase or move behind an API/worker boundary
- [x] Add lightweight coverage for the centralized web Supabase boundary helper

## Risks / Open Questions
- What shape should future API/worker boundary coverage take if the direct web Supabase client becomes a liability?
- Should the explicit send gate stay an env flag, or move to a manual admin action in the dashboard later?
- Is there any remaining direct web mutation work, or is the current boundary stable enough to leave alone until a future split is justified?

## Next Suggested Step
Keep the current direct-to-Supabase web boundary in place and revisit only if a future API split becomes clearly justified.
