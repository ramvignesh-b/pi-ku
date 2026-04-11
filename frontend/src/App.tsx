import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Logo from "./components/Logo";
import { ROUTES } from "./config/routes";
import Activate from "./pages/Activate";
import Drawer from "./pages/Drawer";
import Editor from "./pages/Editor";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import { useAuth } from "./store/useAuth";

export default function App() {
  const { checkAuth, isInitializing } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <Logo />
        <span className="loading loading-dots loading-lg text-primary"></span>
        <p className="text-sm font-medium opacity-50 uppercase tracking-widest">
          LOADING...
        </p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <main className="min-h-screen bg-base-200 flex items-center justify-center w-full">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.ONBOARD} element={<Register />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
          <Route path={ROUTES.ACTIVATE} element={<Activate />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.DRAWER} element={<Drawer />} />
          <Route path={ROUTES.WRITE} element={<Editor />} />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
