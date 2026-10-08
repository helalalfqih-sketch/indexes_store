import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { DEFAULT_STOREFRONT_SETTINGS, type StorefrontSettingsShape } from "@/lib/domain/appearance";
import { getPublishedStorefrontAppearanceResult } from "@/lib/actions/appearance.actions";
import { StorefrontRealtimeService } from "@/lib/services/storefront-realtime.service";
import { STOREFRONT_REALTIME_REVALIDATE_DELAY_MS } from "@/lib/storefront-cache-policy";

export const STOREFRONT_SETTINGS_QUERY_KEY = ["storefront-settings"] as const;
export const STOREFRONT_SETTINGS_HEALTHY_TTL_MS = 5 * 60 * 1000;
const MAX_DEGRADED_REVALIDATION_ATTEMPTS = 3;
const DEGRADED_REVALIDATION_DELAYS_MS = [5_000, 30_000, 60_000] as const;

function boundedRetryDelay(delay: number | null | undefined, attempt: number): number {
  const scheduledDelay =
    DEGRADED_REVALIDATION_DELAYS_MS[Math.min(attempt, DEGRADED_REVALIDATION_DELAYS_MS.length - 1)];
  return Math.min(60_000, Math.max(scheduledDelay, delay ?? 0));
}

export function getFreshStorefrontSettings(
  queryClient: Pick<QueryClient, "getQueryState">,
  currentTime = Date.now(),
): StorefrontSettingsShape | null {
  const state = queryClient.getQueryState<StorefrontSettingsShape>(STOREFRONT_SETTINGS_QUERY_KEY);
  if (!state?.data || state.dataUpdatedAt <= 0) return null;
  const age = currentTime - state.dataUpdatedAt;
  return age >= 0 && age < STOREFRONT_SETTINGS_HEALTHY_TTL_MS ? state.data : null;
}

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
  initialSettingsDegraded = false,
  initialRetryAfterMs = null,
}: {
  children: ReactNode;
  initialSettings?: StorefrontSettingsShape;
  initialSettingsDegraded?: boolean;
  initialRetryAfterMs?: number | null;
}) {
  const [settings, setSettingsState] = useState<StorefrontSettingsShape>(initialSettings);
  const queryClient = useQueryClient();
  const latestRequestGeneration = useRef(0);

  const setSettings = useCallback((newSettings: StorefrontSettingsShape) => {
    latestRequestGeneration.current += 1;
    setSettingsState(newSettings);
  }, []);

  useEffect(() => {
    if (!initialSettingsDegraded) setSettings(initialSettings);
  }, [initialSettings, initialSettingsDegraded, setSettings]);

  // A degraded SSR result is intentionally absent from the long-lived query
  // cache. Retry a small, bounded number of times after hydration and promote
  // only a healthy response into both local state and React Query.
  useEffect(() => {
    if (typeof window === "undefined" || !initialSettingsDegraded) return;

    let active = true;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function schedule(delay: number | null | undefined, attempt: number) {
      retryTimer = setTimeout(
        () => {
          retryTimer = null;
          void revalidate();
        },
        boundedRetryDelay(delay, attempt),
      );
    }

    async function revalidate() {
      attempts += 1;
      const requestGeneration = ++latestRequestGeneration.current;
      try {
        const result = await getPublishedStorefrontAppearanceResult();
        if (!active || requestGeneration !== latestRequestGeneration.current) return;
        if (!result.degraded) {
          setSettingsState(result.settings);
          queryClient.setQueryData(STOREFRONT_SETTINGS_QUERY_KEY, result.settings);
          return;
        }
        if (attempts < MAX_DEGRADED_REVALIDATION_ATTEMPTS) {
          schedule(result.retryAfterMs, attempts);
        }
      } catch {
        if (
          active &&
          requestGeneration === latestRequestGeneration.current &&
          attempts < MAX_DEGRADED_REVALIDATION_ATTEMPTS
        ) {
          schedule(5_000, attempts);
        }
      }
    }

    schedule(initialRetryAfterMs, 0);
    return () => {
      active = false;
      if (retryTimer !== null) clearTimeout(retryTimer);
    };
  }, [initialRetryAfterMs, initialSettingsDegraded, queryClient]);

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
    let guaranteedRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    const refresh = async () => {
      const requestGeneration = ++latestRequestGeneration.current;
      try {
        const result = await getPublishedStorefrontAppearanceResult();
        if (active && requestGeneration === latestRequestGeneration.current && !result.degraded) {
          setSettingsState(result.settings);
          queryClient.setQueryData(STOREFRONT_SETTINGS_QUERY_KEY, result.settings);
        }
      } catch {
        /* keep current settings on fetch failure */
      }
    };
    const unsubscribe = StorefrontRealtimeService.subscribe(() => {
      // A request may land on an instance with a warm pre-publish cache. Try
      // immediately, then coalesce one guaranteed revalidation after the
      // bounded cache TTL. This keeps the public endpoint cache-protected.
      void refresh();
      if (guaranteedRefreshTimer) clearTimeout(guaranteedRefreshTimer);
      guaranteedRefreshTimer = setTimeout(() => {
        guaranteedRefreshTimer = null;
        void refresh();
      }, STOREFRONT_REALTIME_REVALIDATE_DELAY_MS);
    });
    return () => {
      active = false;
      if (guaranteedRefreshTimer) clearTimeout(guaranteedRefreshTimer);
      unsubscribe();
    };
  }, [queryClient]);

  const updateLocalSettings = (key: keyof StorefrontSettingsShape, value: unknown) => {
    latestRequestGeneration.current += 1;
    setSettingsState((prev) => ({
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
