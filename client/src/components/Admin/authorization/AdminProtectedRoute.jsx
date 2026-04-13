import { Navigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";
import { SkeletonCard } from "../../ui/skeleton/Skeleton";

export const AdminProtectedRoute = ({ children }) => {
  const { isAdmin, isLoggedIn, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="app-page" style={{ padding: "var(--space-6)" }}>
        <SkeletonCard rows={2} withHeader={false} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
