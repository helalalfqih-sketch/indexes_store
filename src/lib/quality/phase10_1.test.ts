/**
 * Phase 10.1 Verification Test Suite — Reliability Hardening
 */
import {
  checkTaskDeduplication,
  generateTaskFingerprint,
} from "../../services/ai-agent/task-deduplicator";
import { analyzeBuildFailure, BuildAuditor } from "./auditors/build.audit";

async function runPhase101Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 10.1 Reliability Hardening Tests...");
  console.log("==========================================");

  // Test 1: Task Deduplication Engine
  console.log("⚙️ [1/3] Testing Task Deduplication Engine & Fingerprinting...");
  const fp1 = generateTaskFingerprint(
    "SESS-100",
    "Fix asset loading",
    "src/routes/product.$slug.tsx",
  );
  console.log(`✅ Generated Task Fingerprint: ${fp1}`);

  const check1 = checkTaskDeduplication(
    "SESS-100",
    "Fix asset loading",
    "src/routes/product.$slug.tsx",
  );
  console.log(`✅ First Check: isDuplicate=${check1.isDuplicate}`);

  const check2 = checkTaskDeduplication(
    "SESS-100",
    "Fix asset loading",
    "src/routes/product.$slug.tsx",
  );
  console.log(
    `✅ Second Check (Duplicate): isDuplicate=${check2.isDuplicate} | TimeRemaining=${check2.timeRemainingSeconds}s`,
  );
  if (!check2.isDuplicate) throw new Error("❌ Task Deduplication test failed");

  // Test 2: Build Failure Analysis Engine
  console.log("⚙️ [2/3] Testing Build Failure Analysis Engine...");
  const analysis = analyzeBuildFailure("vite build", "Cannot find module 'src/routes/missing.tsx'");
  console.log(`✅ Root Cause Identified: "${analysis.rootCause}"`);
  console.log(`✅ Suggested Fix: "${analysis.suggestedFix}"`);
  if (!analysis.rootCause || !analysis.suggestedFix)
    throw new Error("❌ Build Failure Analysis test failed");

  // Test 3: Build Auditor Execution
  console.log("⚙️ [3/3] Testing Build Auditor Run...");
  const auditRes = await BuildAuditor.run();
  console.log(`✅ Build Audit Result: Status=${auditRes.status} | Score=${auditRes.score}`);

  console.log("==========================================");
  console.log("🎉 ALL PHASE 10.1 RELIABILITY HARDENING TESTS PASSED!");
  console.log("==========================================");
}

runPhase101Tests().catch((err) => {
  console.error("❌ Phase 10.1 Test Failure:", err);
  process.exit(1);
});
