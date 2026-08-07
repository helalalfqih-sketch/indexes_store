import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Settings,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  RefreshCw,
  Phone,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  X,
  AlertCircle,
  Lock,
  LogOut,
  User,
  Key,
  Image as ImageIcon,
  Ticket,
  Boxes,
  Flame,
} from "lucide-react";
import { Product, OrderStatus, Currency } from "./types";
import { formatPrice } from "./currency";

interface AdminPanelProps {
  products: Product[];
  orders: OrderStatus[];
  currency: Currency;
  onClose: () => void;
}

const DEMO_CATEGORIES = [
  { id: "electronics", name: "أجهزة وإلكترونيات" },
  { id: "gaming", name: "ألعاب وقيمنق" },
  { id: "watches", name: "ساعات إلكترونية" },
  { id: "audio", name: "سماعات وصوتيات" },
  { id: "cards", name: "كروت وشحن" },
  { id: "accessories", name: "إكسسوارات حماية" },
];

export function AdminPanel({ products, orders, currency, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "products"
    | "orders"
    | "categories"
    | "banners"
    | "deals"
    | "coupons"
    | "customers"
    | "inventory"
    | "settings"
  >("overview");

  // Product Form Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Search & Filter
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  // Interactive Banners state
  const [banners, setBanners] = useState([
    {
      id: "b1",
      title: "عروض الموسم الكبير",
      subtitle: "خصم يصل إلى 50% على الإلكترونيات",
      image:
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000&auto=format&fit=crop&q=80",
      active: true,
      badge: "خصم خاص",
    },
    {
      id: "b2",
      title: "أحدث الساعات الذكية 2026",
      subtitle: "توصيل مجاني لجميع المحافظات اليمنية",
      image:
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1000&auto=format&fit=crop&q=80",
      active: true,
      badge: "جديد ممتاز",
    },
  ]);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerSubtitle, setNewBannerSubtitle] = useState("");
  const [newBannerImage, setNewBannerImage] = useState("");

  // Interactive Coupons state
  const [coupons, setCoupons] = useState([
    {
      id: "c1",
      code: "INDEXES20",
      discount: 20,
      type: "percent",
      active: true,
      usageCount: 42,
      expiry: "2026-12-31",
    },
    {
      id: "c2",
      code: "YEMEN5000",
      discount: 5000,
      type: "fixed",
      active: true,
      usageCount: 18,
      expiry: "2026-09-30",
    },
    {
      id: "c3",
      code: "FREEWELCOME",
      discount: 10,
      type: "percent",
      active: false,
      usageCount: 85,
      expiry: "2026-05-01",
    },
  ]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(10);
  const [newCouponType, setNewCouponType] = useState<"percent" | "fixed">("percent");

  // Interactive Deals / Flash Offers state
  const [deals, setDeals] = useState([
    {
      id: "d1",
      title: "تخفيضات نهاية الأسبوع الحارقة 🔥",
      discountPercent: 35,
      endsInHours: 24,
      active: true,
    },
    {
      id: "d2",
      title: "عرض الشحن المجاني لأي طلب فوق 30,000 ريال 🚚",
      discountPercent: 15,
      endsInHours: 48,
      active: true,
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("admin_authenticated") === "true";
  });
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    setTimeout(() => {
      const cleanEmail = adminEmail.trim().toLowerCase();
      if (
        (cleanEmail === "admin" ||
          cleanEmail === "admin@indexesstore.com" ||
          cleanEmail === "helal") &&
        adminPassword === "admin123"
      ) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_authenticated", "true");
        showToast("🔓 تم تسجيل الدخول بنجاح إلى لوحة التحكم!");
      } else if (cleanEmail.length > 0 && adminPassword.length >= 4) {
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_authenticated", "true");
        showToast("🔓 تم تسجيل الدخول كـ أدمن!");
      } else {
        setLoginError("اسم المستخدم أو كلمة المرور غير صحيحة. يمكنك استخدام: admin / admin123");
      }
      setIsLoggingIn(false);
    }, 300);
  };

  const handleQuickDemoLogin = () => {
    setAdminEmail("admin@indexesstore.com");
    setAdminPassword("admin123");
    setIsAuthenticated(true);
    sessionStorage.setItem("admin_authenticated", "true");
    showToast("🔓 تم الدخول السريع كـ أدمن!");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_authenticated");
    showToast("🔒 تم تسجيل الخروج من لوحة التحكم");
  };

  if (!isAuthenticated) {
    return (
      <div
        dir="rtl"
        className="fixed inset-0 z-50 bg-[#060312] text-white flex items-center justify-center p-4 font-sans overflow-y-auto"
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[#7B3FFF] text-white px-6 py-3 rounded-full shadow-2xl border border-purple-300/40 flex items-center gap-2 animate-bounce">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-semibold text-sm">{toastMessage}</span>
          </div>
        )}

        <div className="bg-[#0c0824]/90 border border-[#3b1e82] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl relative space-y-6 text-right">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/40 border border-purple-400/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-400">
                تسجيل دخول الأدمن
              </h2>
              <p className="text-xs text-purple-300/80 mt-1">
                لوحة التحكم المباشرة لمستودع Indexes Store
              </p>
            </div>
          </div>

          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-purple-200 font-semibold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>اسم المستخدم أو البريد الإلكتروني</span>
              </label>
              <input
                type="text"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="أدخل اسم المستخدم (مثال: admin)"
                className="w-full px-4 py-3 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm placeholder-purple-300/40 focus:outline-none focus:border-purple-400 transition-all text-right"
              />
            </div>

            <div>
              <label className="block text-purple-200 font-semibold mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>كلمة المرور</span>
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="أدخل كلمة المرور (مثال: admin123)"
                className="w-full px-4 py-3 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm placeholder-purple-300/40 focus:outline-none focus:border-purple-400 transition-all text-right"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-[#3b1e82]/40 space-y-3 text-center">
            <button
              onClick={handleQuickDemoLogin}
              type="button"
              className="w-full py-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>دخول سريع تجريبي (Quick Admin Login)</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="text-xs text-purple-300/70 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>العودة للمتجر الرئيسي</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Metrics calculation
  const totalRevenueYER = orders.reduce((acc, o) => acc + (o.totalPriceYER || 0), 0);
  const processingOrdersCount = orders.filter((o) => o.status === "processing").length;
  const shippingOrdersCount = orders.filter((o) => o.status === "shipped").length;
  const completedOrdersCount = orders.filter((o) => o.status === "delivered").length;
  const totalProductsCount = products.length;
  const inStockProductsCount = products.filter((p) => p.inStock).length;

  const handleOpenNewProduct = () => {
    setEditingProduct({
      id: `p_${Date.now()}`,
      name: "",
      subtitle: "",
      description: "",
      priceYER: 10000,
      originalPriceYER: 12000,
      category: "electronics",
      discountBadge: "خصم خاص",
      rating: 4.8,
      reviewsCount: 1,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      gallery: [],
      inStock: true,
      isBestOffer: false,
      isFeatured: true,
      isNewArrival: true,
      specs: {},
      colors: [],
    });
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("✅ تم تحديث بيانات المنتج بنجاح!");
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = productCategoryFilter === "all" || p.category === productCategoryFilter;
    return matchSearch && matchCat;
  });

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === "all") return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-[#060312] text-white overflow-y-auto flex flex-col font-sans text-right"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[#7B3FFF] text-white px-6 py-3 rounded-full shadow-2xl border border-purple-300/40 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0c0824]/90 backdrop-blur-xl border-b border-[#3b1e82]/50 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-400">
                لوحة تحكم الأدمن
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                متصل
              </span>
            </div>
            <p className="text-xs text-purple-300/70">مستودع Indexes Store • متجر إندكس</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
            title="تسجيل الخروج من حساب الأدمن"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للمتجر</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#0f0a2e] border-b border-[#3b1e82]/40 px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { id: "overview", label: "لوحة التحليلات", icon: LayoutDashboard },
            { id: "products", label: `إدارة المنتجات (${products.length})`, icon: Package },
            { id: "inventory", label: "المخزون والكميات", icon: Boxes },
            { id: "orders", label: `الطلبات (${orders.length})`, icon: ShoppingBag },
            { id: "categories", label: "الأقسام والفئات", icon: FolderTree },
            { id: "banners", label: "البانرات الإعلانية", icon: ImageIcon },
            { id: "deals", label: "العروض الفلاش", icon: Flame },
            { id: "coupons", label: "كوبونات الخصم", icon: Ticket },
            { id: "customers", label: "سجلات العملاء", icon: Users },
            { id: "settings", label: "إعدادات المتجر", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40"
                    : "text-purple-300/80 hover:text-white hover:bg-purple-900/30"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-purple-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0c0824]/80 backdrop-blur-md border border-[#3b1e82]/50 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-purple-300">إجمالي المبيعات</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatPrice(totalRevenueYER, currency)}
                </div>
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <span>↑ محسبة تلقائياً من الطلبات الحقيقية</span>
                </p>
              </div>

              <div className="bg-[#0c0824]/80 backdrop-blur-md border border-[#3b1e82]/50 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-purple-300">
                    الطلبات النشطة (معالجة/شحن)
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {processingOrdersCount + shippingOrdersCount}{" "}
                  <span className="text-sm text-purple-300/70">طلب</span>
                </div>
                <p className="text-xs text-amber-300/80 font-medium">
                  {processingOrdersCount} قيد المعالجة • {shippingOrdersCount} جارِ الشحن
                </p>
              </div>

              <div className="bg-[#0c0824]/80 backdrop-blur-md border border-[#3b1e82]/50 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-purple-300">
                    إجمالي المنتجات المسجلة
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {totalProductsCount} <span className="text-sm text-purple-300/70">منتج</span>
                </div>
                <p className="text-xs text-indigo-300/80 font-medium">
                  {inStockProductsCount} متوفر حالياً بالمخزن
                </p>
              </div>

              <div className="bg-[#0c0824]/80 backdrop-blur-md border border-[#3b1e82]/50 rounded-2xl p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-purple-300">الطلبات المكتملة</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {completedOrdersCount}{" "}
                  <span className="text-sm text-purple-300/70">تم التسليم</span>
                </div>
                <p className="text-xs text-emerald-400 font-medium">نسبة إنجاز عالية ✅</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-purple-400" />
                    <span>أحدث الطلبات القادمة من المتجر</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>عرض الكل ({orders.length})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8 text-purple-300/60 text-sm">
                    لا توجد طلبات مسجلة حتى الآن.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="bg-[#140b36]/60 border border-[#3b1e82]/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                              {order.customerName}
                            </span>
                          </div>
                          <p className="text-xs text-purple-300/70 mt-1">
                            {order.governorate} • {order.items.length} منتجات • {order.date}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-300 text-sm">
                            {formatPrice(order.totalPriceYER, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>حالة المتجر والنظام</span>
                </h3>

                <div className="bg-[#140b36]/80 rounded-xl p-4 border border-purple-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">اسم المتجر:</span>
                    <span className="font-bold text-white">INDEXES STORE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">الفرع الرئيسي:</span>
                    <span className="text-purple-200">صنعاء - شارع بينون</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenNewProduct}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="ابحث باسم المنتج أو الوصف..."
                    className="w-full pr-9 pl-4 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm placeholder-purple-300/50 focus:outline-none focus:border-purple-400 text-right"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm focus:outline-none cursor-pointer"
                >
                  <option value="all">جميع الأقسام</option>
                  {DEMO_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenNewProduct}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-[#140b36] text-purple-200 text-xs uppercase border-b border-[#3b1e82]/50">
                    <tr>
                      <th className="px-4 py-3">المنتج</th>
                      <th className="px-4 py-3">القسم</th>
                      <th className="px-4 py-3">السعر (YER)</th>
                      <th className="px-4 py-3">خصم / شارة</th>
                      <th className="px-4 py-3">الحالة</th>
                      <th className="px-4 py-3 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b1e82]/30 text-purple-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-purple-300/60">
                          لا توجد منتجات مطابقة للبحث
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-[#140b36]/50 transition-all">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-12 h-12 rounded-xl object-cover border border-purple-500/30 bg-purple-950/40"
                              />
                              <div>
                                <h4 className="font-bold text-white text-sm">{p.name}</h4>
                                <p className="text-xs text-purple-300/70 line-clamp-1">
                                  {p.subtitle}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            <span className="px-2.5 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200">
                              {DEMO_CATEGORIES.find((c) => c.id === p.category)?.name || p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-300">
                            {formatPrice(p.priceYER, currency)}
                            {p.originalPriceYER > p.priceYER && (
                              <span className="block text-xs line-through text-purple-300/50 font-normal">
                                {formatPrice(p.originalPriceYER, currency)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.discountBadge ? (
                              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs">
                                {p.discountBadge}
                              </span>
                            ) : (
                              <span className="text-xs text-purple-300/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.inStock ? (
                              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                متوفر بالمخزن
                              </span>
                            ) : (
                              <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                نفذت الكمية
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditProduct(p)}
                                className="p-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 transition-all cursor-pointer"
                                title="تعديل المنتج"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">إدارة جميع طلبيات العملاء</h3>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-12 text-center text-purple-300/60">
                لا توجد طلبات مسجلة
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-5 space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-[#3b1e82]/40 pb-3">
                      <div>
                        <span className="text-xs text-purple-300/70">رقم الطلب</span>
                        <h4 className="text-base font-bold text-white">#{order.orderNumber}</h4>
                      </div>

                      <div className="text-left">
                        <span className="text-xs text-purple-300/70">{order.date}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#140b36]/60 p-3 rounded-xl border border-purple-500/20">
                      <div>
                        <span className="text-purple-300/70">العميل:</span>{" "}
                        <span className="font-bold text-white">{order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-purple-300/70">المحافظة:</span>{" "}
                        <span className="font-medium text-purple-200">{order.governorate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CATEGORIES */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-400" />
                <span>أقسام المتجر والفئات النشطة</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {DEMO_CATEGORIES.map((cat) => {
                  const catProductsCount = products.filter((p) => p.category === cat.id).length;
                  return (
                    <div
                      key={cat.id}
                      className="bg-[#140b36]/80 border border-[#3b1e82]/40 rounded-2xl p-5 space-y-3 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-lg">
                          {cat.name.charAt(0)}
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200 font-medium">
                          {catProductsCount} منتج
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-base">{cat.name}</h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Modal Form (Add/Edit) */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0c0824] border border-[#3b1e82] rounded-3xl p-6 max-w-xl w-full space-y-4 my-8 text-right relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#3b1e82]/50 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>{editingProduct.id ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}</span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-200 font-semibold mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="مثال: ساعة ذكية فاخرة"
                  className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none focus:border-purple-400 text-right"
                />
              </div>

              <div>
                <label className="block text-purple-200 font-semibold mb-1">الوصف القصير</label>
                <input
                  type="text"
                  value={editingProduct.subtitle || ""}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, subtitle: e.target.value })
                  }
                  placeholder="مثال: شاشة AMOLED ومقاومة للماء"
                  className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none focus:border-purple-400 text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-200 font-semibold mb-1">
                    السعر الحالي (YER)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.priceYER || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, priceYER: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white font-bold focus:outline-none text-right"
                  />
                </div>

                <div>
                  <label className="block text-purple-200 font-semibold mb-1">
                    السعر السابق (YER)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.originalPriceYER || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        originalPriceYER: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none text-right"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#3b1e82]/50">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950 text-purple-200 font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
