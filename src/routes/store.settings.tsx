import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Settings, Store, Clock, Users, Palette, Search } from "lucide-react";
import { updateStoreProfile, updateStoreSetting, listStoreMembers } from "@/lib/store.functions";
import { updateStorefrontAppearance } from "@/lib/actions/appearance.actions";
import { notifyStorefrontPublished, useAppearance } from "@/components/appearance-provider";
import { useStoreContext } from "@/components/store/store-shell";
import { STORE_ROLE_LABELS } from "@/lib/store/store-gate";

export const Route = createFileRoute("/store/settings")({
  component: StoreSettingsPage,
});

const inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function StoreSettingsPage() {
  const { store, can, refetch } = useStoreContext();
  const saveProfile = useServerFn(updateStoreProfile);
  const saveSetting = useServerFn(updateStoreSetting);
  const fetchMembers = useServerFn(listStoreMembers);

  const membersQ = useQuery({ queryKey: ["store-members"], queryFn: () => fetchMembers() });

  const [identity, setIdentity] = useState({
    display_name: "",
    description: "",
    logo_url: "",
    banner_url: "",
    phone: "",
    email: "",
  });
  const contactSetting = store.settings.find((s) => s.key === "contact")?.value as any;
  const hoursSetting = store.settings.find((s) => s.key === "working_hours")?.value as any;
  const [business, setBusiness] = useState({ address: "", hours: "" });

  useEffect(() => {
    setIdentity({
      display_name: store.profile?.display_name ?? store.name,
      description: store.profile?.description ?? "",
      logo_url: store.profile?.logo_url ?? "",
      banner_url: store.profile?.banner_url ?? "",
      phone: store.profile?.phone ?? "",
      email: store.profile?.email ?? "",
    });
    setBusiness({
      address: contactSetting?.address ?? "",
      hours: hoursSetting?.text ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const profileMut = useMutation({
    mutationFn: () => saveProfile({ data: identity }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم حفظ هوية المتجر");
        refetch();
        void notifyStorefrontPublished();
      } else toast.error(r.message ?? "فشل الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const businessMut = useMutation({
    mutationFn: async () => {
      const r1 = await saveSetting({ data: { key: "contact", value: { address: business.address } } });
      const r2 = await saveSetting({ data: { key: "working_hours", value: { text: business.hours } } });
      return r1.success && r2.success ? { success: true as const } : { success: false as const, message: r1.message || r2.message };
    },
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم حفظ بيانات العمل");
        refetch();
      } else toast.error(r.message ?? "فشل الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!can("owner")) {
    return (
      <div className="rounded-2xl glass p-10 text-center text-sm text-muted-foreground">
        إعدادات المتجر متاحة لمالك المتجر فقط.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16">
      <h1 className="flex items-center gap-2 text-2xl font-black">
        <Settings className="h-6 w-6 text-primary" /> إعدادات المتجر
      </h1>

      {/* Identity */}
      <section className="rounded-2xl glass p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Store className="h-4 w-4 text-primary" /> هوية المتجر
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold">
            اسم المتجر
            <input value={identity.display_name} onChange={(e) => setIdentity({ ...identity, display_name: e.target.value })} className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold">
            البريد
            <input value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} dir="ltr" className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold">
            الهاتف
            <input value={identity.phone} onChange={(e) => setIdentity({ ...identity, phone: e.target.value })} dir="ltr" className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold">
            رابط الشعار
            <input value={identity.logo_url} onChange={(e) => setIdentity({ ...identity, logo_url: e.target.value })} dir="ltr" className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold sm:col-span-2">
            رابط البانر
            <input value={identity.banner_url} onChange={(e) => setIdentity({ ...identity, banner_url: e.target.value })} dir="ltr" className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold sm:col-span-2">
            وصف المتجر
            <textarea value={identity.description} onChange={(e) => setIdentity({ ...identity, description: e.target.value })} rows={3} className={inputCls} />
          </label>
        </div>
        <button onClick={() => profileMut.mutate()} disabled={profileMut.isPending} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
          {profileMut.isPending ? "جارٍ الحفظ..." : "حفظ الهوية"}
        </button>
      </section>

      {/* Business */}
      <section className="rounded-2xl glass p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Clock className="h-4 w-4 text-primary" /> بيانات العمل
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold">
            العنوان
            <input value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} className={inputCls} />
          </label>
          <label className="space-y-1 text-xs font-bold">
            ساعات العمل
            <input value={business.hours} onChange={(e) => setBusiness({ ...business, hours: e.target.value })} placeholder="مثال: 9ص – 10م يومياً" className={inputCls} />
          </label>
        </div>
        <button onClick={() => businessMut.mutate()} disabled={businessMut.isPending} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60">
          {businessMut.isPending ? "جارٍ الحفظ..." : "حفظ بيانات العمل"}
        </button>
      </section>

      {/* Members */}
      <section className="rounded-2xl glass p-5 space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Users className="h-4 w-4 text-primary" /> فريق المتجر
        </h2>
        {membersQ.isLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-accent/50" />
        ) : (
          <div className="space-y-2">
            {(membersQ.data ?? []).map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-xs">
                <span className="flex-1 truncate font-mono text-[10px] text-muted-foreground" dir="ltr">{m.user_id}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  {STORE_ROLE_LABELS[m.role as keyof typeof STORE_ROLE_LABELS] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">إدارة الأدوار والإضافة/الإزالة تتم حالياً عبر إدارة المنصّة.</p>
      </section>

      {/* Appearance — per-store CMS overrides (P5) */}
      <AppearanceQuickEditor />

      <div className="rounded-2xl glass p-5">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Search className="h-4 w-4 text-primary" /> SEO
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          يعمل تلقائياً من نظام المنصّة (sitemap، google-shopping، بيانات منظَّمة). لتخصيص عنوان
          ووصف الصفحة الرئيسية لمتجرك استخدم محرر المظهر أعلاه — تخصيص SEO المتقدم يأتي تباعاً.
        </p>
      </div>
    </div>
  );
}

/**
 * Quick per-store appearance editor (P5): writes TENANT-scoped CMS overrides
 * via the unified appearance actions (owner scope resolved server-side).
 * Fields are initialized from the currently effective (merged) settings and
 * saved as a full section object, so untouched fields keep their values.
 */
function AppearanceQuickEditor() {
  const { settings } = useAppearance();
  const [theme, setTheme] = useState({ primaryColor: "", secondaryColor: "", backgroundColor: "" });
  const [hero, setHero] = useState({ title: "", subtitle: "" });

  useEffect(() => {
    setTheme({
      primaryColor: settings.theme.primaryColor ?? "#4f8cff",
      secondaryColor: settings.theme.secondaryColor ?? "#a259ff",
      backgroundColor: (settings.theme as any).backgroundColor ?? "#06091f",
    });
    setHero({ title: settings.hero.title ?? "", subtitle: settings.hero.subtitle ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const themeMut = useMutation({
    mutationFn: () =>
      updateStorefrontAppearance({ data: { key: "theme", value: { ...settings.theme, ...theme } } }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم حفظ ثيم متجرك ونشره");
        void notifyStorefrontPublished();
      } else toast.error(r.message ?? "فشل الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const heroMut = useMutation({
    mutationFn: () =>
      updateStorefrontAppearance({ data: { key: "hero", value: { ...settings.hero, ...hero } } }),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("تم حفظ واجهة متجرك ونشرها");
        void notifyStorefrontPublished();
      } else toast.error(r.message ?? "فشل الحفظ");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="rounded-2xl glass p-5 space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-black">
        <Palette className="h-4 w-4 text-primary" /> مظهر واجهة المتجر
      </h2>
      <p className="text-[11px] text-muted-foreground">
        تخصيصاتك تُحفظ كطبقة خاصة بمتجرك فوق افتراضيات المنصّة، وتظهر للعملاء فوراً (Realtime).
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["primaryColor", "اللون الأساسي"],
            ["secondaryColor", "اللون الثانوي"],
            ["backgroundColor", "لون الخلفية"],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="space-y-1 text-xs font-bold">
            {label}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={(theme as any)[k]}
                onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-surface"
              />
              <input
                value={(theme as any)[k]}
                onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                dir="ltr"
                className={inputCls}
              />
            </div>
          </label>
        ))}
      </div>
      <button
        onClick={() => themeMut.mutate()}
        disabled={themeMut.isPending}
        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
      >
        {themeMut.isPending ? "جارٍ الحفظ..." : "حفظ الثيم"}
      </button>

      <div className="grid gap-3 border-t border-border/50 pt-4 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-bold">
          عنوان الواجهة (Hero)
          <input value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} className={inputCls} />
        </label>
        <label className="space-y-1 text-xs font-bold">
          العنوان الفرعي
          <input value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} className={inputCls} />
        </label>
      </div>
      <button
        onClick={() => heroMut.mutate()}
        disabled={heroMut.isPending}
        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
      >
        {heroMut.isPending ? "جارٍ الحفظ..." : "حفظ الواجهة"}
      </button>
    </section>
  );
}
