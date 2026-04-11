import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { api, publicApi } from "../api/apiClient";
import Logo from "../components/Logo";
import FormField from "../components/ui/FormField";
import { endpoints } from "../config/endpoints";
import { ROUTES } from "../config/routes";
import { useAuth } from "../hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInputs = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { login } = useAuth();

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
      const { data: authData } = await publicApi.post(endpoints.LOGIN, data);

      const { data: userData } = await api.get(endpoints.ME, {
        headers: { Authorization: `Bearer ${authData.access}` },
      });

      login(authData.access, userData, data.password);

      navigate(ROUTES.DRAWER);
    } catch (err) {
      console.error("Login error:", err);
      let message = "Invalid email or password";
      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.detail || err.response?.data?.message || message;
      }
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card w-full max-w-sm p-2 transition-all duration-500 hover:shadow-2xl fade-zoom">
      <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-4">
        <h1 className="card-title font-display text-2xl font-bold justify-center text-primary tracking-tight">
          Sign in to <Logo />
        </h1>

        {apiError && (
          <div className="alert alert-error text-xs py-2 rounded-md">
            <span>{apiError}</span>
          </div>
        )}

        <FormField
          label="Email"
          type="email"
          placeholder="you@email.com"
          registration={register("email")}
          error={errors.email?.message}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="••••••••"
          registration={register("password")}
          error={errors.password?.message}
        />

        <div className="card-actions mt-4">
          <button
            type="submit"
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
            onClick={() => navigate(ROUTES.ONBOARD)}
            className="link link-primary no-underline hover:underline font-bold"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
