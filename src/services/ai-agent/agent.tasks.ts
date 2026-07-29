/**
 * Agent Task Service — Planning & Approval Engine
 *
 * Manages the full lifecycle of an AI Agent task:
 *   analyzing → planning → waiting_approval → executing → testing → completed/failed
 *
 * Persists to ai_agent_tasks table with Multi-Tenant RLS.
 */

import { getAdminDb } from "@/lib/ai-agent.functions";
import type { AgentPlanStep } from "./agent.events";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export type TaskStatus =
  | "analyzing"
  | "planning"
  | "waiting_approval"
  | "queued"
  | "running"
  | "executing"
  | "testing"
  | "success"
  | "completed"
  | "failed"
  | "rolled_back"
  | "cancelled"
  | "blocked"
  | "permission_error"
  | "validation_error"
  | "build_error"
  | "database_error";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface AgentTask {
  id: string;
  session_id: string;
  tenant_id: string;
  user_id?: string;
  status: TaskStatus;
  plan: AgentPlanStep[];
  affected_files: string[];
  risk_level: RiskLevel;
  user_approved_at?: string;
  user_rejected_at?: string;
  rejection_reason?: string;
  diffs: Record<string, string>;
  build_output?: string;
  build_success?: boolean;
  result: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskMemoryEntry {
  id?: string;
  tenant_id: string;
  task_id?: string;
  problem: string;
  solution: string;
  category:
    | "general"
    | "bug_fix"
    | "performance"
    | "architecture"
    | "security"
    | "ui"
    | "database"
    | "ai_provider";
  commit_hash?: string;
  affected_files?: string[];
  tags?: string[];
}

export interface AgentPlan {
  id?: string;
  sessionId: string;
  tenantId: string;
  objective: string;
  affectedFiles: string[];
  affectedTables: string[];
  implementationSteps: Array<{ step: number; action: string; description: string; file?: string }>;
  risks: Array<{ risk: string; mitigation: string }>;
  validationCommands: string[];
  status:
    | "PLAN_CREATED"
    | "WAITING_APPROVAL"
    | "APPROVED"
    | "EXECUTING"
    | "VALIDATING"
    | "COMPLETED"
    | "FAILED";
  approvedAt?: string;
  createdAt?: string;
}

export async function saveArchitecturalPlan(plan: AgentPlan): Promise<AgentPlan> {
  try {
    const db = await getAdminDb({});
    const payload = {
      session_id: plan.sessionId,
      tenant_id: plan.tenantId || "default",
      objective: plan.objective,
      affected_files: plan.affectedFiles || [],
      affected_tables: plan.affectedTables || [],
      implementation_steps: plan.implementationSteps || [],
      risks: plan.risks || [],
      validation_commands: plan.validationCommands || [],
      status: plan.status || "PLAN_CREATED",
      created_at: new Date().toISOString(),
    };

    const { data } = await (db as any).from("ai_agent_plans").insert(payload).select("*").single();
    if (data) {
      return {
        id: data.id,
        sessionId: data.session_id,
        tenantId: data.tenant_id,
        objective: data.objective,
        affectedFiles: data.affected_files,
        affectedTables: data.affected_tables,
        implementationSteps: data.implementation_steps,
        risks: data.risks,
        validationCommands: data.validation_commands,
        status: data.status,
        createdAt: data.created_at,
      };
    }
  } catch (err) {
    console.warn("[AgentPlan] Save plan notice:", err);
  }
  return plan;
}

// ─────────────────────────────────────────────────
// ID Generator
// ─────────────────────────────────────────────────

let taskCounter = 20; // starts at TASK-020 (TASK-001 to TASK-019 already exist)

export function generateTaskId(): string {
  const id = `TASK-${String(taskCounter).padStart(3, "0")}`;
  taskCounter++;
  return id;
}

// ─────────────────────────────────────────────────
// Create Task
// ─────────────────────────────────────────────────

export async function createAgentTask(params: {
  sessionId: string;
  tenantId: string;
  userId?: string;
  plan: AgentPlanStep[];
  affectedFiles: string[];
  riskLevel?: RiskLevel;
}): Promise<AgentTask> {
  const taskId = generateTaskId();
  const now = new Date().toISOString();

  const task: AgentTask = {
    id: taskId,
    session_id: params.sessionId,
    tenant_id: params.tenantId,
    user_id: params.userId,
    status:
      params.plan?.length > 0 || params.affectedFiles?.length > 0 ? "waiting_approval" : "planning",
    plan: params.plan,
    affected_files: params.affectedFiles,
    risk_level: params.riskLevel ?? "low",
    diffs: {},
    result: {},
    created_at: now,
    updated_at: now,
  };

  try {
    const db = await getAdminDb({});
    const { error } = await (db as any).from("ai_agent_tasks").insert({
      id: task.id,
      session_id: task.session_id,
      tenant_id: task.tenant_id,
      user_id: task.user_id,
      status: task.status,
      plan: task.plan as any,
      affected_files: task.affected_files,
      risk_level: task.risk_level,
      diffs: task.diffs as any,
      result: task.result as any,
      created_at: task.created_at,
      updated_at: task.updated_at,
    });

    if (error) {
      console.warn("[AgentTask] Failed to persist task:", error.message);
    }
  } catch (e) {
    console.warn("[AgentTask] DB error on create:", e);
  }

  return task;
}

// ─────────────────────────────────────────────────
// Update Task Status
// ─────────────────────────────────────────────────

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  extras?: {
    userApprovedAt?: string;
    userRejectedAt?: string;
    rejectionReason?: string;
    buildOutput?: string;
    buildSuccess?: boolean;
    result?: Record<string, unknown>;
    diffs?: Record<string, string>;
  },
): Promise<void> {
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (extras?.userApprovedAt) updatePayload.user_approved_at = extras.userApprovedAt;
  if (extras?.userRejectedAt) updatePayload.user_rejected_at = extras.userRejectedAt;
  if (extras?.rejectionReason) updatePayload.rejection_reason = extras.rejectionReason;
  if (extras?.buildOutput) updatePayload.build_output = extras.buildOutput;
  if (extras?.buildSuccess !== undefined) updatePayload.build_success = extras.buildSuccess;
  if (extras?.result) updatePayload.result = extras.result;
  if (extras?.diffs) updatePayload.diffs = extras.diffs;

  try {
    const db = await getAdminDb({});
    await (db as any).from("ai_agent_tasks").update(updatePayload).eq("id", taskId);
  } catch (e) {
    console.warn("[AgentTask] Failed to update task status:", e);
  }
}

