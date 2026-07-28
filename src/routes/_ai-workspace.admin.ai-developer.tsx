/**
 * AI Developer Workspace Route
 *
 * URL: /admin/ai-developer
 * Layout: _ai-workspace (NO AdminShell, no sidebar, no commerce nav)
 *
 * TanStack Router pathless layout:
 *   - _ai-workspace.tsx → pathless parent (no URL segment)
 *   - _ai-workspace.admin.ai-developer.tsx → URL = /admin/ai-developer
 *
 * This file replaces the old admin.ai-developer.tsx which used a
 * `fixed inset-0 z-[100]` hack to fight against AdminShell rendering.
 * Here, AdminShell is simply not mounted.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, User, Plus, Sparkles, Loader2, FileCode, FileText, Zap,
  AlertTriangle, CheckCircle, XCircle, BarChart3, Cpu, Check,
  ChevronDown, ChevronRight, RefreshCw, History, Eye, UploadCloud,
  X, Search, Shield, Play, Clock, Code2, Send, Paperclip, Layers,
  FolderTree, MoreHorizontal, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  listAgentSessions,
  getAgentSession,
  createAgentSession,
  saveAgentMessage,
  updateSessionTask,
  archiveSession,
  getProjectMemory,
  seedProjectMemory,
  getAgentUsageStats,
  getAgentRole,
  approveAgentTask,
  rejectAgentTask,
  startExecutionTask,
  listExecutionJournalFn,
  getSessionExecutionEventsFn,
  parseProjectFileFn,
  applyCodePatchFn,
  validateBuildStateFn,
  publishToProductionFn,
  type AgentSession,
  type AgentMessage,
  type AgentMemoryEntry,
  type ProjectFileParsedContext,
} from "@/lib/ai-agent.functions";
import { listAIProvidersFn } from "@/lib/ai-provider.server";

// ─── Lazy-loaded heavy components ─────────────────────────────────────────────
const MonacoCodeEditor = lazy(() =>
  import("@/components/ai-agent/monaco-code-editor").then((m) => ({
    default: m.MonacoCodeEditor,
  }))
);
const VisualArchitectureMap = lazy(() =>
  import("@/components/ai-agent/visual-architecture-map").then((m) => ({
    default: m.VisualArchitectureMap,
  }))
);
const LivePreviewCanvas = lazy(() =>
  import("@/components/ai-agent/live-preview-canvas").then((m) => ({
    default: m.LivePreviewCanvas,
  }))
);

// ─── Feature components ────────────────────────────────────────────────────────
import { ConversationTimeline } from "@/features/ai-developer/components/messages/conversation-timeline";
import { PromptComposer, type AttachedFile } from "@/features/ai-developer/components/messages/prompt-composer";
import { ActiveRunPanel } from "@/features/ai-developer/components/activity/active-run-panel";
import { SessionList } from "@/features/ai-developer/components/sessions/session-list";
import { useAgentStream } from "@/features/ai-developer/hooks/use-agent-stream";
import type { MessageBlock, PlanBlock } from "@/features/ai-developer/types/messages";
import type { AgentEvent } from "@/features/ai-developer/types/events";

// ─── Shared components ─────────────────────────────────────────────────────────
import { ExecutionJournalPanel } from "@/components/ai-agent/execution-journal-panel";
import { CommandPalette } from "@/components/ai-agent/command-palette";
import { GleamAccordionSidebar } from "@/components/ai-agent/gleam-accordion-sidebar";
import type { FileItem } from "@/components/ai-agent/file-explorer";

// ─── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_ai-workspace/admin/ai-developer")({
  head: () => ({
    meta: [
      { title: "NOQTA AI Developer — Workspace" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AIWorkspacePage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanThoughtContent(content: string): string {
  if (!content) return "";
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/^Thinking Process:[\s\S]*?\n\n/gi, "")
    .trim();
}

// ─── Main Workspace ────────────────────────────────────────────────────────────

function AIWorkspacePage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Server Functions ──────────────────────────────────────────────────────
  const listSessionsFn = useServerFn(listAgentSessions);
  const getSessionFn = useServerFn(getAgentSession);
  const createSessionFn = useServerFn(createAgentSession);
  const saveMessageFn = useServerFn(saveAgentMessage);
  const updateTaskFn = useServerFn(updateSessionTask);
  const archiveSessionFn = useServerFn(archiveSession);
  const updateSessionTaskFn = useServerFn(updateSessionTask);
  const getMemoryFn = useServerFn(getProjectMemory);
  const seedMemoryFn = useServerFn(seedProjectMemory);
  const getRoleFn = useServerFn(getAgentRole);
  const listProvidersFn = useServerFn(listAIProvidersFn);
  const approveTaskFn = useServerFn(approveAgentTask);
  const rejectTaskFn = useServerFn(rejectAgentTask);
  const startExecutionFn = useServerFn(startExecutionTask);
  const validateBuildServerFn = useServerFn(validateBuildStateFn);
  const publishServerFn = useServerFn(publishToProductionFn);
  const applyPatchServerFn = useServerFn(applyCodePatchFn);
  const getSessionEventsFn = useServerFn(getSessionExecutionEventsFn);
  const getExecJournalFn = useServerFn(listExecutionJournalFn);

  // ── Streaming Hook ────────────────────────────────────────────────────────
  const { state: streamState, startStream, cancelStream } = useAgentStream();
  const { isStreaming, blocks: streamingBlocks, streamingText } = streamState;

  // ── Core State ────────────────────────────────────────────────────────────
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [workMode, setWorkMode] = useState<"PLAN" | "BUILD">("PLAN");
  const [pendingTask, setPendingTask] = useState<{
    taskId: string;
    plan: any[];
    affectedFiles: string[];
    riskLevel: string;
    status?: string;
    diffs?: Record<string, string>;
  } | null>(null);
  const [failureExplanation, setFailureExplanation] = useState<any | null>(null);
  const [recoveryTimeline, setRecoveryTimeline] = useState<any[]>([]);
  const [isExecutingTask, setIsExecutingTask] = useState(false);

  // ── Editor State ──────────────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<FileItem>({
    id: "execution-controller",
    name: "execution.controller.ts",
    path: "src/services/ai-agent/execution.controller.ts",
    type: "file",
    language: "typescript",
    content: `// Execution Controller\n// Select a file from the explorer to view its content.`,
  });
  const [editorCode, setEditorCode] = useState(selectedFile.content || "");

  // ── Build State (not pre-seeded as "passed") ──────────────────────────────
  const [buildValidation, setBuildValidation] = useState<{
    passed: boolean | null;
    errorCount: number;
    summary: string;
  }>({
    passed: null, // null = "not yet checked" — prevents fake "passed" display
    errorCount: 0,
    summary: "لم يتم تشغيل فحص البناء بعد.",
  });
  const [isValidatingBuild, setIsValidatingBuild] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Panel Layout ──────────────────────────────────────────────────────────
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isBottomConsoleOpen, setIsBottomConsoleOpen] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"journal" | "terminal" | "build">("journal");
  const [rightContextTab, setRightContextTab] = useState<"preview" | "diff" | "architecture_map" | "full_audit">("preview");
  const [fullAuditReport, setFullAuditReport] = useState<any | null>(null);
  const [isAuditingWorkspace, setIsAuditingWorkspace] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"files" | "preview" | "logs" | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: sessions = [] } = useQuery({
    queryKey: ["ai-agent-sessions"],
    queryFn: () => listSessionsFn(),
  });

  const { data: roleData } = useQuery({
    queryKey: ["ai-agent-role"],
    queryFn: () => getRoleFn(),
  });

  const { data: memory = [] } = useQuery({
    queryKey: ["ai-agent-memory"],
    queryFn: () => getMemoryFn(),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => listProvidersFn(),
  });

  const { data: rawJournalLogs } = useQuery({
    queryKey: ["ai-execution-journal"],
    queryFn: () => getExecJournalFn(),
    refetchInterval: 5000, // Will be replaced with Realtime in a follow-up
  });
  const journalLogs = (rawJournalLogs || []) as any[];

  const { data: rawPersistentEvents } = useQuery({
    queryKey: ["ai-session-events", activeSessionId],
    queryFn: () =>
      activeSessionId
        ? getSessionEventsFn({ data: { sessionId: activeSessionId } })
        : Promise.resolve([]),
    enabled: !!activeSessionId,
  });
  const persistentEvents = (rawPersistentEvents || []) as unknown as AgentEvent[];

  const agentRole = roleData?.role || "viewer";
  const canSend = agentRole !== "viewer";

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if ((memory as any[]).length === 0 && roleData) {
      seedMemoryFn().catch(() => {});
    }
  }, [(memory as any[]).length, roleData]);

  // Extract plan block from streaming blocks for auto-approval UI
  const streamingPlanBlock = useMemo(
    () => streamingBlocks.find((b): b is PlanBlock => b.type === "plan") || null,
    [streamingBlocks],
  );

  // Update pendingTask from streaming plan
  useEffect(() => {
    if (streamingPlanBlock) {
      setPendingTask({
        taskId: streamingPlanBlock.taskId,
        plan: streamingPlanBlock.steps,
        affectedFiles: streamingPlanBlock.affectedFiles,
        riskLevel: streamingPlanBlock.riskLevel,
      });
    }
  }, [streamingPlanBlock]);

  // ── Session Management ────────────────────────────────────────────────────
  const loadSession = useCallback(
    async (sessionId: string) => {
      setActiveSessionId(sessionId);
      try {
        const res = await getSessionFn({ data: { sessionId } });
        setMessages(res.messages);
        const sess = res.session;
        if (
          sess &&
          (sess.task_status === "waiting_approval" || sess.task_status === "planning") &&
          (sess.affected_files?.length > 0 || sess.task_plan?.length > 0)
        ) {
          setPendingTask({
            taskId: sess.task_id || "TASK-001",
            plan: sess.task_plan || [],
            affectedFiles: sess.affected_files || [],
            riskLevel: sess.risk_level || "low",
          });
        } else {
          setPendingTask(null);
        }
      } catch {
        setMessages([]);
        setPendingTask(null);
      }
    },
    [getSessionFn],
  );

  const handleNewSession = async () => {
    try {
      const session = await createSessionFn({ data: { title: "جلسة جديدة" } });
      setActiveSessionId(session.id);
      setMessages([]);
      setPendingTask(null);
      setFailureExplanation(null);
      queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
    } catch (e: any) {
      toast.error(e.message || "فشل إنشاء الجلسة");
    }
  };

  // ── Send Message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isStreaming || !canSend) return;

    let sessionId = activeSessionId;

    if (!sessionId) {
      try {
        const session = await createSessionFn({ data: { title: inputValue.slice(0, 60) } });
        sessionId = session.id;
        setActiveSessionId(sessionId);
        queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
      } catch {
        toast.error("فشل إنشاء الجلسة");
        return;
      }
    }

    const userMessage = inputValue.trim();
    setInputValue("");

    // Save user message
    try {
      const saved = await saveMessageFn({
        data: { sessionId, role: "user", content: userMessage },
      });
      setMessages((prev) => [...prev, saved]);
    } catch {
      toast.error("فشل حفظ الرسالة");
      return;
    }

    // Update session title on first message
    if (messages.length === 0) {
      updateTaskFn({
        data: {
          sessionId,
          title: userMessage.slice(0, 80),
          taskStatus: "planning",
        },
      }).catch(() => {});
    }

    // Build memory context
    const memoryStr = (memory as AgentMemoryEntry[])
      .map((m) => `[${m.category}/${m.key}]: ${m.value}`)
      .join("\n");

    // Build history context
    const history = messages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Attach files as context
    let effectiveMessage = userMessage;
    if (attachedFiles.length > 0) {
      effectiveMessage +=
        `\n\n--- ATTACHED REAL PROJECT FILE CONTEXTS ---\n` +
        attachedFiles
          .map(
            (f) =>
              `[PROJECT_FILE_CONTEXT]\nFile: ${f.fileName}\nPath: ${f.path}\nSize: ${f.size} Bytes | Lines: ${f.lineCount} | Language: ${f.language}\nImports/Dependencies: ${f.dependencies.join(", ") || "None"}\nContent:\n${f.content}`,
          )
          .join("\n\n");
      setAttachedFiles([]);
    }

    // Start streaming
    await startStream({
      sessionId,
      message: effectiveMessage,
      history,
      projectMemory: memoryStr,
      agentRole,
      providerId: selectedProviderId || undefined,
    });

    // Save assistant response
    const finalText = streamState.blocks
      .filter((b) => b.type === "text")
      .map((b: any) => b.content)
      .join("\n\n");

    if (finalText) {
      const saved = await saveMessageFn({
        data: { sessionId, role: "assistant", content: finalText },
      }).catch(() => null);
      if (saved) setMessages((prev) => [...prev, saved]);
    }

    queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["ai-agent-usage"] });
  }, [
    inputValue, isStreaming, canSend, activeSessionId, messages,
    memory, attachedFiles, agentRole, selectedProviderId,
    createSessionFn, saveMessageFn, updateTaskFn, startStream, streamState.blocks,
    queryClient,
  ]);

  // ── Build Validate ────────────────────────────────────────────────────────
  const handleValidateBuild = useCallback(async () => {
    setIsValidatingBuild(true);
    try {
      const res = await validateBuildServerFn();
      setBuildValidation({
        passed: res.passed,
        errorCount: res.errorCount,
        summary: res.summary,
      });
      if (res.passed) {
        toast.success("✅ فحص البناء نجح — لا يوجد أخطاء تجميعية");
      } else {
        toast.error(`❌ ${res.errorCount} خطأ تجميعي`);
      }
    } catch (e: any) {
      toast.error(e.message || "فشل فحص البناء");
    } finally {
      setIsValidatingBuild(false);
    }
  }, [validateBuildServerFn]);

  // ── Save & Validate Code ──────────────────────────────────────────────────
  const handleSaveCodeAndValidate = useCallback(
    async (savedCode: string) => {
      setIsValidatingBuild(true);
      try {
        const patchRes = await applyPatchServerFn({
          data: { targetFile: selectedFile.path, newContent: savedCode },
        });
        if (!patchRes.success) {
          toast.error(patchRes.error || "فشل تطبيق التعديل");
          return;
        }
        const valRes = await validateBuildServerFn();
        setBuildValidation({
          passed: valRes.passed,
          errorCount: valRes.errorCount,
          summary: valRes.summary,
        });
        if (valRes.passed) {
          toast.success("✅ تم حفظ التعديل واجتياز فحص البناء");
        } else {
          toast.error(`❌ ${valRes.errorCount} خطأ تجميعي`);
        }
      } catch (e: any) {
        toast.error(e.message || "فشل الفحص");
      } finally {
        setIsValidatingBuild(false);
      }
    },
    [applyPatchServerFn, validateBuildServerFn, selectedFile.path],
  );

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      const res = await publishServerFn({
        data: {
          sessionId: activeSessionId || "default",
          commitMessage: `feat(builder): publish autonomous changes for session ${activeSessionId || "default"}`,
        },
      });
      if (res.success) {
        toast.success("🎉 تم نشر التطبيق بنجاح!");
      } else {
        toast.error(res.error || "فشل النشر");
      }
    } catch (e: any) {
      toast.error(e.message || "فشل النشر");
    } finally {
      setIsPublishing(false);
    }
  }, [publishServerFn, activeSessionId]);

  // ── Approve Task ──────────────────────────────────────────────────────────
  const handleApproveTask = useCallback(
    async (taskId: string) => {
      if (!taskId) {
        toast.error("لا يوجد مهمة نشطة");
        return;
      }
      setIsExecutingTask(true);
      toast.loading(`جاري تنفيذ ${taskId}...`, { id: "task-exec" });

      queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
      queryClient.invalidateQueries({ queryKey: ["ai-session-events", activeSessionId] });

      try {
        await approveTaskFn({ data: { taskId } });
        const res = (await startExecutionFn({
          data: { taskId, sessionId: activeSessionId || "default" },
        })) as any;

        if (res?.success) {
          toast.success("✅ تم تطبيق التعديلات واجتياز فحص البناء!", { id: "task-exec" });
          setPendingTask(null);
          setFailureExplanation(null);
        } else {
          if (res?.failureDetails) setFailureExplanation(res.failureDetails);
          if (res?.recoveryTimeline) setRecoveryTimeline(res.recoveryTimeline);
          toast.error(
            `❌ فشل التنفيذ: ${res?.failureDetails?.reason || "تم التراجع تلقائياً"}`,
            { id: "task-exec" },
          );
        }
        queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
        queryClient.invalidateQueries({ queryKey: ["ai-session-events", activeSessionId] });
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء التنفيذ", { id: "task-exec" });
        queryClient.invalidateQueries({ queryKey: ["ai-execution-journal"] });
      } finally {
        setIsExecutingTask(false);
      }
    },
    [approveTaskFn, startExecutionFn, activeSessionId, queryClient],
  );

  const handleRejectTask = useCallback(
    async (taskId: string) => {
      try {
        await rejectTaskFn({ data: { taskId } });
        toast.info(`تم إلغاء المهمة ${taskId}`);
        setPendingTask(null);
      } catch {
        toast.error("فشل إلغاء المهمة");
      }
    },
    [rejectTaskFn],
  );

  const handleArchive = useCallback(
    async (sessionId: string) => {
      try {
        await archiveSessionFn({ data: { sessionId } });
        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setMessages([]);
        }
        queryClient.invalidateQueries({ queryKey: ["ai-agent-sessions"] });
        toast.success("تم أرشفة الجلسة");
      } catch {
        toast.error("فشل أرشفة الجلسة");
      }
    },
    [archiveSessionFn, activeSessionId, queryClient],
  );

  const quickSuggestions = [
    "أنشئ نظام إشعارات الطلبات المباشرة",
    "تحسين أداء SEO والـ Lighthouse إلى 98+",
    "فحص إعدادات الدفع وشحنات الـ RLS",
    "فحص واستعراض البنية الكاملة للمشروع",
  ];

  // ── Execution Stage Display ───────────────────────────────────────────────
  const executionStageInfo = useMemo(() => {
    if (failureExplanation) {
      return {
        stage: "FAILED",
        label: "❌ فشل التنفيذ",
        badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40",
        canExecute: false,
        helperMsg: failureExplanation.reason || "حدث خطأ أثناء التنفيذ.",
      };
    }
    if (isExecutingTask) {
      return {
        stage: "EXECUTING",
        label: "⚙️ جاري تنفيذ التغييرات",
        badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse",
        canExecute: false,
        helperMsg: "جاري تطبيق التعديلات وفحص البناء التجميعي...",
      };
    }
    if (isStreaming) {
      return {
        stage: "STREAMING",
        label: "🔄 الوكيل يعمل...",
        badgeColor: "bg-violet-500/20 text-violet-400 border-violet-500/40 animate-pulse",
        canExecute: false,
        helperMsg: "جاري تحليل المستودع وبناء الخطة...",
      };
    }
    if (pendingTask) {
      return {
        stage: "PLAN_READY",
        label: "📋 الخطة جاهزة للاعتماد",
        badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        canExecute: true,
        helperMsg: "راجع الخطة أدناه واضغط اعتماد وتنفيذ.",
      };
    }
    return {
      stage: "IDLE",
      label: "جاهز",
      badgeColor: "bg-zinc-800 text-zinc-400 border-zinc-700",
      canExecute: false,
      helperMsg: "",
    };
  }, [failureExplanation, isExecutingTask, isStreaming, pendingTask]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans"
      dir="rtl"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          TOP TOOLBAR
          ══════════════════════════════════════════════════════════════════ */}
      <header className="h-14 border-b border-zinc-800/80 bg-[#121215]/95 backdrop-blur-2xl px-4 flex items-center justify-between shrink-0 z-30 select-none">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-[#18181c] border border-zinc-800/80 px-3 py-1.5 rounded-xl font-bold text-xs text-zinc-100 shadow-inner">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[11px] font-black tracking-tight leading-none text-zinc-100">
                NOQTA AI Developer
              </span>
              <span className="text-[9px] text-zinc-400 font-mono">v3.0 Workspace</span>
            </div>
          </div>

          {/* Build Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16161a] border border-zinc-800 text-[11px] font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                isValidatingBuild
                  ? "bg-amber-400 animate-ping"
                  : buildValidation.passed === null
                  ? "bg-zinc-600"
                  : buildValidation.passed
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-rose-500"
              }`}
            />
            <span className="text-zinc-300">
              {isValidatingBuild
                ? "جاري فحص البناء..."
                : buildValidation.passed === null
                ? "لم يتم فحص البناء بعد"
                : buildValidation.passed
                ? "البناء نظيف ✨"
                : `يوجد ${buildValidation.errorCount} خطأ ⚠️`}
            </span>
          </div>

          {/* Execution Stage Badge */}
          {executionStageInfo.stage !== "IDLE" && (
            <div
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${executionStageInfo.badgeColor}`}
            >
              {executionStageInfo.label}
            </div>
          )}
        </div>

        {/* Center: Work Mode + Provider */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#18181c] p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setWorkMode("PLAN")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                workMode === "PLAN"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Plan Mode 📋
            </button>
            <button
              type="button"
              onClick={() => setWorkMode("BUILD")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition ${
                workMode === "BUILD"
                  ? "bg-gradient-to-r from-amber-500 to-violet-600 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              Build Mode ⚡
            </button>
          </div>

          {providers.length > 0 && (
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-[#16161a] px-3 py-1.5 text-[11px] font-bold text-zinc-300 outline-none focus:border-violet-500/50 transition cursor-pointer hover:bg-zinc-800/60"
            >
              <option value="">✨ ذكاء تلقائي (Default)</option>
              {providers.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.provider} ({p.model})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleValidateBuild}
            disabled={isValidatingBuild}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-200 transition shadow-sm disabled:opacity-50"
            title="فحص البناء"
          >
            {isValidatingBuild ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span>فحص البناء</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">نشر مباشر</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="p-2 rounded-xl bg-[#16161a] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            title="لوحة الأوامر"
          >
            <Sparkles className="h-4 w-4 text-violet-400" />
          </button>

          <button
            type="button"
            onClick={handleNewSession}
            className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md transition flex items-center gap-1 text-xs font-bold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">جلسة جديدة</span>
          </button>

          <Link
            to="/admin"
            className="p-1.5 mr-1 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition"
            title="إغلاق IDE"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN 3-PANEL WORKSPACE
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ─── LEFT PANEL: Sessions & Files ─────────────────────────────── */}
        <aside
          className={`hidden md:flex flex-col border-l border-zinc-800/80 bg-[#0e0e11]/90 backdrop-blur-xl transition-all duration-300 z-20 shrink-0 ${
            isLeftPanelOpen ? "w-72" : "w-12"
          }`}
        >
          <div className="h-10 border-b border-zinc-800/80 flex items-center justify-between px-3 bg-[#141417]/80 text-[11px] font-bold text-zinc-400">
            {isLeftPanelOpen && (
              <span className="flex items-center gap-1.5 text-zinc-200">
                <FileCode className="h-3.5 w-3.5 text-amber-400" />
                الجلسات والملفات
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsLeftPanelOpen((p) => !p)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              {isLeftPanelOpen ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <Layers className="h-4 w-4 text-violet-400" />
              )}
            </button>
          </div>

          {isLeftPanelOpen ? (
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-4">
              {/* New Session Button */}
              <button
                type="button"
                onClick={handleNewSession}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold hover:bg-violet-600/30 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                جلسة جديدة
              </button>

              {/* Session List */}
              <SessionList
                sessions={sessions as AgentSession[]}
                activeSessionId={activeSessionId}
                onSelectSession={loadSession}
                onArchiveSession={handleArchive}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center py-3 gap-3 text-zinc-500">
              <button
                onClick={() => setIsLeftPanelOpen(true)}
                className="p-2 hover:bg-zinc-800 rounded-xl text-amber-400"
              >
                <FileCode className="h-5 w-5" />
              </button>
            </div>
          )}
        </aside>

        {/* ─── CENTER PANEL: Chat / Editor ──────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] overflow-hidden relative">
          {/* Center Tab Bar */}
          <div className="h-10 border-b border-zinc-800/80 bg-[#121215] flex items-center justify-between px-3 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-[#18181c] border border-zinc-800 px-3 py-1 rounded-lg text-zinc-200 font-mono text-[11px]">
                <FileCode className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[200px]">
                  {workMode === "BUILD" ? selectedFile.name : "محادثة AI Developer"}
                </span>
              </div>
            </div>

            {workMode === "BUILD" && (
              <button
                type="button"
                onClick={() => handleSaveCodeAndValidate(editorCode)}
                disabled={isValidatingBuild}
                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isValidatingBuild ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                حفظ وفحص
              </button>
            )}
          </div>

          {/* Mode Body */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {workMode === "BUILD" ? (
              <Suspense
                fallback={
                  <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                    <Loader2 className="h-5 w-5 animate-spin me-2" />
                    جاري تحميل المحرر...
                  </div>
                }
              >
                <MonacoCodeEditor
                  filePath={selectedFile.path}
                  initialCode={editorCode}
                  language={selectedFile.language || "typescript"}
                  onCodeChange={(val: string) => setEditorCode(val)}
                  onSave={handleSaveCodeAndValidate}
                />
              </Suspense>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ConversationTimeline
                  messages={messages}
                  streamingBlocks={streamingBlocks}
                  streamingText={streamingText}
                  isStreaming={isStreaming}
                  onApprove={handleApproveTask}
                  onReject={handleRejectTask}
                  isExecuting={isExecutingTask}
                  quickSuggestions={quickSuggestions}
                  onSuggestionClick={(text) => setInputValue(text)}
                />

                <PromptComposer
                  value={inputValue}
                  onChange={setInputValue}
                  onSend={handleSend}
                  onCancel={cancelStream}
                  attachedFiles={attachedFiles}
                  onAttachFile={(f) => setAttachedFiles((prev) => [...prev, f])}
                  onRemoveFile={(idx) =>
                    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  isStreaming={isStreaming}
                  disabled={!canSend}
                />
              </div>
            )}
          </div>
        </main>

        {/* ─── RIGHT PANEL: Preview / Audit / Map ───────────────────────── */}
        <aside
          className={`hidden lg:flex flex-col border-r border-zinc-800/80 bg-[#0e0e11]/90 backdrop-blur-xl transition-all duration-300 z-20 shrink-0 ${
            isRightPanelOpen ? "w-[400px]" : "w-12"
          }`}
        >
          <div className="flex flex-col border-b border-zinc-800/80 bg-[#141417]/80">
            <div className="h-10 flex items-center justify-between px-3 text-[11px] font-bold text-zinc-400">
              <button
                type="button"
                onClick={() => setIsRightPanelOpen((p) => !p)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                {isRightPanelOpen ? (
                  <ChevronRight className="h-4 w-4 rotate-180" />
                ) : (
                  <Eye className="h-4 w-4 text-cyan-400" />
                )}
              </button>

              {isRightPanelOpen && (
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: "preview", label: "المعاينة" },
                    { id: "full_audit", label: "🔍 فحص" },
                    { id: "architecture_map", label: "🗺️ Map" },
                    { id: "diff", label: "التغييرات" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRightContextTab(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                        rightContextTab === tab.id
                          ? "bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30"
                          : "hover:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isRightPanelOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              {rightContextTab === "preview" && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-32 text-zinc-500 text-xs">
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      جاري تحميل المعاينة...
                    </div>
                  }
                >
                  <LivePreviewCanvas
                    activeRoute="/"
                    buildPassed={buildValidation.passed ?? false}
                    buildSummary={buildValidation.summary}
                    isBuilding={isValidatingBuild}
                    onRefresh={handleValidateBuild}
                  />
                  {/* Real performance — not hardcoded */}
                  <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-3 text-xs space-y-2">
                    <p className="font-bold text-zinc-300">أداء البناء</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-900 rounded-xl p-2 text-center border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">أخطاء البناء</span>
                        <span className="font-mono font-bold text-sm text-zinc-200">
                          {buildValidation.passed === null ? "—" : buildValidation.errorCount}
                        </span>
                      </div>
                      <div className="bg-zinc-900 rounded-xl p-2 text-center border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 block">TypeCheck</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            buildValidation.passed === null
                              ? "text-zinc-500"
                              : buildValidation.passed
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {buildValidation.passed === null
                            ? "—"
                            : buildValidation.passed
                            ? "Pass"
                            : "Fail"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono">{buildValidation.summary}</p>
                  </div>
                </Suspense>
              )}

              {rightContextTab === "architecture_map" && (
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-32 text-zinc-500 text-xs">
                      <Loader2 className="h-4 w-4 animate-spin me-2" />
                      جاري تحميل الخريطة...
                    </div>
                  }
                >
                  <VisualArchitectureMap />
                </Suspense>
              )}

              {rightContextTab === "full_audit" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-rose-400" />
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100">فحص المشروع الكلي</h4>
                        <p className="text-[10px] text-zinc-400">Full Codebase Error Diagnostic</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsAuditingWorkspace(true);
                        try {
                          const { auditFullWorkspace } = await import(
                            "@/services/ai-agent/workspace-auditor.service"
                          );
                          const res = await auditFullWorkspace();
                          setFullAuditReport(res);
                          toast.success(`تم فحص ${res.totalFilesScanned} ملف بنجاح!`);
                        } catch {
                          toast.error("فشل تشغيل فحص المشروع");
                        } finally {
                          setIsAuditingWorkspace(false);
                        }
                      }}
                      disabled={isAuditingWorkspace}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isAuditingWorkspace ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      فحص كامل
                    </button>
                  </div>

                  {fullAuditReport ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                          <span className="text-[10px] text-zinc-400 block">الملفات</span>
                          <span className="text-sm font-bold font-mono text-zinc-100">
                            {fullAuditReport.totalFilesScanned}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-center">
                          <span className="text-[10px] text-rose-300 block">الأخطاء</span>
                          <span className="text-sm font-bold font-mono text-rose-400">
                            {fullAuditReport.totalCriticalErrors}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/40 text-center">
                          <span className="text-[10px] text-amber-300 block">التحذيرات</span>
                          <span className="text-sm font-bold font-mono text-amber-400">
                            {fullAuditReport.totalWarnings}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInputValue(
                            "قم بإصلاح كافة الأخطاء والتحذيرات في تقرير الفحص الكلي تلقائياً.",
                          );
                          setWorkMode("PLAN");
                        }}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 hover:opacity-90 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        إصلاح جميع المشكلات تلقائياً
                      </button>
                      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {fullAuditReport.fileReports.map((rep: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#09090b] border border-zinc-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-cyan-300 truncate max-w-[200px]">
                                {rep.filePath}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                                {rep.criticalCount} / {rep.warningCount}
                              </span>
                            </div>
                            {rep.findings.map((f: any, fIdx: number) => (
                              <div
                                key={fIdx}
                                className="text-[11px] text-zinc-300 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80"
                              >
                                <div className="flex items-center gap-1 text-amber-400 font-bold">
                                  <AlertTriangle className="w-3 h-3" />
                                  {f.title}
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-0.5">{f.description}</p>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 space-y-3">
                      <Search className="h-10 w-10 text-zinc-700" />
                      <p className="text-xs max-w-xs">
                        اضغط "فحص كامل" لمسح كافة ملفات المستودع وكشف الأخطاء.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {rightContextTab === "diff" && (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 space-y-3 py-12">
                  <FileCode className="h-10 w-10 text-zinc-700" />
                  <p className="text-xs">لا يوجد تغييرات لعرضها حالياً.</p>
                </div>
              )}
            </div>
          )}

          {!isRightPanelOpen && (
            <div className="flex flex-col items-center py-3 gap-3 text-zinc-500">
              <button
                onClick={() => setIsRightPanelOpen(true)}
                className="p-2 hover:bg-zinc-800 rounded-xl text-cyan-400"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM CONSOLE
          ══════════════════════════════════════════════════════════════════ */}
      <footer
        className={`border-t border-zinc-800/80 bg-[#0e0e11]/95 backdrop-blur-2xl transition-all duration-300 z-30 shrink-0 ${
          isBottomConsoleOpen ? "h-56" : "h-9"
        }`}
      >
        <div className="h-9 border-b border-zinc-800/80 bg-[#141417] px-3 flex items-center justify-between text-xs font-bold text-zinc-400 select-none">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsBottomConsoleOpen((p) => !p)}
              className="p-1 rounded hover:bg-zinc-800 transition me-1"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isBottomConsoleOpen ? "" : "rotate-180"}`}
              />
            </button>

            {(["journal", "terminal", "build"] as const).map((tab) => {
              const labels = {
                journal: { label: "سجل العمليات", icon: <History className="h-3.5 w-3.5 text-violet-400" /> },
                terminal: { label: "الطرفية", icon: <FileCode className="h-3.5 w-3.5 text-amber-400" /> },
                build: { label: `البناء (${buildValidation.errorCount})`, icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> },
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setIsBottomConsoleOpen(true);
                    setActiveConsoleTab(tab);
                  }}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                    activeConsoleTab === tab
                      ? "bg-violet-600/20 text-violet-300 font-black border border-violet-500/30"
                      : "hover:text-white"
                  }`}
                >
                  {labels[tab].icon}
                  {labels[tab].label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600">
            <span>{persistentEvents.length} حدث</span>
            <span>{journalLogs.length} سجل</span>
          </div>
        </div>

        {isBottomConsoleOpen && (
          <div className="h-[calc(100%-36px)] overflow-y-auto p-3 custom-scrollbar bg-[#09090b] text-xs font-mono">
            {activeConsoleTab === "journal" && (
              <div className="space-y-2">
                <ActiveRunPanel
                  events={persistentEvents}
                  isExecuting={isExecutingTask || isStreaming}
                />
                <div className="border-t border-zinc-800/60 pt-2 mt-2">
                  <ExecutionJournalPanel
                    logs={journalLogs}
                    persistentEvents={persistentEvents}
                  />
                </div>
              </div>
            )}

            {activeConsoleTab === "terminal" && (
              <div className="space-y-1.5 text-zinc-300">
                <div className="text-emerald-400 font-bold">$ noqta-ai-agent --workspace</div>
                <div className="text-zinc-500">
                  [SYSTEM] Standalone workspace initialized. AdminShell not mounted.
                </div>
                <div className="text-zinc-400">
                  [BUILD] TypeScript compiler ready. Waiting for validation trigger...
                </div>
                <div className="text-violet-400 font-bold">$ ready for engineering commands...</div>
              </div>
            )}

            {activeConsoleTab === "build" && (
              <div className="space-y-2">
                <div
                  className={`p-3 rounded-xl border ${
                    buildValidation.passed === null
                      ? "bg-zinc-900 border-zinc-800 text-zinc-500"
                      : buildValidation.passed
                      ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                      : "bg-rose-950/20 border-rose-800/40 text-rose-300"
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {buildValidation.passed === null ? (
                      <Clock className="w-4 h-4" />
                    ) : buildValidation.passed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {buildValidation.summary}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </footer>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
          ══════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-4 right-4 left-4 z-40 flex items-center justify-around bg-[#141417]/95 border border-zinc-800 backdrop-blur-2xl p-2 rounded-2xl shadow-2xl">
        {[
          { id: "files", icon: <FolderTree className="h-4 w-4" />, label: "الملفات" },
          { id: "preview", icon: <Eye className="h-4 w-4" />, label: "المعاينة" },
          { id: "logs", icon: <History className="h-4 w-4" />, label: "السجلات" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMobileDrawer((d) => (d === item.id as any ? null : item.id as any))}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${
              mobileDrawer === item.id ? "text-violet-400 bg-violet-500/20" : "text-zinc-400"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Mobile Drawer */}
      {mobileDrawer && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-[#121215] border-t border-zinc-800 rounded-t-3xl p-4 max-h-[80vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-100">
                {mobileDrawer === "files"
                  ? "الجلسات"
                  : mobileDrawer === "preview"
                  ? "المعاينة"
                  : "السجلات"}
              </h3>
              <button
                onClick={() => setMobileDrawer(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {mobileDrawer === "files" && (
              <SessionList
                sessions={sessions as AgentSession[]}
                activeSessionId={activeSessionId}
                onSelectSession={(id) => {
                  loadSession(id);
                  setMobileDrawer(null);
                }}
                onArchiveSession={handleArchive}
              />
            )}
            {mobileDrawer === "preview" && (
              <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-zinc-500 mx-auto" />}>
                <LivePreviewCanvas
                  activeRoute="/"
                  buildPassed={buildValidation.passed ?? false}
                  buildSummary={buildValidation.summary}
                  isBuilding={isValidatingBuild}
                  onRefresh={handleValidateBuild}
                />
              </Suspense>
            )}
            {mobileDrawer === "logs" && (
              <ExecutionJournalPanel
                logs={journalLogs}
                persistentEvents={persistentEvents}
              />
            )}
          </div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        actions={[
          {
            id: "validate-build",
            label: "فحص البناء التجميعي",
            icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
            shortcut: "Ctrl+B",
            action: handleValidateBuild,
          },
          {
            id: "switch-build",
            label: "التبديل إلى وضع البناء ⚡",
            icon: <Zap className="h-4 w-4 text-amber-400" />,
            shortcut: "Alt+B",
            action: () => setWorkMode("BUILD"),
          },
          {
            id: "switch-plan",
            label: "التبديل إلى وضع التخطيط 📋",
            icon: <FileText className="h-4 w-4 text-violet-400" />,
            shortcut: "Alt+P",
            action: () => setWorkMode("PLAN"),
          },
          {
            id: "new-session",
            label: "جلسة جديدة",
            icon: <Plus className="h-4 w-4 text-cyan-400" />,
            action: handleNewSession,
          },
        ]}
      />
    </div>
  );
}
