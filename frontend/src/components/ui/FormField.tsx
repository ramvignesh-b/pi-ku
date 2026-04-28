import type { UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: string;
  handleFocus?: () => void;
}

export default function FormField({
  label,
  type = "text",
  placeholder,
  registration,
  error,
  handleFocus,
}: FormFieldProps) {
  return (
    <div className="form-control">
      <label
        htmlFor={registration.name}
        className="field-label font-display text-base-content/90 font-medium"
      >
        {label}
      </label>
      <input
        {...registration}
        id={registration.name}
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
