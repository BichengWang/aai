# Browser Agent (Python)

Python-first executable subtree for Turo host browser automation.

## Why this exists

The repo already has a TypeScript `browser-agent/` package, but the actual host-browser workflow is a better fit for a small Python CLI subtree that can grow into a standalone automation runner without coupling it to the web dashboard or worker packages.

This subtree captures the learned browser automation steps as executable commands and JSON contracts.

## Command surface

- `./run health-smoke`
- `./run session-bootstrap`
- `./run session-check`
- `./run trips-list`
- `./run trip-get <reservation-id-or-url>`
- `./run messages-list`
- `turo-browser-agent health-smoke`
- `turo-browser-agent session-bootstrap`
- `turo-browser-agent session-check`
- `turo-browser-agent trips-list`
- `turo-browser-agent trip-get <reservation-id-or-url>`
- `turo-browser-agent messages-list`

The checked-in `./run` wrapper works without installing the package first.
After `python3 -m pip install -e .`, the `turo-browser-agent` console script is also available.

## Current status

This is a minimal real browser runner:
- `health-smoke` launches a browser and opens Turo
- `session-bootstrap` opens the login flow and waits for manual auth
- `session-check` reuses saved browser state and verifies a protected host route, not just the public homepage
- `trips-list` opens the host trips page and returns structured JSON or `login_required`
- `trip-get` opens one reservation detail page by ID or URL and returns a conservative structured summary
- `messages-list` opens the host messages page and returns structured thread summaries or `login_required`

It stays read-first and intentionally avoids guest-facing writes.

For the practical auth playbook and troubleshooting guidance, read `docs/AUTH_RUNBOOK.md`.

## Three operating modes

### 1. Ephemeral automation context

Default mode. Uses Playwright browser context plus `storage/state.json`.

### 2. Persistent human-style browser profile

Enable this when you want the agent to reuse a real browser profile directory instead of a fresh automation context:

```bash
export BROWSER_AGENT_USE_PERSISTENT_PROFILE=true
export BROWSER_AGENT_USER_DATA_DIR="$PWD/browser-profile"
export BROWSER_AGENT_BROWSER_CHANNEL=chrome
./run session-bootstrap
./run session-check
```

This is the preferred next path when Turo blocks the default automation context.

### 3. CDP attach to an already-open Chrome session

This is the most critical unblocker path when Turo behaves differently in a real user browser than in a freshly launched automated one.

Start Chrome with a remote debugging port, then attach the agent to it:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$PWD/browser-profile-cdp" \
  --no-first-run \
  --no-default-browser-check \
  about:blank

export BROWSER_AGENT_USE_CDP_ATTACH=true
export BROWSER_AGENT_CDP_URL=http://127.0.0.1:9222
./run health-smoke
./run session-bootstrap
./run session-check
./run trips-list
./run trip-get 54848775
./run messages-list
```

## Local dev

```bash
cd turo-automation/browser-agent-py
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -e .
python3 -m playwright install chromium
./run health-smoke
```

If you want to use an installed Chrome instead of Playwright-managed Chromium:

```bash
export BROWSER_AGENT_BROWSER_CHANNEL=chrome
```

## Environment variables

- `TURO_BASE_URL` — default `https://turo.com`
- `TURO_LOGIN_URL` — default `<base>/login`
- `BROWSER_AGENT_HEADLESS` — default `false`
- `BROWSER_AGENT_TIMEOUT_MS` — default `15000`
- `BROWSER_AGENT_SLOWMO_MS` — default `0`
- `BROWSER_AGENT_BOOTSTRAP_WAIT_MS` — default `120000`
- `BROWSER_AGENT_BROWSER_CHANNEL` — optional Playwright browser channel (for example `chrome`)
- `BROWSER_AGENT_USE_PERSISTENT_PROFILE` — default `false`
- `BROWSER_AGENT_USER_DATA_DIR` — default `browser-profile/`
- `BROWSER_AGENT_USE_CDP_ATTACH` — default `false`
- `BROWSER_AGENT_CDP_URL` — example `http://127.0.0.1:9222`
- `BROWSER_AGENT_STORAGE_STATE_PATH` — default `storage/state.json`
- `BROWSER_AGENT_ARTIFACTS_DIR` — default `artifacts/`

## Storage conventions

- `storage/state.json` — persisted storage state for ephemeral-context mode
- `browser-profile/` — persistent user-data-dir for human-style profile mode
- `artifacts/` — screenshots and debug artifacts
