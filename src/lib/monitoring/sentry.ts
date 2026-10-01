/**
 * Monitoring & Telemetry Service (Sentry / Real-time Logger Integration)
 */

interface ErrorContext {
  component?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

type TelemetryWindow = Window & {
  Sentry?: {
    captureException: (error: Error, options: unknown) => void;
    captureMessage: (message: string, level: string) => void;
  };
};
let initialized = false;
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const MonitoringService = {
  /**
   * Initialize monitoring and global error listeners.
   */
  init() {
    if (typeof window === "undefined" || initialized) return;
    initialized = true;

    if (SENTRY_DSN && (window as TelemetryWindow).Sentry) {
      console.log("[Monitoring] Sentry runtime detected; delivery requires verification");
    } else {
      console.log("[Monitoring] Active in Console fallback mode (No VITE_SENTRY_DSN configured)");
    }

    // Capture uncaught window exceptions
    window.addEventListener("error", (event) => {
      this.captureException(event.error || new Error(event.message), {
        component: "GlobalWindow",
        action: "uncaught_error",
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: "GlobalWindow",
          action: "unhandled_rejection",
        },
      );
    });
  },

  /**
   * Capture runtime exceptions.
   */
  captureException(error: Error | unknown, context?: ErrorContext) {
    const original = error instanceof Error ? error : new Error(String(error));
    const errObj = import.meta.env.DEV ? original : new Error("Storefront runtime failure");

    console.error(`[Telemetry Error] [${context?.component || "App"}] ${errObj.message}`, {
      stack: errObj.stack,
      context: { component: context?.component, action: context?.action },
      timestamp: new Date().toISOString(),
    });

    // If Sentry is initialized, dispatch to Sentry API
    if (SENTRY_DSN && typeof window !== "undefined" && (window as TelemetryWindow).Sentry) {
      (window as TelemetryWindow).Sentry?.captureException(errObj, {
        extra: { component: context?.component, action: context?.action },
      });
    }
  },

  /**
   * Log custom telemetry messages or key metrics.
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
    console.log(`[Telemetry ${level.toUpperCase()}] ${message}`);

    if (SENTRY_DSN && typeof window !== "undefined" && (window as TelemetryWindow).Sentry) {
      (window as TelemetryWindow).Sentry?.captureMessage(message, level);
    }
  },
};
