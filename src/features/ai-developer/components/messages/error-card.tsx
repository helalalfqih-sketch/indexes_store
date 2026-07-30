/**
 * ErrorCard — Shows an agent error with retry option
 */
import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ErrorBlock } from "../../types/messages";

interface ErrorCardProps {
  block: ErrorBlock;
  onRetry?: () => void;
}

export const ErrorCard = React.memo(function ErrorCard({ block, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-2xl border bg-rose-950/20 border-rose-800/40 overflow-hidden my-2">
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-rose-300">{block.message}</p>
          {block.detail && (
            <p className="text-[10px] text-rose-400/70 mt-0.5 leading-relaxed">{block.detail}</p>
          )}
        </div>
        {block.retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition"
          >
            <RefreshCw className="h-3 w-3" />
            إعادة
          </button>
        )}
      </div>
    </div>
  );
});
