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
- `messages-list` is implemented as a conservative read-only inbox/thread summary flow
- shared body-text capture now falls back cleanly when a page render is slow or the locator times out, so live flows keep returning structured output with warnings instead of hard-failing
- all read-only browser-agent flows now capture failure screenshots and HTML artifacts before returning unexpected errors
- trip-detail parsing now accepts unlabeled pickup/return date lines with an optional `at`
- shared JS fragments now centralize the common `main`-scope and text-cleanup setup used by the read-only extractors
- trip-list parsing now emits a concise operator summary alongside the structured fields
- trip-detail parsing now emits a concise operator summary alongside the structured fields
- message-thread parsing now emits a concise operator summary alongside the structured fields
- trip-card parsing now recovers a guest name from a prefixed title with trailing vehicle/context text
- message-thread parsing now recovers a guest name from a prefixed title with trailing vehicle/context text

## Phase 3 — Hardening

- screenshots on failure
- selector centralization
- parser tests where feasible
- concise operator-friendly summaries
