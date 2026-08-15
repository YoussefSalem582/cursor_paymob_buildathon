import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<"input"> & { label?: string };

export function Input({ className, label, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full border border-line bg-paper px-3 py-3 text-sm text-ink",
          "placeholder:text-muted",
          className,
        )}
        {...props}
      />
    </div>
  );
}
