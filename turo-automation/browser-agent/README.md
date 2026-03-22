# Browser Agent

Playwright-first browser automation package for `turo-automation`.

## Initial command surface

- `health:smoke`
- `session:bootstrap`
- `session:check`

## MVP rules

- read-only first
- persist auth state locally
- isolate browser selectors and session logic from `web/` and `worker/`
- do not enable guest-facing writes in the first implementation slice
