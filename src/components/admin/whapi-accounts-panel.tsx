import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleOff, QrCode, RefreshCw, RotateCcw, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  getWhapiAccountQr,
  listWhapiAccounts,
  logoutWhapiAccount,
  reconnectWhapiAccount,
} from "@/lib/whapi-accounts.functions";

export function WhapiAccountsPanel() {
  const queryClient = useQueryClient();
  const listAccountsFn = useServerFn(listWhapiAccounts);
  const getQrFn = useServerFn(getWhapiAccountQr);
  const reconnectFn = useServerFn(reconnectWhapiAccount);
  const logoutFn = useServerFn(logoutWhapiAccount);
  const [qr, setQr] = useState<{ accountId: string; dataUrl: string } | null>(null);

  const query = useQuery({
    queryKey: ["whapi-whatsapp-accounts"],
    queryFn: () => listAccountsFn(),
    refetchInterval: 15000,
    retry: 1,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["whapi-whatsapp-accounts"] });
  };

  const qrMutation = useMutation({
    mutationFn: (accountId: string) => getQrFn({ data: { accountId } }),
    onSuccess: (result) => setQr({ accountId: result.accountId, dataUrl: result.qrDataUrl }),
    onError: (error: Error) => toast.error(error.message || "تعذر إنشاء QR"),
  });

  const reconnectMutation = useMutation({
    mutationFn: (accountId: string) => reconnectFn({ data: { accountId } }),
    onSuccess: async () => {
      toast.success("تم تحديث اتصال قناة Whapi");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message || "فشل تحديث الاتصال"),
  });

  const logoutMutation = useMutation({
    mutationFn: (accountId: string) => logoutFn({ data: { accountId, confirmed: true } }),
    onSuccess: async () => {
      toast.success("تم تسجيل خروج حساب واتساب من قناة Whapi");
      setQr(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message || "فشل تسجيل الخروج"),
  });

  const accounts = query.data?.accounts ?? [];
  const connectedCount = accounts.filter((account) => account.isLoggedIn).length;

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-500" />
            حسابات واتساب — Whapi + Vercel
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            تشغيل واتساب عبر قنوات Whapi الدائمة، ولوحة الإدارة والـAPI على Vercel بدون اعتماد على
            Render أو GOWA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-background px-3 py-1 text-[11px] font-bold text-muted-foreground border border-border">
            {connectedCount}/{accounts.length} متصل
          </span>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={query.isFetching}
            className="rounded-xl border border-border bg-background p-2.5 hover:bg-accent disabled:opacity-50"
            aria-label="تحديث الحسابات"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {query.isError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          تعذر قراءة قنوات Whapi: {(query.error as Error).message}. تحقق من WHAPI_TOKEN أو
          WHAPI_ACCOUNTS_JSON في Vercel.
        </div>
      )}

      <div className="rounded-xl border border-border bg-background/70 p-3 text-xs text-muted-foreground">
        لإضافة رقم جديد: أنشئ Channel في Whapi، أضف Token كمتغير Server-only في Vercel، ثم أدرجه في
        WHAPI_ACCOUNTS_JSON. لا تُخزّن Tokens في المتصفح أو Supabase.
      </div>

      <div className="grid gap-3">
        {accounts.map((account) => {
          const online = account.isLoggedIn;
          return (
            <div key={account.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {online ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <CircleOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-black text-sm">{account.displayName || account.id}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {online ? "متصل" : account.state || "غير متصل"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    <p dir="ltr" className="font-mono break-all">
                      channel_id: {account.id}
                    </p>
                    <p dir="ltr" className="font-mono break-all">
                      phone: {account.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!online && (
                    <button
                      type="button"
                      onClick={() => qrMutation.mutate(account.id)}
                      disabled={qrMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      عرض QR
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => reconnectMutation.mutate(account.id)}
                    disabled={reconnectMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    تحديث الاتصال
                  </button>
                  {online && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`تسجيل خروج ${account.displayName} من جلسة Whapi؟`)) {
                          logoutMutation.mutate(account.id);
                        }
                      }}
                      disabled={logoutMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                      تسجيل خروج
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {!query.isLoading && !query.isError && accounts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-xs text-muted-foreground">
            لا توجد قناة Whapi مهيأة في بيئة Vercel. أضف WHAPI_TOKEN للحساب الأساسي.
          </div>
        )}
      </div>

      {qr && (
        <div className="rounded-2xl border border-emerald-500/30 bg-background p-5">
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <p className="text-sm font-black">ربط قناة: {qr.accountId}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                افتح WhatsApp ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز، ثم امسح الرمز.
              </p>
            </div>
            <img
              src={qr.dataUrl}
              alt={`QR لربط ${qr.accountId}`}
              className="h-64 w-64 rounded-xl border border-border bg-white p-2"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => qrMutation.mutate(qr.accountId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تحديث QR
              </button>
              <button
                type="button"
                onClick={() => setQr(null)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
