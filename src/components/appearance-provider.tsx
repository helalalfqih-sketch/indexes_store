import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
} from "@/lib/domain/appearance";

interface AppearanceContextType {
  settings: StorefrontSettingsShape;
  updateLocalSettings: (key: keyof StorefrontSettingsShape, value: unknown) => void;
  setSettings: (newSettings: StorefrontSettingsShape) => void;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: DEFAULT_STOREFRONT_SETTINGS,
  updateLocalSettings: () => {},
  setSettings: () => {},
});

export function AppearanceProvider({
  children,
  initialSettings = DEFAULT_STOREFRONT_SETTINGS,
}: {
  children: ReactNode;
  initialSettings?: StorefrontSettingsShape;
}) {
  const [settings, setSettings] = useState<StorefrontSettingsShape>(initialSettings);

  // Synchronize CSS variables when theme config changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const { primaryColor, secondaryColor, backgroundColor, fontFamily } = settings.theme;

    if (primaryColor) {
      root.style.setProperty("--primary", primaryColor);
    }
    if (secondaryColor) {
      root.style.setProperty("--primary-light", secondaryColor);
    }
    if (backgroundColor) {
      root.style.setProperty("--showcase", backgroundColor);
    }
    if (fontFamily) {
      root.style.setProperty("--font-sans", `${fontFamily}, system-ui, sans-serif`);
    }
  }, [settings.theme]);

  const updateLocalSettings = (key: keyof StorefrontSettingsShape, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateLocalSettings, setSettings }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}
