"use client";

import { useLayoutEffect } from "react";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * Toggles the `dark` class on <html> and remembers the choice.
 * The icon is picked by CSS, not React state, so there is nothing to hydrate.
 */
export function ThemeToggle({ label }: { label: string }) {
  useLayoutEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(dark);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="border border-line px-2.5 py-1.5 text-sm hover:text-ink"
    >
      <span className="dark:hidden">☾</span>
      <span className="hidden dark:inline">☀︎</span>
    </button>
  );
}
