# Turo Browser Agent Auth Runbook

## Best-practice path

Use a real Chrome session with CDP attach as the default auth strategy for Turo.

Why:
- Turo may block fresh automated launches even when Playwright itself is working
- a real warmed Chrome session behaves more like a normal user browser
- Google OAuth works more reliably in a real browser session than via injected state alone

## Recommended flow

1. Start real Chrome with remote debugging enabled:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="$PWD/browser-profile-cdp" \
  --no-first-run \
  --no-default-browser-check \
  about:blank
```

2. Attach the agent:

```bash
export BROWSER_AGENT_USE_CDP_ATTACH=true
export BROWSER_AGENT_CDP_URL=http://127.0.0.1:9222
```

3. Run auth/bootstrap first:

```bash
./run session-bootstrap
```

4. Complete login in the attached Chrome window when needed.

5. Verify auth:

```bash
./run session-check
```

6. Only after auth is confirmed, run extraction:

```bash
./run trips-list
./run trip-get 54848775
```

## Google OAuth guidance

For Turo login via Google:
- use the attached Chrome browser session
- do not treat local `gcloud` / GCP CLI login as a substitute for website login
- if Google prompts for password, 2FA, account chooser, consent, or risk approval, the human must complete that step in the browser
- once the human completes the gated step, resume the agent on the same attached session

## Preferred auth hierarchy

1. CDP attach to a real logged-in Chrome session
2. persistent profile mode
3. raw cookie/session injection only as a fallback
4. fresh ephemeral automation context last

## Verification guidance

Do not assume every verification failure is an auth failure.

Treat these as separate diagnoses:
- **auth state**
- **artifact capture problems**
- **page extraction problems**

### Strong auth signals

Prefer these checks when deciding whether auth worked:
- protected Turo route loads successfully
- final URL is a host/protected route, not bounced back to login
- page title matches authenticated content
- HTTP status is successful when available
- `session-check` reports authenticated access

### Weak auth signals

Do not over-trust these alone:
- screenshot timeout
- one missing artifact
- transient page rendering issue

A screenshot timeout can be tooling noise rather than proof that the login failed.

## Known lesson from current validation

A `Page.screenshot: Timeout 15000ms exceeded` failure during `session-check` did not prove bad auth.
The decisive checks were authenticated trips-page access, final URL, page title, and HTTP 200 after Google OAuth completed in the attached Chrome session.

## Practical operator rule

Run in this order:
- `session-bootstrap`
- `session-check`
- `trips-list`
- `trip-get <reservation-id-or-url>`

If `session-check` shows authenticated access but `trips-list` still returns bad output, debug the extractor rather than repeating login.
