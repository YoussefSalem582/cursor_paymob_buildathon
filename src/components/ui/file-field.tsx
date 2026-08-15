import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { controlClass } from "./control";
import { Field } from "./field";

type FileFieldProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function FileField({
  className,
  label,
  hint,
  error,
  id,
  required,
  ...props
}: FileFieldProps) {
  const inputId = id ?? props.name;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      required={required}
    >
      <input
        {...props}
        id={inputId}
        type="file"
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          controlClass,
          "max-w-full cursor-pointer py-1.5 file:me-3 file:min-h-8 file:max-w-[50%] file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:text-sm file:text-paper sm:file:max-w-none",
          error && "border-clay-deep",
          className,
        )}
      />
    </Field>
  );
}
