import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  MessageCircle,
  Package,
  MapPin,
  HelpCircle,
  ShieldCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  Plus,
  Trash2,
  Lock,
  Loader2,
  Phone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppearance } from "@/components/appearance-provider";
import { whatsappLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/store-data";
import {
  getUserOrders,
  getUserAddresses,
  saveUserAddress,
  deleteUserAddress,
  type UserOrder,
  type UserAddress,
} from "@/lib/actions/order.actions";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "حسابي — اندكس ستور" }] }),
  component: AccountPage,
});

type TabType = "overview" | "orders" | "addresses" | "security" | "support";

function AccountPage() {
  const navigate = useNavigate();
  const { settings } = useAppearance();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [user, setUser] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Orders state
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ title: "المنزل", city: "صنعاء", address_line: "", phone: "", is_default: false });

  // Security state
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Load user status
  useEffect(() => {
    async function initUser() {
      if (!supabase) {
        setLoadingUser(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      setLoadingUser(false);
    }
    initUser();
  }, []);

  // Fetch orders and addresses if signed in
  useEffect(() => {
    if (!user) return;

    if (activeTab === "orders" || activeTab === "overview") {
      setLoadingOrders(true);
      getUserOrders()
        .then((res) => setOrders(res))
        .finally(() => setLoadingOrders(false));
    }

    if (activeTab === "addresses") {
      setLoadingAddresses(true);
      getUserAddresses()
        .then((res) => setAddresses(res))
        .finally(() => setLoadingAddresses(false));
    }
  }, [user, activeTab]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      toast.success("تم تسجيل الخروج بنجاح");
    }
  };

  const handleSaveAddress = async () => {
    if (!newAddr.address_line || !newAddr.phone) {
      toast.error("الرجاء إدخال تفاصيل العنوان ورقم الهاتف");
      return;
    }
    const ok = await saveUserAddress(newAddr);
    if (ok) {
      toast.success("تم حفظ العنوان بنجاح");
      setAddingAddress(false);
      setNewAddr({ title: "المنزل", city: "صنعاء", address_line: "", phone: "", is_default: false });
      const updated = await getUserAddresses();
      setAddresses(updated);
    } else {
      toast.error("فشل في حفظ العنوان");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const ok = await deleteUserAddress(id);
    if (ok) {
      toast.success("تم حذف العنوان");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setUpdatingPassword(true);
    try {
      if (!supabase) throw new Error("تعذر الاتصال بالخدمة");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("تم تحديث كلمة المرور بنجاح! 🔑");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التحديث");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const storeName = settings.navigation.storeName || "اندكس ستور";
  const supportPhone = settings.navigation.whatsappPhone || "967771370740";
  const supportEmail = settings.navigation.supportEmail || "support@indexes-store.com";
  const waHref = whatsappLink("مرحباً، لدي استفسار من صفحة حسابي في " + storeName, supportPhone);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 max-w-2xl mx-auto pb-12" dir="rtl">
      {/* User Header Badge */}
      <section className="flex items-center gap-3.5 rounded-3xl bg-primary p-5 text-primary-foreground shadow-brand">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-foreground/20 text-xl font-black shrink-0">
          {user?.email ? user.email.slice(0, 1).toUpperCase() : <UserIcon className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black truncate">
            {user?.email ? user.email : `مرحباً بك في ${storeName}`}
          </p>
          <p className="text-xs text-primary-foreground/80 truncate">
            {user ? "حساب عميل مفعل" : "سجّل دخولك لمتابعة وإدارة طلباتك وعناوينك"}
          </p>
        </div>
        {loadingUser ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : user ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-xl bg-primary-foreground/20 px-3 py-2 text-xs font-bold transition hover:bg-primary-foreground/30 shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        ) : (
          <Link
            to="/auth"
            className="flex items-center gap-1.5 rounded-xl bg-primary-foreground text-primary px-4 py-2 text-xs font-bold shadow-card hover:bg-primary-foreground/90 transition shrink-0"
          >
            <LogIn className="h-4 w-4" />
            تسجيل الدخول
          </Link>
        )}
      </section>

      {/* Tabs Bar */}
      <div className="flex w-full max-w-full border-b border-showcase-border/40 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-showcase-muted hover:text-showcase-foreground"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          الرئيسية
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-showcase-muted hover:text-showcase-foreground"
          }`}
        >
          <Package className="h-4 w-4" />
          طلباتي ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("addresses")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "addresses" ? "border-primary text-primary" : "border-transparent text-showcase-muted hover:text-showcase-foreground"
          }`}
        >
          <MapPin className="h-4 w-4" />
          عناويني
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "security" ? "border-primary text-primary" : "border-transparent text-showcase-muted hover:text-showcase-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          الخصوصية والأمان
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "support" ? "border-primary text-primary" : "border-transparent text-showcase-muted hover:text-showcase-foreground"
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          المساعدة والدعم
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <ul className="overflow-hidden rounded-2xl bg-showcase-foreground/5 border border-showcase-border/50 shadow-card backdrop-blur-md divide-y divide-showcase-border/50">
            <li>
              <button
                onClick={() => setActiveTab("orders")}
                className="w-full flex items-center justify-between p-4 text-xs font-bold hover:bg-showcase-foreground/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-right">
                    <span>متابعة وسجل الطلبات</span>
                    <span className="block text-[10px] font-normal text-showcase-muted">عرض الطلبات السابقة وحالاتها الحالية</span>
                  </div>
                </div>
                <span className="text-showcase-muted text-sm">‹</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("addresses")}
                className="w-full flex items-center justify-between p-4 text-xs font-bold hover:bg-showcase-foreground/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-right">
                    <span>إدارة العناوين والتسليم</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">عناوين التوصيل المفضلة للطلبات</span>
                  </div>
                </div>
                <span className="text-muted-foreground text-sm">‹</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("security")}
                className="w-full flex items-center justify-between p-4 text-xs font-bold hover:bg-showcase-foreground/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-right">
                    <span>الخصوصية وتغيير كلمة المرور</span>
                    <span className="block text-[10px] font-normal text-showcase-muted">حماية الحساب وإدارة الجلسات</span>
                  </div>
                </div>
                <span className="text-showcase-muted text-sm">‹</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Tab 2: My Orders */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              سجل الطلبات الحقيقي
            </h2>
          </div>

          {loadingOrders ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 backdrop-blur-md">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-8 text-center space-y-3 backdrop-blur-md">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-showcase-foreground/10 text-showcase-muted">
                <Package className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold">لا توجد طلبات سابقة</p>
              <p className="text-xs text-showcase-muted">عند قتومك بالشراء ستظهر جميع طلباتك وحالات التوصيل هنا.</p>
              <Link
                to="/"
                className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-brand"
              >
                تصفح المنتجات الآن
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div key={ord.id} className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-4 shadow-card space-y-2 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-showcase-border/50 pb-2 text-xs">
                    <span className="font-mono font-bold text-primary">{ord.id}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {ord.status === "pending" ? "قيد الانتظار" : ord.status === "delivered" ? "تم التسليم" : ord.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-showcase-muted">التاريخ: {new Date(ord.created_at).toLocaleDateString("ar-EG")}</span>
                    <span className="font-black text-showcase-foreground">{formatPrice(ord.total_amount || 0)}</span>
                  </div>
                  {ord.customer_address && (
                    <p className="text-[11px] text-showcase-muted">العنوان: {ord.customer_address}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              عناوين التسليم
            </h2>
            <button
              onClick={() => setAddingAddress(!addingAddress)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <Plus className="h-4 w-4" />
              عنوان جديد
            </button>
          </div>

          {addingAddress && (
            <div className="rounded-2xl border border-primary/20 bg-surface p-4 shadow-card space-y-3">
              <h3 className="text-xs font-bold">إضافة عنوان تسليم جديد</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="space-y-1 font-bold">
                  اسم العنوان (مثلاً: المنزل، العمل)
                  <input
                    type="text"
                    value={newAddr.title}
                    onChange={(e) => setNewAddr({ ...newAddr, title: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal outline-none"
                  />
                </label>
                <label className="space-y-1 font-bold">
                  المدينة
                  <input
                    type="text"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal outline-none"
                  />
                </label>
                <label className="space-y-1 font-bold sm:col-span-2">
                  تفاصيل العنوان (الشارع، الحي، المعلم)
                  <input
                    type="text"
                    value={newAddr.address_line}
                    onChange={(e) => setNewAddr({ ...newAddr, address_line: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal outline-none"
                    placeholder="مثال: شارع بينون، بجانب صيدلية..."
                  />
                </label>
                <label className="space-y-1 font-bold sm:col-span-2">
                  رقم الهاتف للتوصيل
                  <input
                    type="text"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-normal outline-none"
                    placeholder="770000000"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setAddingAddress(false)}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-brand"
                >
                  حفظ العنوان
                </button>
              </div>
            </div>
          )}

          {loadingAddresses ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 backdrop-blur-md">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-8 text-center space-y-2 backdrop-blur-md">
              <p className="text-sm font-bold">لا توجد عناوين محجوزة</p>
              <p className="text-xs text-showcase-muted">أضف عنوانك لتسريع عملية الشراء والتوصيل مستقبلاً.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-4 shadow-card backdrop-blur-md">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-showcase-foreground">{a.title}</span>
                      <span className="text-[10px] text-showcase-muted">({a.city})</span>
                    </div>
                    <p className="text-showcase-muted">{a.address_line}</p>
                    <p className="text-showcase-muted">هاتف: {a.phone}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition"
                    title="حذف العنوان"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === "security" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-5 shadow-card space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              تغيير كلمة المرور
            </h2>

            {user ? (
              <div className="space-y-3 max-w-md">
                <label className="block text-xs font-bold space-y-1">
                  كلمة المرور الجديدة
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
                    placeholder="******"
                  />
                </label>
                <button
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-brand hover:bg-primary/90 disabled:opacity-60"
                >
                  {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  تحديث كلمة المرور
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">يجب تسجيل الدخول لتغيير كلمة المرور.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Help & Support */}
      {activeTab === "support" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-showcase-border/50 bg-showcase-foreground/5 p-5 shadow-card space-y-4 backdrop-blur-md">
            <h2 className="text-sm font-black flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              مركز الدعم والمساعدة — {storeName}
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-showcase-border/50 bg-black/40">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-bold block">رقم الدعم الفني والطلب:</span>
                  <span className="text-showcase-muted">{supportPhone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-showcase-border/50 bg-black/40">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <span className="font-bold block">البريد الإلكتروني:</span>
                  <span className="text-showcase-muted">{supportEmail}</span>
                </div>
              </div>
            </div>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-success py-3 text-xs font-bold text-success-foreground shadow-brand hover:bg-success/90 transition"
            >
              <MessageCircle className="h-4 w-4" />
              محادثات الدعم المباشر عبر واتساب
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
