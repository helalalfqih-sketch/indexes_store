/**
 * Architecture Understanding & Health Scorer — Gen 2 Autonomous Agentic IDE 🏛️
 *
 * Real production codebase scanner auditing architecture health & RLS compliance:
 *   - Scans UI components & routes for direct Supabase bypasses (`.from()`) outside Server Functions/Services.
 *   - Scans `supabase/migrations/*.sql` files for `ENABLE ROW LEVEL SECURITY` & `CREATE POLICY` statements.
 *   - Computes dynamic RLS coverage percentage.
 *   - Calculates actual dynamic Architecture Health Score (0 - 100).
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { scanProjectStructure } from "./code-intelligence.service";

export interface ArchitectureViolation {
  file: string;
  severity: "critical" | "warning" | "info";
  rule:
    "direct_db_in_ui" | "missing_tenant_filter" | "unprotected_server_fn" | "missing_rls_policy";
  description: string;
  suggestedFix: string;
}

export interface ArchitectureHealthReport {
  score: number; // 0 - 100
  violations: ArchitectureViolation[];
  metrics: {
    totalRoutes: number;
    totalComponents: number;
    totalServices: number;
    totalDbTables: number;
    tablesWithRlsCount: number;
    rlsCoveragePercentage: number;
    directDbBypassesCount: number;
  };
  scannedAt: string;
}

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Scan SQL migration files to identify tables with active Row Level Security (RLS)
 */
async function scanRlsCoverageInMigrations(knownTables: string[]): Promise<Set<string>> {
  const rlsTables = new Set<string>();
  const migrationsDir = path.join(PROJECT_ROOT, "supabase", "migrations");

  try {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((f) => f.endsWith(".sql"));

    for (const file of sqlFiles) {
      try {
        const content = await fs.readFile(path.join(migrationsDir, file), "utf-8");
        const lower = content.toLowerCase();

        for (const table of knownTables) {
          // Check for ALTER TABLE table ENABLE ROW LEVEL SECURITY or CREATE POLICY ... ON table
          const enableRlsRegex = new RegExp(
            `alter\\s+table\\s+(${table}|public\\.${table})\\s+enable\\s+row\\s+level\\s+security`,
            "i",
          );
          const createPolicyRegex = new RegExp(
            `create\\s+policy\\s+.*?on\\s+(${table}|public\\.${table})`,
            "i",
          );

          if (enableRlsRegex.test(content) || createPolicyRegex.test(content)) {
            rlsTables.add(table);
          }
        }
      } catch {
        // Skip unreadable SQL file
      }
    }
  } catch {
    // Migration directory missing
  }

  return rlsTables;
}

/**
 * Scan UI components and routes to detect direct DB queries bypassing Server Functions
 */
async function scanDirectDbBypassesInUi(files: string[]): Promise<ArchitectureViolation[]> {
  const violations: ArchitectureViolation[] = [];

  for (const relPath of files) {
    // Only check UI layers (components and routes)
    if (!relPath.startsWith("src/routes/") && !relPath.startsWith("src/components/")) {
      continue;
    }

    try {
      const absPath = path.resolve(PROJECT_ROOT, relPath.replace(/^[/\\]+/, ""));
      const content = await fs.readFile(absPath, "utf-8");

      // Detect direct .from("table").select() or .from("table").insert() calls in UI
      if (/\.from\s*\(\s*['"][a-z_]+['"]\s*\)\s*\.(select|insert|update|delete)/i.test(content)) {
        violations.push({
          file: relPath,
          severity: "warning",
          rule: "direct_db_in_ui",
          description: `مكوّن الواجهة ${path.basename(relPath)} ينفذ استعلام داتابيز مباشر (.from) بدلاً من استدعاء Server Function معزول.`,
          suggestedFix: `انقل الاستعلام إلى Server Function داخل src/lib/ أو src/services/ ثم استدعه بواسطة useServerFn`,
        });
      }
    } catch {
      // Ignore unreadable file
    }
  }

  return violations;
}

/**
 * Perform a full architectural scan across the codebase
 */
export async function auditProjectArchitecture(): Promise<ArchitectureHealthReport> {
  const structure = await scanProjectStructure();
  const allUiFiles = [...structure.routes, ...structure.components];

  // 1. Scan direct DB bypasses in UI
  const violations = await scanDirectDbBypassesInUi(allUiFiles);

  // 2. Scan SQL migrations for RLS enforcement
  const rlsTables = await scanRlsCoverageInMigrations(structure.dbTables);
  const totalTables = structure.dbTables.length;
  const tablesWithRlsCount = rlsTables.size;
  const rlsCoveragePercentage =
    totalTables > 0 ? Math.round((tablesWithRlsCount / totalTables) * 100) : 100;

  // Add violation for non-RLS tables
  for (const table of structure.dbTables) {
    if (!rlsTables.has(table) && table !== "ai_project_context") {
      violations.push({
        file: `database/table:${table}`,
        severity: "critical",
        rule: "missing_rls_policy",
        description: `الجدول ${table} لا يحتوي على سياسة عزل Row Level Security (RLS) مؤكدة في ملفات الـ SQL Migrations.`,
        suggestedFix: `قم بإنشاء SQL Migration يضم: ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
      });
    }
  }

  // 3. Dynamic Health Score calculation
  const criticalCount = violations.filter((v) => v.severity === "critical").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;

  let score = 100;
  score -= criticalCount * 12;
  score -= warningCount * 4;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    violations,
    metrics: {
      totalRoutes: structure.routes.length,
      totalComponents: structure.components.length,
      totalServices: structure.services.length,
      totalDbTables: totalTables,
      tablesWithRlsCount,
      rlsCoveragePercentage,
      directDbBypassesCount: warningCount,
    },
    scannedAt: new Date().toISOString(),
  };
}
