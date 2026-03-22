# Dev Plan

## Phase 0 — Foundation

### Deliverables
- repo subtree scaffold
- architecture docs
- runtime/env conventions
- initial command surface definition

### Tasks
- create folder structure
- define output schemas
- decide Node.js + TypeScript baseline
- add Playwright dependency
- add `.env.example`

## Phase 1 — Session Management

### Goal
Support one-time interactive login and later session reuse.

### Deliverables
- browser bootstrap command
- persisted auth state
- session health check command

### Acceptance criteria
- manual login can be completed once
- subsequent runs detect authenticated state without relogin
- expired sessions return actionable error states

## Phase 2 — Read-Only Flows

### Goal
Extract the highest-value host data.

### Deliverables
- `trips:list`
- `trips:get`
- `messages:list`

### Acceptance criteria
- outputs are valid JSON
- failures save screenshots
- selectors are centralized and documented

## Phase 3 — Summaries / Integration Layer

### Goal
Make outputs useful for agent workflows.

### Deliverables
- concise human summaries
- machine-readable JSON
- optional formatter for Slack/OpenClaw usage

### Acceptance criteria
- each flow supports machine + human output modes
- errors are concise and diagnosable

## Phase 4 — Hardening

### Goal
Improve resilience and maintainability.

### Deliverables
- smoke tests around navigation helpers
- parser unit tests for normalization logic where feasible
- retry policy tuning
- artifact conventions

## Phase 5 — Optional Write Flows

### Goal
Introduce guarded operational actions.

### Candidate actions
- draft/send guest message
- block dates
- unblock dates
- update pricing

### Guardrails
- dry-run first
- explicit confirm flag
- audit log
- before/after capture

## Technical Decisions

### Runtime
- Node.js
- TypeScript
- Playwright

### Why this stack
- Playwright is strong for authenticated web apps
- TypeScript gives structure for JSON contracts and flow outputs
- Node ecosystem is good for CLI packaging and future OpenClaw wrapping

## Proposed Milestone Sequence

1. docs + scaffold
2. session bootstrap/check
3. trips listing
4. trip detail
5. messages listing
6. summary formatter
7. optional OpenClaw wrapper skill

## Risks

- MFA / CAPTCHA interrupts unattended runs
- Turo UI changes may break selectors
- legal/policy boundaries for automation must be respected
- hidden API calls may change without notice

## Recommended Next Build Slice

Implement these first:

1. project bootstrap (`package.json`, tsconfig, Playwright)
2. `session:bootstrap`
3. `session:check`
4. `health:smoke`

That creates the platform needed before extracting Turo-specific workflows.
