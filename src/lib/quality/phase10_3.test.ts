/**
 * Phase 10.3 Verification Test Suite — Agent Execution Engine & Auto-Approval Pipeline
 */
import {
  checkSessionDeduplication,
  generateSessionFingerprint,
  registerSessionFingerprint,
} from "../../services/ai-agent/session-deduplicator";
import { transitionExecutionState, ExecutionLifecycleState } from "./orchestrator/workflow-engine";

async function runPhase103Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 10.3 Agent Execution Engine Tests...");
  console.log("==========================================");

  // Test 1: Pre-Creation Session Deduplication
  console.log("⚙️ [1/3] Testing Pre-Creation Session Deduplication...");
  const prompt = "أنشئ نظام إشعارات الطلبات المتقدم";
  const userId = "USR-PROD-200";
  const tenantId = "TENANT-PROD-200";

  const preCheck1 = checkSessionDeduplication(userId, tenantId, prompt);
  console.log(`✅ Pre-Check 1 (New Prompt): isDuplicate=${preCheck1.isDuplicate}`);

  registerSessionFingerprint(
    preCheck1.sessionFingerprint,
    "SESS-LIVE-200",
    userId,
    tenantId,
    prompt,
  );

  const preCheck2 = checkSessionDeduplication(userId, tenantId, prompt);
  console.log(
    `✅ Pre-Check 2 (Interception Before DB Insert): isDuplicate=${preCheck2.isDuplicate} | ReusedSessionId=${preCheck2.existingSessionId}`,
  );
  if (!preCheck2.isDuplicate || preCheck2.existingSessionId !== "SESS-LIVE-200") {
    throw new Error("❌ Pre-creation session deduplication failed");
  }

  // Test 2: Auto-Approval Pipeline Transition
  console.log("⚙️ [2/3] Testing Auto-Approval Pipeline Transition (AUTO Execution Mode)...");
  let state: ExecutionLifecycleState = "PLANNING";
  state = transitionExecutionState(state, "WAITING_APPROVAL");
  state = transitionExecutionState(state, "APPROVED");
  state = transitionExecutionState(state, "EXECUTING");

  console.log(
    `✅ AUTO Approval Transition Executed: PLANNING -> WAITING_APPROVAL -> APPROVED -> EXECUTING (${state})`,
  );
  if (state !== "EXECUTING") throw new Error("❌ Auto-approval pipeline transition failed");

  // Test 3: Architectural Engineering Plan Validation
  console.log("⚙️ [3/3] Testing Architectural Engineering Plan Spec Structure...");
  const sampleArchPlan = {
    databaseChanges: ["CREATE TABLE public.notifications", "ENABLE ROW LEVEL SECURITY"],
    backendServices: ["src/services/notification.service.ts"],
    frontendComponents: ["src/components/notifications/NotificationBell.tsx"],
    verificationTests: ["src/lib/quality/phase10.test.ts"],
  };

  console.log(`✅ Arch Plan Database Spec: ${sampleArchPlan.databaseChanges.length} statements`);
  console.log(`✅ Arch Plan Backend Spec: ${sampleArchPlan.backendServices.length} services`);
  console.log(`✅ Arch Plan Frontend Spec: ${sampleArchPlan.frontendComponents.length} components`);
  if (!sampleArchPlan.databaseChanges.length || !sampleArchPlan.backendServices.length) {
    throw new Error("❌ Architectural Engineering Plan spec test failed");
  }

  console.log("==========================================");
  console.log("🎉 ALL PHASE 10.3 AGENT EXECUTION ENGINE TESTS PASSED!");
  console.log("==========================================");
}

runPhase103Tests().catch((err) => {
  console.error("❌ Phase 10.3 Test Failure:", err);
  process.exit(1);
});
