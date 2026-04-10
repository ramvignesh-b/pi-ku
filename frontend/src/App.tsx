import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Logo from "./components/Logo";
import Activate from "./pages/Activate";
import Drawer from "./pages/Drawer";
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
      <div className="min-h-screen bg-base-200 p-8 flex items-center justify-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboard" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/activate/:uidb64/:token" element={<Activate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/drawer" element={<Drawer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
