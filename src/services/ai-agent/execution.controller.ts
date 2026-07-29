import { executeApprovedTask, getAdminDb } from "@/lib/ai-agent.functions";
import { logExecutionJournal, savePersistentExecutionEvent } from "./journal.service";
import { AgentTaskState } from "./agent.state";

export interface ExecutionControllerOptions {
  taskId: string;
  tenantId: string;
  sessionId: string;
  userId?: string;
  context?: unknown;
}

interface ExecutionResult {
  success?: boolean;
  buildOutput?: string;
  failureDetails?: unknown;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (isRecord(value) && typeof value.message === "string") return value.message;
  return String(value);
}

/**
 * Approval is owned by approveAgentTask. The controller must never synthesize
 * approvals or move a task directly to executing.
 */
export async function approvePlan(): Promise<never> {
  throw new Error("APPROVAL_ENTRYPOINT_DISABLED: use approveAgentTask with authenticated context");
}

export async function verifyProjectStructure(
  options: ExecutionControllerOptions,
): Promise<{ success: boolean; details: Record<string, unknown> }> {
  if (!options.context) {
    return {
      success: false,
      details: { error: "Authenticated execution context is required" },
    };
  }

  const db = await getAdminDb(options.context);
  const checks = await Promise.all([
    db.from("orders").select("id").limit(1),
    db.from("ai_agent_tasks").select("id").limit(1),
    db.from("ai_agent_plans").select("id").limit(1),
  ]);

  const details: Record<string, unknown> = {
    ordersTableExists: !checks[0].error,
    tasksTableExists: !checks[1].error,
    plansTableExists: !checks[2].error,
    errors: checks
      .map((check) => check.error?.message)
      .filter((message): message is string => Boolean(message)),
  };

  const success = !checks[1].error && !checks[2].error;
  await logExecutionJournal(
    {
      taskId: options.taskId,
      tenantId: options.tenantId,
      action: "PROJECT_VERIFICATION",
      tool: "verifyProjectStructure",
      input: { taskId: options.taskId, sessionId: options.sessionId },
      output: { status: success ? "verified" : "failed", details },
      status: success ? "SUCCESS" : "FAILED",
    },
    db,
  );

  return { success, details };
}

export async function startExecution(
  options: ExecutionControllerOptions,
): Promise<{ success: boolean; output?: string; failureDetails?: unknown }> {
  if (!options.context) {
    return {
      success: false,
      output: "Execution blocked: authenticated context is required",
      failureDetails: { errorType: "UNAUTHORIZED" },
    };
  }

  const verification = await verifyProjectStructure(options);
  if (!verification.success) {
    return {
      success: false,
      output: "Execution blocked: project structure verification failed",
      failureDetails: {
        errorType: "VERIFICATION_FAILED",
        details: verification.details,
      },
    };
  }

  const invoke = executeApprovedTask as unknown as (input: {
    data: { taskId: string };
    context: unknown;
  }) => Promise<unknown>;

  try {
    const raw = await invoke({
      data: { taskId: options.taskId },
      context: options.context,
    });

    if (!isRecord(raw)) {
      throw new Error("Execution returned an invalid response");
    }

    const result = raw as ExecutionResult;
    await savePersistentExecutionEvent({
      sessionId: options.sessionId,
      taskId: options.taskId,
      tenantId: options.tenantId,
      eventType: result.success === true ? "COMPLETION" : "ERROR",
      state: result.success === true ? AgentTaskState.COMPLETED : AgentTaskState.FAILED,
      message:
        result.success === true
          ? "Approved execution completed successfully."
          : "Approved execution failed.",
      progress: result.success === true ? 100 : 0,
    });

    return {
      success: result.success === true,
      output: typeof result.buildOutput === "string" ? result.buildOutput : undefined,
      failureDetails: result.failureDetails,
    };
  } catch (error: unknown) {
    const message = errorMessage(error);
    await logExecutionJournal(
      {
        taskId: options.taskId,
        tenantId: options.tenantId,
        action: "EXECUTION_FAILED",
        tool: "startExecution",
        input: { taskId: options.taskId },
        output: { error: message },
        status: "FAILED",
      },
      await getAdminDb(options.context),
    );

    return {
      success: false,
      output: message,
      failureDetails: { errorType: "EXECUTION_FAILED", reason: message },
    };
  }
}
