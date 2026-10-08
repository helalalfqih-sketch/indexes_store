/**
 * StorefrontRealtimeService — transport abstraction for CMS→storefront sync.
 *
 * Current transport: Supabase Realtime BROADCAST (admin browser emits after a
 * successful save/publish/restore; storefront tabs listen and refetch the
 * published settings). Chosen deliberately: no DB payload ever reaches
 * clients (zero draft leakage), no publication changes required.
 *
 * Because ALL callers go through this service, the transport can later be
 * swapped (Supabase postgres_changes, Edge Function broadcast, SSE …) without
 * touching the provider or any admin page.
 */
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

const CMS_SYNC_CHANNEL = "storefront-cms-sync";
const CMS_SYNC_EVENT = "settings_published";
const FINANCIAL_EVENT = "financial_updated";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type VoidListener = () => void;
type PayloadListener = (payload: unknown) => void;

const publishedListeners = new Set<VoidListener>();
const financialListeners = new Set<VoidListener>();

let broadcastChannel: RealtimeChannel | null = null;
let broadcastReady: Promise<boolean> | null = null;
let broadcastCleanupTimer: ReturnType<typeof setTimeout> | null = null;
let activeBroadcastSends = 0;

type PostgresPoolEntry = {
  channelName: string;
  table: "orders" | "sync_jobs";
  tenantId: string;
  listeners: Set<PayloadListener>;
  channel: RealtimeChannel | null;
};

const postgresPool = new Map<string, PostgresPoolEntry>();
let visibilityListenerInstalled = false;

function isDocumentHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

function removeChannel(channel: RealtimeChannel): void {
  void Promise.resolve(supabase.removeChannel(channel)).catch((error) => {
    console.warn("[realtime] channel cleanup notice:", error);
  });
}

function dispatch<T>(listeners: Set<(payload: T) => void>, payload: T): void {
  for (const listener of [...listeners]) {
    try {
      listener(payload);
    } catch (error) {
      console.warn("[realtime] listener notice:", error);
    }
  }
}

function disconnectBroadcastChannel(): void {
  if (broadcastCleanupTimer) {
    clearTimeout(broadcastCleanupTimer);
    broadcastCleanupTimer = null;
  }
  if (!broadcastChannel) return;

  const channel = broadcastChannel;
  broadcastChannel = null;
  broadcastReady = null;
  removeChannel(channel);
}

function waitForSubscription(channel: RealtimeChannel): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(ready);
    };
    const timeout = setTimeout(() => finish(false), 3000);

    try {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") finish(true);
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          finish(false);
        }
      });
    } catch {
      finish(false);
    }
  });
}

function ensureBroadcastChannel(force = false): {
  channel: RealtimeChannel;
  ready: Promise<boolean>;
} | null {
  if (!force && isDocumentHidden()) return null;
  if (broadcastCleanupTimer) {
    clearTimeout(broadcastCleanupTimer);
    broadcastCleanupTimer = null;
  }
  if (broadcastChannel && broadcastReady) {
    return { channel: broadcastChannel, ready: broadcastReady };
  }

  const channel = supabase
    .channel(CMS_SYNC_CHANNEL)
    .on("broadcast", { event: CMS_SYNC_EVENT }, () => dispatch(publishedListeners, undefined))
    .on("broadcast", { event: FINANCIAL_EVENT }, () => dispatch(financialListeners, undefined));

  broadcastChannel = channel;
  broadcastReady = waitForSubscription(channel);
  return { channel, ready: broadcastReady };
}

function hasBroadcastListeners(): boolean {
  return publishedListeners.size > 0 || financialListeners.size > 0;
}

function scheduleBroadcastCleanup(): void {
  if (hasBroadcastListeners() || activeBroadcastSends > 0 || !broadcastChannel) return;
  if (broadcastCleanupTimer) clearTimeout(broadcastCleanupTimer);
  broadcastCleanupTimer = setTimeout(disconnectBroadcastChannel, 1000);
}

function disconnectPostgresEntry(entry: PostgresPoolEntry): void {
  if (!entry.channel) return;
  const channel = entry.channel;
  entry.channel = null;
  removeChannel(channel);
}

function connectPostgresEntry(entry: PostgresPoolEntry): void {
  if (entry.channel || isDocumentHidden() || entry.listeners.size === 0) return;

  try {
    const channel = supabase
      .channel(entry.channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: entry.table,
          filter: `tenant_id=eq.${entry.tenantId}`,
        },
        (payload) => dispatch(entry.listeners, payload),
      )
      .subscribe();
    entry.channel = channel;
  } catch (error) {
    console.warn(`[realtime] subscribe ${entry.table} notice:`, error);
  }
}

