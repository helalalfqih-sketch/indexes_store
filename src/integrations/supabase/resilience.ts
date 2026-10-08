const DEFAULT_RESTRICTION_COOLDOWN_MS = 60_000;
// Keep the general client generous for media uploads on slower mobile
// networks. Render-path clients opt into the much shorter timeout below.
const DEFAULT_REQUEST_TIMEOUT_MS = 60_000;

export const SUPABASE_UNAVAILABLE_CODE = "SUPABASE_TEMPORARILY_UNAVAILABLE";
export const SUPABASE_UNAVAILABLE_MESSAGE =
  "Service temporarily unavailable. Please try again shortly.";
export const SUPABASE_UNAVAILABLE_MESSAGE_AR = "الخدمة غير متاحة مؤقتًا. حاول مرة أخرى بعد قليل.";

const restrictionPatterns = [
  /exceed_egress_quota/i,
  /service for this project is restricted/i,
  /project[^\n]*restricted[^\n]*violations/i,
];

const blockedOrigins = new Map<string, number>();

type SupabaseFetchOptions = {
  cooldownMs?: number;
  fetch?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
};

function requestOrigin(input: RequestInfo | URL): string {
  try {
    if (typeof input === "string") return new URL(input).origin;
    if (input instanceof URL) return input.origin;
    return new URL(input.url).origin;
  } catch {
    return "supabase";
  }
}

function retryAfterSeconds(blockedUntil: number, now: number): string {
  return String(Math.max(1, Math.ceil((blockedUntil - now) / 1_000)));
}

function unavailableResponse(blockedUntil: number, now: number): Response {
  return Response.json(
    {
      code: SUPABASE_UNAVAILABLE_CODE,
      message: SUPABASE_UNAVAILABLE_MESSAGE,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": retryAfterSeconds(blockedUntil, now),
      },
    },
  );
}

export function isSupabaseServiceRestriction(value: unknown): boolean {
  const message =
    typeof value === "string"
      ? value
      : value instanceof Error
        ? `${value.message} ${String((value as Error & { code?: unknown }).code ?? "")}`
        : value && typeof value === "object"
          ? JSON.stringify(value)
          : String(value ?? "");

  return (
    message.includes(SUPABASE_UNAVAILABLE_CODE) ||
    message.includes(SUPABASE_UNAVAILABLE_MESSAGE) ||
    restrictionPatterns.some((pattern) => pattern.test(message))
  );
}

function hasRestrictionPayload(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const payload = value as Record<string, unknown>;
  const providerCode = [payload.code, payload.error_code, payload.error].find(
    (candidate): candidate is string => typeof candidate === "string",
  );
  if (providerCode?.trim().toLowerCase() === "exceed_egress_quota") return true;

  if (typeof payload.message !== "string") return false;
  const providerMessage = payload.message.trim();
  if (
    !/^service for this project is restricted due to (?:the )?following violations:/i.test(
      providerMessage,
    )
  ) {
    return false;
  }
  const violations = providerMessage.slice(providerMessage.indexOf(":") + 1);
  return /(?:^|[\s,;])exceed_egress_quota(?:$|[\s,;.])/i.test(violations);
}

async function isRestrictionResponse(response: Response): Promise<boolean> {
  // Supabase reports project restrictions as HTTP 402 with a structured JSON
  // payload. Requiring both prevents ordinary PostgREST errors that echo user
  // input from opening the process-wide circuit.
  if (response.status !== 402) return false;

  try {
    return hasRestrictionPayload(await response.clone().json());
  } catch {
    return false;
  }
}

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/**
 * Adds the Supabase API key and opens a short process-local circuit when the
 * project is quota-restricted. This keeps a provider outage from multiplying
 * into one doomed request per component while preserving normal auth errors.
 */
export function createSupabaseFetch(
  supabaseKey: string,
  options: SupabaseFetchOptions = {},
): typeof fetch {
  const baseFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const now = options.now ?? Date.now;
  const cooldownMs = options.cooldownMs ?? DEFAULT_RESTRICTION_COOLDOWN_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

  return async (input, init) => {
    const origin = requestOrigin(input);
    const currentTime = now();
    const blockedUntil = blockedOrigins.get(origin) ?? 0;

    if (blockedUntil > currentTime) {
      return unavailableResponse(blockedUntil, currentTime);
    }
    if (blockedUntil) blockedOrigins.delete(origin);

    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    const controller = new AbortController();
    const requestSignal =
      init?.signal ??
      (typeof Request !== "undefined" && input instanceof Request ? input.signal : undefined);
    const abortState: { source: "none" | "caller" | "timeout" } = {
      source: requestSignal?.aborted ? "caller" : "none",
    };
    const abortFromCaller = () => {
      if (abortState.source === "none") abortState.source = "caller";
      controller.abort(requestSignal?.reason);
    };

    if (requestSignal) {
      if (requestSignal.aborted) abortFromCaller();
      else requestSignal.addEventListener("abort", abortFromCaller, { once: true });
    }

    const timeout = setTimeout(() => {
      if (abortState.source !== "none") return;
      abortState.source = "timeout";
      controller.abort(new DOMException("Supabase request timed out", "TimeoutError"));
    }, timeoutMs);

    let response: Response;
    try {
      response = await baseFetch(input, { ...init, headers, signal: controller.signal });
    } catch (error) {
      // Preserve explicit caller cancellation. A provider/network timeout is
      // converted into a bounded, sanitized outage response so SSR can render
      // its local fallback promptly. A transient timeout must not open the
      // project-wide quota circuit because another endpoint or request may
      // still succeed (including authenticated and service-role operations).
      if (abortState.source === "caller") throw error;
      if (abortState.source !== "timeout") throw error;

      const nextAttemptAt = now() + cooldownMs;
      return unavailableResponse(nextAttemptAt, now());
    } finally {
      clearTimeout(timeout);
      requestSignal?.removeEventListener("abort", abortFromCaller);
    }

    if (!(await isRestrictionResponse(response))) return response;

    const nextAttemptAt = now() + cooldownMs;
    blockedOrigins.set(origin, nextAttemptAt);
    return unavailableResponse(nextAttemptAt, now());
  };
}
