/**
 * ToolCallCard — Renders a tool invocation block
 */
import React from "react";
import { Wrench, FileSearch, Search, Database, Code } from "lucide-react";
import { OperationCard } from "./operation-card";
import type { ToolCallBlock, FileReadBlock, CodeSearchBlock } from "../../types/messages";

const TOOL_ICONS: Record<string, any> = {
  read_file:            FileSearch,
  search_code:          Search,
  inspect_database:     Database,
  list_files:           FileSearch,
  propose_edit_file:    Code,
  propose_create_file:  Code,
  run_validation:       Wrench,
  create_migration:     Database,
  execute_task:         Wrench,
  approve_execution_plan: Wrench,
};

interface ToolCallCardProps {
  block: ToolCallBlock | FileReadBlock | CodeSearchBlock;
}

export const ToolCallCard = React.memo(function ToolCallCard({ block }: ToolCallCardProps) {
  const toolName = "toolName" in block ? block.toolName : block.type;
  const Icon = TOOL_ICONS[toolName] || Wrench;

  return (
    <OperationCard
      state={block.state}
      title={block.title}
      durationMs={block.durationMs}
      startedAt={block.startedAt}
      defaultCollapsed
      className="my-1"
    >
      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
        <Icon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        <span className="font-mono">{toolName}</span>
        {"filePath" in block && block.filePath && (
          <span className="text-cyan-400 truncate">{block.filePath}</span>
        )}
        {"query" in block && block.query && (
          <span className="text-amber-400 truncate">{block.query}</span>
        )}
        {"args" in block && block.args && (
          <span className="text-zinc-500 truncate">
            {JSON.stringify(block.args).slice(0, 60)}
          </span>
        )}
      </div>
    </OperationCard>
  );
});
