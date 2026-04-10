import Logo from "../components/Logo";

export default function Login() {
  return (
    <div className="glass-card w-full max-w-sm p-8 text-center fade-zoom">
      <h2 className="font-display text-2xl font-bold text-primary">
        Login to <Logo />
      </h2>
      <div className="divider"></div>
      <button type="button" disabled className="btn btn-primary w-full">
        Sign In
      </button>
    </div>
  );
}
