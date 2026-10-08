// Static copies of the Altair header and footer from src/App.tsx for the
// TradingAgents report pages, which functions/TradingAgents serves without
// script. public/research.css styles them; keep both in step with App.tsx.

export const BRAND_MARK =
  '<svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" focusable="false" fill="currentColor">' +
  '<path d="M13.4 3.7 L10 9 L6.6 16.5" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1"/>' +
  '<circle cx="13.4" cy="3.7" r="2"/><circle cx="10" cy="9" r="3.2"/><circle cx="6.6" cy="16.5" r="2"/></svg>';

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Same target as WorkspaceLink: the in-site preview unless a separate
// workspace origin (VITE_WORKSPACE_ORIGIN) is configured.
export function workspaceHref(url, configuredOrigin) {
  if (!configuredOrigin || LOCAL_HOSTS.has(url.hostname)) {
    return "/?app=workspace";
  }
  let target;
  try {
    target = new URL("/", configuredOrigin);
  } catch {
    return "/?app=workspace";
  }
  if (target.origin === url.origin) {
    return "/?app=workspace";
  }
  if (target.hostname !== "llm" && !target.hostname.startsWith("llm.")) {
    target.searchParams.set("app", "workspace");
  }
  return target.href;
}

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

// Signed-in visitors get Account in place of Login and Register, as in
// AuthLinks; signing out needs script, so it stays on the Account page.
function navLinks(workspace, signedIn, current) {
  return [
    ["/services", "Services"],
    ["/TradingAgents/", "Research"],
    ["/enquiry", "Contact"],
    [workspace, "Workspace"],
    ...(signedIn
      ? [["/account", "Account"]]
      : [
          ["/login", "Login"],
          ["/register", "Register"],
        ]),
  ]
    .map(([href, label]) => {
      const attributes = label === current ? ' aria-current="page"' : "";
      return `<a href="${escapeAttribute(href)}"${attributes}>${label}</a>`;
    })
    .join("");
}

export function researchHeader(workspace, signedIn) {
  return (
    '<header class="altair-header"><div class="altair-wrap altair-bar">' +
    `<a class="altair-brand" href="/">${BRAND_MARK}Altair</a>` +
    `<nav class="altair-nav" aria-label="Primary">${navLinks(workspace, signedIn, "Research")}</nav>` +
    "</div></header>"
  );
}

// Closes a cut-short report for visitors who are not signed in. `path` is the
// report's own path, so signing in comes back to it.
export function researchGate(path) {
  const next = encodeURIComponent(path);
  return (
    '<aside class="altair-gate" aria-label="Sign in to keep reading">' +
    '<p class="altair-gate-kicker">Preview</p>' +
    '<p class="altair-gate-title">Sign in to read the full report.</p>' +
    "<p>The complete analysis, figures and recommendation are open to anyone with an Altair account.</p>" +
    '<p class="altair-gate-actions">' +
    `<a class="altair-gate-primary" href="/login?next=${escapeAttribute(next)}">Log in</a>` +
    `<a href="/register?next=${escapeAttribute(next)}">Create an account</a>` +
    "</p></aside>"
  );
}

export function researchFooter(workspace, signedIn) {
  return (
    '<footer class="altair-footer"><div class="altair-wrap altair-footer-grid"><div>' +
    `<p class="altair-brand">${BRAND_MARK}Altair AI LLC</p>` +
    '<address class="altair-footer-contact">' +
    '<a href="mailto:qx@altairworld.com">qx@altairworld.com</a>' +
    "<span>San Francisco Bay Area</span><span>Mon-Fri, 9am-6pm PST</span></address></div>" +
    `<div class="altair-footer-links">${navLinks(workspace, signedIn)}</div>` +
    '<div><p class="altair-footer-meta">San Francisco Bay Area</p>' +
    '<p class="altair-footer-meta">© 2026 Altair AI LLC</p></div></div>' +
    '<div class="altair-wrap altair-footer-mark" aria-hidden="true">' +
    '<span class="altair-footer-word">Altair</span>' +
    '<span class="altair-footer-coord">α Aql · RA 19h 50m 47s · Dec +08° 52′ 06″</span>' +
    "</div></footer>"
  );
}
