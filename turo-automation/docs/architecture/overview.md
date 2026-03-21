# Architecture Overview

## Packages

### `shared/`
Central library consumed by both `web` and `worker`. Contains:
- **Domain layer** (`src/domain/`) — TypeScript entity interfaces and status unions
- **Ports layer** (`src/ports/`) — Repository and integration interface contracts
- **Application layer** (`src/application/`) — Use-case factory functions and typed result envelopes
- **Fixtures layer** (`src/fixtures/`) — In-memory repository implementations and seed data for test/dev
- **Adapters** (`src/adapters/`) — Pluggable implementations of the ports:
  - `supabase/` — Supabase-backed repositories for trips, tasks, incidents, messages, approvals, job runs
  - `slack/` — Slack incoming-webhook notifier (env-gated; no-op when absent)

### `web/`
Vite + React internal dashboard. Reads from the `GetTodayOpsSnapshot` use-case and renders:
- Today's pickups / returns
- Active incidents and pending approvals
- Overdue tasks
- Worker health summary
- Selected-trip timeline via `GetTripTimeline`
- Vehicle utilization sidebar via `GetVehicleUtilization`
- Approval and incident state transitions via Supabase-backed action modules

Data source is env-gated:
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY` → Supabase-backed snapshot
- absent → fixture-backed snapshot (for local development without credentials)

### `worker/`
Node.js background job runner. Executes sequentially on each invocation:
1. `today_ops_snapshot` — aggregate and persist the current ops state
2. `trip_import` — read new trips from the import source and upsert into the DB
3. `lifecycle_tasks` — generate per-trip tasks based on trip status
4. `late_return_scan` — detect overdue trips and open incidents
5. `daily_digest` — build a summary and publish to Slack

Adapter mode is env-gated:
- `SUPABASE_URL` + `SUPABASE_KEY` → Supabase-backed repositories + Slack notifier
- absent → fixture-backed in-memory adapters (safe for CI and local dev)

## Core Design Principle
Separate user-facing operational views (`web`) from automation execution (`worker`) so manual ops and automated jobs can evolve independently. Both couple only to the shared `ports/` interfaces — never to each other's internals.

## Port / Adapter Pattern
```
shared/src/ports/          → interface contracts
shared/src/application/    → use-case implementations (depend on ports only)
shared/src/adapters/       → concrete implementations of ports
worker/src/adapters/       → adapter wiring (assembles ports into a context)
web/src/lib/               → web-side adapter wiring
```

## Active Integrations
| Integration | Adapter | Env Var |
|-------------|---------|---------|
| Supabase (persistence) | `createSupabase*Repository` | `SUPABASE_URL`, `SUPABASE_KEY` |
| Supabase (web) | `loadSnapshot` in `web/src/lib/` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` |
| Slack (notifications) | `createEnvSlackNotifier` | `SLACK_WEBHOOK_URL` |

## Planned Integrations
- Trip import source (CSV / Turo export) — `TripImportSource` port stub ready
- Email / SMS / WhatsApp — `OpsNotifier` port extensible
- Playwright browser assist — `BrowserAssistPort` stub ready, gated behind explicit enablement
