import { Navigate } from "react-router-dom";
import { useAuth } from "../../../store/Auth";

export const AdminProtectedRoute = ({ children }) => {
  const { isAdmin, isLoggedIn, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <h2>Loading...</h2>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return children;
};
