import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

export default function Drawer() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="glass-card w-full max-w-sm p-8 text-center fade-zoom"></div>
  );
}
