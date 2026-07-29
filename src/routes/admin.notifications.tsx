import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, ShoppingBag, Cpu, AlertTriangle, ShieldCheck, Check } from "lucide-react";
import {
  getNotificationsFn,
  markNotificationReadFn,
  AdminNotification,
} from "@/services/notification.service";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "مركز الإشعارات والتنبيهات — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNotificationsPage,
});

function AdminNotificationsPage() {
  const getNotifsServerFn = useServerFn(getNotificationsFn);
  const markReadServerFn = useServerFn(markNotificationReadFn);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["admin-notifications-list"],
    queryFn: () => getNotifsServerFn(),
  });

  const handleMarkRead = async (id: string) => {
    await markReadServerFn({ data: { id } });
    await refetch();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Bell className="h-7 w-7 text-violet-500 animate-bounce" />
            مركز الإشعارات والتنبيهات (Notification Center)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            إشعارات حية للطلبات الجديدة، حالة الذكاء الاصطناعي، مخزون المنتجات، وحوادث الأمان.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((n: AdminNotification) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition shadow-xs flex items-start justify-between gap-4 ${
              n.read ? "bg-surface border-border opacity-70" : "bg-surface border-violet-500/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 mt-0.5">
                {n.category === "ORDERS" ? (
                  <ShoppingBag className="h-5 w-5" />
                ) : n.category === "AI_TASKS" ? (
                  <Cpu className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-background border border-border text-muted-foreground">
                    {n.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                <div className="text-[10px] text-zinc-500 font-mono mt-2">
                  {new Date(n.timestamp).toLocaleString("ar-SA")}
                </div>
              </div>
            </div>

            {!n.read && (
              <button
                type="button"
                onClick={() => handleMarkRead(n.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition"
              >
                <Check className="h-3.5 w-3.5" /> تحديد كمقروء
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
