import { EnvelopeSimpleOpenIcon } from "@phosphor-icons/react";
import Logo from "../components/Logo";

export default function VerifyEmail() {
  return (
    <div className="glass-card w-full max-w-sm p-8 text-center flex flex-col items-center gap-6 fade-zoom">
      <div className="auth-icon-container">
        <EnvelopeSimpleOpenIcon
          size={32}
          weight="duotone"
          className="text-primary"
        />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-xl text-primary">Check Your Email</h2>
        <p className="text-sm opacity-80 leading-relaxed font-sans">
          We've sent an activation link to your inbox. <br />
          Please click it to verify your <Logo /> account.
        </p>
      </div>

      <div className="divider opacity-10"></div>

      <div className="alert bg-base-200/50 p-4 rounded-lg text-xs leading-relaxed text-left opacity-70">
        <p>
          Didn't receive it? Check your spam folder or wait for a few minutes.
          The link will expire in 24 hours.
        </p>
      </div>

      <p
        className="text-xs italic opacity-40 cursor-pointer underline"
        onClick={() => window.close()}
        onKeyDown={(e) => e.key === "Enter" && window.close()}
      >
        You can close this window now.
      </p>
    </div>
  );
}
