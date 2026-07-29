/**
 * Task Deduplication Engine
 * Prevents executing identical AI tasks multiple times within a 5-minute cooldown window
 */

export interface TaskDeduplicationRecord {
  fingerprint: string;
  sessionId: string;
  taskTitle: string;
  targetFile: string;
  dispatchedAt: number;
}

const activeTaskFingerprints: Map<string, TaskDeduplicationRecord> = new Map();
const COOLDOWN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function generateTaskFingerprint(
  sessionId: string,
  taskTitle: string,
  targetFile = "",
): string {
  const raw = `${sessionId}:${taskTitle.trim().toLowerCase()}:${targetFile.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `FP-${Math.abs(hash)}`;
}

export function checkTaskDeduplication(
  sessionId: string,
  taskTitle: string,
  targetFile = "",
): {
  isDuplicate: boolean;
  fingerprint: string;
  timeRemainingSeconds?: number;
} {
  const fingerprint = generateTaskFingerprint(sessionId, taskTitle, targetFile);
  const existing = activeTaskFingerprints.get(fingerprint);
  const now = Date.now();

  if (existing) {
    const elapsed = now - existing.dispatchedAt;
    if (elapsed < COOLDOWN_WINDOW_MS) {
      const timeRemainingSeconds = Math.ceil((COOLDOWN_WINDOW_MS - elapsed) / 1000);
      return { isDuplicate: true, fingerprint, timeRemainingSeconds };
    }
  }

  // Register or update fingerprint
  activeTaskFingerprints.set(fingerprint, {
    fingerprint,
    sessionId,
    taskTitle,
    targetFile,
    dispatchedAt: now,
  });

  return { isDuplicate: false, fingerprint };
}
