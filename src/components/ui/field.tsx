import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { errorClass, hintClass, labelClass } from "./control";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {required ? (
          <span className="text-clay" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className={errorClass} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={hintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className={cn(
        "border border-clay-deep/30 bg-clay/10 px-3 py-2 text-sm text-clay-deep",
      )}
    >
      {children}
    </p>
  );
}
