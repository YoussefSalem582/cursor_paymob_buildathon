import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export const buttonBase =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 text-center text-sm whitespace-normal transition-opacity disabled:cursor-not-allowed disabled:opacity-60 sm:px-6";

export const buttonVariants = {
  primary: "bg-ink text-paper hover:opacity-90",
  secondary: "border border-ink bg-paper text-ink hover:bg-line/40",
  ghost: "bg-transparent text-ink hover:bg-line/40",
  clay: "bg-clay text-paper hover:opacity-90",
} as const;

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof buttonVariants;
  loading?: boolean;
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
      className={cn(buttonBase, buttonVariants[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
