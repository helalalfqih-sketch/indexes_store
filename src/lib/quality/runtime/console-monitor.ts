/**
 * Phase 4 — Runtime Console Monitor
 * Captures browser & runtime console errors
 */

export interface ConsoleErrorEvent {
  id: string;
  message: string;
  source?: string;
  line?: number;
  col?: number;
  stack?: string;
  timestamp: string;
}

const consoleErrorBuffer: ConsoleErrorEvent[] = [];

export function registerConsoleMonitor() {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    try {
      const msg = args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
        .join(" ");
      consoleErrorBuffer.push({
        id: `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message: msg,
        timestamp: new Date().toISOString(),
      });
      if (consoleErrorBuffer.length > 50) consoleErrorBuffer.shift();
    } catch {}
    originalConsoleError.apply(console, args);
  };
}

export function getConsoleErrors(): ConsoleErrorEvent[] {
  return [...consoleErrorBuffer];
}

export function clearConsoleErrors(): void {
  consoleErrorBuffer.length = 0;
}
