# Turo Automation

Internal automation platform for the Turo host team.

## Purpose

Centralize and automate daily host operations:
- trip intake and task generation
- guest communication workflows
- vehicle readiness and turnaround ops
- late return / incident handling
- team coordination and reporting

## Repo Structure

```text
turo-automation/
  data/               sample CSV files for local testing
  docs/
    architecture/     system design and data model
    logs/             dev log (chronological notes)
    planning/         daily plan + roadmap
    product/          MVP spec
    runbooks/         AI workflow runbooks
  shared/             domain models, ports, use-cases, and adapters
  supabase/
    migrations/       SQL migration files
  web/                React dashboard (Vite)
  worker/             Node.js background job runner
  .env.example        environment variable documentation
```

## Packages

- `shared/` — domain types, port interfaces, use-case implementations, and adapter implementations (Supabase, Slack)
- `worker/` — background job runner; dispatches six core jobs on each invocation or runs them on intervals in scheduled mode
- `web/` — internal React dashboard showing today's ops snapshot, trip timeline drill-down, vehicle utilization, approval actions, and incident actions
- `browser-agent/` — existing TypeScript browser automation package for session bootstrap/check and future Turo web extraction flows
- `browser-agent-py/` — Python-first executable browser automation subtree for the current host-browser/CDP workflow; current read-only coverage includes calendar, vehicles, and profile, while business/more/switch-to-guest remain blocked and docs-only

## Getting Started

### 1. Install dependencies

```sh
npm install
```

### 2. Set up environment variables

```sh
cp .env.example .env
# Edit .env with your Supabase project URL, key, Slack webhook URL, etc.
```

Without env vars the app runs against fixture data — useful for local development.

### 3. Apply database migrations

```sh
supabase db push
# or apply manually:
psql $DATABASE_URL -f supabase/migrations/0001_turo_ops_core.sql
psql $DATABASE_URL -f supabase/migrations/0002_turo_ops_incidents_messages_jobs.sql
```

### 4. Build and test

```sh
npm run build    # compile all packages
npm test         # build + run 24 automated tests
```

### 5. Run the dashboard

```sh
npm run dev:web
```

### 6. Run the worker (one-shot)

```sh
npm run dev:worker
```

Set `TRIP_IMPORT_CSV_PATH=data/trips.sample.csv` to import the bundled sample trips.

### 7. Run the worker (scheduled mode)

```sh
WORKER_MODE=scheduled npm run dev:worker
```

Optional interval env vars:
- `INTERVAL_IMPORT_MS`
- `INTERVAL_LIFECYCLE_MS`
- `INTERVAL_LATE_RETURN_MS`
- `INTERVAL_GENERATE_DRAFTS_MS`
- `INTERVAL_DAILY_DIGEST_MS`

## Working Principles

1. Automate repetitive work first.
2. Keep human approval for risky guest-facing actions.
3. Record decisions in docs as we go.
4. Treat daily plan and dev log as source-of-truth for active work.

## Adapter Mode

The worker and web fall back to fixture data when Supabase env vars are absent — safe for local dev and CI.

| Feature | Env Var | Fallback |
|---------|---------|---------|
| Persistence | `SUPABASE_URL` + `SUPABASE_KEY` | in-memory fixtures |
| Web data | `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY` | fixture snapshot |
| Notifications | `SLACK_WEBHOOK_URL` | no-op (silent) |
| Trip import | `TRIP_IMPORT_CSV_PATH` | empty (no imports) |

Approval and incident actions in the dashboard require the `VITE_SUPABASE_*` web env vars so the UI can persist state transitions.
