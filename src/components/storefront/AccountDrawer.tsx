import React from "react";
import { Currency, OrderStatus } from "./types";
import { formatPrice } from "./currency";

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  userOrders: OrderStatus[];
  favoritesCount: number;
  onOpenWishlist: () => void;
  onOpenTracker: () => void;
  onOpenAdmin?: () => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCurrency,
  userOrders,
  favoritesCount,
  onOpenWishlist,
  onOpenTracker,
  onOpenAdmin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn text-right dir-rtl">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-[#100B1A] border-r border-gray-800 h-full flex flex-col justify-between p-6 shadow-2xl relative overflow-y-auto no-scrollbar">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7B3FFF] border-2 border-white/20 flex items-center justify-center text-white text-xl font-bold shadow-md">
                👤
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">حسابي في إندكس</h3>
                <span className="text-xs text-gray-400">عميل متجر إندكس المتميز</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#18112B] border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Admin Panel Entry Point */}
          {onOpenAdmin && (
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="w-full mb-5 bg-[#18112B] hover:bg-[#201838] border border-gray-800 p-4 rounded-2xl flex items-center justify-between text-white transition-all shadow-md cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <div className="text-right">
                  <span className="font-bold text-sm block">لوحة تحكم الأدمن</span>
                  <span className="text-[11px] text-gray-400">
                    إدارة المنتجات، الطلبات، والكتالوج
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#7B3FFF] text-[20px] transition-colors">
                chevron_left
              </span>
            </button>
          )}

          {/* Currency Switcher */}
          <div className="bg-[#18112B] p-4 rounded-2xl border border-gray-800 mb-5">
            <span className="text-xs font-bold text-gray-400 block mb-2.5">عملة عرض الأسعار:</span>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                onClick={() => onSelectCurrency("YER")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  currency === "YER"
                    ? "bg-[#7B3FFF] border-[#7B3FFF] text-white shadow-md"
                    : "bg-[#100B1A] border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                ريال يمني (YER)
              </button>

              <button
                onClick={() => onSelectCurrency("SAR")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  currency === "SAR"
                    ? "bg-[#7B3FFF] border-[#7B3FFF] text-white shadow-md"
                    : "bg-[#100B1A] border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                ريال سعودي (SAR)
              </button>

              <button
                onClick={() => onSelectCurrency("USD")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-[#7B3FFF] border-[#7B3FFF] text-white shadow-md"
                    : "bg-[#100B1A] border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                دولار (USD $)
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => {
                onClose();
                onOpenWishlist();
              }}
              className="w-full bg-[#18112B] hover:bg-[#201838] border border-gray-800 p-4 rounded-2xl flex items-center justify-between text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500 text-[24px]">
                  favorite
                </span>
                <span className="font-bold text-sm">المفضلة</span>
              </div>
              <span className="bg-rose-500/15 text-rose-400 text-xs font-bold px-3 py-1 rounded-full border border-rose-500/30">
                {favoritesCount} منتجات
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenTracker();
              }}
              className="w-full bg-[#18112B] hover:bg-[#201838] border border-gray-800 p-4 rounded-2xl flex items-center justify-between text-white transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#7B3FFF] text-[24px]">
                  package_2
                </span>
                <span className="font-bold text-sm">تتبع طلباتي</span>
              </div>
              <span className="material-symbols-outlined text-gray-500 text-[20px]">
                chevron_left
              </span>
            </button>
          </div>

          {/* Order History */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 mb-3">سجل طلباتي السابقة:</h4>
            {userOrders.length === 0 ? (
              <div className="bg-[#18112B] p-4 rounded-2xl border border-gray-800 text-center text-xs text-gray-500">
                لا توجد طلبات مسجلة حالياً
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                {userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-[#18112B] p-3.5 rounded-2xl border border-gray-800 text-xs text-right space-y-1.5"
                  >
                    <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                      <strong className="text-amber-400 dir-ltr inline-block font-bold">
                        {ord.orderNumber}
                      </strong>
                      <span className="text-gray-500 text-[11px]">{ord.date}</span>
                    </div>

                    <p className="text-gray-400">
                      <strong>الحالة:</strong>{" "}
                      <span className="text-[#7B3FFF] font-bold">{ord.statusLabel}</span>
                    </p>

                    <p className="text-gray-400">
                      <strong>الإجمالي:</strong> {formatPrice(ord.totalPriceYER, currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Store Location Footer */}
        <div className="pt-4 border-t border-gray-800 text-xs text-gray-400 space-y-1 text-center">
          <p className="font-bold text-white">متجر إندكس INDEXES STORE</p>
          <p>صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية</p>
          <p className="text-green-400 font-bold dir-ltr">واتساب: 967771370740</p>
        </div>
      </div>
    </div>
  );
};
