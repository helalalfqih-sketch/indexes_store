/**
 * Phase 10.5 Verification Test Suite — Autonomous Approval Bridge & Execution Orchestrator Connection
 */
import {
  approveAndExecuteTask,
  evaluateAutoApproveGate,
} from "../../services/ai-agent/approval.controller";

async function runPhase105Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 10.5 Autonomous Approval Bridge Tests...");
  console.log("==========================================");

  // Test 1: Approve and Execute Task Bridge
  console.log("⚙️ [1/3] Testing approveAndExecuteTask Bridge Dispatcher...");
  const dispatchRes = await approveAndExecuteTask(
    "TASK-BRIDGE-900",
    "SESS-BRIDGE-900",
    "human.admin",
  );
  console.log(
    `✅ Dispatch Result: Success=${dispatchRes.success} | State=${dispatchRes.record.state} | Notes="${dispatchRes.record.notes}"`,
  );
  if (!dispatchRes.success || dispatchRes.record.state !== "APPROVED") {
    throw new Error("❌ approveAndExecuteTask bridge test failed");
  }

  // Test 2: Execution Journal Sequential Lifecycle Log Verification
  console.log("⚙️ [2/3] Verifying Sequential Lifecycle Events...");
  console.log(`✅ Verified Lifecycle Events Array: ${JSON.stringify(dispatchRes.lifecycleEvents)}`);
  const expected = ["PLAN_CREATED", "EVIDENCE_READY", "APPROVAL_GRANTED", "EXECUTION_STARTED"];
  const matches = expected.every((ev) => dispatchRes.lifecycleEvents.includes(ev));
  if (!matches) throw new Error("❌ Sequential lifecycle log verification failed");

  // Test 3: Auto-Approval Gate Policy Evaluation
  console.log("⚙️ [3/3] Testing Auto-Approve Gate Policy Evaluation...");
  const gateRes = await evaluateAutoApproveGate(
    "TASK-AUTO-BRIDGE",
    "SESS-AUTO-BRIDGE",
    "AUTO",
    92,
    "LOW",
  );
  console.log(
    `✅ Auto-Approve Gate: AutoApproved=${gateRes.autoApproved} | State=${gateRes.record.state}`,
  );
  if (!gateRes.autoApproved || gateRes.record.state !== "APPROVED") {
    throw new Error("❌ Auto-Approve Gate Policy test failed");
  }

  console.log("==========================================");
  console.log("🎉 ALL PHASE 10.5 AUTONOMOUS APPROVAL BRIDGE TESTS PASSED!");
  console.log("==========================================");
}

runPhase105Tests().catch((err) => {
  console.error("❌ Phase 10.5 Test Failure:", err);
  process.exit(1);
});
