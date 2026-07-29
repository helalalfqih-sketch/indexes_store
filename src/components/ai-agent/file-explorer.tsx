import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  Database,
  ChevronDown,
  ChevronLeft,
  Sparkles,
  Search,
  Loader2,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import {
  getRealProjectTreeFn,
  readProjectFileContentFn,
  ProjectFileNode,
} from "@/lib/ai-agent.functions";

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  language?: string;
  children?: FileItem[];
  content?: string;
  size?: number;
  updatedAt?: string;
}

interface FileExplorerProps {
  activeFilePath?: string;
  onSelectFile?: (file: {
    id: string;
    name: string;
    path: string;
    type: "file" | "directory";
    language?: string;
    content?: string;
    size?: number;
    updatedAt?: string;
  }) => void;
}

export function FileExplorer({ activeFilePath, onSelectFile }: FileExplorerProps) {
  const getTreeServerFn = useServerFn(getRealProjectTreeFn);
  const readFileServerFn = useServerFn(readProjectFileContentFn);

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    src: true,
    "src/routes": true,
    "src/components": true,
    "src/lib": true,
    "src/services": true,
  });
  const [filterText, setFilterText] = useState("");
  const [loadingFilePath, setLoadingFilePath] = useState<string | null>(null);

  const {
    data: treeData,
    isLoading: loadingTree,
    refetch: refetchTree,
  } = useQuery({
    queryKey: ["real-project-tree"],
    queryFn: () => getTreeServerFn(),
    staleTime: 30000,
  });

  const projectTree = treeData?.tree || [];
  const totalFiles = treeData?.totalFiles || 0;
  const totalFolders = treeData?.totalFolders || 0;

  const toggleFolder = (folderPath: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  const handleFileClick = async (node: ProjectFileNode) => {
    if (node.type === "directory") {
      toggleFolder(node.path);
      return;
    }

    setLoadingFilePath(node.path);
    try {
      const res = await readFileServerFn({ data: { path: node.path } });
      if (onSelectFile) {
        onSelectFile({
          id: node.path,
          name: res.name || node.name,
          path: res.path || node.path,
          type: "file",
          language: res.language || "typescript",
          content: res.content || "",
          size: res.size || node.size,
          updatedAt: res.updatedAt || node.updatedAt,
        });
      }
    } catch {
      if (onSelectFile) {
        onSelectFile({
          id: node.path,
          name: node.name,
          path: node.path,
          type: "file",
          language: "typescript",
          content: "// Unable to read file content",
          size: node.size,
          updatedAt: node.updatedAt,
        });
      }
    } finally {
      setLoadingFilePath(null);
    }
  };

  const getFileIcon = (fileName: string, isActive: boolean) => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (ext === "tsx" || ext === "ts") {
      return (
        <FileCode
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-cyan-500/80"}`}
        />
      );
    }
    if (ext === "css") {
      return (
        <FileText
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-pink-400" : "text-pink-500/80"}`}
        />
      );
    }
    if (ext === "json" || ext === "config") {
      return (
        <FileJson
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-amber-400" : "text-amber-500/80"}`}
        />
      );
    }
    if (ext === "sql") {
      return (
        <Database
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-violet-400" : "text-violet-500/80"}`}
        />
      );
    }
    if (ext === "md") {
      return (
        <FileText
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-emerald-400" : "text-emerald-500/80"}`}
        />
      );
    }
    return (
      <File className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-zinc-200" : "text-zinc-500"}`} />
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderNode = (node: ProjectFileNode, depth = 0) => {
    const isSearchActive = filterText.trim().length > 0;
    const matchesSearch =
      node.name.toLowerCase().includes(filterText.toLowerCase()) ||
      node.path.toLowerCase().includes(filterText.toLowerCase());

    if (isSearchActive && node.type === "file" && !matchesSearch) {
      return null;
    }

    if (node.type === "directory") {
      const isOpen = isSearchActive ? true : !!openFolders[node.path];
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id} className="select-none dir-ltr">
          <button
            type="button"
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition font-mono group"
            style={{ paddingLeft: `${depth * 10 + 6}px` }}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
            )}
            <span className="truncate group-hover:text-amber-200 transition-colors">
              {node.name}
            </span>
          </button>

          {isOpen && hasChildren && (
            <div className="space-y-0.5">
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const isActive = activeFilePath === node.path;
    const isLoadingThis = loadingFilePath === node.path;

    return (
      <button
        key={node.id}
        type="button"
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ path: node.path, name: node.name, type: "file" }),
          );
          e.dataTransfer.setData("text/plain", node.path);
        }}
        onClick={() => handleFileClick(node)}
        className={`flex items-center justify-between gap-1.5 w-full text-left px-2 py-1 rounded-lg text-xs font-mono transition group dir-ltr cursor-grab active:cursor-grabbing ${
          isActive
            ? "bg-violet-600/20 text-violet-200 font-bold border border-violet-500/40 shadow-xs"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
        }`}
        style={{ paddingLeft: `${depth * 10 + 16}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {isLoadingThis ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400 shrink-0" />
          ) : (
            getFileIcon(node.name, isActive)
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.size ? (
          <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 shrink-0">
            {formatFileSize(node.size)}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#121215] rounded-2xl border border-zinc-800/80 p-3 shadow-2xl select-none min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
        <h3 className="text-xs font-black text-zinc-200 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          مستكشف الملفات (Project Explorer)
        </h3>
        <button
          type="button"
          onClick={() => refetchTree()}
          title="إعادة الفحص"
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
        >
          <RefreshCw className={`h-3 w-3 ${loadingTree ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative mb-2">
        <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="بحث في ملفات المشروع..."
          className="w-full bg-[#18181c] border border-zinc-800 rounded-xl pl-8 pr-2.5 py-1 text-[11px] text-zinc-200 outline-none focus:border-violet-500/50 font-mono"
        />
      </div>

      {/* Stats Counter Bar */}
      <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/50 mb-2 text-[10px] text-zinc-400 font-mono">
        <span className="flex items-center gap-1">
          <HardDrive className="h-3 w-3 text-cyan-400" />
          Files loaded: <strong className="text-cyan-300">{totalFiles}</strong>
        </span>
        <span>
          Folders: <strong className="text-amber-400">{totalFolders}</strong>
        </span>
      </div>

      {/* Tree View Section */}
      <div className="flex-1 overflow-y-auto space-y-0.5 dir-ltr pr-1">
        {loadingTree ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            <span className="text-xs text-zinc-400 font-medium">Scanning project structure...</span>
          </div>
        ) : projectTree.length === 0 ? (
          <div className="text-center py-10 text-xs text-zinc-500 font-mono">
            لا توجد ملفات متوفرة
          </div>
        ) : (
          projectTree.map((node) => renderNode(node))
        )}
      </div>

      {/* Download Codebase Footer Button matching Lovable IDE */}
      <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-col gap-1.5 dir-ltr">
        {activeFilePath && (
          <div className="text-[10px] text-zinc-400 font-mono truncate">
            <span className="truncate text-violet-300 font-semibold">{activeFilePath}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([JSON.stringify(projectTree, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "noqta-codebase-manifest.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="w-full py-1.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-xs font-bold text-zinc-200 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
          <span>Download codebase</span>
        </button>
      </div>
    </div>
  );
}
