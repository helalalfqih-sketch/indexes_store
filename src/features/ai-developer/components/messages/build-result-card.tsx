/**
 * BuildResultCard — Shows typecheck / build pass or fail with output
 */
import React, { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Terminal } from "lucide-react";
import type { BuildBlock } from "../../types/messages";

interface BuildResultCardProps {
  block: BuildBlock;
}

export const BuildResultCard = React.memo(function BuildResultCard({ block }: BuildResultCardProps) {
  const [showOutput, setShowOutput] = useState(!block.passed);

  return (
    <div
      className={`rounded-2xl border my-2 overflow-hidden ${
        block.passed
          ? "bg-emerald-950/20 border-emerald-800/40"
          : "bg-rose-950/20 border-rose-800/40"
      }`}
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setShowOutput((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          {block.passed
            ? <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            : <XCircle className="h-4 w-4 text-rose-400 shrink-0" />}
          <span className="text-xs font-bold text-zinc-200">{block.title}</span>
          {block.buildType && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
              {block.buildType}
            </span>
          )}
          {!block.passed && block.errorCount !== undefined && block.errorCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">
              {block.errorCount} أخطاء
            </span>
          )}
        </div>
        {block.output && (
          showOutput
            ? <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            : <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
        )}
      </div>

      {showOutput && block.output && (
        <div className="border-t border-zinc-800/60 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Terminal className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 font-mono font-bold">OUTPUT</span>
          </div>
          <pre className="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar" dir="ltr">
            {block.output}
          </pre>
        </div>
      )}
    </div>
  );
});
