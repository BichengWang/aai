import { useEffect } from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { navigateToUrl } from "../lib/browser";
import { isResearchPath } from "../lib/researchAccess";
import { getSafeRedirectPath } from "../lib/runtime";

type PublicOnlyRouteProps = {
  authenticatedTo?: string;
};

// A report's sign-in prompt links here; a visitor who is already signed in
// goes straight back to the report, now readable in full.
function ResearchRedirect({ to }: { to: string }) {
  useEffect(() => {
    navigateToUrl(to);
  }, [to]);

  return (
    <section className="lab-page lab-auth">
      <div className="container route-loading lab-micro">Opening the report...</div>
    </section>
  );
}

export default function PublicOnlyRoute({ authenticatedTo = "/account" }: PublicOnlyRouteProps) {
  const { loading, user } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <section className="lab-page lab-auth">
        <div className="container route-loading lab-micro">Checking your session...</div>
      </section>
    );
  }

  if (user) {
    const next = getSafeRedirectPath(searchParams.get("next"));

    if (next && isResearchPath(next)) {
      return <ResearchRedirect to={next} />;
    }

    return <Navigate to={authenticatedTo} replace />;
  }

  return <Outlet />;
}
