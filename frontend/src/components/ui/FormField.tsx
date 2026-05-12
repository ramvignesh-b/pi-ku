import type { UseFormRegisterReturn } from "react-hook-form";
import { PasswordInput } from "./PasswordInput";

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  handleFocus?: () => void;
  "data-testid"?: string;
}

export default function FormField({
  label,
  type = "text",
  placeholder,
  registration,
  error,
  handleFocus,
  "data-testid": testId,
}: FormFieldProps) {
  return (
    <div className="form-control w-full">
      <label
        htmlFor={registration.name}
        className="field-label font-display text-neutral-content/80 font-medium"
      >
        {label}
      </label>
      {type === "password" ? (
        <PasswordInput
          {...registration}
          id={registration.name}
          data-testid={testId}
          placeholder={placeholder}
          error={!!error}
          onFocus={handleFocus}
        />
      ) : (
        <input
          {...registration}
          id={registration.name}
          data-testid={testId}
          type={type}
          placeholder={placeholder}
          className={`input input-bordered focus:input-primary w-full ${
            error ? "input-error" : ""
          }`}
          onFocus={handleFocus}
        />
      )}
      {error && <p className="mt-1 text-xs text-error font-medium">{error}</p>}
    </div>
  );
}
