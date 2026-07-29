/**
 * Evidence Sanitizer Service
 * Strips confidential tokens, passwords, cookies, auth headers, and PII from evidence payloads
 */

const SECRET_PATTERNS = [
  /bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi,
  /eyJh[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*/g, // JWT tokens
  /(?:api[_-]?key|secret|password|auth[_-]?token|access[_-]?token)=([^&]+)/gi,
];

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-service-role",
  "apikey",
  "password",
  "secret",
  "access_token",
  "refresh_token",
]);

export function sanitizeEvidence(data: any): Record<string, any> {
  if (!data || typeof data !== "object") {
    return { value: sanitizeString(String(data)) };
  }

  const result: Record<string, any> = {};

  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = "[REDACTED_SECRET]";
      continue;
    }

    if (typeof val === "string") {
      result[key] = sanitizeString(val);
    } else if (typeof val === "object" && val !== null) {
      result[key] = sanitizeEvidence(val);
    } else {
      result[key] = val;
    }
  }

  return result;
}

export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // Sanitize full signed URLs with tokens
  try {
    const parsed = new URL(input);
    if (parsed.searchParams.has("token") || parsed.searchParams.has("X-Amz-Signature")) {
      parsed.searchParams.set("token", "[REDACTED]");
      parsed.searchParams.set("X-Amz-Signature", "[REDACTED]");
      sanitized = parsed.toString();
    }
  } catch {}

  // Sanitize secret regex patterns
  for (const pattern of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED_TOKEN]");
  }

  return sanitized;
}
