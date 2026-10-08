import type { Session } from "@supabase/supabase-js";

// The TradingAgents reports at /TradingAgents/ run no script, so they cannot
// read the Supabase session. This cookie carries its access token there, and
// functions/TradingAgents (server/researchAccess.mjs) checks it with Supabase
// before showing a report in full. It expires with the token and is rewritten
// on every refresh.
const RESEARCH_COOKIE = "altair_research";
const RESEARCH_PATH = "/TradingAgents";

export function syncResearchAccess(session: Session | null) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = session?.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 0;

  if (!session || maxAge <= 0) {
    document.cookie = `${RESEARCH_COOKIE}=; Path=${RESEARCH_PATH}; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }

  document.cookie =
    `${RESEARCH_COOKIE}=${session.access_token}; Path=${RESEARCH_PATH}; ` +
    `Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

// The reports are served outside this app, so returning to one after sign-in
// takes a full page load rather than a router navigation.
export function isResearchPath(path: string | null | undefined) {
  return Boolean(path && (path === RESEARCH_PATH || path.startsWith(`${RESEARCH_PATH}/`)));
}
