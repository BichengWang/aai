# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-25

## Objective
Harden the read-only `browser-agent-py` reservation detail slice and operator output while live host-session verification remains unavailable.

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
- [x] Verify browser auth on a protected host route instead of the public homepage
- [x] Add a conservative read-only `trip-get` reservation detail flow in `browser-agent-py`
- [x] Add focused parser/CLI coverage for the new `trip-get` slice
- [x] Keep browser-agent docs aligned with implemented command behavior
- [x] Normalize `trip-get` guest names to return operator-ready values instead of raw `Guest:` labels
- [x] Normalize `trip-get` pickup and return values to consistent operator-ready timestamps
- [x] Normalize labeled reservation-detail location lines to operator-ready location values
- [ ] Keep Playwright out of the critical path
- [ ] Re-attach the browser-agent to a truly host-authenticated Chrome session for live selector verification

## Risks / Open Questions
- Should incident actions remain direct Supabase client calls from the web, or move behind a worker/API boundary later?
- What actor identity should own `reviewedBy` and incident `ownerId` in production?
- When does an approved message draft actually get sent on the guest-facing channel?
- Browser-agent authenticated extraction still depends on a real host-logged-in browser session for live selector verification; unit coverage only hardens parser behavior and CLI wiring.

## Next Suggested Step
Continue landing offline parser and output-hardening slices that do not depend on live auth, then re-attach the browser-agent to a truly host-authenticated Chrome session before implementing `messages-list`.
