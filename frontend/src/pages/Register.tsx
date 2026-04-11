import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "@phosphor-icons/react";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import authApiClient from "../api/apiClient";
import Logo from "../components/Logo";
import FormField from "../components/ui/FormField";

// validation logic
const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterInputs = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInputs) => {
    setIsLoading(true);
    setApiError(null);
    try {
      await authApiClient.post("/register/", {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });
      navigate("/verify-email");
    } catch (err) {
      console.error("Registration error:", err);
      let message = "Registration failed. Please try again.";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message || message;
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
          Create a <Logo /> Account
        </h1>

        {apiError && (
          <div className="alert alert-error text-xs py-2 rounded-md">
            <span>{apiError}</span>
          </div>
        )}

        <FormField
          label="Full Name"
          placeholder="Word Smith"
          registration={register("full_name")}
          error={errors.full_name?.message}
        />

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

        <FormField
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          registration={register("confirm_password")}
          error={errors.confirm_password?.message}
        />

        {/* Warning */}
        <div className="alert alert-warning items-start text-left p-3 gap-2 rounded-md border-warning/20">
          <InfoIcon size={20} weight="duotone" className="mt-0.5 shrink-0" />
          <p className="text-sm font-semibold">
            Choose a password you won't forget. <br />
            <span className="underline decoration-2">There is no reset.</span>{" "}
            If you lose it, your letters cannot be recovered.
          </p>
        </div>

        <div className="card-actions mt-4">
          <button
            type="submit"
            disabled={isLoading}
            aria-label="Register"
            className="btn btn-primary w-full shadow-lg"
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Register"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
