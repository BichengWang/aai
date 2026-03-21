# Turo Automation Plan

## Current Baseline
- `shared` now owns domain models, ports, fixture data, and use-case contracts
- `web` renders the host dashboard through `TodayOpsSnapshot`
- `worker` runs fixture-backed jobs through the shared interfaces
- build and contract tests pass locally

## Next Objective
Replace fixture-backed reads and jobs with real adapters while preserving the shared interfaces introduced in the first architecture PR.

## Next Implementation Plan
1. Add the missing persistence schema slices for:
   - incidents
   - message threads and message drafts
   - approval requests
   - job runs / audit trail
2. Implement Supabase-backed repository adapters for:
   - trips
   - tasks
   - incidents
   - messages and approvals
   - job runs
3. Replace the web fixture loader with repository-backed reads that still return `TodayOpsSnapshot`
4. Replace worker fixture adapters with:
   - persistence adapters
   - notifier adapter
   - import-source adapter
5. Keep Playwright out of the critical path until the persistence-backed operator workflow is stable

## Acceptance Criteria
- the dashboard reads from real stored data instead of fixtures
- the worker persists job outputs and incidents through repository adapters
- shared contracts do not need to change during adapter wiring
- `npm run build` and `npm test` continue to pass

## Constraints
- keep the existing `web` / `worker` / `shared` package topology
- do not introduce unattended Turo interaction
- keep guest-facing communication approval-gated
- prefer reviewable PR slices over broad integration work
