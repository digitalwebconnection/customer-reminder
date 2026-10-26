import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { LoadingScreen } from "../components/common";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Verifying secure session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
