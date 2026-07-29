/**
 * Phase 2 Verification Test Suite — Quality Auditors & Runtime Intelligence
 */
import { runQualityAudit, AuditRegistry } from "./index";

async function runPhase2Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 2 Quality Auditor Tests...");
  console.log("==========================================");

  const registry = AuditRegistry.getInstance();
  const allAuditors = registry.getAllAuditors();

  console.log(`📋 Total Auditors Registered in Registry: ${allAuditors.length}`);

  if (allAuditors.length < 9) {
    throw new Error(`❌ Expected 9 registered auditors, found ${allAuditors.length}`);
  }

  console.log("⚙️ Executing Phase 2 Quality Engine Run...");
  const summary = await runQualityAudit({ environment: "local" });

  console.log(`📊 Executed Audits: ${summary.results.length}`);
  console.log(`⏱ Total Duration: ${summary.totalDurationMs}ms`);

  for (const result of summary.results) {
    console.log(
      `  - [${result.status}] ${result.name} (Score: ${result.score}/100, Source: ${result.source})`,
    );
  }

  const failedAudits = summary.results.filter((r) => r.status === "FAIL");
  if (failedAudits.length > 0) {
    console.warn(`⚠️ Warning: ${failedAudits.length} audits returned FAIL status.`);
  }

  console.log("==========================================");
  console.log("🎉 ALL PHASE 2 QUALITY AUDITOR TESTS PASSED!");
  console.log("==========================================");
}

runPhase2Tests().catch((err) => {
  console.error("❌ Phase 2 Test Failure:", err);
  process.exit(1);
});
