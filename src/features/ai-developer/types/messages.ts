/**
 * AI Developer — Message Block Types
 *
 * Structured message system replacing plain text bubbles.
 * Each message from the assistant is composed of typed blocks.
 */

// ─── Block Types ──────────────────────────────────────────────────────────────

export type MessageBlockType =
  | "text"
  | "status"
  | "plan"
  | "file_read"
  | "code_search"
  | "tool_call"
  | "file_change"
  | "diff"
  | "approval"
  | "build"
  | "test"
  | "preview"
  | "deployment"
  | "error";

export type BlockState = "pending" | "running" | "success" | "failed" | "waiting_approval";

// ─── Base Block ────────────────────────────────────────────────────────────────

export interface BaseBlock {
  id: string;
  type: MessageBlockType;
  state: BlockState;
  title: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  collapsed?: boolean;
  retryable?: boolean;
}

// ─── Specific Block Payloads ───────────────────────────────────────────────────

export interface TextBlock extends BaseBlock {
  type: "text";
  content: string;
}

export interface StatusBlock extends BaseBlock {
  type: "status";
  message: string;
  progress?: number;
}

export interface PlanStep {
  step: number;
  action: "create" | "modify" | "delete" | "migrate" | "validate";
  description: string;
  file?: string;
  requiresApproval: boolean;
}

export interface PlanBlock extends BaseBlock {
  type: "plan";
  taskId: string;
  steps: PlanStep[];
  affectedFiles: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface FileReadBlock extends BaseBlock {
  type: "file_read";
  filePath: string;
  linesRead?: number;
}

export interface CodeSearchBlock extends BaseBlock {
  type: "code_search";
  query: string;
  matchCount?: number;
  filePattern?: string;
}

export interface ToolCallBlock extends BaseBlock {
  type: "tool_call";
  toolName: string;
  args?: Record<string, any>;
  result?: any;
}

export interface FileChangeBlock extends BaseBlock {
  type: "file_change";
  filePath: string;
  changeType: "create" | "modify" | "delete";
  linesAdded?: number;
  linesRemoved?: number;
  diff?: string;
}

export interface DiffBlock extends BaseBlock {
  type: "diff";
  filePath: string;
  diff: string;
}

export interface ApprovalBlock extends BaseBlock {
  type: "approval";
  taskId: string;
  planSteps: PlanStep[];
  affectedFiles: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  approved?: boolean;
}

export interface BuildBlock extends BaseBlock {
  type: "build";
  buildType: "typecheck" | "build" | "test";
  passed: boolean;
  errorCount?: number;
  output?: string;
}

export interface TestBlock extends BaseBlock {
  type: "test";
  passed: boolean;
  testsRun?: number;
  testsFailed?: number;
  output?: string;
}

export interface PreviewBlock extends BaseBlock {
  type: "preview";
  previewUrl?: string;
  screenshotUrl?: string;
  route?: string;
}

export interface DeploymentBlock extends BaseBlock {
  type: "deployment";
  deploymentUrl?: string;
  commitHash?: string;
  prUrl?: string;
}

export interface ErrorBlock extends BaseBlock {
  type: "error";
  message: string;
  detail?: string;
  stack?: string;
}

// ─── Union Type ────────────────────────────────────────────────────────────────

export type MessageBlock =
  | TextBlock
  | StatusBlock
  | PlanBlock
  | FileReadBlock
  | CodeSearchBlock
  | ToolCallBlock
  | FileChangeBlock
  | DiffBlock
  | ApprovalBlock
  | BuildBlock
  | TestBlock
  | PreviewBlock
  | DeploymentBlock
  | ErrorBlock;

// ─── Message Turn ──────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface MessageTurn {
  id: string;
  role: MessageRole;
  sessionId: string;
  runId?: string;
  blocks: MessageBlock[];
  createdAt: string;
  // For user turns: plain text content
  userContent?: string;
}
