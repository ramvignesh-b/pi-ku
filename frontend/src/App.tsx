import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Activate from './pages/Activate';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base-200 p-8 flex items-center justify-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/activate/:uidb64/:token" element={<Activate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
