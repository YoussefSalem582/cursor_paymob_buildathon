/** Shared chrome for text fields, file pickers, and similar controls. */
export const controlClass = [
  "w-full min-h-11 min-w-0 max-w-full border border-line bg-paper px-3 text-base text-ink sm:text-sm",
  "placeholder:text-muted",
  "transition-[border-color] duration-150",
  "hover:border-muted",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

export const labelClass = "text-sm font-medium text-ink";
export const hintClass = "text-xs leading-relaxed text-muted";
export const errorClass = "text-xs text-clay-deep";
