/**
 * Project Code Intelligence Service — Phase 7.3 🧠
 *
 * Scans, indexes, and analyzes Indexes Store codebase structure:
 *   - Routes (src/routes)
 *   - Components (src/components)
 *   - Services & Libs (src/services, src/lib)
 *   - Database Tables & Migrations
 *   - Package Dependencies
 *
 * Generates dynamic, context-aware maps injected into AI Prompt System.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getAdminDb } from "@/lib/ai-agent.functions";

export interface CodebaseIndex {
  routes: string[];
  components: string[];
  services: string[];
  serverFunctions: string[];
  dbTables: string[];
  migrations: string[];
  dependencies: Record<string, string>;
  scannedAt: string;
}

export interface RelatedFilesReport {
  targetFile: string;
  imports: string[];
  importedBy: string[];
  relatedRoute?: string;
}

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Scan project files recursively with depth limit
 */
async function scanDirectoryFiles(
  dirRelPath: string,
  maxDepth = 4,
  currentDepth = 0,
): Promise<string[]> {
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
    // Directory does not exist or inaccessible
  }
  return results;
}

/**
 * Extract dependencies from package.json
 */
async function getPackageDependencies(): Promise<Record<string, string>> {
  try {
    const pkgPath = path.join(PROJECT_ROOT, "package.json");
    const raw = await fs.readFile(pkgPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...(parsed.dependencies || {}),
      ...(parsed.devDependencies || {}),
    };
  } catch {
    return {};
  }
}

/**
 * Scan and index the full project structure
 */
