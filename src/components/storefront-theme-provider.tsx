import { Theme } from "@astryxdesign/core";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  StorefrontThemeContext,
  type StorefrontThemeContextValue,
  type StorefrontThemeMode,
} from "@/components/storefront-theme-context";
import { indexesTheme } from "@/themes/indexes.js";

export function StorefrontThemeProvider({ children }: { children: ReactNode }) {
  // Keep the server and the first browser render identical. The saved/system
  // preference is restored immediately after hydration.
  const [mode, setMode] = useState<StorefrontThemeMode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("indexes_store_theme");
    if (saved === "light" || saved === "dark") {
      setMode(saved);
      return;
    }
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) setMode("dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem("indexes_store_theme", mode);
  }, [mode]);

  const value = useMemo<StorefrontThemeContextValue>(
    () => ({
      mode,
      toggleMode: () => setMode((current) => (current === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return (
    <StorefrontThemeContext.Provider value={value}>
      <Theme theme={indexesTheme} mode={mode}>
        {children}
      </Theme>
    </StorefrontThemeContext.Provider>
  );
}
