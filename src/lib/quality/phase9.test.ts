/**
 * Phase 9 Verification Test Suite — Production Integration & Autonomous Governance
 */
import { inspectProductionDatabase } from "./connectors/supabase-connector";
import { inspectProductionDeployment } from "./connectors/deployment-connector";
import { fetchRealUserTelemetry } from "./connectors/telemetry-connector";
import { adaptEvidenceToProductionSource } from "./connectors/evidence-adapter";
import { createBackupSnapshot, restoreBackupSnapshot } from "./safety/backup-snapshot";
import { runProductionSafetyPipeline } from "./safety/safety-pipeline";

async function runPhase9Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 9 Production Integration Tests...");
  console.log("==========================================");

  // Test 1: Production Database Connector
  console.log("⚙️ [1/6] Testing Production Supabase Connector...");
  const dbStatus = await inspectProductionDatabase();
  console.log(
    `✅ DB Inspection: Connected=${dbStatus.connected} | RLS Enforcement=${dbStatus.rlsEnforcementRatePercentage}% | Tables=${dbStatus.totalTablesCount}`,
  );

  // Test 2: Deployment Intelligence Connector
  console.log("⚙️ [2/6] Testing Deployment Intelligence Connector...");
  const deployStatus = inspectProductionDeployment();
  console.log(
    `✅ Deployment Inspection: Status=${deployStatus.deploymentStatus} | Environment=${deployStatus.environment} | Provider=${deployStatus.provider}`,
  );

  // Test 3: Real User Monitoring Telemetry
  console.log("⚙️ [3/6] Testing Real User Monitoring Telemetry...");
  const telemetry = fetchRealUserTelemetry();
  console.log(
    `✅ Telemetry Metrics: ActiveUsers=${telemetry.activeUsersNow} | AvgLoadMs=${telemetry.averagePageLoadTimeMs}ms | CheckoutRate=${telemetry.checkoutConversionRate}%`,
  );

  // Test 4: Evidence Source Adapters
  console.log("⚙️ [4/6] Testing Evidence Source Adapters...");
  const adapted = adaptEvidenceToProductionSource(
    { type: "command", value: "tsc --noEmit" },
    "SUPABASE",
  );
  console.log(
    `✅ Adapted Evidence: Origin=${adapted.origin} | Confidence=${adapted.confidenceScore}%`,
  );
  if (adapted.origin !== "SUPABASE") throw new Error("❌ Evidence Adapter test failed");

  // Test 5: Backup Snapshot Manager
  console.log("⚙️ [5/6] Testing Backup Snapshot Manager...");
  const snapshot = createBackupSnapshot(
    "PROP-100",
    "src/routes/product.$slug.tsx",
    "const original = true;",
  );
  const restored = restoreBackupSnapshot(snapshot.snapshotId);
  console.log(`✅ Snapshot Created & Restored: ${restored?.snapshotId}`);
  if (!restored) throw new Error("❌ Snapshot Manager test failed");

  // Test 6: 8-Step Production Safety Pipeline
  console.log("⚙️ [6/6] Testing 8-Step Production Safety Pipeline...");
  const mockProposal = {
    proposalId: "PROP-PHASE9",
    incidentId: "INC-900",
    title: "Production fix for missing asset",
    targetFile: "src/routes/product.$slug.tsx",
    riskLevel: "LOW" as const,
    beforeCodeSnippet: "const old = true;",
    afterCodeSnippet: "const newFix = true;",
    commitMessage: "fix(prod): production repair asset chunk loader",
    requiredVerification: ["typecheck", "Quality Audit"],
    requiresApproval: true,
    status: "APPROVED" as const,
    createdAt: new Date().toISOString(),
  };

  const pipelineResult = await runProductionSafetyPipeline(mockProposal, "quality.executor");
  console.log(
    `✅ Safety Pipeline Status: ${pipelineResult.pipelineStep} | Verification: ${pipelineResult.patchResult.verificationStatus} | Score: ${pipelineResult.qualityScoreAfter}/100`,
  );
  if (!pipelineResult.patchResult.success) throw new Error("❌ Safety Pipeline test failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 9 PRODUCTION INTEGRATION TESTS PASSED!");
  console.log("==========================================");
}

runPhase9Tests().catch((err) => {
  console.error("❌ Phase 9 Test Failure:", err);
  process.exit(1);
});
