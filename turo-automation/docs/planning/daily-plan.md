# Daily Plan

Use this file for the current working plan. Keep it short, current, and actionable.

## Date
2026-03-21

## Objective
Move `turo-automation` from fixture-backed contracts to real persistence-backed adapters in small, reviewable slices.

## Today's Priorities
- [x] Save the host mode plan into the subtree
- [x] Create shared domain, ports, fixtures, and use-case contracts
- [x] Refactor the web shell to consume `TodayOpsSnapshot`
- [x] Refactor the worker to run fixture-backed contract jobs
- [x] Add build and contract-test verification
- [x] Add missing persistence schema slices for incidents, message threads, message drafts, approval requests, and job runs / audit trail
- [x] Implement Supabase-backed repository adapters for trips, tasks, incidents, messages, approvals, and job runs (in `shared/src/adapters/supabase/`)
- [x] Replace web fixture loading with repository-backed reads that still return `TodayOpsSnapshot` (env-gated: `VITE_SUPABASE_URL`)
- [x] Replace worker fixture adapters with Supabase persistence adapters (env-gated: `SUPABASE_URL`)
- [ ] Implement real Slack notifier adapter to replace noop stub
- [ ] Implement real trip import-source adapter (CSV / Turo export)
- [ ] Add `.env.example` with required environment variable documentation
- [ ] Keep Playwright out of the critical path until the persistence-backed operator workflow is stable

## Candidate MVP Workflows
1. Upcoming pickup / return dashboard
2. Auto-generated ops tasks per trip
3. Guest message drafting and approval
4. Late return / issue alerting in Slack
5. Daily team summary

## Risks / Open Questions
- Slack webhook URL / channel configuration for the notifier adapter
- Which trip import format: CSV export from Turo, manual entry, or API?
- When should supervised Playwright be introduced as an optional adapter?

## Next Suggested Step
Wire the Slack notifier adapter using an incoming webhook URL from a `SLACK_WEBHOOK_URL` env var. This unblocks real approval notifications and the daily digest.
