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
- later: `trips-list`, `trip-get`, `messages-list`

## Storage

- `storage/state.json` for browser auth state
- `artifacts/` for screenshots and debugging output

## Safety model

Default operating mode is read-only.
Any future write action should require dry-run preview, explicit confirmation, and before/after artifact capture.
