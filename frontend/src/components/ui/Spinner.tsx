/**
 * src/components/ui/Spinner.tsx — Animated loading spinner.
 */

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-surface-3 border-t-primary animate-spin ${sizeMap[size]} ${className}`}
    />
  );
}
