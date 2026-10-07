import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../context/AuthContext";
import type { AppUserProfile } from "../types/auth";

type MockUser = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  app_metadata: { provider: string };
  user_metadata: Record<string, unknown>;
  identities?: Array<{ provider: string }>;
};

type MockSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "bearer";
  user: MockUser;
};

function createUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: "user-123",
    email: "member@altair.test",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    app_metadata: { provider: "email" },
    user_metadata: { full_name: "Altair Member" },
    identities: [{ provider: "email" }],
    ...overrides,
  };
}

function createSession(overrides: Partial<MockSession> = {}): MockSession {
  const user = createUser(overrides.user);

  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user,
    ...overrides,
  };
}

let currentSession: MockSession | null = null;
let currentProfile: AppUserProfile = {
  user_id: "user-123",
  email: "member@altair.test",
  full_name: "Altair Member",
  avatar_url: null,
  auth_provider: "email",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

const signUpMock = vi.fn();
const signInWithPasswordMock = vi.fn();
const signInWithOAuthMock = vi.fn();
const navigateToUrlMock = vi.fn();
const getAuthorizationDetailsMock = vi.fn();
const approveAuthorizationMock = vi.fn();
const denyAuthorizationMock = vi.fn();
const signOutMock = vi.fn();
const exchangeCodeForSessionMock = vi.fn();
const setSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
const getSessionMock = vi.fn();
const selectMaybeSingleMock = vi.fn();
const upsertSelectSingleMock = vi.fn();
let authStateChangeHandler: ((event: string, session: MockSession | null) => void) | null = null;

vi.mock("../lib/supabase", () => {
  const client = {
    auth: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
      onAuthStateChange: (...args: unknown[]) => onAuthStateChangeMock(...args),
      signUp: (...args: unknown[]) => signUpMock(...args),
      signInWithPassword: (...args: unknown[]) => signInWithPasswordMock(...args),
      signInWithOAuth: (...args: unknown[]) => signInWithOAuthMock(...args),
      signOut: (...args: unknown[]) => signOutMock(...args),
      exchangeCodeForSession: (...args: unknown[]) => exchangeCodeForSessionMock(...args),
      setSession: (...args: unknown[]) => setSessionMock(...args),
      oauth: {
        getAuthorizationDetails: (...args: unknown[]) => getAuthorizationDetailsMock(...args),
        approveAuthorization: (...args: unknown[]) => approveAuthorizationMock(...args),
        denyAuthorization: (...args: unknown[]) => denyAuthorizationMock(...args),
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args: unknown[]) => selectMaybeSingleMock(...args),
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: (...args: unknown[]) => upsertSelectSingleMock(...args),
        }),
      }),
    }),
  };

  return {
    isSupabaseConfigured: true,
    getGoogleRedirectUrl: (nextPath?: string) => {
      const url = new URL("http://localhost:5173/auth/callback");

      if (nextPath) {
        url.searchParams.set("next", nextPath);
      }

      return url.toString();
    },
    getMissingConfigMessage: () => "Missing config",
    getAuthErrorMessage: (error: unknown) =>
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error",
    getSupabase: () => Promise.resolve(client),
  };
});

vi.mock("../lib/browser", () => ({
  navigateToUrl: (...args: unknown[]) => navigateToUrlMock(...args),
}));

