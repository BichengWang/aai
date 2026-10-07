// Build-time entry (scripts/prerender.mjs): renders the public marketing
// pages to HTML so they arrive with their content, title and description,
// then src/main.tsx hydrates them.
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { services } from "./data/services";
import { PageMetaContext, SITE_DESCRIPTION, formatPageTitle, type PageMeta } from "./lib/usePageChrome";

export { services };

/** Pages written out with their content, listed in the sitemap. */
export const prerenderedPaths = [
  "/",
  "/services",
  ...services.map((service) => `/services/${service.slug}`),
  "/enquiry",
];

/**
 * Routes that render only in the browser (they depend on the session or the
 * URL). Each gets a copy of the empty app shell so static hosts answer them
 * with 200 instead of the 404 fallback.
 */
export const shellPaths = [
  "/login",
  "/register",
  "/account",
  "/auth/callback",
  "/oauth/consent",
  // Workspace app (llm. host or ?app=workspace)
  "/chat",
  "/keys",
  "/usage",
  "/review",
  "/review/settings",
];

export function render(path: string) {
  const meta: PageMeta = {};
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={path}>
        <PageMetaContext.Provider value={meta}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PageMetaContext.Provider>
      </StaticRouter>
    </StrictMode>
  );

  return {
    html,
    title: formatPageTitle(meta.title),
    description: meta.description ?? SITE_DESCRIPTION,
  };
}
