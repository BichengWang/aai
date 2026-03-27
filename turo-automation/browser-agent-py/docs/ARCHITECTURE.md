# Browser Agent Python Architecture

## Objective

Provide a reliable automation foundation for Turo host web workflows with a strong safety bias:

- read-first
- reusable login session
- composable browser flows
- deterministic JSON output
- clean upgrade path to a richer operator workflow

## Architecture Overview

```text
User / Scheduler / OpenClaw
          |
          v
      Python CLI entrypoints
          |
          v
   Flow orchestrators (use-case layer)
          |
          v
 Browser session + navigation helpers
          |
          v
   Page extractors / action adapters
          |
          v
 Structured JSON output + artifacts
```

## Initial command surface

- `health-smoke`
- `session-bootstrap`
- `session-check`
- `trips-list`
- `trip-get`
- `messages-list`

The `messages-list` flow is now available as a conservative read-only inbox/thread summary command.

Shared page-state helpers keep login-required and blocked-page detection consistent across the read-only flows, a shared body-text capture helper keeps transient render failures from hard-failing the commands, shared JS fragments centralize the common main-scope and text-cleanup setup used by the trip/message extractors, and all read-only flows capture failure screenshots/HTML before returning unexpected errors.

For operator-facing auth and login guidance, see `docs/AUTH_RUNBOOK.md`.

## Storage

- `storage/state.json` for browser auth state
- `artifacts/` for screenshots and debugging output

## Safety model

Default operating mode is read-only.
Any future write action should require dry-run preview, explicit confirmation, and before/after artifact capture.
