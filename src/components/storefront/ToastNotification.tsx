import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4 dir-rtl">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`w-full p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-xl ${
              toast.type === "success"
                ? "bg-[#0d1f18]/90 border-emerald-500/40 text-emerald-200"
                : toast.type === "error"
                  ? "bg-[#210d12]/90 border-rose-500/40 text-rose-200"
                  : "bg-[#0d1627]/90 border-blue-500/40 text-blue-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
              <span className="text-xs sm:text-sm font-bold">{toast.message}</span>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
