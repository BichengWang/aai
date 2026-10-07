import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageChrome";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { navigateToUrl } from "../lib/browser";
import { buildAppPath, buildOAuthConsentPath } from "../lib/runtime";
import { getAuthErrorMessage, getMissingConfigMessage, getSupabase } from "../lib/supabase";

type OAuthAuthorizationDetails = {
  authorization_id: string;
  redirect_uri: string;
  client: {
    id: string;
    name: string;
    uri: string;
    logo_uri: string;
  };
  user: {
    id: string;
    email: string;
  };
  scope: string;
};

function getScopeLabel(scope: string) {
  return scope.replace(/[_-]+/g, " ");
}

export default function OAuthConsent() {
  usePageTitle("Authorize access");
  const [searchParams] = useSearchParams();
  const { authConfigured, loading, user, signInWithGoogle } = useAuth();
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [status, setStatus] = useState("Loading authorization request...");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "deny" | "signin" | null>(null);
  const authorizationId = searchParams.get("authorization_id")?.trim() ?? "";
  const scopes = details?.scope.split(/\s+/).filter(Boolean) ?? [];

  useEffect(() => {
    if (!authorizationId) {
      setError("The OAuth request is missing an authorization_id.");
      setStatus("Authorization request not found.");
      return;
    }

    if (!authConfigured) {
      setError(getMissingConfigMessage());
      setStatus("Supabase auth is not configured.");
      return;
    }

    if (loading) {
      setStatus("Checking your Altair session...");
      return;
    }

    if (!user) {
      setStatus("Sign in to review this authorization request.");
      setDetails(null);
      setError(null);
      return;
    }

    let active = true;

    const loadAuthorizationDetails = async () => {
      setStatus("Loading authorization request...");
      setError(null);

      let client: Awaited<ReturnType<typeof getSupabase>>;

      try {
        client = await getSupabase();
      } catch (caughtError) {
        if (active) {
          setError(getAuthErrorMessage(caughtError));
          setStatus("Authorization request not available.");
        }
        return;
      }

      if (!active || !client) {
        return;
      }

      const { data, error: detailsError } = await client.auth.oauth.getAuthorizationDetails(authorizationId);

      if (!active) {
        return;
      }

      if (detailsError) {
        setError(getAuthErrorMessage(detailsError));
        setStatus("Authorization request not available.");
        return;
      }

      if ("redirect_url" in data) {
        setStatus("Authorization already approved. Redirecting...");
        navigateToUrl(data.redirect_url);
        return;
      }

      setDetails(data);
      setStatus("Review the access request below.");
    };

    void loadAuthorizationDetails();

    return () => {
      active = false;
    };
  }, [authorizationId, authConfigured, loading, user]);

  const handleSignIn = async () => {
    if (!authorizationId) {
      return;
    }

    setSubmitting("signin");
    setError(null);

    try {
      await signInWithGoogle(buildOAuthConsentPath(authorizationId));
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
      setSubmitting(null);
    }
  };

  const handleConsent = async (decision: "approve" | "deny") => {
    if (!authorizationId) {
      return;
    }

    const supabase = await getSupabase().catch((caughtError: unknown) => {
      setError(getAuthErrorMessage(caughtError));
      return null;
    });

    if (!supabase) {
      return;
    }

    setSubmitting(decision);
    setError(null);
    setStatus(decision === "approve" ? "Approving authorization..." : "Declining authorization...");

    const response =
      decision === "approve"
        ? await supabase.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true })
        : await supabase.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true });

    if (response.error) {
      setError(getAuthErrorMessage(response.error));
      setStatus("Authorization request could not be completed.");
      setSubmitting(null);
      return;
    }

    navigateToUrl(response.data.redirect_url);
  };

  return (
    <section className="lab-page lab-auth">
      <div className="container lab-grid lab-auth-grid">
        <div className="lab-auth-copy">
          <p className="lab-kicker lab-micro">
            <span>Account</span>
            <span className="lab-kicker-sep" aria-hidden="true">
              /
            </span>
            <span>OAuth consent</span>
          </p>
          <h1 className="lab-h1">{details ? `${details.client.name} is requesting access` : status}</h1>
          <p className="lab-lede">
            {details
              ? `Review the scopes below before Altair issues an authorization code to ${details.client.name}.`
              : "Altair uses Supabase OAuth to authenticate the user first, then collect consent for the requesting application."}
          </p>
          {details ? (
            <>
              <h2 className="lab-micro lab-list-title">App details</h2>
              <ul className="lab-ruled" role="list">
                <li>Signed in as {details.user.email}</li>
                <li>Redirect URI: {details.redirect_uri}</li>
                <li>
                  Client URL:{" "}
                  <a className="lab-link" href={details.client.uri} target="_blank" rel="noreferrer">
                    {details.client.uri}
                  </a>
                </li>
              </ul>
            </>
          ) : null}
        </div>
        <div className="lab-auth-card">
          <p className="lab-micro lab-auth-card-head">Authorization · OAuth 2.1</p>
          {error ? (
            <p className="lab-notice lab-notice--error" role="alert">
              {error}
            </p>
          ) : null}
          {!details && !error ? <p className="lab-notice lab-notice--success">{status}</p> : null}
          {!user && authorizationId ? (
            <>
              <button
                className="lab-btn lab-btn--primary lab-btn--block"
                type="button"
                onClick={handleSignIn}
                disabled={submitting !== null || !authConfigured}
              >
                {submitting === "signin" ? "Redirecting to Google..." : "Continue with Google"}
              </button>
              <p className="lab-auth-switch">
                Need a different route?{" "}
                <Link className="lab-link" to={buildAppPath("/login")}>
                  Open login
                </Link>
              </p>
            </>
          ) : null}
          {details ? (
            <>
              <h2 className="lab-h3">Requested scopes</h2>
              <ul className="lab-ruled" role="list">
                {scopes.map((scope) => (
                  <li key={scope}>{getScopeLabel(scope)}</li>
                ))}
              </ul>
              <button
                className="lab-btn lab-btn--primary lab-btn--block"
                type="button"
                onClick={() => void handleConsent("approve")}
                disabled={submitting !== null}
              >
                {submitting === "approve" ? "Approving..." : "Approve access"}
              </button>
              <button
                className="lab-btn lab-btn--ghost lab-btn--block"
                type="button"
                onClick={() => void handleConsent("deny")}
                disabled={submitting !== null}
              >
                {submitting === "deny" ? "Declining..." : "Deny access"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
