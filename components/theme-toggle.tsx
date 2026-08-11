"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const emptySubscribe = () => () => {};

// Hydration helper that safely checks if component is mounted on client
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const isMounted = useIsMounted();
  const { theme, setTheme } = useTheme();

  if (!isMounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-slate-100" />
      ) : (
        <Moon className="h-5 w-5 text-slate-900" />
      )}
    </button>
  );
}