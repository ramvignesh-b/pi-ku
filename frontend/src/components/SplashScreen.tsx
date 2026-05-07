import { EnvelopeOpenIcon } from "@phosphor-icons/react";
import Logo from "./Logo";

export default function SplashScreen() {
  return (
    <div data-testid="splash-screen" className="fixed w-screen h-screen inset-0 flex flex-col items-center justify-center z-9999  before:absolute before:top-0 before:left-0 before:w-full before:h-full before:content-[''] before:opacity-[0.03] before:z-10 before:pointer-events-none before:bg-[url('assets/noise.gif')">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <Logo />

        <div className="flex flex-col items-center gap-2">
          <EnvelopeOpenIcon
            weight="thin"
            className={"absolute text-primary/50"}
            size={40}
          />
          <span className="loading loading-ring loading-xl text-primary"></span>
          ...
          <p className="text-xs uppercase font-sans tracking-widester opacity-40">
            Unsealing
          </p>
        </div>
      </div>
    </div>
  );
}
