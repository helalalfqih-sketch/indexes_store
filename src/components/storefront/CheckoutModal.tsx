import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CartItem, Currency, OrderStatus } from "../types";
import { formatPrice } from "../lib/currency";
import { STORE_INFO } from "../data/mockData";
import {
  CustomerProfile,
  SavedAddress,
  getCustomerProfile,
  getGuestDeviceProfile,
  saveGuestDeviceProfile,
  clearGuestDeviceProfile,
  saveCheckoutDraft,
  getCheckoutDraft,
  clearCheckoutDraft,
  normalizePhoneDigits,
  maskPhoneNumber,
} from "../lib/customerProfile";
import { auth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import {
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus,
  Edit2,
  Check,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  couponDiscountPercent: number;
  onOrderPlaced: (order: OrderStatus) => void;
  onOpenOrderTracker?: (orderNumber: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  couponDiscountPercent,
  onOrderPlaced,
  onOpenOrderTracker,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [is402Error, setIs402Error] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<OrderStatus | null>(null);

  // Fixed idempotencyKey for the checkout attempt
  const idempotencyKeyRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: string) =>
          (
            +c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
          ).toString(16),
        ),
  );

  // Profile prefill state
  const [isPrefilled, setIsPrefilled] = useState<boolean>(false);
  const [customerProfile, setCustomerProfile] =
    useState<CustomerProfile | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  // Form Fields
  const [customerName, setCustomerName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [altPhone, setAltPhone] = useState<string>("");
  const [showAltPhone, setShowAltPhone] = useState<boolean>(false);

  const [governorate, setGovernorate] = useState<string>(
    STORE_INFO.governorates[0],
  );
  const [address, setAddress] = useState<string>("");
  const [nearestLandmark, setNearestLandmark] = useState<string>("");
  const [deliveryInstruction, setDeliveryInstruction] = useState<string>("");

  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [rememberDevice, setRememberDevice] = useState<boolean>(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    submitErr?: string;
  }>({});

  // Field refs for error focus & submission caching
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  const submissionCacheRef = useRef<{
    step: 1 | 2 | 3;
    customerName: string;
    phone: string;
    altPhone: string;
    governorate: string;
    address: string;
    nearestLandmark: string;
    deliveryInstruction: string;
    paymentMethod: string;
    rememberDevice: boolean;
  } | null>(null);

  // Load profile & drafts on open
  useEffect(() => {
    if (!isOpen) return;

    setIs402Error(false);
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "10000000-1000-4000-8000-100000000000".replace(
              /[018]/g,
              (c: string) =>
                (
                  +c ^
                  (crypto.getRandomValues(new Uint8Array(1))[0] &
                    (15 >> (+c / 4)))
                ).toString(16),
            );
    }

    // Check if draft exists first and load it
    const draftLoaded = loadGuestProfileOrDraft();

    const currentUser = auth.currentUser;
    if (currentUser) {
      getCustomerProfile(currentUser.uid).then((prof) => {
        if (prof && prof.autofillEnabled !== false) {
          setCustomerProfile(prof);
          // If no draft exists, populate from user profile defaults
          if (!draftLoaded) {
            if (prof.fullName) setCustomerName(prof.fullName);
            if (prof.phone) setPhone(prof.phone);
            if (prof.altPhone) {
              setAltPhone(prof.altPhone);
              setShowAltPhone(true);
            }
            if (prof.preferredGovernorate)
              setGovernorate(prof.preferredGovernorate);
            if (prof.deliveryInstructions)
              setDeliveryInstruction(prof.deliveryInstructions);

            // Default address
            if (prof.addresses && prof.addresses.length > 0) {
              const def =
                prof.addresses.find((a) => a.isDefault) || prof.addresses[0];
              setSelectedAddressId(def.id);
              setGovernorate(def.governorate);
              setAddress(def.address);
              if (def.nearestLandmark) setNearestLandmark(def.nearestLandmark);
            }
          }
          setIsPrefilled(true);
        }
      });
    }
  }, [isOpen]);

  const loadGuestProfileOrDraft = (): boolean => {
    // Check saved draft first
    const draft = getCheckoutDraft();
    if (draft && Object.keys(draft).length > 0) {
      if (
        draft.step &&
        typeof draft.step === "number" &&
        [1, 2, 3].includes(draft.step)
      ) {
        setStep(draft.step as 1 | 2 | 3);
      }
      if (draft.customerName) setCustomerName(draft.customerName as string);
      if (draft.phone) setPhone(draft.phone as string);
      if (draft.altPhone) {
        setAltPhone(draft.altPhone as string);
        setShowAltPhone(true);
      }
      if (draft.governorate) setGovernorate(draft.governorate as string);
      if (draft.address) setAddress(draft.address as string);
      if (draft.nearestLandmark)
        setNearestLandmark(draft.nearestLandmark as string);
      if (draft.deliveryInstruction)
        setDeliveryInstruction(draft.deliveryInstruction as string);
      if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod as string);
      if (typeof draft.rememberDevice === "boolean")
        setRememberDevice(draft.rememberDevice as boolean);
      return true;
    }

    // Check saved guest device profile
    const guest = getGuestDeviceProfile();
    if (guest) {
      if (guest.fullName) setCustomerName(guest.fullName);
      if (guest.phone) setPhone(guest.phone);
      if (guest.altPhone) {
        setAltPhone(guest.altPhone);
        setShowAltPhone(true);
      }
      if (guest.governorate) setGovernorate(guest.governorate);
      if (guest.address) setAddress(guest.address);
      if (guest.nearestLandmark) setNearestLandmark(guest.nearestLandmark);
      if (guest.deliveryInstructions)
        setDeliveryInstruction(guest.deliveryInstructions);
      setRememberDevice(true);
      setIsPrefilled(true);
      return true;
    }

    return false;
  };

  // Persist draft on changes
  useEffect(() => {
    if (!isOpen || placedOrder) return;
    saveCheckoutDraft({
      step,
      customerName,
      phone,
      altPhone,
      governorate,
      address,
      nearestLandmark,
      deliveryInstruction,
      paymentMethod,
      rememberDevice,
    });
  }, [
    step,
    customerName,
    phone,
    altPhone,
    governorate,
    address,
    nearestLandmark,
    deliveryInstruction,
    paymentMethod,
    rememberDevice,
    isOpen,
    placedOrder,
  ]);

  if (!isOpen) return null;

  // Cart Calculations
  const subtotalYER = cartItems.reduce(
    (sum, item) => sum + item.product.priceYER * item.quantity,
    0,
  );
  const isFreeShipping = subtotalYER >= STORE_INFO.freeShippingThresholdYER;
  const shippingFeeYER = isFreeShipping ? 0 : 3000;
  const discountAmountYER = (subtotalYER * couponDiscountPercent) / 100;
  const totalYER = subtotalYER - discountAmountYER + shippingFeeYER;

  // Instruction chips suggestions
  const instructionChips = [
    "اتصل قبل الوصول",
    "التسليم لي شخصياً",
    "التسليم لشخص آخر",
    "تجنب الاتصال في وقت محدد",
  ];

  // Address Selection handler
  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setGovernorate(addr.governorate);
    setAddress(addr.address);
    if (addr.nearestLandmark) setNearestLandmark(addr.nearestLandmark);
    if (addr.recipientPhone) setPhone(addr.recipientPhone);
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: { name?: string; phone?: string } = {};
    const cleanPhone = normalizePhoneDigits(phone).replace(/[^\d]/g, "");

    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.name = "يرجى إدخال الاسم الكامل الثلاثي";
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      errs.phone = "يرجى إدخال رقم هاتف صحيحة من 8 أرقام على الأقل";
    }

    setErrors(errs);
    if (errs.name && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (errs.phone && phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
    return Object.keys(errs).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs: { address?: string } = {};
    if (!address.trim() || address.trim().length < 5) {
      errs.address = "يرجى إدخال عنوان التفصيلي للتوصيل (الشارع والحي)";
    }
    setErrors((prev) => ({ ...prev, ...errs }));
    if (errs.address && addressInputRef.current) {
      addressInputRef.current.focus();
    }
    return Object.keys(errs).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || is402Error) return; // Prevent duplicate submission or retry on 402

    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setIs402Error(false);
    setErrors({});

    // Ensure fixed idempotencyKey for this attempt
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "10000000-1000-4000-8000-100000000000".replace(
              /[018]/g,
              (c: string) =>
                (
                  +c ^
                  (crypto.getRandomValues(new Uint8Array(1))[0] &
                    (15 >> (+c / 4)))
                ).toString(16),
            );
    }

    // Cache input data in React state ref and localStorage draft before async operation
    const currentInputData = {
      step,
      customerName,
      phone,
      altPhone,
      governorate,
      address,
      nearestLandmark,
      deliveryInstruction,
      paymentMethod,
      rememberDevice,
    };
    submissionCacheRef.current = currentInputData;
    saveCheckoutDraft(currentInputData);

    try {
      const currentUser = auth.currentUser;
      const orderNum = `IND-${Math.floor(100000 + Math.random() * 900000)}`;

      let paymentLabel = "الدفع عند الاستلام (نقداً)";
      if (paymentMethod === "kuraimi") paymentLabel = "حساب بنك الكريمي (حاسب)";
      if (paymentMethod === "jawalpay")
        paymentLabel = "محفظة جوال بي / وان كاش";
      if (paymentMethod === "transfer")
        paymentLabel = "حوالة صرافة (النجم / المميز)";

      const fullAddressText = nearestLandmark
        ? `${address} (أقرب معلم: ${nearestLandmark})`
        : address;

      const orderData: Omit<OrderStatus, "id"> = {
        orderNumber: orderNum,
        customerName: customerName.trim(),
        phone: normalizePhoneDigits(phone).trim(),
        governorate,
        address: fullAddressText,
        items: cartItems.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.priceYER,
        })),
        totalPriceYER: totalYER,
        status: "received",
        statusLabel: "تم استلام طلبك بنجاح! جاري التجهيز 📦",
        date: new Date().toLocaleDateString("ar-YE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        paymentMethod: paymentLabel,
      };

      // Get Supabase session token if available
      let authToken = "";
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          authToken = sessionData.session.access_token;
        }
      } catch (e) {
        // ignore session retrieval error
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Submit order via POST /api/orders
      const response = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          customerName: customerName.trim(),
          customerPhone: normalizePhoneDigits(phone).trim(),
          customerAddress: fullAddressText,
          notes: deliveryInstruction || undefined,
          paymentProvider: paymentMethod,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok || !resData.orderId) {
        const errObj = new Error(
          resData.error || `حدث خطأ أثناء إنشاء الطلب (${response.status})`,
        ) as Error & {
          status?: number;
        };
        errObj.status = response.status;
        throw errObj;
      }

      const docId = resData.orderId;

      const createdOrder: OrderStatus = {
        id: docId,
        ...orderData,
      };

      // Handle guest device save option
      if (rememberDevice && !currentUser) {
        saveGuestDeviceProfile({
          fullName: customerName,
          phone,
          altPhone,
          governorate,
          address,
          nearestLandmark,
          deliveryInstructions: deliveryInstruction,
          rememberDevice: true,
        });
      }

      // Clear checkout draft and cache
      submissionCacheRef.current = null;
      clearCheckoutDraft();

      // Reset idempotencyKey for subsequent distinct checkout attempts
      idempotencyKeyRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "10000000-1000-4000-8000-100000000000".replace(
              /[018]/g,
              (c: string) =>
                (
                  +c ^
                  (crypto.getRandomValues(new Uint8Array(1))[0] &
                    (15 >> (+c / 4)))
                ).toString(16),
            );

      setPlacedOrder(createdOrder);
      // Confirmed success: notify parent and clear cart
      onOrderPlaced(createdOrder);
    } catch (err: unknown) {
      console.error("Order submission failed:", err);

      const errObj = err as {
        status?: number;
        statusCode?: number;
        response?: { status?: number };
        message?: string;
      } | null;
      const status =
        errObj?.status || errObj?.statusCode || errObj?.response?.status;
      const message = String(errObj?.message || err || "");
      const is402 =
        status === 402 ||
        message.includes("402") ||
        message.toLowerCase().includes("payment required");

      if (is402) {
        setIs402Error(true);
        // Do NOT clear cart; retain items and present non-retryable message
        setErrors({
          submitErr:
            "خطأ 402 (الدفع مطلوب): يتطلب إتمام العملية الدفع أولاً. لا يمكن إعادة المحاولة.",
        });
      } else {
        // Ensure cached input data is preserved and re-saved in case of network failure
        if (submissionCacheRef.current) {
          const cached = submissionCacheRef.current;
          setCustomerName(cached.customerName);
          setPhone(cached.phone);
          setAltPhone(cached.altPhone);
          setGovernorate(cached.governorate);
          setAddress(cached.address);
          setNearestLandmark(cached.nearestLandmark);
          setDeliveryInstruction(cached.deliveryInstruction);
          setPaymentMethod(cached.paymentMethod);
          setRememberDevice(cached.rememberDevice);
          setStep(cached.step);
          saveCheckoutDraft(cached);
        }
        setErrors({
          submitErr:
            message ||
            "حدث خطأ في الاتصال أثناء إرسال الطلب. بياناتك محفوظة بالكامل ويمكنك إعادة المحاولة الآن.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsappMsg = (order: OrderStatus) => {
    const itemsText = order.items
      .map((i) => `• ${i.productName} (الكمية: ${i.quantity})`)
      .join("\n");

    return encodeURIComponent(
      `🛍️ *طلب جديد من متجر إندكس*\n` +
        `رقم الطلب: *${order.orderNumber}*\n\n` +
        `👤 *الاسم:* ${order.customerName}\n` +
        `📱 *الهاتف:* ${order.phone}\n` +
        `📍 *المحافظة:* ${order.governorate}\n` +
        `🏠 *العنوان:* ${order.address}\n` +
        `💳 *طريقة الدفع:* ${order.paymentMethod}\n\n` +
        `📦 *المنتجات:*\n${itemsText}\n\n` +
        `💰 *الإجمالي النهائي:* ${formatPrice(order.totalPriceYER, currency)}\n` +
        `شكراً لكم!`,
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md dir-rtl overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ type: "spring", damping: 25, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--color-surface-1)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-[28px] sm:rounded-[32px] w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar p-5 sm:p-7 relative shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-default)] mb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-[#2F6BFF]/10 text-[#2F6BFF]">
                <Truck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--color-text-primary)]">
                  {placedOrder
                    ? "تم تأكيد طلبك بنجاح"
                    : "إتمام الطلب والتوصيل السريع"}
                </h3>
                <span className="text-[11px] text-[var(--color-text-secondary)] font-medium block">
                  {placedOrder
                    ? "تفاصيل ومعلومات المتابعة"
                    : "3 خطوات مريحة وبدون تعقيد"}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>

          {placedOrder ? (
            /* Order Success View */
            <div className="text-center py-4 space-y-4 my-auto">
              <div className="w-16 h-16 bg-emerald-500/15 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">
                تم تسجيل طلبك بنجاح! 🎉
              </h3>
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm">
                رقم الطلب الخاص بك هو:{" "}
                <strong className="text-[#2F6BFF] bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 px-3 py-1 rounded-xl text-base font-mono font-extrabold dir-ltr inline-block">
                  {placedOrder.orderNumber}
                </strong>
              </p>

              <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] text-right text-xs space-y-2 text-[var(--color-text-secondary)] shadow-inner">
                <p>
                  <strong className="text-[var(--color-text-primary)]">
                    الاسم:
                  </strong>{" "}
                  {placedOrder.customerName}
                </p>
                <p>
                  <strong className="text-[var(--color-text-primary)]">
                    المحافظة:
                  </strong>{" "}
                  {placedOrder.governorate}
                </p>
                <p>
                  <strong className="text-[var(--color-text-primary)]">
                    العنوان:
                  </strong>{" "}
                  {placedOrder.address}
                </p>
                <p>
                  <strong className="text-[var(--color-text-primary)]">
                    طريقة الدفع:
                  </strong>{" "}
                  {placedOrder.paymentMethod}
                </p>
                <p className="text-sm font-bold text-[#2F6BFF] pt-2 border-t border-[var(--color-border-subtle)] flex justify-between items-center">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-base font-black">
                    {formatPrice(placedOrder.totalPriceYER, currency)}
                  </span>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {onOpenOrderTracker && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrderTracker(placedOrder.orderNumber);
                    }}
                    className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all text-xs sm:text-sm cursor-pointer"
                  >
                    <span>فتح طلبي والتتبع المباشر</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                <a
                  href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${getWhatsappMsg(placedOrder)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all text-xs sm:text-sm cursor-pointer"
                >
                  <span>إرسال تفاصيل الطلب عبر واتساب</span>
                  <Phone className="w-4 h-4" />
                </a>

                <button
                  onClick={onClose}
                  className="w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] font-bold py-3 rounded-2xl border border-[var(--color-border-default)] transition-all text-xs cursor-pointer"
                >
                  متابعة التسوق
                </button>
              </div>
            </div>
          ) : (
            /* Guided Step Checkout Form */
            <div className="space-y-4 text-right">
              {/* Step Progress Bar */}
              <div className="flex items-center justify-between p-2 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border-default)] text-xs font-bold mb-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    step === 1
                      ? "bg-[#2F6BFF] text-white shadow-sm"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                    1
                  </span>
                  <span>التواصل</span>
                </button>

                <div className="w-4 h-0.5 bg-[var(--color-border-default)]" />

                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(2)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    step === 2
                      ? "bg-[#2F6BFF] text-white shadow-sm"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                    2
                  </span>
                  <span>التوصيل</span>
                </button>

                <div className="w-4 h-0.5 bg-[var(--color-border-default)]" />

                <button
                  type="button"
                  onClick={() =>
                    validateStep1() && validateStep2() && setStep(3)
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    step === 3
                      ? "bg-[#2F6BFF] text-white shadow-sm"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-black">
                    3
                  </span>
                  <span>التأكيد</span>
                </button>
              </div>

              {/* Prefill Banner */}
              {isPrefilled && (
                <div className="bg-[#2F6BFF]/10 border border-[#2F6BFF]/30 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-[#2F6BFF]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>استخدمنا بيانات حسابك لتسريع الطلب</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrefilled(false);
                      setCustomerName("");
                      setPhone("");
                      setAddress("");
                    }}
                    className="text-[10px] text-[var(--color-text-secondary)] hover:underline font-semibold cursor-pointer"
                  >
                    إلغاء التعبئة
                  </button>
                </div>
              )}

              {/* STEP 1: CONTACT DETAILS */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                      الاسم الكامل *
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      autoComplete="name"
                      inputMode="text"
                      required
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.name)
                          setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="أدخل اسمك الثلاثي"
                      className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] outline-none transition-all placeholder-[var(--color-text-muted)]"
                    />
                    {errors.name && (
                      <p className="text-rose-400 text-[11px] mt-1 font-bold">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                      رقم الهاتف (الواتساب للتأكيد) *
                    </label>
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      autoComplete="tel"
                      inputMode="numeric"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone)
                          setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="771234567"
                      className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] outline-none dir-ltr text-right transition-all placeholder-[var(--color-text-muted)] font-mono"
                    />
                    {errors.phone && (
                      <p className="text-rose-400 text-[11px] mt-1 font-bold">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Optional Alt Phone Toggle */}
                  {!showAltPhone ? (
                    <button
                      type="button"
                      onClick={() => setShowAltPhone(true)}
                      className="text-[11px] text-[#2F6BFF] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة هاتف بديل (اختياري)</span>
                    </button>
                  ) : (
                    <div>
                      <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                        رقم هاتف بديل (اختياري)
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={altPhone}
                        onChange={(e) => setAltPhone(e.target.value)}
                        placeholder="731234567"
                        className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none dir-ltr text-right font-mono"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNextToStep2}
                    className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all text-xs sm:text-sm cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    <span>التالي: العنوان والتوصيل</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: ADDRESS & DELIVERY */}
              {step === 2 && (
                <div className="space-y-3">
                  {/* Saved Addresses list if available */}
                  {customerProfile?.addresses &&
                    customerProfile.addresses.length > 0 && (
                      <div>
                        <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
                          اختر عنواناً محفوظاً لتسريع الطلب:
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                          {customerProfile.addresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                selectedAddressId === addr.id
                                  ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold"
                                  : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                              }`}
                            >
                              <div>
                                <span className="font-extrabold block text-xs">
                                  {addr.label === "منزل" ? "🏠" : "💼"}{" "}
                                  {addr.label} ({addr.governorate})
                                </span>
                                <span className="text-[10px] text-[var(--color-text-muted)] truncate block max-w-[240px]">
                                  {addr.address}
                                </span>
                              </div>
                              {selectedAddressId === addr.id && (
                                <Check className="w-4 h-4 text-[#2F6BFF]" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                      المحافظة *
                    </label>
                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full h-11 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] outline-none cursor-pointer font-medium"
                    >
                      {STORE_INFO.governorates.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                      العنوان التفصيلي (الشارع والحي) *
                    </label>
                    <textarea
                      ref={addressInputRef}
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address)
                          setErrors((prev) => ({
                            ...prev,
                            address: undefined,
                          }));
                      }}
                      placeholder="مثال: صنعاء - شارع حدة - حي حداء"
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-3 text-xs sm:text-sm text-[var(--color-text-primary)] focus:border-[#2F6BFF] outline-none transition-all placeholder-[var(--color-text-muted)] resize-none"
                    />
                    {errors.address && (
                      <p className="text-rose-400 text-[11px] mt-1 font-bold">
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1">
                      أقرب معلم بارز (اختياري)
                    </label>
                    <input
                      type="text"
                      value={nearestLandmark}
                      onChange={(e) => setNearestLandmark(e.target.value)}
                      placeholder="مثال: بجانب مركز صخر / خلف صيدلية ابن حيان"
                      className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3.5 text-xs text-[var(--color-text-primary)] focus:border-[#2F6BFF] outline-none"
                    />
                  </div>

                  {/* Delivery instructions chips */}
                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-[11px] font-bold mb-1.5">
                      تعليمات خاصة بالتوصيل:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {instructionChips.map((chip) => (
                        <button
                          type="button"
                          key={chip}
                          onClick={() =>
                            setDeliveryInstruction(
                              deliveryInstruction === chip ? "" : chip,
                            )
                          }
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            deliveryInstruction === chip
                              ? "bg-[#2F6BFF] text-white border-[#2F6BFF]"
                              : "bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold py-3 rounded-2xl border border-[var(--color-border-default)] text-xs cursor-pointer"
                    >
                      السابق
                    </button>
                    <button
                      type="button"
                      onClick={handleNextToStep3}
                      className="w-2/3 bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold py-3 rounded-2xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>التالي: المراجعة والدفع</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & CONFIRM */}
              {step === 3 && (
                <form onSubmit={handleSubmitOrder} className="space-y-3">
                  {/* Summary Card */}
                  <div className="bg-[var(--color-surface-2)] p-3.5 rounded-2xl border border-[var(--color-border-default)] text-xs space-y-2 text-[var(--color-text-secondary)]">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border-subtle)] font-bold text-[var(--color-text-primary)]">
                      <span>ملخص المستلم والشحن</span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[10px] text-[#2F6BFF] hover:underline"
                      >
                        تعديل
                      </button>
                    </div>

                    <p>
                      <strong className="text-[var(--color-text-primary)]">
                        العميل:
                      </strong>{" "}
                      {customerName} ({phone})
                    </p>
                    <p>
                      <strong className="text-[var(--color-text-primary)]">
                        العنوان:
                      </strong>{" "}
                      {governorate} - {address}
                    </p>
                    {deliveryInstruction && (
                      <p>
                        <strong className="text-[var(--color-text-primary)]">
                          تعليمات:
                        </strong>{" "}
                        {deliveryInstruction}
                      </p>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[var(--color-text-secondary)] text-xs font-bold mb-1.5">
                      طريقة الدفع المناسبة:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          paymentMethod === "cash"
                            ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <span className="font-bold text-xs block">
                          💵 عند الاستلام
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          نقداً للمندوب
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("kuraimi")}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          paymentMethod === "kuraimi"
                            ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <span className="font-bold text-xs block">
                          🏦 بنك الكريمي
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          حاسب / إيداع
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("jawalpay")}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          paymentMethod === "jawalpay"
                            ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <span className="font-bold text-xs block">
                          📱 جوال بي / وان كاش
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          محفظة إلكترونية
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("transfer")}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                          paymentMethod === "transfer"
                            ? "border-[#2F6BFF] bg-[#2F6BFF]/10 text-[var(--color-text-primary)] font-bold"
                            : "border-[var(--color-border-default)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <span className="font-bold text-xs block">
                          ✉️ حوالة صرافة
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          النجم / المميز
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Guest remember device option */}
                  {!auth.currentUser && (
                    <div className="bg-[var(--color-surface-2)] p-2.5 rounded-xl border border-[var(--color-border-default)]">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--color-text-primary)] font-bold">
                        <input
                          type="checkbox"
                          checked={rememberDevice}
                          onChange={(e) => setRememberDevice(e.target.checked)}
                          className="w-4 h-4 rounded text-[#2F6BFF]"
                        />
                        <span>
                          تذكّر بياناتي على هذا الجهاز لتسريع طلبي القادم
                        </span>
                      </label>
                      <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                        سيتم حفظ اسمك وهاتفك محلياً على هذا الجهاز لتسهيل الطلب
                        المرة القادمة.
                      </p>
                    </div>
                  )}

                  {/* Total summary price banner */}
                  <div className="bg-[var(--color-surface-2)] p-3.5 rounded-2xl border border-[var(--color-border-default)] flex justify-between items-center text-xs sm:text-sm font-bold text-[var(--color-text-primary)] shadow-sm">
                    <span>المبلغ الإجمالي النهائي:</span>
                    <span className="text-[#2F6BFF] text-lg font-black">
                      {formatPrice(totalYER, currency)}
                    </span>
                  </div>

                  {errors.submitErr && (
                    <p className="text-rose-400 text-xs font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      {errors.submitErr}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] font-bold py-3.5 rounded-2xl border border-[var(--color-border-default)] text-xs cursor-pointer"
                    >
                      السابق
                    </button>
                    {is402Error ? (
                      <div className="w-2/3 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold py-3.5 px-2 rounded-2xl text-center text-xs flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>تعذر إعادة المحاولة (HTTP 402)</span>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>جاري تسجيل ونقل طلبك...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تأكيد وإرسال الطلب نهائياً</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