function hasSubscribers(): boolean {
  return hasBroadcastListeners() || postgresPool.size > 0;
}

function handleVisibilityChange(): void {
  if (isDocumentHidden()) {
    if (activeBroadcastSends === 0) disconnectBroadcastChannel();
    for (const entry of postgresPool.values()) disconnectPostgresEntry(entry);
    return;
  }

  if (hasBroadcastListeners()) ensureBroadcastChannel();
  for (const entry of postgresPool.values()) connectPostgresEntry(entry);
}

function syncVisibilityListener(): void {
  if (typeof document === "undefined") return;
  if (hasSubscribers() && !visibilityListenerInstalled) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerInstalled = true;
  } else if (!hasSubscribers() && visibilityListenerInstalled) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    visibilityListenerInstalled = false;
  }
}

function subscribeBroadcast(listeners: Set<VoidListener>, onChange: VoidListener): () => void {
  listeners.add(onChange);
  syncVisibilityListener();
  ensureBroadcastChannel();

  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    listeners.delete(onChange);
    scheduleBroadcastCleanup();
    syncVisibilityListener();
  };
}

function subscribePostgres(
  table: PostgresPoolEntry["table"],
  tenantId: string,
  onChange: PayloadListener,
): () => void {
  const normalizedTenantId = tenantId.trim();
  if (!UUID_PATTERN.test(normalizedTenantId)) {
    console.warn(`[realtime] skipped ${table} subscription with an invalid tenant id`);
    return () => {};
  }

  const key = `${table}:${normalizedTenantId}`;
  let entry = postgresPool.get(key);
  if (!entry) {
    entry = {
      channelName: `tenant-${table}-${normalizedTenantId}`,
      table,
      tenantId: normalizedTenantId,
      listeners: new Set(),
      channel: null,
    };
    postgresPool.set(key, entry);
  }

  entry.listeners.add(onChange);
  syncVisibilityListener();
  connectPostgresEntry(entry);

  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    entry!.listeners.delete(onChange);
    if (entry!.listeners.size === 0) {
      disconnectPostgresEntry(entry!);
      postgresPool.delete(key);
    }
    syncVisibilityListener();
  };
}

/** Shared low-level broadcast sender (fire-and-forget). */
async function sendBroadcast(event: string): Promise<void> {
  activeBroadcastSends += 1;
  try {
    const connection = ensureBroadcastChannel(true);
    if (!connection || !(await connection.ready)) {
      disconnectBroadcastChannel();
      return;
    }
    await connection.channel.send({ type: "broadcast", event, payload: { at: Date.now() } });
  } catch (err) {
    console.warn("[realtime] broadcast notice:", err);
  } finally {
    activeBroadcastSends -= 1;
    if (isDocumentHidden() && activeBroadcastSends === 0) disconnectBroadcastChannel();
    else scheduleBroadcastCleanup();
  }
}

export const StorefrontRealtimeService = {
  /**
   * Notify all open storefront tabs that published CMS settings changed.
   * Fire-and-forget: failures never break the admin save flow.
   */
  async notifyPublished(): Promise<void> {
    return sendBroadcast(CMS_SYNC_EVENT);
  },

  /** P4: notify dashboards that store financials changed (order delivered/refunded). */
  async notifyFinancialUpdated(): Promise<void> {
    return sendBroadcast(FINANCIAL_EVENT);
  },

  /** Subscribe to financial updates. Returns an unsubscribe function. */
  subscribeFinancial(onChange: () => void): () => void {
    return subscribeBroadcast(financialListeners, onChange);
  },

  /**
   * Subscribe to Postgres Realtime changes on orders table for a given tenant.
   */
  subscribeOrders(tenantId: string, onOrderChange: PayloadListener): () => void {
    return subscribePostgres("orders", tenantId, onOrderChange);
  },

  /**
   * Subscribe to Postgres Realtime changes on sync_jobs table for progress tracking.
   */
  subscribeSyncJobs(tenantId: string, onSyncChange: PayloadListener): () => void {
    return subscribePostgres("sync_jobs", tenantId, onSyncChange);
  },

  /**
   * Subscribe to CMS publish events. Returns an unsubscribe function.
   * supabase-js handles reconnection; failures are silent (refresh fallback).
   */
  subscribe(onChange: () => void): () => void {
    return subscribeBroadcast(publishedListeners, onChange);
  },
};
