# Turo Web Automation

Minimal, safety-first web automation architecture for Turo host workflows.

## Goal

Build a small, reliable automation layer for a Turo host web workflow using browser automation first, with a path to later wrap it as an OpenClaw skill.

## MVP Principles

- Start read-only
- Persist authenticated browser session
- Return structured JSON for every workflow
- Keep writes behind explicit confirmation
- Prefer stability over breadth

## MVP Scope

Phase 1 focuses on:

- session bootstrap and reuse
- health check / login state detection
- list upcoming trips
- fetch trip details
- list unread or recent guest messages
- generate Slack/OpenClaw-friendly summaries

## Proposed Stack

- Playwright
- TypeScript + Node.js
- JSON-based workflow outputs
- local session storage under `storage/`
- local artifacts under `artifacts/`
- optional SQLite later for run history

## Project Layout

```text
src/
  config/
  core/
  flows/
  parsers/
  schemas/
  cli/
  prompts/
storage/
artifacts/
docs/
```

See `docs/ARCHITECTURE.md` and `docs/DEV_PLAN.md` for details.
