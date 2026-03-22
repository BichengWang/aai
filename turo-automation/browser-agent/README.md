# Browser Agent

Playwright-first browser automation package for `turo-automation`.

## Initial command surface

- `health:smoke`
- `session:bootstrap`
- `session:check`
- `trips:list`

## Current behavior

- `health:smoke` performs a live read-only navigation and classifies the resulting page
- `session:check` now performs a live read-only session check and reports `authenticated`, `stale_state`, `unknown`, or `missing_state`
- `trips:list` performs a live read-only navigation to the host trips page and extracts conservative trip link summaries when available
- all live commands reuse the local storage-state file when it exists

## MVP rules

- read-only first
- persist auth state locally
- isolate browser selectors and session logic from `web/` and `worker/`
- do not enable guest-facing writes in the first implementation slice
