import React, { useState } from "react";
import { ChevronDown, ChevronUp, History, FolderTree, Layers, FileCode } from "lucide-react";
import { FileExplorer, FileItem } from "@/components/ai-agent/file-explorer";

interface GleamAccordionSidebarProps {
  sessions: any[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  activeFilePath?: string;
  onSelectFile?: (file: FileItem) => void;
  pendingTask?: any;
}

export function GleamAccordionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  activeFilePath,
  onSelectFile,
  pendingTask,
}: GleamAccordionSidebarProps) {
  const [activeTab, setActiveTab] = useState<"explorer" | "sessions" | "context">("explorer");

  return (
    <div
      className="w-full flex flex-col h-full bg-[#121215]/95 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl font-sans"
      dir="rtl"
    >
      {/* Sidebar Header Tabs */}
      <div className="flex items-center border-b border-zinc-800/80 bg-[#18181c] p-1.5 gap-1 text-[11px] font-bold text-zinc-400">
        <button
          type="button"
          onClick={() => setActiveTab("explorer")}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === "explorer"
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm font-black"
              : "hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
        >
          <FolderTree className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>الملفات</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === "sessions"
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm font-black"
              : "hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
        >
          <History className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span>الجلسات ({sessions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("context")}
          className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
            activeTab === "context"
              ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm font-black"
              : "hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <span>السياق</span>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        {activeTab === "explorer" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 px-1 pb-1 border-b border-zinc-800/60">
              <span className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-violet-400" />
                شجرة ملفات المشروع
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Workspace</span>
            </div>
            <div className="rounded-xl border border-zinc-800/60 bg-[#0a0a0c] p-2">
              <FileExplorer activeFilePath={activeFilePath} onSelectFile={onSelectFile} />
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 px-1 pb-1 border-b border-zinc-800/60">
              <span>تاريخ الجلسات السابقة</span>
              <span className="text-[10px] text-violet-400 font-bold">{sessions.length} نشطة</span>
            </div>
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-[11px]">
                لا توجد جلسات مسجلة حالياً
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {sessions.map((sess: any) => (
                  <button
                    key={sess.id}
                    type="button"
                    onClick={() => onSelectSession(sess.id)}
                    className={`w-full text-right p-2.5 rounded-xl text-xs transition border ${
                      activeSessionId === sess.id
                        ? "bg-violet-600/30 border-violet-500/50 text-white font-bold shadow-md shadow-violet-500/10"
                        : "bg-[#16161a] hover:bg-zinc-800/80 text-zinc-300 border-zinc-800/80"
                    }`}
                  >
                    <div className="truncate text-[11px] font-medium">{sess.title}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center justify-between">
                      <span className="font-mono">{sess.id.slice(0, 8)}</span>
                      <span>
                        {sess.createdAt ? new Date(sess.createdAt).toLocaleDateString("ar-SA") : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "context" && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">المهمة النشطة</span>
                <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-mono text-[10px] font-bold border border-violet-500/30">
                  {pendingTask?.taskId || "TASK-027"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                تحسين واستعادة نظام التطوير الذاتي والتفاعل البرمجي المباشر
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> متكامل
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
