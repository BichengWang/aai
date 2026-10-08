// Who may read the full TradingAgents reports at /TradingAgents/. The pages
// run no script, so the signed-in app copies its Supabase access token into
// the cookie below (src/lib/researchAccess.ts) and the function checks it
// with Supabase; everyone else gets a preview.

export const RESEARCH_COOKIE = "altair_research";

function readCookie(request, name) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const index = part.indexOf("=");
    if (index !== -1 && part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }
  return null;
}

// Same settings and placeholder rules as src/lib/supabase.ts.
function supabaseConfig(env) {
  const viteUrl = env.VITE_SUPABASE_URL?.trim();
  const viteKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  const url =
    viteUrl && viteUrl !== "https://your-project-ref.supabase.co"
      ? viteUrl
      : env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    viteKey && viteKey !== "your-publishable-key"
      ? viteKey
      : env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  try {
    const parsed = new URL(url);
    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && key) {
      return { url: parsed.origin, key };
    }
  } catch {
    // Missing or malformed: sign-in is unavailable.
  }
  return null;
}

// "full" when the visitor is signed in, or when sign-in is not configured
// and nobody could be; "preview" otherwise, including when Supabase cannot
// confirm the token.
export async function researchAccess(request, env, fetchImpl = fetch) {
  const config = supabaseConfig(env);
  if (!config) {
    return "full";
  }
  const token = readCookie(request, RESEARCH_COOKIE);
  if (!token) {
    return "preview";
  }
  try {
    const response = await fetchImpl(`${config.url}/auth/v1/user`, {
      headers: { apikey: config.key, authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    });
    return response.ok ? "full" : "preview";
  } catch {
    return "preview";
  }
}
