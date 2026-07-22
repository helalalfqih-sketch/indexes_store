import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, UserCheck } from "lucide-react";
import { getStoreCustomers } from "@/lib/store-dashboard.functions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/store/customers")({
  component: StoreCustomersPage,
});

function StoreCustomersPage() {
  const fetchCustomers = useServerFn(getStoreCustomers);
  const customersQ = useQuery({ queryKey: ["store-customers"], queryFn: () => fetchCustomers() });
  const customers = customersQ.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Users className="h-6 w-6 text-primary" /> العملاء
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {customersQ.isLoading ? "جارٍ التحميل..." : `${customers.length} عميل — مشتق من طلبات متجرك`}
        </p>
      </div>

      {customersQ.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl glass" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl glass p-10 text-center space-y-2">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-bold">لا عملاء بعد</p>
          <p className="text-xs text-muted-foreground">سيظهر العملاء هنا تلقائياً مع أول الطلبات.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <div key={c.key} className="flex flex-wrap items-center gap-3 rounded-2xl glass p-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                {(c.name || "؟").slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-black">
                  {c.name || "عميل"}
                  {c.registered && (
                    <span title="عميل مسجَّل">
                      <UserCheck className="h-3.5 w-3.5 text-success" />
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground" dir="ltr">{c.phone || "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">الطلبات</p>
                <p className="text-sm font-black">{c.ordersCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">إجمالي الإنفاق</p>
                <p className="text-sm font-black text-primary">{formatPrice(c.totalSpent)}</p>
              </div>
              <div className="hidden text-center sm:block">
                <p className="text-[10px] text-muted-foreground">آخر طلب</p>
                <p className="text-xs font-bold">{new Date(c.lastOrderAt).toLocaleDateString("ar-EG")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
