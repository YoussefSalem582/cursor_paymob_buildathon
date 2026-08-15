import { cn } from "@/lib/utils";
import { hintClass, labelClass } from "./control";

export function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`${labelClass} min-w-0 flex-1`}>{label}</p>
        <div className="flex shrink-0 items-stretch border border-line">
          <button
            type="button"
            aria-label={decreaseLabel}
            disabled={value <= min}
            onClick={() => onChange(value - 1)}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-lg leading-none hover:bg-line/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="flex min-w-12 items-center justify-center border-x border-line tabular-nums"
          >
            {value}
          </span>
          <button
            type="button"
            aria-label={increaseLabel}
            disabled={value >= max}
            onClick={() => onChange(value + 1)}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-lg leading-none hover:bg-line/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      {hint ? <p className={cn("mt-1.5", hintClass)}>{hint}</p> : null}
    </div>
  );
}
