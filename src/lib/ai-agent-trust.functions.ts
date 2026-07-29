import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { getAgentDb, resolveAgentRole } from "./ai-agent-db";
import {
  assertExecutableApproval,
  computePlanHash,
  parseExecutionLockResult,
  type JsonValue,
} from "@/services/ai-agent/approval-contract";
import { executeApprovedTask as legacyExecuteApprovedTask } from "./ai-agent.legacy";
import type { AgentRole } from "@/services/ai-agent/agent.permissions";

interface DbError {
  message: string;
  code?: string;
}

interface QueryResult {
  data: unknown;
  error: DbError | null;
}

interface QueryBuilder extends PromiseLike<QueryResult> {
  select(columns?: string): QueryBuilder;
  eq(column: string, value: unknown): QueryBuilder;
  or(filters: string): QueryBuilder;
  in(column: string, values: readonly unknown[]): QueryBuilder;
  update(values: Record<string, unknown>): QueryBuilder;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): QueryBuilder;
  upsert(
    values: Record<string, unknown> | readonly Record<string, unknown>[],
    options?: { onConflict?: string },
  ): QueryBuilder;
  maybeSingle(): PromiseLike<QueryResult>;
}

interface AgentDb {
  from(table: string): QueryBuilder;
  rpc(functionName: string, args: Record<string, unknown>): PromiseLike<QueryResult>;
}

interface TaskRow {
  id: string;
  tenant_id: string;
  session_id: string | null;
  status: string;
  plan: unknown;
  approved_by: string | null;
  approved_at: string | null;
  approved_plan_hash: string | null;
  approved_revision: number | null;
}

interface PlanRow {
  status: string;
  approved_plan_hash: string | null;
  approved_revision: number | null;
  plan_hash: string | null;
  revision: number | null;
}

interface SafeExecutionResult {
  success: boolean;
  buildOutput?: string;
  failureDetails?: JsonValue;
}

const ROLE_RANK: Record<AgentRole, number> = {
  owner: 4,
  admin: 3,
  developer: 2,
  viewer: 1,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toAgentDb(value: unknown): AgentDb {
  return value as AgentDb;
}

function toRow<T>(value: unknown, label: string): T {
  if (!isRecord(value)) throw new Error(`${label} returned an invalid row`);
  return value as T;
}

function toOptionalRow<T>(value: unknown): T | null {
  return isRecord(value) ? (value as T) : null;
}

function toJsonValue(value: unknown): JsonValue {
  if (typeof value === "undefined") return null;
  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return String(value);
  }
}

function sanitizeLegacyResult(value: unknown): SafeExecutionResult {
  if (!isRecord(value)) {
    throw new Error("Legacy execution returned an invalid response");
  }

  const result: SafeExecutionResult = { success: value.success === true };
  if (typeof value.buildOutput === "string") result.buildOutput = value.buildOutput;
  if (typeof value.failureDetails !== "undefined") {
    result.failureDetails = toJsonValue(value.failureDetails);
  }
  return result;
}

async function requireRole(
  context: unknown,
  minimumRole: AgentRole,
): Promise<{
  agentDb: AgentDb;
  tenantId: string;
  userId: string;
  role: AgentRole;
}> {
  if (!isRecord(context) || typeof context.userId !== "string" || !context.userId) {
    throw new Error("401: Unauthorized. Authenticated context is required.");
  }

  const db = await getAgentDb(context);
  const userId = context.userId;
  const tenantId = await resolveTenantId(db, { userId });
  if (!tenantId) throw new Error("CONFIGURATION_ERROR: Tenant could not be resolved.");

  const role = await resolveAgentRole(db, userId, tenantId);
  if ((ROLE_RANK[role] ?? 0) < (ROLE_RANK[minimumRole] ?? 0)) {
    throw new Error(`403: Operation requires '${minimumRole}' role or higher.`);
  }

  return { agentDb: toAgentDb(db), tenantId, userId, role };
}

