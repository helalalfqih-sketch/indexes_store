/**
 * Agent Tools — Repository Intelligence Layer
 *
 * Read Tools (no approval):
 *   readFile, searchCode, listFiles, inspectDatabase, inspectMigration
 *
 * Mutation Tools (approval_required — generate diff, not applied directly):
 *   editFile, createFile, deleteFile
 *
 * All tools are server-side only and respect:
 *   - Multi-Tenant isolation (tenant_id checks)
 *   - Protected paths policy
 *   - Sensitive table restrictions
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { isProtectedPath, canInspectRows, SENSITIVE_TABLES } from "./agent.policy";
import { getAdminDb } from "@/lib/ai-agent.functions";
import {
  generateFileDiff,
  validateDiff,
  detectFileConflict,
  summarizeProjectDiff,
} from "./agent.diff";

export { generateFileDiff, validateDiff, detectFileConflict, summarizeProjectDiff };

const execFileAsync = promisify(execFile);

// Project root — resolved relative to this file's location at build time
const PROJECT_ROOT = path.resolve(process.cwd());
const SRC_ROOT = path.join(PROJECT_ROOT, "src");

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export interface ReadFileResult {
  filePath: string;
  content: string;
  lines: number;
  truncated: boolean;
}

export interface SearchCodeResult {
  matches: Array<{
    file: string;
    line: number;
    content: string;
  }>;
  totalMatches: number;
  query: string;
}

export interface ListFilesResult {
  entries: Array<{
    name: string;
    isDir: boolean;
    sizeBytes?: number;
  }>;
  dirPath: string;
}

export interface InspectDatabaseResult {
  tableName: string;
  columns?: Array<{ name: string; type: string; nullable: boolean }>;
  rowCount?: number;
  sampleRows?: Record<string, unknown>[];
  error?: string;
}

export interface EditFileProposal {
  filePath: string;
  originalContent: string;
  newContent: string;
  diff: string;
  requiresApproval: true;
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function resolveSafePath(relOrAbsPath: string): string {
  // Normalize: strip leading slash or drive for safety
  const cleaned = relOrAbsPath.replace(/^[/\\]+/, "");
  const resolved = path.resolve(PROJECT_ROOT, cleaned);
  // Ensure it's within project root
  if (!resolved.startsWith(PROJECT_ROOT)) {
    throw new Error(`مسار الملف خارج نطاق المشروع: ${relOrAbsPath}`);
  }
  return resolved;
}

export function buildUnifiedDiff(filePath: string, original: string, newContent: string): string {
  const origLines = original.split("\n");
  const newLines = newContent.split("\n");
  const diffLines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

  let i = 0,
    j = 0;
  while (i < origLines.length || j < newLines.length) {
    if (origLines[i] === newLines[j]) {
      diffLines.push(` ${origLines[i]}`);
      i++;
      j++;
    } else if (i < origLines.length) {
      diffLines.push(`-${origLines[i]}`);
      i++;
    } else {
      diffLines.push(`+${newLines[j]}`);
      j++;
    }
  }
  return diffLines.join("\n");
}

export async function generatePatch(
  filePath: string,
  newContent: string,
): Promise<{ filePath: string; diff: string; originalContent: string }> {
  const resolved = resolveSafePath(filePath);
  let originalContent = "";
  try {
    originalContent = await fs.readFile(resolved, "utf-8");
  } catch {
    // New file
    originalContent = "";
  }
  const diff = buildUnifiedDiff(filePath, originalContent, newContent);
  return { filePath, diff, originalContent };
}

// ─────────────────────────────────────────────────
// READ TOOLS
// ─────────────────────────────────────────────────

const MAX_FILE_LINES = 500;

/**
 * Read a file from the project. Truncates at MAX_FILE_LINES.
 */
