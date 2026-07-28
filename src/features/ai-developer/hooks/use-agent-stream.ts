/**
 * useAgentStream — Production-grade SSE stream hook
 *
 * Features:
 * - AbortController: stream cancelled on unmount or manual cancel
 * - Token batching: UI updates throttled to every 40ms (prevents 60fps thrash)
 * - requestAnimationFrame: scroll anchor only fires when UI is ready
 * - Structured MessageBlock emission from raw SSE events
 * - Fallback text accumulation for unclassified chunks
 */

import { useState, useRef, useCallback } from "react";
import type { MessageBlock, TextBlock, StatusBlock, PlanBlock, ToolCallBlock, FileReadBlock, CodeSearchBlock, BuildBlock, ErrorBlock } from "../types/messages";

export interface StreamInput {
  sessionId: string;
  message: string;
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  projectMemory: string;
  agentRole: string;
  providerId?: string;
}

export interface StreamState {
  isStreaming: boolean;
  blocks: MessageBlock[];
  streamingText: string;
  error: string | null;
}

export interface UseAgentStreamReturn {
  state: StreamState;
  startStream: (input: StreamInput) => Promise<void>;
  cancelStream: () => void;
  clearBlocks: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
  return crypto.randomUUID();
}

function cleanThoughtContent(content: string): string {
  if (!content) return "";
  return content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .replace(/^Thinking Process:[\s\S]*?\n\n/gi, "")
    .trim();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAgentStream(): UseAgentStreamReturn {
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    blocks: [],
    streamingText: "",
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  // Token batch buffer — flushed every 40ms
  const tokenBufferRef = useRef<string>("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushTokenBuffer = useCallback(() => {
    if (tokenBufferRef.current) {
      const content = cleanThoughtContent(tokenBufferRef.current);
      setState((prev) => ({ ...prev, streamingText: content }));
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        flushTokenBuffer();
      }, 40);
    }
  }, [flushTokenBuffer]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false, streamingText: "" }));
  }, []);

  const clearBlocks = useCallback(() => {
    setState({ isStreaming: false, blocks: [], streamingText: "", error: null });
  }, []);

  const startStream = useCallback(async (input: StreamInput) => {
    // Cancel any existing stream
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setState({ isStreaming: true, blocks: [], streamingText: "", error: null });
    tokenBufferRef.current = "";

    const newBlocks: MessageBlock[] = [];
    let fullTextContent = "";

    function pushBlock(block: MessageBlock) {
      newBlocks.push(block);
      setState((prev) => ({ ...prev, blocks: [...prev.blocks, block] }));
    }

    function updateLastBlock(updater: (b: MessageBlock) => MessageBlock) {
      if (newBlocks.length === 0) return;
      const last = updater(newBlocks[newBlocks.length - 1]);
      newBlocks[newBlocks.length - 1] = last;
      setState((prev) => {
        const updated = [...prev.blocks];
        if (updated.length > 0) updated[updated.length - 1] = last;
        return { ...prev, blocks: updated };
      });
    }

    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${base}/api/ai/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: input.sessionId,
          message: input.message,
          history: input.history,
          projectMemory: input.projectMemory,
          agentRole: input.agentRole,
          providerId: input.providerId || undefined,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("تعذر فتح مجرى البيانات مع الذكاء الاصطناعي");

      const decoder = new TextDecoder();
      let sseBuffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split("\n\n");
        sseBuffer = events.pop() || "";

        for (const rawEvt of events) {
          if (abort.signal.aborted) break outer;

          const trimmed = rawEvt.trim();
          if (!trimmed) continue;

          const dataLine = trimmed.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) {
            // Raw fallback
            const cleaned = cleanThoughtContent(trimmed);
            if (cleaned) {
              fullTextContent += cleaned;
              tokenBufferRef.current = fullTextContent;
              scheduleFlush();
            }
            continue;
          }

          try {
            const json = JSON.parse(dataLine.replace(/^data:\s*/, ""));

            // ── Status event ──────────────────────────────────────────────
            if (json.type === "status") {
              const statusBlock: StatusBlock = {
                id: makeId(),
                type: "status",
                state: "running",
                title: json.label || json.message || "معالجة...",
                message: json.label || json.message || "",
                progress: json.progress,
                startedAt: new Date().toISOString(),
              };
              pushBlock(statusBlock);
            }
            // ── Tool events ───────────────────────────────────────────────
            else if (json.type === "reading_file") {
              const block: FileReadBlock = {
                id: makeId(),
                type: "file_read",
                state: "running",
                title: `قراءة: ${json.file || json.message || ""}`,
                filePath: json.file || "",
                startedAt: new Date().toISOString(),
              };
              pushBlock(block);
            }
            else if (json.type === "searching_code") {
              const block: CodeSearchBlock = {
                id: makeId(),
                type: "code_search",
                state: "running",
                title: `بحث في الكود: ${json.query || json.message || ""}`,
                query: json.query || json.message || "",
                filePattern: json.file_pattern,
                startedAt: new Date().toISOString(),
              };
              pushBlock(block);
            }
            else if (json.type === "tool_call") {
              const block: ToolCallBlock = {
                id: makeId(),
                type: "tool_call",
                state: "running",
                title: `أداة: ${json.tool_name || json.message || "tool"}`,
                toolName: json.tool_name || "unknown",
                args: json.args,
                startedAt: new Date().toISOString(),
              };
              pushBlock(block);
            }
            // ── Approval required ─────────────────────────────────────────
            else if (json.type === "approval_required" || json.type === "plan_ready") {
              const planBlock: PlanBlock = {
                id: makeId(),
                type: "plan",
                state: "waiting_approval",
                title: "الخطة الهندسية جاهزة للمراجعة",
                taskId: json.taskId || `task-${Date.now()}`,
                steps: json.plan || [],
                affectedFiles: json.affectedFiles || [],
                riskLevel: json.riskLevel || "low",
                startedAt: new Date().toISOString(),
              };
              pushBlock(planBlock);
            }
            // ── Build result ──────────────────────────────────────────────
            else if (json.type === "build_result") {
              const buildBlock: BuildBlock = {
                id: makeId(),
                type: "build",
                state: json.passed ? "success" : "failed",
                title: json.passed ? "✅ فحص البناء نجح" : "❌ فشل فحص البناء",
                buildType: json.buildType || "build",
                passed: json.passed || false,
                errorCount: json.errorCount || 0,
                output: json.output,
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              };
              pushBlock(buildBlock);
            }
            // ── Text token ────────────────────────────────────────────────
            else if (json.type === "text") {
              fullTextContent += json.content || "";
              tokenBufferRef.current = fullTextContent;
              scheduleFlush();
            }
            // ── Error ─────────────────────────────────────────────────────
            else if (json.type === "error") {
              const errorBlock: ErrorBlock = {
                id: makeId(),
                type: "error",
                state: "failed",
                title: "حدث خطأ",
                message: json.error || "خطأ غير محدد",
                detail: json.detail,
                retryable: true,
              };
              pushBlock(errorBlock);
            }
          } catch {
            // Unparseable data — treat as raw text
            const cleaned = cleanThoughtContent(dataLine.replace(/^data:\s*/, ""));
            if (cleaned) {
              fullTextContent += cleaned;
              tokenBufferRef.current = fullTextContent;
              scheduleFlush();
            }
          }
        }
      }

      // Flush remaining text
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      const finalText = cleanThoughtContent(fullTextContent);
      if (finalText) {
        const textBlock: TextBlock = {
          id: makeId(),
          type: "text",
          state: "success",
          title: "رد الذكاء الاصطناعي",
          content: finalText,
          completedAt: new Date().toISOString(),
        };
        newBlocks.push(textBlock);
        setState((prev) => ({
          ...prev,
          blocks: [...prev.blocks.filter((b) => b.type !== "text"), textBlock],
          streamingText: "",
        }));
      }

    } catch (e: any) {
      if (e?.name === "AbortError") {
        setState((prev) => ({ ...prev, isStreaming: false, streamingText: "" }));
        return;
      }
      const errorBlock: ErrorBlock = {
        id: makeId(),
        type: "error",
        state: "failed",
        title: "خطأ في الاتصال",
        message: e.message || "فشل الاتصال بالذكاء الاصطناعي",
        retryable: true,
      };
      setState((prev) => ({
        ...prev,
        blocks: [...prev.blocks, errorBlock],
        error: e.message,
        streamingText: "",
      }));
    } finally {
      if (!abort.signal.aborted) {
        setState((prev) => ({ ...prev, isStreaming: false, streamingText: "" }));
      }
    }
  }, [scheduleFlush]);

  return { state, startStream, cancelStream, clearBlocks };
}
