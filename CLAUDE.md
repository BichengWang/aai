# CLAUDE.md

Project-specific operating notes for `altair-ai-llc`, especially the Turo automation loop.

## Turo Automation Loop Rules

- The runbook source of truth is `turo-automation/docs/runbooks/ai-workflow-loop.md`.
- For this project, the loop should **never stop silently**. If it stops before the requested batch finishes, restart it unless KW explicitly says to stop.
- Use GitHub merged PR state as the source of truth for progress, not only local process state.
- `Done` means merged into `main`, not local changes and not an open PR.
- Keep increments small, reviewable, and high quality.

## Review and Verification Preference

KW explicitly prefers the following for this project:
- prioritize **concise, careful code review**
- prioritize **n2n / end-to-end testing**
- do **not** default to unit tests unless there is a specific reason

Implication:
- before publishing a PR, perform a concise self-review for scope, correctness, unintended diffs, and merge readiness
- prefer validating real workflow behavior over adding unit-test-only coverage
- avoid padding PRs with low-value tests when direct end-to-end verification is the better signal

## Reporting Expectations in `#turo-automation`

- If the loop is running, report concise status with landed count and current state.
- If the loop stops, report that clearly and restart it.
- If asked for status, answer with the exact landed count and whether the active session is still running.
- Do not say work is continuing unless the live process or merged PR state confirms it.

## Lessons From 2026-03-25 Channel Conversation

- A prior loop only landed 2 PRs when 10 more were expected; this caused justified frustration.
- Another loop run landed 3 PRs (`#73`, `#74`, `#75`) and then exited unexpectedly.
- Reliability and continuity matter as much as code quality here.
- Missing status updates create confusion even when a process is still alive.
- When in doubt, give the blunt count: landed, remaining, current session state, and blocker if any.

## Practical Defaults

- Sync local `main` from `origin/main` before continuing an interrupted loop.
- Prefer the smallest complete slice that can merge cleanly into `main`.
- Avoid unrelated diffs from temp clones or stale workspace state; verify the patch scope before creating the PR.
- Use system git identity as-is; never add co-authors or override author metadata.
