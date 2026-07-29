/**
 * Agent Engine — Core Runtime Orchestrator
 *
 * Coordinates the full agent lifecycle:
 *   Context → Tools → Planner → Approval Gate → Executor → Memory → Events
 *
 * Used by api/ai.agent.ts as the single entry point.
 *
 * NOTE: Uses ai SDK v7 which changed tool API:
 *   - `parameters` → `inputSchema`
 *   - `execute(input, options)` — first arg is the typed input
 *   - `maxSteps` removed from streamText (now handled via `prepareStep`)
 */

import { streamText } from "ai";
import { z } from "zod";
import type { LanguageModel } from "ai";
import type { ResolvedAIProvider } from "@/lib/ai-provider.server";
import { createModelFromConfig } from "@/lib/ai-provider.server";
import { buildProjectPromptContext } from "@/services/ai/project-context.service";
import {
  makeStatusEvent,
  makeErrorEvent,
  makeReadFileEvent,
  makeSearchCodeEvent,
  makeInspectDbEvent,
  makeToolCallEvent,
  makeRetryEvent,
  makeApprovalRequiredEvent,
} from "./agent.events";
import { canExecuteTool, type AgentRole } from "./agent.permissions";
import { calculateRiskLevel, isProtectedPath } from "./agent.policy";
import {
  readFile,
  searchCode,
  listFiles,
  inspectDatabase,
  proposeEditFile,
  proposeCreateFile,
} from "./agent.tools";

// ─────────────────────────────────────────────────
// Engine Input
// ─────────────────────────────────────────────────

export interface AgentEngineInput {
  sessionId: string;
  tenantId: string;
  message: string;
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  projectMemory: string;
  agentRole: AgentRole;
  resolved: ResolvedAIProvider;
  sendEvent: (event: object) => void;
}

// ─────────────────────────────────────────────────
// Model Fallback Chain
// ─────────────────────────────────────────────────

const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];

// ─────────────────────────────────────────────────
// System Prompt Builder
// ─────────────────────────────────────────────────

function buildSystemPrompt(
  projectContext: string,
  projectMemory: string,
  agentRole: AgentRole,
): string {
  const roleDesc: Record<AgentRole, string> = {
    owner: "لديك صلاحية كاملة: قراءة، تحليل، اقتراح خطة، وتنفيذ تعديلات بعد موافقة المستخدم.",
    admin: "لديك صلاحية التحليل والاقتراح والتنفيذ المحدود بعد موافقة.",
    developer: "لديك صلاحية القراءة والتحليل والاقتراح فقط. لا يمكنك تنفيذ تعديلات.",
    viewer: "لديك صلاحية القراءة فقط.",
  };

  return `أنت "Indexes AI Engineering Agent" — مهندس برمجيات Autonomous Senior ومتخصص في نظام Indexes Store.

== صلاحياتك ==
${roleDesc[agentRole]}

== قواعد المعالجة والتنفيذ الذاتي الفوري (Autonomous Reasoning & Execution Rules) ==
1. حظر تام للأسئلة التسويفية والوعود النصية: عندما يطلب المستخدم (إنشاء نظام، إصلاح، إضافة ميزة، أو تحسين)، يُحظر مطلقاً كتابة عبارات مثل: ("هل يمكنك تزويدي...", "ما هي المشكلة المحددة...", "سأبدأ بالبحث...", "سأحلل..."). قم بفحص المشروع والكود تلقائياً وتقديم الحل والتحليل فوراً.
2. الفحص التلقائي الشامل للمستودع (Automatic Repository Inspection): قم بالتحليل المباشر عبر أدواتك دون انتظار رد من المستخدم:
   - فحص وقراءة ملفات المشروع ذات الصلة (Search & Read files).
   - فحص جداول قاعدة البيانات والسياسات (Inspect DB schema & RLS policies).
   - فحص الخدمات والدوال السابقة (Inspect existing server functions & services).
   - توليد الخطة الهندسية الشاملة الموحدة مع الكود والـ Diffs المطلوبة.
3. الفصل التام بين وضع التخطيط ووضع التنفيذ:
   - [وضع التخطيط - Planning Mode]: تحليل المستودع -> إنشاء الخطة الهندسية الموحدة الشاملة -> الانتقال التلقائي لحالة (waiting_approval).
   - [وضع التنفيذ - Execution Mode]: بعد ضغط المالك على زر (Approve & Execute)، يتم تنفيذ جميع المراحل والخطوات داخلياً تحت (نفس الـ Task ID) دون إنشاء مهام جديدة أو طلب موافقات فرعية.
4. التوقف الصارم متاح في 4 حالات فقط:
   - قرار تصميم جوهري يستدعي اختيار المالك.
   - سر أو مفتاح API أو صلاحية مفقودة (Missing Secret / API Key / RBAC).
   - تعارض Git أو Merge لا يمكن حله تلقائياً.
   - خطأ بناء غير قابل للإصلاح تلقائياً بعد محاولات التصحيح الذاتي (Max 3 retries).
5. التقدم الحي: يُعرض للعميل تقدم حي ومستمر لجميع المراحل المنجزة (✓ Reading files, ✓ Creating migration, ✓ Updating functions, ✓ Testing, ✓ Build passed).
6. حافظ على حماية RLS و Multi-Tenant Isolation في كل كود أو SQL مقترح.
7. أجب بالعربية الهندسية الدقيقة. الكود والمسارات تظل بالإنجليزية.`.trim();
}

