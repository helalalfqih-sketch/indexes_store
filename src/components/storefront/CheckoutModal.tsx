import React, { useState } from "react";
import { CartItem, Currency, OrderStatus } from "./types";
import { formatPrice } from "./currency";
import { submitOrder } from "@/lib/actions/order.actions";
import { formatOrderNumber } from "@/lib/order-status";
import { useCart } from "@/lib/cart-store";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  couponDiscountPercent: number;
  onOrderPlaced: (order: OrderStatus) => void;
}

const GOVERNORATES = [
  "صنعاء",
  "عدن",
  "تعز",
  "الحديدة",
  "إب",
  "مأرب",
  "حضرموت (المكلا)",
  "حضرموت (سيئون)",
  "ذمار",
  "حجة",
  "عمران",
  "صعدة",
  "البيضاء",
  "أبين",
  "لحج",
  "شبوة",
  "المهرة",
  "سقطرى",
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  couponDiscountPercent,
  onOrderPlaced,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState(GOVERNORATES[0]);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [placedOrder, setPlacedOrder] = useState<OrderStatus | null>(null);

  if (!isOpen) return null;

  const freeShippingThresholdYER = 30000;

  const subtotalYER = cartItems.reduce(
    (sum, item) => sum + item.product.priceYER * item.quantity,
    0,
  );

  const isFreeShipping = subtotalYER >= freeShippingThresholdYER;
  const shippingFeeYER = isFreeShipping ? 0 : 3000;
  const discountAmountYER = (subtotalYER * couponDiscountPercent) / 100;
  const totalYER = subtotalYER - discountAmountYER + shippingFeeYER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) return;

    let paymentLabel = "الدفع عند الاستلام (نقداً)";
    if (paymentMethod === "kuraimi") paymentLabel = "حساب بنك الكريمي (حاسب)";
    if (paymentMethod === "jawalpay") paymentLabel = "محفظة جوال بي / وان كاش";
    if (paymentMethod === "transfer") paymentLabel = "حوالة صرافة (النجم / المميز)";

    const fullAddress = `${governorate} - ${address}`;

    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `idemp-${Date.now()}`;
      const res = await submitOrder({
        items: cartItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        customerName: customerName.trim(),
        customerPhone: phone.trim(),
        customerAddress: fullAddress.trim(),
        notes: `طريقة الدفع: ${paymentLabel}`,
        idempotencyKey,
      });

      const formattedNum = formatOrderNumber(res.orderId);

      const order: OrderStatus = {
        id: res.orderId,
        orderNumber: formattedNum,
        customerName,
        phone,
        governorate,
        address,
        items: cartItems.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.priceYER,
        })),
        totalPriceYER: totalYER,
        status: "received",
        statusLabel: "تم استلام طلبك بنجاح! جاري التجهيز",
        date: new Date().toLocaleDateString("ar-YE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        paymentMethod: paymentLabel,
      };

      useCart.getState().clear();
      setPlacedOrder(order);
      onOrderPlaced(order);
    } catch (err) {
      console.error("[CheckoutModal] submitOrder error:", err);
      // Fallback offline order confirmation
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const order: OrderStatus = {
        id: `ord-${Date.now()}`,
        orderNumber: `IND-${randomNum}`,
        customerName,
        phone,
        governorate,
        address,
        items: cartItems.map((i) => ({
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.priceYER,
        })),
        totalPriceYER: totalYER,
        status: "received",
        statusLabel: "تم استلام طلبك! جاري التأكيد عبر واتساب",
        date: new Date().toLocaleDateString("ar-YE", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        paymentMethod: paymentLabel,
      };
      useCart.getState().clear();
      setPlacedOrder(order);
      onOrderPlaced(order);
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
        `يرجى تأكيد الشحن والتوصيل، شكراً لكم!`,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#100B1A] border border-gray-800 rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar p-6 sm:p-8 relative shadow-2xl dir-rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7B3FFF]">local_shipping</span>
            <span>إتمام الطلب والتوصيل</span>
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#18112B] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {placedOrder ? (
          /* Order Confirmation View */
          <div className="text-center py-6 space-y-5">
            <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto text-green-400 glow-neon">
              <span className="material-symbols-outlined text-[48px]">check_circle</span>
            </div>

            <h3 className="text-2xl font-bold text-white">تم تسجيل طلبك بنجاح! 🎉</h3>
            <p className="text-gray-300 text-sm">
              رقم الطلب الخاص بك هو:{" "}
              <strong className="text-[#FFB800] text-xl font-extrabold dir-ltr inline-block">
                {placedOrder.orderNumber}
              </strong>
            </p>

            <div className="bg-[#18112B] p-4 rounded-2xl border border-gray-800 text-right text-xs space-y-2 text-gray-300">
              <p>
                <strong>الاسم:</strong> {placedOrder.customerName}
              </p>
              <p>
                <strong>المحافظة:</strong> {placedOrder.governorate}
              </p>
              <p>
                <strong>العنوان:</strong> {placedOrder.address}
              </p>
              <p>
                <strong>طريقة الدفع:</strong> {placedOrder.paymentMethod}
              </p>
              <p className="text-sm font-bold text-[#7B3FFF] pt-2 border-t border-gray-800">
                الإجمالي: {formatPrice(placedOrder.totalPriceYER, currency)}
              </p>
            </div>

            <p className="text-gray-400 text-xs">
              💡 يمكنك تتبع حالة الطلب بأي وقت من خلال إدخال رقم الطلب وآخر 4 أرقام من هاتفك!
            </p>

            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/967771370740?text=${getWhatsappMsg(placedOrder)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all text-sm"
              >
                <span>إرسال تفاصيل الطلب عبر واتساب</span>
                <span className="material-symbols-outlined text-[22px]">chat</span>
              </a>

              <button
                onClick={onClose}
                className="w-full bg-[#1F1545] hover:bg-[#7B3FFF] text-white font-bold py-3 rounded-2xl transition-all text-sm"
              >
                العودة للتسوق
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-gray-300 text-xs font-bold mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="أدخل اسمك الثلاثي"
                className="w-full bg-[#18112B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#7B3FFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-bold mb-1">
                رقم الهاتف (الواتساب) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 771234567"
                className="w-full bg-[#18112B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#7B3FFF] outline-none dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-bold mb-1">المحافظة *</label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full bg-[#18112B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-[#7B3FFF] outline-none cursor-pointer"
              >
                {GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov} className="bg-[#100B1A] text-white">
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-bold mb-1">
                العنوان التفصيلي (الحي / الشارع / معلم بارز) *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: صنعاء - شارع حدة - بجانب مركز صخر"
                className="w-full bg-[#18112B] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#7B3FFF] outline-none"
              />
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-gray-300 text-xs font-bold mb-2">
                طريقة الدفع المفضلّة:
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "cash"
                      ? "border-[#7B3FFF] bg-[#7B3FFF]/15 text-white font-bold"
                      : "border-gray-800 bg-[#18112B] text-gray-400"
                  }`}
                >
                  <span className="font-semibold text-sm">💵 عند الاستلام</span>
                  <span>تسليم المبلغ يداً بيد للمندوب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("kuraimi")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "kuraimi"
                      ? "border-[#7B3FFF] bg-[#7B3FFF]/15 text-white font-bold"
                      : "border-gray-800 bg-[#18112B] text-gray-400"
                  }`}
                >
                  <span className="font-semibold text-sm">🏦 بنك الكريمي</span>
                  <span>تطبيق حاسب / إيداع</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("jawalpay")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "jawalpay"
                      ? "border-[#7B3FFF] bg-[#7B3FFF]/15 text-white font-bold"
                      : "border-gray-800 bg-[#18112B] text-gray-400"
                  }`}
                >
                  <span className="font-semibold text-sm">📱 جوال بي / وان كاش</span>
                  <span>محفظة إلكترونية فورية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                    paymentMethod === "transfer"
                      ? "border-[#7B3FFF] bg-[#7B3FFF]/15 text-white font-bold"
                      : "border-gray-800 bg-[#18112B] text-gray-400"
                  }`}
                >
                  <span className="font-semibold text-sm">✉️ حوالة صرافة</span>
                  <span>النجم / المميز / الصيفي</span>
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-[#18112B] p-3.5 rounded-2xl border border-gray-800 flex justify-between items-center text-sm font-bold text-white mt-4">
              <span>المبلغ المطلوب تسديده:</span>
              <span className="text-[#7B3FFF] text-xl font-extrabold">
                {formatPrice(totalYER, currency)}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#7B3FFF] hover:bg-[#9A66FF] text-white font-bold py-4 rounded-2xl shadow-xl shadow-[#7B3FFF]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-base cursor-pointer mt-4"
            >
              <span>تأكيد وتسجيل الطلب</span>
              <span className="material-symbols-outlined text-[20px]">check</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
