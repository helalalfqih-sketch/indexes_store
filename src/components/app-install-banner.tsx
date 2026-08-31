import { useState, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X, Download, Smartphone, Share, PlusSquare, MoreVertical, CheckCircle2 } from "lucide-react";
import noqtaLogo from "@/assets/noqta-logo.png";
import { trackEvent } from "@/lib/analytics";
import { useAppearance } from "@/components/appearance-provider";

export function AppInstallBanner() {
  const { settings } = useAppearance();
  const [dismissed, setDismissed] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const dialogId = useId();

  const storeLogo = settings.store_identity?.logoUrl || settings.navigation?.logoUrl || noqtaLogo;
  const storeName = settings.brand_settings?.storeName || settings.navigation?.storeName || "اندكس ستور";

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if user is on iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

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
    trackEvent("click_install_app", { mode: deferredPrompt ? "pwa_prompt" : "guide_modal" });

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDismissed(true);
        localStorage.setItem("noqta:app_banner_dismissed", "1");
      }
      setDeferredPrompt(null);
    } else {
      // Open the custom, interactive PWA Install Guide modal instead of browser alert()
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("noqta:app_banner_dismissed", "1");
  };

  if (dismissed) return null;

  return (
    <>
      <div
        dir="rtl"
        className="relative z-40 bg-gradient-to-r from-[#0c1a29] via-[#112438] to-[#0c1a29] border-b border-primary/30 px-2.5 py-1.5 shadow-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/20 shadow-sm sm:h-10 sm:w-10 sm:rounded-xl">
              <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0 leading-snug">
              <div className="flex items-center gap-1 font-black text-[11px] text-white sm:gap-1.5 sm:text-xs">
                <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                <span>حمّل تطبيق {storeName}</span>
              </div>
                <p className="truncate text-[9px] text-showcase-muted sm:text-[10px]">
                تسوق أسرع · تابع طلباتك · احصل على العروض الحصرية ⚡
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={handleInstallClick}
              aria-label={`تثبيت تطبيق ${storeName}`}
              className="flex min-h-[42px] shrink-0 items-center gap-1 rounded-xl bg-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-brand hover:bg-primary/90 transition active:scale-95 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تثبيت التطبيق</span>
            </button>

            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-showcase-muted hover:bg-white/10 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="إغلاق البانر"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Cinematic PWA Install Guide Modal */}
      {typeof document !== "undefined" && showGuideModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${dialogId}-install-title`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0c1a29] p-6 text-start shadow-2xl space-y-5" dir="rtl">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              aria-label="إغلاق دليل التثبيت"
              className="absolute top-4 end-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition min-h-[44px] min-w-[44px]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-md">
                <img src={storeLogo} alt={storeName} className="h-full w-full object-cover" />
              </div>
              <div>
                <h3 id={`${dialogId}-install-title`} className="text-base font-black text-white">
                  تثبيت تطبيق {storeName} على هاتفك
                </h3>
                <p className="text-xs text-cyan-400 font-semibold">خطوات بسيطة بدون الحاجة لـ المتجر</p>
              </div>
            </div>

            {isIos ? (
              /* iOS Safari Install Steps */
              <div className="space-y-3 rounded-2xl bg-white/5 p-4 border border-white/10 text-xs">
                <p className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-400" /> خطوات التثبيت على آيفون (Safari):
                </p>
                <ol className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-cyan-300">1</span>
                    <span>اضغط على زر **المشاركة** (<Share className="inline h-3.5 w-3.5 text-cyan-400" />) في شريط Safari السفلي.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-cyan-300">2</span>
                    <span>مرّر لأسفل واختر **إضافة إلى الشاشة الرئيسية** (<PlusSquare className="inline h-3.5 w-3.5 text-cyan-400" /> Add to Home Screen).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-cyan-300">3</span>
                    <span>اضغط على **إضافة (Add)** في أعلى اليمين لتثبيت الأيقونة على الشاشة الرئيسية.</span>
                  </li>
                </ol>
              </div>
            ) : (
              /* Android / Chrome Install Steps */
              <div className="space-y-3 rounded-2xl bg-white/5 p-4 border border-white/10 text-xs">
                <p className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-400" /> خطوات التثبيت على أندرويد (Chrome):
                </p>
                <ol className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-cyan-300">1</span>
                    <span>اضغط على زر خيارات المتصفح (<MoreVertical className="inline h-3.5 w-3.5 text-cyan-400" /> ثلاث نقاط) في أعلى الشاشة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-cyan-300">2</span>
                    <span>اختر <strong>إضافة إلى الشاشة الرئيسية</strong> أو <strong>تثبيت التطبيق</strong> (Install app).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-cyan-300">3</span>
                    <span>أكّد التثبيت لتتمكن من فتح التطبيق بضغطة واحدة دائماً.</span>
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowGuideModal(false);
                handleDismiss();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-400 shadow-lg min-h-[44px]"
            >
              <CheckCircle2 className="h-4 w-4" />
              فهمت ذلك، تم التثبيت
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
