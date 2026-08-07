import React from "react";
import { NotificationItem } from "./types";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-right dir-rtl">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#100B1A] border border-gray-800 rounded-[32px] w-full max-w-md p-6 relative shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7B3FFF] text-[28px]">
              notifications
            </span>
            <h3 className="text-xl font-bold text-white">الإشعارات والتنبيهات</h3>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#18112B] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">لا توجد إشعارات حالياً</div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-400 pb-2">
              <span>أحدث التحديثات والعروض</span>
              <button
                onClick={onMarkAllAsRead}
                className="text-[#7B3FFF] hover:underline font-bold"
              >
                تحديد الكل ككمقروء
              </button>
            </div>

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border text-right transition-all ${
                  !n.read ? "bg-[#18112B] border-[#7B3FFF]/50" : "bg-[#120D22] border-gray-800/80"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm text-white">{n.title}</h4>
                  <span className="text-[11px] text-gray-400">{n.time}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
