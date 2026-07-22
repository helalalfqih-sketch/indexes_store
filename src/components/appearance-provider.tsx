import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
} from "@/lib/domain/appearance";
import { getStorefrontAppearance } from "@/lib/actions/appearance.actions";
import { StorefrontRealtimeService } from "@/lib/services/storefront-realtime.service";

/**
 * Notify all open storefront tabs that CMS settings changed.
 * Stable public API — delegates to StorefrontRealtimeService so the sync
 * transport can be swapped without touching admin pages.
 */
export async function notifyStorefrontPublished(): Promise<void> {
  return StorefrontRealtimeService.notifyPublished();
}

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

  // Realtime sync: when the admin publishes CMS changes, refetch the published
  // settings so every open storefront tab updates WITHOUT a refresh. Transport
  // details live in StorefrontRealtimeService (currently broadcast-only: no DB
  // payload reaches clients → unpublished drafts can never leak).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    const unsubscribe = StorefrontRealtimeService.subscribe(async () => {
      try {
        const fresh = await getStorefrontAppearance();
        if (active && fresh) setSettings(fresh);
      } catch {
        /* keep current settings on fetch failure */
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

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