// ─────────────────────────────────────────────────
// Tool Schemas (ai SDK v7: inputSchema instead of parameters)
// ─────────────────────────────────────────────────

const ReadFileSchema = z.object({
  file_path: z.string().describe("المسار النسبي للملف مثل src/routes/search.tsx"),
  start_line: z.number().optional().describe("رقم السطر الأول"),
  end_line: z.number().optional().describe("رقم السطر الأخير"),
});

const SearchCodeSchema = z.object({
  query: z.string().describe("النص أو الرمز المراد البحث عنه"),
  file_pattern: z.string().optional().describe("نمط الملفات مثل *.tsx أو *.ts"),
  case_insensitive: z.boolean().optional().default(false),
});

const ListFilesSchema = z.object({
  dir_path: z.string().describe("المسار النسبي للمجلد مثل src/routes"),
});

const InspectDatabaseSchema = z.object({
  table_name: z.string().describe("اسم الجدول مثل products أو orders"),
  include_sample_rows: z.boolean().optional().default(false),
});

const ProposeEditFileSchema = z.object({
  file_path: z.string().describe("المسار النسبي للملف"),
  new_content: z.string().describe("المحتوى الجديد الكامل للملف"),
  reason: z.string().describe("سبب التعديل المقترح"),
});

const ProposeCreateFileSchema = z.object({
  file_path: z.string().describe("المسار النسبي للملف الجديد"),
  content: z.string().describe("محتوى الملف الجديد"),
  reason: z.string().describe("سبب إنشاء الملف"),
});

const ApprovePlanSchema = z.object({
  task_id: z.string().describe("معرف المهمة المراد اعتماد خطتها للتنفيذ"),
});

const ExecuteTaskSchema = z.object({
  task_id: z.string().describe("معرف المهمة المراد تفعيل خطواتها الميدانية والفحص البنائي لها"),
});

const CreateMigrationSchema = z.object({
  migration_name: z
    .string()
    .describe("اسم الـ Migration بالإنجليزية مثل order_notifications_system"),
  sql: z.string().describe("محتوى كود الـ SQL المراد إنشاؤه"),
});

const RunValidationSchema = z.object({
  check_type: z.enum(["typecheck", "build", "all"]).optional().default("all"),
});

// ─────────────────────────────────────────────────
// Build ToolSet for ai SDK v7
// ─────────────────────────────────────────────────

