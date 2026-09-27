# Minimal Turo Web Automation Architecture

## Objective

Provide a reliable automation foundation for Turo host web workflows with a strong safety bias:

- read-first
- reusable login session
- composable browser flows
- deterministic JSON output
- clean upgrade path to an OpenClaw skill

## Architecture Overview

```text
User / Scheduler / OpenClaw
          |
          v
      CLI entrypoints
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

## Core Components

### 1. CLI layer

Purpose:
- provide simple commands for local invocation and future agent use
- keep command surface narrow and task-oriented

Initial commands:
- `session:bootstrap`
- `session:check`
- `trips:list`
- `trips:get --trip-id <id>`
- `messages:list`
- `health:smoke`

### 2. Session layer

Purpose:
- launch Playwright in persistent or semi-persistent mode
- reuse authenticated state across runs
- detect expired sessions and interactive blockers

Responsibilities:
- manage browser context
- load/save `storage/state.json`
- standardize browser launch config
- expose helper methods such as:
  - `ensureAuthenticated()`
  - `gotoWithRetry()`
  - `captureArtifact()`

### 3. Flow layer

Purpose:
- implement stable workflow units
- isolate business workflows from page details

Initial flows:
- `bootstrapSessionFlow`
- `checkSessionFlow`
- `listTripsFlow`
- `getTripDetailFlow`
- `listMessagesFlow`

Each flow should:
- navigate to a specific page
- verify expected UI markers
- extract normalized data
- return typed results

### 4. Parser layer

Purpose:
- translate DOM/UI state into normalized models
- reduce selector sprawl in flow orchestration code

Models:
- `TripSummary`
- `TripDetail`
- `GuestMessageSummary`
- `SessionStatus`

### 5. Output layer

Purpose:
- return machine-friendly and human-friendly results

Output contract:
- `ok: boolean`
- `workflow: string`
- `timestamp: string`
- `data: ...`
- `warnings?: string[]`
- `artifacts?: string[]`

Artifacts:
- screenshot on failure
- raw HTML snapshot optionally
- trace/video only when debugging

## Data Storage

### Local only in MVP

- `storage/state.json` for browser auth state
- `artifacts/` for screenshots and debugging files
- `logs/` optional later

### Optional phase 2+

Introduce SQLite for:
- run history
- deduplication of previously seen messages
- alert suppression windows

## Safety Model

### Default operating mode
Read-only.

### Write workflows later
Potential future write flows:
- send guest message
- block/unblock calendar dates
- update price

Guardrails for writes:
- dry-run preview
- explicit `--confirm`
- action logging
- before/after screenshot capture

## Reliability Strategy

### Selector strategy
Prefer, in order:
1. semantic labels / ARIA roles
2. stable href/path patterns
3. visible text anchors near target data
4. CSS selectors as fallback only

### Anti-fragility
- centralize selectors
- add page assertions before extraction
- fail loudly when expected sections disappear
- save artifacts for diagnosis

### Human-in-the-loop points
- first login / MFA
- captcha or bot challenge
- expired session requiring reauth
- any future write action

## Suggested Initial Workflows

### A. Session bootstrap
1. open browser in headed mode
2. navigate to Turo login
3. user logs in manually
4. script verifies authenticated landing page
5. save session state

### B. Session check
1. open browser with saved state
2. navigate to host dashboard or trips page
3. determine auth state
4. return health result

### C. List upcoming trips
1. navigate to trips/reservations page
2. assert page loaded
3. parse trip cards / rows
4. normalize into `TripSummary[]`

### D. Get trip detail
1. open trip detail page by URL or from listing
2. parse guest, vehicle, start/end, location, status
3. return `TripDetail`

### E. List recent messages
1. navigate to inbox/messages
2. parse thread summaries
3. optionally expand a thread later
4. return normalized message summaries

## OpenClaw Skill Path

Once the CLI is stable, wrap it in an OpenClaw skill such as `turo-host`:

- `list upcoming trips`
- `show unread messages`
- `get trip <id>`
- later: `draft reply`, `send reply`, `update pricing`

In that model, OpenClaw becomes the orchestration and conversational layer, while Playwright remains the execution engine.

## Non-Goals for MVP

- full host operations coverage
- price optimization logic
- automatic messaging without review
- high-frequency scraping
- defeating anti-bot systems

## Definition of Done for MVP

The MVP is successful when we can reliably:

- bootstrap a session once
- reuse the session later
- check auth health
- list upcoming trips in JSON
- get a single trip detail in JSON
- list recent/unread messages in JSON
- capture enough artifacts to debug failures
