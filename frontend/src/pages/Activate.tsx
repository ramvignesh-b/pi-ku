import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publicApi } from "../api/apiClient";
import Logo from "../components/Logo";
import { endpoints, replacePathParams } from "../config/endpoints";
import { ROUTES } from "../config/routes";

export default function Activate() {
  const { uidb64, token } = useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const hasCalled = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!(uidb64 && token) || hasCalled.current) return;
    hasCalled.current = true;

    const activateAccount = async () => {
      try {
        const url = replacePathParams(endpoints.ACTIVATE, {
          uidb64,
          token,
        });
        await publicApi.get(url);
        setStatus("success");
      } catch (_err) {
        setStatus("error");
      }
    };

    activateAccount();
  }, [uidb64, token]);

  return (
    <div className="glass-card w-full max-w-sm p-8 text-center fade-zoom">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4 py-8">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-sm opacity-70">Activating your account...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-6 duration-500">
          <div className="bg-success/10 p-4 rounded-full">
            <CheckCircleIcon
              size={64}
              weight="duotone"
              className="text-success"
            />
          </div>
          <h2
            data-testid="activation-success-header"
            className="font-display text-xl text-success"
          >
            You're in.
          </h2>
          <p className="opacity-70 leading-relaxed">
            Welcome to <Logo scale={1} />
            <br />
            Just one more step and you can start writing timeless letters.
          </p>
          <div className="divider opacity-10 my-0"></div>
          <button
            type="button"
            data-testid="start-writing-btn"
            className="btn btn-primary w-full shadow-lg"
            onClick={() =>
              navigate(ROUTES.LOGIN, {
                state: { firstTime: true },
                replace: true,
              })
            }
          >
            I'm ready
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-error/10 p-4 rounded-full">
            <XCircleIcon size={64} weight="duotone" className="text-error" />
          </div>
          <h2 className="font-display text-xl text-error">Activation Failed</h2>
          <p className="opacity-70 leading-relaxed">
            The link might be expired or already used. Please try registering
            again.
          </p>
          <div className="divider opacity-10 my-0"></div>
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => navigate(ROUTES.ONBOARD)}
          >
            Register Again
          </button>
        </div>
      )}
    </div>
  );
}
