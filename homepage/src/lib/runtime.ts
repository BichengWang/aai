export type ActiveApp = "marketing" | "workspace";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const WORKSPACE_QUERY_VALUE = "workspace";
const GITHUB_PAGES_REPOSITORY_PATH = "/altair-ai-llc";

type LocationLike = {
  hostname: string;
  origin: string;
  port?: string;
  protocol?: string;
  search?: string;
  pathname?: string;
  hash?: string;
};

type BuildAppPathOptions = {
  app?: ActiveApp;
  locationLike?: LocationLike;
};

function getLocationOrigin(locationLike: LocationLike) {
  return (
    locationLike.origin ||
    `${locationLike.protocol ?? "https:"}//${locationLike.hostname}${locationLike.port ? `:${locationLike.port}` : ""}`
  );
}

export function detectActiveApp(locationLike: LocationLike): ActiveApp {
  const { hostname, search = "" } = locationLike;
  const searchParams = new URLSearchParams(search);

  if (searchParams.get("app") === WORKSPACE_QUERY_VALUE) {
    return "workspace";
  }

  if (hostname === "llm" || hostname.startsWith("llm.")) {
    return "workspace";
  }

  return "marketing";
}

export function getActiveApp() {
  return detectActiveApp(window.location);
}

export function getRouterBasename(locationLike: LocationLike = window.location) {
  const configuredBasename = import.meta.env.VITE_ROUTER_BASENAME?.trim();

  if (configuredBasename) {
    return `/${configuredBasename.replace(/^\/+|\/+$/g, "")}`;
  }

  if (
    locationLike.hostname.toLowerCase() === "bichengwang.github.io" &&
    (locationLike.pathname === GITHUB_PAGES_REPOSITORY_PATH ||
      locationLike.pathname.startsWith(`${GITHUB_PAGES_REPOSITORY_PATH}/`))
  ) {
    return GITHUB_PAGES_REPOSITORY_PATH;
  }

  return undefined;
}

export function isLocalWorkspacePreview(locationLike: LocationLike = window.location) {
  return detectActiveApp(locationLike) === "workspace" && LOCAL_HOSTS.has(locationLike.hostname);
}

export function buildAppPath(path: string, options: BuildAppPathOptions = {}) {
  const { locationLike = window.location, app = detectActiveApp(locationLike) } = options;
  const origin = getLocationOrigin(locationLike);
  const url = new URL(path, origin);

  const shouldScopeWorkspacePath = app === "workspace" && !locationLike.hostname.startsWith("llm.") && locationLike.hostname !== "llm";

  if (shouldScopeWorkspacePath) {
    url.searchParams.set("app", WORKSPACE_QUERY_VALUE);
  } else {
    url.searchParams.delete("app");
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function getSafeRedirectPath(
  path: string | null | undefined,
  locationLike: LocationLike = window.location
) {
  if (!path) {
    return null;
  }

  try {
    const origin = getLocationOrigin(locationLike);
    const url = new URL(path, origin);

    if (url.origin !== origin || !url.pathname.startsWith("/")) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function appendNextSearchParam(
  path: string,
  nextPath: string | null | undefined,
  locationLike: LocationLike = window.location
) {
  const safeNextPath = getSafeRedirectPath(nextPath, locationLike);

  if (!safeNextPath) {
    return path;
  }

  const url = new URL(path, getLocationOrigin(locationLike));
  url.searchParams.set("next", safeNextPath);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function buildOAuthConsentPath(
  authorizationId: string,
  options: {
    app?: ActiveApp;
    locationLike?: LocationLike;
  } = {}
) {
  const { locationLike = window.location, app = detectActiveApp(locationLike) } = options;
  const basePath = buildAppPath("/oauth/consent", { app, locationLike });
  const url = new URL(basePath, getLocationOrigin(locationLike));
  url.searchParams.set("authorization_id", authorizationId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function resolveRedirectPath(
  nextPath: string | null | undefined,
  fallbackPath = getDefaultSignedInPath(),
  locationLike: LocationLike = window.location
) {
  return getSafeRedirectPath(nextPath, locationLike) ?? fallbackPath;
}

export function getDefaultSignedInPath(app = getActiveApp(), locationLike: LocationLike = window.location) {
  return buildAppPath(app === "workspace" ? "/chat" : "/account", { app, locationLike });
}

export function getWorkspaceOrigin(locationLike: LocationLike = window.location) {
  const configuredOrigin = import.meta.env.VITE_WORKSPACE_ORIGIN;
  const isLocalHost = LOCAL_HOSTS.has(locationLike.hostname);

  if (isLocalHost) {
    return locationLike.origin.replace(/\/$/, "");
  }

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const { hostname, origin, port = "", protocol = "https:" } = locationLike;

  if (hostname === "llm" || hostname.startsWith("llm.")) {
    return origin.replace(/\/$/, "");
  }

  return `${protocol}//${hostname}${port ? `:${port}` : ""}`.replace(/\/$/, "");
}

export function getAuthCallbackPathFromHash(locationLike: LocationLike = window.location) {
  const hash = locationLike.hash ?? "";
  const search = locationLike.search ?? "";
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(search);
  const hasCallbackPayload =
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("error") ||
    hashParams.has("error_description") ||
    searchParams.has("code") ||
    searchParams.has("error_code") ||
    searchParams.has("error_description");

  if (!hasCallbackPayload || locationLike.pathname === "/auth/callback") {
    return null;
  }

  const callbackPath = buildAppPath("/auth/callback", { locationLike });
  return `${callbackPath}${search}${hash}`;
}

export function buildWorkspaceUrl(
  path = "/chat",
  options: {
    handoffToken?: string;
    locationLike?: LocationLike;
  } = {}
) {
  const { handoffToken, locationLike = window.location } = options;
  const origin = getWorkspaceOrigin(locationLike);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${origin}${normalizedPath}`);

  const workspaceHost = new URL(origin).hostname;
  if (workspaceHost !== "llm" && !workspaceHost.startsWith("llm.")) {
    url.searchParams.set("app", WORKSPACE_QUERY_VALUE);
  }

  if (handoffToken) {
    url.searchParams.set("handoff", handoffToken);
  }

  return url.toString();
}
