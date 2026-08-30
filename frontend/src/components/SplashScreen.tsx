import { EnvelopeOpenIcon } from "@phosphor-icons/react";
import BootWave from "./BootWave";
import Logo from "./Logo";

interface SplashScreenProps {
  /**
   * "boot" is the first splash of a session and carries the wave. In-app waits
   * - a guarded route, a lazy chunk - stay plain: they are sub-second, and a
   * wave there would read as friction rather than as ceremony.
   */
  variant?: "plain" | "boot";
  /** Set once the app has rendered underneath; the wave stills and this fades. */
  settling?: boolean;
}

export default function SplashScreen({
  variant = "plain",
  settling = false,
}: SplashScreenProps) {
  const isBoot = variant === "boot";

  return (
    <div
      data-testid="splash-screen"
      data-settling={settling || undefined}
      className="splash fixed w-screen h-screen inset-0 flex flex-col items-center justify-center z-9999"
    >
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <Logo />

        <div className="flex flex-col items-center gap-2">
          {isBoot ? (
            <>
              {/* In flow rather than absolute, so the mark, the envelope and
                  the wave stack as one object. */}
              <EnvelopeOpenIcon
                weight="thin"
                className="text-primary/50"
                size={40}
              />
              <BootWave settling={settling} />
            </>
          ) : (
            <>
              <EnvelopeOpenIcon
                weight="thin"
                className={"absolute text-primary/50"}
                size={40}
              />
              <span className="loading loading-ring loading-xl text-primary"></span>
              ...
            </>
          )}

          <p className="text-xs uppercase font-sans tracking-widester opacity-40">
            Unsealing
          </p>
        </div>
      </div>
    </div>
  );
}