export async function scanProjectStructure(): Promise<CodebaseIndex> {
  const [routes, components, services, libFiles, migrations, deps] = await Promise.all([
    scanDirectoryFiles("src/routes"),
    scanDirectoryFiles("src/components"),
    scanDirectoryFiles("src/services"),
    scanDirectoryFiles("src/lib"),
    scanDirectoryFiles("supabase/migrations"),
    getPackageDependencies(),
  ]);

  const allServices = Array.from(new Set([...services, ...libFiles]));

  // Key DB tables known in Indexes Store
  const dbTables = [
    "products",
    "categories",
    "orders",
    "order_items",
    "profiles",
    "user_roles",
    "tenants",
    "media_files",
    "ai_agent_tasks",
    "ai_agent_sessions",
    "ai_agent_messages",
    "ai_task_memory",
    "ai_execution_history",
    "ai_project_context",
  ];

  // Extract server function files (.functions.ts)
  const serverFunctions = allServices.filter(
    (f) => f.includes(".functions.ts") || f.includes(".server.ts"),
  );

  return {
    routes,
    components,
    services: allServices,
    serverFunctions,
    dbTables,
    migrations,
    dependencies: deps,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Analyze imports/dependencies for a specific file
 */
export async function analyzeFileDependencies(filePath: string): Promise<string[]> {
  try {
    const absPath = path.resolve(PROJECT_ROOT, filePath.replace(/^[/\\]+/, ""));
    const content = await fs.readFile(absPath, "utf-8");
    const importLines = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];

    const imports: string[] = [];
    for (const line of importLines) {
      const match = line.match(/from\s+['"]([^'"]+)['"]/);
      if (match && match[1]) {
        imports.push(match[1]);
      }
    }
    return imports;
  } catch {
    return [];
  }
}

/**
 * Find related files (imports and sibling routes/components)
 */
export async function findRelatedFiles(filePath: string): Promise<RelatedFilesReport> {
  const imports = await analyzeFileDependencies(filePath);

  // Guess related route or component
  let relatedRoute: string | undefined;
  if (filePath.includes("src/components/")) {
    const name = path.basename(filePath, path.extname(filePath));
    relatedRoute = `src/routes/admin.${name}.tsx`;
  }

  return {
    targetFile: filePath,
    imports,
    importedBy: [],
    relatedRoute,
  };
}

/**
 * Dynamic AI Agent Prompt Context Generator
 * Returns context tailored to the user's query and query keywords
 */
export async function getProjectContextForAgent(
  tenantId: string,
  userQuery: string = "",
): Promise<string> {
  const index = await scanProjectStructure();

  // Filter relevant files based on user query keywords
  const q = userQuery.toLowerCase();
  const matchedRoutes = index.routes.filter((r) =>
    q.split(" ").some((kw) => kw.length > 2 && r.toLowerCase().includes(kw)),
  );
  const matchedComponents = index.components.filter((c) =>
    q.split(" ").some((kw) => kw.length > 2 && c.toLowerCase().includes(kw)),
  );

  const sections: string[] = [
    `=== FINGERPRINT: Indexes Store Code Intelligence ===`,
    `عدد المسارات (Routes): ${index.routes.length}`,
    `عدد المكونات (Components): ${index.components.length}`,
    `عدد الخدمات الخادمية (Services & Functions): ${index.serverFunctions.length}`,
    `عدد جداول قاعدة البيانات: ${index.dbTables.length}`,
    ``,
    `=== الجداول الرئسية للنظام (Database Tables) ===`,
    index.dbTables.join(", "),
    ``,
    `=== أهم المسارات الخادمية (Key Routes) ===`,
    index.routes.slice(0, 15).join("\n"),
    ``,
    `=== الدوال الخادمية المحمية (Server Functions) ===`,
    index.serverFunctions.join("\n"),
  ];

  if (matchedRoutes.length > 0) {
    sections.push(``, `=== المسارات المرتبطة بالطلب ===`, matchedRoutes.join("\n"));
  }
  if (matchedComponents.length > 0) {
    sections.push(``, `=== المكونات المرتبطة بالطلب ===`, matchedComponents.join("\n"));
  }

  // Persist snapshot to ai_project_context DB table
  try {
    const db = await getAdminDb({});
    await (db as any).from("ai_project_context").upsert(
      {
        tenant_id: tenantId,
        project_name: "Indexes Store",
        file_structure: {
          routes: index.routes,
          components: index.components,
          services: index.services,
          serverFunctions: index.serverFunctions,
        },
        database_schema: { tables: index.dbTables },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    );
  } catch (e) {
    console.warn("[CodeIntelligence] Upsert notice:", e);
  }

  return sections.join("\n");
}
export interface ImpactAnalysisReport {
  targetFiles: string[];
  affectedComponents: string[];
  affectedDatabaseTables: string[];
  affectedApis: string[];
  dependencyMap: Record<string, string[]>;
}

/**
 * Build a light dependency graph mapping files to imports and database tables
 */
export async function buildDependencyGraph(
  targetFiles: string[],
): Promise<Record<string, string[]>> {
  const graph: Record<string, string[]> = {};
  for (const file of targetFiles) {
    const imports = await analyzeFileDependencies(file);
    graph[file] = imports;
  }
  return graph;
}

/**
 * Perform Impact Analysis on target files to determine affected components, database tables, and APIs
 */
export async function findImpactAnalysis(targetFiles: string[]): Promise<ImpactAnalysisReport> {
  const index = await scanProjectStructure();
  const affectedComponents: Set<string> = new Set();
  const affectedDatabaseTables: Set<string> = new Set();
  const affectedApis: Set<string> = new Set();
  const dependencyMap: Record<string, string[]> = {};

  for (const file of targetFiles) {
    const imports = await analyzeFileDependencies(file);
    dependencyMap[file] = imports;

    // Detect DB tables referenced
    try {
      const absPath = path.resolve(PROJECT_ROOT, file.replace(/^[/\\]+/, ""));
      const content = await fs.readFile(absPath, "utf-8");

      for (const table of index.dbTables) {
        if (content.includes(`.from("${table}")`) || content.includes(`.from('${table}')`)) {
          affectedDatabaseTables.add(table);
        }
      }

      // Detect APIs/Server functions
      if (
        content.includes("createServerFn") ||
        file.includes(".functions.ts") ||
        file.includes(".server.ts")
      ) {
        affectedApis.add(file);
      }

      // Detect Components
      for (const comp of index.components) {
        const compBasename = path.basename(comp, path.extname(comp));
        if (content.includes(compBasename)) {
          affectedComponents.add(comp);
        }
      }
    } catch {
      // Ignore unreadable file
    }
  }

  return {
    targetFiles,
    affectedComponents: Array.from(affectedComponents),
    affectedDatabaseTables: Array.from(affectedDatabaseTables),
    affectedApis: Array.from(affectedApis),
    dependencyMap,
  };
}

/**
 * Get detailed related code context for a target file
 */
export async function getRelatedCodeContext(targetFile: string): Promise<string> {
  const report = await findImpactAnalysis([targetFile]);
  const sections = [
    `=== Impact Analysis for: ${targetFile} ===`,
    `المكونات المتأثرة (Components): ${report.affectedComponents.length > 0 ? report.affectedComponents.join(", ") : "لا يوجد"}`,
    `جداول قواعد البيانات المستهدفة (DB Tables): ${report.affectedDatabaseTables.length > 0 ? report.affectedDatabaseTables.join(", ") : "لا يوجد"}`,
    `الـ APIs والـ Server Functions: ${report.affectedApis.length > 0 ? report.affectedApis.join(", ") : "لا يوجد"}`,
  ];
  return sections.join("\n");
}
