import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";
import SplashScreen from "./components/SplashScreen";
import { ROUTES } from "./config/routes";
import { useAuth } from "./hooks/useAuth";
import Activate from "./pages/Activate";
import Drawer from "./pages/Drawer";
import Editor from "./pages/Editor";
// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  const { initialize, isInitializing } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <main className="min-h-screen bg-base-200 flex items-center justify-center w-full">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />

          <Route
            path={ROUTES.ONBOARD}
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.VERIFY_EMAIL}
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            }
          />
          <Route
            path={ROUTES.ACTIVATE}
            element={
              <PublicRoute>
                <Activate />
              </PublicRoute>
            }
          />

          <Route
            path={ROUTES.DRAWER}
            element={
              <ProtectedRoute>
                <Drawer />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.WRITE()}
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
