import React, { useState } from "react";
import { MessageCircle, Phone, X, Sparkles, Send, ShieldCheck } from "lucide-react";

export const FloatingWhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [quickMsg, setQuickMsg] = useState("");

  const whatsappNumber = "967771370740";

  const sendWhatsAppMsg = (text?: string) => {
    const message =
      text || quickMsg || "السلام عليكم، أود الاستفسار عن المنتجات متوفرة في متجر إندكس";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-50 flex flex-col items-start gap-2 selection:bg-emerald-500 selection:text-white">
      {/* Expanded Quick Contact Card */}
      {isOpen && (
        <div className="bg-[#0b081a]/90 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 w-[290px] sm:w-[320px] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(37,211,102,0.25)] text-right animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-gray-800/60 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <h4 className="text-white font-bold text-xs sm:text-sm">دعم متجر إندكس</h4>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>متصل الآن - جاهز للمساعدة</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                <MessageCircle className="w-5 h-5 fill-emerald-500/30" />
              </div>
            </div>
          </div>

          {/* Preset Quick Actions */}
          <div className="space-y-2 mb-3">
            <button
              onClick={() => sendWhatsAppMsg("السلام عليكم، أريد الاستفسار عن كروت وشحن الألعاب")}
              className="w-full text-right bg-[#15102a]/80 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl p-2.5 text-xs text-gray-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-[-2px] transition-transform" />
              <span>🎮 استفسار عن كروت وشحن الألعاب</span>
            </button>

            <button
              onClick={() => sendWhatsAppMsg("السلام عليكم، أود تتبع طلبي أو الاستفسار عن الشحن")}
              className="w-full text-right bg-[#15102a]/80 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl p-2.5 text-xs text-gray-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-[-2px] transition-transform" />
              <span>📦 تتبع شحنة أو طلب سابق</span>
            </button>

            <button
              onClick={() => sendWhatsAppMsg("السلام عليكم، أريد طلب منتج خاص غير موجود بالمتجر")}
              className="w-full text-right bg-[#15102a]/80 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl p-2.5 text-xs text-gray-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>✨ طلب منتج خاص أو كمية تجارية</span>
            </button>
          </div>

          {/* Custom Message Input */}
          <div className="flex items-center gap-1.5 bg-[#080512] border border-gray-700/80 rounded-xl p-1.5">
            <button
              onClick={() => sendWhatsAppMsg()}
              className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors cursor-pointer shrink-0"
              title="إرسال عبر واتساب"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              value={quickMsg}
              onChange={(e) => setQuickMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendWhatsAppMsg()}
              placeholder="اكتب رسالتك مباشرة..."
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 text-right focus:outline-none px-1"
            />
          </div>

          {/* Direct Call & Info */}
          <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400">
            <a
              href={`tel:${whatsappNumber}`}
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>اتصال مباشر: {whatsappNumber}</span>
            </a>
            <div className="flex items-center gap-1 text-gray-400">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>دعم مؤمن 100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Icon Button */}
      <div className="relative group">
        {!isOpen && (
          <div className="hidden sm:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#0d091f]/90 backdrop-blur-md border border-emerald-500/40 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>تواصل معنا عبر واتساب</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="تواصل عبر واتساب"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#1ebd59] via-[#25D366] to-[#34e775] text-white flex items-center justify-center shadow-[0_0_25px_rgba(37,211,102,0.6)] hover:shadow-[0_0_35px_rgba(37,211,102,0.9)] hover:scale-105 active:scale-95 transition-all cursor-pointer z-10 border-2 border-white/20"
        >
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          ) : (
            <div className="relative flex items-center justify-center">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white/20 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