function renderApp(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  currentSession = null;
  currentProfile = {
    user_id: "user-123",
    email: "member@altair.test",
    full_name: "Altair Member",
    avatar_url: null,
    auth_provider: "email",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
  };

  getSessionMock.mockReset();
  onAuthStateChangeMock.mockReset();
  signUpMock.mockReset();
  signInWithPasswordMock.mockReset();
  signInWithOAuthMock.mockReset();
  navigateToUrlMock.mockReset();
  getAuthorizationDetailsMock.mockReset();
  approveAuthorizationMock.mockReset();
  denyAuthorizationMock.mockReset();
  signOutMock.mockReset();
  exchangeCodeForSessionMock.mockReset();
  setSessionMock.mockReset();
  selectMaybeSingleMock.mockReset();
  upsertSelectSingleMock.mockReset();

  authStateChangeHandler = null;
  getSessionMock.mockResolvedValue({ data: { session: currentSession }, error: null });
  onAuthStateChangeMock.mockImplementation((callback: (event: string, session: MockSession | null) => void) => {
    authStateChangeHandler = callback;
    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
      callback,
    };
  });
  selectMaybeSingleMock.mockResolvedValue({ data: currentProfile, error: null });
  upsertSelectSingleMock.mockResolvedValue({ data: currentProfile, error: null });
  signUpMock.mockResolvedValue({ data: { user: null, session: null }, error: null });
  signInWithPasswordMock.mockResolvedValue({ data: { user: null, session: null }, error: null });
  signInWithOAuthMock.mockResolvedValue({ data: { provider: "google", url: "https://accounts.google.com" }, error: null });
  getAuthorizationDetailsMock.mockResolvedValue({
    data: {
      authorization_id: "auth-123",
      redirect_uri: "https://client.altair.test/callback",
      client: {
        id: "client-123",
        name: "Altair Partner App",
        uri: "https://client.altair.test",
        logo_uri: "https://client.altair.test/logo.png",
      },
      user: {
        id: "user-123",
        email: "member@altair.test",
      },
      scope: "openid profile email",
    },
    error: null,
  });
  approveAuthorizationMock.mockResolvedValue({
    data: {
      redirect_url: "https://client.altair.test/callback?code=oauth-code&state=state-123",
    },
    error: null,
  });
  denyAuthorizationMock.mockResolvedValue({
    data: {
      redirect_url: "https://client.altair.test/callback?error=access_denied&state=state-123",
    },
    error: null,
  });
  signOutMock.mockImplementation(async () => {
    currentSession = null;
    authStateChangeHandler?.("SIGNED_OUT", null);
    return { error: null };
  });
  exchangeCodeForSessionMock.mockResolvedValue({ data: { session: createSession() }, error: null });
  setSessionMock.mockImplementation(async () => {
    authStateChangeHandler?.("SIGNED_IN", currentSession);
    return { data: { session: currentSession }, error: null };
  });
});

