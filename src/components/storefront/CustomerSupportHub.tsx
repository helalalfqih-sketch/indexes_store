import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Copy, HelpCircle, MessageCircle, Package, Send, ShoppingCart, X } from "lucide-react";
import type { CartItem, Currency, Product } from "./types";
import { STORE_INFO } from "./constants";
import { formatPrice } from "./currency";

export type SupportContext = "home" | "product" | "cart" | "checkout" | "success" | "account" | "unavailable";

interface CustomerSupportHubProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: SupportContext;
  currentProduct?: Product | null;
  cartItems?: CartItem[];
  currency?: Currency;
  lastOrderRef?: string | null;
  onOpenTracker?: () => void;
  onOpenSearch?: () => void;
}

export const CustomerSupportHub: React.FC<CustomerSupportHubProps> = ({
  isOpen,
  onClose,
  activeContext,
  currentProduct,
  cartItems = [],
  currency = "YER",
  lastOrderRef,
  onOpenTracker,
  onOpenSearch,
}) => {
  const [composerText, setComposerText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const suggestedMessage = useMemo(() => {
    if (activeContext === "product" && currentProduct) {
      return `مرحباً، أريد الاستفسار عن ${currentProduct.name} بسعر ${formatPrice(currentProduct.priceYER, currency)}.`;
    }
    if (activeContext === "unavailable" && currentProduct) {
      return `مرحباً، هل يمكن توفير ${currentProduct.name} أو اقتراح بديل مشابه؟`;
    }
    if (activeContext === "cart" || activeContext === "checkout") {
      const lines = cartItems.slice(0, 5).map((item) => `- ${item.product.name} × ${item.quantity}`);
      return `مرحباً، أحتاج مساعدة بخصوص سلة التسوق الحالية${lines.length ? `:\n${lines.join("\n")}` : "."}`;
    }
    if (activeContext === "account" && lastOrderRef) {
      return `مرحباً، أحتاج مساعدة بخصوص طلبي ${lastOrderRef}.`;
    }
    return "مرحباً، أود الاستفسار عن منتجات وخدمات متجر إندكس.";
  }, [activeContext, cartItems, currency, currentProduct, lastOrderRef]);

  useEffect(() => {
    if (isOpen) setComposerText(suggestedMessage);
  }, [isOpen, suggestedMessage]);

  const openWhatsApp = () => {
    const text = composerText.trim() || suggestedMessage;
    window.open(
      `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const copyMessage = async () => {
    if (!composerText.trim()) return;
    await navigator.clipboard.writeText(composerText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[125] flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className="dir-rtl w-full max-w-lg rounded-[28px] border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-[var(--color-text-primary)]">مركز مساعدة إندكس</h3>
                  <p className="text-xs text-[var(--color-text-secondary)]">مساعدة مرتبطة بما تفعله الآن</p>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="إغلاق" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {onOpenTracker ? (
                <button type="button" onClick={() => { onClose(); onOpenTracker(); }} className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-3 text-xs font-bold text-[var(--color-text-primary)]">
                  <Package className="h-4 w-4 text-blue-400" /> تتبع الطلب
                </button>
              ) : null}
              {onOpenSearch ? (
                <button type="button" onClick={() => { onClose(); onOpenSearch(); }} className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-3 text-xs font-bold text-[var(--color-text-primary)]">
                  <HelpCircle className="h-4 w-4 text-violet-400" /> ابحث عن بديل
                </button>
              ) : null}
            </div>

            {cartItems.length > 0 && (activeContext === "cart" || activeContext === "checkout") ? (
              <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-[var(--color-text-secondary)]">
                <div className="mb-1 flex items-center gap-2 font-bold text-[var(--color-text-primary)]"><ShoppingCart className="h-4 w-4" /> السلة الحالية</div>
                {cartItems.slice(0, 3).map((item) => <div key={item.product.id}>{item.product.name} × {item.quantity}</div>)}
              </div>
            ) : null}

            <textarea
              value={composerText}
              onChange={(event) => setComposerText(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-emerald-500/60"
            />

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={copyMessage} className="flex cursor-pointer items-center justify-center gap-1 rounded-2xl border border-[var(--color-border-default)] px-4 py-3 text-xs font-bold text-[var(--color-text-primary)]">
                <Copy className="h-4 w-4" /> {copied ? "تم النسخ" : "نسخ"}
              </button>
              <button type="button" onClick={openWhatsApp} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-600">
                <Send className="h-4 w-4" /> فتح واتساب
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
