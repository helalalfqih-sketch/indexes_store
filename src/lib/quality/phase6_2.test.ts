/**
 * Phase 6.2 Verification Test Suite — Product Intelligence & Visual QA Engine
 */
import { analyzeLayoutBounds } from "./visual/layout-analyzer";
import { auditResponsiveBreakpoints } from "./visual/responsive-audit";
import { generateVisualLayoutDiff } from "./visual/visual-diff-engine";
import { detectUXFrustrations } from "./ux/frustration-detector";
import { auditConversionFunnel } from "./ux/conversion-funnel";
import { validateButtonLifecycle } from "./ux/action-validator";
import { generatePriorityQueue } from "./ux/priority-queue";
import { generateEvidenceTimeline } from "./ux/evidence-timeline";

async function runPhase62Tests() {
  console.log("==========================================");
  console.log("🧪 Starting Phase 6.2 Visual QA & UX Intelligence Tests...");
  console.log("==========================================");

  // Test 1: Layout Overlap Analyzer
  console.log("⚙️ [1/7] Testing Layout Overlap Analyzer...");
  const overlaps = analyzeLayoutBounds("/product/$slug", 390);
  console.log(
    `✅ Layout Overlaps Detected: ${overlaps.length} (Sample: ${overlaps[0]?.overlappingElements.join(" vs ")})`,
  );
  if (overlaps.length === 0) throw new Error("❌ Layout Analyzer test failed");

  // Test 2: Responsive Breakpoint Audit
  console.log("⚙️ [2/7] Testing Responsive Breakpoint Auditor...");
  const resp = auditResponsiveBreakpoints("/product/$slug");
  console.log(
    `✅ Responsive Scores: Mobile=${resp.mobileScore}, Tablet=${resp.tabletScore}, Desktop=${resp.desktopScore}`,
  );

  // Test 3: Visual Diff Engine
  console.log("⚙️ [3/7] Testing Visual Layout Diff Engine...");
  const diff = generateVisualLayoutDiff("StickyCTAContainer");
  console.log(`✅ Visual Diff Generated: ${diff.diffId} | Delta: +${diff.scoreImprovementDelta}`);

  // Test 4: UX Frustration Detector
  console.log("⚙️ [4/7] Testing UX Frustration Detector...");
  const frusts = detectUXFrustrations("/product/$slug");
  console.log(
    `✅ Frustration Incidents: ${frusts.length} | Abandonment Rate: ${frusts[0]?.abandonmentRatePercentage}%`,
  );
  if (frusts.length === 0) throw new Error("❌ UX Frustration Detector test failed");

  // Test 5: 7-Point Action & Button Validator
  console.log("⚙️ [5/7] Testing 7-Point Action Validator...");
  const buttonAudit = validateButtonLifecycle("Create Product Button", "/admin/products");
  console.log(
    `✅ Button Lifecycle Score: ${buttonAudit.lifecycleScore}/100 | Loading State: ${buttonAudit.checks.loadingState}`,
  );
  if (buttonAudit.lifecycleScore === 0) throw new Error("❌ Action Validator test failed");

  // Test 6: AI Priority Queue
  console.log("⚙️ [6/7] Testing Priority Queue Engine...");
  const queue = generatePriorityQueue();
  console.log(
    `✅ Priority Queue Items: ${queue.length} | Top Rank: ${queue[0]?.priorityLabel} - "${queue[0]?.title}"`,
  );
  if (queue.length === 0) throw new Error("❌ Priority Queue test failed");

  // Test 7: Timestamped Evidence Timeline
  console.log("⚙️ [7/7] Testing Timestamped Evidence Timeline...");
  const timeline = generateEvidenceTimeline("INC-001");
  console.log(
    `✅ Evidence Timeline Events: ${timeline.events.length} | Conclusion: "${timeline.conclusion}"`,
  );
  if (timeline.events.length === 0) throw new Error("❌ Evidence Timeline test failed");

  console.log("==========================================");
  console.log("🎉 ALL PHASE 6.2 VISUAL QA & UX TESTS PASSED!");
  console.log("==========================================");
}

runPhase62Tests().catch((err) => {
  console.error("❌ Phase 6.2 Test Failure:", err);
  process.exit(1);
});
