/**
 * src/components/routing/ProtectedRoute.tsx
 *
 * Wraps routes that require authentication.
 * - While auth state is loading: shows a full-screen spinner.
 * - If unauthenticated: redirects to /login (preserving the intended path).
 * - If authenticated: renders the child outlet.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
