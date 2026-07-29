/**
 * Phase 1 Verification Test Suite — Quality Engine Core
 */
import { AuditRegistry } from "./registry";
import { runQualityAudit } from "./engine";
import { QualityAudit, AuditResult } from "./types";

async function runPhase1Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 1 Quality Engine Tests...");
  console.log("==========================================");

  const registry = AuditRegistry.getInstance();
  registry.clear();

  // Test 1: Auditor Registration & Retrieval
  const mockSuccessAuditor: QualityAudit = {
    id: "test-success-audit",
    name: "Test Success Audit",
    version: "1.0.0",
    category: "FAST",
    timeoutMs: 5000,
    supportsParallel: true,
    environments: ["local", "ci"],
    async run(): Promise<AuditResult> {
      return {
        auditId: "test-success-audit",
        name: "Test Success Audit",
        status: "PASS",
        executionState: "COMPLETED",
        score: 100,
        category: "FAST",
        source: "runtime",
        metrics: { passed: true },
        measuredAt: new Date().toISOString(),
        durationMs: 10,
      };
    },
  };

  // Test 2: Fault Isolation Auditor (Throws error)
  const mockFailingAuditor: QualityAudit = {
    id: "test-failing-audit",
    name: "Test Failing Audit",
    version: "1.0.0",
    category: "FAST",
    timeoutMs: 5000,
    supportsParallel: true,
    environments: ["local", "ci"],
    async run(): Promise<AuditResult> {
      throw new Error("Simulated auditor failure for fault isolation test");
    },
  };

  // Test 3: Timeout Auditor
  const mockTimeoutAuditor: QualityAudit = {
    id: "test-timeout-audit",
    name: "Test Timeout Audit",
    version: "1.0.0",
    category: "FAST",
    timeoutMs: 100, // Short 100ms timeout
    supportsParallel: false,
    environments: ["local"],
    async run(): Promise<AuditResult> {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Sleep 500ms > 100ms timeout
      return {
        auditId: "test-timeout-audit",
        name: "Test Timeout Audit",
        status: "PASS",
        executionState: "COMPLETED",
        score: 100,
        category: "FAST",
        source: "runtime",
        metrics: {},
        measuredAt: new Date().toISOString(),
        durationMs: 500,
      };
    },
  };

  // Register auditors
  registry.register(mockSuccessAuditor);
  registry.register(mockFailingAuditor);
  registry.register(mockTimeoutAuditor);

  console.log(
    `✅ [1/5] Registry test passed: ${registry.getAllAuditors().length} auditors registered.`,
  );

  // Test 4: Run Engine & Test Fault Isolation + Timeout
  console.log("⚙️ Running unified quality audit engine...");
  const summary = await runQualityAudit({ environment: "local" });

  console.log(`📊 Executed Audits: ${summary.results.length}`);
  console.log(`⏱ Total Duration: ${summary.totalDurationMs}ms`);

  const successResult = summary.results.find((r) => r.auditId === "test-success-audit");
  const failingResult = summary.results.find((r) => r.auditId === "test-failing-audit");
  const timeoutResult = summary.results.find((r) => r.auditId === "test-timeout-audit");

  if (successResult?.status === "PASS") {
    console.log("✅ [2/5] Success Auditor: PASS (100/100)");
  } else {
    throw new Error("❌ Success Auditor test failed");
  }

  if (
    failingResult?.status === "FAIL" &&
    failingResult.error?.message.includes("Simulated auditor failure")
  ) {
    console.log(
      "✅ [3/5] Fault Isolation verified: Single auditor exception caught safely without crashing engine.",
    );
  } else {
    throw new Error("❌ Fault Isolation test failed");
  }

  if (timeoutResult?.status === "FAIL" && timeoutResult.error?.code === "TIMEOUT") {
    console.log("✅ [4/5] Timeout Enforcement verified: Auditor timed out after 100ms limit.");
  } else {
    throw new Error("❌ Timeout test failed");
  }

  // Test 5: AbortSignal Cancellation Test
  const controller = new AbortController();
  controller.abort();
  const cancelledSummary = await runQualityAudit({
    environment: "local",
    signal: controller.signal,
  });

  if (cancelledSummary.manifest.skippedAudits.length === registry.getAllAuditors().length) {
    console.log(
      "✅ [5/5] AbortController Signal verified: All audits correctly skipped upon cancellation.",
    );
  } else {
    throw new Error("❌ AbortController test failed");
  }

  console.log("==========================================");
  console.log("🎉 ALL PHASE 1 CORE ENGINE TESTS PASSED!");
  console.log("==========================================");
}

runPhase1Tests().catch((err) => {
  console.error("❌ Phase 1 Test Error:", err);
  process.exit(1);
});
