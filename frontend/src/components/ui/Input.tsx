/**
 * src/components/ui/Input.tsx — Styled text input with label and error state.
 */

import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...rest }, ref) => (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`input-field ${error ? "input-field--error" : ""} ${className}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="input-error">
          {error}
        </p>
      )}
    </div>
  )
);

Input.displayName = "Input";
