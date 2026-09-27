import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// allowedRoles is optional: omit it to just require any authenticated user.
// When present, a logged-in user with a different role is sent to their own
// home page instead of being shown a blank/broken page.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    const home = user.role === "CANDIDATE" ? "/portal" : "/dashboard";
    return <Navigate to={home} replace />;
  }
  return children;
}
