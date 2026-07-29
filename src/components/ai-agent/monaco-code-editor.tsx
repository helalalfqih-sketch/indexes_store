import React, { useState, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Code2, Play, Save, Check, Copy, RefreshCw, FileCode } from "lucide-react";
import { toast } from "sonner";

interface MonacoCodeEditorProps {
  filePath?: string;
  initialCode?: string;
  language?: string;
  readOnly?: boolean;
  onSave?: (code: string) => void;
  onCodeChange?: (code: string) => void;
}

export function MonacoCodeEditor({
  filePath = "src/services/ai-agent/execution.controller.ts",
  initialCode = "// Select a file or write code here...",
  language = "typescript",
  readOnly = false,
  onSave,
  onCodeChange,
}: MonacoCodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    setCode(initialCode);
    setIsSaved(true);
  }, [initialCode, filePath]);

  const handleEditorChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);
    setIsSaved(false);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(code);
    }
    setIsSaved(true);
    toast.success(`تم حفظ الملف: ${filePath.split("/").pop()}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("تم نسخ الكود");
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Add Ctrl+S keyboard shortcut inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  // Infer language from file extension
  const getLanguage = (path: string) => {
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".sql")) return "sql";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".md")) return "markdown";
    return language;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0e0e11] rounded-2xl border border-zinc-800/90 overflow-hidden shadow-2xl">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#141418] border-b border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-mono">
          <FileCode className="h-4 w-4 text-violet-400" />
          <span className="font-semibold text-zinc-200">{filePath}</span>
          {!isSaved && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="غير محفوظ" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 text-zinc-300 hover:text-white text-[11px] transition"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "تم النسخ" : "نسخ"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition ${
              isSaved
                ? "bg-zinc-800 text-zinc-500 border border-zinc-700/40 cursor-default"
                : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:opacity-90"
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            حفظ (Ctrl+S)
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 w-full min-h-[300px]">
        <Editor
          height="100%"
          language={getLanguage(filePath)}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            lineNumbers: "on",
            renderLineHighlight: "all",
            padding: { top: 12, bottom: 12 },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-zinc-400 gap-2 text-xs">
              <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />
              جاري تحميل Monaco Code Editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
