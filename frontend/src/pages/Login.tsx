import { zodResolver } from "@hookform/resolvers/zod";
import {
  HandPalmIcon,
  ShieldCheckIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { api, publicApi } from "../api/apiClient";
import Logo from "../components/Logo";
import FormField from "../components/ui/FormField";
import Saajan from "../components/ui/Saajan";
import { endpoints } from "../config/endpoints";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";
import { CryptoUtils } from "../utils/crypto";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInputs = z.infer<typeof loginSchema>;

function WelcomeModal({
  setShowWelcome,
}: {
  setShowWelcome: (show: boolean) => void;
}) {
  return (
    <div className="modal modal-open backdrop-blur-sm transition-all duration-1000">
      <div className="absolute bottom-1">
        <Saajan
          message={"I've lost words before.\nI know what it feels like."}
        />
      </div>
      <div className="modal-box border bg-base-100/20 border-primary/20 shadow-2xl p-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full animate-pulse">
            <ShieldCheckIcon
              size={48}
              weight="duotone"
              className="text-primary"
            />
          </div>
          <h3 className="font-display text-2xl font-bold text-primary">
            Welcome to &nbsp;
            <Logo /> &nbsp;!
          </h3>
          <p className="text-base-content/80 leading-relaxed">
            Before we begin, let me make a small promise.
            <HandPalmIcon
              size={18}
              className="inline text-primary"
              weight="fill"
            />
            <div className="divider my-0"></div>
            <br />
            Everything you write here is sealed with your password,{" "}
            <span className="font-display text-success">cryptographically</span>
            , before it leaves your hands.
            <br />A fancy way of saying, I couldn't if I tried.
          </p>

          <div className="alert alert-warning bg-paper/20 border-paper/20 flex items-start gap-3 text-left py-3">
            <WarningIcon size={24} weight="fill" className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-primary-content">
              If you ever happen to forget your password, your letters are lost
              to time, forever.
              <br />
              <span className="font-bold mt-2">
                I highly, highly recommend storing this password in your{" "}
                <a
                  href="https://www.privacyguides.org/en/passwords/"
                  target="_blank"
                  className="link link-primary-content"
                  rel="noopener"
                >
                  password manager
                </a>{" "}
                or somewhere safe to remember it.
              </span>
            </p>
          </div>

          <div className="modal-action w-full">
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="btn btn-primary w-full shadow-lg"
            >
              I'll remember
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { setAuthStore } = useAuth();
  const [showWelcome, setShowWelcome] = useState(!!location.state?.firstTime);
  const [saajanMessage, setSaajanMessage] = useState<string>(
    "I was wondering when you'd return.",
  );
  const nextRoute = location.state?.redirectUrl || ROUTES.DRAWER;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInputs) => {
    setIsLoading(true);
    setApiError(null);
    try {
      // client side key derivation for 0 knowledge
      const { masterKey, authHash } = await CryptoUtils.deriveKeyBundle(
        data.password,
        data.email,
      );

      // send just the authHash as the password to the server
      const { data: authData } = await publicApi.post(endpoints.LOGIN, {
        email: data.email,
        password: authHash,
      });

      const { data: userData } = await api.get(endpoints.ME, {
        headers: { Authorization: `Bearer ${authData.access}` },
      });

      // store the auth related data
      await setAuthStore(authData.access, userData, masterKey);

      navigate(nextRoute, { replace: true });
    } catch (err) {
      let message =
        "Sorry, we're experiencing technical issues.\nPlease try again later.";
      if (axios.isAxiosError(err) && err.response?.status !== 500) {
        message = err.response?.data?.detail || err.response?.data?.message;
      }
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {!showWelcome && <Saajan message={saajanMessage} position="top" />}
      {showWelcome && <WelcomeModal setShowWelcome={setShowWelcome} />}
      <div className="glass-card w-full max-w-sm p-2 transition-all duration-500 hover:shadow-2xl fade-zoom">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-4">
          <h1 className="card-title font-display text-2xl justify-center text-primary/80 tracking-tight">
            Enter <Logo /> Archive
          </h1>

          {apiError && (
            <div className="alert alert-error text-xs py-2 rounded-md">
              <span>{apiError}</span>
            </div>
          )}

          <FormField
            label="Email"
            type="email"
            placeholder="f.kafka@wrongtrain.com"
            registration={register("email")}
            error={errors.email?.message}
            handleFocus={() => setSaajanMessage("I remember you.")}
          />

          <FormField
            label="Password"
            type="password"
            placeholder="••••••••"
            registration={register("password")}
            error={errors.password?.message}
            handleFocus={() =>
              setSaajanMessage("The one thing I cannot know for you.")
            }
          />

          <div className="card-actions mt-4">
            <button
              type="submit"
              name="login"
              disabled={isLoading}
              aria-label="Sign In"
              className="btn btn-primary w-full shadow-lg"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          <div className="text-center text-sm font-medium text-base-content/70">
            Don't have an account?{" "}
            <button
              type="button"
              name="register"
              onClick={() => navigate(ROUTES.ONBOARD)}
              className="link link-primary no-underline hover:underline font-bold"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
