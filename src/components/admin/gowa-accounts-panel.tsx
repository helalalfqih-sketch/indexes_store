import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  CircleOff,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Trash2,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import {
  createGowaAccount,
  getGowaAccountQr,
  listGowaAccounts,
  logoutGowaAccount,
  reconnectGowaAccount,
  removeGowaAccount,
} from "@/lib/gowa.functions";

export function GowaAccountsPanel() {
  const queryClient = useQueryClient();
  const listAccountsFn = useServerFn(listGowaAccounts);
  const createAccountFn = useServerFn(createGowaAccount);
  const getQrFn = useServerFn(getGowaAccountQr);
  const reconnectFn = useServerFn(reconnectGowaAccount);
  const logoutFn = useServerFn(logoutGowaAccount);
  const removeFn = useServerFn(removeGowaAccount);

  const [newDeviceId, setNewDeviceId] = useState("");
  const [qr, setQr] = useState<{ deviceId: string; dataUrl: string; duration: string | number | null } | null>(null);

  const query = useQuery({
    queryKey: ["gowa-whatsapp-accounts"],
    queryFn: () => listAccountsFn(),
    refetchInterval: 15000,
    retry: 1,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["gowa-whatsapp-accounts"] });
  };

  const createMutation = useMutation({
    mutationFn: (deviceId: string) => createAccountFn({ data: { deviceId } }),
    onSuccess: async () => {
      toast.success("تم إنشاء حساب واتساب مباشر جديد");
      setNewDeviceId("");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message || "تعذر إنشاء الحساب"),
  });

  const qrMutation = useMutation({
    mutationFn: (deviceId: string) => getQrFn({ data: { deviceId } }),
    onSuccess: (result) => {
      setQr({
        deviceId: result.deviceId,
        dataUrl: result.qrDataUrl,
        duration: result.duration,
      });
    },
    onError: (error: Error) => toast.error(error.message || "تعذر إنشاء QR"),
  });

  const reconnectMutation = useMutation({
    mutationFn: (deviceId: string) => reconnectFn({ data: { deviceId } }),
    onSuccess: async () => {
      toast.success("تم طلب إعادة الاتصال");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message || "فشلت إعادة الاتصال"),
  });

  const logoutMutation = useMutation({
    mutationFn: (deviceId: string) => logoutFn({ data: { deviceId, confirmed: true } }),
    onSuccess: async () => {
      toast.success("تم تسجيل خروج الحساب من الجلسة");
      setQr(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message || "فشل تسجيل الخروج"),
  });

  const removeMutation = useMutation({
    mutationFn: (deviceId: string) => removeFn({ data: { deviceId, confirmed: true } }),
    onSuccess: async () => {
      toast.success("تم حذف slot الحساب");
      setQr(null);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message || "فشل حذف الحساب"),
  });

  const accounts = query.data?.accounts ?? [];
  const connectedCount = useMemo(
    () => accounts.filter((account) => account.isLoggedIn || account.isConnected).length,
    [accounts],
  );

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-500" />
            حسابات واتساب المباشرة — الأجهزة المرتبطة
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            ربط عدة حسابات عبر WhatsApp &gt; الأجهزة المرتبطة &gt; ربط جهاز، بدون كشف بيانات اعتماد GOWA للمتصفح.
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
          تعذر الاتصال بخدمة GOWA: {(query.error as Error).message}. تأكد من إعداد
          <code className="mx-1">GOWA_BASIC_AUTH</code> في بيئة المتجر.
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={newDeviceId}
          onChange={(event) => setNewDeviceId(event.target.value)}
          placeholder="مثال: indexes أو king أو prince"
          dir="ltr"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono"
        />
        <button
          type="button"
          disabled={!newDeviceId.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate(newDeviceId.trim())}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          إضافة حساب
        </button>
      </div>

      <div className="grid gap-3">
        {accounts.map((account) => {
          const online = Boolean(account.isLoggedIn || account.isConnected);
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
                    <p dir="ltr" className="font-mono break-all">device_id: {account.id}</p>
                    {account.jid && <p dir="ltr" className="font-mono break-all">jid: {account.jid}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!account.isLoggedIn && (
                    <button
                      type="button"
                      onClick={() => qrMutation.mutate(account.id)}
                      disabled={qrMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      عرض QR
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => reconnectMutation.mutate(account.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    إعادة اتصال
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`تسجيل خروج ${account.id} من واتساب؟`)) {
                        logoutMutation.mutate(account.id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    تسجيل خروج
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`حذف slot ${account.id} نهائياً من GOWA؟`)) {
                        removeMutation.mutate(account.id);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {!query.isLoading && !query.isError && accounts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-background p-6 text-center text-xs text-muted-foreground">
            لا توجد حسابات مباشرة بعد. أنشئ أول slot ثم امسح QR من «الأجهزة المرتبطة» في واتساب.
          </div>
        )}
      </div>

      {qr && (
        <div className="rounded-2xl border border-emerald-500/30 bg-background p-5">
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <p className="text-sm font-black">ربط الحساب: {qr.deviceId}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                افتح WhatsApp ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز، ثم امسح الرمز.
              </p>
            </div>
            <img
              src={qr.dataUrl}
              alt={`QR لربط ${qr.deviceId}`}
              className="h-64 w-64 rounded-xl border border-border bg-white p-2"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => qrMutation.mutate(qr.deviceId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تحديث QR
              </button>
              <button
                type="button"
                onClick={async () => {
                  await refresh();
                  toast.success("تم تحديث حالة الحساب");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
              >
                تحقّق من الاتصال
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
