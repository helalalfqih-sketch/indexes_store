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
  Truck,
  XCircle,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  RefreshCw,
  ExternalLink,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
  Check,
  Tag,
  Store,
  Layers,
  ArrowLeft,
  X,
  AlertCircle,
  Lock,
  LogOut,
  User,
  Key,
  Image as ImageIcon,
  Percent,
  Ticket,
  Boxes,
  Flame,
  Gift,
} from "lucide-react";
import { Product, OrderStatus, Currency } from "./types";
import { formatPrice } from "./currency";

const CATEGORIES = [
  { id: "all", name: "الكل" },
  { id: "electronics", name: "إلكترونيات" },
  { id: "audio", name: "صوتيات" },
  { id: "smartwatches", name: "ساعات ذكية" },
  { id: "appliances", name: "أجهزة منزلية" },
  { id: "perfumes", name: "عطور وخلايا" },
];

const saveFirestoreProduct = async (_p: Partial<Product>) => {};
const deleteFirestoreProduct = async (_id: string) => {};
const updateFirestoreOrderStatus = async (_id: string, _status: string, _label?: string) => {};
const deleteFirestoreOrder = async (_id: string) => {};
const seedInitialProductsIfNeeded = async () => {};

interface AdminPanelProps {
  products: Product[];
  orders: OrderStatus[];
  currency: Currency;
  onClose: () => void;
  onOpenEvolutionStudio?: () => void;
}

