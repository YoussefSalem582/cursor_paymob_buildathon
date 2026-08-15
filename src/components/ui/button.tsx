import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

const variants = {
  primary: "bg-ink text-paper hover:opacity-90",
  secondary: "bg-paper text-ink border border-ink hover:bg-line/40",
  ghost: "bg-transparent text-ink hover:bg-line/40",
};

export function Button({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
