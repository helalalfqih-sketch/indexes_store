/**
 * Comprehensive Serverless Quality Storage & Production Readiness Test Suite
 */
import {
  saveQualityReports,
  loadLatestReport,
  isProductionEnvironment,
  QualityReportSummary,
} from "./history";
import { saveRuntimeEvents, loadRuntimeEvents } from "./runtime/persistence";
import { generateAutomatedTestForIncident } from "./intelligence/ai-test-generator";
import { analyzeQualityTrends } from "./trend-engine";
import { evaluateProductionReadiness } from "./intelligence/production-readiness-gate";

async function runComprehensiveStorageTests() {
  console.log("==========================================");
  console.log("🧪 Starting Comprehensive Serverless Quality Storage & Gate Tests...");
  console.log("==========================================");

  const mockSummary: QualityReportSummary = {
    schemaVersion: "1.0.0",
    overallScore: 99,
    grade: "A+",
    status: "PASS",
    environment: "production",
    lastVerifiedAt: new Date().toISOString(),
    auditsCount: 9,
    passedCount: 9,
    failedCount: 0,
    warningCount: 0,
    notMeasuredCount: 0,
    results: [],
    manifest: {
      schemaVersion: "1.0.0",
      executionId: "EXEC-PROD-TEST-ZERO-FS",
      environment: "production",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: 120,
      auditsCount: 9,
      passedCount: 9,
      failedCount: 0,
      warningCount: 0,
      notMeasuredCount: 0,
    },
  };

  // Scenario 1: Production Mode (Vercel Serverless Zero-FS-Write Guarantee)
  console.log("⚙️ [1/3] Testing Vercel Production Mode (Zero FS Write Guarantee)...");
  const originalVercel = process.env.VERCEL;
  process.env.VERCEL = "1";

  if (!isProductionEnvironment())
    throw new Error("❌ Environment detection failed for Vercel production");

  // 1a. History Manager (must not throw ENOENT mkdir '/var/task/reports')
  saveQualityReports(mockSummary);
  const prodLoaded = loadLatestReport();
  console.log(
    `✅ Production History Save/Load: OverallScore=${prodLoaded?.overallScore} | Grade=${prodLoaded?.grade}`,
  );
  if (prodLoaded?.overallScore !== 99)
    throw new Error("❌ Production history report save/load failed");

  // 1b. Runtime Persistence (must not throw ENOENT mkdir '/var/task/reports/runtime-events')
  saveRuntimeEvents([
    {
      id: "EVENT-PROD-1",
      type: "NETWORK_404",
      severity: "HIGH",
      message: "404 asset missing",
      evidence: "GET /assets/chunk.js 404",
      occurrences: 1,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    },
  ]);
  const loadedEvents = loadRuntimeEvents();
  console.log(`✅ Production Runtime Event Save/Load: EventsCount=${loadedEvents.length}`);

  // 1c. AI Test Generator (must not throw ENOENT mkdir '/var/task/reports/generated-tests')
  const generatedTest = generateAutomatedTestForIncident(
    "INC-PROD-1",
    "src/routes/product.$slug.tsx",
  );
  console.log(`✅ Production AI Test Generator: GeneratedTestId=${generatedTest.testId}`);

  // 1d. Trend Engine
  const trend = analyzeQualityTrends();
  console.log(`✅ Production Trend Engine: TotalRunsScanned=${trend.totalRunsScanned}`);

  // Scenario 2: Production Readiness Gate Evaluation
  console.log("⚙️ [2/3] Evaluating Production Readiness Gate...");
  const gateReport = evaluateProductionReadiness();
  console.log(
    `✅ Production Readiness Gate: Passed=${gateReport.passed} | Score=${gateReport.score}% | Summary="${gateReport.summary}"`,
  );
  if (!gateReport.passed) throw new Error("❌ Production Readiness Gate failed");

  // Reset environment
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;

  // Scenario 3: Development Storage Mode
  console.log("⚙️ [3/3] Testing Development Local Storage Mode...");
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  saveQualityReports(mockSummary);
  const devLoaded = loadLatestReport();
  console.log(`✅ Development Save & Load: OverallScore=${devLoaded?.overallScore}`);

  process.env.NODE_ENV = originalEnv;

  console.log("==========================================");
  console.log("🎉 ALL SERVERLESS QUALITY STORAGE & GATE TESTS PASSED!");
  console.log("==========================================");
}

runComprehensiveStorageTests().catch((err) => {
  console.error("❌ Comprehensive Storage Test Failure:", err);
  process.exit(1);
});
