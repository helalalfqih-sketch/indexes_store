import { getAdminDb } from "@/lib/ai-agent.functions";

export interface AgentExecutionError {
  message: string;
  stack?: string;
  stdout?: string;
  stderr?: string;
  failed_step?: string;
  tool_name?: string;
}

export interface ExecutionJournalLog {
  id?: string;
  taskId?: string;
  tenantId?: string;
  action: string;
  tool?: string;
  input?: any;
  output?: any;
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt?: string;
}

export async function hasExecutionStartedLog(taskId: string, customDb?: any): Promise<boolean> {
  if (!taskId) return false;
  try {
    const db = customDb || (await getAdminDb({}));
    const { count, error } = await db
      .from("agent_execution_logs")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .eq("action", "EXECUTION_STARTED");

    if (error) {
      console.warn("[ExecutionJournal] hasExecutionStartedLog error:", error);
    }
    return (count || 0) > 0;
  } catch (err) {
    console.warn("[ExecutionJournal] hasExecutionStartedLog exception:", err);
    return false;
  }
}

export async function logExecutionJournal(log: ExecutionJournalLog, customDb?: any): Promise<void> {
  try {
    const db = customDb || (await getAdminDb({}));
    const { error } = await db.from("agent_execution_logs").insert({
      task_id: log.taskId || null,
      tenant_id: log.tenantId || "default",
      action: log.action,
      tool: log.tool || null,
      input: typeof log.input === "object" ? log.input : { detail: log.input },
      output: typeof log.output === "object" ? log.output : { detail: log.output },
      status: log.status,
      created_at: log.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error("[ExecutionJournal] Failed to insert journal entry into Supabase:", error);
    }
  } catch (err) {
    console.error("[ExecutionJournal] Exception during logExecutionJournal:", err);
  }
}

export async function fetchExecutionJournalLogs(
  tenantId: string,
  limit = 50,
  customDb?: any,
): Promise<ExecutionJournalLog[]> {
  try {
    const db = customDb || (await getAdminDb({}));
    let query = db
      .from("agent_execution_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tenantId && tenantId !== "default") {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.eq.default,tenant_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[ExecutionJournal] Failed to fetch journal logs from Supabase:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      tenantId: row.tenant_id,
      action: row.action,
      tool: row.tool,
      input: row.input,
      output: row.output,
      status: row.status as "SUCCESS" | "FAILED" | "PENDING",
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("[ExecutionJournal] Exception during fetchExecutionJournalLogs:", err);
    return [];
  }
}

export interface PersistentExecutionEvent {
  id?: string;
  sessionId: string;
  taskId?: string;
  tenantId: string;
  eventType: "STATE_CHANGE" | "TOOL_CALL" | "PROGRESS" | "ERROR" | "COMPLETION";
  state?: string;
  message: string;
  progress?: number;
  metadata?: any;
  createdAt?: string;
}

export async function savePersistentExecutionEvent(
  event: PersistentExecutionEvent,
  customDb?: any,
): Promise<void> {
  try {
    const db = customDb || (await getAdminDb({}));
    const { error } = await db.from("agent_execution_events").insert({
      session_id: event.sessionId,
      task_id: event.taskId || null,
      tenant_id: event.tenantId || "default",
      event_type: event.eventType,
      state: event.state || null,
      message: event.message,
      progress: event.progress || 0,
      metadata: typeof event.metadata === "object" ? event.metadata : { detail: event.metadata },
      created_at: event.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error("[ExecutionEvents] Failed to insert persistent event into Supabase:", error);
    }
  } catch (err) {
    console.error("[ExecutionEvents] Exception during savePersistentExecutionEvent:", err);
  }
}

export async function listSessionExecutionEvents(
  sessionId: string,
  limit = 100,
  customDb?: any,
): Promise<PersistentExecutionEvent[]> {
  try {
    const db = customDb || (await getAdminDb({}));
    const { data, error } = await db
      .from("agent_execution_events")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error(
        "[ExecutionEvents] Failed to fetch session execution events from Supabase:",
        error,
      );
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      taskId: row.task_id,
      tenantId: row.tenant_id,
      eventType: row.event_type as any,
      state: row.state,
      message: row.message,
      progress: row.progress,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error("[ExecutionEvents] Exception during listSessionExecutionEvents:", err);
    return [];
  }
}
