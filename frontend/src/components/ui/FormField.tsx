import type { UseFormRegisterReturn } from "react-hook-form";

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
    <div className="form-control">
      <label
        htmlFor={registration.name}
        className="field-label font-display text-neutral-content/80 font-medium"
      >
        {label}
      </label>
      <input
        {...registration}
        id={registration.name}
        data-testid={testId}
        type={type}
        placeholder={placeholder}
        className={`input input-bordered focus:input-primary ${
          error ? "input-error" : ""
        }`}
        onFocus={handleFocus}
      />
      {error && <p className="text-error">{error}</p>}
    </div>
  );
}
