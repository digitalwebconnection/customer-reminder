import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/common";

export default function GuestRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading workspace..." />;
  }

  if (isAuthenticated) {
    if (user?.role === "superadmin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/reminders" replace />;
  }

  return children;
}
