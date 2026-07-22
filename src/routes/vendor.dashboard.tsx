import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Settings,
  Plus,
  ExternalLink,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  getVendorByUserId,
  getVendorAnalytics,
  getVendorProfile,
  updateVendorProfile,
  type VendorDetails,
  type VendorAnalytics,
} from '@/lib/services/vendor.service';
import { getVendorOrders, updateVendorOrderStatus } from '@/lib/services/vendor-order.service';
import { getVendorCommissionLedger } from '@/lib/services/commission.service';

export const Route = createFileRoute('/vendor/dashboard')({
  component: VendorDashboardPage,
});

function VendorDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'analytics' | 'settings' | 'earnings'>('overview');

  // Form states for profile/bank settings
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    async function loadVendorData() {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        navigate({ to: '/auth', search: { next: '/vendor/dashboard' } });
        return;
      }

      const vendorData = await getVendorByUserId(supabase, authData.user.id);
      if (!vendorData) {
        setVendor(null);
        setLoading(false);
        return;
      }

      setVendor(vendorData);

      // Load vendor analytics, orders, products, commissions in parallel
      const [analyticsData, ordersData, productsRes, ledgerData, profileData] = await Promise.all([
        getVendorAnalytics(supabase, vendorData.id),
        getVendorOrders(supabase, vendorData.id),
        supabase.from('products').select('*').eq('vendor_id', vendorData.id).order('created_at', { ascending: false }),
        getVendorCommissionLedger(supabase, vendorData.id),
        getVendorProfile(supabase, vendorData.id),
      ]);

      setAnalytics(analyticsData);
      setOrders(ordersData);
      setProducts(productsRes.data ?? []);
      setCommissions(ledgerData);

      if (profileData) {
        setBankName(profileData.bank_name ?? '');
        setBankAccountName(profileData.bank_account_name ?? '');
        setBankIban(profileData.bank_iban ?? '');
        setWalletNumber(profileData.wallet_number ?? '');
      }

      setLoading(false);
    }

    loadVendorData();
  }, [navigate]);

  const handleUpdateOrderStatus = async (vendorOrderId: string, newStatus: any) => {
    if (!vendor) return;
    const updated = await updateVendorOrderStatus(supabase, vendorOrderId, vendor.id, newStatus);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === vendorOrderId ? { ...o, status: newStatus } : o)));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setSavingSettings(true);
    setSettingsSuccess('');

    await updateVendorProfile(supabase, vendor.id, {
      business_type: 'individual',
      contact_email: vendor.user_id + '@vendor.com',
      contact_phone: '777000000',
      bank_name: bankName,
      bank_account_name: bankAccountName,
      bank_iban: bankIban,
      wallet_number: walletNumber,
    });

    setSavingSettings(false);
    setSettingsSuccess('تم حفظ بيانات الحساب البنكي والسداد بنجاح!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center dir-rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium">جاري تحميل لوحة التاجر...</p>
        </div>
      </div>
    );
  }

  // State: User is not yet registered as a vendor
  if (!vendor) {
    return (
      <div className="min-h-screen bg-slate-950 text-white dir-rtl flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-400">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-3">انضم كتاجر في اندكس ستور</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            قم ببيع منتجاتك لملايين العملاء، وقم بإدارة متجرك ومبيعاتك عبر لوحة تحكم التاجر الذكية.
          </p>
          <button
            onClick={() => navigate({ to: '/admin/platform' })}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <span>تقديم طلب انضمام كتاجر</span>
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // State: Vendor status is pending approval
  if (vendor.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-950 text-white dir-rtl flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-amber-500/30 rounded-2xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-3">طلب المتجر قيد المراجعة</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            تم استلام طلبك لإنشاء متجر <strong className="text-amber-400">{vendor.name}</strong>. يراجع الفريق الطلب حالياً وسيتم تفعيله خلال 24 ساعة.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-semibold">
            <span>الحالة: بانتظار الموافقة</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 dir-rtl font-sans pb-16">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              {vendor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">{vendor.name}</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  تاجر مفعّل
                </span>
              </div>
              <p className="text-xs text-slate-400">لوحة تحكم البائع • اندكس ستور</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/vendor/${vendor.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-all"
            >
              <span>معاينة متجري العامة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'overview', label: 'النظرة العامة', icon: Store },
            { id: 'products', label: 'المنتجات', icon: Package, badge: products.length },
            { id: 'orders', label: 'الطلبات', icon: ShoppingBag, badge: orders.length },
            { id: 'analytics', label: 'المبيعات والأرباح', icon: TrendingUp },
            { id: 'earnings', label: 'سجل العمولات', icon: CreditCard },
            { id: 'settings', label: 'إعدادات الحساب والبنك', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">إجمالي المبيعات</span>
                  <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{analytics?.total_sales.toLocaleString()} YER</div>
                <span className="text-xs text-slate-500 mt-1 block">إجمالي قيمة المنتجات المبيعة</span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">صافي الأرباح</span>
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400">{analytics?.net_earnings.toLocaleString()} YER</div>
                <span className="text-xs text-slate-500 mt-1 block">بعد خصم عمولة المنصة ({vendor.commission_rate}%)</span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">إجمالي الطلبات</span>
                  <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{analytics?.total_orders}</div>
                <span className="text-xs text-slate-500 mt-1 block">طلبات الشراء المستلمة</span>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400">العمولات المعلقة</span>
                  <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400">{analytics?.pending_commission.toLocaleString()} YER</div>
                <span className="text-xs text-slate-500 mt-1 block">عمولة المنصة قيد التسوية</span>
              </div>
            </div>

            {/* Quick Actions & Recent Orders Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <span>أحدث الطلبات الخاصة بمتجرك</span>
                </h3>

                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">لا توجد طلبات مستلمة بعد.</div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-mono text-sm font-bold text-blue-400">{order.vendor_order_number}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            العميل: {order.orders?.customer_name ?? 'ضيف'} • {order.orders?.customer_phone}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-white">{Number(order.subtotal).toLocaleString()} YER</div>
                          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-1">
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vendor Info Card */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-emerald-400" />
                  <span>معلومات التاجر والعمولة</span>
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-800 text-slate-400">
                    <span>اسم المتجر:</span>
                    <strong className="text-white">{vendor.name}</strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800 text-slate-400">
                    <span>نوع العمولة:</span>
                    <strong className="text-white">
                      {vendor.commission_type === 'percentage' ? `نسبة مئوية (${vendor.commission_rate}%)` : `مبلغ ثابت`}
                    </strong>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800 text-slate-400">
                    <span>التقييم العام:</span>
                    <strong className="text-amber-400">★ {vendor.rating ?? 5.0}</strong>
                  </div>
                </div>

                <button
                  onClick={() => navigate({ to: '/admin/products' })}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد لمتجرك</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products */}
        {activeTab === 'products' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">منتجات المتجر ({products.length})</h3>
              <button
                onClick={() => navigate({ to: '/admin/products' })}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج</span>
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 text-slate-500">لا توجد منتجات مسجلة باسم هذا التاجر حتى الآن.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div key={p.id} className="p-4 bg-slate-950/60 border border-slate-800/70 rounded-xl flex items-center gap-4">
                    <img
                      src={p.images?.[0] ?? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                      alt={p.name}
                      className="w-16 h-16 object-cover rounded-lg bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{p.name}</h4>
                      <div className="text-xs text-slate-400 mt-1">{Number(p.price).toLocaleString()} YER</div>
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded mt-2 ${
                          p.is_published ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6">إدارة طلبات التاجر</h3>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-500">لا توجد طلبات مستلمة.</div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-3">
                      <div>
                        <span className="font-mono text-sm font-bold text-blue-400">{o.vendor_order_number}</span>
                        <div className="text-xs text-slate-400 mt-0.5">
                          تاريخ الطلب: {new Date(o.created_at).toLocaleDateString('ar-YE')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">الحالة:</span>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-slate-900 text-white border border-slate-700 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:border-blue-500"
                        >
                          <option value="pending">قيد الانتظار (Pending)</option>
                          <option value="confirmed">تم التأكيد (Confirmed)</option>
                          <option value="processing">جاري التحضير (Processing)</option>
                          <option value="shipped">تم الشحن (Shipped)</option>
                          <option value="delivered">تم التسليم (Delivered)</option>
                          <option value="cancelled">ملغي (Cancelled)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500 block">بيانات العميل:</span>
                        <strong className="text-white">{o.orders?.customer_name ?? 'ضيف'}</strong>
                        <div className="text-slate-400">{o.orders?.customer_phone}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 block">عنوان التوصيل:</span>
                        <div>{o.orders?.customer_address ?? 'غير محدد'}</div>
                      </div>
                      <div className="text-left">
                        <span className="text-slate-500 block">إجمالي المنتجات:</span>
                        <strong className="text-base text-emerald-400">{Number(o.subtotal).toLocaleString()} YER</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4 & 5: Earnings & Settings */}
        {activeTab === 'earnings' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-6">سجل عمولات ومستحقات المنصة</h3>

            {commissions.length === 0 ? (
              <div className="text-center py-16 text-slate-500">لا توجد عمليات عمولة مسجلة حتى الآن.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">رقم الطلب</th>
                      <th className="p-3">المبلغ الإجمالي</th>
                      <th className="p-3">نسبة العمولة</th>
                      <th className="p-3">عمولة المنصة</th>
                      <th className="p-3">صافي المستحق للتاجر</th>
                      <th className="p-3">حالة السداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-mono text-blue-400">{c.order_id.substring(0, 8)}</td>
                        <td className="p-3 text-white font-bold">{Number(c.gross_amount).toLocaleString()} YER</td>
                        <td className="p-3 text-slate-400">{c.commission_rate}%</td>
                        <td className="p-3 text-amber-400 font-bold">{Number(c.commission_amount).toLocaleString()} YER</td>
                        <td className="p-3 text-emerald-400 font-bold">{Number(c.net_amount).toLocaleString()} YER</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full font-semibold ${
                              c.payout_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {c.payout_status === 'paid' ? 'تمت التسوية' : 'قيد الانتظار'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Settings & Bank Setup */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-2">إعدادات الحساب والتحويلات البنكية</h3>
            <p className="text-xs text-slate-400 mb-6">قم بإضافة بيانات حسابك البنكي أو المحفظة الإلكترونية لاستلام مستحقاتك الأسبوعية.</p>

            {settingsSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم البنك / الخدمة المالية</label>
                <input
                  type="text"
                  placeholder="مثال: بنك الكريمي / محفظة جوالي"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المستفيد الكامل</label>
                <input
                  type="text"
                  placeholder="اسم صاحب الحساب كما هو بالبنك"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الحساب أو IBAN</label>
                <input
                  type="text"
                  placeholder="YE00000000000000000000"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم المحفظة الإلكترونية (اختياري)</label>
                <input
                  type="text"
                  placeholder="770000000"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm mt-6"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>حفظ بيانات الحساب البنكي</span>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
