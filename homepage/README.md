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

- Public: `/`, `/services`, `/services/:slug`, `/enquiry`, `/contact`, `/login`, `/register`, `/auth/callback`, `/oauth/consent`
- Protected: `/account`
- Workspace host: `/`, `/login`, `/register`, `/auth/callback`, `/oauth/consent`, `/chat`, `/keys`, `/usage`, `/account`

## Review workspace

- Visit `/review` to open the DOCX review workspace.
- Visit `/review/settings` to store the provider connection used by the review workspace in this browser.
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

- Homepage (`/`) styles live in `src/home.css`, scoped to `.page--home`, `.home-lab` and `lab-*` classes; shared styles for other routes stay in `src/index.css`.
- The hero figure is an inline SVG (`src/components/lab/AquilaFigure.tsx`); the homepage uses no background image.
