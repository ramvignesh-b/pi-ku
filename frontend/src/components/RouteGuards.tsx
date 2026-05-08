import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import SplashScreen from "./SplashScreen";

/**
 * Private route guard.
 * If not authenticated, capture the current url in route
 * state so the Login component can link them back after sign-in
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) return <SplashScreen />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Auto-redirect - auth route guard.
 * If authenticated, redirect all the auth related flows to the drawer
 */
export function AutoRedirectRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <SplashScreen />;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DRAWER} replace />;
  }

  return <>{children}</>;
}