describe("auth flows", () => {
  it("renders login and register links for signed-out visitors", async () => {
    renderApp(["/"]);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Login" }).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByRole("link", { name: "Register" }).length).toBeGreaterThan(0);
  });

  it("renders account and logout controls for signed-in visitors", async () => {
    currentSession = createSession();
    getSessionMock.mockResolvedValue({ data: { session: currentSession }, error: null });

    renderApp(["/"]);

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Account" }).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByRole("button", { name: "Logout" }).length).toBeGreaterThan(0);
  });

  it("redirects unauthenticated visitors from account to login", async () => {
    renderApp(["/account"]);

    expect(await screen.findByRole("heading", { name: /welcome back to altair/i })).toBeInTheDocument();
  });

  it("redirects signed-in visitors away from login to account", async () => {
    currentSession = createSession();
    getSessionMock.mockResolvedValue({ data: { session: currentSession }, error: null });

    renderApp(["/login"]);

    expect(await screen.findByRole("heading", { name: /your altair profile/i })).toBeInTheDocument();
  });

  it("shows callback failure states", async () => {
    renderApp(["/auth/callback?error_description=Access%20Denied"]);

    expect(await screen.findByRole("alert")).toHaveTextContent("Access Denied");
  });

  it("accepts callback flows that already created a session without a code", async () => {
    currentSession = createSession({
      user: createUser({
        app_metadata: { provider: "google" },
        identities: [{ provider: "google" }],
        user_metadata: {
          full_name: "Google Member",
          avatar_url: "https://example.com/avatar.png",
        },
      }),
    });
    currentProfile = {
      user_id: "user-123",
      email: "member@altair.test",
      full_name: "Google Member",
      avatar_url: "https://example.com/avatar.png",
      auth_provider: "google",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };
    getSessionMock.mockResolvedValue({ data: { session: currentSession }, error: null });
    selectMaybeSingleMock.mockResolvedValue({ data: currentProfile, error: null });
    upsertSelectSingleMock.mockResolvedValue({ data: currentProfile, error: null });

    renderApp(["/auth/callback?next=%2Faccount"]);

    expect(await screen.findByRole("heading", { name: /your altair profile/i })).toBeInTheDocument();
    expect(screen.getByText("google")).toBeInTheDocument();
  });

  it("accepts implicit callbacks with tokens in the hash", async () => {
    currentSession = createSession({
      user: createUser({
        app_metadata: { provider: "google" },
        identities: [{ provider: "google" }],
      }),
    });
    currentProfile = {
      user_id: "user-123",
      email: "member@altair.test",
      full_name: "Altair Member",
      avatar_url: null,
      auth_provider: "google",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    upsertSelectSingleMock.mockResolvedValue({ data: currentProfile, error: null });
    window.location.hash = "#access_token=test-access&refresh_token=test-refresh";

    renderApp(["/auth/callback?next=%2Faccount"]);

    await waitFor(() => {
      expect(setSessionMock).toHaveBeenCalledWith({
        access_token: "test-access",
        refresh_token: "test-refresh",
      });
    });

    window.location.hash = "";
  });

  it("recovers from bad_oauth_state when tokens are present", async () => {
    currentSession = createSession({
      user: createUser({
        app_metadata: { provider: "google" },
        identities: [{ provider: "google" }],
      }),
    });
    currentProfile = {
      user_id: "user-123",
      email: "member@altair.test",
      full_name: "Altair Member",
      avatar_url: null,
      auth_provider: "google",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    upsertSelectSingleMock.mockResolvedValue({ data: currentProfile, error: null });
    window.location.hash = "#access_token=test-access&refresh_token=test-refresh";

    renderApp([
      "/auth/callback?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+state+not+found+or+expired&next=%2Faccount",
    ]);

    await waitFor(() => {
      expect(setSessionMock).toHaveBeenCalledWith({
        access_token: "test-access",
        refresh_token: "test-refresh",
      });
    });

    window.location.hash = "";
  });

  it("starts Google OAuth from the register screen", async () => {
    const user = userEvent.setup();

    renderApp(["/register"]);

    await screen.findByRole("heading", { name: /create your altair account/i });
    await user.click(screen.getByRole("button", { name: "Register with Google" }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/auth/callback?next=%2Faccount",
        skipBrowserRedirect: true,
      },
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("preserves next when starting Google OAuth from the register screen", async () => {
    const user = userEvent.setup();

    renderApp(["/register?next=%2Fcontact"]);

    await screen.findByRole("heading", { name: /create your altair account/i });
    await user.click(screen.getByRole("button", { name: "Register with Google" }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/auth/callback?next=%2Fcontact",
        skipBrowserRedirect: true,
      },
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("starts Google OAuth from the login screen", async () => {
    const user = userEvent.setup();

    renderApp(["/login"]);

    await screen.findByRole("heading", { name: /welcome back to altair/i });
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/auth/callback?next=%2Faccount",
        skipBrowserRedirect: true,
      },
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("preserves next when starting Google OAuth from the login screen", async () => {
    const user = userEvent.setup();

    renderApp(["/login?next=%2Fcontact"]);

    await screen.findByRole("heading", { name: /welcome back to altair/i });
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:5173/auth/callback?next=%2Fcontact",
        skipBrowserRedirect: true,
      },
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("resumes OAuth consent after signing in from the login screen", async () => {
    const user = userEvent.setup();

    renderApp(["/login?authorization_id=auth-123"]);

    await screen.findByRole("heading", { name: /welcome back to altair/i });
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "http://localhost:5173/auth/callback?next=%2Foauth%2Fconsent%3Fauthorization_id%3Dauth-123",
        skipBrowserRedirect: true,
      },
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("prompts signed-out users to authenticate before consent", async () => {
    const user = userEvent.setup();

    renderApp(["/oauth/consent?authorization_id=auth-123"]);

    expect(await screen.findByRole("heading", { name: /sign in to review this authorization request/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          "http://localhost:5173/auth/callback?next=%2Foauth%2Fconsent%3Fauthorization_id%3Dauth-123",
        skipBrowserRedirect: true,
      },
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith("https://accounts.google.com");
  });

  it("loads consent details for signed-in users and approves access", async () => {
    const user = userEvent.setup();
    currentSession = createSession({
      user: createUser({
        app_metadata: { provider: "google" },
        identities: [{ provider: "google" }],
      }),
    });
    currentProfile = {
      user_id: "user-123",
      email: "member@altair.test",
      full_name: "Altair Member",
      avatar_url: null,
      auth_provider: "google",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    };
    getSessionMock.mockResolvedValue({ data: { session: currentSession }, error: null });

    renderApp(["/oauth/consent?authorization_id=auth-123"]);

    expect(await screen.findByRole("heading", { name: /altair partner app is requesting access/i })).toBeInTheDocument();
    expect(getAuthorizationDetailsMock).toHaveBeenCalledWith("auth-123");
    await user.click(screen.getByRole("button", { name: "Approve access" }));

    await waitFor(() => {
      expect(approveAuthorizationMock).toHaveBeenCalledWith("auth-123", { skipBrowserRedirect: true });
    });
    expect(navigateToUrlMock).toHaveBeenCalledWith(
      "https://client.altair.test/callback?code=oauth-code&state=state-123"
    );
  });

  it("signs out and returns to the signed-out navigation", async () => {
    const user = userEvent.setup();
    currentSession = createSession();
    getSessionMock.mockResolvedValue({ data: { session: currentSession }, error: null });

    renderApp(["/account"]);

    const logoutButton = await screen.findByRole("button", { name: "Log out" });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Login" }).length).toBeGreaterThan(0);
    });
  });
});
