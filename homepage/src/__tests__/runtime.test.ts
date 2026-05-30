import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appendNextSearchParam,
  buildAppPath,
  buildOAuthConsentPath,
  buildWorkspaceUrl,
  detectActiveApp,
  getAuthCallbackPathFromHash,
  getDefaultSignedInPath,
  getRouterBasename,
  getSafeRedirectPath,
  resolveRedirectPath,
} from "../lib/runtime";

describe("runtime host detection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects the workspace app from the llm subdomain", () => {
    expect(
      detectActiveApp({
        hostname: "llm.altair.test",
        origin: "https://llm.altair.test",
        search: "",
      })
    ).toBe("workspace");
  });

  it("supports workspace preview mode on localhost", () => {
    expect(
      detectActiveApp({
        hostname: "localhost",
        origin: "http://localhost:5173",
        search: "?app=workspace",
      })
    ).toBe("workspace");
  });

  it("defaults to the marketing app otherwise", () => {
    expect(
      detectActiveApp({
        hostname: "www.altair.test",
        origin: "https://www.altair.test",
        search: "",
      })
    ).toBe("marketing");
  });

  it("detects workspace routes by app query on production hosts", () => {
    expect(
      detectActiveApp({
        hostname: "altairworld.com",
        origin: "https://altairworld.com",
        search: "?app=workspace",
      })
    ).toBe("workspace");
  });

  it("sets a router basename only for the GitHub Pages project fallback", () => {
    expect(
      getRouterBasename({
        hostname: "bichengwang.github.io",
        origin: "https://bichengwang.github.io",
        pathname: "/altair-ai-llc/",
      })
    ).toBe("/altair-ai-llc");

    expect(
      getRouterBasename({
        hostname: "altairworld.com",
        origin: "https://altairworld.com",
        pathname: "/",
      })
    ).toBeUndefined();
  });

  it("honors an explicit router basename override", () => {
    vi.stubEnv("VITE_ROUTER_BASENAME", "/preview/");

    expect(
      getRouterBasename({
        hostname: "altairworld.com",
        origin: "https://altairworld.com",
        pathname: "/",
      })
    ).toBe("/preview");
  });

  it("builds handoff URLs against the current origin by default", () => {
    expect(
      buildWorkspaceUrl("/chat", {
        handoffToken: "handoff-123",
        locationLike: {
          hostname: "www.altair.test",
          origin: "https://www.altair.test",
          protocol: "https:",
          search: "",
        },
      })
    ).toBe("https://www.altair.test/chat?app=workspace&handoff=handoff-123");
  });

  it("keeps workspace redirects on localhost even when a production workspace origin is configured", () => {
    vi.stubEnv("VITE_WORKSPACE_ORIGIN", "https://llm.altairworld.com");

    expect(
      buildWorkspaceUrl("/login", {
        locationLike: {
          hostname: "localhost",
          origin: "http://localhost:5173",
          protocol: "http:",
          search: "",
        },
      })
    ).toBe("http://localhost:5173/login?app=workspace");
  });

  it("uses host-aware default signed-in destinations", () => {
    expect(
      getDefaultSignedInPath("marketing", {
        hostname: "www.altair.test",
        origin: "https://www.altair.test",
        search: "",
      })
    ).toBe("/account");
    expect(
      getDefaultSignedInPath("workspace", {
        hostname: "localhost",
        origin: "http://localhost:5173",
        search: "?app=workspace",
      })
    ).toBe("/chat?app=workspace");
  });

  it("keeps marketing paths clean and scopes workspace paths off llm subdomains", () => {
    expect(
      buildAppPath("/account", {
        app: "marketing",
        locationLike: {
          hostname: "localhost",
          origin: "http://localhost:5173",
          search: "",
        },
      })
    ).toBe("/account");

    expect(
      buildAppPath("/chat", {
        app: "workspace",
        locationLike: {
          hostname: "www.altair.test",
          origin: "https://www.altair.test",
          search: "",
        },
      })
    ).toBe("/chat?app=workspace");

    expect(
      buildAppPath("/chat", {
        app: "workspace",
        locationLike: {
          hostname: "llm.altair.test",
          origin: "https://llm.altair.test",
          search: "",
        },
      })
    ).toBe("/chat");
  });

  it("normalizes hash-only OAuth callbacks onto the auth callback route", () => {
    expect(
      getAuthCallbackPathFromHash({
        hostname: "localhost",
        origin: "http://localhost:3000",
        pathname: "/",
        search: "",
        hash: "#access_token=test-access&refresh_token=test-refresh",
      })
    ).toBe("/auth/callback#access_token=test-access&refresh_token=test-refresh");
  });


  it("normalizes query-based OAuth callbacks onto the auth callback route", () => {
    expect(
      getAuthCallbackPathFromHash({
        hostname: "localhost",
        origin: "http://localhost:3000",
        pathname: "/",
        search: "?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+not+found+or+expired",
        hash: "",
      })
    ).toBe(
      "/auth/callback?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+not+found+or+expired"
    );
  });

  it("returns null when already on the callback route", () => {
    expect(
      getAuthCallbackPathFromHash({
        hostname: "localhost",
        origin: "http://localhost:3000",
        pathname: "/auth/callback",
        search: "",
        hash: "#access_token=test-access&refresh_token=test-refresh",
      })
    ).toBeNull();
  });

  it("preserves only same-origin redirect paths", () => {
    const locationLike = {
      hostname: "localhost",
      origin: "http://localhost:5173",
      search: "",
    };

    expect(getSafeRedirectPath("/chat?app=workspace", locationLike)).toBe("/chat?app=workspace");
    expect(getSafeRedirectPath("https://evil.example/phish", locationLike)).toBeNull();
    expect(getSafeRedirectPath("//evil.example/phish", locationLike)).toBeNull();
  });

  it("adds next params only for safe internal paths", () => {
    const locationLike = {
      hostname: "localhost",
      origin: "http://localhost:5173",
      search: "",
    };

    expect(appendNextSearchParam("/login", "/chat?app=workspace", locationLike)).toBe(
      "/login?next=%2Fchat%3Fapp%3Dworkspace"
    );
    expect(appendNextSearchParam("/login", "https://evil.example/phish", locationLike)).toBe("/login");
  });

  it("builds an OAuth consent path on the active app origin", () => {
    expect(
      buildOAuthConsentPath("auth-123", {
        locationLike: {
          hostname: "altairworld.com",
          origin: "https://altairworld.com",
          search: "",
        },
      })
    ).toBe("/oauth/consent?authorization_id=auth-123");
  });

  it("falls back to the signed-in default when next is unsafe", () => {
    const locationLike = {
      hostname: "localhost",
      origin: "http://localhost:5173",
      search: "",
    };

    expect(resolveRedirectPath("/contact", "/account", locationLike)).toBe("/contact");
    expect(resolveRedirectPath("https://evil.example/phish", "/account", locationLike)).toBe("/account");
  });
});
