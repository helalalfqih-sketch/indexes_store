/**
 * Phase 7 Verification Test Suite — Autonomous Product Engineering Intelligence
 */
import { buildProjectKnowledgeGraph, findImpactedFeatures } from "./intelligence/knowledge-graph";
import { evaluateBusinessImpact } from "./intelligence/business-impact-engine";
import { generateAutomatedTestForIncident } from "./intelligence/ai-test-generator";
import { evaluateDeploymentGate } from "./intelligence/deployment-gate";
import { findMatchingFixPattern } from "./intelligence/learning-engine";

async function runPhase7Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 7 Engineering Intelligence Tests...");
  console.log("==========================================");

  // Test 1: Project Knowledge Graph
  console.log("⚙️ [1/5] Testing Knowledge Graph Engine...");
  const graph = buildProjectKnowledgeGraph();
  const impacted = findImpactedFeatures("src/routes/product.$slug.tsx");
  console.log(
    `✅ Knowledge Graph Nodes: ${graph.length} | Impacted Features: ${impacted.join(", ")}`,
  );
  if (graph.length === 0 || impacted.length === 0)
    throw new Error("❌ Knowledge Graph test failed");

  // Test 2: Business Impact Engine
  console.log("⚙️ [2/5] Testing Business Impact Engine...");
  const impact = evaluateBusinessImpact("INC-99", "/checkout", 342);
  console.log(
    `✅ Priority: ${impact.priorityLevel} | Blocks Revenue: ${impact.blocksRevenue} | Risk: $${impact.estimatedRevenueRiskUSD}`,
  );
  if (impact.priorityLevel !== "P0_CRITICAL") throw new Error("❌ Business Impact test failed");

  // Test 3: AI Automated Test Generator
  console.log("⚙️ [3/5] Testing AI Automated Test Generator...");
  const genTest = generateAutomatedTestForIncident("INC-1024", "src/routes/product.$slug.tsx");
  console.log(`✅ Test Generated: ${genTest.testId} | Target File: ${genTest.targetFile}`);
  if (!genTest.testCode) throw new Error("❌ AI Test Generator test failed");

  // Test 4: Pre-Release Deployment Safety Gate
  console.log("⚙️ [4/5] Testing Pre-Release Deployment Gate...");
  const passGate = evaluateDeploymentGate(98, 0);
  const blockGate = evaluateDeploymentGate(85, 1);
  console.log(
    `✅ Deployment Gate Enforcement: passGate.allowed=${passGate.allowedToDeploy}, blockGate.allowed=${blockGate.allowedToDeploy}`,
  );
  if (!passGate.allowedToDeploy || blockGate.allowedToDeploy)
    throw new Error("❌ Deployment Gate test failed");

  // Test 5: Resolution Pattern Learning Engine
  console.log("⚙️ [5/5] Testing Resolution Pattern Learning Engine...");
  const fixPattern = findMatchingFixPattern("NETWORK_404", "ProductPage");
  console.log(
    `✅ Historical Fix Pattern Found: "${fixPattern?.successfulFixDescription}" (Resolutions: ${fixPattern?.successfulResolutionCount})`,
  );
  if (!fixPattern) throw new Error("❌ Learning Engine test failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 7 ENGINEERING INTELLIGENCE TESTS PASSED!");
  console.log("==========================================");
}

runPhase7Tests().catch((err) => {
  console.error("❌ Phase 7 Test Failure:", err);
  process.exit(1);
});
