/**
 * Step 3: Git-like Code Patch Engine Service
 * Generates unified line-by-line diffs (BEFORE `-` / AFTER `+`), manages patch records in ai_code_changes,
 * and safely applies patches with lifecycle statuses: PENDING -> APPROVED -> APPLIED / FAILED.
 */
import path from "node:path";
import fs from "node:fs/promises";
import { applyCodePatch } from "@/services/ai-agent/code-patcher.engine";

export interface CodePatchRecord {
  id: string;
  session_id: string;
  tenant_id: string;
  file_path: string;
  operation: "create" | "modify" | "delete";
  before_content: string | null;
  after_content: string;
  diff: string;
  status: "PENDING" | "APPROVED" | "APPLIED" | "FAILED";
  created_at: string;
}

/**
 * Formats a clean Git-like unified diff string between beforeContent and afterContent.
 */
export function generateGitDiff(
  filePath: string,
  beforeContent: string,
  afterContent: string,
): string {
  const normPath = filePath.replace(/\\/g, "/");
  const beforeLines = beforeContent ? beforeContent.split("\n") : [];
  const afterLines = afterContent ? afterContent.split("\n") : [];

  const diffLines: string[] = [
    `--- a/${normPath}`,
    `+++ b/${normPath}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
  ];

  // Simple line diff calculation
  let i = 0;
  let j = 0;

  while (i < beforeLines.length || j < afterLines.length) {
    if (i < beforeLines.length && j < afterLines.length && beforeLines[i] === afterLines[j]) {
      diffLines.push(` ${beforeLines[i]}`);
      i++;
      j++;
    } else if (
      j < afterLines.length &&
      (!beforeLines.includes(afterLines[j]) || i >= beforeLines.length)
    ) {
      diffLines.push(`+${afterLines[j]}`);
      j++;
    } else if (i < beforeLines.length) {
      diffLines.push(`-${beforeLines[i]}`);
      i++;
    }
  }

  return diffLines.join("\n");
}

/**
 * Creates and records a new code patch in ai_code_changes table.
 */
export async function createPatchRecord(options: {
  db: any;
  tenantId: string;
  sessionId: string;
  filePath: string;
  operation: "create" | "modify" | "delete";
  afterContent: string;
}): Promise<{
  success: boolean;
  patchId: string;
  diff: string;
  record?: CodePatchRecord;
  error?: string;
}> {
  try {
    const { db, tenantId, sessionId, filePath, operation, afterContent } = options;
    const sanitizedRelPath = filePath.replace(/^(\.\.[\/\\])+/, "").replace(/\\/g, "/");
    const absPath = path.resolve(process.cwd(), sanitizedRelPath);

    let beforeContent = "";
    try {
      beforeContent = await fs.readFile(absPath, "utf-8");
    } catch {
      beforeContent = "";
    }

    const diff = generateGitDiff(sanitizedRelPath, beforeContent, afterContent);

    let patchId = `patch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    if (db) {
      const { data, error } = await db
        .from("ai_code_changes")
        .insert({
          tenant_id: tenantId,
          session_id: sessionId,
          file_path: sanitizedRelPath,
          operation,
          before_content: beforeContent,
          after_content: afterContent,
          diff,
          status: "PENDING",
        })
        .select()
        .single();

      if (error) {
        console.warn("[PATCH_ENGINE_DB_WARN]", error.message);
      } else if (data) {
        patchId = data.id;
      }
    }

    return {
      success: true,
      patchId,
      diff,
      record: {
        id: patchId,
        session_id: sessionId,
        tenant_id: tenantId,
        file_path: sanitizedRelPath,
        operation,
        before_content: beforeContent,
        after_content: afterContent,
        diff,
        status: "PENDING",
        created_at: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      patchId: "",
      diff: "",
      error: err?.message || "Failed to create code patch record",
    };
  }
}

/**
 * Approves and applies a patch record to the local filesystem, updating status to APPLIED or FAILED.
 */
export async function applyPatchRecord(options: {
  db: any;
  tenantId: string;
  patchId: string;
  targetFile?: string;
  newContent?: string;
}): Promise<{ success: boolean; patchId: string; status: string; error?: string }> {
  try {
    const { db, tenantId, patchId } = options;
    let filePath = options.targetFile || "";
    let newContent = options.newContent || "";

    if (db && patchId) {
      const { data, error } = await db
        .from("ai_code_changes")
        .select("*")
        .eq("id", patchId)
        .single();

      if (data && !error) {
        filePath = data.file_path;
        newContent = data.after_content;
      }
    }

    if (!filePath) {
      return { success: false, patchId, status: "FAILED", error: "Target file path missing" };
    }

    // Call safe code patcher
    const patchRes = await applyCodePatch({ targetFile: filePath, newContent });

    const finalStatus = patchRes.success ? "APPLIED" : "FAILED";

    if (db && patchId) {
      await db.from("ai_code_changes").update({ status: finalStatus }).eq("id", patchId);
    }

    return {
      success: patchRes.success,
      patchId,
      status: finalStatus,
      error: patchRes.error,
    };
  } catch (err: any) {
    return {
      success: false,
      patchId: options.patchId,
      status: "FAILED",
      error: err?.message || "Failed to apply patch record",
    };
  }
}
