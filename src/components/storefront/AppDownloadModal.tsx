import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, Sparkles, CheckCircle2, Apple } from 'lucide-react';
import { StoreLogo } from './StoreLogo';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--color-surface-1,#ffffff)] border border-[var(--color-border-default,#e5e7eb)] shadow-2xl z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-neutral-600 transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Top Promotional Header */}
          <div className="relative bg-gradient-to-r from-black via-neutral-900 to-black px-6 py-8 text-white text-center">
            <div className="mx-auto mb-3 flex items-center justify-center">
              <StoreLogo variant="icon" className="h-16 w-16 shadow-2xl" />
            </div>
            <span className="inline-block rounded-full bg-[#F93A00] px-3 py-1 text-xs font-black tracking-wider text-white">
              عروض حصرية لمستخدمي التطبيق
            </span>
            <h2 className="mt-2 text-2xl font-black">حمّل تطبيق إندكس ستور</h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-300">
              تصفح فائق السرعة، إشعارات تتبع الشحن المباشرة، وكوبونات حصرية
            </p>
          </div>

          {/* Body with QR Code & Stores */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Promo Code Box */}
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-[#F93A00]/50 bg-[#FFF1EB] p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[#F93A00]" />
                <div>
                  <div className="text-xs font-bold text-neutral-700">خصم 15% على أول طلب من التطبيق</div>
                  <div className="font-mono text-sm font-black text-[#F93A00]">كود: APP15</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-neutral-500">ينسخ تلقائياً</span>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 p-5 border border-neutral-100 dark:border-neutral-800">
              {/* QR representation */}
              <div className="flex flex-col items-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-xl bg-white p-2 shadow-sm border border-neutral-200">
                  <svg className="w-full h-full text-neutral-900" viewBox="0 0 100 100" fill="currentColor">
                    {/* Simplified sharp QR code motif */}
                    <rect x="5" y="5" width="25" height="25" fill="black" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="13" y="13" width="9" height="9" fill="black" />

                    <rect x="70" y="5" width="25" height="25" fill="black" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="78" y="13" width="9" height="9" fill="black" />

                    <rect x="5" y="70" width="25" height="25" fill="black" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    <rect x="13" y="78" width="9" height="9" fill="black" />

                    {/* Data dots */}
                    <rect x="35" y="10" width="6" height="6" />
                    <rect x="45" y="15" width="6" height="6" />
                    <rect x="55" y="10" width="6" height="6" />
                    <rect x="35" y="25" width="6" height="6" />
                    <rect x="45" y="35" width="6" height="6" />
                    <rect x="55" y="30" width="6" height="6" />
                    <rect x="10" y="40" width="6" height="6" />
                    <rect x="20" y="45" width="6" height="6" />
                    <rect x="35" y="50" width="6" height="6" />
                    <rect x="50" y="50" width="6" height="6" />
                    <rect x="65" y="45" width="6" height="6" />
                    <rect x="80" y="40" width="6" height="6" />
                    <rect x="35" y="65" width="6" height="6" />
                    <rect x="45" y="75" width="6" height="6" />
                    <rect x="60" y="70" width="6" height="6" />
                    <rect x="75" y="65" width="6" height="6" />
                    <rect x="85" y="80" width="6" height="6" />
                    <rect x="70" y="85" width="6" height="6" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded bg-[#F93A00] px-1 py-0.5 text-[8px] font-black text-white shadow">
                      INDEXES
                    </span>
                  </div>
                </div>
                <span className="mt-2 text-[11px] font-bold text-neutral-500">امسح الكود بكاميرا الجوال</span>
              </div>

              {/* Download Buttons */}
              <div className="flex-1 w-full space-y-2.5">
                <a
                  href="#android-app"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("تطبيق أندرويد قيد الإطلاق وسيتم إتاحته على متجر Google Play قريباً!");
                  }}
                  className="flex items-center justify-center gap-3 w-full rounded-xl bg-black py-3 px-4 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <div className="text-right leading-tight">
                    <span className="block text-[10px] text-neutral-400 font-normal">تحميل مباشر لنظام</span>
                    <span className="font-black">Google Play (أندرويد)</span>
                  </div>
                </a>

                <a
                  href="#ios-app"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("تطبيق iOS قيد الإطلاق وسيتم إتاحته على متجر Apple App Store قريباً!");
                  }}
                  className="flex items-center justify-center gap-3 w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3 px-4 text-neutral-900 dark:text-white font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-sm"
                >
                  <Apple className="h-4 w-4" />
                  <div className="text-right leading-tight">
                    <span className="block text-[10px] text-neutral-400 font-normal">تحميل مباشر لنظام</span>
                    <span className="font-black">Apple App Store (آيفون)</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>إشعارات الخصومات الخاطفة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>تتبع الشحن أولاً بأول</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>شراء سريع بنقرة واحدة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>دعم فني مباشر على مدار الساعة</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
