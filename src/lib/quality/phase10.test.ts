/**
 * Phase 10 Verification Test Suite — Enterprise Admin Intelligence Layer
 */
import {
  getNotificationsHandler,
  markNotificationReadHandler,
} from "../../services/notification.service";
import { getAuditLogsHandler } from "../../services/audit.service";
import { getProjectMemory } from "../../lib/ai-agent.functions";

async function runPhase10Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 10 Enterprise Admin Intelligence Tests...");
  console.log("==========================================");

  // Test 1: Notification Service
  console.log("⚙️ [1/4] Testing Notification Service & Hub...");
  const notifications = await getNotificationsHandler();
  console.log(
    `✅ Loaded Notifications Count: ${notifications.length} (Sample: ${notifications[0]?.title})`,
  );
  if (notifications.length === 0) throw new Error("❌ Notification Service test failed");

  // Test 2: Mark Notification Read
  console.log("⚙️ [2/4] Testing Mark Notification Read Handler...");
  const markResult = await markNotificationReadHandler(notifications[0].id);
  console.log(`✅ Mark Read Success: ${markResult.success}`);
  if (!markResult.success) throw new Error("❌ Mark Read test failed");

  // Test 3: Audit & Compliance Activity Logs
  console.log("⚙️ [3/4] Testing Audit Logs Tracker...");
  const auditLogs = await getAuditLogsHandler();
  console.log(
    `✅ Audit Logs Count: ${auditLogs.length} (Sample Action: ${auditLogs[0]?.action} by ${auditLogs[0]?.userEmail})`,
  );
  if (auditLogs.length === 0) throw new Error("❌ Audit Logs test failed");

  // Test 4: AI Memory Manager Query
  console.log("⚙️ [4/4] Testing AI Project Memory Query...");
  const memoryEntries = await getProjectMemory();
  console.log(`✅ AI Project Memories Count: ${memoryEntries.length}`);

  console.log("==========================================");
  console.log("🎉 ALL PHASE 10 ENTERPRISE ADMIN INTELLIGENCE TESTS PASSED!");
  console.log("==========================================");
}

runPhase10Tests().catch((err) => {
  console.error("❌ Phase 10 Test Failure:", err);
  process.exit(1);
});
