import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  Store,
  ShieldCheck,
  Users,
  BarChart3,
  History,
  CreditCard,
  Trash2,
} from "lucide-react";
import {
  getStoreDetailsAdmin,
  updateStoreStatusAdmin,
  updateStorePlanAdmin,
  updateStoreProfileAdmin,
  upsertStoreMemberAdmin,
  removeStoreMemberAdmin,
} from "@/lib/admin-stores.functions";
import { formatPrice } from "@/lib/store-data";

export const Route = createFileRoute("/admin/stores/$tenantId")({
  component: StoreDetailsPage,
});

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك المتجر",
  manager: "مدير متجر",
  staff: "موظف",
  viewer: "مُطالِع",
};

const ACTION_LABELS: Record<string, string> = {
  status_change: "تغيير الحالة",
  plan_change: "تغيير الخطة",
  member_upsert: "تحديث عضوية",
  member_remove: "إزالة عضو",
  profile_update: "تحديث الهوية",
  setting_update: "تحديث إعدادات",
};

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Store;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl glass p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-black">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function StoreDetailsPage() {
  const { tenantId } = Route.useParams();
  const qc = useQueryClient();
  const fetchDetails = useServerFn(getStoreDetailsAdmin);
  const setStatus = useServerFn(updateStoreStatusAdmin);
  const setPlan = useServerFn(updateStorePlanAdmin);
  const saveProfile = useServerFn(updateStoreProfileAdmin);
  const upsertMember = useServerFn(upsertStoreMemberAdmin);
  const removeMember = useServerFn(removeStoreMemberAdmin);

  const detailsQ = useQuery({
    queryKey: ["admin-store-details", tenantId],
    queryFn: () => fetchDetails({ data: { tenantId } }),
  });
  const d = detailsQ.data;

  // Identity form state
  const [form, setForm] = useState({
    display_name: "",
    description: "",
    phone: "",
    email: "",
    logo_url: "",
    banner_url: "",
  });
  useEffect(() => {
    if (d) {
      setForm({
        display_name: d.profile?.display_name ?? d.name,
        description: d.profile?.description ?? "",
        phone: d.profile?.phone ?? "",
        email: d.profile?.email ?? "",
        logo_url: d.profile?.logo_url ?? "",
        banner_url: d.profile?.banner_url ?? "",
      });
    }
  }, [d]);

  // New member form
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"owner" | "manager" | "staff" | "viewer">("staff");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-store-details", tenantId] });

  const mkMut = (fn: (v: any) => Promise<{ success: boolean; message?: string }>, okMsg: string) =>
    useMutation({
      mutationFn: fn,
      onSuccess: (r) => {
        if (r.success) {
          toast.success(okMsg);
          invalidate();
          qc.invalidateQueries({ queryKey: ["admin-stores"] });
        } else toast.error(r.message ?? "فشلت العملية");
      },
      onError: (e: Error) => toast.error(e.message),
    });

  const statusMut = mkMut((status: any) => setStatus({ data: { tenantId, status } }), "تم تحديث حالة المتجر");
  const planMut = mkMut((plan: any) => setPlan({ data: { tenantId, plan } }), "تم تحديث الخطة");
  const profileMut = mkMut(
    () => saveProfile({ data: { tenantId, profile: form } }),
    "تم حفظ هوية المتجر",
  );
  const memberMut = mkMut(
    (v: any) => upsertMember({ data: { tenantId, userId: v.userId, role: v.role } }),
    "تم تحديث العضوية",
  );
  const removeMut = mkMut(
    (userId: any) => removeMember({ data: { tenantId, userId } }),
    "تمت إزالة العضو",
  );

  if (detailsQ.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl glass" aria-busy="true" />
        ))}
      </div>
    );
  }

  if (!d) {
    return (
      <div className="rounded-2xl glass p-10 text-center space-y-3">
        <Store className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-bold">المتجر غير موجود أو لا تملك صلاحية الوصول</p>
        <Link to="/admin/stores" className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          <ArrowRight className="h-3.5 w-3.5" /> العودة للمتاجر
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {d.profile?.logo_url ? (
            <img src={d.profile.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover border border-border" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-lg font-black text-primary">
              {(d.profile?.display_name || d.name).slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black">{d.profile?.display_name || d.name}</h1>
            <p className="text-xs text-muted-foreground" dir="ltr">/{d.slug}</p>
          </div>
        </div>
        <Link
          to="/admin/stores"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-accent"
        >
          <ArrowRight className="h-3.5 w-3.5" /> كل المتاجر
        </Link>
      </div>

      {/* Analytics */}
      <SectionCard title="التحليلات" icon={BarChart3}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "الإيرادات", value: formatPrice(d.stats.revenue) },
            { label: "الطلبات", value: `${d.stats.ordersCount} (${d.stats.pendingOrders} معلّق)` },
            { label: "العملاء المسجَّلون", value: String(d.stats.customersCount) },
            { label: "المنتجات", value: `${d.stats.productsCount} (${d.stats.publishedCount} منشور)` },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-surface p-3 text-center">
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-sm font-black">{k.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Status + Subscription */}
      <SectionCard title="الحالة والاشتراك" icon={CreditCard}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold">
            حالة المتجر
            <select
              value={d.status}
              onChange={(e) => statusMut.mutate(e.target.value)}
              disabled={statusMut.isPending}
              className={inputCls}
            >
              <option value="active">نشط</option>
              <option value="pending">قيد الإعداد</option>
              <option value="suspended">معلَّق (إيقاف المتجر)</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-bold">
            خطة الاشتراك
            <select
              value={d.plan}
              onChange={(e) => planMut.mutate(e.target.value)}
              disabled={planMut.isPending}
              className={inputCls}
            >
              <option value="free">مجاني</option>
              <option value="pro">احترافي</option>
              <option value="enterprise">أعمال</option>
            </select>
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {d.subscription
            ? `آخر اشتراك: ${d.subscription.plan} · ${d.subscription.status} · ينتهي: ${
                d.subscription.current_period_end
                  ? new Date(d.subscription.current_period_end).toLocaleDateString("ar-EG")
                  : "غير محدد"
              }`
            : "لا يوجد سجل اشتراك بعد — سيُنشأ تلقائياً عند أول تغيير للخطة."}
        </p>
      </SectionCard>

      {/* Identity */}
      <SectionCard title="هوية المتجر" icon={Store}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold">
            اسم المتجر
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold">
            البريد
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} dir="ltr" />
          </label>
          <label className="space-y-1 text-xs font-bold">
            الهاتف
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" />
          </label>
          <label className="space-y-1 text-xs font-bold">
            رابط الشعار
            <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={inputCls} dir="ltr" />
          </label>
          <label className="space-y-1 text-xs font-bold sm:col-span-2">
            رابط البانر
            <input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} className={inputCls} dir="ltr" />
          </label>
          <label className="space-y-1 text-xs font-bold sm:col-span-2">
            الوصف
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputCls}
            />
          </label>
        </div>
        <button
          onClick={() => profileMut.mutate(undefined)}
          disabled={profileMut.isPending}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60 hover:bg-primary/90"
        >
          {profileMut.isPending ? "جارٍ الحفظ..." : "حفظ الهوية"}
        </button>
      </SectionCard>

      {/* Permissions */}
      <SectionCard title="الصلاحيات والأعضاء" icon={Users}>
        <div className="space-y-2">
          {d.members.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              لا أعضاء بعد
            </p>
          )}
          {d.members.map((m) => (
            <div key={m.user_id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{m.full_name || "مستخدم"}</p>
                <p className="truncate text-[10px] text-muted-foreground" dir="ltr">{m.user_id}</p>
              </div>
              <select
                value={m.role}
                onChange={(e) => memberMut.mutate({ userId: m.user_id, role: e.target.value })}
                disabled={memberMut.isPending}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs font-bold"
              >
                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <button
                onClick={() => removeMut.mutate(m.user_id)}
                disabled={removeMut.isPending}
                className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                title="إزالة العضو"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t border-border/50 pt-3">
          <label className="min-w-[220px] flex-1 space-y-1 text-xs font-bold">
            إضافة عضو (معرّف المستخدم UUID)
            <input
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              placeholder="uuid..."
              dir="ltr"
              className={inputCls}
            />
          </label>
          <select
            value={newMemberRole}
            onChange={(e) => setNewMemberRole(e.target.value as any)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold"
          >
            {Object.entries(ROLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!/^[0-9a-f-]{36}$/i.test(newMemberId.trim())) {
                toast.error("أدخل UUID صالحاً للمستخدم");
                return;
              }
              memberMut.mutate({ userId: newMemberId.trim(), role: newMemberRole });
              setNewMemberId("");
            }}
            disabled={memberMut.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
          >
            إضافة
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> كل تغييرات الصلاحيات تُسجَّل في سجل التدقيق تلقائياً.
        </p>
      </SectionCard>

      {/* Audit log */}
      <SectionCard title="سجل التدقيق" icon={History}>
        {d.audit.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            لا أحداث مسجَّلة بعد — ستظهر هنا تغييرات الحالة والخطة والصلاحيات والهوية.
          </p>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {d.audit.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-surface p-2.5 text-[11px]">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  {ACTION_LABELS[a.action] ?? a.action}
                </span>
                <span className="text-muted-foreground">{a.actor_email || "—"}</span>
                <span className="ms-auto font-mono text-[10px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("ar-EG")}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {detailsQ.isFetching && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> تحديث...
        </p>
      )}
    </div>
  );
}
