import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createAdaptivePollingInterval } from "@/lib/query-polling";

const realtimeMock = vi.hoisted(() => {
  type Handler = {
    type: string;
    filter: Record<string, unknown>;
    callback: (payload: unknown) => void;
  };

  const channels: Array<{
    name: string;
    handlers: Handler[];
    on: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  }> = [];

  const supabase = {
    channel: vi.fn((name: string) => {
      const channel = {
        name,
        handlers: [] as Handler[],
        on: vi.fn(),
        subscribe: vi.fn(),
        send: vi.fn(async () => "ok"),
      };
      channel.on.mockImplementation(
        (type: string, filter: Record<string, unknown>, callback: (payload: unknown) => void) => {
          channel.handlers.push({ type, filter, callback });
          return channel;
        },
      );
      channel.subscribe.mockImplementation((callback?: (status: string) => void) => {
        callback?.("SUBSCRIBED");
        return channel;
      });
      channels.push(channel);
      return channel;
    }),
    removeChannel: vi.fn(async () => "ok"),
  };

  return { channels, supabase };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: realtimeMock.supabase,
}));

let originalDocumentDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  realtimeMock.channels.length = 0;
  realtimeMock.supabase.channel.mockClear();
  realtimeMock.supabase.removeChannel.mockClear();
  originalDocumentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
});

afterEach(() => {
  vi.useRealTimers();
  if (originalDocumentDescriptor) {
    Object.defineProperty(globalThis, "document", originalDocumentDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "document");
  }
});

describe("StorefrontRealtimeService channel pooling", () => {
  it("shares one broadcast channel across event listeners and senders", async () => {
    const { StorefrontRealtimeService } =
      await import("@/lib/services/storefront-realtime.service");
    const onPublished = vi.fn();
    const onFinancial = vi.fn();

    const unsubscribePublished = StorefrontRealtimeService.subscribe(onPublished);
    const unsubscribeFinancial = StorefrontRealtimeService.subscribeFinancial(onFinancial);

    expect(realtimeMock.supabase.channel).toHaveBeenCalledTimes(1);
    const channel = realtimeMock.channels[0];
    channel.handlers.find((handler) => handler.filter.event === "settings_published")?.callback({});
    channel.handlers.find((handler) => handler.filter.event === "financial_updated")?.callback({});

    expect(onPublished).toHaveBeenCalledTimes(1);
    expect(onFinancial).toHaveBeenCalledTimes(1);

    await StorefrontRealtimeService.notifyFinancialUpdated();
    expect(realtimeMock.supabase.channel).toHaveBeenCalledTimes(1);
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: "broadcast", event: "financial_updated" }),
    );

    unsubscribePublished();
    vi.advanceTimersByTime(1000);
    expect(realtimeMock.supabase.removeChannel).not.toHaveBeenCalled();

    unsubscribeFinancial();
    vi.advanceTimersByTime(1000);
    expect(realtimeMock.supabase.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("shares tenant-filtered postgres channels and removes them after the last listener", async () => {
    const { StorefrontRealtimeService } =
      await import("@/lib/services/storefront-realtime.service");
    const firstListener = vi.fn();
    const secondListener = vi.fn();

    const tenantId = "00000000-0000-4000-8000-000000000111";
    const unsubscribeFirst = StorefrontRealtimeService.subscribeOrders(tenantId, firstListener);
    const unsubscribeSecond = StorefrontRealtimeService.subscribeOrders(tenantId, secondListener);
    const unsubscribeSync = StorefrontRealtimeService.subscribeSyncJobs(tenantId, vi.fn());

    expect(realtimeMock.supabase.channel).toHaveBeenCalledTimes(2);
    const ordersChannel = realtimeMock.channels.find((channel) =>
      channel.handlers.some((handler) => handler.filter.table === "orders"),
    );
    const ordersHandler = ordersChannel?.handlers.find(
      (handler) => handler.type === "postgres_changes",
    );
    expect(ordersHandler?.filter.filter).toBe(`tenant_id=eq.${tenantId}`);

    const payload = { new: { id: "order-1" } };
    ordersHandler?.callback(payload);
    expect(firstListener).toHaveBeenCalledWith(payload);
    expect(secondListener).toHaveBeenCalledWith(payload);

    unsubscribeFirst();
    expect(realtimeMock.supabase.removeChannel).not.toHaveBeenCalled();
    unsubscribeSecond();
    expect(realtimeMock.supabase.removeChannel).toHaveBeenCalledWith(ordersChannel);

    unsubscribeSync();
    expect(realtimeMock.supabase.removeChannel).toHaveBeenCalledTimes(2);
  });

  it("does not open realtime channels while hidden and reconnects when visible", async () => {
    let visibilityState: DocumentVisibilityState = "hidden";
    let visibilityHandler: (() => void) | undefined;
    const fakeDocument = {
      get visibilityState() {
        return visibilityState;
      },
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === "visibilitychange") visibilityHandler = handler;
      }),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: fakeDocument,
    });

    const { StorefrontRealtimeService } =
      await import("@/lib/services/storefront-realtime.service");
    const unsubscribe = StorefrontRealtimeService.subscribeFinancial(vi.fn());

    expect(realtimeMock.supabase.channel).not.toHaveBeenCalled();
    visibilityState = "visible";
    visibilityHandler?.();
    expect(realtimeMock.supabase.channel).toHaveBeenCalledTimes(1);

    visibilityState = "hidden";
    visibilityHandler?.();
    expect(realtimeMock.supabase.removeChannel).toHaveBeenCalledTimes(1);

    visibilityState = "visible";
    visibilityHandler?.();
    expect(realtimeMock.supabase.channel).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("rejects unscoped postgres subscriptions", async () => {
    const { StorefrontRealtimeService } =
      await import("@/lib/services/storefront-realtime.service");

    StorefrontRealtimeService.subscribeOrders("  ", vi.fn());
    StorefrontRealtimeService.subscribeOrders("tenant-1", vi.fn());
    expect(realtimeMock.supabase.channel).not.toHaveBeenCalled();
  });
});

describe("adaptive query polling", () => {
  it("backs off failed requests up to the configured ceiling", () => {
    const interval = createAdaptivePollingInterval(1000, 8000);

    expect(interval({ state: { fetchFailureCount: 0 } })).toBe(1000);
    expect(interval({ state: { fetchFailureCount: 2 } })).toBe(4000);
    expect(interval({ state: { fetchFailureCount: 10 } })).toBe(8000);
  });
});

describe("admin polling configuration", () => {
  it("disables background polling for every interval-based admin query", () => {
    const pollingFiles = [
      "src/routes/admin.index.tsx",
      "src/routes/admin.insights.tsx",
      "src/routes/admin.live-logs.tsx",
      "src/routes/admin.ai-developer.tsx",
      "src/components/admin/whapi-accounts-panel.tsx",
      "src/components/admin/tiktok-accounts-panel.tsx",
    ];

    for (const relativePath of pollingFiles) {
      const source = fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
      const pollingQueries = source.match(/refetchInterval:/g)?.length ?? 0;
      const backgroundGuards = source.match(/refetchIntervalInBackground:\s*false/g)?.length ?? 0;

      expect(pollingQueries, relativePath).toBeGreaterThan(0);
      expect(backgroundGuards, relativePath).toBe(pollingQueries);
    }
  });
});
