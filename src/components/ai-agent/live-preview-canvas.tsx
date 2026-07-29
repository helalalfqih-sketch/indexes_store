import React, { useState } from "react";
import {
  ExternalLink,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles,
} from "lucide-react";

interface LivePreviewCanvasProps {
  activeRoute?: string;
  buildPassed?: boolean;
  buildSummary?: string;
  isBuilding?: boolean;
  onRefresh?: () => void;
}

export function LivePreviewCanvas({
  activeRoute = "/",
  buildPassed = true,
  buildSummary = "Build validated cleanly with 0 errors.",
  isBuilding = false,
  onRefresh,
}: LivePreviewCanvasProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [currentPath, setCurrentPath] = useState(activeRoute);
  const [iframeKey, setIframeKey] = useState(0);

  const handleManualRefresh = () => {
    setIframeKey((prev) => prev + 1);
    if (onRefresh) onRefresh();
  };

  const getContainerWidth = () => {
    if (deviceView === "mobile") return "max-w-[375px]";
    if (deviceView === "tablet") return "max-w-[768px]";
    return "w-full";
  };

  const targetUrl =
    typeof window !== "undefined" ? `${window.location.origin}${currentPath}` : currentPath;

  return (
    <div className="flex flex-col h-full bg-[#121215] rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-[#16161a]">
        {/* Route URL Selector & Status */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Globe className="h-4 w-4 text-violet-400 shrink-0" />
          <div className="flex items-center gap-1.5 bg-[#1f1f24] border border-zinc-800 rounded-xl px-2.5 py-1 text-xs font-mono text-zinc-200 flex-1 max-w-md">
            <span className="text-zinc-500 shrink-0">https://app</span>
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              className="bg-transparent border-none outline-none text-zinc-100 w-full font-mono"
            />
          </div>

          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
              buildPassed
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {buildPassed ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
            )}
            <span>{buildPassed ? "Live Preview Ready" : "Build Error"}</span>
          </div>
        </div>

        {/* Viewport & Controls */}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <div className="flex items-center bg-[#1f1f24] border border-zinc-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setDeviceView("desktop")}
              className={`p-1 rounded-lg text-xs transition ${
                deviceView === "desktop"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Desktop View"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("tablet")}
              className={`p-1 rounded-lg text-xs transition ${
                deviceView === "tablet"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Tablet View"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceView("mobile")}
              className={`p-1 rounded-lg text-xs transition ${
                deviceView === "mobile"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Mobile View"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            className="p-1.5 rounded-xl border border-zinc-800 bg-[#1f1f24] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
            title="Refresh Preview"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isBuilding ? "animate-spin text-violet-400" : ""}`}
            />
          </button>

          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-xl border border-zinc-800 bg-[#1f1f24] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
            title="Open in New Tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Build Validation Banner */}
      <div className="px-3 py-1 bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
        <span className="truncate flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-violet-400" />
          {buildSummary}
        </span>
        <span className="text-zinc-500">Auto-Reload Active</span>
      </div>

      {/* iFrame Preview Container */}
      <div className="flex-1 bg-[#09090b] flex items-center justify-center p-2 overflow-auto">
        <div
          className={`h-full transition-all duration-300 ${getContainerWidth()} border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl bg-background`}
        >
          <iframe
            key={iframeKey}
            src={targetUrl}
            title="NOQTA Live Preview Canvas"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
}
