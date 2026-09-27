# Host Mode Plan

## Goal
Build `turo-automation` as an internal host-ops control plane rather than a fully autonomous Turo bot.

## Operating Boundary
- hosted web dashboard, worker, Supabase, and Slack form the control plane
- manual import is the initial trip-ingestion path
- guest-facing messaging remains draft-first and approval gated
- supervised browser assistance is optional and operator-triggered only
- no unattended Turo interaction is assumed in the core architecture

## Interface-First Baseline
This subtree now targets a 3-package architecture:
- `shared` owns domain models, ports, read models, fixture data, and use-case contracts
- `web` renders the dashboard only through shared contracts
- `worker` wires jobs only through shared contracts and stub adapters

## First PR Scope
- freeze shared domain entities and ports
- add `TodayOpsSnapshot` as the canonical dashboard read model
- replace placeholder UI with a fixture-backed dashboard shell
- replace placeholder worker entrypoint with fixture-backed job execution
- add contract tests before wiring real persistence or integrations

## Next Implementation Step
Wire the shared contracts to real persistence:
- add repository adapters on top of Supabase
- add message and incident schema slices still missing from persistence
- swap web fixture loading for repository-backed reads
- swap worker fixture adapters for persistence and notifier adapters
