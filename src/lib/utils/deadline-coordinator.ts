export type DeadlineDegradedReason = "timeout" | "circuit" | "capacity";

export type DeadlineResult<T> =
  | { value: T; degraded: false; retryAfterMs: null }
  | {
      value: T;
      degraded: true;
      reason: DeadlineDegradedReason;
      retryAfterMs: number;
    };

type DeadlineCoordinatorOptions = {
  deadlineMs: number;
  cooldownMs: number;
  /** Hard cap across active work and work that timed out but has not settled. */
  maxInFlight: number;
  /** Slots held back for bounded half-open recovery probes. Defaults to one. */
  recoverySlots?: number;
  now?: () => number;
};

type CircuitState<T> = {
  open: boolean;
  blockedUntil: number;
  generation: number;
  pendingEntries: number;
  activeRecoveryProbe: InFlightEntry<T> | null;
};

type InFlightEntry<T> = {
  key: string;
  promise: Promise<T>;
  timedOut: boolean;
  settled: boolean;
  recoveryProbe: boolean;
  generation: number;
  circuit: CircuitState<T>;
};

/**
 * Bounds callers waiting on async work while keeping abandoned work bounded.
 *
 * Work is coalesced per key and each key owns its own circuit, so one unhealthy
 * tenant cannot short-circuit another tenant. Capacity remains global because
 * all tenants share the same runtime. Circuit generations ensure that a late
 * completion from an older request cannot override a newer half-open probe.
 */
export function createDeadlineCoordinator<T>({
  deadlineMs,
  cooldownMs,
  maxInFlight,
  recoverySlots = 1,
  now = () => Date.now(),
}: DeadlineCoordinatorOptions) {
  const inFlight = new Map<string, InFlightEntry<T>>();
  const circuits = new Map<string, CircuitState<T>>();
  let timedOutEntries = 0;

  const reservedSlots = Math.min(Math.max(0, recoverySlots), Math.max(0, maxInFlight - 1));
  const normalCapacity = Math.max(1, maxInFlight - reservedSlots);
  const pendingCount = () => inFlight.size + timedOutEntries;

  const circuitFor = (key: string): CircuitState<T> => {
    const existing = circuits.get(key);
    if (existing) return existing;
    const created: CircuitState<T> = {
      open: false,
      blockedUntil: 0,
      generation: 0,
      pendingEntries: 0,
      activeRecoveryProbe: null,
    };
    circuits.set(key, created);
    return created;
  };

  const retryAfter = (circuit: CircuitState<T>, currentTime: number): number =>
    Math.max(1, circuit.blockedUntil - currentTime);

  const closeCircuit = (entry: InFlightEntry<T>) => {
    const { circuit } = entry;
    if (entry.generation !== circuit.generation) return;
    circuit.open = false;
    circuit.blockedUntil = 0;
  };

  const cleanupCircuit = (key: string, circuit: CircuitState<T>) => {
    if (
      circuits.get(key) === circuit &&
      circuit.pendingEntries === 0 &&
      !circuit.open &&
      circuit.activeRecoveryProbe === null
    ) {
      circuits.delete(key);
    }
  };

  const waitForEntry = async (entry: InFlightEntry<T>, fallback: T): Promise<DeadlineResult<T>> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        entry.promise.then(
          (value) => ({ kind: "value" as const, value }),
          (error: unknown) => ({ kind: "error" as const, error }),
        ),
        new Promise<{ kind: "timeout" }>((resolve) => {
          timer = setTimeout(() => resolve({ kind: "timeout" }), deadlineMs);
        }),
      ]);

      if (result.kind === "value") {
        return { value: result.value, degraded: false, retryAfterMs: null };
      }
      if (result.kind === "error") throw result.error;

      const currentTime = now();
      if (!entry.settled && !entry.timedOut) {
        entry.timedOut = true;
        timedOutEntries += 1;
        if (inFlight.get(entry.key) === entry) inFlight.delete(entry.key);
        if (entry.circuit.activeRecoveryProbe === entry) {
          entry.circuit.activeRecoveryProbe = null;
        }

        // A normal timeout opens a new circuit generation. A recovery probe
        // already owns the generation that it opened when it started.
        if (!entry.recoveryProbe) {
          entry.circuit.generation += 1;
          entry.generation = entry.circuit.generation;
        }
        entry.circuit.open = true;
        entry.circuit.blockedUntil = Math.max(entry.circuit.blockedUntil, currentTime + cooldownMs);
      }
      return {
        value: fallback,
        degraded: true,
        reason: "timeout",
        retryAfterMs: retryAfter(entry.circuit, currentTime),
      };
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  };

  const run = async (
    key: string,
    work: () => Promise<T>,
    fallback: T,
  ): Promise<DeadlineResult<T>> => {
    const existing = inFlight.get(key);
    if (existing && !existing.timedOut) return waitForEntry(existing, fallback);

    const currentTime = now();
    const circuit = circuitFor(key);
    let recoveryProbe = false;
    if (circuit.open) {
      if (
        circuit.activeRecoveryProbe ||
        circuit.blockedUntil > currentTime ||
        pendingCount() >= maxInFlight
      ) {
        return {
          value: fallback,
          degraded: true,
          reason: "circuit",
          retryAfterMs: retryAfter(circuit, currentTime),
        };
      }
      recoveryProbe = true;
      circuit.generation += 1;
    } else if (pendingCount() >= normalCapacity) {
      cleanupCircuit(key, circuit);
      return {
        value: fallback,
        degraded: true,
        reason: "capacity",
        retryAfterMs: Math.min(cooldownMs, deadlineMs),
      };
    }

    const entry: InFlightEntry<T> = {
      key,
      promise: Promise.resolve().then(work),
      timedOut: false,
      settled: false,
      recoveryProbe,
      generation: circuit.generation,
      circuit,
    };
    circuit.pendingEntries += 1;
    inFlight.set(key, entry);
    if (recoveryProbe) circuit.activeRecoveryProbe = entry;

    const settle = (succeeded: boolean) => {
      entry.settled = true;
      if (inFlight.get(key) === entry) inFlight.delete(key);
      if (circuit.activeRecoveryProbe === entry) circuit.activeRecoveryProbe = null;
      circuit.pendingEntries = Math.max(0, circuit.pendingEntries - 1);
      if (entry.timedOut) {
        timedOutEntries = Math.max(0, timedOutEntries - 1);
      }

      if (succeeded && (entry.timedOut || entry.recoveryProbe)) {
        closeCircuit(entry);
      } else if (!succeeded && entry.recoveryProbe && entry.generation === circuit.generation) {
        circuit.open = true;
        circuit.blockedUntil = Math.max(circuit.blockedUntil, now() + cooldownMs);
      }
      cleanupCircuit(key, circuit);
    };
    void entry.promise.then(
      () => settle(true),
      () => settle(false),
    );

    return waitForEntry(entry, fallback);
  };

  return { run };
}
