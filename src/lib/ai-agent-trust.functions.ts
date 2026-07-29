import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import {
  assertExecutableApproval,
  computePlanHash,
  parseExecutionLockResult,
} from "@/services/ai-agent/approval-contract";
import {
  executeApprovedTask as legacyExecuteApprovedTask,
  type AgentRole,
} from "./ai-agent.legacy";

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
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(value: number): QueryBuilder;
  update(values: Record<string, unknown>): QueryBuilder;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): QueryBuilder;
  upsert(
    values: Record<string, unknown> | readonly Record<string, unknown>[],
    options?: { onConflict?: string },
  ): QueryBuilder;
  maybeSingle(): PromiseLike<QueryResult>;
  single(): PromiseLike<QueryResult>;
}

export interface AgentDb {
  from(table: string): QueryBuilder;
  rpc(functionName: string, args: Record<string, unknown>): PromiseLike<QueryResult>;
}

interface AuthenticatedContext {
  userId: string;
  supabase: unknown;
  claims?: Record<string, unknown>;
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
  id: string;
  session_id: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  approved_plan_hash: string | null;
  approved_revision: number | null;
  plan_hash: string | null;
  revision: number | null;
}

interface LegacyExecutionInput {
  data: { taskId: string };
  context: unknown;
}

interface LegacyExecutionResult {
  success?: boolean;
  buildOutput?: string;
  failureDetails?: unknown;
  [key: string]: unknown;
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

function requireAuthenticatedContext(value: unknown): AuthenticatedContext {
  if (!isRecord(value)) {
    throw new Error("401: Unauthorized. Authentication context is missing.");
  }

  const userId = value.userId;
  const supabase = value.supabase;
  if (typeof userId !== "string" || !userId || !supabase) {
    throw new Error("401: Unauthorized. Authenticated user and database client are required.");
  }

  return {
    userId,
    supabase,
    claims: isRecord(value.claims) ? value.claims : undefined,
  };
}

function toDb(value: unknown): AgentDb {
  return value as AgentDb;
}

function rowFrom<T>(value: unknown, label: string): T {
  if (!isRecord(value)) {
    throw new Error(`${label} returned an invalid row`);
  }
  return value as T;
}

function optionalRowFrom<T>(value: unknown): T | null {
  return isRecord(value) ? (value as T) : null;
}

function rowsFrom(value: unknown): readonly Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

async function resolveTenantForContext(db: AgentDb, userId: string): Promise<string> {
  const tenantId = await resolveTenantId(
    db as unknown as Parameters<typeof resolveTenantId>[0],
    { userId },
  );
  if (!tenantId) {
    throw new Error("CONFIGURATION_ERROR: Tenant could not be resolved.");
  }
  return tenantId;
}

export async function getAdminDb(context?: unknown): Promise<AgentDb> {
  const auth = requireAuthenticatedContext(context);
  return toDb(auth.supabase);
}

export async function getAgentDb(context?: unknown): Promise<AgentDb> {
  return getAdminDb(context);
}

export async function resolveAgentRole(
  db: AgentDb,
  userId: string,
  tenantId: string,
): Promise<AgentRole> {
  if (!userId) throw new Error("401: Unauthorized. User ID is missing.");
  if (!tenantId || tenantId === "default") {
    throw new Error("CONFIGURATION_ERROR: Missing or invalid tenant ID.");
  }

  const roleResult = await db.from("user_roles").select("role").eq("user_id", userId);
  if (roleResult.error) {
    throw new Error(`503: Platform-role verification failed: ${roleResult.error.message}`);
  }
  if (rowsFrom(roleResult.data).some((row) => row.role === "admin")) {
    return "owner";
  }

  const tenantResult = await db
    .from("tenants")
    .select("owner_user_id")
    .eq("id", tenantId)
    .maybeSingle();
  if (tenantResult.error) {
    throw new Error(`503: Tenant ownership verification failed: ${tenantResult.error.message}`);
  }

  const tenant = optionalRowFrom<{ owner_user_id?: unknown }>(tenantResult.data);
  if (!tenant || typeof tenant.owner_user_id !== "string") {
    throw new Error("404: Tenant not found or has no configured owner.");
  }
  if (tenant.owner_user_id === userId) return "owner";

  const memberResult = await db
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (memberResult.error) {
    throw new Error(`503: Tenant membership verification failed: ${memberResult.error.message}`);
  }

  const member = optionalRowFrom<{ role?: unknown }>(memberResult.data);
  if (!member || typeof member.role !== "string") {
    throw new Error("403: Access denied. Active tenant membership is required.");
  }

  switch (member.role) {
    case "owner":
      return "owner";
    case "manager":
      return "admin";
    case "marketing":
    case "employee":
    case "staff":
      return "developer";
    case "viewer":
      return "viewer";
    default:
      throw new Error(`403: Access denied. Unknown tenant role '${member.role}'.`);
  }
}

async function requireMinimumRole(
  context: unknown,
  minimumRole: AgentRole,
): Promise<{ auth: AuthenticatedContext; db: AgentDb; tenantId: string; role: AgentRole }> {
  const auth = requireAuthenticatedContext(context);
  const db = toDb(auth.supabase);
  const tenantId = await resolveTenantForContext(db, auth.userId);
  const role = await resolveAgentRole(db, auth.userId, tenantId);
  if ((ROLE_RANK[role] ?? 0) < (ROLE_RANK[minimumRole] ?? 0)) {
    throw new Error(`403: Operation requires '${minimumRole}' role or higher.`);
  }
  return { auth, db, tenantId, role };
}

async function loadTask(db: AgentDb, tenantId: string, taskId: string): Promise<TaskRow> {
  const result = await db
    .from("ai_agent_tasks")
    .select(
      "id, tenant_id, session_id, status, plan, approved_by, approved_at, approved_plan_hash, approved_revision",
    )
    .eq("id", taskId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`503: Task query failed: ${result.error.message}`);
  }
  if (!result.data) {
    throw new Error("404: TASK_NOT_FOUND");
  }
  return rowFrom<TaskRow>(result.data, "Task query");
}

