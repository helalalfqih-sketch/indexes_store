/**
 * MessageBlockRenderer — Routes MessageBlock to the correct card component
 */
import React from "react";
import type { MessageBlock } from "../../types/messages";
import { PlanCard } from "./plan-card";
import { ToolCallCard } from "./tool-call-card";
import { BuildResultCard } from "./build-result-card";
import { ErrorCard } from "./error-card";
import { OperationCard } from "./operation-card";

// ─── Markdown Renderer (lightweight) ──────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang || "code";
      return `<div class="my-3 rounded-2xl border border-zinc-800 bg-[#09090b] shadow-2xl overflow-hidden" dir="ltr">
        <div class="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] font-mono text-zinc-400">
          <span class="uppercase font-bold text-violet-400">${language}</span>
        </div>
        <pre class="p-4 overflow-x-auto font-mono text-xs text-zinc-100 leading-relaxed"><code>${escapeHtml(code.trim())}</code></pre>
      </div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-zinc-800 text-violet-300 font-mono text-xs border border-zinc-700/60">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black text-zinc-100">$1</strong>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black text-zinc-100 mt-4 mb-1.5">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-black text-zinc-100 mt-5 mb-2 pb-1 border-b border-zinc-800/80">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-black text-zinc-100 mt-6 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ms-4 list-disc text-zinc-300 my-0.5">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ms-4 list-decimal text-zinc-300 my-0.5">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2 leading-relaxed text-zinc-200">')
    .replace(/\n/g, "<br/>");

  return (
    <div
      className="text-zinc-200 leading-relaxed text-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2 leading-relaxed">${html}</p>` }}
    />
  );
}

// ─── Block Renderer ────────────────────────────────────────────────────────────

interface MessageBlockRendererProps {
  block: MessageBlock;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string) => void;
  onRetry?: () => void;
  isExecuting?: boolean;
}

export const MessageBlockRenderer = React.memo(function MessageBlockRenderer({
  block,
  onApprove,
  onReject,
  onRetry,
  isExecuting,
}: MessageBlockRendererProps) {
  switch (block.type) {
    case "text":
      return (
        <div className="py-1">
          <MarkdownContent content={block.content} />
        </div>
      );

    case "status":
      return (
        <OperationCard
          state={block.state}
          title={block.title}
          className="my-1"
        >
          {block.message && block.message !== block.title ? (
            <p className="text-[11px] text-zinc-400">{block.message}</p>
          ) : null}
        </OperationCard>
      );

    case "plan":
      return (
        <PlanCard
          block={block}
          onApprove={onApprove}
          onReject={onReject}
          isExecuting={isExecuting}
        />
      );

    case "file_read":
    case "code_search":
    case "tool_call":
      return <ToolCallCard block={block} />;

    case "build":
    case "test":
      return <BuildResultCard block={block as any} />;

    case "error":
      return <ErrorCard block={block} onRetry={onRetry} />;

    case "file_change":
      return (
        <OperationCard
          state={block.state}
          title={block.title}
          defaultCollapsed
          className="my-1"
        >
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="text-cyan-400 truncate">{block.filePath}</span>
            {block.linesAdded !== undefined && (
              <span className="text-emerald-400">+{block.linesAdded}</span>
            )}
            {block.linesRemoved !== undefined && (
              <span className="text-rose-400">-{block.linesRemoved}</span>
            )}
          </div>
        </OperationCard>
      );

    case "diff":
      return (
        <OperationCard
          state="success"
          title={`تغييرات: ${block.filePath}`}
          defaultCollapsed
          className="my-1"
        >
          <pre
            className="text-[10px] font-mono leading-relaxed max-h-48 overflow-y-auto custom-scrollbar"
            dir="ltr"
          >
            {block.diff.split("\n").map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith("+") && !line.startsWith("+++")
                    ? "text-emerald-400 bg-emerald-950/30"
                    : line.startsWith("-") && !line.startsWith("---")
                    ? "text-rose-400 bg-rose-950/30"
                    : "text-zinc-500"
                }
              >
                {line}
              </div>
            ))}
          </pre>
        </OperationCard>
      );

    default:
      return null;
  }
});
