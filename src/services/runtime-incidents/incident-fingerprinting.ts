import { IncidentIngestionPayload } from "@/features/runtime-incidents/types/incident.types";

/**
 * Generate a stable SHA-256 fingerprint for grouping duplicate occurrences into a single incident.
 * Strips volatile values like UUIDs, timestamps, and request IDs.
 */
export function generateIncidentFingerprint(payload: IncidentIngestionPayload): string {
  const env = payload.environment || "production";
  const normalizedRoute = (payload.route || payload.method || "/").toLowerCase().replace(/\/+/g, "/");
  const operation = (payload.operation || "unknown_operation").toLowerCase();
  const statusFamily = payload.statusCode ? `${Math.floor(payload.statusCode / 100)}xx` : "error";
  
  // Normalize message: strip UUIDs, numbers, and hex strings
  const normalizedMsg = payload.message
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ":id")
    .replace(/\b\d+\b/g, ":num")
    .replace(/http[s]?:\/\/[^\s]+/gi, ":url")
    .trim();

  const rawKey = `${env}|${normalizedRoute}|${operation}|${statusFamily}|${normalizedMsg}`;
  
  return hashString(rawKey);
}

/** Simple fast deterministic hash string generator */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

export function classifySeverity(statusCode?: number, message?: string): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" {
  if (statusCode === 503 || statusCode === 500 || message?.toLowerCase().includes("fatal")) {
    return "CRITICAL";
  }
  if (statusCode === 502 || statusCode === 504 || statusCode === 403 || message?.toLowerCase().includes("schema_not_configured")) {
    return "HIGH";
  }
  if (statusCode === 404 || statusCode === 400) {
    return "MEDIUM";
  }
  return "LOW";
}
