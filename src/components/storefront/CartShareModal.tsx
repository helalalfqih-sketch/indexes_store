import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Copy, Link, Share2, ShoppingBag, X } from "lucide-react";
import type { CartItem, Product } from "./types";

interface CartShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  catalogProducts: Product[];
  onApplyRecoveredCart: (items: CartItem[], mode: "merge" | "replace") => void;
}

type SharePayload = Array<{ id: string; quantity: number }>;

function encodePayload(items: CartItem[]) {
  const payload: SharePayload = items.map((item) => ({
    id: item.product.id,
    quantity: item.quantity,
  }));
  return window.btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodePayload(token: string): SharePayload | null {
  try {
    const decoded = decodeURIComponent(escape(window.atob(token)));
    const parsed = JSON.parse(decoded) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (item): item is { id: string; quantity: number } =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as { id?: unknown }).id === "string" &&
          Number.isFinite((item as { quantity?: unknown }).quantity),
      )
      .map((item) => ({ id: item.id, quantity: Math.max(1, Math.floor(item.quantity)) }));
  } catch {
    return null;
  }
}

export const CartShareModal: React.FC<CartShareModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  catalogProducts,
  onApplyRecoveredCart,
}) => {
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveredItems, setRecoveredItems] = useState<CartItem[] | null>(null);
  const [recoveryError, setRecoveryError] = useState("");

  if (!isOpen) return null;

  const handleGenerateShareLink = () => {
    if (cartItems.length === 0) return;
    const token = encodePayload(cartItems);
    const url = new URL(window.location.href);
    url.searchParams.set("cart_token", token);
    setGeneratedLink(url.toString());
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleRecover = (event: React.FormEvent) => {
    event.preventDefault();
    setRecoveryError("");
    let token = recoveryInput.trim();
    try {
      if (token.includes("cart_token=")) {
        const url = new URL(token);
        token = url.searchParams.get("cart_token") || "";
      }
    } catch {
      // Raw token input is allowed.
    }

    const payload = decodePayload(token);
    if (!payload?.length) {
      setRecoveredItems(null);
      setRecoveryError("تعذر قراءة رابط السلة.");
      return;
    }

    const catalogMap = new Map(catalogProducts.map((product) => [product.id, product]));
    const items = payload.flatMap((line) => {
      const product = catalogMap.get(line.id);
      return product ? [{ product, quantity: line.quantity }] : [];
    });

    if (!items.length) {
      setRecoveredItems(null);
      setRecoveryError("المنتجات الموجودة في الرابط لم تعد متوفرة في الكتالوج الحالي.");
      return;
    }
    setRecoveredItems(items);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          onClick={(event) => event.stopPropagation()}
          className="dir-rtl relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-5 shadow-2xl sm:p-7"
        >
          <div className="mb-5 flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/15 text-blue-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">حفظ ومشاركة السلة</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">رابط محمول بدون تخزين Firebase</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!recoveredItems ? (
            <div className="space-y-6">
              <div className="space-y-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                  <ShoppingBag className="h-4 w-4 text-blue-400" /> مشاركة سلتك الحالية ({cartItems.length} منتج)
                </h4>
                {!generatedLink ? (
                  <button
                    type="button"
                    onClick={handleGenerateShareLink}
                    disabled={cartItems.length === 0}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#2F6BFF] py-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    إنشاء رابط مشاركة
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input readOnly value={generatedLink} className="dir-ltr min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-black/30 px-3 py-2 text-xs text-blue-300" />
                      <button type="button" onClick={handleCopy} className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "تم النسخ" : "نسخ"}
                      </button>
                    </div>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`شاهد محتويات سلة التسوق الخاصة بي في متجر إندكس:\n${generatedLink}`)}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white">
                      مشاركة عبر واتساب 💬
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-2)] p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
                  <Link className="h-4 w-4 text-emerald-400" /> استعادة سلة عبر الرابط
                </h4>
                <form onSubmit={handleRecover} className="flex items-center gap-2">
                  <input required value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value)} placeholder="الصق رابط السلة هنا..." className="min-w-0 flex-1 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] px-3 py-2.5 text-xs text-[var(--color-text-primary)]" />
                  <button type="submit" className="shrink-0 cursor-pointer rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white">استعادة</button>
                </form>
                {recoveryError ? <p className="text-xs text-rose-400">{recoveryError}</p> : null}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 p-4 text-xs text-emerald-200">
                تم التحقق من {recoveredItems.length} منتج مقابل الكتالوج الحالي.
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {recoveredItems.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between rounded-xl bg-[var(--color-surface-2)] p-3 text-xs">
                    <span className="font-bold text-[var(--color-text-primary)]">{item.product.name}</span>
                    <span className="font-bold text-emerald-400">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { onApplyRecoveredCart(recoveredItems, "merge"); onClose(); }} className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl bg-[#2F6BFF] py-3 text-xs font-bold text-white">
                  <ArrowRight className="h-4 w-4" /> دمج
                </button>
                <button type="button" onClick={() => { onApplyRecoveredCart(recoveredItems, "replace"); onClose(); }} className="flex-1 cursor-pointer rounded-xl bg-purple-600 py-3 text-xs font-bold text-white">استبدال</button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
