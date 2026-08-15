import { cn } from "@/lib/utils";
import type { PaymentStars } from "@/lib/orders";

export function Stars({
  value,
  label,
  className,
}: {
  value: PaymentStars;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex gap-0.5 text-[0.95em] leading-none", className)}
      aria-label={label ?? `${value} / 5`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={index < value ? "text-clay" : "text-line"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}
