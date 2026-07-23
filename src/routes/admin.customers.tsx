import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Search,
  Loader2,
  ShoppingBag,
  Phone,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTenantOrders } from "@/lib/orders-admin.functions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orders_count: number;
  total_spend: number;
  last_order_date: string;
};

function buildCustomersFromOrders(orders: any[]): Customer[] {
  const map = new Map<string, Customer>();
  for (const o of orders) {
    const phone = o.customer_phone || "غير متوفر";
    if (!map.has(phone)) {
      map.set(phone, {
        id: phone,
        name: o.customer_name || "—",
        phone,
        email: o.customer_email || undefined,
        orders_count: 0,
        total_spend: 0,
        last_order_date: o.created_at,
      });
    }
    const c = map.get(phone)!;
    c.orders_count++;
    c.total_spend += Number(o.total) || 0;
    if (new Date(o.created_at) > new Date(c.last_order_date)) {
      c.last_order_date = o.created_at;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total_spend - a.total_spend);
}

function CustomersPage() {
  const [search, setSearch] = useState("");

  const ordersQ = useQuery({
    queryKey: ["admin-orders-for-customers"],
    queryFn: () => listTenantOrders({ data: { limit: 100, offset: 0 } }),
  });

  const customers = buildCustomersFromOrders(ordersQ.data?.rows ?? []).filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const totalRevenue = customers.reduce((a, c) => a + c.total_spend, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            العملاء
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customers.length} عميل · إجمالي المبيعات {formatPrice(totalRevenue)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black text-primary">{customers.length}</div>
          <div className="text-xs text-muted-foreground">إجمالي العملاء</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black">
            {customers.reduce((a, c) => a + c.orders_count, 0)}
          </div>
          <div className="text-xs text-muted-foreground">إجمالي الطلبات</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 text-center">
          <div className="text-2xl font-black text-success">{formatPrice(totalRevenue)}</div>
          <div className="text-xs text-muted-foreground">إجمالي المبيعات</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="w-full rounded-xl border border-border bg-surface pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {ordersQ.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-start font-bold text-muted-foreground">العميل</th>
                <th className="px-4 py-3 text-start font-bold text-muted-foreground">الهاتف</th>
                <th className="px-4 py-3 text-start font-bold text-muted-foreground">الطلبات</th>
                <th className="px-4 py-3 text-start font-bold text-muted-foreground">المشتريات</th>
                <th className="px-4 py-3 text-start font-bold text-muted-foreground">آخر طلب</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد بيانات عملاء بعد. ستظهر هنا بعد استلام أول طلب.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 hover:bg-accent/30 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold">{c.name}</div>
                      {c.email && (
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-bold">{c.orders_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {formatPrice(c.total_spend)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(c.last_order_date).toLocaleDateString("ar-YE")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
