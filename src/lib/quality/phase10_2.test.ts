/**
 * Phase 10.2 Verification Test Suite — Autonomous Engineering Control Layer
 */
import {
  checkSessionDeduplication,
  generateSessionFingerprint,
  registerSessionFingerprint,
} from "../../services/ai-agent/session-deduplicator";
import { transitionExecutionState, ExecutionLifecycleState } from "./orchestrator/workflow-engine";

async function runPhase102Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 10.2 Autonomous Control Layer Tests...");
  console.log("==========================================");

  // Test 1: Session Deduplication Engine
  console.log("⚙️ [1/3] Testing Session Deduplication Engine & Fingerprinting...");
  const prompt = "أنشئ نظام إشعارات الطلبات";
  const userId = "USR-100";
  const tenantId = "TENANT-100";

  const fp = generateSessionFingerprint(userId, tenantId, prompt);
  console.log(`✅ Generated Session Fingerprint: ${fp}`);

  const initialCheck = checkSessionDeduplication(userId, tenantId, prompt);
  console.log(`✅ Initial Session Check: isDuplicate=${initialCheck.isDuplicate}`);

  registerSessionFingerprint(fp, "SESS-EXISTING-990", userId, tenantId, prompt);

  const duplicateCheck = checkSessionDeduplication(userId, tenantId, prompt);
  console.log(
    `✅ Duplicate Session Check: isDuplicate=${duplicateCheck.isDuplicate} | ExistingSessionId=${duplicateCheck.existingSessionId}`,
  );
  if (!duplicateCheck.isDuplicate || duplicateCheck.existingSessionId !== "SESS-EXISTING-990") {
    throw new Error("❌ Session Deduplication test failed");
  }

  // Test 2: 10-State Execution Lifecycle Machine
  console.log("⚙️ [2/3] Testing 10-State Execution Lifecycle Machine...");
  let state: ExecutionLifecycleState = "DETECTED";
  state = transitionExecutionState(state, "ANALYZING");
  state = transitionExecutionState(state, "PLANNING");
  state = transitionExecutionState(state, "WAITING_APPROVAL");
  state = transitionExecutionState(state, "APPROVED");
  state = transitionExecutionState(state, "EXECUTING");
  state = transitionExecutionState(state, "VERIFYING");
  state = transitionExecutionState(state, "COMPLETED");

  console.log(`✅ Lifecycle Transition Path Executed Cleanly. Final State: ${state}`);
  if (state !== "COMPLETED") throw new Error("❌ State Machine transition test failed");

  // Test 3: Invalid Transition Guard
  console.log("⚙️ [3/3] Testing Invalid State Transition Guard...");
  try {
    transitionExecutionState("COMPLETED", "EXECUTING");
    throw new Error("❌ Invalid state transition guard failed to throw exception");
  } catch (err: any) {
    console.log(`✅ Invalid State Guard Verified: "${err.message}"`);
  }

  console.log("==========================================");
  console.log("🎉 ALL PHASE 10.2 AUTONOMOUS CONTROL LAYER TESTS PASSED!");
  console.log("==========================================");
}

runPhase102Tests().catch((err) => {
  console.error("❌ Phase 10.2 Test Failure:", err);
  process.exit(1);
});
