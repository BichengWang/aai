# MVP Spec

## Goal
Reduce manual operational work for the Turo host team by centralizing trip operations, team tasks, and communication workflows.

## Primary Users
- Host operations staff
- Vehicle prep / turnaround staff
- Team lead / manager

## MVP Outcomes
- See today's pickups, returns, and active issues in one place
- Automatically generate ops tasks per trip lifecycle
- Draft guest-facing messages for review
- Alert the team about late returns and exceptions
- Produce a simple daily operational summary

## MVP Workflow Scope
1. Trip intake and normalization
2. Vehicle readiness / turnaround task generation
3. Messaging draft center
4. Late return and issue alerting
5. Slack summary reporting

## Supporting Operator Tooling
- Read-only browser-assisted host inspection is in scope as an internal support tool, provided it stays outside the worker critical path and avoids guest-facing writes.
- Authenticated browser-assisted tooling should ship only when each new read model has been verified against a real logged-in session, not just fixture assumptions.

## Non-Goals (for MVP)
- Full autonomous guest messaging
- Advanced dynamic pricing engine
- Full claims automation
- Complex analytics warehouse
