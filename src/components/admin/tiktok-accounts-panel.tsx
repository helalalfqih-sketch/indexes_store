import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  CircleOff,
  ExternalLink,
  Loader2,
  Music2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Unplug,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  beginTikTokOAuth,
  disconnectTikTokAccount,
  listTikTokAccounts,
  refreshTikTokAccount,
} from "@/lib/tiktok.functions";

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-YE");
  } catch {
    return "—";
  }
}

export function TikTokAccountsPanel() {
  const queryClient = useQueryClient();
  const listAccountsFn = useServerFn(listTikTokAccounts);
  const beginOAuthFn = useServerFn(beginTikTokOAuth);
  const refreshAccountFn = useServerFn(refreshTikTokAccount);
  const disconnectAccountFn = useServerFn(disconnectTikTokAccount);
  const [qrLink, setQrLink] = useState<{
    qrUrl: string;
    directUrl: string;
    startedAt: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const status = url.searchParams.get("tiktok");
    if (status === "connected") {
      toast.success("تم ربط حساب TikTok بنجاح");
    } else if (status === "error") {
      const reason = url.searchParams.get("reason") || "oauth_failed";
      toast.error(`تعذر ربط TikTok: ${reason}`);
    }

    if (status) {
      url.searchParams.delete("tiktok");
      url.searchParams.delete("reason");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, []);

  const query = useQuery({
    queryKey: ["tiktok-accounts"],
    queryFn: () => listAccountsFn(),
    retry: 1,
    refetchInterval: qrLink ? 3000 : false,
  });

  useEffect(() => {
    if (!qrLink || !query.data?.accounts) return;
    const linked = query.data.accounts.some(
      (account) =>
        account.status === "active" &&
        new Date(account.updatedAt).getTime() >= qrLink.startedAt - 5000,
    );
    if (linked) {
      setQrLink(null);
      toast.success("تم ربط حساب TikTok من الهاتف بنجاح");
    }
  }, [qrLink, query.data?.accounts]);

  const refreshList = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tiktok-accounts"] });
  };

  const connectMutation = useMutation({
    mutationFn: () => beginOAuthFn(),
    onSuccess: (result) => {
      setQrLink({
        qrUrl: result.deviceUrl,
        directUrl: result.authorizationUrl,
        startedAt: Date.now(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "تعذر بدء ربط TikTok");
    },
  });

  const syncMutation = useMutation({
    mutationFn: (accountId: string) => refreshAccountFn({ data: { accountId } }),
    onSuccess: async () => {
      toast.success("تم تحديث اتصال TikTok");
      await refreshList();
    },
    onError: (error: Error) => {
      toast.error(error.message || "تعذر تحديث TikTok");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) =>
      disconnectAccountFn({
        data: { accountId, confirmed: true },
      }),
    onSuccess: async () => {
      toast.success("تم فصل حساب TikTok من اندكس وحذف التوكنات المحلية");
      await refreshList();
    },
    onError: (error: Error) => {
      toast.error(error.message || "تعذر فصل حساب TikTok");
    },
  });

  const accounts = query.data?.accounts ?? [];
  const configured = query.data?.configured ?? false;
  const activeCount = accounts.filter((account) => account.status === "active").length;

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <Music2 className="h-5 w-5" />
            حسابات TikTok
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            ربط عدة حسابات TikTok عبر QR على الهاتف مع OAuth رسمي في الخلفية. بيانات الحساب غير
            الحساسة فقط تظهر هنا، بينما مفاتيح الوصول تحفظ مشفرة على الخادم ولا تصل إلى المتصفح.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-bold text-muted-foreground">
            {activeCount}/{accounts.length} متصل
          </span>
          <button
            type="button"
            onClick={() => refreshList()}
            disabled={query.isFetching}
            className="rounded-xl border border-border bg-background p-2.5 transition hover:bg-accent disabled:opacity-50"
            aria-label="تحديث حسابات TikTok"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={!configured || connectMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {connectMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
            ربط عبر QR
          </button>
        </div>
      </div>

      {qrLink && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex w-full items-start justify-between gap-3">
              <div className="text-right">
                <p className="text-sm font-black text-foreground">امسح QR من هاتفك</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  افتح كاميرا الهاتف، امسح الرمز، ثم وافق على الربط داخل TikTok. ستتحدث هذه الصفحة
                  تلقائيًا بعد نجاح التفويض.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrLink(null)}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent"
                aria-label="إغلاق QR"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&format=png&data=${encodeURIComponent(qrLink.qrUrl)}`}
                alt="QR لربط حساب TikTok"
                className="h-64 w-64"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تحديث QR
              </button>
              <a
                href={qrLink.directUrl}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-accent"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                فتح TikTok على هذا الجهاز
              </a>
            </div>

            <p className="text-[11px] text-muted-foreground">
              QR يحتوي رمز جهاز مؤقت لمدة قصيرة فقط؛ لا يحتوي Client Secret أو Access Token أو
              OAuth state الخام.
            </p>
          </div>
        </div>
      )}

      {!configured && !query.isLoading && !query.isError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300">
          إعداد TikTok OAuth غير مكتمل في Vercel. يلزم إضافة مفاتيح TikTok server-only ثم تسجيل
          Redirect URI داخل تطبيق TikTok قبل تفعيل زر الربط.
        </div>
      )}

      {query.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          تعذر قراءة حسابات TikTok: {(query.error as Error).message}
        </div>
      )}

      <div className="grid gap-3">
        {accounts.map((account) => {
          const active = account.status === "active";
          return (
            <article key={account.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={account.displayName}
                      className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-muted">
                      <Music2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {active ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <CircleOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="truncate text-sm font-black text-foreground">
                        {account.displayName}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          active
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {active ? "متصل" : account.status}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                      <p dir="ltr" className="font-mono">
                        open_id: {account.openId}
                      </p>
                      <p>آخر مزامنة: {formatDate(account.lastSyncedAt)}</p>
                      <p>انتهاء access token: {formatDate(account.tokenExpiresAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {active && (
                    <button
                      type="button"
                      onClick={() => syncMutation.mutate(account.id)}
                      disabled={syncMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-accent disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      تحديث الاتصال
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `فصل حساب ${account.displayName} من اندكس وحذف مفاتيح الربط المحلية؟`,
                        )
                      ) {
                        disconnectMutation.mutate(account.id);
                      }
                    }}
                    disabled={disconnectMutation.isPending || account.status === "disconnected"}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    فصل الحساب
                  </button>
                </div>
              </div>

              {account.scopes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                  {account.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="rounded-md bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        {!query.isLoading && !query.isError && accounts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
            <Music2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-bold text-foreground">
              لا توجد حسابات TikTok مرتبطة بعد
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              استخدم «ربط عبر QR» ثم امسح الرمز من هاتفك لبدء التفويض الرسمي.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background/70 p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-[11px] leading-5 text-muted-foreground">
            الأمان: access token وrefresh token لا يظهران في هذه الصفحة ولا يخزنان كنص صريح. عملية
            «فصل الحساب» تحذف مفاتيح الربط المحلية من اندكس؛ ولا تدّعي إلغاء صلاحية التطبيق داخل
            TikTok نفسه.
          </p>
        </div>
      </div>
    </section>
  );
}
