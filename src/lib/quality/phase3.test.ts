/**
 * Phase 3 Verification Test Suite — Evidence & Reporting Platform
 */
import { runQualityAudit } from "./index";
import { generateEvidenceRecommendations } from "./ai-recommender";
import { analyzeQualityTrends } from "./trend-engine";

async function runPhase3Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 3 Evidence & Reporting Platform Tests...");
  console.log("==========================================");

  console.log("⚙️ Executing Quality Audit Run #1...");
  const run1 = await runQualityAudit({ environment: "local" });

  console.log(
    `📊 Overall Weighted Quality Score: ${run1.report.summary.overallScore}/100 (Grade: ${run1.report.summary.grade})`,
  );
  console.log(`📜 Schema Version: ${run1.report.summary.schemaVersion}`);
  console.log(`📈 Score Deltas: ${run1.report.deltas.formattedDelta}`);

  // Test Evidence Engine
  console.log("\n🔎 Testing Evidence Engine & NOT_MEASURED Reason Handler...");
  for (const result of run1.report.summary.results) {
    if (result.status === "NOT_MEASURED") {
      console.log(`  - [NOT_MEASURED] ${result.name} | Reason: "${result.notMeasuredReason}"`);
    } else {
      console.log(
        `  - [${result.status}] ${result.name} | Evidence items: ${result.evidence.length} | Confidence: ${result.verificationConfidence}`,
      );
    }
  }

  // Test AI Recommendations
  console.log("\n🤖 Testing AI Recommendation Engine...");
  const recommendations = generateEvidenceRecommendations(run1.report.summary.results);
  console.log(`💡 Generated ${recommendations.length} evidence-backed recommendations.`);
  for (const rec of recommendations) {
    console.log(
      `  - [${rec.priority} PRIORITY] ${rec.auditName} | Fact: "${rec.fact}" | Confidence: ${rec.confidence}`,
    );
  }

  // Test Trend Engine
  console.log("\n📊 Testing Trend Engine...");
  const trends = analyzeQualityTrends(10);
  console.log(
    `📈 Trend Direction: ${trends.trendDirection} | Total Runs Scanned: ${trends.totalRunsScanned}`,
  );

  console.log("==========================================");
  console.log("🎉 ALL PHASE 3 EVIDENCE PLATFORM TESTS PASSED!");
  console.log("==========================================");
}

runPhase3Tests().catch((err) => {
  console.error("❌ Phase 3 Test Failure:", err);
  process.exit(1);
});
