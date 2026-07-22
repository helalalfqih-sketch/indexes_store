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

const CMS_SYNC_CHANNEL = "storefront-cms-sync";
const CMS_SYNC_EVENT = "settings_published";
const FINANCIAL_EVENT = "financial_updated";

/** Shared low-level broadcast sender (fire-and-forget). */
async function sendBroadcast(event: string): Promise<void> {
  try {
    const channel = supabase.channel(CMS_SYNC_CHANNEL);
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          resolve();
        }
      });
      setTimeout(resolve, 3000);
    });
    await channel.send({ type: "broadcast", event, payload: { at: Date.now() } });
    setTimeout(() => supabase.removeChannel(channel), 1500);
  } catch (err) {
    console.warn("[realtime] broadcast notice:", err);
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
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(CMS_SYNC_CHANNEL)
        .on("broadcast", { event: FINANCIAL_EVENT }, () => onChange())
        .subscribe();
    } catch (err) {
      console.warn("[realtime] subscribe notice:", err);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to CMS publish events. Returns an unsubscribe function.
   * supabase-js handles reconnection; failures are silent (refresh fallback).
   */
  subscribe(onChange: () => void): () => void {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(CMS_SYNC_CHANNEL)
        .on("broadcast", { event: CMS_SYNC_EVENT }, () => onChange())
        .subscribe();
    } catch (err) {
      console.warn("[cms-sync] subscribe notice:", err);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  },
};
