# OpenClaw Skill Direction

This project should stay execution-first.

Meaning:
- build and validate the Playwright/CLI automation layer first
- wrap it as an OpenClaw skill only after the read-only flows are stable

## Candidate skill surface

Skill name: `turo-host`

Initial intents:
- list upcoming trips
- get trip detail
- list unread or recent messages
- check session health

Write intents later:
- draft reply
- send reply with confirmation
- block dates
- update pricing

## Why defer the skill wrapper

The unstable part is not the conversational layer; it is the browser workflow and selectors. The wrapper should come after the execution layer is trusted.
