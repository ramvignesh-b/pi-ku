import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AutoRedirectRoute, ProtectedRoute } from "./components/RouteGuards";
import SplashScreen from "./components/SplashScreen";
import { ROUTES } from "./config/routes";
import { useAuth } from "./hooks/useAuth";
import { useBootSplash } from "./hooks/useBootSplash";

const Activate = lazy(() => import("./pages/Activate"));
const Escritoire = lazy(() => import("./pages/Escritoire"));
const Quill = lazy(() => import("./pages/Quill"));
const Home = lazy(() => import("./pages/Home"));
const Unlock = lazy(() => import("./pages/Unlock"));
const Letter = lazy(() => import("./pages/Letter"));
const Begin = lazy(() => import("./pages/Begin"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const About = lazy(() => import("./pages/About"));

/**
 * Sits inside the Suspense boundary, so its effect runs only once the lazy
 * route chunk has resolved. That resolution is what "the app is ready" means -
 * anything earlier would hand over to a page that has not rendered yet.
 */
function BootReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return null;
}

export default function App() {
  const { initialize, isInitializing } = useAuth();
  const authInitialized = useRef<boolean>(false);
  const boot = useBootSplash();

  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;
    initialize().then();
  }, [initialize]);

  return (
    <>
      {!isInitializing && (
        <BrowserRouter>
          <main className="relative overflow-clip min-h-screen min-w-screen flex items-center justify-center w-full bg-base-200 grain grain-front">
            <Suspense fallback={boot.visible ? null : <SplashScreen />}>
              <BootReady onReady={boot.markReady} />
              <Routes>
                <Route
                  path={ROUTES.HOME}
                  element={
                    <AutoRedirectRoute>
                      <Home />
                    </AutoRedirectRoute>
                  }
                />

                <Route
                  path={ROUTES.BEGIN}
                  element={
                    <AutoRedirectRoute>
                      <Begin />
                    </AutoRedirectRoute>
                  }
                />
                <Route
                  path={ROUTES.UNLOCK}
                  element={
                    <AutoRedirectRoute>
                      <Unlock />
                    </AutoRedirectRoute>
                  }
                />
                <Route
                  path={ROUTES.VERIFY_EMAIL}
                  element={
                    <AutoRedirectRoute>
                      <VerifyEmail />
                    </AutoRedirectRoute>
                  }
                />
                <Route
                  path={ROUTES.ACTIVATE}
                  element={
                    <AutoRedirectRoute>
                      <Activate />
                    </AutoRedirectRoute>
                  }
                />

                <Route
                  path={ROUTES.ESCRITOIRE}
                  element={
                    <ProtectedRoute>
                      <Escritoire />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.WRITE}
                  element={
                    <ProtectedRoute>
                      <Quill />
                    </ProtectedRoute>
                  }
                />
                <Route path={ROUTES.LETTER} element={<Letter />} />
                <Route path={ROUTES.ABOUT} element={<About />} />
                <Route
                  path="*"
                  element={<Navigate to={ROUTES.HOME} replace />}
                />
              </Routes>
            </Suspense>
          </main>
        </BrowserRouter>
      )}

      {boot.visible && (
        <SplashScreen variant="boot" settling={boot.phase === "settling"} />
      )}
    </>
  );
}
