/**
 * useRunRecovery — Restore active run after page refresh
 *
 * On mount, checks sessionStorage for a persisted active run.
 * If found and still active in the DB, re-establishes the Realtime
 * subscription from the last seen event sequence.
 */

import { useEffect, useRef, useState } from "react";
import {
  readPersistedRun,
  clearPersistedRun,
  fetchActiveRun,
  fetchEventsFromSequence,
  subscribeToRunEvents,
} from "../services/event-client";
import type { AgentEvent, AgentRun } from "../types/events";

export interface RunRecoveryState {
  isRecovering: boolean;
  recoveredRun: AgentRun | null;
  recoveredEvents: AgentEvent[];
}

export interface UseRunRecoveryOptions {
  sessionId: string | null;
  onRecoveredEvent?: (event: AgentEvent) => void;
  onRunStatusChange?: (run: Partial<AgentRun>) => void;
}

export function useRunRecovery(options: UseRunRecoveryOptions): RunRecoveryState {
  const { sessionId, onRecoveredEvent, onRunStatusChange } = options;
  const [state, setState] = useState<RunRecoveryState>({
    isRecovering: false,
    recoveredRun: null,
    recoveredEvents: [],
  });
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    async function attemptRecovery() {
      setState((prev) => ({ ...prev, isRecovering: true }));

      try {
        // 1. Check sessionStorage for persisted run
        const persisted = readPersistedRun();

        // 2. Alternatively check DB for an active run on this session
        const activeRun = persisted
          ? null
          : await fetchActiveRun(sessionId!);

        const runId = persisted?.runId || activeRun?.id;
        if (!runId) {
          setState({ isRecovering: false, recoveredRun: null, recoveredEvents: [] });
          return;
        }

        // 3. Fetch missed events from last seen sequence
        const fromSeq = persisted?.lastSequence ?? 0;
        const events = await fetchEventsFromSequence(runId, fromSeq);

        // 4. Emit recovered events
        events.forEach((evt) => onRecoveredEvent?.(evt));

        setState({
          isRecovering: false,
          recoveredRun: activeRun,
          recoveredEvents: events,
        });

        // 5. Re-establish Realtime subscription
        const lastSeq = events.length > 0 ? events[events.length - 1].sequence : fromSeq;
        subscriptionRef.current = subscribeToRunEvents({
          runId,
          fromSequence: lastSeq + 1,
          onEvent: (evt) => onRecoveredEvent?.(evt),
          onRunStatus: onRunStatusChange,
        });
      } catch (e: any) {
        console.warn("[RunRecovery] Recovery failed:", e.message);
        clearPersistedRun();
        setState({ isRecovering: false, recoveredRun: null, recoveredEvents: [] });
      }
    }

    attemptRecovery();

    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return state;
}
