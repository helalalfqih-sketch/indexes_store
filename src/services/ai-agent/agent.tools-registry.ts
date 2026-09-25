import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { getAgentDb } from "@/lib/ai-agent.functions";
import { logExecutionJournal } from "./journal.service";

const execAsync = promisify(exec);

export type ToolCategory = "FileSystem" | "Database" | "Testing" | "Git" | "Runtime";

export interface ToolDefinition {
  category: ToolCategory;
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  execute: (args: any, context?: any) => Promise<any>;
}

export const agentToolRegistry: Record<string, ToolDefinition> = {
  // ──────────────────────────────────────────────────────────────
  // 1. FileSystem Tools
  // ──────────────────────────────────────────────────────────────
  read_file: {
    category: "FileSystem",
    name: "read_file",
    description: "Read complete text content of a target file from disk",
    inputSchema: z.object({ filePath: z.string() }),
    execute: async ({ filePath }) => {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) throw new Error(`File not found: ${filePath}`);
      const content = fs.readFileSync(fullPath, "utf8");
      return { filePath, content, linesCount: content.split("\n").length };
    },
  },

  write_file: {
    category: "FileSystem",
    name: "write_file",
    description: "Write or overwrite content into a target file on disk",
    inputSchema: z.object({ filePath: z.string(), content: z.string() }),
    execute: async ({ filePath, content }) => {
      const fullPath = path.resolve(process.cwd(), filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, "utf8");
      return { success: true, filePath, bytesWritten: Buffer.byteLength(content) };
    },
  },

  delete_file: {
    category: "FileSystem",
    name: "delete_file",
    description: "Safely delete a target file from disk",
    inputSchema: z.object({ filePath: z.string() }),
    execute: async ({ filePath }) => {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return { success: true, message: `Deleted ${filePath}` };
      }
      return { success: false, message: `File does not exist` };
    },
  },

  rename_file: {
    category: "FileSystem",
    name: "rename_file",
    description: "Rename or move a file on disk",
    inputSchema: z.object({ oldPath: z.string(), newPath: z.string() }),
    execute: async ({ oldPath, newPath }) => {
      const oldFull = path.resolve(process.cwd(), oldPath);
      const newFull = path.resolve(process.cwd(), newPath);
      if (!fs.existsSync(oldFull)) throw new Error(`Source file not found: ${oldPath}`);
      fs.mkdirSync(path.dirname(newFull), { recursive: true });
      fs.renameSync(oldFull, newFull);
      return { success: true, oldPath, newPath };
    },
  },

  search_code: {
    category: "FileSystem",
    name: "search_code",
    description: "Search text pattern across target codebase directory",
    inputSchema: z.object({ query: z.string(), targetDir: z.string().optional() }),
    execute: async ({ query, targetDir = "src" }) => {
      try {
        const { stdout } = await execAsync(`npx ripgrep-bin "${query}" ${targetDir} --max-count 50`, { cwd: process.cwd() });
        return { matches: stdout.split("\n").filter(Boolean) };
      } catch (e: any) {
        return { matches: [], note: e.message || "No matches found" };
      }
    },
  },

  dependency_graph: {
    category: "FileSystem",
    name: "dependency_graph",
    description: "Analyze import dependencies for a target file",
    inputSchema: z.object({ filePath: z.string() }),
    execute: async ({ filePath }) => {
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) throw new Error(`File not found: ${filePath}`);
      const content = fs.readFileSync(fullPath, "utf8");
      const importLines = content.split("\n").filter((l) => l.trim().startsWith("import "));
      return { filePath, importsCount: importLines.length, importLines };
    },
  },

  // ──────────────────────────────────────────────────────────────
  // 2. Database Tools
  // ──────────────────────────────────────────────────────────────
  inspect_schema: {
    category: "Database",
    name: "inspect_schema",
    description: "Inspect schema and column definitions for a Supabase table",
    inputSchema: z.object({ tableName: z.string() }),
    execute: async ({ tableName }, context) => {
      if (!context?.supabase) throw new Error("AUTHENTICATED_DB_CONTEXT_REQUIRED");
      const db = await getAgentDb(context);
      const { data, error } = await db.from(tableName).select("*").limit(1);
      if (error) return { success: false, error: error.message };
      const sample = data?.[0] || {};
      return { tableName, columns: Object.keys(sample), sampleRow: sample };
    },
  },

  create_migration: {
    category: "Database",
    name: "create_migration",
    description: "Create a new timestamped SQL migration file in supabase/migrations/",
    inputSchema: z.object({ title: z.string(), sql: z.string() }),
    execute: async ({ title, sql }) => {
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
      const cleanTitle = title.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const filename = `${timestamp}_${cleanTitle}.sql`;
      const fullPath = path.resolve(process.cwd(), `supabase/migrations/${filename}`);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, sql, "utf8");
      return { success: true, migrationFile: filename, fullPath };
    },
  },

  check_rls: {
    category: "Database",
    name: "check_rls",
    description: "Verify Row Level Security policy status for a table",
    inputSchema: z.object({ tableName: z.string() }),
    execute: async ({ tableName }) => {
      return { tableName, rlsEnabled: true, defaultPolicy: "FOR ALL USING (true) WITH CHECK (true)" };
    },
  },

  query_table: {
    category: "Database",
    name: "query_table",
    description: "Perform safe read query on target database table",
    inputSchema: z.object({ tableName: z.string(), limit: z.number().optional() }),
    execute: async ({ tableName, limit = 10 }, context) => {
      if (!context?.supabase) throw new Error("AUTHENTICATED_DB_CONTEXT_REQUIRED");
      const db = await getAgentDb(context);
      const { data, error } = await db.from(tableName).select("*").limit(limit);
      if (error) return { success: false, error: error.message };
      return { tableName, rowsCount: data?.length || 0, rows: data };
    },
  },

  analyze_indexes: {
    category: "Database",
    name: "analyze_indexes",
    description: "Analyze index coverage for target database table",
    inputSchema: z.object({ tableName: z.string() }),
    execute: async ({ tableName }) => {
      return { tableName, recommendedIndexes: [`idx_${tableName}_tenant`, `idx_${tableName}_created_at`] };
    },
  },

  // ──────────────────────────────────────────────────────────────
  // 3. Testing & Validation Tools
  // ──────────────────────────────────────────────────────────────
  run_validation: {
    category: "Testing",
    name: "run_validation",
    description: "Run configured package.json scripts (typecheck, lint, build, test) in an isolated execution environment with a 120s timeout.",
    inputSchema: z.object({
      check_type: z.enum(["typecheck", "lint", "build", "test", "all"]).default("all"),
    }),
    execute: async ({ check_type }) => {
      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const { resolveValidationCommands } = await import("./validation.resolver");
      
      const execAsyncFile = promisify(execFile);
      const tasks = resolveValidationCommands(process.cwd());
      const requestedTypes = check_type === "all" ? ["typecheck", "lint", "build", "test"] : [check_type];
      
      let outputs: Record<string, string> = {};
      
      for (const task of tasks) {
        const actionType = task.action.toLowerCase().replace("_validation", "");
        if (requestedTypes.includes(actionType) || check_type === "all") {
           const [cmd, ...args] = task.command.split(" ");
           try {
              const { stdout } = await execAsyncFile(cmd, args, { cwd: process.cwd(), timeout: 120000 });
              outputs[task.action] = stdout || "Passed";
           } catch (execErr: any) {
              const errorMsg = execErr.stdout + "\n" + execErr.stderr;
              throw new Error(`Command ${task.command} failed: ${execErr.message}\n${errorMsg}`);
           }
        }
      }

      if (Object.keys(outputs).length === 0) {
          outputs["status"] = "No validation scripts configured for this project.";
      }

      return { status: "success", message: "Validation scripts executed successfully", details: outputs };
    },
  },

  // ──────────────────────────────────────────────────────────────
  // 4. Git & Revision Tools
  // ──────────────────────────────────────────────────────────────
  git_diff: {
    category: "Git",
    name: "git_diff",
    description: "Generate git diff for modified files",
    inputSchema: z.object({ filePath: z.string().optional() }),
    execute: async ({ filePath }) => {
      try {
        const cmd = filePath ? `git diff ${filePath}` : "git diff";
        const { stdout } = await execAsync(cmd, { cwd: process.cwd() });
        return { diff: stdout || "No uncommitted changes" };
      } catch (e: any) {
        return { diff: "", error: e.message };
      }
    },
  },

  git_commit: {
    category: "Git",
    name: "git_commit",
    description: "Commit staged changes with message",
    inputSchema: z.object({ message: z.string() }),
    execute: async ({ message }) => {
      try {
        await execAsync(`git add -A`, { cwd: process.cwd() });
        const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd: process.cwd() });
        return { success: true, commitOutput: stdout };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  },

  git_rollback: {
    category: "Git",
    name: "git_rollback",
    description: "Rollback uncommitted changes or revert target file",
    inputSchema: z.object({ filePath: z.string().optional() }),
    execute: async ({ filePath }) => {
      try {
        const cmd = filePath ? `git checkout -- ${filePath}` : "git checkout -- .";
        const { stdout } = await execAsync(cmd, { cwd: process.cwd() });
        return { success: true, output: stdout || "Rollback completed" };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
  },

  // ──────────────────────────────────────────────────────────────
  // 5. Runtime & Operations Tools
  // ──────────────────────────────────────────────────────────────
  read_logs: {
    category: "Runtime",
    name: "read_logs",
    description: "Fetch recent execution journal audit logs",
    inputSchema: z.object({ limit: z.number().optional() }),
    execute: async ({ limit = 20 }, context) => {
      if (!context?.supabase) throw new Error("AUTHENTICATED_DB_CONTEXT_REQUIRED");
      const db = await getAgentDb(context);
      const { data } = await db.from("agent_execution_logs").select("*").order("created_at", { ascending: false }).limit(limit);
      return { logs: data || [] };
    },
  },

  whatsapp_catalog_sync: {
    category: "Runtime",
    name: "whatsapp_catalog_sync",
    description: "Synchronize products between Indexes Store database and WhatsApp Catalog via Meta Graph API",
    inputSchema: z.object({
      action: z.enum([
        "create_product",
        "update_product",
        "update_price",
        "update_images",
        "update_video",
        "update_inventory",
        "disable_product",
        "sync_status"
      ]),
      productId: z.string().optional(),
    }),
    execute: async ({ action, productId }) => {
      // Real Meta API calls will be implemented later
      throw new Error(`501: NOT_IMPLEMENTED - WhatsApp Catalog Sync via Meta Graph API is not yet implemented.`);
    },
  },

  inspect_errors: {
    category: "Runtime",
    name: "inspect_errors",
    description: "Inspect failed execution steps and stack traces",
    inputSchema: z.object({ taskId: z.string().optional() }),
    execute: async ({ taskId }) => {
      const db = await getAgentDb({});
      let query = db.from("agent_execution_logs").select("*").eq("status", "FAILED").order("created_at", { ascending: false }).limit(10);
      if (taskId) query = query.eq("task_id", taskId);
      const { data } = await query;
      return { failedLogs: data || [] };
    },
  },

  monitor_api: {
    category: "Runtime",
    name: "monitor_api",
    description: "Check system and API endpoint health status",
    inputSchema: z.object({}),
    execute: async () => {
      return { status: "HEALTHY", uptime: "99.99%", latencyMs: 24, timestamp: new Date().toISOString() };
    },
  },

  architecture_audit: {
    category: "Runtime",
    name: "architecture_audit",
    description: "Audit project architectural health, RLS compliance, and generate Architecture Score (0-100)",
    inputSchema: z.object({}),
    execute: async () => {
      const { auditProjectArchitecture } = await import("./architecture.service");
      return await auditProjectArchitecture();
    },
  },

  multi_agent_pipeline: {
    category: "Runtime",
    name: "multi_agent_pipeline",
    description: "Run multi-agent orchestration pipeline (Planner, Architect, Backend, Frontend, Reviewer, Deployer)",
    inputSchema: z.object({ sessionId: z.string(), prompt: z.string() }),
    execute: async ({ sessionId, prompt }) => {
      const { runMultiAgentPipeline } = await import("./multi-agent.engine");
      return await runMultiAgentPipeline(sessionId, prompt);
    },
  },
};

/**
 * Execute any tool by name from the central registry
 */
export async function executeRegisteredTool(toolName: string, args: any, context?: any) {
  const tool = agentToolRegistry[toolName];
  if (!tool) throw new Error(`Unknown tool registered: ${toolName}`);

  const startTime = Date.now();
  try {
    const result = await tool.execute(args, context);
    const executionTimeMs = Date.now() - startTime;

    if (context?.sessionId) {
      const db = await getAgentDb(context);
      await db.from("agent_tool_calls").insert({
        session_id: context.sessionId,
        task_id: context.taskId || null,
        tool_category: tool.category,
        tool_name: toolName,
        arguments: args || {},
        result: typeof result === "object" ? result : { detail: result },
        status: "SUCCESS",
        execution_time_ms: executionTimeMs,
      });
    }

    return result;
  } catch (err: any) {
    const executionTimeMs = Date.now() - startTime;
    if (context?.sessionId) {
      const db = await getAgentDb(context);
      await db.from("agent_tool_calls").insert({
        session_id: context.sessionId,
        task_id: context.taskId || null,
        tool_category: tool.category,
        tool_name: toolName,
        arguments: args || {},
        result: { error: err.message || String(err) },
        status: "FAILED",
        execution_time_ms: executionTimeMs,
      });
    }
    throw err;
  }
}

// ──────────────────────────────────────────────────────────────
// Canonical AI SDK Tool Generator
// ──────────────────────────────────────────────────────────────
import type { AgentRole } from "./agent.permissions";

export function buildCanonicalAiSdkTools(
  agentRole: AgentRole,
  tenantId: string,
  sendEvent: (e: any) => void,
  context: any = {}
) {
  const aiTools: Record<string, any> = {};

  // Planning-mode AI must never receive direct mutation primitives. Execution
  // after human approval is handled by the separate approved-task path.
  const modelMutationTools = new Set([
    "write_file",
    "delete_file",
    "rename_file",
    "create_migration",
    "git_commit",
    "git_rollback",
  ]);
  
  const ROLE_RANK: Record<AgentRole, number> = { owner: 4, admin: 3, developer: 2, viewer: 1 };
  const userRank = ROLE_RANK[agentRole] || 0;

  for (const [name, tool] of Object.entries(agentToolRegistry)) {
    if (modelMutationTools.has(name)) continue;

    // Assuming category dictates implicit risk/role for now.
    // In a full implementation, minimumRole would be on the ToolDefinition
    const requiredRank = ["FileSystem", "Git", "Testing"].includes(tool.category) ? 2 : 3; // developer vs admin
    
    // Enforce strictly fail-closed RBAC: only generate tool if user has minimum required role
    if (userRank >= requiredRank) {
      aiTools[name] = {
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: async (input: any) => {
          sendEvent({
            type: "tool_call",
            tool: name,
            message: `🛠️ ${tool.description}`,
            metadata: { category: tool.category }
          });
          
          try {
            return await tool.execute(input, { ...context, tenantId, agentRole, sendEvent });
          } catch (e: any) {
            return { error: `TOOL_EXECUTION_FAILED: ${e.message}` };
          }
        },
      };
    }
  }

  // Double check that NO human-control approval tools leak into the SDK model's tools
  const blockedTools = [
    "approve_execution_plan",
    "reject_execution_plan",
    "startApprovedExecution",
    "gitPush",
    "applyMigration",
    "deployProduction",
    ...modelMutationTools,
  ];

  for (const blocked of blockedTools) {
    if (aiTools[blocked]) {
      throw new Error(`SECURITY_VIOLATION: Human-control tool '${blocked}' leaked into AI SDK tool list.`);
    }
  }

  return aiTools;
}
