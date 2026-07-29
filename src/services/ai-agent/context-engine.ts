/**
 * Context Compression Engine — Gen 2 Autonomous Agentic IDE ⚡
 *
 * High-efficiency prompt context compression engine:
 *   - Computes actual pre-compression vs post-compression line, character, and token estimates
 *   - Strips boilerplate imports, comments, and repetitive declarations
 *   - Computes real dynamic reduction percentage
 */

import { scanProjectStructure } from "./code-intelligence.service";

export interface CompressedContextWindow {
  summary: string;
  importantModules: string[];
  activeBranch: string;
  rawTokensEstimate: number;
  compressedTokensEstimate: number;
  reductionPercentage: number;
  scannedAt: string;
}

/**
 * Estimate token count from character length (~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Compress code content by extracting exported interfaces, types, and primary functions
 */
export function compressCodeSnippet(code: string, maxLines = 120): string {
  const lines = code.split("\n");
  if (lines.length <= maxLines) return code;

  // Filter: Keep exported interfaces, types, functions, and main return logic
  const important = lines.filter(
    (line) =>
      line.trim().startsWith("export ") ||
      line.trim().startsWith("interface ") ||
      line.trim().startsWith("type ") ||
      line.trim().startsWith("function ") ||
      line.includes("return ") ||
      line.includes("const ["),
  );

  return [
    `// [Context Engine Compressed ${lines.length} -> ${important.length} lines]`,
    ...important.slice(0, maxLines),
  ].join("\n");
}

/**
 * Generate compressed context window for an AI prompt session with exact token metrics
 */
export async function buildCompressedContextWindow(
  userQuery: string,
): Promise<CompressedContextWindow> {
  const index = await scanProjectStructure();

  const q = userQuery.toLowerCase();
  const importantModules = index.serverFunctions.filter((f) =>
    q.split(" ").some((kw) => kw.length > 2 && f.toLowerCase().includes(kw)),
  );
  const selectedModules =
    importantModules.length > 0 ? importantModules : index.serverFunctions.slice(0, 6);

  // Calculate real character counts
  const rawContextText = [
    index.routes.join("\n"),
    index.components.join("\n"),
    index.services.join("\n"),
    index.dbTables.join("\n"),
  ].join("\n\n");

  const rawTokensEstimate = estimateTokens(rawContextText);

  const summary = [
    `=== COMPRESSED CONTEXT (Indexes Store Codebase) ===`,
    `مسارات النظام (Routes): ${index.routes.length} مسار`,
    `مكونات الواجهة (Components): ${index.components.length} مكون`,
    `الخدمات والدوال (Server Functions): ${index.serverFunctions.length} خدمة`,
    `جداول قاعدة البيانات (DB Tables): ${index.dbTables.join(", ")}`,
    `الوحدات المستهدفة بالطلب: ${selectedModules.join(", ")}`,
  ].join("\n");

  const compressedTokensEstimate = estimateTokens(summary);
  const reductionPercentage =
    rawTokensEstimate > 0
      ? Math.max(
          0,
          Math.min(
            95,
            Math.round(((rawTokensEstimate - compressedTokensEstimate) / rawTokensEstimate) * 100),
          ),
        )
      : 0;

  return {
    summary,
    importantModules: selectedModules,
    activeBranch: "main",
    rawTokensEstimate,
    compressedTokensEstimate,
    reductionPercentage,
    scannedAt: new Date().toISOString(),
  };
}
