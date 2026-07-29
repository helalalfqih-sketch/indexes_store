/**
 * Phase 5 Verification Test Suite — AI Root Cause Analysis & Auto Fix Planner
 */
import { saveRuntimeEvents, loadRuntimeEvents, PersistedRuntimeEvent } from "./runtime/persistence";
import { assertQualityPermission } from "./security/rbac";
import { analyzeCodeContext } from "./ai/code-context-analyzer";
import { generateRootCauseReport } from "./ai/root-cause-engine";
import { generateRepairProposal } from "./ai/patch-planner";
import { executeApprovedPatch } from "./ai/patch-executor";

async function runPhase5Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 5 AI Engineer Platform Tests...");
  console.log("==========================================");

  // Test 1: Persistence & Occurrence Aggregation
  console.log("⚙️ [1/6] Testing Runtime Event Persistence...");
  const mockEvent: PersistedRuntimeEvent = {
    id: "EVT-1024",
    type: "NETWORK_404",
    severity: "HIGH",
    route: "product.$slug",
    component: "ProductPage",
    message: "404 Not Found: /assets/product._slug-BR0ZjJtf.js",
    evidence: "GET /assets/product._slug-BR0ZjJtf.js HTTP/1.1 404",
    occurrences: 37,
    firstSeenAt: new Date(Date.now() - 3600000).toISOString(),
    lastSeenAt: new Date().toISOString(),
    userFlowSession: ["View Product", "Add to Cart", "Asset Error 404"],
  };

  saveRuntimeEvents([mockEvent]);
  const loadedEvents = loadRuntimeEvents();
  console.log(
    `✅ Persisted events loaded: ${loadedEvents.length} (Occurrences: ${loadedEvents[0]?.occurrences})`,
  );
  if (loadedEvents.length === 0) throw new Error("❌ Persistence test failed");

  // Test 2: Security & RBAC Permission Layer
  console.log("⚙️ [2/6] Testing Security RBAC Permission Layer...");
  const viewerCanExecute = assertQualityPermission("quality.viewer", "canExecutePatches");
  const executorCanExecute = assertQualityPermission("quality.executor", "canExecutePatches");
  console.log(
    `✅ RBAC Enforcement: viewer.canExecute=${viewerCanExecute}, executor.canExecute=${executorCanExecute}`,
  );
  if (viewerCanExecute || !executorCanExecute) throw new Error("❌ RBAC permission check failed");

  // Test 3: Code Context Analyzer
  console.log("⚙️ [3/6] Testing Code Context Analyzer...");
  const codeContext = analyzeCodeContext(mockEvent);
  console.log(
    `✅ Mapped to Target File: ${codeContext.targetFile} (Component: ${codeContext.componentName})`,
  );

  // Test 4: Root Cause Engine
  console.log("⚙️ [4/6] Testing Root Cause Engine...");
  const rootCause = generateRootCauseReport(mockEvent, codeContext);
  console.log(`📋 Empirical Fact: "${rootCause.empiricalFact}"`);
  console.log(
    `💡 Potential Cause: "${rootCause.potentialCause}" (Confidence: ${rootCause.confidenceGrade})`,
  );

  // Test 5: Repair Patch Planner
  console.log("⚙️ [5/6] Testing Repair Patch Planner...");
  const proposal = generateRepairProposal(rootCause);
  console.log(`📝 Proposal ID: ${proposal.proposalId}`);
  console.log(`🔍 Before: "${proposal.beforeCodeSnippet}"`);
  console.log(`✨ After: "${proposal.afterCodeSnippet}"`);

  // Test 6: Patch Executor & Approval Gate
  console.log("⚙️ [6/6] Testing Patch Executor & Approval Gate...");
  // Attempt unapproved execution -> should fail safely
  const unapprovedResult = await executeApprovedPatch(proposal, "quality.executor");
  console.log(
    `🔒 Unapproved Execution Blocked: ${!unapprovedResult.success} | Reason: "${unapprovedResult.error}"`,
  );
  if (unapprovedResult.success) throw new Error("❌ Unapproved patch was incorrectly executed!");

  // Approve proposal & execute with executor role
  proposal.status = "APPROVED";
  const approvedResult = await executeApprovedPatch(proposal, "quality.executor");
  console.log(
    `✅ Approved Execution Success: ${approvedResult.success} | Verification: ${approvedResult.verificationStatus} | Post-Patch Quality Score: ${approvedResult.auditScoreAfterPatch}/100`,
  );
  if (!approvedResult.success) throw new Error("❌ Approved patch execution failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 5 AI ENGINEER PLATFORM TESTS PASSED!");
  console.log("==========================================");
}

runPhase5Tests().catch((err) => {
  console.error("❌ Phase 5 Test Failure:", err);
  process.exit(1);
});
