import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { controlClass } from "./control";
import { Field } from "./field";

type InputProps = ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({
  className,
  label,
  hint,
  error,
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  const control = (
    <input
      {...props}
      id={inputId}
      required={required}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
      className={cn(controlClass, error && "border-clay-deep", className)}
    />
  );

  if (!label) return control;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      required={required}
    >
      {control}
    </Field>
  );
}