async function loadTask(agentDb: AgentDb, tenantId: string, taskId: string): Promise<TaskRow> {
  const result = await agentDb
    .from("ai_agent_tasks")
    .select(
      "id, tenant_id, session_id, status, plan, approved_by, approved_at, approved_plan_hash, approved_revision",
    )
    .eq("id", taskId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (result.error) throw new Error(`503: Task query failed: ${result.error.message}`);
  if (!result.data) throw new Error("404: TASK_NOT_FOUND");
  return toRow<TaskRow>(result.data, "Task query");
}

async function loadPlan(
  agentDb: AgentDb,
  tenantId: string,
  sessionId: string | null,
): Promise<PlanRow | null> {
  if (!sessionId) return null;

  const result = await agentDb
    .from("ai_agent_plans")
    .select("status, approved_plan_hash, approved_revision, plan_hash, revision")
    .eq("tenant_id", tenantId)
    .or(`id.eq.${sessionId},session_id.eq.${sessionId}`)
    .maybeSingle();
  if (result.error) throw new Error(`503: Plan query failed: ${result.error.message}`);
  return toOptionalRow<PlanRow>(result.data);
}

export async function verifyApproval(
  dbValue: unknown,
  taskId: string,
  tenantId: string,
  expectedHash?: string,
  expectedRevision?: number,
): Promise<TaskRow> {
  const agentDb = toAgentDb(dbValue);
  const task = await loadTask(agentDb, tenantId, taskId);
  assertExecutableApproval({
    status: task.status,
    approvedBy: task.approved_by,
    approvedAt: task.approved_at,
    approvedPlanHash: task.approved_plan_hash,
    approvedRevision: task.approved_revision,
    plan: task.plan,
  });

  if (expectedHash && task.approved_plan_hash !== expectedHash) {
    throw new Error("PLAN_CHANGED_REAPPROVAL_REQUIRED: expected hash mismatch");
  }
  if (expectedRevision && task.approved_revision !== expectedRevision) {
    throw new Error("PLAN_CHANGED_REAPPROVAL_REQUIRED: expected revision mismatch");
  }
  return task;
}

const approvalInput = z.object({
  taskId: z.string().min(1),
  planHash: z.string().min(32).optional(),
  revision: z.number().int().min(1).optional(),
  comment: z.string().max(2000).optional(),
});

export const approveAgentTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(approvalInput)
  .handler(async ({ data, context }) => {
    const { agentDb, tenantId, userId } = await requireRole(context as unknown, "admin");
    const task = await loadTask(agentDb, tenantId, data.taskId);
    const currentStatus = task.status.toLowerCase();
    if (currentStatus !== "waiting_approval" && currentStatus !== "planning") {
      throw new Error(`409: Task in state '${task.status}' cannot be approved.`);
    }

    const planHash = data.planHash ?? computePlanHash(task.plan);
    const revision = data.revision ?? Math.max(task.approved_revision ?? 0, 0) + 1;
    const approvedAt = new Date().toISOString();

    const taskUpdate = await agentDb
      .from("ai_agent_tasks")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: approvedAt,
        user_approved_at: approvedAt,
        approved_plan_hash: planHash,
        approved_revision: revision,
        approval_comment: data.comment ?? null,
        approval_source: "user_ui",
        updated_at: approvedAt,
      })
      .eq("id", data.taskId)
      .eq("tenant_id", tenantId)
      .in("status", ["planning", "waiting_approval"])
      .select("id")
      .maybeSingle();

    if (taskUpdate.error) {
      throw new Error(`500: Failed to persist task approval: ${taskUpdate.error.message}`);
    }
    if (!taskUpdate.data) throw new Error("409: Task changed while approval was saved.");

    if (task.session_id) {
      const planUpdate = await agentDb.from("ai_agent_plans").upsert(
        {
          id: task.session_id,
          session_id: task.session_id,
          tenant_id: tenantId,
          objective: "Approved AI engineering plan",
          status: "approved",
          approved_by: userId,
          approved_at: approvedAt,
          approved_plan_hash: planHash,
          approved_revision: revision,
          plan_hash: planHash,
          revision,
          updated_at: approvedAt,
        },
        { onConflict: "id" },
      );
      if (planUpdate.error) {
        throw new Error(`500: Failed to synchronize approved plan: ${planUpdate.error.message}`);
      }
    }

    const audit = await agentDb.from("ai_agent_audit_logs").insert({
      tenant_id: tenantId,
      session_id: task.session_id,
      user_id: userId,
      action: "plan_approved",
      details: { taskId: data.taskId, planHash, revision },
    });
    if (audit.error) console.warn(`[AI Agent] approval audit failed: ${audit.error.message}`);

    return {
      ok: true,
      success: true,
      taskId: data.taskId,
      status: "approved",
      planHash,
      revision,
      approvedAt,
      approvedBy: userId,
    };
  });

