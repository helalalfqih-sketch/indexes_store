import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import noqtaLogo from "@/assets/noqta-logo.png";
import { trackEvent } from "@/lib/analytics";

export function AppInstallBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if dismissed before
    const isDismissed = localStorage.getItem("noqta:app_banner_dismissed") === "1";
    if (!isDismissed) {
      setDismissed(false);
    }

    // Listen for PWA Install Prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    trackEvent("click_install_app", { mode: deferredPrompt ? "pwa_prompt" : "direct" });

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDismissed(true);
        localStorage.setItem("noqta:app_banner_dismissed", "1");
      }
      setDeferredPrompt(null);
    } else {
      // Direct action/info if PWA prompt is not available
      alert("لتحميل وتثبيت التطبيق على هافتك:\nاضغط خيارات المتصفح (⋮) ثم اختر 'إضافة إلى الشاشة الرئيسية' (Add to Home Screen).");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("noqta:app_banner_dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <div
      dir="rtl"
      className="relative z-40 bg-gradient-to-r from-[#0c1a29] via-[#112438] to-[#0c1a29] border-b border-primary/30 px-3 py-2.5 shadow-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-sm">
            <img src={noqtaLogo} alt="Indexes Store App" className="h-full w-full object-cover" />
          </div>

          <div className="leading-snug">
            <div className="flex items-center gap-1.5 font-black text-xs text-white">
              <Smartphone className="h-3.5 w-3.5 text-neon" />
              <span>حمّل تطبيق اندكس ستور (NOQTA)</span>
            </div>
            <p className="text-[10px] text-showcase-muted">
              تسوق أسرع · تابع طلباتك · احصل على العروض الحصرية ⚡
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-brand hover:bg-primary/90 transition active:scale-95 shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>تحميل التطبيق</span>
          </button>

          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-showcase-muted hover:bg-white/10 hover:text-white transition"
            aria-label="إغلاق البانر"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
