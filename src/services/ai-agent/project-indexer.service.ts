/**
 * Step 2: Project Intelligence Indexer Service
 * Performs AST & symbol analysis (imports, exports, functions, components, DB references),
 * computes SHA-256 content hashes, and manages persistent project memory in ai_project_files.
 */
import crypto from "node:crypto";
import path from "node:path";

export interface SymbolAnalysisResult {
  imports: string[];
  exports: string[];
  functions: string[];
  components: string[];
  dbReferences: string[];
  symbols: { name: string; type: "function" | "component" | "export" | "import" }[];
  summary: string;
}

export function computeSHA256Hash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function parseASTSymbols(content: string, filePath: string): SymbolAnalysisResult {
  const importsSet = new Set<string>();
  const exportsSet = new Set<string>();
  const functionsSet = new Set<string>();
  const componentsSet = new Set<string>();
  const dbReferencesSet = new Set<string>();
  const symbols: { name: string; type: "function" | "component" | "export" | "import" }[] = [];

  const lines = content.split("\n");
  const ext = path.extname(filePath).toLowerCase();

  if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
    // 1. Extract Imports
    const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      importsSet.add(match[1]);
      symbols.push({ name: match[1], type: "import" });
    }

    // 2. Extract Exports
    const exportRegex =
      /export\s+(?:const|function|class|type|interface|default)\s+([A-Za-z0-9_]+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const name = match[1];
      exportsSet.add(name);
      if (/^[A-Z]/.test(name)) {
        componentsSet.add(name);
        symbols.push({ name, type: "component" });
      } else {
        functionsSet.add(name);
        symbols.push({ name, type: "export" });
      }
    }

    // 3. Extract Functions & Components
    const funcRegex = /(?:function|const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/g;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1];
      if (/^[A-Z]/.test(name)) {
        componentsSet.add(name);
        symbols.push({ name, type: "component" });
      } else {
        functionsSet.add(name);
        symbols.push({ name, type: "function" });
      }
    }

    // 4. Extract Database Table References
    const dbRegex = /\.from\(['"]([A-Za-z0-9_]+)['"]\)/g;
    while ((match = dbRegex.exec(content)) !== null) {
      dbReferencesSet.add(match[1]);
    }
  } else if (ext === ".sql") {
    const tableRegex =
      /(?:CREATE TABLE|ALTER TABLE|UPDATE|FROM|INTO)\s+(?:IF NOT EXISTS\s+)?(?:public\.)?([A-Za-z0-9_]+)/gi;
    let match: RegExpExecArray | null;
    while ((match = tableRegex.exec(content)) !== null) {
      dbReferencesSet.add(match[1]);
      exportsSet.add(match[1]);
    }
  }

  const summary = `File contains ${lines.length} lines, ${importsSet.size} imports, ${exportsSet.size} exports, and references ${dbReferencesSet.size} database entities.`;

  return {
    imports: Array.from(importsSet),
    exports: Array.from(exportsSet),
    functions: Array.from(functionsSet),
    components: Array.from(componentsSet),
    dbReferences: Array.from(dbReferencesSet),
    symbols,
    summary,
  };
}

/**
 * Indexes a project file and upserts intelligence records into Supabase DB table ai_project_files.
 */
export async function indexProjectFileRecord(options: {
  db: any;
  tenantId: string;
  sessionId?: string;
  filePath: string;
  content: string;
}): Promise<{ success: boolean; hash: string; analysis: SymbolAnalysisResult; error?: string }> {
  try {
    const { db, tenantId, sessionId, filePath, content } = options;
    const sanitizedPath = filePath.replace(/\\/g, "/");
    const fileName = path.basename(sanitizedPath);
    const fileType = path.extname(sanitizedPath).replace(".", "") || "unknown";

    const hash = computeSHA256Hash(content);
    const analysis = parseASTSymbols(content, sanitizedPath);

    if (db) {
      // Upsert record into ai_project_files
      const { error } = await db.from("ai_project_files").upsert(
        {
          tenant_id: tenantId,
          session_id: sessionId || null,
          file_path: sanitizedPath,
          file_name: fileName,
          file_type: fileType,
          content_hash: hash,
          content_summary: analysis.summary,
          dependencies: analysis.imports,
          exports: analysis.exports,
          imports: analysis.imports,
          symbols: analysis.symbols,
          metadata: {
            functions: analysis.functions,
            components: analysis.components,
            dbReferences: analysis.dbReferences,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,file_path" },
      );

      if (error) {
        console.warn("[PROJECT_INDEXER_UPSERT_WARN]", error.message);
      }
    }

    return { success: true, hash, analysis };
  } catch (err: any) {
    return {
      success: false,
      hash: "",
      analysis: {
        imports: [],
        exports: [],
        functions: [],
        components: [],
        dbReferences: [],
        symbols: [],
        summary: "Error parsing AST",
      },
      error: err?.message || "Failed to index project file",
    };
  }
}
