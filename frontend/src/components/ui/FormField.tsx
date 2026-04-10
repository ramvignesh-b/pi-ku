import type { UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  error?: string;
}

export default function FormField({
  label,
  type = "text",
  placeholder,
  registration,
  error,
}: FormFieldProps) {
  return (
    <div className="form-control">
      <label
        htmlFor={registration.name}
        className="field-label font-display text-primary-content"
      >
        {label}
      </label>
      <input
        {...registration}
        type={type}
        placeholder={placeholder}
        className={`input input-bordered focus:input-primary ${
          error ? "input-error" : ""
        }`}
      />
      {error && <p className="text-error-content">{error}</p>}
    </div>
  );
}