// ─────────────────────────────────────────────────
// Get Task
// ─────────────────────────────────────────────────

export async function getAgentTask(taskId: string): Promise<AgentTask | null> {
  try {
    const db = await getAdminDb({});
    const { data, error } = await (db as any)
      .from("ai_agent_tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (error || !data) return null;
    return data as AgentTask;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────
// Approve / Reject Task
// ─────────────────────────────────────────────────

export async function approveTask(taskId: string): Promise<void> {
  await updateTaskStatus(taskId, "executing", {
    userApprovedAt: new Date().toISOString(),
  });
}

export async function rejectTask(taskId: string, reason?: string): Promise<void> {
  await updateTaskStatus(taskId, "cancelled", {
    userRejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  });
}

// ─────────────────────────────────────────────────
// Long-Term Memory — Save Problem/Solution
// ─────────────────────────────────────────────────

export async function saveTaskMemory(entry: TaskMemoryEntry): Promise<void> {
  try {
    const db = await getAdminDb({});
    await (db as any).from("ai_task_memory").insert({
      tenant_id: entry.tenant_id,
      task_id: entry.task_id,
      problem: entry.problem,
      solution: entry.solution,
      category: entry.category,
      commit_hash: entry.commit_hash,
      affected_files: entry.affected_files ?? [],
      tags: entry.tags ?? [],
    });
    console.log("[TaskMemory] Saved:", entry.problem.slice(0, 60));
  } catch (e) {
    console.warn("[TaskMemory] Failed to save:", e);
  }
}

// ─────────────────────────────────────────────────
// Search Task Memory
// ─────────────────────────────────────────────────

export async function searchTaskMemory(
  tenantId: string,
  query: string,
  limit = 5,
): Promise<TaskMemoryEntry[]> {
  try {
    const db = await getAdminDb({});
    const { data } = await (db as any)
      .from("ai_task_memory")
      .select("*")
      .eq("tenant_id", tenantId)
      .or(`problem.ilike.%${query}%,solution.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data as TaskMemoryEntry[]) ?? [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────
// Format Task Summary (for SSE events)
// ─────────────────────────────────────────────────

export function formatTaskSummary(task: AgentTask): string {
  const riskEmoji = {
    low: "🟢",
    medium: "🟡",
    high: "🟠",
    critical: "🔴",
  }[task.risk_level];

  return [
    `**المهمة:** ${task.id}`,
    `**الحالة:** ${task.status}`,
    `**الخطورة:** ${riskEmoji} ${task.risk_level}`,
    `**الملفات المتأثرة:** ${task.affected_files.length} ملف`,
    `**خطوات التنفيذ:** ${task.plan.length} خطوة`,
  ].join("\n");
}
