import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Phone,
  X,
  BookOpen,
  Send,
  Sparkles,
  Upload,
  Check,
} from "lucide-react";
import { OrderStatus, Product, CartItem, Currency } from "./types";
import { formatPrice } from "./currency";
import { STORE_INFO } from "./constants";
import {
  prepareReorderItems,
  getVerifiedCompatibleAccessories,
  submitSupportTicket,
} from "@/lib/orderSelfService";

interface PostPurchaseHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderStatus | null;
  catalogProducts: Product[];
  onAddToCart: (item: CartItem) => void;
  currency?: Currency;
}

export const PostPurchaseHubModal: React.FC<PostPurchaseHubModalProps> = ({
  isOpen,
  onClose,
  order,
  catalogProducts,
  onAddToCart,
  currency = "YER",
}) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "reorder" | "support" | "guides">(
    "timeline",
  );

  // Support form state
  const [issueType, setIssueType] = useState<
    "product_defect" | "wrong_item" | "delivery_delay" | "general_query"
  >("product_defect");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Reorder status state
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const compatibleAccessories = getVerifiedCompatibleAccessories(
    order.items.map((i) => i.productName),
    catalogProducts,
  );

  const handleReorder = () => {
    const { availableItems, outOfStockItems, priceChanges } = prepareReorderItems(
      order.items,
      catalogProducts,
    );

    if (availableItems.length === 0) {
      setReorderNotice("عذراً، جميع منتجات هذا الطلب غير متوفرة في المخزون حالياً.");
      return;
    }

    availableItems.forEach((item) => onAddToCart(item));

    let msg = `تمت إضافة ${availableItems.length} منتج إلى سلة التسوق بنجاح!`;
    if (priceChanges.length > 0) {
      msg += ` تنبيه: تغيرت أسعار بعض المنتجات حسب تحديثات المتجر الجديدة.`;
    }
    if (outOfStockItems.length > 0) {
      msg += ` (تعذر إضافة: ${outOfStockItems.join(", ")})`;
    }
    setReorderNotice(msg);
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupport(true);

    await submitSupportTicket(
      order.id,
      order.orderNumber,
      order.customerName,
      order.phone,
      issueType,
      subject,
      message,
      attachmentFileName ? `attached_${attachmentFileName}` : undefined,
    );

    setIsSubmittingSupport(false);
    setSupportSuccess(true);
    setSubject("");
    setMessage("");
    setAttachmentFileName("");
  };

  const getStepStatus = (step: "received" | "processing" | "shipped" | "delivered") => {
    const statusOrder = ["received", "processing", "shipped", "out_for_delivery", "delivered"];
    const currentIndex = statusOrder.indexOf(order.status);

    let stepIndex = 0;
    if (step === "received") stepIndex = 0;
    if (step === "processing") stepIndex = 1;
    if (step === "shipped") stepIndex = 2;
    if (step === "delivered") stepIndex = 4;

    if (currentIndex >= stepIndex) return "completed";
    return "pending";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-[28px] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl dir-rtl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2F6BFF]/15 border border-[#2F6BFF]/30 flex items-center justify-center text-[#2F6BFF]">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--color-text-primary)]">
                  مركز خدمات ما بعد الشراء #{order.orderNumber}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  تتبع الشحنة، الضمان، وتكرار الطلب بسهولة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6 p-1 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)]">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "timeline"
                  ? "bg-[#2F6BFF] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Truck className="w-4 h-4" /> تتبع الشحنة
            </button>

            <button
              onClick={() => setActiveTab("reorder")}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "reorder"
                  ? "bg-[#2F6BFF] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <RefreshCw className="w-4 h-4" /> تكرار الطلب
            </button>

            <button
              onClick={() => setActiveTab("guides")}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "guides"
                  ? "bg-[#2F6BFF] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-4 h-4" /> الدليل والضمان
            </button>

            <button
              onClick={() => setActiveTab("support")}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "support"
                  ? "bg-[#2F6BFF] text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> الدعم والبلاغات
            </button>
          </div>

          {/* Tab 1: Interactive Timeline & Order Details */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              {/* Order Status Badge */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    حالة الطلب المباشرة
                  </span>
                  <div className="text-base font-extrabold text-white">{order.statusLabel}</div>
                  <div className="text-xs text-gray-400 mt-0.5">تاريخ الطلب: {order.date}</div>
                </div>

                <a
                  href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن حالة طلبي رقم #${order.orderNumber}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4" /> استفسار واتساب
                </a>
              </div>

              {/* Progress Stepper */}
              <div className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)]">
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-4">
                  مسار شحنتك المباشر
                </h4>
                <div className="relative flex items-center justify-between">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-800 -translate-y-1/2 -z-0" />

                  {/* Step 1: Received */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        getStepStatus("received") === "completed"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-300">استلام الطلب</span>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        getStepStatus("processing") === "completed"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-300">تجهيز الشحنة</span>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        getStepStatus("shipped") === "completed"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-300">قيد الشحن 🛵</span>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        getStepStatus("delivered") === "completed"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-800 text-gray-500"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-300">تم التسليم 🎉</span>
                  </div>
                </div>
              </div>

              {/* Items & Shipping summary */}
              <div className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-3">
                <h4 className="text-xs font-bold text-[var(--color-text-secondary)]">
                  محتويات الشحنة
                </h4>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[var(--color-text-primary)]">
                          {item.productName}
                        </span>
                        <span className="text-gray-400 mr-2">x{item.quantity}</span>
                      </div>
                      <span className="font-bold text-emerald-400">
                        {formatPrice(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--color-border-default)] flex items-center justify-between text-sm font-extrabold text-[var(--color-text-primary)]">
                  <span>الإجمالي الكلي النهائي:</span>
                  <span className="text-blue-400 text-base">
                    {formatPrice(order.totalPriceYER, currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Reorder */}
          {activeTab === "reorder" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
                يمكنك إعادة شراء نفس المنتجات بنقرة واحدة. نقوم بالتحقق التلقائي من الأسعار والكميات
                المتوفرة بالمخزون قبل الإضافة.
              </div>

              {reorderNotice && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{reorderNotice}</span>
                </div>
              )}

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-primary)]">
                        {item.productName}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        الكمية السابقة: {item.quantity}
                      </div>
                    </div>

                    <div className="text-sm font-bold text-emerald-400">
                      {formatPrice(item.price, currency)}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleReorder}
                className="w-full py-3.5 rounded-2xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> تأكيد وتكرار الطلب إلى السلة
              </button>

              {/* Compatible Accessories */}
              {compatibleAccessories.length > 0 && (
                <div className="pt-4 border-t border-[var(--color-border-default)]">
                  <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> إكسسوارات متوافقة مع طلبك
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {compatibleAccessories.map((acc) => (
                      <div
                        key={acc.id}
                        className="p-3 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center gap-3"
                      >
                        <img
                          src={acc.image}
                          alt={acc.name}
                          className="w-12 h-12 object-contain rounded-xl bg-black/20 p-1"
                        />
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                            {acc.name}
                          </div>
                          <div className="text-xs text-emerald-400 font-bold">
                            {formatPrice(acc.priceYER, currency)}
                          </div>
                          <button
                            onClick={() => onAddToCart({ product: acc, quantity: 1 })}
                            className="mt-1 text-[10px] font-bold text-blue-400 hover:underline cursor-pointer"
                          >
                            + إضافة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Guides & Warranty */}
          {activeTab === "guides" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>الضمان والاستبدال</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  استفسر من خدمة العملاء عن شروط الضمان والاستبدال الخاصة بطلبك.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border-default)] space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <BookOpen className="w-5 h-5" />
                  <span>إرشادات الاستخدام والتعليمات</span>
                </div>
                <ul className="text-xs text-[var(--color-text-secondary)] space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    شحن الساعات الذكية والسماعات بكرت شحن أصلي بقدرة 5V/1A لتجنب تلف البطارية.
                  </li>
                  <li>عدم استخدام الساعات في المياه الساخنة أو السونا.</li>
                  <li>احتفظ بكرتون المنتج وفاتورة الطلب للرجوع إلى تفاصيل الطلب.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 4: Support & Report Issue */}
          {activeTab === "support" && (
            <div className="space-y-4">
              {supportSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <div className="text-base font-extrabold text-white">تم رفع بلاغك بنجاح!</div>
                  <p className="text-xs text-emerald-200">
                    سيقوم فريق خدمة العملاء بمراجعة تذكرتك والتواصل معك مباشرة على الرقم{" "}
                    {order.phone}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                      نوع البلاغ أو المشكلة
                    </label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as unknown as typeof issueType)}
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="product_defect" className="bg-gray-900">
                        خلل مصنعي / مشكلة في المنتج
                      </option>
                      <option value="wrong_item" className="bg-gray-900">
                        استلام منتج مختلف عن الطلب
                      </option>
                      <option value="delivery_delay" className="bg-gray-900">
                        تأخير في موعد التسليم
                      </option>
                      <option value="general_query" className="bg-gray-900">
                        استفسار عام حول الطلب
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                      عنوان الموضوع *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: السماعة لا تعمل بعد الشحن"
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                      تفاصيل المشكلة *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="اكتب شرحاً مفصلاً للمشكلة لمساعدتنا في معالجتها فوراً..."
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 text-xs text-[var(--color-text-primary)] focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--color-text-secondary)] mb-1">
                      إرفاق صورة للمشكلة (اختياري)
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-surface-2)] cursor-pointer hover:border-blue-500 transition-colors">
                      <Upload className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-gray-300">
                        {attachmentFileName || "اختر صورة من جهازك"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAttachmentFileName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSupport}
                    className="w-full py-3.5 rounded-2xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> إرسال البلاغ لخدمة العملاء
                  </button>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
