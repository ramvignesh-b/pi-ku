import { useAuth } from "../hooks/useAuth";

export default function Drawer() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="glass-card w-full max-w-sm p-8 text-center flex flex-col gap-6 fade-zoom">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-primary">
          Your Drawer
        </h1>
        <p className="text-sm opacity-70">Welcome back, {user.full_name}</p>
      </div>

      <div className="divider opacity-10" />

      <button
        type="button"
        onClick={logout}
        className="btn btn-link btn-xs opacity-40 hover:opacity-100 no-underline transition-all"
      >
        Sign Out
      </button>
    </div>
  );
}
