/**
 * Phase 6 Verification Test Suite — Application Observer Core
 */
import { observeRouteHealthTree } from "./observer/route-observer";
import { scanComponentHealth } from "./observer/component-observer";
import { recordInteraction, getInteractionSequenceHistory } from "./observer/interaction-recorder";
import { generateProductHealthSummary } from "./observer/ui-health-engine";
import { assertQualityPermission } from "./security/rbac";

async function runPhase6Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 6 Application Observer Tests...");
  console.log("==========================================");

  // Test 1: Route Observer
  console.log("⚙️ [1/5] Testing Route Observer...");
  const routes = observeRouteHealthTree();
  console.log(
    `✅ Monitored Routes Count: ${routes.length} (Sample: ${routes[0].routePath} - ${routes[0].status})`,
  );
  if (routes.length === 0) throw new Error("❌ Route Observer test failed");

  // Test 2: Component Observer & Design Token Scanner
  console.log("⚙️ [2/5] Testing UI Component & Design Token Scanner...");
  const components = scanComponentHealth();
  console.log(
    `✅ Scanned Components Count: ${components.length} (Sample: ${components[0].componentName} - Score: ${components[0].score}/100)`,
  );
  if (components.length === 0) throw new Error("❌ Component Observer test failed");

  // Test 3: Interaction & Sequence Recorder
  console.log("⚙️ [3/5] Testing Interaction & Sequence Recorder...");
  recordInteraction({
    action: "CLICK",
    targetElement: "SaveProductButton",
    routePath: "/admin/products",
    status: "SUCCESS",
    durationMs: 45,
  });
  const interactions = getInteractionSequenceHistory();
  console.log(`✅ Recorded Interactions Count: ${interactions.length}`);
  if (interactions.length === 0) throw new Error("❌ Interaction Recorder test failed");

  // Test 4: UI & Conversion Health Score Engine
  console.log("⚙️ [4/5] Testing UI & Conversion Health Score Engine...");
  const summary = generateProductHealthSummary();
  console.log(
    `📊 UI Health Score: ${summary.uiHealthScore}/100 | Conversion Health: ${summary.conversionHealthScore}/100`,
  );
  console.log(`🎨 Design Token Compliance: ${summary.tokenCompliancePercentage}%`);
  console.log(`💡 Top Improvement Items: ${summary.topImprovementItems.length}`);
  if (summary.overallScore === 0) throw new Error("❌ Health Score Engine test failed");

  // Test 5: Architect Role Permission Check
  console.log("⚙️ [5/5] Testing Architect Role Permissions...");
  const architectCanModifyArch = assertQualityPermission(
    "quality.architect",
    "canModifyArchitecture",
  );
  const executorCanModifyArch = assertQualityPermission(
    "quality.executor",
    "canModifyArchitecture",
  );
  console.log(
    `✅ Architect Role Verification: architect.canModifyArch=${architectCanModifyArch}, executor.canModifyArch=${executorCanModifyArch}`,
  );
  if (!architectCanModifyArch || executorCanModifyArch)
    throw new Error("❌ Architect role check failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 6 APPLICATION OBSERVER TESTS PASSED!");
  console.log("==========================================");
}

runPhase6Tests().catch((err) => {
  console.error("❌ Phase 6 Test Failure:", err);
  process.exit(1);
});
