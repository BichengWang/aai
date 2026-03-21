# AI Workflow - Development Loop

Run when previous PR merged into main.

## Mission
Advance exactly one highest-priority, ready-to-execute development increment. Prefer continuing existing in-flight work. Only start a new branch and PR when no suitable active PR already exists.

## Source of Truth
Review these first:
- `docs/planning/daily-plan.md`
- `docs/logs/dev-log.md`
- `docs/product/mvp-spec.md`
- `docs/architecture/overview.md`
- current git status, recent commits, local branches, and open PRs

## Open-Claw Execution Mode
When executing this runbook, do not stop for routine clarification.

Self-ask any missing question, then self-answer from available evidence:
- repo state
- docs
- git history
- open PR state
- test results

Only surface a blocker when the answer cannot be derived safely, such as:
- missing credentials or permissions
- external service failure
- destructive action that should not be assumed
- conflicting source-of-truth documents

If an answer is uncertain but actionable, choose the safest reasonable path and record the assumption in the output.

## Decision Rules
1. Work on one priority at a time.
2. Continue an existing branch or PR if it matches the highest-priority ready task.
3. Start a new branch only if no matching in-flight PR exists.
4. Prefer the smallest complete increment that can be verified and reviewed.
5. Do not claim progress unless the work is implemented and verified.
6. If nothing is ready to implement, update plans and docs instead of forcing code changes.

## Execution Loop
1. Gather state
   - Review the source-of-truth docs.
   - Check git status, recent commits, active branch, and open PRs.
   - Identify unfinished work, blockers, and dependencies.
2. Select the task
   - Pick the single highest-priority task that is ready now.
   - Prefer continuing the current active PR if it still maps to that task.
3. Prepare the branch
   - If continuing existing work, stay on that branch.
   - If starting new work, create a branch:
     ```sh
     git switch -c <branch-name>
     ```
4. Implement
   - Make the smallest meaningful code or docs change that moves the selected task forward.
   - Keep scope tight and avoid unrelated edits.
5. Verify
   - Run the relevant checks and tests for the change.
   - Fix obvious regressions caused by the work.
   - Perform a brief self-review for correctness, edge cases, and unintended side effects.
6. Sync docs
   - Update `docs/` to match implemented reality.
   - Typical updates include:
     - `docs/planning/daily-plan.md`
     - `docs/logs/dev-log.md`
     - `docs/architecture/overview.md`
     - `docs/product/mvp-spec.md`
7. Publish
   - If the increment is reviewable, commit it:
     ```sh
     git add -A
     git commit -m "<commit-message>"
     ```
   - Open or update the PR.
   - Use standard GitHub CLI if available:
     ```sh
     gh pr create --title "<pr-title>" --body "<pr-body>" --label "auto-merge"
     ```
   - If the repo has a local PR helper, it may be used instead.
   - wait 15 sec for PR auto merge, and rebase main.
8. Report
   - Output the run summary using the format below.

## Self-Questions To Resolve Internally
- What is the highest-priority ready task right now?
- Is there already an open branch or PR for it?
- What is the smallest reviewable increment I can complete in this run?
- What verification is sufficient for this change?
- Which docs must be updated because of what was actually changed?
- What assumption did I make, if any?

## Output Format
- Finished:
  - completed in this run
- Current PR:
  - PR title and link, or branch name
  - status
  - verification performed
- Docs updated:
  - files changed in `docs/`
  - what changed
- Remaining TODO:
  - most important follow-ups
- Next priority:
  - next task
  - why it is next
- Blockers:
  - anything preventing further progress
- Assumptions:
  - any self-answered questions that were not fully confirmed

## Branch Cleanup
Only clean up after the work is merged:

```sh
git switch main
git pull
git branch -d <branch-name>
```

## Hard Rules
- Do not duplicate existing PRs.
- Do not widen scope to unrelated work.
- Do not mark speculative or unverified work as complete.
- Keep docs aligned with implemented reality, not intent.
