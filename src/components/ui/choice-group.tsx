import { cn } from "@/lib/utils";
import { hintClass, labelClass } from "./control";

const columnsClass = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
} as const;

export function ChoiceGroup<T extends string>({
  legend,
  hint,
  value,
  options,
  onChange,
  columns = 2,
}: {
  legend: string;
  hint?: string;
  value: T;
  options: readonly { value: T; label: string; accent?: boolean }[];
  onChange: (value: T) => void;
  columns?: keyof typeof columnsClass;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={labelClass}>{legend}</legend>
      <div className={cn("mt-2 grid gap-2", columnsClass[columns])}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-11 cursor-pointer px-3 py-2 text-center text-sm leading-tight transition-colors",
                selected
                  ? option.accent
                    ? "border border-clay bg-clay text-paper"
                    : "border border-ink bg-ink text-paper"
                  : "border border-line bg-paper text-ink hover:border-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {hint ? <p className={cn("mt-1.5", hintClass)}>{hint}</p> : null}
    </fieldset>
  );
}
