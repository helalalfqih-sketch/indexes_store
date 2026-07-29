import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  Database,
  CheckCircle2,
  Play,
  X,
} from "lucide-react";

export interface ProposalEvidenceMetrics {
  title: string;
  affectedFiles: string[];
  databaseImpact: string;
  requiredTests: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidenceScore: number;
}

interface EvidenceViewerModalProps {
  proposal: ProposalEvidenceMetrics;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function EvidenceViewerModal({
  proposal,
  onApprove,
  onReject,
  onClose,
}: EvidenceViewerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      dir="rtl"
    >
      <div className="w-full max-w-xl rounded-3xl border border-violet-500/30 bg-surface p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-violet-400" />
            <h2 className="text-lg font-black text-foreground">
              معاينة أدلة التغيير الهندسي (AI Proposal Evidence)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <h3 className="font-bold text-foreground text-sm">{proposal.title}</h3>
            <div className="flex items-center gap-3 mt-1.5 font-mono">
              <span className="px-2.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold">
                درجة الثقة: {proposal.confidenceScore}%
              </span>
              <span
                className={`px-2.5 py-0.5 rounded font-bold ${
                  proposal.riskLevel === "LOW"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                مستوى المخاطرة: {proposal.riskLevel}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <FileCode2 className="h-4 w-4 text-violet-400" /> الملفات المتأثرة:
            </div>
            <ul className="space-y-1 text-muted-foreground font-mono text-[11px]">
              {proposal.affectedFiles.map((file, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-violet-400">•</span> {file}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Database className="h-4 w-4 text-emerald-400" /> تأثير قاعدة البيانات:
            </div>
            <p className="text-muted-foreground text-[11px] font-mono">{proposal.databaseImpact}</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-sky-400" /> الاختبارات المطلوبة:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {proposal.requiredTests.map((test, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-300 font-mono"
                >
                  {test}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/80 pt-4">
          <button
            type="button"
            onClick={onReject}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-accent transition"
          >
            رفض المقترح
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition shadow-brand"
          >
            <Play className="h-4 w-4" /> الموافقة وبدء التنفيذ Safe Execution
          </button>
        </div>
      </div>
    </div>
  );
}
