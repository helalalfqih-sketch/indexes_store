/**
 * PlanCard — Renders a structured engineering plan with approval UI
 */
import React from "react";
import { FileText, AlertTriangle, Check, X, Zap } from "lucide-react";
import { OperationCard } from "./operation-card";
import type { PlanBlock } from "../../types/messages";

const RISK_CONFIG = {
  low:      { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "🟢 منخفض" },
  medium:   { color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",   label: "🟡 متوسط" },
  high:     { color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/30",  label: "🟠 مرتفع" },
  critical: { color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30",    label: "🔴 حرج"   },
};

const ACTION_COLOR = {
  create:   "text-emerald-400",
  modify:   "text-amber-400",
  delete:   "text-rose-400",
  migrate:  "text-violet-400",
  validate: "text-cyan-400",
};

interface PlanCardProps {
  block: PlanBlock;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string) => void;
  isExecuting?: boolean;
}

export const PlanCard = React.memo(function PlanCard({
  block,
  onApprove,
  onReject,
  isExecuting = false,
}: PlanCardProps) {
  const riskCfg = RISK_CONFIG[block.riskLevel] || RISK_CONFIG.low;
  const approved = block.state === "success";
  const rejected = block.state === "failed";

  return (
    <OperationCard
      state={block.state === "waiting_approval" ? "pending" : block.state}
      title="الخطة الهندسية — جاهزة للمراجعة"
      defaultCollapsed={false}
      className="my-2"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3 pt-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-zinc-200">{block.taskId}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskCfg.bg} ${riskCfg.color}`}>
          {riskCfg.label}
        </span>
      </div>

      {/* Step List */}
      <div className="space-y-1.5 mb-3">
        {block.steps.map((step) => (
          <div
            key={step.step}
            className="flex items-start gap-2 text-[11px] bg-zinc-900/50 rounded-xl p-2.5 border border-zinc-800/60"
          >
            <span className="font-mono text-zinc-500 shrink-0 mt-px">{String(step.step).padStart(2, "0")}.</span>
            <div className="min-w-0 flex-1">
              <span className={`font-bold uppercase text-[9px] tracking-wide ${ACTION_COLOR[step.action] || "text-zinc-400"}`}>
                {step.action}
              </span>
              {step.file && (
                <span className="font-mono text-violet-300 text-[10px] ms-1.5 truncate block">{step.file}</span>
              )}
              <p className="text-zinc-300 mt-0.5 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Affected Files */}
      {block.affectedFiles.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-zinc-500 mb-1.5 font-bold uppercase tracking-wide">الملفات المتأثرة</p>
          <div className="flex flex-wrap gap-1.5">
            {block.affectedFiles.map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Approval Actions */}
      {!approved && !rejected && onApprove && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
          <button
            type="button"
            onClick={() => onApprove(block.taskId)}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs transition shadow-lg disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            اعتماد وتنفيذ
          </button>
          {onReject && (
            <button
              type="button"
              onClick={() => onReject(block.taskId)}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Outcome */}
      {approved && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 text-emerald-400 text-xs font-bold">
          <Check className="h-3.5 w-3.5" />
          تمت الموافقة وبدأ التنفيذ
        </div>
      )}
      {rejected && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 text-rose-400 text-xs font-bold">
          <X className="h-3.5 w-3.5" />
          تم رفض الخطة
        </div>
      )}
    </OperationCard>
  );
});
