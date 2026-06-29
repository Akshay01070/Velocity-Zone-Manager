/**
 * src/components/ui/Button.tsx — Styled button with variants and loading state.
 */

import { type ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function Button({
  variant = "primary",
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn ${variantClass[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner size="sm" />
          <span>Loading…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
