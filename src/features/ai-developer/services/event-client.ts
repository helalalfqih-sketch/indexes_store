/**
 * Event Client — Supabase Realtime subscription for agent_events
 *
 * Provides:
 * - Real-time event streaming via Supabase Realtime channel
 * - Automatic reconnection with exponential backoff
 * - Deduplication by event `sequence` number
 * - Resume from last seen sequence after reconnect or page refresh
 */

import { supabase } from "@/integrations/supabase/client";
import type { AgentEvent, AgentRun } from "../types/events";

export type EventHandler = (event: AgentEvent) => void;
export type RunStatusHandler = (run: Partial<AgentRun>) => void;

interface SubscriptionOptions {
  runId: string;
  fromSequence?: number;
  onEvent: EventHandler;
  onRunStatus?: RunStatusHandler;
  onError?: (err: Error) => void;
}

interface ActiveSubscription {
  unsubscribe: () => void;
}

/**
 * Fetch all events for a run from a given sequence (inclusive).
 * Used to hydrate after reconnect.
 */
export async function fetchEventsFromSequence(
  runId: string,
  fromSequence = 0,
): Promise<AgentEvent[]> {
  const { data, error } = await (supabase as any)
    .from("agent_events")
    .select("*")
    .eq("run_id", runId)
    .gte("sequence", fromSequence)
    .order("sequence", { ascending: true });

  if (error) throw new Error(`[EventClient] fetchEvents: ${error.message}`);
  return (data || []) as unknown as AgentEvent[];
}

/**
 * Fetch the active run for a session.
 */
export async function fetchActiveRun(sessionId: string): Promise<AgentRun | null> {
  const { data } = await (supabase as any)
    .from("agent_runs")
    .select("*")
    .eq("session_id", sessionId)
    .in("status", ["queued", "running", "waiting_approval"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as unknown as AgentRun) || null;
}

/**
 * Subscribe to real-time events for a run.
 * Handles deduplication by tracking last seen sequence.
 * Returns an unsubscribe function.
 */
export function subscribeToRunEvents(options: SubscriptionOptions): ActiveSubscription {
  const { runId, fromSequence = 0, onEvent, onRunStatus, onError } = options;
  let lastSeenSequence = fromSequence - 1;
  let retryCount = 0;
  let channel: any;

  function connect() {
    channel = supabase
      .channel(`agent_events:run_id:${runId}:${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_events",
          filter: `run_id=eq.${runId}`,
        },
        (payload: any) => {
          const event = payload.new as AgentEvent;
          // Deduplicate by sequence
          if (event.sequence <= lastSeenSequence) return;
          lastSeenSequence = event.sequence;
          retryCount = 0; // reset backoff on successful event
          onEvent(event);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agent_runs",
          filter: `id=eq.${runId}`,
        },
        (payload: any) => {
          onRunStatus?.(payload.new as Partial<AgentRun>);
        },
      )
      .subscribe((status: string) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          const delay = Math.min(1000 * 2 ** retryCount, 30000);
          retryCount++;
          onError?.(new Error(`[EventClient] Channel error: ${status}. Retrying in ${delay}ms`));
          setTimeout(() => {
            channel?.unsubscribe();
            connect();
          }, delay);
        }
      });
  }

  connect();

  return {
    unsubscribe: () => {
      channel?.unsubscribe();
    },
  };
}

/**
 * Save the current run state to sessionStorage for recovery after page refresh.
 */
export function persistActiveRun(runId: string, sessionId: string, lastSequence: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    "ai_developer_active_run",
    JSON.stringify({ runId, sessionId, lastSequence, savedAt: Date.now() }),
  );
}

/**
 * Clear persisted run state.
 */
export function clearPersistedRun(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem("ai_developer_active_run");
}

/**
 * Read persisted run state (valid for 1 hour).
 */
export function readPersistedRun(): {
  runId: string;
  sessionId: string;
  lastSequence: number;
} | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("ai_developer_active_run");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 1 hour
    if (Date.now() - parsed.savedAt > 3_600_000) {
      clearPersistedRun();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