function buildTools(
  role: AgentRole,
  tenantId: string,
  sendEvent: (e: object) => void,
): Record<string, any> {
  const tools: Record<string, any> = {};

  // ── Read File ─────────────────────────────────────────────────
  if (canExecuteTool("read_file", role).allowed) {
    tools.read_file = {
      description: "يقرأ محتوى ملف كود من المشروع بالمسار الكامل أو النسبي",
      inputSchema: ReadFileSchema,
      execute: async (input: z.infer<typeof ReadFileSchema>) => {
        sendEvent(makeReadFileEvent(input.file_path));
        try {
          return await readFile(input.file_path, input.start_line, input.end_line);
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Search Code ───────────────────────────────────────────────
  if (canExecuteTool("search_code", role).allowed) {
    tools.search_code = {
      description: "يبحث في كود المشروع عن نص أو دالة أو رمز",
      inputSchema: SearchCodeSchema,
      execute: async (input: z.infer<typeof SearchCodeSchema>) => {
        sendEvent(makeSearchCodeEvent(input.query, input.file_pattern));
        return searchCode(input.query, input.file_pattern, {
          caseInsensitive: input.case_insensitive ?? false,
        });
      },
    };
  }

  // ── List Files ────────────────────────────────────────────────
  if (canExecuteTool("list_files", role).allowed) {
    tools.list_files = {
      description: "يسرد ملفات ومجلدات في مسار معين من المشروع",
      inputSchema: ListFilesSchema,
      execute: async (input: z.infer<typeof ListFilesSchema>) => {
        sendEvent(makeToolCallEvent("list_files", { dir_path: input.dir_path }));
        try {
          return await listFiles(input.dir_path);
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Inspect Database ──────────────────────────────────────────
  if (canExecuteTool("inspect_database", role).allowed) {
    tools.inspect_database = {
      description: "يفحص هيكل جدول في Supabase وعدد السجلات",
      inputSchema: InspectDatabaseSchema,
      execute: async (input: z.infer<typeof InspectDatabaseSchema>) => {
        sendEvent(makeInspectDbEvent(input.table_name));
        return inspectDatabase(input.table_name, tenantId, input.include_sample_rows ?? false);
      },
    };
  }

  // ── Propose Edit File (approval_required) ────────────────────
  if (canExecuteTool("edit_file", role).allowed) {
    tools.propose_edit_file = {
      description: "يقترح تعديلاً على ملف موجود ويعرض الـ diff للمراجعة قبل التطبيق",
      inputSchema: ProposeEditFileSchema,
      execute: async (input: z.infer<typeof ProposeEditFileSchema>) => {
        if (isProtectedPath(input.file_path)) {
          return { error: `هذا الملف محمي ولا يمكن تعديله: ${input.file_path}` };
        }
        sendEvent(
          makeToolCallEvent("propose_edit_file", {
            file_path: input.file_path,
            reason: input.reason,
          }),
        );
        try {
          const proposal = await proposeEditFile(input.file_path, input.new_content);
          const planStep = {
            step: 1,
            action: "modify" as const,
            description: input.reason,
            file: input.file_path,
            requiresApproval: true,
          };
          sendEvent(
            makeApprovalRequiredEvent(
              `task-${Date.now()}`,
              [planStep],
              [input.file_path],
              calculateRiskLevel([planStep], [input.file_path]),
            ),
          );
          return {
            status: "approval_required",
            diff: proposal.diff,
            file: input.file_path,
            message: "يتطلب هذا التعديل موافقتك. راجع الـ diff أعلاه وانقر تنفيذ للمتابعة.",
          };
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Propose Create File ───────────────────────────────────────
  if (canExecuteTool("create_file", role).allowed) {
    tools.propose_create_file = {
      description: "يقترح إنشاء ملف جديد في المشروع",
      inputSchema: ProposeCreateFileSchema,
      execute: async (input: z.infer<typeof ProposeCreateFileSchema>) => {
        sendEvent(
          makeToolCallEvent("propose_create_file", {
            file_path: input.file_path,
            reason: input.reason,
          }),
        );
        try {
          const proposal = await proposeCreateFile(input.file_path, input.content);
          return {
            status: "approval_required",
            diff: proposal.diff,
            file: input.file_path,
            message: "يتطلب إنشاء هذا الملف موافقتك.",
          };
        } catch (e: unknown) {
          return { error: String((e as Error)?.message ?? e) };
        }
      },
    };
  }

  // ── Inspect Project Environment ──────────────────────────────
  tools.inspect_project = {
    description:
      "Inspect package manager, available scripts (typecheck, lint, build, test), and workspace configuration",
    inputSchema: z.object({}),
    execute: async () => {
      sendEvent(makeToolCallEvent("inspect_project", {}));
      const { inspectProjectEnvironment } = await import("./validation.resolver");
      return inspectProjectEnvironment(process.cwd());
    },
  };

  // ── Approve Execution Plan ──────────────────────────────────
  tools.approve_execution_plan = {
    description: "Approve the current engineering plan and start execution",
    inputSchema: ApprovePlanSchema,
    execute: async (input: z.infer<typeof ApprovePlanSchema>) => {
      sendEvent(makeToolCallEvent("approve_execution_plan", { task_id: input.task_id }));
      const { approvePlan } = await import("./execution.controller");
      return approvePlan({ taskId: input.task_id, tenantId, sessionId: "" });
    },
  };

  // ── Execute Task ────────────────────────────────────────────
  tools.execute_task = {
    description:
      "Execute approved engineering steps, apply file modifications, and run build verification",
    inputSchema: ExecuteTaskSchema,
    execute: async (input: z.infer<typeof ExecuteTaskSchema>) => {
      sendEvent(makeToolCallEvent("execute_task", { task_id: input.task_id }));
      const { logExecutionJournal } = await import("./journal.service");
      await logExecutionJournal({
        taskId: input.task_id,
        tenantId,
        action: "TOOL_STARTED",
        tool: "execute_task",
        input: { task_id: input.task_id },
        output: { status: "running" },
        status: "PENDING",
      });

      try {
        const { startExecution } = await import("./execution.controller");
        const res = await startExecution({ taskId: input.task_id, tenantId, sessionId: "" });
        await logExecutionJournal({
          taskId: input.task_id,
          tenantId,
          action: "TOOL_COMPLETED",
          tool: "execute_task",
          input: { task_id: input.task_id },
          output: { res },
          status: res.success ? "SUCCESS" : "FAILED",
        });
        return res;
      } catch (err: any) {
        const errPayload = {
          message: err.message || String(err),
          stack: err.stack,
          stdout: err.stdout,
          stderr: err.stderr,
          failed_step: "execute_task",
          tool_name: "execute_task",
        };
        await logExecutionJournal({
          taskId: input.task_id,
          tenantId,
          action: "TOOL_FAILED",
          tool: "execute_task",
          input: { task_id: input.task_id },
          output: errPayload,
          status: "FAILED",
        });
        throw err;
      }
    },
  };

  // ── Create Migration ────────────────────────────────────────
  tools.create_migration = {
    description: "إنشاء ملف SQL Migration جديد في مجلد supabase/migrations/",
    inputSchema: CreateMigrationSchema,
    execute: async (input: z.infer<typeof CreateMigrationSchema>) => {
      sendEvent(makeToolCallEvent("create_migration", { migration_name: input.migration_name }));
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
      const filePath = `supabase/migrations/${timestamp}_${input.migration_name}.sql`;

      const { logExecutionJournal } = await import("./journal.service");
      await logExecutionJournal({
        tenantId,
        action: "TOOL_STARTED",
        tool: "create_migration",
        input: { filePath, migration_name: input.migration_name },
        output: { status: "creating" },
        status: "PENDING",
      });

      try {
        const proposal = await proposeCreateFile(filePath, input.sql);
        await logExecutionJournal({
          tenantId,
          action: "CREATE_MIGRATION",
          tool: "create_migration",
          input: { filePath, migration_name: input.migration_name },
          output: { success: true, filePath },
          status: "SUCCESS",
        });
        return { status: "created", filePath, diff: proposal.diff };
      } catch (err: any) {
        await logExecutionJournal({
          tenantId,
          action: "TOOL_FAILED",
          tool: "create_migration",
          input: { filePath, migration_name: input.migration_name },
          output: {
            message: err.message || String(err),
            stack: err.stack,
            failed_step: "create_migration",
          },
          status: "FAILED",
        });
        throw err;
      }
    },
  };

  // ── Run Validation ──────────────────────────────────────────
  tools.run_validation = {
    description: "تشغيل فحص الأخطاء والتجميع البرمجي npm run typecheck و npm run build",
    inputSchema: RunValidationSchema,
    execute: async (input: z.infer<typeof RunValidationSchema>) => {
      sendEvent(makeToolCallEvent("run_validation", { check_type: input.check_type }));
      const { logExecutionJournal } = await import("./journal.service");
      await logExecutionJournal({
        tenantId,
        action: "TOOL_STARTED",
        tool: "run_validation",
        input: { check_type: input.check_type },
        output: { status: "running" },
        status: "PENDING",
      });

      const { execFile } = await import("node:child_process");
      const { promisify } = await import("node:util");
      const execAsync = promisify(execFile);

      try {
        const { stdout: tcOut } = await execAsync("npm", ["run", "typecheck"], {
          cwd: process.cwd(),
        });
        const { stdout: bOut } = await execAsync("npm", ["run", "build"], { cwd: process.cwd() });

        await logExecutionJournal({
          tenantId,
          action: "RUN_VALIDATION",
          tool: "run_validation",
          input: { check_type: input.check_type },
          output: { stdout: "Passed Cleanly ✅", typecheck: tcOut, build: bOut },
          status: "SUCCESS",
        });

        return { status: "success", message: "TypeScript check & Build passed cleanly ✅" };
      } catch (err: any) {
        const errPayload = {
          message: err.message || String(err),
          stack: err.stack,
          stdout: err.stdout,
          stderr: err.stderr,
          failed_step: "RUN_VALIDATION",
          tool_name: "run_validation",
        };
        await logExecutionJournal({
          tenantId,
          action: "TOOL_FAILED",
          tool: "run_validation",
          input: { check_type: input.check_type },
          output: errPayload,
          status: "FAILED",
        });
        return { status: "failed", error: errPayload };
      }
    },
  };

  return tools;
}

// ─────────────────────────────────────────────────
// Main Engine Run
// ─────────────────────────────────────────────────

export async function runAgentEngine(input: AgentEngineInput): Promise<void> {
  const { tenantId, message, history, projectMemory, agentRole, resolved, sendEvent } = input;

  // 1. Load Dynamic Project Code Intelligence Context & Reasoning Engine
  const { AgentTaskState } = await import("./agent.state");
  const { makeProgressEvent } = await import("./agent.events");
  const { savePersistentExecutionEvent } = await import("./journal.service");

  const dispatchPersistentEvent = (event: any) => {
    sendEvent(event);
    if (
      event.type === "status" ||
      event.type === "tool_call" ||
      event.type === "reading_file" ||
      event.type === "searching_code"
    ) {
      savePersistentExecutionEvent({
        sessionId: input.sessionId,
        tenantId,
        eventType: event.type === "tool_call" ? "TOOL_CALL" : "STATE_CHANGE",
        state: event.state || event.status,
        message: event.message || event.label || "Execution progress event",
        progress: event.progress || 0,
        metadata: event.metadata,
      }).catch(() => {});
    }
  };

  dispatchPersistentEvent(
    makeProgressEvent(
      AgentTaskState.ANALYZING_REPOSITORY,
      "✓ Inspecting routes, services & DB migrations...",
      10,
    ),
  );

  // Gen 1 Base Code Intel & Decision Engine
  const { getProjectContextForAgent } = await import("./code-intelligence.service");
  const { analyzeEngineeringRequest, generateTechnicalDecision } =
    await import("./reasoning.engine");

  // Gen 2 Agentic Engine 1: Workspace Memory & Knowledge Graph
  const { getWorkspaceKnowledgeGraph } = await import("./workspace-memory.service");
  const workspaceGraph = await getWorkspaceKnowledgeGraph(tenantId);
  dispatchPersistentEvent(
    makeProgressEvent(
      AgentTaskState.ANALYZING_REPOSITORY,
      `✓ Workspace Memory Loaded (Knowledge Graph Score: ${workspaceGraph.architectureScore}/100)`,
      20,
    ),
  );

  // Gen 2 Agentic Engine 2: Context Compression Engine
  const { buildCompressedContextWindow } = await import("./context-engine");
  const compressedContext = await buildCompressedContextWindow(message);
  dispatchPersistentEvent(
    makeProgressEvent(
      AgentTaskState.ANALYZING_REPOSITORY,
      `✓ Context Engine: Compressed context window (-${compressedContext.reductionPercentage}% tokens)`,
      30,
    ),
  );

  // Gen 2 Agentic Engine 3: Architecture Audit & Health Scorer
  const { auditProjectArchitecture } = await import("./architecture.service");
  const archReport = await auditProjectArchitecture();
  dispatchPersistentEvent(
    makeProgressEvent(
      AgentTaskState.ANALYZING_REPOSITORY,
      `✓ Architecture Health Score: ${archReport.score}/100 (${archReport.metrics.totalRoutes} routes, ${archReport.metrics.totalDbTables} tables)`,
      35,
    ),
  );

  // Gen 2 Agentic Engine 4: Multi-Layer Task Decomposition
  const { decomposeUserRequest } = await import("./task-decomposer");
  const decomposedPlan = decomposeUserRequest(message);
  dispatchPersistentEvent(
    makeProgressEvent(
      AgentTaskState.CREATING_PLAN,
      `✓ Task Decomposed across ${decomposedPlan.layersCount} Architecture Layers`,
      40,
    ),
  );

  // Gen 2 Agentic Engine 5: Multi-Agent Orchestration (Planner, Architect, Backend, Frontend, Reviewer)
  const { runMultiAgentPipeline } = await import("./multi-agent.engine");
  const multiAgentResult = await runMultiAgentPipeline(input.sessionId, message);
  for (const subAgent of multiAgentResult.agentResults) {
    dispatchPersistentEvent(
      makeProgressEvent(AgentTaskState.CREATING_PLAN, `✓ ${subAgent.outputMessage}`, 45),
    );
  }

  const dynamicCodeIntel = await getProjectContextForAgent(tenantId, message);
  const baseContext = await buildProjectPromptContext(tenantId);
  const reasoningReport = await analyzeEngineeringRequest(message, []);
  const decisionSummary = await generateTechnicalDecision(reasoningReport);

  const projectContext = `${baseContext}\n\n${compressedContext.summary}\n\n${dynamicCodeIntel}\n\n${decisionSummary}`;

  // Search Long-Term Task Memory for relevant past solutions
  const { searchTaskMemory } = await import("./agent.tasks");
  const pastMemories = await searchTaskMemory(tenantId, message, 3);
  let memoryStr = projectMemory || "";
  if (pastMemories.length > 0) {
    const pastStr = pastMemories
      .map(
        (m) =>
          `[حل سابق / ${m.category}]: مشكلة "${m.problem}" ⬅️ الحل: ${m.solution} ${m.commit_hash ? `(Commit: ${m.commit_hash})` : ""}`,
      )
      .join("\n");
    memoryStr = memoryStr ? `${memoryStr}\n\n${pastStr}` : pastStr;
  }

  // 2. Build system prompt + tools
  const systemPrompt = buildSystemPrompt(projectContext, memoryStr, agentRole);
  const tools = buildTools(agentRole, tenantId, dispatchPersistentEvent);

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  dispatchPersistentEvent(
    makeProgressEvent(AgentTaskState.WAITING_APPROVAL, "✓ Engineering plan ready for approval", 50),
  );

  // 3. Stream with model fallback
  const candidates = Array.from(new Set([resolved.modelName, ...MODEL_FALLBACKS]));
  let streamSuccess = false;
  let lastErr: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    try {
      if (i > 0) {
        sendEvent(makeRetryEvent(i, candidates.length, modelName, String(lastErr)));
      }

      const activeModel: LanguageModel =
        modelName === resolved.modelName
          ? resolved.model
          : createModelFromConfig(resolved.provider, null, modelName);

      const result = streamText({
        model: activeModel,
        system: systemPrompt,
        messages,
        tools: tools as any, // ai v7 ToolSet — cast to bypass strict generic inference
        temperature: 0.3,
      });

      for await (const chunk of result.textStream) {
        if (chunk) sendEvent({ type: "text", content: chunk });
      }

      streamSuccess = true;
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`[AgentEngine] Model ${modelName} failed:`, err);
    }
  }

  if (!streamSuccess) {
    sendEvent(
      makeErrorEvent(
        "فشلت جميع نماذج AI. يرجى المحاولة لاحقاً أو التحقق من إعدادات المزود.",
        String(lastErr),
        false,
      ),
    );
    return;
  }

  // 4. Done
  sendEvent(makeStatusEvent("completed", "✓ Finished."));
}
