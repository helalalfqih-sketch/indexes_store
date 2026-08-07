import React, { useState } from "react";
import { OrderStatus, Currency } from "./types";
import { formatPrice } from "./currency";

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allOrders: OrderStatus[];
  currency: Currency;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  allOrders,
  currency,
}) => {
  const [orderNumInput, setOrderNumInput] = useState("");
  const [phoneLast4Input, setPhoneLast4Input] = useState("");
  const [foundOrder, setFoundOrder] = useState<OrderStatus | null>(null);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);

    const cleanOrderNum = orderNumInput.trim().toUpperCase();
    const cleanPhone4 = phoneLast4Input.trim();

    const match = allOrders.find((ord) => {
      const matchNum = ord.orderNumber.toUpperCase().includes(cleanOrderNum);
      const matchPhone = cleanPhone4 ? ord.phone.endsWith(cleanPhone4) : true;
      return matchNum && matchPhone;
    });

    setFoundOrder(match || null);
  };

  const statusSteps = [
    { key: "received", label: "تم استلام الطلب", icon: "receipt" },
    { key: "processing", label: "قيد التجهيز", icon: "inventory_2" },
    { key: "shipped", label: "تم الشحن", icon: "local_shipping" },
    { key: "out_for_delivery", label: "جاري التوصيل", icon: "two_wheeler" },
    { key: "delivered", label: "تم التسليم", icon: "verified" },
  ];

  const getStepIndex = (status: OrderStatus["status"]) => {
    switch (status) {
      case "received":
        return 0;
      case "processing":
        return 1;
      case "shipped":
        return 2;
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#100B1A] border border-gray-800 rounded-[32px] w-full max-w-lg p-6 sm:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar text-right dir-rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7B3FFF] text-[28px]">package_2</span>
            <span>تتبع طلبك</span>
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#18112B] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3 mb-6">
          <div>
            <label className="block text-gray-300 text-xs font-bold mb-1">
              رقم الطلب (مثال: IND-8921)
            </label>
            <input
              type="text"
              required
              value={orderNumInput}
              onChange={(e) => setOrderNumInput(e.target.value)}
              placeholder="IND-8921"
              className="w-full bg-[#18112B] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white uppercase outline-none focus:border-[#7B3FFF] text-right"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-bold mb-1">
              آخر 4 أرقام من رقم الهاتف
            </label>
            <input
              type="text"
              maxLength={4}
              value={phoneLast4Input}
              onChange={(e) => setPhoneLast4Input(e.target.value)}
              placeholder="مثال: 4567"
              className="w-full bg-[#18112B] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#7B3FFF] dir-ltr text-right"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#7B3FFF] hover:bg-[#9A66FF] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#7B3FFF]/30 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            <span>بحث وتتبع</span>
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
        </form>

        {/* Search Result */}
        {searched && (
          <div>
            {foundOrder ? (
              <div className="bg-[#18112B] p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <div>
                    <span className="text-gray-400 text-xs block">رقم الطلب</span>
                    <strong className="text-[#FFB800] text-lg font-bold dir-ltr inline-block">
                      {foundOrder.orderNumber}
                    </strong>
                  </div>
                  <div className="text-left">
                    <span className="text-gray-400 text-xs block">تاريخ الطلب</span>
                    <span className="text-gray-200 text-xs">{foundOrder.date}</span>
                  </div>
                </div>

                <div className="bg-[#100B1A] p-3 rounded-xl border border-gray-800/80">
                  <span className="text-xs text-gray-400 block mb-1">حالة الطلب الحالية:</span>
                  <span className="text-[#7B3FFF] font-bold text-sm">{foundOrder.statusLabel}</span>
                </div>

                {/* Progress Steps */}
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-gray-300 mb-3">مراحل التوصيل:</h4>
                  <div className="space-y-3">
                    {statusSteps.map((step, idx) => {
                      const currentIdx = getStepIndex(foundOrder.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                              isCompleted
                                ? "bg-[#7B3FFF] border-[#7B3FFF] text-white shadow-sm"
                                : "bg-[#18112B] border-gray-800 text-gray-500"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {step.icon}
                            </span>
                          </div>

                          <div className="flex-grow flex justify-between items-center">
                            <span
                              className={`text-xs font-semibold ${
                                isCurrent
                                  ? "text-[#FFB800] font-bold text-sm"
                                  : isCompleted
                                    ? "text-white"
                                    : "text-gray-500"
                              }`}
                            >
                              {step.label}
                            </span>
                            {isCompleted && <span className="text-green-400 text-xs">✓ مكتمل</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-800 text-xs text-gray-300 space-y-1">
                  <p>
                    <strong>العميل:</strong> {foundOrder.customerName}
                  </p>
                  <p>
                    <strong>العنوان:</strong> {foundOrder.governorate} - {foundOrder.address}
                  </p>
                  <p>
                    <strong>الإجمالي:</strong> {formatPrice(foundOrder.totalPriceYER, currency)}
                  </p>
                </div>

                <a
                  href={`https://wa.me/967771370740?text=${encodeURIComponent(
                    `السلام عليكم، أود الاستفسار عن حالة طلبي رقم ${foundOrder.orderNumber}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-all mt-2"
                >
                  <span>استفسار مباشر مع خدمة العملاء عبر واتساب</span>
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                </a>
              </div>
            ) : (
              <div className="bg-[#18112B] p-6 rounded-2xl border border-gray-800 text-center text-gray-400 text-xs space-y-2">
                <span className="material-symbols-outlined text-[40px] text-gray-600">
                  search_off
                </span>
                <p className="font-bold text-white text-sm">لم نتمكن من العثور على هذا الطلب</p>
                <p>تأكد من إدخال رقم الطلب بصورة صحيحة (مثال: IND-8921).</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
