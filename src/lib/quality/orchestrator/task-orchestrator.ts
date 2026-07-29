/**
 * Phase 8.1 — Task Orchestrator
 * Converts runtime incidents and findings into structured Engineering Tasks
 */
import { PersistedRuntimeEvent } from "../runtime/persistence";
import { RepairProposal } from "../ai/patch-planner";

export interface EngineeringTask {
  taskId: string;
  incidentId: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  status: "DETECTED" | "ANALYZED" | "WAITING_APPROVAL" | "EXECUTING" | "VERIFIED" | "COMPLETED";
  targetFile: string;
  affectedFeatures: string[];
  requiredActions: string[];
  repairProposal?: RepairProposal;
  createdAt: string;
}

export function convertIncidentToEngineeringTask(
  event: PersistedRuntimeEvent,
  proposal?: RepairProposal,
): EngineeringTask {
  const taskId = `TASK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const isP0 = event.route?.includes("checkout") || event.severity === "CRITICAL";

  return {
    taskId,
    incidentId: event.id,
    title: `Engineering Task: Fix ${event.type} in ${event.route || "System"}`,
    priority: isP0 ? "P0" : event.severity === "HIGH" ? "P1" : "P2",
    status: proposal ? "WAITING_APPROVAL" : "ANALYZED",
    targetFile: proposal?.targetFile || "src/routes/index.tsx",
    affectedFeatures: ["Product Page", "Storefront Conversion"],
    requiredActions: [
      "Analyze bundle and code context",
      "Review generated patch proposal",
      "Run regression verification tests",
      "Deploy approved fix",
    ],
    repairProposal: proposal,
    createdAt: new Date().toISOString(),
  };
}
