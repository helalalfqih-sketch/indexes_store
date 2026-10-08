// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAppearance: vi.fn(),
  subscribe: vi.fn(),
  subscriber: null as (() => void) | null,
}));

vi.mock("@/lib/actions/appearance.actions", () => ({
  getPublishedStorefrontAppearanceResult: mocks.getAppearance,
}));

vi.mock("@/lib/services/storefront-realtime.service", () => ({
  StorefrontRealtimeService: {
    notifyPublished: vi.fn(),
    subscribe: mocks.subscribe,
  },
}));

import {
  AppearanceProvider,
  getFreshStorefrontSettings,
  STOREFRONT_SETTINGS_HEALTHY_TTL_MS,
  STOREFRONT_SETTINGS_QUERY_KEY,
  useAppearance,
} from "@/components/appearance-provider";
import { DEFAULT_STOREFRONT_SETTINGS, type StorefrontSettingsShape } from "@/lib/domain/appearance";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function settingsWithColor(primaryColor: string): StorefrontSettingsShape {
  return {
    ...DEFAULT_STOREFRONT_SETTINGS,
    theme: { ...DEFAULT_STOREFRONT_SETTINGS.theme, primaryColor },
  };
}

function CurrentColor() {
  const { settings } = useAppearance();
  return <span data-testid="current-color">{settings.theme.primaryColor}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.subscriber = null;
  mocks.subscribe.mockImplementation((subscriber: () => void) => {
    mocks.subscriber = subscriber;
    return vi.fn();
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AppearanceProvider server refresh ordering", () => {
  it("does not let an older degraded-recovery response overwrite a newer realtime response", async () => {
    const older = deferred<{
      settings: StorefrontSettingsShape;
      degraded: false;
      retryAfterMs: null;
    }>();
    const newer = deferred<{
      settings: StorefrontSettingsShape;
      degraded: false;
      retryAfterMs: null;
    }>();
    mocks.getAppearance.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider
          initialSettings={settingsWithColor("#000000")}
          initialSettingsDegraded
          initialRetryAfterMs={0}
        >
          <CurrentColor />
        </AppearanceProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(mocks.getAppearance).toHaveBeenCalledTimes(1);

    await act(async () => {
      mocks.subscriber?.();
      await Promise.resolve();
    });
    expect(mocks.getAppearance).toHaveBeenCalledTimes(2);

    const newerSettings = settingsWithColor("#222222");
    await act(async () => {
      newer.resolve({ settings: newerSettings, degraded: false, retryAfterMs: null });
      await Promise.resolve();
    });
    expect(screen.getByTestId("current-color").textContent).toBe("#222222");

    await act(async () => {
      older.resolve({
        settings: settingsWithColor("#111111"),
        degraded: false,
        retryAfterMs: null,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId("current-color").textContent).toBe("#222222");
    expect(queryClient.getQueryData(["storefront-settings"])).toEqual(newerSettings);
  });
});

describe("healthy storefront settings cache", () => {
  it("reuses only healthy settings inside the five-minute TTL", () => {
    const queryClient = new QueryClient();
    const settings = settingsWithColor("#333333");
    const currentTime = 1_000_000;
    queryClient.setQueryData(STOREFRONT_SETTINGS_QUERY_KEY, settings, {
      updatedAt: currentTime - STOREFRONT_SETTINGS_HEALTHY_TTL_MS + 1,
    });

    expect(getFreshStorefrontSettings(queryClient, currentTime)).toBe(settings);
    expect(
      getFreshStorefrontSettings(queryClient, currentTime + STOREFRONT_SETTINGS_HEALTHY_TTL_MS),
    ).toBeNull();
  });

  it("does not report a missing cache entry as fresh", () => {
    expect(getFreshStorefrontSettings(new QueryClient(), 1_000_000)).toBeNull();
  });
});
