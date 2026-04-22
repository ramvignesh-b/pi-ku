import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";
import SplashScreen from "./components/SplashScreen";
import { ROUTES } from "./config/routes";
import { useAuth } from "./hooks/useAuth";

let authInitialized = false;

const Activate = lazy(() => import("./pages/Activate"));
const Drawer = lazy(() => import("./pages/Drawer"));
const Editor = lazy(() => import("./pages/Editor"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Reader = lazy(() => import("./pages/Reader"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

export default function App() {
  const { initialize, isInitializing } = useAuth();

  useEffect(() => {
    if (authInitialized) return;
    authInitialized = true;
    initialize();
  }, [initialize]);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <main className="min-h-screen bg-base-200 flex items-center justify-center w-full">
        <Suspense fallback={<SplashScreen />}>
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
              path={ROUTES.WRITE}
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route path={ROUTES.READ} element={<Reader />} />
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}