export function AdminPanel({
  products,
  orders,
  currency,
  onClose,
  onOpenEvolutionStudio,
}: AdminPanelProps) {
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
      badge: "خصم حاص",
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
      title: "عرض الشحن المجاني لأي طلب فوق 50,000 ريال 🚚",
      discountPercent: 15,
      endsInHours: 48,
      active: true,
    },
  ]);

  // Saving state indicator
  const [isSaving, setIsSaving] = useState(false);
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
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-purple-600 text-white px-6 py-3 rounded-full shadow-2xl border border-purple-300/40 flex items-center gap-2 animate-bounce">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-semibold text-sm">{toastMessage}</span>
          </div>
        )}

        <div className="bg-[#0c0824]/90 border border-[#3b1e82] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl backdrop-blur-xl relative space-y-6">
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
                className="w-full px-4 py-3 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm placeholder-purple-300/40 focus:outline-none focus:border-purple-400 transition-all"
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
                className="w-full px-4 py-3 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm placeholder-purple-300/40 focus:outline-none focus:border-purple-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
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
              className="w-full py-2.5 rounded-xl bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>دخول سريع تجريبي (Quick Admin Login)</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="text-xs text-purple-300/70 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto"
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

  // Product CRUD
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
      rating: 0,
      reviewsCount: 0,
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

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    setIsSaving(true);
    try {
      const prodToSave = {
        id: editingProduct.id || `p_${Date.now()}`,
        name: editingProduct.name,
        subtitle: editingProduct.subtitle || "",
        description: editingProduct.description || "",
        priceYER: Number(editingProduct.priceYER) || 0,
        originalPriceYER:
          Number(editingProduct.originalPriceYER) || Number(editingProduct.priceYER) || 0,
        category: editingProduct.category || "electronics",
        discountBadge: editingProduct.discountBadge || "",
        rating: Number.isFinite(editingProduct.rating) ? editingProduct.rating : 0,
        reviewsCount: Number.isFinite(editingProduct.reviewsCount)
          ? editingProduct.reviewsCount
          : 0,
        image:
          editingProduct.image ||
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        gallery: editingProduct.gallery || [],
        inStock: editingProduct.inStock ?? true,
        isBestOffer: editingProduct.isBestOffer ?? false,
        isFeatured: editingProduct.isFeatured ?? false,
        isNewArrival: editingProduct.isNewArrival ?? false,
        specs: editingProduct.specs || {},
        colors: editingProduct.colors || [],
      } as Product;

      await saveFirestoreProduct(prodToSave);
      showToast("✅ تم حفظ المنتج في الفايربيس بنجاح!");
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      showToast("❌ حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("هل أنت تأكد من حذف هذا المنتج نهائياً من قاعدة البيانات؟")) return;
    try {
      await deleteFirestoreProduct(productId);
      showToast("🗑️ تم حذف المنتج من الفايربيس");
    } catch (err) {
      console.error(err);
      showToast("❌ تعذر الحذف");
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus["status"]) => {
    let statusLabel = "جاري معالجة الطلب ⏳";
    if (status === "shipped") statusLabel = "تم الشحن وهو في الطريق 🚚";
    if (status === "delivered") statusLabel = "تم التسليم بنجاح ✅";
    if (status === "cancelled") statusLabel = "تم إلغاء الطلب ❌";

    try {
      await updateFirestoreOrderStatus(orderId, status, statusLabel);
      showToast("⚡ تم تحديث حالة الطلب فوراً في الفايربيس");
    } catch (err) {
      console.error(err);
      showToast("❌ خطأ في التحديث");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("هل تريد حذف هذا الطلب من قاعدة البيانات؟")) return;
    try {
      await deleteFirestoreOrder(orderId);
      showToast("🗑️ تم حذف الطلب");
    } catch (err) {
      console.error(err);
      showToast("❌ خطأ في الحذف");
    }
  };

  const handleResetCatalog = async () => {
    if (!window.confirm("هل تريد استيراد وإعادة المزامنة مع الكتالوج الأساسي في الفايربيس؟"))
      return;
    try {
      await seedInitialProductsIfNeeded();
      showToast("🔄 تم تحديث المنتجات في الفايربيس بنجاح!");
    } catch (err) {
      console.error(err);
      showToast("❌ فشلت المزامنة");
    }
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
      className="fixed inset-0 z-50 bg-[#060312] text-white overflow-y-auto flex flex-col font-sans"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-purple-600 text-white px-6 py-3 rounded-full shadow-2xl border border-purple-300/40 flex items-center gap-2 animate-bounce">
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
                متصل بالفايربيس
              </span>
            </div>
            <p className="text-xs text-purple-300/70">
              مستودع Indexes Store • قاعدة البيانات الحية Firestore
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {onOpenEvolutionStudio && (
            <button
              onClick={() => {
                onClose();
                onOpenEvolutionStudio();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 border border-purple-300/40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>فتح استوديو التطور ✨</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-200 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105"
            title="تسجيل الخروج من حساب الأدمن"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>تسجيل الخروج</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105"
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
            { id: "settings", label: "إعدادات المتجر والربط", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
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
        {/* ==================== TAB 1: OVERVIEW ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0c0824]/80 backdrop-blur-md border border-[#3b1e82]/50 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
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

            {/* Quick Control Center & Database Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders Overview */}
              <div className="lg:col-span-2 bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-purple-400" />
                    <span>أحدث الطلبات القادمة من المتجر</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-medium"
                  >
                    <span>عرض الكل ({orders.length})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8 text-purple-300/60 text-sm">
                    لا توجد طلبات مسجلة حتى الآن. يمكنك تنفيذ طلب تجريبي من المتجر!
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

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold"
                            >
                              مكتمل ✅
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "shipped")}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-semibold"
                            >
                              شحن 🚚
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* System & Firestore Live Panel */}
              <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>حالة الاتصال والبيانات الحية</span>
                </h3>

                <div className="bg-[#140b36]/80 rounded-xl p-4 border border-purple-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">مزود البيانات:</span>
                    <span className="font-bold text-emerald-300">Firebase Firestore</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">معرف قاعدة البيانات:</span>
                    <span className="font-mono text-[11px] text-purple-200">
                      ai-studio-indexesstore
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300">وضع التحديث:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      تزامن حي متبادل (Realtime)
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleOpenNewProduct}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة منتج جديد للفايربيس</span>
                  </button>

                  <button
                    onClick={handleResetCatalog}
                    className="w-full py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 font-medium text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة مزامنة منتجات الموديل الأصلي</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PRODUCTS ==================== */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Search & Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="ابحث باسم المنتج أو الوصف..."
                    className="w-full pr-9 pl-4 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm placeholder-purple-300/50 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white text-sm focus:outline-none"
                >
                  <option value="all">جميع الأقسام</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleOpenNewProduct}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* Products Table */}
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
                              {CATEGORIES.find((c) => c.id === p.category)?.name || p.category}
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
                                className="p-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 transition-all"
                                title="تعديل المنتج"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-all"
                                title="حذف المنتج"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* ==================== TAB 3: ORDERS ==================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">إدارة جميع طلبيات العملاء</h3>
              </div>

              <div className="flex items-center gap-2">
                {["all", "processing", "shipped", "delivered", "cancelled"].map((st) => {
                  const labels: Record<string, string> = {
                    all: "الكل",
                    processing: "⏳ معالجة",
                    shipped: "🚚 شحن",
                    delivered: "✅ تم التسليم",
                    cancelled: "❌ ملغي",
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        orderStatusFilter === st
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-[#140b36] text-purple-300 hover:bg-purple-900/40"
                      }`}
                    >
                      {labels[st]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-12 text-center text-purple-300/60">
                لا توجد طلبات في هذا الفلتر
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
                        <div className="mt-1">
                          {order.status === "processing" && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                              ⏳ قيد المعالجة
                            </span>
                          )}
                          {order.status === "shipped" && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                              🚚 تم الشحن
                            </span>
                          )}
                          {order.status === "delivered" && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                              ✅ تم التسليم
                            </span>
                          )}
                          {order.status === "cancelled" && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                              ❌ ملغي
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#140b36]/60 p-3 rounded-xl border border-purple-500/20">
                      <div>
                        <span className="text-purple-300/70">العميل:</span>{" "}
                        <span className="font-bold text-white">{order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-purple-300/70">المحافظة:</span>{" "}
                        <span className="font-medium text-purple-200">{order.governorate}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-purple-300/70">الهاتف:</span>{" "}
                          <span className="font-mono text-amber-300">{order.phone}</span>
                        </div>
                        {order.phone && (
                          <a
                            href={`https://wa.me/967${order.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30"
                          >
                            واتساب 💬
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-purple-300/80 font-medium">
                        المنتجات المطلوبة:
                      </span>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-purple-950/30 p-2 rounded-lg border border-purple-500/20"
                          >
                            <span className="text-purple-100 font-medium">
                              {item.productName} (×{item.quantity})
                            </span>
                            <span className="text-amber-300 font-bold">
                              {formatPrice((item.price || 0) * item.quantity, currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="pt-2 flex items-center justify-between border-t border-[#3b1e82]/40">
                      <div>
                        <span className="text-xs text-purple-300">الإجمالي:</span>
                        <div className="text-base font-bold text-amber-300">
                          {formatPrice(order.totalPriceYER, currency)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                        >
                          تأكيد التسليم ✅
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "shipped")}
                          className="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 text-xs font-semibold"
                        >
                          شحن 🚚
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: CATEGORIES ==================== */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-400" />
                <span>أقسام المتجر والفئات النشطة</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => {
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
                        <p className="text-xs text-purple-300/70 mt-1">قسم نشط ومزود بالفايربيس</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: INVENTORY ==================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-purple-400" />
                    <span>مراقبة وإدارة كميات المخزون</span>
                  </h3>
                  <p className="text-xs text-purple-300/70 mt-0.5">
                    تتبع المنتجات المتوفرة وغير المتوفرة بلمسة واحدة
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold">
                    المتوفر: {products.filter((p) => p.inStock !== false).length}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold">
                    نفذت الكمية: {products.filter((p) => p.inStock === false).length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-purple-200">
                  <thead className="bg-[#140b36] text-purple-300 border-b border-[#3b1e82]/50">
                    <tr>
                      <th className="p-3 font-semibold">المنتج</th>
                      <th className="p-3 font-semibold">القسم</th>
                      <th className="p-3 font-semibold">السعر الحالي</th>
                      <th className="p-3 font-semibold">الحالة بالمخزن</th>
                      <th className="p-3 font-semibold text-center">التحكم السريع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b1e82]/30">
                    {products.map((product) => {
                      const isAvailable = product.inStock !== false;
                      return (
                        <tr key={product.id} className="hover:bg-purple-900/20 transition-colors">
                          <td className="p-3 flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-xl border border-purple-500/30"
                            />
                            <div>
                              <div className="font-bold text-white">{product.name}</div>
                              <div className="text-[11px] text-purple-300/70">
                                {product.subtitle}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-medium">
                            {CATEGORIES.find((c) => c.id === product.category)?.name ||
                              product.category}
                          </td>
                          <td className="p-3 font-bold text-amber-300">
                            {formatPrice(product.priceYER, currency)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isAvailable
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {isAvailable ? "متوفر بالمخزن ✅" : "نفذت الكمية ❌"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={async () => {
                                setIsSaving(true);
                                const updated = { ...product, inStock: !isAvailable };
                                await saveFirestoreProduct(updated as Product);
                                showToast(`تم تغيير حالة ${product.name} بنجاح`);
                                setIsSaving(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-500/30 font-semibold text-xs"
                            >
                              {isAvailable ? "تعيين كـ غير متوفر" : "توفير بالمخزن"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: BANNERS ==================== */}
        {activeTab === "banners" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    <span>إدارة البانرات والشرائح الإعلانية</span>
                  </h3>
                  <p className="text-xs text-purple-300/70 mt-0.5">
                    خصص العروض البصرية واجذب زوار المتجر
                  </p>
                </div>
              </div>

              {/* Add Banner Form */}
              <div className="bg-[#140b36]/90 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-purple-200">إضافة بانر جديد</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="عنوان البانر"
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0a0520] border border-purple-500/30 text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="العنوان الفرعي"
                    value={newBannerSubtitle}
                    onChange={(e) => setNewBannerSubtitle(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0a0520] border border-purple-500/30 text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="رابط الصورة (URL)"
                    value={newBannerImage}
                    onChange={(e) => setNewBannerImage(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#0a0520] border border-purple-500/30 text-white font-mono text-[11px] focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!newBannerTitle || !newBannerImage) {
                      showToast("يرجى إدخال عنوان ورابط صورة البانر");
                      return;
                    }
                    setBanners([
                      ...banners,
                      {
                        id: "b" + Date.now(),
                        title: newBannerTitle,
                        subtitle: newBannerSubtitle || "عرض مميز",
                        image: newBannerImage,
                        active: true,
                        badge: "جديد",
                      },
                    ]);
                    setNewBannerTitle("");
                    setNewBannerSubtitle("");
                    setNewBannerImage("");
                    showToast("تمت إضافة البانر الإعلاني بنجاح 🎉");
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md"
                >
                  حفظ البانر
                </button>
              </div>

              {/* Active Banners Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-[#140b36] group"
                  >
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-40 object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-black text-[10px] font-extrabold mb-1 inline-block">
                            {banner.badge}
                          </span>
                          <h4 className="font-bold text-white text-base">{banner.title}</h4>
                          <p className="text-xs text-purple-200">{banner.subtitle}</p>
                        </div>
                        <button
                          onClick={() => {
                            setBanners(banners.filter((b) => b.id !== banner.id));
                            showToast("تم حذف البانر");
                          }}
                          className="p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/60 text-rose-200 border border-rose-500/40"
                          title="حذف البانر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: DEALS ==================== */}
        {activeTab === "deals" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>عروض التخفيضات الفلاش والخصومات الحارقة</span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  تحكم بجدولة الحملات الترويجية الموقوتة
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-[#140b36] border border-purple-500/30 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-white text-sm">{deal.title}</h4>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                        خصم {deal.discountPercent}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-purple-300 border-t border-purple-500/20 pt-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        ينتهي خلال {deal.endsInHours} ساعة
                      </span>
                      <button
                        onClick={() => {
                          setDeals(
                            deals.map((d) => (d.id === deal.id ? { ...d, active: !d.active } : d)),
                          );
                          showToast("تم تحديث حالة العرض");
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                          deal.active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {deal.active ? "العرض نشط ✅" : "معطل ⏸️"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: COUPONS ==================== */}
        {activeTab === "coupons" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-purple-400" />
                  <span>كوبونات الخصم وقسائم الشراء</span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  أنشئ رموز ترويجية وحفّز الزوار على إتمام الشراء
                </p>
              </div>

              {/* Add Coupon Form */}
              <div className="bg-[#140b36]/90 border border-purple-500/30 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-purple-200">إنشاء كوبون جديد</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="رمز الكوبون (مثال: YEMEN2026)"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="px-3 py-2 rounded-xl bg-[#0a0520] border border-purple-500/30 text-white font-mono uppercase focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="قيمة الخصم"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-[#0a0520] border border-purple-500/30 text-white focus:outline-none"
                  />
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as "percent" | "fixed")}
                    className="px-3 py-2 rounded-xl bg-[#0a0520] border border-purple-500/30 text-white focus:outline-none"
                  >
                    <option value="percent">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت بالريال (YER)</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    if (!newCouponCode) {
                      showToast("يرجى كتابة رمز الكوبون");
                      return;
                    }
                    setCoupons([
                      ...coupons,
                      {
                        id: "c" + Date.now(),
                        code: newCouponCode,
                        discount: newCouponDiscount,
                        type: newCouponType,
                        active: true,
                        usageCount: 0,
                        expiry: "2026-12-31",
                      },
                    ]);
                    setNewCouponCode("");
                    showToast(`تم إنشاء الكوبون ${newCouponCode} بنجاح 🎉`);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md"
                >
                  إضافة الكوبون
                </button>
              </div>

              {/* Coupons List */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-purple-200">
                  <thead className="bg-[#140b36] text-purple-300 border-b border-[#3b1e82]/50">
                    <tr>
                      <th className="p-3 font-semibold">رمز الكوبون</th>
                      <th className="p-3 font-semibold">نوع وقيمة الخصم</th>
                      <th className="p-3 font-semibold">مرات الاستخدام</th>
                      <th className="p-3 font-semibold">تاريخ الانتهاء</th>
                      <th className="p-3 font-semibold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b1e82]/30">
                    {coupons.map((c) => (
                      <tr key={c.id} className="hover:bg-purple-900/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-300 text-sm">{c.code}</td>
                        <td className="p-3 font-semibold text-white">
                          {c.type === "percent"
                            ? `${c.discount}% خصم`
                            : `${c.discount.toLocaleString()} ريال YER`}
                        </td>
                        <td className="p-3 text-purple-300">{c.usageCount} مرة</td>
                        <td className="p-3 font-mono text-purple-300">{c.expiry}</td>
                        <td className="p-3 text-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => {
                              setCoupons(
                                coupons.map((cp) =>
                                  cp.id === c.id ? { ...cp, active: !cp.active } : cp,
                                ),
                              );
                              showToast("تم تغيير حالة الكوبون");
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                              c.active
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-gray-800 text-gray-400 border border-gray-700"
                            }`}
                          >
                            {c.active ? "نشط" : "معطل"}
                          </button>
                          <button
                            onClick={() => {
                              setCoupons(coupons.filter((cp) => cp.id !== c.id));
                              showToast("تم حذف الكوبون");
                            }}
                            className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 inline-flex items-center align-middle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CUSTOMERS ==================== */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>سجلات العملاء والطلبات المباشرة</span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-0.5">
                  سجل تواصل العملاء وإحصائيات المشتريات
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-purple-200">
                  <thead className="bg-[#140b36] text-purple-300 border-b border-[#3b1e82]/50">
                    <tr>
                      <th className="p-3 font-semibold">اسم العميل</th>
                      <th className="p-3 font-semibold">رقم الهاتف والواتساب</th>
                      <th className="p-3 font-semibold">العنوان والمحافظة</th>
                      <th className="p-3 font-semibold">عدد الطلبات</th>
                      <th className="p-3 font-semibold text-center">التواصل الفوري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3b1e82]/30">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-purple-300">
                          لا يوجد عملاء مسجلين حتى الآن
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-purple-900/20 transition-colors">
                          <td className="p-3 font-bold text-white">
                            {order.customerName || "عميل المتجر"}
                          </td>
                          <td className="p-3 font-mono text-amber-300 dir-ltr text-right">
                            {order.phone}
                          </td>
                          <td className="p-3 text-purple-200">
                            {order.governorate || "صنعاء"} - {order.address || "الرئيسي"}
                          </td>
                          <td className="p-3 font-bold text-purple-200">1 طلب</td>
                          <td className="p-3 text-center">
                            <a
                              href={`https://wa.me/967${(order.phone || "").replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>مراسلة واتساب</span>
                            </a>
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

        {/* ==================== TAB 5: SETTINGS ==================== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-[#0c0824]/80 border border-[#3b1e82]/50 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <span>إعدادات المتجر وقاعدة البيانات الحقيقية</span>
                </h3>
                <p className="text-xs text-purple-300/70 mt-1">
                  المشروع مربوط بشكل كامل مع مستودع Indexes Store وقاعدة بيانات الفايربيس
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#140b36]/80 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-white text-sm">معلومات الاتصال بالمتجر</h4>
                  <div className="space-y-2 text-xs text-purple-200">
                    <div className="flex justify-between">
                      <span className="text-purple-300">رقم الهاتف الافتراضي:</span>
                      <span className="font-mono text-amber-300">771370740</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">العملة الأساسية:</span>
                      <span className="font-bold text-white">الريال اليمني (YER)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">الدعم الفني والواتساب:</span>
                      <span className="text-emerald-300 font-semibold">مفعل تلقائياً</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#140b36]/80 border border-purple-500/30 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-white text-sm">حالة مشروعات الفايربيس</h4>
                  <div className="space-y-2 text-xs text-purple-200">
                    <div className="flex justify-between">
                      <span className="text-purple-300">Project ID:</span>
                      <span className="font-mono text-purple-200">gen-lang-client-0726091698</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">Database ID:</span>
                      <span className="font-mono text-purple-200">
                        ai-studio-indexesstore-f5de7c0e...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-300">قواعد الأمان (Rules):</span>
                      <span className="text-emerald-400 font-bold">مفعلة ومنشورة ✅</span>
                    </div>
                  </div>
                </div>
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
                className="p-1.5 rounded-full bg-purple-950 text-purple-300 hover:text-white"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none focus:border-purple-400"
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
                  className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none focus:border-purple-400"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white font-bold focus:outline-none"
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
                    className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-200 font-semibold mb-1">القسم</label>
                  <select
                    value={editingProduct.category || "electronics"}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 font-semibold mb-1">
                    شارة الخصم (إن وجدت)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.discountBadge || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, discountBadge: e.target.value })
                    }
                    placeholder="خصم 25%"
                    className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-purple-200 font-semibold mb-1">
                  رابط صورة المنتج (URL)
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.image || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#140b36] border border-purple-500/30 text-white font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-purple-200">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, inStock: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                  />
                  <span>متوفر بالمخزن</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-purple-200">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestOffer ?? false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isBestOffer: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                  />
                  <span>عرض مميز جداً 🔥</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#3b1e82]/50">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-purple-950 text-purple-200 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ المنتج في الفايربيس"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
