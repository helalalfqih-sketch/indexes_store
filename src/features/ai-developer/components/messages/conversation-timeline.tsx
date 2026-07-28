/**
 * ConversationTimeline — Virtualized message list with scroll anchor
 *
 * Renders the full conversation: user turns + assistant turns (with blocks).
 * Uses requestAnimationFrame for scroll to prevent jank.
 */
import React, { useEffect, useRef, useCallback } from "react";
import { User, Bot, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageBlockRenderer } from "./message-block-renderer";
import type { MessageBlock } from "../../types/messages";
import type { AgentMessage } from "@/lib/ai-agent.functions";

// ─── Markdown renderer for plain stored messages ───────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function StoredMarkdown({ content }: { content: string }) {
  const html = content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang || "code";
      return `<div class="my-3 rounded-2xl border border-zinc-800 bg-[#09090b] overflow-hidden" dir="ltr"><div class="px-3 py-1 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-violet-400 font-bold uppercase">${language}</div><pre class="p-4 overflow-x-auto font-mono text-xs text-zinc-100 leading-relaxed"><code>${escapeHtml(code.trim())}</code></pre></div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-800 text-violet-300 font-mono text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-zinc-100">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black text-zinc-100 mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-black text-zinc-100 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-black text-zinc-100 mt-6 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ms-4 list-disc text-zinc-300 my-0.5">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ms-4 list-decimal text-zinc-300 my-0.5">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2 leading-relaxed text-zinc-200">')
    .replace(/\n/g, "<br/>");
  return (
    <div
      className="text-zinc-200 leading-relaxed text-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }}
    />
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ConversationTimelineProps {
  messages: AgentMessage[];
  streamingBlocks?: MessageBlock[];
  streamingText?: string;
  isStreaming?: boolean;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string) => void;
  onRetry?: () => void;
  isExecuting?: boolean;
  quickSuggestions?: string[];
  onSuggestionClick?: (text: string) => void;
}

export const ConversationTimeline = React.memo(function ConversationTimeline({
  messages,
  streamingBlocks = [],
  streamingText = "",
  isStreaming = false,
  onApprove,
  onReject,
  onRetry,
  isExecuting,
  quickSuggestions = [],
  onSuggestionClick,
}: ConversationTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Use requestAnimationFrame for scroll to avoid layout thrash
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingBlocks, streamingText, scrollToBottom]);

  const hasContent = messages.length > 0 || isStreaming;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
      {/* Empty State */}
      {!hasContent && (
        <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-5">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-600/20 via-indigo-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center shadow-2xl">
            <Bot className="h-10 w-10 text-violet-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-zinc-100">NOQTA AI Developer</h3>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              مرحباً. اكتب أي طلب برمجي أو خطة تحسين وسأبدأ الفحص والتنفيذ فوراً.
            </p>
          </div>

          {quickSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSuggestionClick?.(sug)}
                  className="px-3 py-1.5 rounded-xl bg-[#141418] hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/40 text-xs text-zinc-300 transition text-right"
                >
                  💡 {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message List */}
      <AnimatePresence mode="popLayout">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-[#18181c] border border-zinc-800 text-violet-400"
              }`}
            >
              {msg.role === "user"
                ? <User className="w-4 h-4" />
                : <Bot className="w-4 h-4" />
              }
            </div>

            {/* Bubble */}
            <div
              className={`space-y-1.5 max-w-[85%] rounded-2xl p-3.5 border ${
                msg.role === "user"
                  ? "bg-violet-950/30 border-violet-800/40 text-zinc-100"
                  : "bg-[#141417] border-zinc-800/80 text-zinc-200 shadow-xl"
              }`}
            >
              <StoredMarkdown content={msg.content} />
            </div>
          </motion.div>
        ))}

        {/* Live streaming blocks */}
        {isStreaming && (streamingBlocks.length > 0 || streamingText) && (
          <motion.div
            key="streaming-turn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-[#18181c] border border-violet-500/40 text-violet-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-[85%] rounded-2xl p-3.5 border bg-[#141417] border-violet-500/20 text-zinc-200 shadow-xl flex-1">
              {/* Structured blocks */}
              {streamingBlocks.map((block) => (
                <MessageBlockRenderer
                  key={block.id}
                  block={block}
                  onApprove={onApprove}
                  onReject={onReject}
                  onRetry={onRetry}
                  isExecuting={isExecuting}
                />
              ))}

              {/* Streaming text token display */}
              {streamingText && (
                <div className="text-sm text-zinc-200 leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-1.5 h-4 bg-violet-400 rounded-sm ms-0.5 animate-pulse" />
                </div>
              )}

              {/* Thinking indicator when no blocks/text yet */}
              {!streamingText && streamingBlocks.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  <span>جاري التفكير...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
});
