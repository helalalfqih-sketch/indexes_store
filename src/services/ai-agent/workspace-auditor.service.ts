/**
 * Full Workspace Auditor Service — Gen 2 Autonomous Agentic IDE 🔍
 *
 * Scans every file across the entire repository to produce a comprehensive error report:
 *   - Scans `src/routes`, `src/components`, `src/services`, `src/lib`, `supabase/migrations`
 *   - Runs static code reviewer suite across all files
 *   - Aggregates critical errors, security risks, RLS gaps, and performance warnings
 *   - Provides automated fix plans (Lovable-style "Fix All Issues")
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { reviewCodeContent, type CodeReviewFinding } from "./code-reviewer";

export interface FileAuditReport {
  filePath: string;
  passed: boolean;
  score: number;
  criticalCount: number;
  warningCount: number;
  findings: CodeReviewFinding[];
}

export interface WorkspaceAuditReport {
  totalFilesScanned: number;
  cleanFilesCount: number;
  filesWithIssuesCount: number;
  totalCriticalErrors: number;
  totalWarnings: number;
  overallHealthScore: number; // 0 - 100
  fileReports: FileAuditReport[];
  auditedAt: string;
}

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Scan project files recursively with depth limit
 */
async function scanDirectoryFiles(dirRelPath: string, maxDepth = 5, currentDepth = 0): Promise<string[]> {
  if (currentDepth > maxDepth) return [];
  const absPath = path.resolve(PROJECT_ROOT, dirRelPath);
  let results: string[] = [];

  try {
    const entries = await fs.readdir(absPath, { withFileTypes: true });
    for (const entry of entries) {
      if (
        entry.name.startsWith(".") ||
        entry.name === "node_modules" ||
        entry.name === "dist" ||
        entry.name === ".output"
      ) {
        continue;
      }
      const relItem = path.join(dirRelPath, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        const subFiles = await scanDirectoryFiles(relItem, maxDepth, currentDepth + 1);
        results = results.concat(subFiles);
      } else if (/\.(ts|tsx|js|jsx|json|sql)$/.test(entry.name)) {
        results.push(relItem);
      }
    }
  } catch {
    // Directory missing or inaccessible
  }
  return results;
}

/**
 * Perform a full codebase audit scanning all files in the repository
 */
export async function auditFullWorkspace(): Promise<WorkspaceAuditReport> {
  const [routes, components, services, libFiles, migrations] = await Promise.all([
    scanDirectoryFiles("src/routes"),
    scanDirectoryFiles("src/components"),
    scanDirectoryFiles("src/services"),
    scanDirectoryFiles("src/lib"),
    scanDirectoryFiles("supabase/migrations"),
  ]);

  const allFiles = Array.from(new Set([...routes, ...components, ...services, ...libFiles, ...migrations]));
  const fileReports: FileAuditReport[] = [];

  let totalCritical = 0;
  let totalWarn = 0;
  let cleanCount = 0;

  for (const filePath of allFiles) {
    try {
      const absPath = path.resolve(PROJECT_ROOT, filePath.replace(/^[/\\]+/, ""));
      const content = await fs.readFile(absPath, "utf-8");
      const report = reviewCodeContent(filePath, content);

      const criticalCount = report.findings.filter((f) => f.severity === "critical").length;
      const warningCount = report.findings.filter((f) => f.severity === "high" || f.severity === "medium").length;

      totalCritical += criticalCount;
      totalWarn += warningCount;

      if (report.findings.length === 0) {
        cleanCount++;
      }

      if (report.findings.length > 0) {
        fileReports.push({
          filePath,
          passed: report.passed,
          score: report.score,
          criticalCount,
          warningCount,
          findings: report.findings,
        });
      }
    } catch {
      // Ignore unreadable file
    }
  }

  // Calculate dynamic overall workspace health score
  const totalScanned = allFiles.length;
  let overallScore = 100 - totalCritical * 15 - totalWarn * 3;
  overallScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  return {
    totalFilesScanned: totalScanned,
    cleanFilesCount: cleanCount,
    filesWithIssuesCount: fileReports.length,
    totalCriticalErrors: totalCritical,
    totalWarnings: totalWarn,
    overallHealthScore: overallScore,
    fileReports: fileReports.sort((a, b) => b.criticalCount - a.criticalCount || a.score - b.score),
    auditedAt: new Date().toISOString(),
  };
}
