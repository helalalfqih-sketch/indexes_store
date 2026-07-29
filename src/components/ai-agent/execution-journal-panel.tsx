import React, { useState } from "react";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  Activity,
  AlertCircle,
} from "lucide-react";

export interface JournalLogItem {
  id?: string;
  action: string;
  tool?: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  createdAt?: string;
  input?: any;
  output?: any;
}

interface ExecutionJournalPanelProps {
  logs: JournalLogItem[];
  persistentEvents?: any[];
}

export function ExecutionJournalPanel({
  logs = [],
  persistentEvents = [],
}: ExecutionJournalPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");

  const filteredLogs = logs.filter((log) => {
    if (filter === "SUCCESS") return log.status === "SUCCESS";
    if (filter === "FAILED") return log.status === "FAILED";
    return true;
  });

  return (
    <div className="w-full bg-[#111114] border border-zinc-800/90 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Panel Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 py-2.5 bg-[#16161b] border-b border-zinc-800/80 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-zinc-200">
            سجل التنفيذ المباشر (Execution Journal Stream)
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">({logs.length} سجلات)</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 bg-[#1a1a20] p-0.5 rounded-lg border border-zinc-800 text-[10px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-2 py-0.5 rounded font-bold transition ${filter === "ALL" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              الكل ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("SUCCESS")}
              className={`px-2 py-0.5 rounded font-bold transition ${filter === "SUCCESS" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              نجاح
            </button>
            <button
              type="button"
              onClick={() => setFilter("FAILED")}
              className={`px-2 py-0.5 rounded font-bold transition ${filter === "FAILED" ? "bg-rose-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              فشل
            </button>
          </div>

          <button type="button" className="text-zinc-400 hover:text-white p-1">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {isOpen && (
        <div className="p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs dir-ltr bg-[#0c0c0e]">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-xs dir-rtl">
              لا توجد سجلات تنفيذ حالياً. ابدأ عملية بناء جديدة لمشاهدة الأحداث حياً.
            </div>
          ) : (
            filteredLogs.map((log, idx) => {
              const isSuccess = log.status === "SUCCESS";
              const isFailed = log.status === "FAILED";
              const isPending = log.status === "PENDING";

              return (
                <div
                  key={log.id || idx}
                  className={`flex items-start justify-between p-2 rounded-xl border text-[11px] transition ${
                    isSuccess
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                      : isFailed
                        ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                        : "bg-amber-950/20 border-amber-500/30 text-amber-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSuccess && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                    {isFailed && <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                    {isPending && (
                      <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />
                    )}

                    <span className="font-bold">{log.action}</span>
                    {log.tool && <span className="text-zinc-400">({log.tool})</span>}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                    {log.output?.status && (
                      <span className="uppercase font-semibold">{String(log.output.status)}</span>
                    )}
                    <span>
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("ar-SA") : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
