# Altair AI LLC Homepage

Elegant, single-page marketing site for Altair's local services platform.

## Getting started

1. Install Node.js 20+.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the auth environment template and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Supabase auth setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run [`supabase/profiles.sql`](./supabase/profiles.sql) to create the `profiles` table, row-level security policies, and the auth trigger that seeds profile rows.
3. Run [`supabase/workspace.sql`](./supabase/workspace.sql) to create the workspace tables for provider credentials, managed keys, conversations, usage events, and SSO handoffs.
4. In Supabase Auth settings, enable:
   - Google provider
   - OAuth 2.1 server if you want Altair to host the consent screen at `https://altairworld.com/oauth/consent`
5. In the Google Cloud console, create OAuth credentials and add the redirect URI Supabase gives you for the Google provider.
6. In Supabase Auth URL configuration, add these redirect URLs:
   - Local dev: `http://localhost:5173/auth/callback`
   - Local workspace preview: `http://localhost:5173/auth/callback?app=workspace`
   - Production: `https://your-domain.example/auth/callback`
   - Production workspace: `https://llm.your-domain.example/auth/callback`
   - Site URL for email confirmation: your deployed homepage origin
7. If you are using Supabase OAuth Server, configure the consent page URL to point at your deployed app route:
   - Production consent page: `https://altairworld.com/oauth/consent`
   - Local consent page: `http://localhost:5173/oauth/consent`
8. Add these Vite env vars to `.env.local` and your deployment environment:
   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   VITE_AUTH_CALLBACK_URL=http://localhost:5173/auth/callback
   VITE_WORKSPACE_ORIGIN=https://llm.your-domain.example
   ```
   `VITE_AUTH_CALLBACK_URL` is optional but recommended when your frontend is served through a reverse proxy or a non-default local port (for example `http://localhost:3000`) so OAuth always returns to a reachable callback URL.
   These `VITE_*` values are public client-side build variables. Set them in Netlify's environment variables; Vite includes them in the browser bundle. Production Netlify builds fail when the Supabase URL or publishable key is missing.

## Contact and enquiry email delivery

