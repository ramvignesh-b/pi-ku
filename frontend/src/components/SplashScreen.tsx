import { EnvelopeOpenIcon } from "@phosphor-icons/react";
import Logo from "./Logo";

export default function SplashScreen() {
  return (
    <div className="fixed w-screen h-screen inset-0 bg-base-100 flex flex-col items-center justify-center z-9999">
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
