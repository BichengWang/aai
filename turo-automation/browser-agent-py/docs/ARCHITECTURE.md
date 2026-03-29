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

## Module Layout

The Python package is organized around the host navigation surface:

- `modules/core/` - health and session bootstrap / verification
- `modules/calendar/` - calendar-system read-only summary flow
- `modules/trips/` - trip list and trip detail read models
- `modules/inbox/` - inbox thread summaries
- `modules/vehicles/`, `modules/business/`, `modules/more/`, `modules/user_profile/`, and `modules/switch_to_guest/` - scaffolded for future Milestone 2 slices

The legacy `flows/` package remains as a compatibility layer while the new module paths settle.

## Initial command surface

- `health-smoke`
- `calendar-list`
- `session-bootstrap`
- `session-check`
- `trips-list`
- `trip-get`
- `messages-list`

The `calendar-list` flow is now available as a conservative read-only calendar summary command, and the current implementation lives under `modules/calendar/list.py`. In the current environment it returns `blocked` when Turo blocks the session.

The `messages-list` flow is now available as a conservative read-only inbox/thread summary command, and the current implementation lives under `modules/inbox/list.py`.

Shared page-state helpers keep login-required and blocked-page detection consistent across the read-only flows, a shared body-text capture helper keeps transient render failures from hard-failing the commands, shared JS fragments centralize the common main-scope and text-cleanup setup used by the read-only extractors, calendar/trip/message parsing emit concise summary fields, trip and message parsing can recover a guest name from a prefixed title with trailing context, and all read-only flows capture failure screenshots/HTML before returning unexpected errors.

For operator-facing auth and login guidance, see `docs/AUTH_RUNBOOK.md`.

## Storage

- `storage/state.json` for browser auth state
- `artifacts/` for screenshots and debugging output

## Safety model

Default operating mode is read-only.
Any future write action should require dry-run preview, explicit confirmation, and before/after artifact capture.
