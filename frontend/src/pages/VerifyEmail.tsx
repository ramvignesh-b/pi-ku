import { EnvelopeSimpleOpenIcon } from "@phosphor-icons/react";
import Logo from "../components/Logo";
import Saajan from "../components/ui/Saajan";

export default function VerifyEmail() {
  return (
    <div className="relative">
      <Saajan
        message={"I sent something to your inbox.\nOpen it, and we can begin."}
      />

      <div className="glass-card w-full max-w-sm p-8 text-center flex flex-col items-center gap-6 fade-zoom">
        <div className="auth-icon-container">
          <EnvelopeSimpleOpenIcon
            size={32}
            weight="duotone"
            className="text-primary"
          />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl text-primary">
            Check Your Mailbox
          </h2>
          <p className="text-sm opacity-80 leading-relaxed font-sans mt-6">
            You're one train away from starting your <Logo scale={0.8} />{" "}
            journey.
          </p>
        </div>

        <div className="divider opacity-10 my-0"></div>

        <div className="alert bg-base-200/50 p-4 rounded-lg text-xs leading-relaxed opacity-70 text-center">
          <p>
            Nothing yet? Sometimes letters take the wrong train. Check your spam
            folder.
            <br />
            <span className="underline font-bold">
              The link expires in 24 hours.
            </span>
            <br /> I'm patient... but not endlessly so
          </p>
        </div>

        <button
          type="button"
          className="text-xs italic opacity-40 cursor-pointer underline"
          onClick={() => window.close()}
        >
          You can close this window now.
        </button>
      </div>
    </div>
  );
}
