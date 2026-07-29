import React from "react";
import { Sparkles, ExternalLink, Home, Search, ShoppingBag, User } from "lucide-react";

interface GleamDevicePreviewProps {
  activeRoute?: string;
  projectName?: string;
}

export function GleamDevicePreview({
  activeRoute = "/",
  projectName = "INDEXES - SHOWCASE",
}: GleamDevicePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Action Strip Above Phone */}
      <div className="flex items-center gap-2 flex-wrap justify-center text-xs font-bold">
        <button
          type="button"
          className="px-3 py-1.5 rounded-2xl bg-white/80 border border-white/90 shadow-md text-slate-700 hover:bg-white transition flex items-center gap-1"
        >
          Previews ⌄
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-2xl bg-white/80 border border-white/90 shadow-md text-slate-700 hover:bg-white transition flex items-center gap-1"
        >
          Deploy <ExternalLink className="h-3 w-3 text-purple-600" />
        </button>
        <button
          type="button"
          className="px-3 py-1.5 rounded-2xl bg-white/80 border border-white/90 shadow-md text-slate-700 hover:bg-white transition"
        >
          Homepage
        </button>
        <span className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-purple-500 text-white shadow-md flex items-center gap-1">
          <Sparkles className="h-3 w-3 fill-current" /> السياحة
        </span>
      </div>

      {/* Realistic Smartphone Frame Mockup */}
      <div className="relative w-[280px] h-[520px] bg-slate-950 rounded-[45px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-white/20 overflow-hidden flex flex-col justify-between">
        {/* Dynamic Island / iPhone Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 ml-auto mr-2" />
        </div>

        {/* Screen Area */}
        <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-[35px] overflow-hidden flex flex-col justify-between pt-7 pb-2 text-white">
          {/* Header */}
          <div className="text-center pt-2 px-3">
            <span className="text-[9px] tracking-widest text-slate-400 font-mono uppercase">
              {projectName}
            </span>
            <h4 className="text-xs font-black mt-1 text-slate-100">كوكب المنتجات</h4>
            <p className="text-[9px] text-slate-400 mt-0.5">
              برز واستكشف - كل وجه منتج اضغط للفنحة.
            </p>
          </div>

          {/* 3D Product Sphere Graphic Simulation */}
          <div className="relative my-auto flex items-center justify-center py-4">
            <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-1 shadow-2xl shadow-purple-500/30 animate-pulse">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-3 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-1 border border-purple-500/30">
                  <Sparkles className="h-6 w-6 text-purple-300" />
                </div>
                <span className="text-[10px] font-bold text-slate-200">Product planet</span>
              </div>
            </div>
          </div>

          {/* Bottom App Navigation Bar */}
          <div className="mx-2 p-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-around text-[9px] text-slate-400">
            <div className="flex flex-col items-center gap-0.5 text-purple-400">
              <Home className="h-3.5 w-3.5" />
              <span>الرئيسية</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 hover:text-white transition">
              <Search className="h-3.5 w-3.5" />
              <span>الاستكشاف</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 hover:text-white transition">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>السلة</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 hover:text-white transition">
              <User className="h-3.5 w-3.5" />
              <span>حسابي</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
