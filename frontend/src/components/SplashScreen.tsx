import Logo from "./Logo";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-base-100 flex flex-col items-center justify-center z-9999">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <Logo />
        <div className="flex flex-col items-center gap-2">
          <span className="loading loading-ring loading-lg text-primary" />
          <p className="text-xs uppercase tracking-widest opacity-40 font-display">
            Initializing Identity
          </p>
        </div>
      </div>
    </div>
  );
}
