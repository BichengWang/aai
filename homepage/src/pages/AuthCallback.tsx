import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDefaultSignedInPath, resolveRedirectPath } from "../lib/runtime";
import { getMissingConfigMessage, supabase } from "../lib/supabase";
import {
  finishSignIn,
  parseCallbackError,
  parseSessionArtifacts,
} from "../lib/authCallback";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authConfigured, refreshProfile } = useAuth();
  const [status, setStatus] = useState("Completing your sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const { errorCode, errorMessage } = parseCallbackError(searchParams, hashParams);
    const artifacts = parseSessionArtifacts(searchParams, hashParams);

    const isRecoverableStateError = errorCode === "bad_oauth_state";
    const hasSessionArtifacts = Boolean(
      artifacts.code || (artifacts.accessToken && artifacts.refreshToken)
    );

    if (errorMessage && (!isRecoverableStateError || !hasSessionArtifacts)) {
      setError(errorMessage);
      setStatus("OAuth sign-in did not complete.");
      return;
    }

    if (!authConfigured || !supabase) {
      setError(getMissingConfigMessage());
      setStatus("Supabase auth is not configured.");
      return;
    }

    const client = supabase;
    const next = resolveRedirectPath(searchParams.get("next"), getDefaultSignedInPath());
    let completed = false;

    if (errorMessage && isRecoverableStateError) {
      setStatus("Recovering your OAuth sign-in session...");
    }

    const completeSignIn = async () => {
      if (completed) {
        return;
      }

      completed = true;
      await refreshProfile();
      navigate(next, { replace: true });
    };

    const cleanup = finishSignIn(client, artifacts, {
      onCompleted: completeSignIn,
      onError: (msg) => {
        setError(msg);
        setStatus("OAuth sign-in did not complete.");
      },
    });

    return cleanup;
  }, [authConfigured, navigate, refreshProfile, searchParams]);

  return (
    <section className="lab-page lab-auth">
      <div className="container lab-grid lab-auth-grid lab-auth-grid--single">
        <div className="lab-auth-copy">
          <p className="lab-kicker lab-micro">
            <span>Account</span>
            <span className="lab-kicker-sep" aria-hidden="true">
              /
            </span>
            <span>Auth callback</span>
          </p>
          <h1 className="lab-h1">{status}</h1>
          <p className="lab-lede">
            We are finishing the Supabase OAuth return and syncing your profile record.
          </p>
          {error ? (
            <p className="lab-notice lab-notice--error" role="alert">
              {error}
            </p>
          ) : (
            <p className="lab-notice lab-notice--success">Redirecting you now...</p>
          )}
        </div>
      </div>
    </section>
  );
}
