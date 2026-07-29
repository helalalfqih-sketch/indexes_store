/**
 * Phase 9 — Backup & Code Snapshot Manager
 * Creates temporary code & state snapshots before executing repair patches
 */

export interface BackupSnapshot {
  snapshotId: string;
  proposalId: string;
  targetFile: string;
  originalCodeContent: string;
  createdAt: string;
}

const snapshotStore: Map<string, BackupSnapshot> = new Map();

export function createBackupSnapshot(
  proposalId: string,
  targetFile: string,
  codeContent: string,
): BackupSnapshot {
  const snapshotId = `SNAP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const snapshot: BackupSnapshot = {
    snapshotId,
    proposalId,
    targetFile,
    originalCodeContent: codeContent,
    createdAt: new Date().toISOString(),
  };
  snapshotStore.set(snapshotId, snapshot);
  return snapshot;
}

export function restoreBackupSnapshot(snapshotId: string): BackupSnapshot | null {
  const snapshot = snapshotStore.get(snapshotId);
  return snapshot || null;
}