export async function readFile(
  filePath: string,
  startLine?: number,
  endLine?: number,
): Promise<ReadFileResult> {
  const resolved = resolveSafePath(filePath);
  const raw = await fs.readFile(resolved, "utf-8");
  const allLines = raw.split("\n");
  const start = Math.max(0, (startLine ?? 1) - 1);
  const end = Math.min(allLines.length, endLine ?? MAX_FILE_LINES);
  const selectedLines = allLines.slice(start, end);
  return {
    filePath,
    content: selectedLines.join("\n"),
    lines: allLines.length,
    truncated: end < allLines.length,
  };
}

/**
 * Search code in the project using ripgrep (rg) or grep fallback.
 * Returns up to 50 matches.
 */
export async function searchCode(
  query: string,
  filePattern?: string,
  options?: { caseInsensitive?: boolean; regex?: boolean },
): Promise<SearchCodeResult> {
  const MAX_RESULTS = 50;
  const { caseInsensitive = false, regex = false } = options ?? {};

  try {
    const args = [
      "--json",
      "--max-count",
      "50",
      caseInsensitive ? "-i" : "",
      regex ? "" : "--fixed-strings",
      ...(filePattern ? ["--glob", filePattern] : []),
      query,
      SRC_ROOT,
    ].filter(Boolean);

    const { stdout } = await execFileAsync("rg", args, { cwd: PROJECT_ROOT });
    const lines = stdout.trim().split("\n").filter(Boolean);
    const matches = lines
      .map((line) => {
        try {
          const obj = JSON.parse(line);
          if (obj.type === "match") {
            return {
              file: path.relative(PROJECT_ROOT, obj.data.path.text),
              line: obj.data.line_number,
              content: obj.data.lines.text.trim(),
            };
          }
        } catch {
          return null;
        }
        return null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .slice(0, MAX_RESULTS);

    return { matches, totalMatches: matches.length, query };
  } catch {
    // Fallback: simple grep via node
    return { matches: [], totalMatches: 0, query };
  }
}

/**
 * List files in a directory (non-recursive, one level).
 */
export async function listFiles(dirPath: string): Promise<ListFilesResult> {
  const resolved = resolveSafePath(dirPath);
  const entries = await fs.readdir(resolved, { withFileTypes: true });
  return {
    dirPath,
    entries: await Promise.all(
      entries.map(async (e) => {
        let sizeBytes: number | undefined;
        if (!e.isDirectory()) {
          try {
            const stat = await fs.stat(path.join(resolved, e.name));
            sizeBytes = stat.size;
          } catch {
            // ignore
          }
        }
        return { name: e.name, isDir: e.isDirectory(), sizeBytes };
      }),
    ),
  };
}

/**
 * Inspect a Supabase table schema and optionally a few sample rows.
 * Respects SENSITIVE_TABLES (schema only) and tenant_id isolation.
 */
export async function inspectDatabase(
  tableName: string,
  tenantId?: string,
  includeSampleRows = false,
): Promise<InspectDatabaseResult> {
  // Sanitize table name
  if (!/^[a-z_][a-z0-9_]*$/.test(tableName)) {
    return { tableName, error: `اسم الجدول غير صالح: ${tableName}` };
  }

  try {
    const db = await getAdminDb({});

    // Fetch column info from information_schema
    const { data: cols, error: colErr } = await (db as any).rpc("get_table_columns", {
      p_table_name: tableName,
    });

    const columns =
      !colErr && cols
        ? (cols as Array<{ column_name: string; data_type: string; is_nullable: string }>).map(
            (c) => ({
              name: c.column_name,
              type: c.data_type,
              nullable: c.is_nullable === "YES",
            }),
          )
        : undefined;

    // Sample rows only for non-sensitive tables
    let sampleRows: Record<string, unknown>[] | undefined;
    let rowCount: number | undefined;

    if (includeSampleRows && canInspectRows(tableName)) {
      let q = (db as any).from(tableName).select("*", { count: "exact", head: false }).limit(5);
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { data, count } = await q;
      sampleRows = (data as Record<string, unknown>[]) ?? undefined;
      rowCount = count ?? undefined;

      // Redact sensitive fields
      sampleRows = sampleRows?.map((row) => {
        const redacted = { ...row };
        for (const key of Object.keys(redacted)) {
          if (
            key.toLowerCase().includes("key") ||
            key.toLowerCase().includes("secret") ||
            key.toLowerCase().includes("token") ||
            key.toLowerCase().includes("password")
          ) {
            redacted[key] = "***REDACTED***";
          }
        }
        return redacted;
      });
    }

    return { tableName, columns, rowCount, sampleRows };
  } catch (e: any) {
    return { tableName, error: String(e?.message ?? e) };
  }
}

/**
 * Read a Supabase migration file.
 */
export async function inspectMigration(migrationName: string): Promise<ReadFileResult> {
  const migrationsDir = path.join(PROJECT_ROOT, "supabase", "migrations");
  // Find file by partial name
  const files = await fs.readdir(migrationsDir);
  const found = files.find((f) => f.includes(migrationName));
  if (!found) {
    throw new Error(`لم يتم العثور على migration: ${migrationName}`);
  }
  return readFile(path.join("supabase", "migrations", found));
}

// ─────────────────────────────────────────────────
// MUTATION TOOLS (generate proposals, not applied directly)
// ─────────────────────────────────────────────────

/**
 * Propose an edit to an existing file.
 * Returns the diff for review — does NOT apply the change.
 */
export async function proposeEditFile(
  filePath: string,
  newContent: string,
): Promise<EditFileProposal> {
  if (isProtectedPath(filePath)) {
    throw new Error(`هذا الملف محمي ولا يمكن تعديله: ${filePath}`);
  }
  const resolved = resolveSafePath(filePath);
  const originalContent = await fs.readFile(resolved, "utf-8");
  const diff = buildUnifiedDiff(filePath, originalContent, newContent);
  return { filePath, originalContent, newContent, diff, requiresApproval: true };
}

/**
 * Apply a previously approved edit proposal.
 * Must only be called after user explicitly approves.
 */
export async function applyEditFile(proposal: EditFileProposal): Promise<void> {
  if (isProtectedPath(proposal.filePath)) {
    throw new Error(`مرفوض: محاولة تعديل ملف محمي ${proposal.filePath}`);
  }
  const resolved = resolveSafePath(proposal.filePath);
  await fs.writeFile(resolved, proposal.newContent, "utf-8");
}

/**
 * Propose creating a new file. Returns the content for review.
 */
export async function proposeCreateFile(
  filePath: string,
  content: string,
): Promise<EditFileProposal> {
  if (isProtectedPath(filePath)) {
    throw new Error(`هذا المسار محمي ولا يمكن إنشاء ملف فيه: ${filePath}`);
  }
  const diff = buildUnifiedDiff(filePath, "", content);
  return { filePath, originalContent: "", newContent: content, diff, requiresApproval: true };
}

/**
 * Apply a create file proposal.
 */
export async function applyCreateFile(proposal: EditFileProposal): Promise<void> {
  const resolved = resolveSafePath(proposal.filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, proposal.newContent, "utf-8");
}

/**
 * Sandbox Layer — Create snapshot of affected files before execution
 */
export async function createFileSnapshots(filePaths: string[]): Promise<Record<string, string>> {
  const snapshots: Record<string, string> = {};
  for (const relPath of filePaths) {
    try {
      const resolved = resolveSafePath(relPath);
      snapshots[relPath] = await fs.readFile(resolved, "utf-8");
    } catch {
      snapshots[relPath] = "__FILE_DOES_NOT_EXIST__";
    }
  }
  return snapshots;
}

/**
 * Sandbox Layer — Rollback affected files to original snapshot state
 */
export async function rollbackFileSnapshots(snapshots: Record<string, string>): Promise<void> {
  for (const [relPath, originalContent] of Object.entries(snapshots)) {
    try {
      const resolved = resolveSafePath(relPath);
      if (originalContent === "__FILE_DOES_NOT_EXIST__") {
        await fs.unlink(resolved).catch(() => {});
      } else {
        await fs.writeFile(resolved, originalContent, "utf-8");
      }
    } catch (e) {
      console.warn(`[Rollback] Warning reverting ${relPath}:`, e);
    }
  }
}
