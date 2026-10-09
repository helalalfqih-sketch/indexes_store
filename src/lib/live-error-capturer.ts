import {
  logLiveErrorFn,
  generateSuggestedFix,
  ErrorTypeCategory,
} from "@/services/live-logs.service";

interface CapturerOptions {
  errorName: string;
  errorType?: ErrorTypeCategory | string;
  level?: "error" | "warn" | "fatal" | "info";
  location?: string;
  cause: string;
  suggestedFix?: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

// In-memory set for deduplicating identical errors within 5 seconds
const recentlyLoggedErrors = new Set<string>();

function sanitizePii(str: string): string {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[SECRET_KEY_REDACTED]")
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "[PUB_KEY_REDACTED]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
    .replace(/(?:\+?967|0)?\s*[7137][0-9]{8}/g, "[PHONE_REDACTED]");
}

/**
 * Report a live error from anywhere in the application (Client or Server).
 */
export async function reportLiveError(opts: CapturerOptions): Promise<void> {
  try {
    const loc =
      opts.location || (typeof window !== "undefined" ? window.location.pathname : "System/Server");
    const dedupeKey = `${opts.errorName}:${opts.cause}:${loc}`;

    if (recentlyLoggedErrors.has(dedupeKey)) {
      return; // Skip duplicate error flooding
    }

    recentlyLoggedErrors.add(dedupeKey);
    setTimeout(() => recentlyLoggedErrors.delete(dedupeKey), 30000); // 30s deduplication window

    const isStorefront =
      typeof window !== "undefined" && !window.location.pathname.startsWith("/admin");
    const defaultType = isStorefront ? "Storefront UI" : "Admin UI";

    const errorType = opts.errorType || defaultType;
    const cleanCause = sanitizePii(opts.cause);
    const cleanStack = sanitizePii(opts.stackTrace || new Error().stack || "");

    const suggestedFix =
      opts.suggestedFix ||
      generateSuggestedFix(opts.errorName, cleanCause, loc, cleanStack, errorType);

    await logLiveErrorFn({
      data: {
        errorName: sanitizePii(opts.errorName),
        errorType,
        level: opts.level || "error",
        location: loc,
        cause: cleanCause,
        suggestedFix,
        stackTrace: cleanStack,
        context: {
          path: typeof window !== "undefined" ? window.location.pathname : "Server",
          ...(opts.context || {}),
        },
      },
    });
  } catch (err) {
    // Soft catch to prevent recursive error loops
    console.warn("Failed to report live error:", err);
  }
}

/**
 * Interceptor for Supabase operations to log any Postgrest / Auth errors.
 */
export async function captureSupabaseError<T>(
  promise: Promise<{ data: T | null; error: any }>,
  locationName: string,
): Promise<{ data: T | null; error: any }> {
  const result = await promise;
  if (result.error) {
    const err = result.error;
    reportLiveError({
      errorName: err.code ? `SupabaseError [${err.code}]` : "SupabaseDBError",
      errorType: "Supabase DB",
      level: "error",
      location: locationName,
      cause: err.message || err.details || "فشل تنفيذ الاستعلام في سوبا بيس",
      stackTrace: `Code: ${err.code || "N/A"}\nMessage: ${err.message || ""}\nDetails: ${err.details || ""}\nHint: ${err.hint || ""}`,
      context: { code: err.code, details: err.details, hint: err.hint },
    });
  }
  return result;
}

/**
 * Interceptor for GitHub API / Webhook integration operations.
 */
export async function captureGitHubError<T>(
  action: () => Promise<T>,
  locationName: string,
): Promise<T> {
  try {
    return await action();
  } catch (err: any) {
    const message = err?.message || String(err);
    reportLiveError({
      errorName: err?.name || "GitHubAPIError",
      errorType: "GitHub Integration",
      level: "error",
      location: locationName,
      cause: message,
      stackTrace: err?.stack || JSON.stringify(err, null, 2),
      context: { status: err?.status, response: err?.response },
    });
    throw err;
  }
}

/**
 * Initialize global client window error listeners for unhandled errors & promise rejections.
 */
export function initGlobalLiveErrorListeners(): void {
  if (typeof window === "undefined") return;

  const globalWin = window as any;
  if (globalWin.__LIVE_LOGS_INITIALIZED__) return;
  globalWin.__LIVE_LOGS_INITIALIZED__ = true;

  window.addEventListener("error", (event) => {
    // Ignore element resource load errors (e.g. <img>, <script>, <link> failing to load)
    if (event.target && event.target !== window) return;

    const loc = window.location.pathname;
    const isStorefront = !loc.startsWith("/admin");
    const errorType = isStorefront ? "Storefront UI" : "Admin UI";

    reportLiveError({
      errorName: event.error?.name || "UnhandledClientError",
      errorType,
      level: "error",
      location: `${loc} (${event.filename}:${event.lineno}:${event.colno})`,
      cause: event.message || "حدث خطأ غير متوقع في واجهة المستخدم",
      stackTrace: event.error?.stack || `File: ${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const loc = window.location.pathname;
    const isStorefront = !loc.startsWith("/admin");
    const errorType = isStorefront ? "Storefront UI" : "Admin UI";
    const reason = event.reason;

    const causeMsg =
      typeof reason === "string"
        ? reason
        : reason?.message || "فشل وعد برمجيات غير معالج (Unhandled Promise Rejection)";

    reportLiveError({
      errorName: reason?.name || "UnhandledPromiseRejection",
      errorType,
      level: "error",
      location: loc,
      cause: causeMsg,
      stackTrace:
        reason?.stack ||
        (typeof reason === "object" ? JSON.stringify(reason, null, 2) : String(reason)),
    });
  });

  // Note: window.fetch proxy is intentionally omitted to avoid infinite recursive POST server function logging.
}
