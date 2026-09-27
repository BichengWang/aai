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

## Docker Deployment

The worker is fully containerised. The published image is at:

```
ghcr.io/bichengwang/altair-ai-llc/turo-worker:latest
```

### Run with docker-compose (recommended for local + staging)

```sh
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_KEY, SLACK_WEBHOOK_URL, etc.
docker compose up
```

- Starts in `WORKER_MODE=scheduled` by default (keeps the process alive)
- Probes `GET /healthz` every 30 s; port 3001 is exposed for external tooling
- Override mode: `WORKER_MODE=run-once docker compose up`

### Run bare with docker

```sh
# Pull the latest image
docker pull ghcr.io/bichengwang/altair-ai-llc/turo-worker:latest

# Scheduled mode with health probe exposed
docker run \
  --env-file .env \
  -e WORKER_MODE=scheduled \
  -p 3001:3001 \
  ghcr.io/bichengwang/altair-ai-llc/turo-worker:latest
```

### Build the image locally

```sh
docker build -f Dockerfile.worker -t turo-worker .
```

### Health check

When `WORKER_MODE=scheduled`, the worker starts an HTTP server on `HEALTHZ_PORT` (default 3001):

```
GET /healthz  →  200 {"status":"ok"}
```

Used by Docker, ECS task definitions, and k8s liveness probes. The `HEALTHCHECK` instruction is baked into the image.

### Logging

`NODE_ENV=production` (set in the image) switches the worker from human-readable to single-line JSON output per event:

```json
{"level":"info","ts":"2026-03-30T00:00:00.000Z","event":"boot","appName":"turo-automation","mode":"supabase"}
```

Ingest into CloudWatch Logs Insights, Datadog, or any JSON-aware log aggregator.

## CI/CD

- **CI** (`.github/workflows/ci-turo-automation.yml`) — runs `npm run build && npm test` on every PR and push to `main` that touches `turo-automation/` code. Uses Node 22 and fixture-backed adapters (no live credentials needed).
- **Docker publish** (`.github/workflows/docker-publish-worker.yml`) — builds and pushes the worker image to GHCR on every push to `main` that changes worker source or `Dockerfile.worker`. Requires no external secrets (`GITHUB_TOKEN` with `packages: write`).

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
| Health check port | `HEALTHZ_PORT` | 3001 |
| Explicit draft send | `WORKER_SEND_APPROVED_DRAFTS=true` | off (safe default) |
| Operator identity (web) | `VITE_OPERATOR_IDENTITY` | empty |

Approval and incident actions in the dashboard require the `VITE_SUPABASE_*` web env vars so the UI can persist state transitions.
