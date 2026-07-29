/**
 * Automated Verification Test for Phase 1: AI Builder Foundation
 * Verifies AST Parsing, SHA-256 Hash Computation, Git-like Diff Generation, Patch Rollback Engine.
 */
import { parseASTSymbols, computeSHA256Hash } from "@/services/ai-agent/project-indexer.service";
import { generateGitDiff } from "@/services/ai-agent/patch-engine.service";
import { applyCodePatch, rollbackCodePatch } from "@/services/ai-agent/code-patcher.engine";
import fs from "node:fs/promises";
import path from "node:path";

async function runPhase11Tests() {
  console.log("=========================================");
  console.log("🧪 Starting Phase 11: AI Builder Foundation Tests");
  console.log("=========================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // Test 1: AST Symbol Analysis
  const sampleTSX = `
    import { useState, useEffect } from "react";
    import { db } from "@/lib/supabase";
    
    export interface UserProfile { id: string; name: string; }
    export const DEFAULT_ROLE = "admin";
    
    export function HeaderComponent() {
      const [data, setData] = useState(null);
      useEffect(() => {
        db.from("ai_agent_sessions").select("*");
      }, []);
      return <div>Header</div>;
    }
  `;

  const ast = parseASTSymbols(sampleTSX, "src/components/Header.tsx");
  assert(ast.imports.includes("react"), "AST Parser extracted react import");
  assert(ast.imports.includes("@/lib/supabase"), "AST Parser extracted @/lib/supabase import");
  assert(
    ast.exports.includes("UserProfile") || ast.exports.includes("HeaderComponent"),
    "AST Parser extracted exports",
  );
  assert(ast.components.includes("HeaderComponent"), "AST Parser recognized HeaderComponent");
  assert(
    ast.dbReferences.includes("ai_agent_sessions"),
    "AST Parser recognized db table ai_agent_sessions",
  );

  // Test 2: SHA-256 Hash Computation
  const hash1 = computeSHA256Hash("test content 1");
  const hash2 = computeSHA256Hash("test content 1");
  const hash3 = computeSHA256Hash("test content 2");
  assert(hash1 === hash2 && hash1.length === 64, "SHA-256 hash is consistent and 64 hex chars");
  assert(hash1 !== hash3, "SHA-256 hash differs for different content");

  // Test 3: Git-like Diff Generation
  const beforeCode = "const x = 1;\nconst y = 2;\n";
  const afterCode = "const x = 1;\nconst y = 3;\nconst z = 4;\n";
  const diff = generateGitDiff("src/test.ts", beforeCode, afterCode);
  assert(diff.includes("--- a/src/test.ts"), "Git diff contains --- header");
  assert(diff.includes("+++ b/src/test.ts"), "Git diff contains +++ header");
  assert(diff.includes("-const y = 2;"), "Git diff contains deleted line");
  assert(diff.includes("+const y = 3;"), "Git diff contains added line");

  // Test 4: Safe Code Mutation & Rollback
  const testFilePath = "src/lib/quality/temp_patch_test.txt";
  const absTestPath = path.resolve(process.cwd(), testFilePath);

  await fs.writeFile(absTestPath, "original file content", "utf-8");
  const patchRes = await applyCodePatch({
    targetFile: testFilePath,
    newContent: "modified file content",
  });

  assert(patchRes.success === true, "applyCodePatch successfully mutated test file");
  const writtenContent = await fs.readFile(absTestPath, "utf-8");
  assert(writtenContent === "modified file content", "Disk content updated correctly");

  const rollbackRes = await rollbackCodePatch(patchRes.backupId);
  assert(rollbackRes.success === true, "rollbackCodePatch executed successfully");
  const restoredContent = await fs.readFile(absTestPath, "utf-8");
  assert(
    restoredContent === "original file content",
    "Disk content cleanly restored to original state",
  );

  // Cleanup
  await fs.unlink(absTestPath).catch(() => {});

  console.log("=========================================");
  console.log(
    `📊 Result: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`,
  );
  console.log("=========================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase11Tests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
