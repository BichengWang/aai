# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-21

## Objective
Move to Phase 2: real notifications and the approval workflow.

## Completed (Phase 1)
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
- [x] 8/8 automated tests pass
- [x] README with setup instructions and adapter mode table
- [x] Architecture docs updated

## Today's Priorities (Phase 2 start)
- [ ] Add approval action to the web dashboard (approve/reject a pending draft)
- [ ] Add `ApprovalRepository` mutation method (or reuse `saveApprovalRequests`) for state transitions
- [ ] Define a minimal web API module for approval actions backed by Supabase
- [ ] Add Slack notification when an approval is acted on
- [ ] Keep Playwright out of the critical path

## Risks / Open Questions
- Should approval actions be a direct Supabase client call from the web, or go through a worker endpoint?
- When does the message draft actually get sent (guest-facing channel send)?
- What user identity/auth is used for the `reviewedBy` field on approval requests?

## Next Suggested Step
Add an `ApproveMessageDraft` use-case and wire an approval action button in the web dashboard that calls it directly via the Supabase client.
