import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  type StorefrontSettingsShape,
} from "@/lib/domain/appearance";
import { supabase } from "@/integrations/supabase/client";
import { getStorefrontAppearance } from "@/lib/actions/appearance.actions";

/** Realtime broadcast channel shared by admin CMS (sender) and storefront (listener). */
const CMS_SYNC_CHANNEL = "storefront-cms-sync";
const CMS_SYNC_EVENT = "settings_published";

/**
 * Notify all open storefront tabs that CMS settings changed.
 * Called by admin pages after a successful save/publish — listeners refetch
 * the published settings and re-render without a page refresh.
 * Fire-and-forget: failures never break the admin save flow.
 */
export async function notifyStorefrontPublished(): Promise<void> {
  try {
    const channel = supabase.channel(CMS_SYNC_CHANNEL);
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") resolve();
      });
      // Safety net so the admin UI never hangs on a slow socket.
      setTimeout(resolve, 3000);
    });
    await channel.send({ type: "broadcast", event: CMS_SYNC_EVENT, payload: { at: Date.now() } });
    // Give the message a moment to flush before tearing the socket down.
    setTimeout(() => supabase.removeChannel(channel), 1500);
  } catch (err) {
    console.warn("[cms-sync] broadcast notice:", err);
  }
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
  // settings so every open storefront tab updates WITHOUT a refresh.
  // Broadcast-only (no postgres_changes): no DB payload reaches clients, so
  // unpublished drafts can never leak through the realtime socket, and no
  // publication changes are needed. supabase-js handles reconnection.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(CMS_SYNC_CHANNEL)
        .on("broadcast", { event: CMS_SYNC_EVENT }, async () => {
          try {
            const fresh = await getStorefrontAppearance();
            if (active && fresh) setSettings(fresh);
          } catch {
            /* keep current settings on fetch failure */
          }
        })
        .subscribe();
    } catch (err) {
      console.warn("[cms-sync] subscribe notice:", err);
    }
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
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