async function executeApprovedTaskCore(
  taskId: string,
  context: unknown,
): Promise<SafeExecutionResult> {
  const { agentDb, tenantId } = await requireRole(context, "owner");
  const task = await verifyApproval(agentDb, taskId, tenantId);
  const plan = await loadPlan(agentDb, tenantId, task.session_id);

  if (plan) {
    const planHash = plan.approved_plan_hash ?? plan.plan_hash;
    const revision = plan.approved_revision ?? plan.revision;
    if (plan.status.toLowerCase() !== "approved") {
      throw new Error("PLAN_CHANGED_REAPPROVAL_REQUIRED: plan status is not approved");
    }
    if (planHash && planHash !== task.approved_plan_hash) {
      throw new Error("PLAN_CHANGED_REAPPROVAL_REQUIRED: task and plan hashes differ");
    }
    if (revision && revision !== task.approved_revision) {
      throw new Error("PLAN_CHANGED_REAPPROVAL_REQUIRED: task and plan revisions differ");
    }
  }

  const lockResult = await agentDb.rpc("acquire_ai_task_execution_lock", {
    p_task_id: taskId,
    p_tenant_id: tenantId,
    p_expected_hash: task.approved_plan_hash,
    p_expected_revision: task.approved_revision,
  });
  if (lockResult.error) throw new Error(`EXECUTION_LOCK_FAILED: ${lockResult.error.message}`);

  const lock = parseExecutionLockResult(lockResult.data);
  if (!lock.success) {
    throw new Error(`EXECUTION_LOCK_FAILED: ${lock.reason ?? "unknown conflict"}`);
  }

  const invokeLegacy = legacyExecuteApprovedTask as unknown as (input: {
    data: { taskId: string };
    context: unknown;
  }) => Promise<unknown>;

  try {
    const result = sanitizeLegacyResult(await invokeLegacy({ data: { taskId }, context }));
    const finalStatus = result.success ? "completed" : "failed";
    const statusUpdate = await agentDb
      .from("ai_agent_tasks")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("tenant_id", tenantId)
      .eq("status", "executing");
    if (statusUpdate.error) {
      throw new Error(`Failed to persist final execution status: ${statusUpdate.error.message}`);
    }
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await agentDb
      .from("ai_agent_tasks")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("tenant_id", tenantId)
      .eq("status", "executing");
    throw new Error(`AI_EXECUTION_FAILED: ${message}`);
  }
}

export const executeApprovedTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ taskId: z.string().min(1) }))
  .handler(async ({ data, context }) => executeApprovedTaskCore(data.taskId, context as unknown));

export const startExecutionTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ taskId: z.string().min(1), sessionId: z.string().optional() }))
  .handler(async ({ data, context }) => executeApprovedTaskCore(data.taskId, context as unknown));

export const getAgentRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { tenantId, userId, role } = await requireRole(context as unknown, "viewer");
    return { role, tenantId, userId };
  });
