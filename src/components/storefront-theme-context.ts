import { createContext, useContext } from "react";

export type StorefrontThemeMode = "light" | "dark";

export type StorefrontThemeContextValue = {
  mode: StorefrontThemeMode;
  toggleMode: () => void;
};

export const StorefrontThemeContext = createContext<StorefrontThemeContextValue | null>(null);

export function useStorefrontTheme(): StorefrontThemeContextValue {
  const value = useContext(StorefrontThemeContext);
  if (!value) throw new Error("useStorefrontTheme must be used within StorefrontThemeProvider");
  return value;
}
