import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useState } from "react";

interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function PasswordInput({
  className,
  error,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={`input input-bordered focus:input-primary w-full pr-12 ${
          error ? "input-error" : ""
        } ${className}`}
      />
      <button
        type="button"
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-pressed={showPassword}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-neutral-content/40 hover:text-primary transition-all duration-300 cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeSlashIcon size={22} weight="duotone" />
        ) : (
          <EyeIcon size={22} weight="duotone" />
        )}
      </button>
    </div>
  );
}
