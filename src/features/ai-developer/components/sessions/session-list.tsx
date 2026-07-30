/**
 * SessionList — Renders the list of sessions in the left panel
 */
import React from "react";
import { MessageSquare, Clock, Archive, Trash2 } from "lucide-react";
import type { AgentSession } from "@/lib/ai-agent.functions";

interface SessionListProps {
  sessions: AgentSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onArchiveSession?: (id: string) => void;
  onNewSession?: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  active:          "bg-emerald-400",
  waiting_approval:"bg-amber-400 animate-pulse",
  executing:       "bg-violet-400 animate-ping",
  completed:       "bg-zinc-600",
  failed:          "bg-rose-400",
  archived:        "bg-zinc-700",
};

export const SessionList = React.memo(function SessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onArchiveSession,
}: SessionListProps) {
  const activeSessions = sessions.filter((s) => s.status !== "archived");

  if (activeSessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-600 space-y-2">
        <MessageSquare className="h-8 w-8" />
        <p className="text-xs">لا توجد جلسات بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activeSessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const statusColor = STATUS_COLOR[session.task_status] || STATUS_COLOR[session.status] || "bg-zinc-600";
        const timeLabel = new Date(session.updated_at).toLocaleDateString("ar-SA", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        });

        return (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition ${
              isActive
                ? "bg-violet-600/20 border border-violet-500/40"
                : "hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            {/* Status dot */}
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">{session.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="h-2.5 w-2.5 text-zinc-600" />
                <span className="text-[9px] text-zinc-500">{timeLabel}</span>
                {session.task_id && (
                  <span className="text-[9px] font-mono text-zinc-600 ms-1">#{session.task_id}</span>
                )}
              </div>
            </div>

            {/* Archive button on hover */}
            {onArchiveSession && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition"
                title="أرشفة الجلسة"
              >
                <Archive className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
});
