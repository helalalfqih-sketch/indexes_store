/**
 * Phase 1: Code Patch & Rollback Engine
 * Provides safe in-memory file mutation, path security checks, and rollback safety for AI Builder.
 */
import fs from "node:fs/promises";
import path from "node:path";

export interface CodePatchOptions {
  targetFile: string;
  newContent: string;
}

export interface PatchBackupRecord {
  backupId: string;
  targetFile: string;
  originalContent: string | null;
  existed: boolean;
  timestamp: string;
}

const backupStore = new Map<string, PatchBackupRecord>();

const PROTECTED_PATTERNS = [
  /\.env(\..*)?$/i,
  /node_modules/i,
  /\.git/i,
  /secrets/i,
  /credentials/i,
];

export function isPathProtected(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Safely applies a code patch to a file in the workspace after creating a rollback snapshot.
 */
export async function applyCodePatch(
  options: CodePatchOptions,
): Promise<{ success: boolean; backupId: string; targetFile: string; error?: string }> {
  try {
    const rootDir = process.cwd();
    const sanitizedRelPath = options.targetFile.replace(/^(\.\.[\/\\])+/, "").replace(/\\/g, "/");
    const absPath = path.resolve(rootDir, sanitizedRelPath);

    // Security check: Ensure file stays within project root
    if (!absPath.startsWith(rootDir)) {
      return {
        success: false,
        backupId: "",
        targetFile: sanitizedRelPath,
        error: "Access denied: Path outside workspace root",
      };
    }

    // Protection check
    if (isPathProtected(sanitizedRelPath)) {
      return {
        success: false,
        backupId: "",
        targetFile: sanitizedRelPath,
        error: "Mutation denied: File is protected by safety policy",
      };
    }

    let originalContent: string | null = null;
    let existed = false;

    try {
      originalContent = await fs.readFile(absPath, "utf-8");
      existed = true;
    } catch {
      existed = false;
    }

    const backupId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const backupRecord: PatchBackupRecord = {
      backupId,
      targetFile: sanitizedRelPath,
      originalContent,
      existed,
      timestamp: new Date().toISOString(),
    };

    backupStore.set(backupId, backupRecord);

    // Ensure directory exists
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, options.newContent, "utf-8");

    return {
      success: true,
      backupId,
      targetFile: sanitizedRelPath,
    };
  } catch (err: any) {
    return {
      success: false,
      backupId: "",
      targetFile: options.targetFile,
      error: err?.message || "Failed to apply code patch",
    };
  }
}

/**
 * Rollback a code patch to its original state using the backup snapshot.
 */
export async function rollbackCodePatch(
  backupId: string,
): Promise<{ success: boolean; targetFile: string; error?: string }> {
  const record = backupStore.get(backupId);
  if (!record) {
    return { success: false, targetFile: "", error: "Backup snapshot not found or expired" };
  }

  try {
    const rootDir = process.cwd();
    const absPath = path.resolve(rootDir, record.targetFile);

    if (record.existed && record.originalContent !== null) {
      await fs.writeFile(absPath, record.originalContent, "utf-8");
    } else {
      // If file didn't exist before, remove it
      await fs.unlink(absPath).catch(() => {});
    }

    backupStore.delete(backupId);
    return { success: true, targetFile: record.targetFile };
  } catch (err: any) {
    return {
      success: false,
      targetFile: record.targetFile,
      error: err?.message || "Failed to rollback code patch",
    };
  }
}

/**
 * Commit a code patch snapshot (clears backup store).
 */
export function commitCodePatch(backupId: string): void {
  backupStore.delete(backupId);
}
