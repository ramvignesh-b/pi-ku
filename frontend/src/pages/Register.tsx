import { zodResolver } from "@hookform/resolvers/zod";
import { InfoIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Logo from "../components/Logo";

// validation logic
const registerSchema = z
  .object({
    email: z.email("Please enter a valid email"),
    password: z
      .string()
      .check(z.minLength(8, "Password must be at least 8 characters")),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

type RegisterInputs = z.infer<typeof registerSchema>;

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterInputs) => {
    console.log("Form Data:", data);
  };

  return (
    <div className="glass-card w-full max-w-sm p-2 transition-all duration-500 hover:shadow-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="card-body gap-4">
        <h2 className="card-title font-display text-2xl font-bold justify-center text-primary tracking-tight">
          Create a <Logo /> Account
        </h2>

        <div className="form-control">
          <label htmlFor="email" className="label font-bold font-display py-1">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@email.com"
            className={`input input-bordered focus:input-primary ${errors.email ? "input-error" : ""}`}
          />
          {errors.email && (
            <p className="text-error-content text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="form-control">
          <label htmlFor="password" className="label font-bold font-display py-1">
            Password
          </label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={`input input-bordered focus:input-primary ${errors.password ? "input-error" : ""}`}
          />
          {errors.password && (
            <p className="text-error-content text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Pass */}
        <div className="form-control">
          <label htmlFor="confirm_password" className="label font-bold font-display py-1">
            Confirm Password
          </label>
          <input
            {...register("confirm_password")}
            type="password"
            placeholder="••••••••"
            className={`input input-bordered focus:input-primary ${errors.confirm_password ? "input-error" : ""}`}
          />
          {errors.confirm_password && (
            <p className="text-error-content text-xs mt-1">
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-warning/10 border-l-2 border-warning p-3 rounded-r-md flex gap-2">
          <InfoIcon
            size={20}
            weight="duotone"
            className="text-warning mt-0.5 shrink-0"
          />
          <p className="text-sm text-warning-content font-medium opacity-90">
            Choose a password you won't forget. <br />
            <span className="font-semibold underline">There is no reset.</span> If you lose it, your letters cannot be recovered.
          </p>
        </div>

        <div className="card-actions mt-4">
          <button type="submit" className="btn btn-primary w-full shadow-lg">
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
