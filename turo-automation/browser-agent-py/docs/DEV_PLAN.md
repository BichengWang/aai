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

Current status:
- `trips-list` is implemented and extracts reservation cards from the real host trips page
- `trip-get` is implemented as a conservative reservation detail fetch by reservation ID or URL
- shared page-state helpers now centralize login-required and blocked-page detection across the read-only flows
- `messages-list` remains the next read-only flow after trip detail hardening

## Phase 3 — Hardening

- screenshots on failure
- selector centralization
- parser tests where feasible
- concise operator-friendly summaries
