/**
 * ActiveRunPanel — Shows the current run's steps in clean sequence
 *
 * Replaces the raw journal log with human-readable step labels.
 * Groups events by phase: analysis → planning → execution → build.
 */
import React from "react";
import { CheckCircle, XCircle, Loader2, Clock, Zap } from "lucide-react";
import type { AgentEvent, EventState } from "../../types/events";
import { EVENT_STEP_LABELS } from "../../types/events";

interface ActiveRunPanelProps {
  events: AgentEvent[];
  runStatus?: string;
  isExecuting?: boolean;
}

const STATE_ICON: Record<EventState, any> = {
  queued:           Clock,
  running:          Loader2,
  waiting_approval: Clock,
  success:          CheckCircle,
  failed:           XCircle,
  cancelled:        XCircle,
};

const STATE_COLOR: Record<EventState, string> = {
  queued:           "text-zinc-500",
  running:          "text-violet-400",
  waiting_approval: "text-amber-400",
  success:          "text-emerald-400",
  failed:           "text-rose-400",
  cancelled:        "text-zinc-500",
};

function formatMs(ms: number | null | undefined): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export const ActiveRunPanel = React.memo(function ActiveRunPanel({
  events,
  runStatus,
  isExecuting,
}: ActiveRunPanelProps) {
  if (events.length === 0 && !isExecuting) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-zinc-600 space-y-2">
        <Zap className="h-8 w-8" />
        <p className="text-xs">لا توجد عمليات نشطة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-1.5 border-b border-zinc-800/60 mb-2">
        {isExecuting && <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />}
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
          سجل عمليات الوكيل
        </span>
        {runStatus && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold ms-auto">
            {runStatus}
          </span>
        )}
      </div>

      {/* Event Steps */}
      {events.map((evt) => {
        const stateKey = (evt.state as EventState) || "queued";
        const Icon = STATE_ICON[stateKey] || Clock;
        const color = STATE_COLOR[stateKey] || "text-zinc-500";
        const label = evt.title || (EVENT_STEP_LABELS as Record<string, string>)[evt.event_type] || evt.event_type;

        return (
          <div
            key={evt.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-zinc-800/30 transition"
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${color} ${evt.state === "running" ? "animate-spin" : ""}`}
            />
            <span className={`flex-1 truncate text-[11px] ${color}`}>{label}</span>
            {evt.duration_ms != null && (
              <span className="text-[10px] text-zinc-600 shrink-0">{formatMs(evt.duration_ms)}</span>
            )}
            <span className="text-[9px] text-zinc-700 shrink-0">
              {new Date(evt.created_at).toLocaleTimeString("ar-SA", {
                hour: "2-digit", minute: "2-digit", second: "2-digit",
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
});
