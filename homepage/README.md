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
2. Set these **server-only** variables in Netlify with the **Functions** scope:
   ```bash
   RESEND_API_KEY=your-resend-api-key
   ENQUIRY_FROM_EMAIL=Altair <enquiries@your-verified-domain.example>
   ENQUIRY_TO_EMAIL=qx@altairworld.com
   ```
   The recipient defaults to `qx@altairworld.com`. Never prefix these settings with `VITE_` or `NEXT_PUBLIC_`; the key must stay out of browser bundles. For local development, place them in `.env.local`; Vite serves the same handler through server middleware. Restart the development server after changing them.
3. Deploy using the repository-root `netlify.toml`. It builds `homepage`, bundles the enquiry function, and enables SPA routes. Redeploy after setting production secrets. Static hosting (including GitHub Pages) cannot run this function; use Netlify for email submission.
4. Submit a contact message on the deployed site and verify it arrives at the team inbox. Check Resend's delivery logs if it does not arrive.

The handler validates required fields and service/topic choices, rejects oversized requests, and includes a hidden bot-trap field. [Netlify limits](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/) this endpoint to five requests per IP/domain per minute; verify the rule is reported in the deploy log. Retries of unchanged forms reuse a Resend idempotency key to avoid duplicate emails within Resend's 24-hour deduplication window. There is no database queue: when delivery is unavailable, the form reports an error and offers the team's email address. No customer auto-reply is sent.

Run `npm run test:server` for endpoint validation and `npx playwright test e2e/enquiry.spec.ts` for browser submission, pending state, retry, and failure checks. If Playwright's bundled Chromium is unavailable but Google Chrome is installed, use `PLAYWRIGHT_CHANNEL=chrome npx playwright test e2e/enquiry.spec.ts`. The browser tests use the real handler with a simulated email provider and intentionally clear local email credentials; they do not send actual emails.

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

- Public: `/`, `/services`, `/services/:slug`, `/enquiry` (`/contact` redirects), `/login`, `/register`, `/auth/callback`, `/oauth/consent`
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
- End-to-end tests:
  ```bash
  npx playwright install
  npm run test:e2e
  ```

## Notes

- The site uses one design system: tokens, header/footer, type and form primitives in `src/lab.css`; inner-page layouts (page head, services, intake forms, auth, account) in `src/pages.css`; homepage sections in `src/home.css`. `src/index.css` holds the base reset plus the review workspace, and `src/workspace.css` the LLM workspace app; both read the same `--lab-*` tokens.
- The hero figure is an inline SVG (`src/components/lab/AquilaFigure.tsx`); the homepage uses no background image.
