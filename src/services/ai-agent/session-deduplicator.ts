/**
 * Phase 10.2 — Session Deduplication Engine
 * Prevents creating duplicate AI sessions for identical prompts within a 10-minute window
 */

export interface SessionDeduplicationRecord {
  sessionFingerprint: string;
  sessionId: string;
  userId: string;
  tenantId: string;
  prompt: string;
  createdAt: number;
}

const activeSessionFingerprints: Map<string, SessionDeduplicationRecord> = new Map();
const SESSION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function generateSessionFingerprint(
  userId: string,
  tenantId: string,
  prompt: string,
): string {
  const normalizedPrompt = prompt.trim().toLowerCase().replace(/\s+/g, " ");
  const raw = `${userId}:${tenantId}:${normalizedPrompt}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `SESS-FP-${Math.abs(hash)}`;
}

export function checkSessionDeduplication(
  userId: string,
  tenantId: string,
  prompt: string,
): { isDuplicate: boolean; existingSessionId?: string; sessionFingerprint: string } {
  const sessionFingerprint = generateSessionFingerprint(userId, tenantId, prompt);
  const existing = activeSessionFingerprints.get(sessionFingerprint);
  const now = Date.now();

  if (existing) {
    if (now - existing.createdAt < SESSION_WINDOW_MS) {
      return {
        isDuplicate: true,
        existingSessionId: existing.sessionId,
        sessionFingerprint,
      };
    }
  }

  return { isDuplicate: false, sessionFingerprint };
}

export function registerSessionFingerprint(
  sessionFingerprint: string,
  sessionId: string,
  userId: string,
  tenantId: string,
  prompt: string,
) {
  activeSessionFingerprints.set(sessionFingerprint, {
    sessionFingerprint,
    sessionId,
    userId,
    tenantId,
    prompt,
    createdAt: Date.now(),
  });
}
