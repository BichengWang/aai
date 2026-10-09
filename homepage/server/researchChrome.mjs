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

const LOCK_ICON =
  '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" ' +
  'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>';

// Closes a cut-short page for visitors who are not signed in: a veil that
// blurs and fades the last of the sample, then a card that floats at the
// bottom of the screen while the sample scrolls by and settles over the
// faded tail. `path` is the page's own path, so signing in comes back to it.
export function researchGate(path) {
  const next = escapeAttribute(encodeURIComponent(path));
  return (
    '<div class="altair-veil" aria-hidden="true"></div>' +
    '<aside class="altair-gate" aria-labelledby="altair-gate-title"><div class="altair-gate-card">' +
    `<span class="altair-gate-icon">${LOCK_ICON}</span>` +
    '<div class="altair-gate-body">' +
    '<p class="altair-gate-kicker">Members preview</p>' +
    '<p class="altair-gate-title" id="altair-gate-title">Keep reading with an Altair account</p>' +
    '<p class="altair-gate-lede">This is a sample of the newest results. Sign in for every decision summary and the complete reports behind them, with targets, confidence and horizons.</p>' +
    "</div>" +
    '<div class="altair-gate-actions">' +
    `<a class="altair-gate-button altair-gate-button--primary" href="/login?next=${next}">Log in to continue</a>` +
    `<a class="altair-gate-button" href="/register?next=${next}">Create an account</a>` +
    '<p class="altair-gate-note">Google sign-in · returns you here</p>' +
    "</div></div></aside>"
  );
}

// The gate's styles travel in the page itself rather than research.css, so a
// cached copy of that stylesheet can never leave the gate unstyled.
export const RESEARCH_GATE_STYLE = `<style>
.md-typeset .daily-summary-layout{display:block}
.md-typeset .altair-veil{position:relative;height:0}
.md-typeset .altair-veil::before{content:"";position:absolute;left:-8px;right:-8px;bottom:0;height:min(420px,60vh);pointer-events:none;
backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
-webkit-mask-image:linear-gradient(to bottom,transparent,#000 70%);mask-image:linear-gradient(to bottom,transparent,#000 70%);
background:linear-gradient(to bottom,rgba(242,242,238,0) 0%,rgba(242,242,238,.55) 45%,var(--lab-bg,#f2f2ee) 92%)}
.md-typeset .altair-gate{position:sticky;bottom:20px;z-index:3;margin:-150px 0 48px;font:400 15px/1.6 var(--lab-font-sans,system-ui,sans-serif)}
.md-typeset .altair-gate-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:20px 24px;max-width:860px;margin:0 auto;padding:22px 24px;border:1px solid rgba(237,237,232,.12);border-radius:16px;
background:rgba(11,12,16,.9);backdrop-filter:blur(14px) saturate(140%);-webkit-backdrop-filter:blur(14px) saturate(140%);color:var(--lab-night-fg,#edede8);
box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 24px 60px -20px rgba(11,12,16,.55),0 8px 20px -12px rgba(11,12,16,.35);animation:altair-gate-in .5s cubic-bezier(.2,.7,.2,1) both}
@keyframes altair-gate-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.md-typeset .altair-gate-card{animation:none}}
.md-typeset .altair-gate-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:rgba(163,180,255,.12);color:var(--lab-night-accent,#a3b4ff)}
.md-typeset .altair-gate p{margin:0}
.md-typeset .altair-gate .altair-gate-kicker{margin-bottom:4px;font:500 11px/1.4 var(--lab-font-mono,ui-monospace,monospace);letter-spacing:.12em;text-transform:uppercase;color:var(--lab-night-accent,#a3b4ff)}
.md-typeset .altair-gate .altair-gate-title{font:400 24px/1.15 var(--lab-font-display,Georgia,serif);letter-spacing:-.015em;color:var(--lab-night-fg,#edede8)}
.md-typeset .altair-gate .altair-gate-lede{margin-top:6px;max-width:52ch;font-size:14px;line-height:1.55;color:var(--lab-night-fg-2,#a7a9b0)}
.md-typeset .altair-gate .altair-gate-actions{display:grid;gap:8px;justify-items:stretch;min-width:190px}
.md-typeset .altair-gate .altair-gate-button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 18px;border:1px solid var(--lab-night-line-strong,rgba(237,237,232,.3));border-radius:9px;font-weight:500;font-size:14px;color:var(--lab-night-fg,#edede8);text-decoration:none;transition:background-color .15s,border-color .15s,transform .15s}
.md-typeset .altair-gate .altair-gate-button:hover{border-color:var(--lab-night-fg,#edede8);color:var(--lab-night-fg,#edede8);transform:translateY(-1px)}
.md-typeset .altair-gate .altair-gate-button--primary{border-color:var(--lab-night-fg,#edede8);background:var(--lab-night-fg,#edede8);color:var(--lab-night,#0b0c10)}
.md-typeset .altair-gate .altair-gate-button--primary:hover{border-color:#fff;background:#fff;color:var(--lab-night,#0b0c10)}
.md-typeset .altair-gate .altair-gate-button:focus-visible{outline:2px solid var(--lab-night-accent,#a3b4ff);outline-offset:2px}
.md-typeset .altair-gate .altair-gate-note{font:500 11px/1.4 var(--lab-font-mono,ui-monospace,monospace);letter-spacing:.04em;text-align:center;color:var(--lab-night-fg-3,#868991)}
@media (max-width:760px){.md-typeset .altair-gate{bottom:12px;margin-top:-110px}.md-typeset .altair-gate-card{grid-template-columns:auto 1fr;padding:18px}.md-typeset .altair-gate .altair-gate-actions{grid-column:1/-1}.md-typeset .altair-gate .altair-gate-title{font-size:21px}}
</style>`;

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