The homepage contact form and the unified `/enquiry` intake form (`/contact` redirects there) submit to `POST /api/enquiry`. The server sends the complete submission to the team through [Resend](https://resend.com/docs/api-reference/emails/send-email), with the customer's email as Reply-To. Success appears only after Resend accepts the email and returns its ID; acceptance does not guarantee inbox delivery. Failed submissions keep the entered details available for retry.

To enable delivery:

1. Verify a sending domain in Resend and create a sending API key.
2. Set these **server-only** variables in Netlify with the **Functions** scope, or as Cloudflare Pages environment variables (encrypt the key as a secret):
   ```bash
   RESEND_API_KEY=your-resend-api-key
   ENQUIRY_FROM_EMAIL=Altair <enquiries@your-verified-domain.example>
   ENQUIRY_TO_EMAIL=qx@altairworld.com
   ```
   The recipient defaults to `qx@altairworld.com`. Never prefix these settings with `VITE_` or `NEXT_PUBLIC_`; the key must stay out of browser bundles. For local development, place them in `.env.local`; Vite serves the same handler through server middleware. Restart the development server after changing them.
3. Deploy. On Netlify, the repository-root `netlify.toml` builds `homepage` and bundles [`netlify/functions/enquiry.mjs`](./netlify/functions/enquiry.mjs). On Cloudflare Pages, [`functions/api/enquiry.js`](./functions/api/enquiry.js) runs the same handler. Redeploy after setting production secrets. Static hosting without functions (including GitHub Pages) cannot send email.
4. Submit a contact message on the deployed site and verify it arrives at the team inbox. Check Resend's delivery logs if it does not arrive.

The handler validates required fields and service/topic choices, rejects oversized requests, and includes a hidden bot-trap field. [Netlify limits](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/) this endpoint to five requests per IP/domain per minute; verify the rule is reported in the deploy log. Cloudflare Pages has no per-function limit, so add a [rate limiting rule](https://developers.cloudflare.com/waf/rate-limiting-rules/) for `/api/enquiry` in the domain's WAF. Retries of unchanged forms reuse a Resend idempotency key to avoid duplicate emails within Resend's 24-hour deduplication window. There is no database queue: when delivery is unavailable, the form reports an error and offers the team's email address. No customer auto-reply is sent.

Run `npm run test:server` for endpoint validation and `npx playwright test e2e/enquiry.spec.ts` for browser submission, pending state, retry, and failure checks. If Playwright's bundled Chromium is unavailable but Google Chrome is installed, use `PLAYWRIGHT_CHANNEL=chrome npx playwright test e2e/enquiry.spec.ts`. The browser tests use the real handler with a simulated email provider and intentionally clear local email credentials; they do not send actual emails.

## Prerendered pages and search

`npm run build` writes real HTML for the public marketing pages, so they arrive with their content, open on slow devices without waiting for the app script, and read correctly to search engines, link previews and anything else that does not run JavaScript:

1. `vite build` builds the browser app.
2. `vite build --ssr src/entry-prerender.tsx` builds a Node copy of the marketing app.
3. [`scripts/prerender.mjs`](./scripts/prerender.mjs) renders each path in `prerenderedPaths` (home, services, every service page, the intake form) to `dist/<path>.html` with its own title, description, canonical URL, Open Graph preview (`public/og-image.png`) and schema.org data. It also writes `sitemap.xml` and `robots.txt`, a copy of the empty app shell for each path in `shellPaths` (login, account, auth callbacks, workspace routes) so static hosts answer them with 200, and `404.html`, the empty shell for any other path.
4. [`scripts/verify-built-routes.mjs`](./scripts/verify-built-routes.mjs) checks the result.

Cloudflare Pages and Netlify both serve `/services.html` at `/services`. In the browser, [`src/main.tsx`](./src/main.tsx) hydrates a prerendered page when the URL is that page in the marketing app, and renders from scratch otherwise. Workspace URLs (the `llm.` host or `?app=workspace`) share these files; an inline script in `index.html` hides the marketing markup until the workspace replaces it.

- Canonical and sitemap URLs use `SITE_URL` (build environment), default `https://altairworld.com`.
- A page sets its title and description with `usePageTitle(title, description)`. Add a new public page to `prerenderedPaths` in `src/entry-prerender.tsx`, and a new browser-only route to `shellPaths`.
- Marketing components render in Node at build time, so they must not read `window` or `document` while rendering. For output that depends on the browser, render a host-independent fallback until `useHydrated()` is true (see `WorkspaceLink` in `src/App.tsx`).
- `npm run test:e2e:built` builds the site and runs [`e2e/built`](./e2e/built) against it.

## TradingAgents reports (`/TradingAgents/`)

The **Research** tab opens the TradingAgents report site at `/TradingAgents/`. On Cloudflare Pages, [`functions/TradingAgents/[[path]].js`](./functions/TradingAgents/%5B%5Bpath%5D%5D.js) serves that path from another origin, so the reports look like part of this site and new reports appear as soon as TradingAgents publishes them:

- `TRADINGAGENTS_REPORTS_ORIGIN` (Cloudflare Pages environment variable) is the origin to serve from. It defaults to `https://bichengwang.github.io`, the GitHub Pages copy. Once TradingAgents' `scripts/publish_site.sh` also deploys to its own Cloudflare Pages project, set it to that project's URL, e.g. `https://tradingagents-reports.pages.dev`. The paths are the same on both.
- The reports share this origin with the signed-in app, so every response carries `Content-Security-Policy: script-src 'none'` and the function strips `<script>` and `<meta http-equiv>` tags. The report pages are static and stay readable without their theme script; the light/dark toggle and instant page loads are off on this copy.
- The function dresses the pages in the Altair look: it adds the Altair header and footer from [`server/researchChrome.mjs`](./server/researchChrome.mjs), the Altair favicon and mark, and [`public/research.css`](./public/research.css), which maps the MkDocs theme onto the lab tokens and fonts. These are static copies, so keep them in step with `src/App.tsx` and `src/lab.css`. The header's Workspace link follows `VITE_WORKSPACE_ORIGIN` like the app's.
- Signed-in visitors read the reports in full; everyone else gets a sample: about 1,800 characters of each page (on the home page, the first rows of the newest decision summary), cut at a row or paragraph so the rest is never sent, fading out under a floating card that asks them to log in or register and then returns them to the same page. The card's styles ship inside the page, so a cached `research.css` cannot leave it unstyled. The pages run no script, so the app copies the Supabase access token into an `altair_research` cookie scoped to `/TradingAgents` ([`src/lib/researchAccess.ts`](./src/lib/researchAccess.ts)), and the function checks it against Supabase's `/auth/v1/user` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` ([`server/researchAccess.mjs`](./server/researchAccess.mjs)). Previews also withhold the report's other files, such as the search index. Without those two variables nobody can sign in, so every visitor gets the full reports. The gate only covers this domain: the origin itself (the GitHub Pages copy by default, and Netlify's redirect to it) stays public until it is made private.
- `npm run dev` does not run Pages Functions (this one or `/api/enquiry`); use `npx wrangler pages dev dist` after `npm run build`. On Netlify, `netlify.toml` redirects `/TradingAgents/*` to the GitHub Pages copy instead.

## Workspace edge function setup

Deploy the Supabase Edge Function in [`supabase/functions/workspace-api`](./supabase/functions/workspace-api).

Required secrets for the function environment:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
WORKSPACE_ENCRYPTION_SECRET=a-long-random-secret
```

The workspace function exposes these routes under `workspace-api`:

- `POST /credentials/create`
- `POST /credentials/validate`
- `GET /credentials/list`
- `POST /managed-key/bootstrap`
- `POST /sso-handoff/create`
- `POST /sso-handoff/consume`
- `GET /conversations`
- `POST /conversations`
- `GET /messages`
- `POST /chat/complete`

## Auth routes

- Public: `/`, `/services`, `/services/:slug`, `/enquiry` (`/contact` redirects), `/login`, `/register`, `/auth/callback`, `/oauth/consent`, plus the proxied `/TradingAgents/` reports
- Protected: `/account`
- Workspace host: `/`, `/login`, `/register`, `/auth/callback`, `/oauth/consent`, `/chat`, `/keys`, `/usage`, `/account`

## Review workspace

- Visit `/review?app=workspace` (the **Review** item in the workspace sidebar) to open the DOCX review workspace. Signed-out visitors are sent to workspace login first; the old `/review` URL redirects here.
- Visit `/review/settings?app=workspace` to store the provider connection used by the review workspace in this browser.
- The chat uses an OpenAI-compatible `/chat/completions` endpoint.
- If only `VITE_ANTHROPIC_API_KEY` is set, the review workspace now defaults to `https://api.anthropic.com/v1` and `claude-sonnet-4-20250514`.
- Saved settings override fallback env vars. Supported env vars are `VITE_LLM_API_KEY`, `VITE_LLM_MODEL`, `VITE_LLM_BASE_URL`, plus `VITE_ANTHROPIC_API_KEY`, `VITE_ANTHROPIC_MODEL`, and `VITE_ANTHROPIC_API_URL`.
- The left panel uses a standard DOCX renderer; highlight text in the document to set chat context.
- The chat currently sends only the highlighted excerpt, not the full document.

## Tests

- Unit tests:
  ```bash
  npm run test:unit
  ```
- End-to-end tests (development server, then the production build):
  ```bash
  npx playwright install
  npm run test:e2e
  npm run test:e2e:built
  ```

## Notes

- The site uses one design system: tokens, header/footer, type and form primitives in `src/lab.css`; inner-page layouts (page head, services, intake forms, auth, account) in `src/pages.css`; homepage sections in `src/home.css`. `src/index.css` holds the base reset plus the review workspace, and `src/workspace.css` the LLM workspace app; both read the same `--lab-*` tokens.
- The hero figure is an inline SVG (`src/components/lab/AquilaFigure.tsx`); the homepage uses no background image.
- The Supabase SDK is about a third of the app's JavaScript, so it is not in the main bundle. Get the client with `await getSupabase()` from `src/lib/supabase.ts` (null when auth is not configured); never import `@supabase/supabase-js` for values, only for types. `src/main.tsx` starts the download while React renders, and the build emits it as `assets/supabase-*.js`.
