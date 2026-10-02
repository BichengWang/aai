import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appendNextSearchParam } from "../lib/runtime";

type ProtectedRouteProps = {
  redirectTo?: string;
};

export default function ProtectedRoute({ redirectTo = "/login" }: ProtectedRouteProps) {
  const { loading, user } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}${location.hash}`;

  if (loading) {
    return (
      <section className="lab-page lab-auth">
        <div className="container route-loading lab-micro">Checking your session...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={appendNextSearchParam(redirectTo, from)}
        replace
        state={{ from }}
      />
    );
  }

  return <Outlet />;
}
