import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import SplashScreen from "./SplashScreen";

/**
 * Post-login routes.
 * Redirects to /login if not already authenticated.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) return <SplashScreen />;

  if (!isAuthenticated) {
    // Save the intended location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Pre-login flows.
 * Redirects to /drawer if already authenticated.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <SplashScreen />;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DRAWER} replace />;
  }

  return <>{children}</>;
}
