// Cloudflare Pages Function: serves the TradingAgents report site at
// /TradingAgents/ on this domain. TradingAgents' scripts/publish_site.sh
// publishes the site to GitHub Pages and, when configured, to its own
// Cloudflare Pages project with the same paths. Point the
// TRADINGAGENTS_REPORTS_ORIGIN variable at that project; until then the
// GitHub Pages copy is served.
//
// Signed-in visitors read the reports in full; everyone else sees the start
// of each report and a sign-in prompt (server/researchAccess.mjs).
import {
  BRAND_MARK,
  researchFooter,
  researchGate,
  researchHeader,
  workspaceHref,
} from "../../server/researchChrome.mjs";
import { researchAccess } from "../../server/researchAccess.mjs";

const DEFAULT_ORIGIN = "https://bichengwang.github.io";
const ALTAIR_HEAD =
  '<meta name="theme-color" content="#0b0c10"><link rel="stylesheet" href="/research.css">';

// Only content headers pass through, so the other host's HSTS, cookies or
// content encoding never apply to this domain.
const FORWARDED_HEADERS = ["cache-control", "content-type", "etag", "expires", "last-modified"];

// How much of a report a visitor who is not signed in sees: the blocks of
// the page body (title, paragraphs, tables...) kept before the sign-in prompt.
const PREVIEW_BLOCKS = 4;

// Files a preview may load in full: the pages' own styles, images and fonts.
// Anything else (the search index, sitemap, raw data) carries report text.
const PREVIEW_ASSET_TYPES = /^(text\/css|image\/|font\/|application\/font|text\/javascript|application\/javascript)/;

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
  const accessCheck = researchAccess(request, env);
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
  const signedIn = (await accessCheck) === "full";
  const contentType = upstream.headers.get("content-type") || "";
  const isHtml = contentType.includes("text/html");

  if (!signedIn && upstream.ok && !isHtml && !PREVIEW_ASSET_TYPES.test(contentType)) {
    await upstream.body?.cancel();
    return new Response("Sign in to read the full reports.", {
      status: 401,
      headers: { "Cache-Control": "private, no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
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

  if (isHtml) {
    // The same URL is a preview or the full report depending on the visitor,
    // so no shared or stale copy may stand in for either.
    headers.set("cache-control", "private, no-cache");
    headers.set("vary", "Cookie");
  }

  const response = new Response(upstream.body, { status: upstream.status, headers });
  if (!isHtml) {
    return response;
  }
  // The policy already blocks these; dropping them avoids console noise, and
  // the policy cannot stop a meta refresh from navigating away.
  const drop = {
    element(element) {
      element.remove();
    },
  };
  // Dress the pages as part of this site: Altair header, footer, fonts,
  // palette (public/research.css) and icon in place of the theme's own.
  const workspace = workspaceHref(url, env.VITE_WORKSPACE_ORIGIN);
  const rewriter = new HTMLRewriter()
    .on("script", drop)
    .on("meta[http-equiv]", drop)
    .on('link[href^="https://fonts.googleapis.com/"]', drop)
    .on('link[rel="icon"]', {
      element(element) {
        element.setAttribute("href", "/favicon.svg");
        element.setAttribute("type", "image/svg+xml");
      },
    })
    .on("a.md-logo", {
      element(element) {
        element.setInnerContent(BRAND_MARK, { html: true });
      },
    })
    .on("head", {
      element(element) {
        element.append(ALTAIR_HEAD, { html: true });
      },
    })
    .on("body", {
      element(element) {
        element.prepend(researchHeader(workspace, signedIn), { html: true });
        element.append(researchFooter(workspace, signedIn), { html: true });
      },
    });
  if (!signedIn) {
    previewOnly(rewriter, url.pathname + url.search);
  }
  return rewriter.transform(response);
}

// Keeps the first PREVIEW_BLOCKS blocks of the page body (Material's
// article.md-content__inner), drops the rest and the table of contents that
// points into it, and ends the body with the sign-in prompt.
function previewOnly(rewriter, path) {
  let kept = 0;
  let cut = false;
  rewriter
    .on(".md-content__inner > *", {
      element(element) {
        // The edit and view-source buttons come first and are not content.
        if (element.tagName === "a") return;
        if (kept < PREVIEW_BLOCKS) {
          kept += 1;
          return;
        }
        element.remove();
        cut = true;
      },
    })
    .on(".md-content__inner", {
      element(element) {
        element.onEndTag((end) => {
          if (cut) end.before(researchGate(path), { html: true });
        });
      },
    })
    .on(".md-sidebar--secondary .md-nav", {
      element(element) {
        element.remove();
      },
    });
}
