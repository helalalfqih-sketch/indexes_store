import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wallet, TrendingUp, ReceiptText, Percent } from "lucide-react";
import { getStoreEarnings } from "@/lib/store-earnings.functions";
import { StorefrontRealtimeService } from "@/lib/services/storefront-realtime.service";
import { useStoreContext } from "@/components/store/store-shell";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/store/earnings")({
  component: StoreEarningsPage,
});

const TYPE_LABELS: Record<string, { label: string; tone: string }> = {
  order_income: { label: "إيراد طلب", tone: "bg-success/10 text-success" },
  platform_fee: { label: "رسوم المنصّة", tone: "bg-amber-500/10 text-amber-500" },
  refund: { label: "استرجاع", tone: "bg-destructive/10 text-destructive" },
  adjustment: { label: "تسوية", tone: "bg-primary/10 text-primary" },
  subscription_charge: { label: "رسوم اشتراك", tone: "bg-purple-500/10 text-purple-400" },
};

const MONTHS_AR = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];

function StoreEarningsPage() {
  const { can } = useStoreContext();
  const fetchEarnings = useServerFn(getStoreEarnings);
  const earningsQ = useQuery({ queryKey: ["store-earnings"], queryFn: () => fetchEarnings() });

  // Realtime: refresh when an order is delivered/refunded anywhere.
  useEffect(() => {
    const unsub = StorefrontRealtimeService.subscribeFinancial(() => earningsQ.refetch());
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!can("manager")) {
    return (
      <div className="rounded-2xl glass p-10 text-center text-sm text-muted-foreground">
        البيانات المالية متاحة لمالك المتجر ومديره فقط.
      </div>
    );
  }

  const d = earningsQ.data;
  const monthly = d?.summary.monthly ?? [];
  const maxIncome = Math.max(...monthly.map((m) => m.income), 0);

  return (
    <div className="space-y-5 pb-16">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Wallet className="h-6 w-6 text-primary" /> الأرباح
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          تُسجَّل الإيرادات تلقائياً عند تسليم الطلبات — دفتر مالي غير قابل للتعديل
        </p>
      </div>

      {/* Overview */}
      {earningsQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl glass" />
          ))}
        </div>
      ) : !d ? (
        <div className="rounded-2xl glass p-10 text-center text-sm text-muted-foreground">تعذّر تحميل البيانات المالية.</div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "إجمالي المبيعات", value: formatPrice(d.summary.gross), tone: "text-foreground" },
              { label: "رسوم المنصّة", value: formatPrice(d.summary.fees), tone: "text-amber-500" },
              { label: "الاسترجاعات", value: formatPrice(d.summary.refunds), tone: "text-destructive" },
              { label: "صافي الإيرادات", value: formatPrice(d.summary.net), tone: "text-success" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl glass p-4">
                <p className="text-[11px] font-semibold text-muted-foreground">{k.label}</p>
                <p className={`mt-2 truncate text-lg font-black ${k.tone}`}>{k.value}</p>
              </div>
            ))}
          </section>

          {/* Fee rule info */}
          <div className="flex items-center gap-2 rounded-2xl glass p-4 text-xs">
            <Percent className="h-4 w-4 shrink-0 text-primary" />
            {d.feeRule ? (
              <span>
                قاعدة الرسوم السارية:{" "}
                <b>{d.feeRule.type === "percentage" ? `${d.feeRule.value}% من قيمة الطلب` : `${formatPrice(Number(d.feeRule.value))} لكل طلب`}</b>
                {d.feeRule.tenant_id === null && <span className="text-muted-foreground"> (قاعدة المنصّة الافتراضية)</span>}
              </span>
            ) : (
              <span className="text-muted-foreground">لا توجد قاعدة رسوم مفعَّلة حالياً — الإيراد يُسجَّل كاملاً لمتجرك.</span>
            )}
          </div>

          {/* Monthly report */}
          <section className="rounded-2xl glass p-5">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <TrendingUp className="h-4 w-4 text-primary" /> الإيرادات الشهرية (آخر 6 أشهر)
            </h2>
            {maxIncome === 0 ? (
              <div className="mt-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                لا إيرادات مسجَّلة بعد — أول طلب «مكتمل» سيظهر هنا
              </div>
            ) : (
              <div className="mt-4 flex h-36 items-end gap-3">
                {monthly.map((m) => {
                  const [y, mm] = m.month.split("-");
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex w-full flex-1 items-end justify-center gap-1">
                        <div
                          className="w-1/2 rounded-t-md bg-gradient-to-t from-primary to-primary-light"
                          style={{ height: `${Math.max(4, (m.income / maxIncome) * 100)}%` }}
                          title={`مبيعات: ${formatPrice(m.income)}`}
                        />
                        <div
                          className="w-1/3 rounded-t-md bg-success/60"
                          style={{ height: `${Math.max(2, (Math.max(0, m.net) / maxIncome) * 100)}%` }}
                          title={`صافي: ${formatPrice(m.net)}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {MONTHS_AR[Number(mm) - 1]} {y.slice(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Transactions */}
          <section className="rounded-2xl glass p-5 space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-black">
              <ReceiptText className="h-4 w-4 text-primary" /> سجل المعاملات
            </h2>
            {d.transactions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                لا معاملات بعد
              </p>
            ) : (
              <div className="max-h-96 space-y-1.5 overflow-y-auto">
                {d.transactions.map((t) => {
                  const tl = TYPE_LABELS[t.type] ?? { label: t.type, tone: "bg-muted text-muted-foreground" };
                  const negative = t.type === "platform_fee" || t.type === "refund" || t.type === "subscription_charge";
                  return (
                    <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface p-2.5 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-bold ${tl.tone}`}>{tl.label}</span>
                      {t.note && <span className="text-muted-foreground">{t.note}</span>}
                      <span className={`ms-auto font-black ${negative ? "text-destructive" : "text-success"}`}>
                        {negative ? "−" : "+"}{formatPrice(t.amount)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("ar-EG")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
