import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Activate from "./pages/Activate";
import Drawer from "./pages/Drawer";
import Home from "./pages/Home";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base-200 p-8 flex items-center justify-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/onboard" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/activate/:uidb64/:token" element={<Activate />} />
          <Route path="/login" element={<Drawer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
