// Cloudflare Pages Function: serves the TradingAgents report site at
// /TradingAgents/ on this domain. TradingAgents' scripts/publish_site.sh
// publishes the site to GitHub Pages and, when configured, to its own
// Cloudflare Pages project with the same paths. Point the
// TRADINGAGENTS_REPORTS_ORIGIN variable at that project; until then the
// GitHub Pages copy is served.
const DEFAULT_ORIGIN = "https://bichengwang.github.io";

// Only content headers pass through, so the other host's HSTS, cookies or
// content encoding never apply to this domain.
const FORWARDED_HEADERS = ["cache-control", "content-type", "etag", "expires", "last-modified"];

// The reports are LLM-written from web data and share this origin with the
// signed-in app and its stored session, so the browser must never run script
// from them. The pages are static and stay readable without their theme script.
const REPORT_POLICY = [
  "script-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "frame-ancestors 'self'",
].join("; ");

export async function onRequest({ request, env }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const url = new URL(request.url);
  let origin;
  let upstream;
  try {
    origin = new URL(env.TRADINGAGENTS_REPORTS_ORIGIN || DEFAULT_ORIGIN).origin;
    upstream = await fetch(origin + url.pathname + url.search, {
      method: request.method,
      redirect: "manual",
    });
  } catch {
    return new Response("The reports are temporarily unavailable.", { status: 502 });
  }

  const headers = new Headers({
    "Content-Security-Policy": REPORT_POLICY,
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of FORWARDED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  const location = upstream.headers.get("location");
  if (location) {
    // GitHub Pages redirects /TradingAgents/NVDA to an absolute .../NVDA/ URL.
    const target = new URL(location, origin + url.pathname);
    headers.set(
      "location",
      target.origin === origin ? target.pathname + target.search + target.hash : target.href,
    );
  }

  const response = new Response(upstream.body, { status: upstream.status, headers });
  if (!(headers.get("content-type") || "").includes("text/html")) {
    return response;
  }
  // The policy already blocks these; dropping them avoids console noise, and
  // the policy cannot stop a meta refresh from navigating away.
  const drop = {
    element(element) {
      element.remove();
    },
  };
  return new HTMLRewriter().on("script", drop).on("meta[http-equiv]", drop).transform(response);
}
