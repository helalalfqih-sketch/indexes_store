type PollingQuerySnapshot = {
  state: {
    fetchFailureCount?: number;
  };
};

/**
 * Build a TanStack Query polling interval that backs off after consecutive
 * request failures. Callers use refetchIntervalInBackground=false so TanStack
 * pauses network requests while the tab is hidden without destroying the
 * interval that resumes them.
 */
export function createAdaptivePollingInterval(baseMs: number, maxMs = baseMs * 8) {
  if (!Number.isFinite(baseMs) || baseMs <= 0) {
    throw new Error("baseMs must be a positive finite number");
  }
  if (!Number.isFinite(maxMs) || maxMs < baseMs) {
    throw new Error("maxMs must be a finite number greater than or equal to baseMs");
  }

  return (query: PollingQuerySnapshot): number | false => {
    const failures = Math.min(Math.max(query.state.fetchFailureCount ?? 0, 0), 6);
    return Math.min(baseMs * 2 ** failures, maxMs);
  };
}
