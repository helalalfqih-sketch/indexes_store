/**
 * Agent Events — Unified Event Schema
 *
 * All events emitted by the AI Engineering Agent during a session.
 * Used by the SSE stream (api/ai.agent.ts) and consumed by the frontend UI.
 */

// ─────────────────────────────────────────────────
// Event Types
// ─────────────────────────────────────────────────

export type AgentEventType =
  | "thinking"
  | "reading_file"
  | "searching_code"
  | "listing_files"
  | "inspecting_db"
  | "tool_call"
  | "tool_result"
  | "planning"
  | "plan_ready"
  | "approval_required"
  | "user_approved"
  | "user_rejected"
  | "executing"
  | "diff_preview"
  | "testing"
  | "build_result"
  | "completed"
  | "error"
  | "retry"
  | "status"
  | "whatsapp_sync";

// ─────────────────────────────────────────────────
// Core Event Schema
// ─────────────────────────────────────────────────

export interface AgentEvent {
  type: AgentEventType;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────
// Specialized Event Subtypes
// ─────────────────────────────────────────────────

import { AgentTaskState } from "./agent.state";

export interface AgentStatusEvent extends AgentEvent {
  type: "status";
  status: string;
  label: string;
  state?: AgentTaskState;
  progress?: number;
  taskId?: string;
}

export function makeProgressEvent(
  state: AgentTaskState,
  message: string,
  progress: number,
  taskId?: string,
): AgentStatusEvent {
  return {
    type: "status",
    status: state.toLowerCase(),
    state,
    progress,
    label: message,
    message,
    timestamp: Date.now(),
    taskId,
    metadata: { state, progress, taskId },
  };
}

export interface AgentTextEvent {
  type: "text";
  content: string;
}

export interface AgentErrorEvent extends AgentEvent {
  type: "error";
  error: string;
  detail?: string;
  retryable?: boolean;
}

export interface AgentPlanReadyEvent extends AgentEvent {
  type: "plan_ready";
  plan: AgentPlanStep[];
  affectedFiles: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  taskId: string;
}

export interface AgentApprovalRequiredEvent extends AgentEvent {
  type: "approval_required";
  taskId: string;
  plan: AgentPlanStep[];
  affectedFiles: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface AgentDiffPreviewEvent extends AgentEvent {
  type: "diff_preview";
  filePath: string;
  diff: string; // unified diff format
  stepIndex: number;
}

export interface AgentBuildResultEvent extends AgentEvent {
  type: "build_result";
  success: boolean;
  output: string;
  errors?: string[];
  warnings?: string[];
}

export interface AgentRetryEvent extends AgentEvent {
  type: "retry";
  attempt: number;
  maxAttempts: number;
  modelName: string;
  reason: string;
}

export interface AgentWhatsAppSyncEvent extends AgentEvent {
  type: "whatsapp_sync";
  action:
    | "create_product"
    | "update_product"
    | "update_price"
    | "update_images"
    | "update_video"
    | "update_inventory"
    | "disable_product"
    | "sync_status";
  status: "pending" | "success" | "failed";
  productId?: string;
  metaResponse?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────
// Plan Step Schema
// ─────────────────────────────────────────────────

export type PlanStepAction =
  | "read"
  | "search"
  | "modify"
  | "create"
  | "delete"
  | "run_command"
  | "run_migration"
  | "git_commit"
  | "git_push"
  | "whatsapp_sync";

export interface AgentPlanStep {
  step: number;
  action: PlanStepAction;
  description: string;
  file?: string;
  command?: string;
  requiresApproval: boolean;
}

// ─────────────────────────────────────────────────
// Helpers — Build Events
// ─────────────────────────────────────────────────

export function makeStatusEvent(status: string, label: string): AgentStatusEvent {
  return {
    type: "status",
    status,
    label,
    message: label,
    timestamp: Date.now(),
  };
}

export function makeErrorEvent(error: string, detail?: string, retryable = false): AgentErrorEvent {
  return {
    type: "error",
    error,
    detail,
    retryable,
    message: error,
    timestamp: Date.now(),
  };
}

export function makeToolCallEvent(toolName: string, args: Record<string, unknown>): AgentEvent {
  return {
    type: "tool_call",
    message: `🔧 استدعاء أداة: ${toolName}`,
    timestamp: Date.now(),
    metadata: { toolName, args },
  };
}

export function makeReadFileEvent(filePath: string): AgentEvent {
  return {
    type: "reading_file",
    message: `📂 قراءة: ${filePath}`,
    timestamp: Date.now(),
    metadata: { filePath },
  };
}

export function makeSearchCodeEvent(query: string, pattern?: string): AgentEvent {
  return {
    type: "searching_code",
    message: `🔍 البحث عن: "${query}"${pattern ? ` في ${pattern}` : ""}`,
    timestamp: Date.now(),
    metadata: { query, pattern },
  };
}

export function makeInspectDbEvent(tableName: string): AgentEvent {
  return {
    type: "inspecting_db",
    message: `🗄️ فحص جدول: ${tableName}`,
    timestamp: Date.now(),
    metadata: { tableName },
  };
}

export function makePlanReadyEvent(
  taskId: string,
  plan: AgentPlanStep[],
  affectedFiles: string[],
  riskLevel: "low" | "medium" | "high" | "critical",
): AgentPlanReadyEvent {
  return {
    type: "plan_ready",
    message: `📋 خطة التنفيذ جاهزة (${plan.length} خطوات، ${affectedFiles.length} ملفات)`,
    timestamp: Date.now(),
    taskId,
    plan,
    affectedFiles,
    riskLevel,
  };
}

export function makeApprovalRequiredEvent(
  taskId: string,
  plan: AgentPlanStep[],
  affectedFiles: string[],
  riskLevel: "low" | "medium" | "high" | "critical",
): AgentApprovalRequiredEvent {
  return {
    type: "approval_required",
    message: "⏸ في انتظار موافقتك على التنفيذ...",
    timestamp: Date.now(),
    taskId,
    plan,
    affectedFiles,
    riskLevel,
  };
}

export function makeRetryEvent(
  attempt: number,
  maxAttempts: number,
  modelName: string,
  reason: string,
): AgentRetryEvent {
  return {
    type: "retry",
    message: `🔄 إعادة المحاولة ${attempt}/${maxAttempts} مع النموذج: ${modelName}`,
    timestamp: Date.now(),
    attempt,
    maxAttempts,
    modelName,
    reason,
  };
}
