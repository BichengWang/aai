import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageChrome";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OpenWorkspaceButton from "../components/OpenWorkspaceButton";
import { buildAppPath, getActiveApp } from "../lib/runtime";
import { getWorkspaceErrorMessage, listWorkspaceKeys } from "../lib/workspaceApi";
import type { WorkspaceKeyListResponse } from "../types/workspace";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Account() {
  usePageTitle("Account");
  const { authError, profile, refreshProfile, session, signOut, user } = useAuth();
  const activeApp = getActiveApp();
  const [workspaceData, setWorkspaceData] = useState<WorkspaceKeyListResponse | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    let active = true;

    const loadWorkspaceData = async () => {
      try {
        const data = await listWorkspaceKeys(session);

        if (active) {
          setWorkspaceData(data);
          setWorkspaceError(null);
        }
      } catch (caughtError) {
        if (active) {
          setWorkspaceError(getWorkspaceErrorMessage(caughtError));
        }
      }
    };

    void loadWorkspaceData();

    return () => {
      active = false;
    };
  }, [session]);

  const accountProfile = profile ?? (user
    ? {
        user_id: user.id,
        email: user.email ?? null,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        avatar_url:
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null,
        auth_provider: (user.app_metadata?.provider as string | undefined) ?? null,
        created_at: user.created_at ?? new Date().toISOString(),
        updated_at: user.updated_at ?? new Date().toISOString(),
      }
    : null);

  const validKeys =
    workspaceData?.credentials.filter((credential) => credential.status === "valid").length ?? 0;

  return (
    <section className="lab-page lab-account">
      <div className="container">
        <header className="lab-account-head">
          <p className="lab-kicker lab-micro">
            <span>Account</span>
            <span className="lab-kicker-sep" aria-hidden="true">
              /
            </span>
            <span>Profile</span>
          </p>
          <h1 className="lab-h1">Your Altair profile</h1>
          <p className="lab-lede">
            {activeApp === "workspace"
              ? "This workspace account links your validated provider pool, managed Altair key, and routed chat history."
              : "This is the first authenticated surface for the site. It confirms your session and the profile record stored in Supabase."}
          </p>
          <div className="lab-pagehead-actions">
            <button className="lab-btn lab-btn--primary" type="button" onClick={() => void refreshProfile()}>
              Refresh profile
            </button>
            <button className="lab-btn lab-btn--ghost" type="button" onClick={() => void signOut()}>
              Log out
            </button>
            {activeApp === "marketing" ? <OpenWorkspaceButton className="lab-btn lab-btn--ghost" /> : null}
          </div>
          {authError ? <p className="lab-notice lab-notice--warning">{authError}</p> : null}
          {workspaceError ? <p className="lab-notice lab-notice--warning">{workspaceError}</p> : null}
        </header>

        <div className="lab-account-grid">
          <section className="lab-panel" aria-labelledby="account-profile-title">
            <div className="lab-panel-head">
              {accountProfile?.avatar_url ? (
                <img
                  className="lab-avatar"
                  src={accountProfile.avatar_url}
                  alt={`${accountProfile.full_name ?? accountProfile.email ?? "Altair"} avatar`}
                />
              ) : (
                <div className="lab-avatar lab-avatar--fallback" aria-hidden="true">
                  {(accountProfile?.full_name ?? accountProfile?.email ?? "A").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="lab-micro">Record · profiles</p>
                <h2 id="account-profile-title" className="lab-title">
                  Profile
                </h2>
              </div>
            </div>
            <dl className="lab-record">
              <div>
                <dt className="lab-micro">Full name</dt>
                <dd>{accountProfile?.full_name ?? "Add your name via Supabase metadata"}</dd>
              </div>
              <div>
                <dt className="lab-micro">Email</dt>
                <dd>{accountProfile?.email ?? user?.email ?? "Not available"}</dd>
              </div>
              <div>
                <dt className="lab-micro">Auth provider</dt>
                <dd>{accountProfile?.auth_provider ?? "email"}</dd>
              </div>
              <div>
                <dt className="lab-micro">Member since</dt>
                <dd>{formatDate(accountProfile?.created_at)}</dd>
              </div>
              <div>
                <dt className="lab-micro">Profile updated</dt>
                <dd>{formatDate(accountProfile?.updated_at)}</dd>
              </div>
            </dl>
            <Link
              className="lab-link"
              to={activeApp === "workspace" ? buildAppPath("/chat", { app: "workspace" }) : "/services"}
            >
              {activeApp === "workspace" ? "Return to managed chat" : "Browse services"}
            </Link>
          </section>

          <section className="lab-panel" aria-labelledby="account-workspace-title">
            <div className="lab-panel-head">
              <div>
                <p className="lab-micro">System · S-03</p>
                <h2 id="account-workspace-title" className="lab-title">
                  Managed LLM workspace
                </h2>
              </div>
            </div>
            <p className="lab-body">
              Store provider keys once, receive an Altair-managed key, and route chat traffic across your validated providers.
            </p>
            <dl className="lab-record lab-record--stats">
              <div>
                <dt className="lab-micro">Provider keys</dt>
                <dd className="lab-metric-value">{workspaceData?.credentials.length ?? 0}</dd>
              </div>
              <div>
                <dt className="lab-micro">Valid keys</dt>
                <dd className="lab-metric-value">{validKeys}</dd>
              </div>
              <div>
                <dt className="lab-micro">Managed key</dt>
                <dd>{workspaceData?.managedKey?.status ?? "Not bootstrapped"}</dd>
              </div>
            </dl>
            {activeApp === "marketing" ? (
              <OpenWorkspaceButton className="lab-btn lab-btn--primary" />
            ) : (
              <Link className="lab-link" to={buildAppPath("/keys", { app: "workspace" })}>
                Manage provider keys
              </Link>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
