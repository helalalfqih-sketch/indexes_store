/**
 * Phase 8 Verification Test Suite — AI Engineering Operating System
 */
import { convertIncidentToEngineeringTask } from "./orchestrator/task-orchestrator";
import { transitionTaskState } from "./orchestrator/workflow-engine";
import { requestHumanApproval } from "./orchestrator/approval-manager";
import { logTaskExecutionStep, getTaskExecutionLogs } from "./orchestrator/execution-tracker";
import { analyzeCodeChange } from "./review/change-analyzer";
import { analyzeMigrationSafety } from "./database/migration-analyzer";
import { generateReleaseCertificate } from "./release/release-manager";

async function runPhase8Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 8 AI Engineering Operating System Tests...");
  console.log("==========================================");

  // Test 1: Task Orchestrator
  console.log("⚙️ [1/7] Testing Task Orchestrator...");
  const mockIncident = {
    id: "INC-00192",
    type: "NETWORK_404" as const,
    severity: "HIGH" as const,
    route: "product.$slug",
    message: "product._slug.js missing",
    evidence: "GET /assets/product._slug.js HTTP/1.1 404",
    occurrences: 143,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  };

  const task = convertIncidentToEngineeringTask(mockIncident);
  console.log(
    `✅ Engineering Task Created: ${task.taskId} | Priority: ${task.priority} | Status: ${task.status}`,
  );
  if (!task.taskId) throw new Error("❌ Task Orchestrator test failed");

  // Test 2: Workflow Engine State Machine
  console.log("⚙️ [2/7] Testing Workflow Engine State Machine...");
  const transitioned = transitionTaskState(task, "WAITING_APPROVAL");
  console.log(`✅ Transitioned Task Status: ${transitioned.status}`);
  if (transitioned.status !== "WAITING_APPROVAL") throw new Error("❌ Workflow Engine test failed");

  // Test 3: Approval Manager
  console.log("⚙️ [3/7] Testing Approval Manager...");
  const approval = requestHumanApproval(
    transitioned,
    "quality.executor",
    true,
    "Approved for deployment",
  );
  console.log(
    `✅ Human Approval Decision: ${approval.approved} | Approved By: ${approval.approvedByRole}`,
  );
  if (!approval.approved) throw new Error("❌ Approval Manager test failed");

  // Test 4: Execution Tracker
  console.log("⚙️ [4/7] Testing Execution Tracker...");
  logTaskExecutionStep({
    taskId: task.taskId,
    stepName: "Post-fix verification",
    status: "PASSED",
    durationMs: 120,
  });
  const execLogs = getTaskExecutionLogs(task.taskId);
  console.log(`✅ Task Execution Logs Count: ${execLogs.length}`);
  if (execLogs.length === 0) throw new Error("❌ Execution Tracker test failed");

  // Test 5: AI Code Review Agent
  console.log("⚙️ [5/7] Testing AI Code Review Agent...");
  const review = analyzeCodeChange(
    "src/routes/product.$slug.tsx",
    "const db = await getAdminDb({});",
  );
  console.log(
    `✅ Code Review Result: ${review.reviewSummary} | RLS Check: ${review.securityRLSCheck}`,
  );

  // Test 6: Migration Safety Engine
  console.log("⚙️ [6/7] Testing Migration Safety Engine...");
  const migration = analyzeMigrationSafety(
    "ALTER TABLE public.products ADD COLUMN product_video_url TEXT;",
  );
  console.log(
    `✅ Migration Safety: safeToApply=${migration.safeToApply} | Rollback SQL: "${migration.rollbackSql}"`,
  );
  if (!migration.rollbackSql) throw new Error("❌ Migration Safety Engine test failed");

  // Test 7: AI Release Manager
  console.log("⚙️ [7/7] Testing AI Release Manager...");
  const release = generateReleaseCertificate("v2.4.0");
  console.log(
    `✅ Release Certificate Generated: Version ${release.releaseVersion} | Approved: ${release.approvedForRelease} | Risk: ${release.riskLevel}`,
  );
  if (!release.approvedForRelease) throw new Error("❌ AI Release Manager test failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 8 AI ENGINEERING OPERATING SYSTEM TESTS PASSED!");
  console.log("==========================================");
}

runPhase8Tests().catch((err) => {
  console.error("❌ Phase 8 Test Failure:", err);
  process.exit(1);
});
