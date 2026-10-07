import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { buildAppPath } from "../../lib/runtime";
import { consumeWorkspaceHandoff, getWorkspaceErrorMessage } from "../../lib/workspaceApi";
import { loadSupabase } from "../../lib/supabase";

export default function WorkspaceEntry() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authConfigured, loading, refreshProfile, user } = useAuth();
  const [status, setStatus] = useState("Checking your workspace session...");
  const [error, setError] = useState<string | null>(null);
  const handoffToken = searchParams.get("handoff");

  useEffect(() => {
    if (!handoffToken) {
      return;
    }

    if (!authConfigured) {
      setError("Supabase auth is not configured.");
      return;
    }

    let active = true;

    const run = async () => {
      setStatus("Completing your single sign-on handoff...");

      try {
        const client = await loadSupabase();

        if (!client) {
          throw new Error("Supabase auth is not configured.");
        }

        const payload = await consumeWorkspaceHandoff(handoffToken);
        const { error: sessionError } = await client.auth.setSession({
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        await refreshProfile();

        if (active) {
          navigate(buildAppPath("/chat", { app: "workspace" }), { replace: true });
        }
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(getWorkspaceErrorMessage(caughtError));
        setStatus("Workspace sign-in did not complete.");
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [authConfigured, handoffToken, navigate, refreshProfile]);

  if (handoffToken) {
    return (
      <section className="workspace-page workspace-entry-page">
        <div className="workspace-panel workspace-status-panel">
          <span className="pill">Workspace session</span>
          <h2>{status}</h2>
          {error ? <p className="status-banner error">{error}</p> : <p className="status-banner success">Syncing your Altair workspace profile.</p>}
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="workspace-page workspace-entry-page">
        <div className="workspace-panel workspace-status-panel">
          <span className="pill">Workspace session</span>
          <h2>Checking your workspace session...</h2>
        </div>
      </section>
    );
  }

  return <Navigate to={buildAppPath(user ? "/chat" : "/login", { app: "workspace" })} replace />;
}
