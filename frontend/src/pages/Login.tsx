import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import Logo from "../components/Logo";
import FormField from "../components/ui/FormField";
import { useAuth } from "../store/useAuth";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInputs = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const login = useAuth((state) => state.login);

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
      await login(data);
      navigate("/drawer");
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
    <div className="flex min-h-screen items-center justify-center bg-base-200">
      <div className="glass-card w-full max-w-sm p-2 transition-all duration-500 hover:shadow-2xl fade-zoom">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-4">
          <h2 className="card-title font-display text-2xl font-bold justify-center text-primary tracking-tight">
            Sign in to <Logo />
          </h2>

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
              className="btn btn-primary w-full shadow-lg"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Sign In"
              )}
            </button>
          </div>

          <div className="text-center text-sm opacity-70">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="link link-primary text-primary-content no-underline hover:underline"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
