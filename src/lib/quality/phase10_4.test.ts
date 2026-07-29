/**
 * Phase 10.4 Verification Test Suite — Approval Controller & Architectural Guard Engine
 */
import {
  evaluateAutoApproveGate,
  processPlanApproval,
} from "../../services/ai-agent/approval.controller";
import { performDeepArchitectureAudit, ArchitectureAuditor } from "./auditors/architecture.audit";
import { generateComponentImpactReport } from "./ai/component-impact";

async function runPhase104Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 10.4 Approval Controller & Architecture Guard Tests...");
  console.log("==========================================");

  // Test 1: Approval Controller & Auto-Approve Gate
  console.log("⚙️ [1/4] Testing Auto-Approve Policy Gate (AUTO Execution Mode)...");
  const autoGateResult = await evaluateAutoApproveGate(
    "TASK-AUTO-100",
    "SESS-100",
    "AUTO",
    95,
    "LOW",
  );
  console.log(
    `✅ Auto-Approve Gate Result: autoApproved=${autoGateResult.autoApproved} | State=${autoGateResult.record.state} | Notes="${autoGateResult.record.notes}"`,
  );
  if (!autoGateResult.autoApproved || autoGateResult.record.state !== "APPROVED") {
    throw new Error("❌ Auto-Approve policy gate test failed");
  }

  // Test 2: Manual Plan Approval Process
  console.log("⚙️ [2/4] Testing Manual Plan Approval Process...");
  const manualApproval = await processPlanApproval(
    "TASK-MANUAL-200",
    "SESS-200",
    true,
    "quality.executor",
    "Approved by engineer",
  );
  console.log(
    `✅ Manual Approval Result: state=${manualApproval.state} | ApprovedBy=${manualApproval.approvedBy}`,
  );
  if (manualApproval.state !== "APPROVED") throw new Error("❌ Manual plan approval test failed");

  // Test 3: Deep Architecture Auditor
  console.log("⚙️ [3/4] Testing Deep Architecture Auditor...");
  const archAudit = performDeepArchitectureAudit();
  console.log(
    `✅ Architecture Audit: OrdersSchema=${archAudit.ordersSchemaStatus} | RLS=${archAudit.rlsPolicyCoveragePercentage}% | DuplicateComponents=${archAudit.uiDuplicateComponentCount}`,
  );
  if (archAudit.ordersSchemaStatus !== "VERIFIED" || archAudit.rlsPolicyCoveragePercentage < 90) {
    throw new Error("❌ Architecture auditor test failed");
  }

  const auditRunRes = await ArchitectureAuditor.run();
  console.log(
    `✅ Architecture Auditor Run Result: Status=${auditRunRes.status} | Score=${auditRunRes.score}`,
  );

  // Test 4: Component Impact Report Generator
  console.log("⚙️ [4/4] Testing UI Component Impact Report Generator...");
  const impactReport = generateComponentImpactReport("TASK-NOTIF-300", "Order Notifications");
  console.log(
    `✅ Component Impact Report: DuplicateRisk=${impactReport.duplicateRisk} | AffectedRoutes=${impactReport.affectedRoutes.length}`,
  );
  if (impactReport.duplicateRisk !== "ZERO")
    throw new Error("❌ Component Impact Report test failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 10.4 APPROVAL CONTROLLER & ARCHITECTURE GUARD TESTS PASSED!");
  console.log("==========================================");
}

runPhase104Tests().catch((err) => {
  console.error("❌ Phase 10.4 Test Failure:", err);
  process.exit(1);
});
