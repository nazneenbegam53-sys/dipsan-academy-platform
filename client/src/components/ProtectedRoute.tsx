import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";
import { Spinner } from "./ui";

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  // Every user must have a linked mobile for OTP login.
  const onComplete = location.pathname === "/complete-profile";
  if ((user.needsPhone || !user.phone) && !onComplete) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
}
