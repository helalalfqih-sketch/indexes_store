/**
 * OperationCard — Base card component for all message block types
 *
 * Shows: state indicator, title, elapsed time, expand/collapse, duration.
 * All specific block components compose from this base.
 */
import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronRight } from "lucide-react";
import type { BlockState } from "../../types/messages";

interface OperationCardProps {
  state: BlockState;
  title: string;
  durationMs?: number;
  startedAt?: string;
  defaultCollapsed?: boolean;
  className?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

const STATE_CONFIG: Record<BlockState, {
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  labelText: string;
}> = {
  pending: {
    icon: Clock,
    color: "text-zinc-400",
    bgColor: "bg-zinc-800/40",
    borderColor: "border-zinc-700/60",
    labelText: "في الانتظار",
  },
  running: {
    icon: Loader2,
    color: "text-violet-400",
    bgColor: "bg-violet-950/20",
    borderColor: "border-violet-700/40",
    labelText: "جاري...",
  },
  success: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-950/20",
    borderColor: "border-emerald-800/40",
    labelText: "نجح",
  },
  failed: {
    icon: XCircle,
    color: "text-rose-400",
    bgColor: "bg-rose-950/20",
    borderColor: "border-rose-800/40",
    labelText: "فشل",
  },
  waiting_approval: {
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-950/20",
    borderColor: "border-amber-800/40",
    labelText: "بانتظار الاعتماد",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export const OperationCard = React.memo(function OperationCard({
  state,
  title,
  durationMs,
  startedAt,
  defaultCollapsed = false,
  className = "",
  children,
  actions,
}: OperationCardProps) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live elapsed timer while running
  useEffect(() => {
    if (state !== "running") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 250);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, startedAt]);

  const hasChildren = React.Children.count(children) > 0;
  const displayDuration = durationMs ?? (state === "running" ? elapsed : 0);

  return (
    <div
      className={`rounded-2xl border ${cfg.bgColor} ${cfg.borderColor} overflow-hidden transition-all duration-150 ${className}`}
    >
      {/* Card Header */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 ${hasChildren ? "cursor-pointer select-none" : ""}`}
        onClick={hasChildren ? () => setCollapsed((prev) => !prev) : undefined}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className={`h-3.5 w-3.5 shrink-0 ${cfg.color} ${state === "running" ? "animate-spin" : ""}`}
          />
          <span className="text-xs font-semibold text-zinc-200 truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Duration */}
          {(displayDuration > 0 || state !== "pending") && (
            <span className="text-[10px] font-mono text-zinc-500">
              {formatDuration(displayDuration)}
            </span>
          )}

          {/* Expand/collapse icon */}
          {hasChildren && (
            collapsed
              ? <ChevronRight className="h-3 w-3 text-zinc-500" />
              : <ChevronDown className="h-3 w-3 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Card Body */}
      {hasChildren && !collapsed && (
        <div className="border-t border-zinc-800/60 px-3 py-2">
          {children}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="border-t border-zinc-800/60 px-3 py-2">
          {actions}
        </div>
      )}
    </div>
  );
});