async function loadPlan(
  db: AgentDb,
  tenantId: string,
  sessionId: string | null,
): Promise<PlanRow | null> {
  if (!sessionId) return null;

  const result = await db
    .from("ai_agent_plans")
    .select(
      "id, session_id, status, approved_by, approved_at, approved_plan_hash, approved_revision, plan_hash, revision",
    )
    .eq("tenant_id", tenantId)
    .or(`id.eq.${sessionId},session_id.eq.${sessionId}`)
    .maybeSingle();

  if (result.error) {
    throw new Error(`503: Plan query failed: ${result.error.message}`);
  }
  return optionalRowFrom<PlanRow>(result.data);
}

export async function verifyApproval(
  dbValue: unknown,
  taskId: string,
  tenantId: string,
  expectedHash?: string,
  expectedRevision?: number,
): Promise<TaskRow> {
  const db = toDb(dbValue);
  const task = await loadTask(db, tenantId, taskId);
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
    const { auth, db, tenantId } = await requireMinimumRole(context, "admin");
    const task = await loadTask(db, tenantId, data.taskId);
    const currentStatus = task.status.toLowerCase();
    if (currentStatus !== "waiting_approval" && currentStatus !== "planning") {
      throw new Error(`409: Task in state '${task.status}' cannot be approved.`);
    }

    const planHash = data.planHash ?? computePlanHash(task.plan);
    const revision = data.revision ?? Math.max(task.approved_revision ?? 0, 0) + 1;
    const approvedAt = new Date().toISOString();

    const updateResult = await db
      .from("ai_agent_tasks")
      .update({
        status: "approved",
        approved_by: auth.userId,
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

    if (updateResult.error) {
      throw new Error(`500: Failed to persist task approval: ${updateResult.error.message}`);
    }
    if (!updateResult.data) {
      throw new Error("409: Task changed while approval was being saved.");
    }

    if (task.session_id) {
      const planResult = await db.from("ai_agent_plans").upsert(
        {
          id: task.session_id,
          session_id: task.session_id,
          tenant_id: tenantId,
          objective: "Approved AI engineering plan",
          status: "approved",
          approved_by: auth.userId,
          approved_at: approvedAt,
          approved_plan_hash: planHash,
          approved_revision: revision,
          plan_hash: planHash,
          revision,
          updated_at: approvedAt,
        },
        { onConflict: "id" },
      );
      if (planResult.error) {
        throw new Error(`500: Failed to synchronize approved plan: ${planResult.error.message}`);
      }
    }

    const auditResult = await db.from("ai_agent_audit_logs").insert({
      tenant_id: tenantId,
      session_id: task.session_id,
      user_id: auth.userId,
      action: "plan_approved",
      details: { taskId: data.taskId, planHash, revision },
    });
    if (auditResult.error) {
      console.warn(`[AI Agent] approval audit log failed: ${auditResult.error.message}`);
    }

    return {
      ok: true,
      success: true,
      taskId: data.taskId,
      status: "approved",
      planHash,
      revision,
      approvedAt,
      approvedBy: auth.userId,
    };
  });

async function executeApprovedTaskCore(
  taskId: string,
  context: unknown,
): Promise<LegacyExecutionResult> {
  const { db, tenantId } = await requireMinimumRole(context, "owner");
  const task = await verifyApproval(db, taskId, tenantId);
  const plan = await loadPlan(db, tenantId, task.session_id);

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

  const lockResult = await db.rpc("acquire_ai_task_execution_lock", {
    p_task_id: taskId,
    p_tenant_id: tenantId,
    p_expected_hash: task.approved_plan_hash,
    p_expected_revision: task.approved_revision,
  });
  if (lockResult.error) {
    throw new Error(`EXECUTION_LOCK_FAILED: ${lockResult.error.message}`);
  }

  const lock = parseExecutionLockResult(lockResult.data);
  if (!lock.success) {
    throw new Error(`EXECUTION_LOCK_FAILED: ${lock.reason ?? "unknown conflict"}`);
  }

  const invokeLegacy = legacyExecuteApprovedTask as unknown as (
    input: LegacyExecutionInput,
  ) => Promise<unknown>;

  try {
    const rawResult = await invokeLegacy({ data: { taskId }, context });
    if (!isRecord(rawResult)) {
      throw new Error("Legacy execution returned an invalid result");
    }

    const result = rawResult as LegacyExecutionResult;
    const finalStatus = result.success === true ? "completed" : "failed";
    const statusResult = await db
      .from("ai_agent_tasks")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("tenant_id", tenantId)
      .eq("status", "executing");
    if (statusResult.error) {
      throw new Error(`Failed to persist final execution status: ${statusResult.error.message}`);
    }

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await db
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
  .handler(async ({ data, context }) => executeApprovedTaskCore(data.taskId, context));

export const startExecutionTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ taskId: z.string().min(1), sessionId: z.string().optional() }))
  .handler(async ({ data, context }) => executeApprovedTaskCore(data.taskId, context));

export const getAgentRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const auth = requireAuthenticatedContext(context);
    const db = toDb(auth.supabase);
    const tenantId = await resolveTenantForContext(db, auth.userId);
    const role = await resolveAgentRole(db, auth.userId, tenantId);
    return { role, tenantId, userId: auth.userId };
  });
