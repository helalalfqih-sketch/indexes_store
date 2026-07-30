/**
 * AI Developer — Event Types
 *
 * Defines the durable run/event architecture for the Agent workspace.
 * Maps to: agent_runs, agent_events tables in Supabase.
 */

// ─── Run ──────────────────────────────────────────────────────────────────────

export type RunStatus =
  | "queued"
  | "running"
  | "waiting_approval"
  | "success"
  | "failed"
  | "cancelled";

export interface AgentRun {
  id: string;
  session_id: string;
  tenant_id: string;
  user_id: string;
  status: RunStatus;
  prompt: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventType =
  | "run_started"
  | "repository_analysis"
  | "file_read"
  | "code_search"
  | "db_inspect"
  | "tool_call"
  | "plan_generated"
  | "approval_requested"
  | "approval_granted"
  | "file_change"
  | "typecheck"
  | "build"
  | "test"
  | "checkpoint_created"
  | "deployment"
  | "run_completed"
  | "run_failed"
  | "run_cancelled"
  | "status_update"
  | "text_token";

export type EventState =
  | "queued"
  | "running"
  | "waiting_approval"
  | "success"
  | "failed"
  | "cancelled";

export interface AgentEvent {
  id: string;
  run_id: string;
  sequence: number;
  event_type: EventType;
  state: EventState;
  title: string;
  payload: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
}

// ─── Step Labels (for clean activity display) ──────────────────────────────────

export const EVENT_STEP_LABELS: Partial<Record<EventType, string>> = {
  run_started: "بدء التشغيل",
  repository_analysis: "تحليل المستودع",
  file_read: "قراءة الملفات",
  code_search: "البحث في الكود",
  db_inspect: "فحص قاعدة البيانات",
  tool_call: "استدعاء الأداة",
  plan_generated: "إنشاء الخطة",
  approval_requested: "انتظار الموافقة",
  approval_granted: "تمت الموافقة",
  file_change: "تطبيق التعديلات",
  typecheck: "فحص الأنواع",
  build: "بناء التطبيق",
  test: "تشغيل الاختبارات",
  checkpoint_created: "إنشاء نقطة استرداد",
  deployment: "نشر التطبيق",
  run_completed: "اكتمل التنفيذ",
  run_failed: "فشل التنفيذ",
  run_cancelled: "تم الإلغاء",
};
