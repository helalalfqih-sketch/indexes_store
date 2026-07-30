/**
 * PromptComposer — Isolated, production-grade input component
 *
 * Features:
 * - Auto-resizing textarea (1–5 lines)
 * - Drag & drop file attachment
 * - Keyboard: Enter to send, Shift+Enter for newline
 * - Attached file pills with remove
 * - Streaming state: shows cancel button instead of send
 */
import React, { useRef, useCallback, useState, useEffect } from "react";
import { Send, Loader2, Paperclip, X, Square } from "lucide-react";

export interface AttachedFile {
  fileName: string;
  path: string;
  content: string;
  size: number;
  lineCount: number;
  language: string;
  dependencies: string[];
}

interface PromptComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  onAttachFile?: (file: AttachedFile) => void;
  attachedFiles?: AttachedFile[];
  onRemoveFile?: (idx: number) => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const LANG_MAP: Record<string, string> = {
  ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
  py: "python", sql: "sql", css: "css", html: "html",
  json: "json", md: "markdown", txt: "text",
};

function detectLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "text";
}

async function parseAttachedFile(file: File): Promise<AttachedFile> {
  const content = await file.text();
  const lines = content.split("\n");
  const deps: string[] = [];
  lines.slice(0, 30).forEach((line) => {
    const m = line.match(/(?:import|require)\s+.*?['"]([^'"]+)['"]/);
    if (m) deps.push(m[1]);
  });
  return {
    fileName: file.name,
    path: file.name,
    content,
    size: file.size,
    lineCount: lines.length,
    language: detectLanguage(file.name),
    dependencies: [...new Set(deps)],
  };
}

export const PromptComposer = React.memo(function PromptComposer({
  value,
  onChange,
  onSend,
  onCancel,
  onAttachFile,
  attachedFiles = [],
  onRemoveFile,
  isStreaming = false,
  disabled = false,
  placeholder = "اكتب طلبك الهندسي...",
}: PromptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  // Auto-resize textarea (1–5 rows)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && !disabled && value.trim()) onSend();
      }
    },
    [isStreaming, disabled, value, onSend],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      setIsParsing(true);
      try {
        for (const f of files) {
          const parsed = await parseAttachedFile(f);
          onAttachFile?.(parsed);
        }
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onAttachFile],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      setIsParsing(true);
      try {
        for (const f of files) {
          const parsed = await parseAttachedFile(f);
          onAttachFile?.(parsed);
        }
      } finally {
        setIsParsing(false);
      }
    },
    [onAttachFile],
  );

  return (
    <div
      className="shrink-0 bg-[#121215] border-t border-zinc-800/80"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-violet-950/85 border-2 border-dashed border-violet-400 backdrop-blur-md flex items-center justify-center rounded-2xl pointer-events-none">
          <p className="text-violet-200 font-bold text-sm">أفلت الملف للإرفاق كـ Context</p>
        </div>
      )}

      {/* Attached File Pills */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto px-3 pt-2 pb-0">
          {attachedFiles.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-950/40 border border-violet-800/50 text-[11px] font-mono text-violet-300 shrink-0"
            >
              <Paperclip className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[140px]">{f.fileName}</span>
              <button
                type="button"
                onClick={() => onRemoveFile?.(idx)}
                className="p-0.5 rounded hover:bg-violet-900/60 text-violet-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="p-3">
        <div
          className={`relative flex items-end gap-2 bg-[#18181c] border rounded-2xl p-2 shadow-2xl transition ${
            isDragging
              ? "border-violet-400"
              : "border-zinc-800 focus-within:border-violet-500/60"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "الذكاء يعمل..." : placeholder}
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-100 placeholder-zinc-500 resize-none py-1.5 px-2 custom-scrollbar leading-relaxed disabled:opacity-60"
            style={{ minHeight: "36px", maxHeight: "120px" }}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
            {/* File attach */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40"
              title="إرفاق ملف كـ Context"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Send / Cancel */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onCancel}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/20"
                title="إلغاء التدفق"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!value.trim() || disabled}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition disabled:opacity-30 shadow-lg shadow-violet-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".ts,.tsx,.js,.jsx,.py,.sql,.css,.html,.json,.md,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[10px] text-zinc-600">
            Enter للإرسال · Shift+Enter لسطر جديد
          </p>
          {isParsing && (
            <div className="flex items-center gap-1 text-[10px] text-violet-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>جاري قراءة الملف...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
