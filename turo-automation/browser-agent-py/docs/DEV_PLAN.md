# Browser Agent Python Dev Plan

## Phase 0 — Foundation

- scaffold executable Python package
- define JSON output contracts
- establish storage/artifact conventions
- keep runtime preparation separate from browser-specific code

## Phase 1 — Session management

- implement manual login bootstrap in headed mode
- persist authenticated browser state
- add an authenticated session check

## Phase 2 — Read-only flows

- `trips-list`
- `trip-get`
- `messages-list`

## Phase 3 — Hardening

- screenshots on failure
- selector centralization
- parser tests where feasible
- concise operator-friendly summaries
