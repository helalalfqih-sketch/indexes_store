import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PackageCheck,
  MapPin,
  User,
  Heart,
  Coins,
  HelpCircle,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  Phone,
  Truck,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Currency, OrderStatus } from '../types';
import { STORE_INFO } from '../data/mockData';
import { formatPrice } from '../lib/currency';
import { StoreLogo } from './StoreLogo';
import { LiteModeToggle } from './LiteModeToggle';
import {
  CustomerProfile,
  SavedAddress,
  getCustomerProfile,
  saveCustomerProfile,
  addCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  subscribeToCustomerOrders,
  maskPhoneNumber,
  clearGuestDeviceProfile,
  getGuestDeviceProfile,
} from '../lib/customerProfile';
import {
  subscribeToAuth,
  logoutCustomer,
  ensureCustomerAuthSession,
  signInCustomerWithEmail,
  signUpCustomerWithEmail,
  signInCustomerWithGoogle,
  SupabaseUser,
} from '../lib/auth';
import { checkAdminSession } from '../lib/adminAuth';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  favoritesCount: number;
  onOpenWishlist: () => void;
  onOpenTrackerForOrder?: (orderNumber: string) => void;
  onOpenAdmin?: () => void;
  onOpenEvolutionStudio?: () => void;
  isAdminUser?: boolean;
}

type AccountTab = 'orders' | 'addresses' | 'profile' | 'wishlist' | 'currency' | 'support' | 'privacy';

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  currency,
  onSelectCurrency,
  favoritesCount,
  onOpenWishlist,
  onOpenTrackerForOrder,
  onOpenAdmin,
  onOpenEvolutionStudio,
  isAdminUser = false,
}) => {
  const [activeTab, setActiveTab] = useState<AccountTab>('orders');
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminUser);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  // Check admin session when user or drawer status changes
  useEffect(() => {
    let isMounted = true;
    checkAdminSession().then((res) => {
      if (isMounted) {
        setIsAdmin(Boolean(res.user));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [currentUser, isOpen, isAdminUser]);

  const [userOrders, setUserOrders] = useState<OrderStatus[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Profile editing state
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [altPhone, setAltPhone] = useState<string>('');
  const [preferredGov, setPreferredGov] = useState<string>(STORE_INFO.governorates[0]);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [autofillEnabled, setAutofillEnabled] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Address modal state inside account
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [newAddrLabel, setNewAddrLabel] = useState<'منزل' | 'عمل' | 'آخر'>('منزل');
  const [newAddrGov, setNewAddrGov] = useState<string>(STORE_INFO.governorates[0]);
  const [newAddrText, setNewAddrText] = useState<string>('');
  const [newAddrLandmark, setNewAddrLandmark] = useState<string>('');
  const [newAddrRecipient, setNewAddrRecipient] = useState<string>('');
  const [newAddrPhone, setNewAddrPhone] = useState<string>('');
  const [newAddrIsDefault, setNewAddrIsDefault] = useState<boolean>(false);

  // Copy feedback
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Customer Supabase Auth state
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const handleCustomerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsSubmittingAuth(true);

    if (authMode === 'signin') {
      const res = await signInCustomerWithEmail(authEmail, authPassword);
      setIsSubmittingAuth(false);
      if (res.error) {
        setAuthError(res.error);
      } else {
        const adminRes = await checkAdminSession();
        if (adminRes.user) {
          setIsAdmin(true);
          setAuthSuccessMsg(`أهلاً وسهلاً بك ${adminRes.user.name}! تم تسجيل الدخول بصلاحيات الأدمن وإظهار زر لوحة التحكم.`);
        }
      }
    } else {
      const res = await signUpCustomerWithEmail(authEmail, authPassword, authFullName);
      setIsSubmittingAuth(false);
      if (res.error) setAuthError(res.error);
      if (res.message) setAuthSuccessMsg(res.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const res = await signInCustomerWithGoogle();
    if (res.error) setAuthError(res.error);
  };

  // Listen to Auth State & load customer data
  useEffect(() => {
    ensureCustomerAuthSession();
    const unsubscribeAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to user profile & orders
  useEffect(() => {
    if (!currentUser) {
      setUserOrders([]);
      setLoadingOrders(false);
      setProfile(null);
      return;
    }

    setLoadingOrders(true);
    setOrdersError(null);

    // Fetch Profile
    getCustomerProfile(currentUser.uid).then((prof) => {
      if (prof) {
        setProfile(prof);
        setFullName(prof.fullName || '');
        setPhone(prof.phone || '');
        setAltPhone(prof.altPhone || '');
        setPreferredGov(prof.preferredGovernorate || STORE_INFO.governorates[0]);
        setDeliveryInstructions(prof.deliveryInstructions || '');
        setAutofillEnabled(prof.autofillEnabled !== false);
      } else {
        // Fallback check guest device profile
        const guest = getGuestDeviceProfile();
        if (guest) {
          setFullName(guest.fullName || '');
          setPhone(guest.phone || '');
          setAltPhone(guest.altPhone || '');
          setPreferredGov(guest.governorate || STORE_INFO.governorates[0]);
          setDeliveryInstructions(guest.deliveryInstructions || '');
        }
      }
    });

    // Subscribe to Orders securely linked to authenticated customer UID
    const unsubOrders = subscribeToCustomerOrders(currentUser.uid, (orders, loading, err) => {
      setUserOrders(orders);
      setLoadingOrders(loading);
      if (err) setOrdersError(err);
    });

    return () => unsubOrders();
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const updated = await saveCustomerProfile(currentUser.uid, {
        fullName,
        phone,
        altPhone,
        preferredGovernorate: preferredGov,
        deliveryInstructions,
        autofillEnabled,
      });
      setProfile(updated);
      setProfileSuccessMsg('تم حفظ بيانات الحساب بنجاح ✓');
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newAddrText.trim() || !newAddrRecipient.trim()) return;

    try {
      const updatedAddresses = await addCustomerAddress(currentUser.uid, {
        label: newAddrLabel,
        governorate: newAddrGov,
        address: newAddrText,
        nearestLandmark: newAddrLandmark,
        recipientName: newAddrRecipient,
        recipientPhone: newAddrPhone || phone,
        isDefault: newAddrIsDefault,
      });
      setProfile((prev) => (prev ? { ...prev, addresses: updatedAddresses } : null));
      setIsAddingAddress(false);
      setNewAddrText('');
      setNewAddrLandmark('');
      setNewAddrRecipient('');
      setNewAddrPhone('');
    } catch (err) {
      console.error('Failed to add address:', err);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!currentUser) return;
    try {
      const updated = await deleteCustomerAddress(currentUser.uid, addrId);
      setProfile((prev) => (prev ? { ...prev, addresses: updated } : null));
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    if (!currentUser) return;
    try {
      const updated = await setDefaultCustomerAddress(currentUser.uid, addrId);
      setProfile((prev) => (prev ? { ...prev, addresses: updated } : null));
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  const handleLogout = async () => {
    clearGuestDeviceProfile();
    await logoutCustomer();
    onClose();
  };

  const tabsNav = [
    { id: 'orders', label: 'طلباتي', icon: PackageCheck, badge: userOrders.length },
    { id: 'addresses', label: 'عناويني', icon: MapPin, badge: profile?.addresses?.length || 0 },
    { id: 'profile', label: 'بياناتي', icon: User },
    { id: 'wishlist', label: 'المفضلة', icon: Heart, badge: favoritesCount },
    { id: 'currency', label: 'العملة', icon: Coins },
    { id: 'support', label: 'المساعدة', icon: HelpCircle },
    { id: 'privacy', label: 'الخصوصية', icon: ShieldCheck },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex justify-end bg-black/75 backdrop-blur-md dir-rtl"
      >
        <div className="flex-1" onClick={onClose} />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 240 }}
          className="w-full max-w-lg bg-[var(--color-surface-1)] border-r border-[var(--color-border-default)] h-full flex flex-col justify-between p-4 sm:p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="pb-3 border-b border-[var(--color-border-default)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StoreLogo variant="icon" className="w-10 h-10" />
                <div>
                  <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                    حسابي مركز التسهيل الذكي
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-secondary)] font-medium">
                    {profile?.fullName ? `مرحباً بك، ${profile.fullName}` : 'عميل متجر إندكس المتميز'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Horizontal Tabs Navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 scroll-smooth">
              {tabsNav.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as AccountTab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2F6BFF] text-white shadow-sm shadow-blue-500/20'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                    {t.badge !== undefined && t.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-[#2F6BFF]/20 text-[#2F6BFF]'
                        }`}
                      >
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
            {/* Top Admin Banner & Direct Access Button */}
            {onOpenAdmin && (
              <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900/90 border border-purple-500/50 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-purple-300/30">
                    🛡️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-purple-100">
                        لوحة التحكم الإدارية
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                        أدمن موثَّق
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-300/80 mt-0.5">
                      إدارة الطلبات والمنتجات والمخزون والإعدادات
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:shadow-purple-500/30 transition-all cursor-pointer whitespace-nowrap border border-purple-400/40"
                >
                  <span>دخول اللوحة</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
            {!currentUser && (
              <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                    <User className="w-4 h-4 text-[#2F6BFF]" />
                    <span>{authMode === 'signin' ? 'تسجيل الدخول إلى حسابك' : 'إنشاء حساب عميل جديد'}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--color-surface-1)] p-1 rounded-xl text-[11px] border border-[var(--color-border-default)]">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setAuthError(null); setAuthSuccessMsg(null); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        authMode === 'signin'
                          ? 'bg-[#2F6BFF] text-white'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      دخول
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccessMsg(null); }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        authMode === 'signup'
                          ? 'bg-[#2F6BFF] text-white'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      حساب جديد
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{authSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCustomerAuth} className="space-y-2.5 text-xs">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">الاسم الكامل</label>
                      <input
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="علي أحمد"
                        className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="your@email.com"
                      dir="ltr"
                      className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">كلمة المرور</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-2.5 bg-[#2F6BFF] hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingAuth ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : authMode === 'signin' ? (
                      'تسجيل الدخول'
                    ) : (
                      'إنشاء الحساب'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-2 bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-3)] text-[var(--color-text-primary)] font-semibold rounded-xl text-xs border border-[var(--color-border-default)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>التسجيل بواسطة Google</span>
                  </button>
                </form>
              </div>
            )}
            {/* 1. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
                  <span>سجل طلباتي المسجلة تلقائياً</span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> مقتصر على حسابك
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="py-12 text-center text-xs text-[var(--color-text-muted)] space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2F6BFF]" />
                    <p>جاري تحميل طلباتك المسجلة...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="bg-[var(--color-surface-2)] p-6 rounded-2xl border border-[var(--color-border-default)] text-center space-y-2">
                    <PackageCheck className="w-10 h-10 text-[var(--color-text-muted)] mx-auto opacity-50" />
                    <h4 className="font-bold text-sm text-[var(--color-text-primary)]">لا توجد طلبات مسجلة بعد</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      عند إتمام أي طلب، سيظهر هنا تلقائياً مع خريطة وتتبع المندوب بدون الحاجة لنسخ الأكواد.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-2xl p-4 text-xs space-y-2.5 shadow-sm hover:border-[#2F6BFF]/40 transition-all"
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border-subtle)]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[#2F6BFF] text-sm dir-ltr">
                              {ord.orderNumber}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ord.orderNumber);
                                setCopiedOrderId(ord.id);
                                setTimeout(() => setCopiedOrderId(null), 1500);
                              }}
                              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                              title="نسخ رقم الطلب"
                            >
                              {copiedOrderId === ord.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">{ord.date}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-[var(--color-text-secondary)] block mb-0.5">
                              حالة الطلب:
                            </span>
                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-[11px]">
                              {ord.statusLabel}
                            </span>
                          </div>
                          <div className="text-left dir-ltr">
                            <span className="text-[11px] text-[var(--color-text-secondary)] block mb-0.5">
                              الإجمالي:
                            </span>
                            <span className="font-black text-sm text-[var(--color-text-primary)]">
                              {formatPrice(ord.totalPriceYER, currency)}
                            </span>
                          </div>
                        </div>

                        {/* Items thumbnail summary */}
                        <div className="bg-[var(--color-surface-1)] p-2.5 rounded-xl border border-[var(--color-border-subtle)] text-[11px] space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[var(--color-text-secondary)]">
                              <span className="truncate max-w-[200px] font-medium">• {it.productName}</span>
                              <span className="font-mono font-bold text-[var(--color-text-primary)]">
                                x{it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action row */}
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {ord.governorate} - {ord.address.slice(0, 20)}...
                          </span>

                          <button
                            onClick={() => {
                              onClose();
                              if (onOpenTrackerForOrder) {
                                onOpenTrackerForOrder(ord.orderNumber);
                              }
                            }}
                            className="py-1.5 px-3 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <span>عرض التفاصيل والتتبع المباشر</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-secondary)]">
                  <span>دفتر عناوين التوصيل المحفوظة</span>
                  <button
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                    className="py-1 px-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2458D8] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة عنوان جديد</span>
                  </button>
                </div>

                {/* New Address Form Modal inside tab */}
                <AnimatePresence>
                  {isAddingAddress && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreateAddress}
                      className="bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-2xl p-3.5 space-y-3 text-xs"
                    >
                      <h4 className="font-extrabold text-xs text-[var(--color-text-primary)]">
                        إضافة عنوان جديد للطلب السريع
                      </h4>

                      <div className="grid grid-cols-3 gap-1.5">
                        {(['منزل', 'عمل', 'آخر'] as const).map((lbl) => (
                          <button
                            type="button"
                            key={lbl}
                            onClick={() => setNewAddrLabel(lbl)}
                            className={`py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                              newAddrLabel === lbl
                                ? 'bg-[#2F6BFF] text-white border-[#2F6BFF]'
                                : 'bg-[var(--color-surface-1)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            المحافظة
                          </label>
                          <select
                            value={newAddrGov}
                            onChange={(e) => setNewAddrGov(e.target.value)}
                            className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-2 text-xs font-medium cursor-pointer"
                          >
                            {STORE_INFO.governorates.map((gov) => (
                              <option key={gov} value={gov}>
                                {gov}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            اسم المستلم
                          </label>
                          <input
                            type="text"
                            required
                            value={newAddrRecipient}
                            onChange={(e) => setNewAddrRecipient(e.target.value)}
                            placeholder="مثال: علي محمد"
                            className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-2.5 text-xs text-[var(--color-text-primary)] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                          العنوان التفصيلي (الشارع والحي)
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddrText}
                          onChange={(e) => setNewAddrText(e.target.value)}
                          placeholder="مثال: شارع حدة - حارة الكبسي"
                          className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-2.5 text-xs text-[var(--color-text-primary)] outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            أقرب معلم (اختياري)
                          </label>
                          <input
                            type="text"
                            value={newAddrLandmark}
                            onChange={(e) => setNewAddrLandmark(e.target.value)}
                            placeholder="مثال: بجانب مركز صخر"
                            className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-2.5 text-xs text-[var(--color-text-primary)] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                            رقم هاتف المستلم
                          </label>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={newAddrPhone}
                            onChange={(e) => setNewAddrPhone(e.target.value)}
                            placeholder={phone || '771234567'}
                            className="w-full h-9 bg-[var(--color-surface-1)] border border-[var(--color-border-default)] rounded-xl px-2.5 text-xs text-[var(--color-text-primary)] outline-none dir-ltr text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[var(--color-text-secondary)]">
                          <input
                            type="checkbox"
                            checked={newAddrIsDefault}
                            onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                            className="rounded border-[var(--color-border-default)] text-[#2F6BFF]"
                          />
                          <span>تعيين كعنوان افتراضي للشحن</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                        >
                          حفظ العنوان
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAddress(false)}
                          className="py-2 px-3 bg-[var(--color-surface-1)] text-[var(--color-text-secondary)] rounded-xl text-xs cursor-pointer border border-[var(--color-border-default)]"
                        >
                          إلغاء
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Addresses List */}
                {!profile?.addresses || profile.addresses.length === 0 ? (
                  <div className="bg-[var(--color-surface-2)] p-6 rounded-2xl border border-[var(--color-border-default)] text-center space-y-2 text-xs">
                    <MapPin className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
                    <p className="font-bold text-[var(--color-text-primary)]">لا يوجد عناوين محفوظة حتى الآن</p>
                    <p className="text-[var(--color-text-secondary)]">
                      احفظ عنوان بيتك أو عملك لتتمكن من الطلب بنقرة واحدة مستقبلاً.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {profile.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-[var(--color-surface-2)] border p-3.5 rounded-2xl text-xs space-y-2 relative transition-all ${
                          addr.isDefault
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-[var(--color-border-default)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-[var(--color-text-primary)]">
                              {addr.label === 'منزل' ? '🏠' : addr.label === 'عمل' ? '💼' : '📍'} {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                                العنوان الافتراضي
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {!addr.isDefault && (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-[10px] text-[#2F6BFF] hover:underline font-bold px-2 py-1 cursor-pointer"
                              >
                                تعيين كافتراضي
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="حذف العنوان"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-[var(--color-text-primary)] font-medium">
                          {addr.governorate} - {addr.address}{' '}
                          {addr.nearestLandmark && (
                            <span className="text-[var(--color-text-secondary)] font-normal">
                              ({addr.nearestLandmark})
                            </span>
                          )}
                        </p>

                        <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center justify-between pt-1 border-t border-[var(--color-border-subtle)]">
                          <span>المستلم: {addr.recipientName}</span>
                          <span className="font-mono dir-ltr">{maskPhoneNumber(addr.recipientPhone)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. PROFILE TAB */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-[var(--color-text-secondary)]">
                  <span>بيانات الحساب الشخصية والتعبئة</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> مشفرة وآمنة
                  </span>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسمك الثلاثي المعتمَد"
                    className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                      رقم الهاتف الرئيسي *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="771234567"
                      className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF] dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                      رقم هاتف إضافي (اختياري)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={altPhone}
                      onChange={(e) => setAltPhone(e.target.value)}
                      placeholder="731234567"
                      className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF] dir-ltr text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                    المحافظة المفضلّة
                  </label>
                  <select
                    value={preferredGov}
                    onChange={(e) => setPreferredGov(e.target.value)}
                    className="w-full h-10 bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl px-3 text-xs font-medium cursor-pointer"
                  >
                    {STORE_INFO.governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] mb-1">
                    تعليمات التوصيل المفضلة
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="مثال: اتصل قبل الوصول بـ 10 دقائق"
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-default)] rounded-xl p-2.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[#2F6BFF] resize-none"
                  />
                </div>

                <div className="bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border-default)] space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-[11px] text-[var(--color-text-primary)]">
                      تفعيل التعبئة التلقائية للطلبات
                    </span>
                    <input
                      type="checkbox"
                      checked={autofillEnabled}
                      onChange={(e) => setAutofillEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2F6BFF]"
                    />
                  </label>
                  <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                    عند التفعيل، سيقوم المتجر بتعبئة اسمك وهاتفك وعنوانك المفضل تلقائياً في الشاشة الأولى من التوصيل.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full py-3 bg-[#2F6BFF] hover:bg-[#2458D8] text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>حفظ بيانات الحساب وتحديث التعبئة</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 4. WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-[var(--color-text-secondary)]">
                  <span>منتجاتك المفضلة المحفوظة</span>
                  <span className="text-rose-400 font-extrabold">{favoritesCount} منتج</span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenWishlist();
                  }}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>فتح درج قائمة المفضلة الكاملة</span>
                </button>
              </div>
            )}

            {/* 5. CURRENCY TAB */}
            {activeTab === 'currency' && (
              <div className="space-y-3 text-xs">
                <span className="text-xs font-bold text-[var(--color-text-secondary)] block">
                  اختر عملة عرض واستعراض الأسعار:
                </span>
                <div className="space-y-2">
                  <button
                    onClick={() => onSelectCurrency('YER')}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex justify-between items-center ${
                      currency === 'YER'
                        ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white font-bold shadow-md'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold block">ريال يمني (YER)</span>
                      <span className="text-[10px] opacity-80">العملة الرسمية المحلية بالريال اليمن</span>
                    </div>
                    {currency === 'YER' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </button>

                  <button
                    onClick={() => onSelectCurrency('SAR')}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex justify-between items-center ${
                      currency === 'SAR'
                        ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white font-bold shadow-md'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold block">ريال سعودي (SAR)</span>
                      <span className="text-[10px] opacity-80">تحويل مباشر بسعر صرف السوق اليومي</span>
                    </div>
                    {currency === 'SAR' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </button>

                  <button
                    onClick={() => onSelectCurrency('USD')}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex justify-between items-center ${
                      currency === 'USD'
                        ? 'bg-[#2F6BFF] border-[#2F6BFF] text-white font-bold shadow-md'
                        : 'bg-[var(--color-surface-2)] border-[var(--color-border-default)] text-[var(--color-text-primary)]'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold block">دولار أمريكي (USD $)</span>
                      <span className="text-[10px] opacity-80">عرض القيم بالدولار الدولي</span>
                    </div>
                    {currency === 'USD' && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </button>
                </div>
              </div>
            )}

            {/* 6. SUPPORT TAB */}
            {activeTab === 'support' && (
              <div className="space-y-3 text-xs">
                <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] space-y-2">
                  <h4 className="font-extrabold text-sm text-[var(--color-text-primary)]">
                    خدمة العملاء والضمان الذهبي
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    فريق دعم إندكس متواجد على مدار الساعة لمساعدتك في استبدال المنتجات، الاستفسار عن الضمان، أو توجيه السائقين.
                  </p>
                  <a
                    href={`https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(
                      'مرحباً إندكس، أود الاستفسار عن المساعدة والدعم'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>تواصل مريح عبر الواتساب المباشر</span>
                  </a>
                </div>

                {/* Admin & Evolution studio links */}
                {onOpenAdmin && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="w-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-default)] p-3.5 rounded-2xl flex items-center justify-between text-[var(--color-text-primary)] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🛡️</span>
                      <span className="font-bold">لوحة تحكم الأدمن والمنتجات</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </button>
                )}
              </div>
            )}

            {/* 7. PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-3 text-xs">
                <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold">
                    <ShieldCheck className="w-5 h-5" />
                    <span>الخصوصية والأمان التام</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                    نحن لا نبيع أو نشارك بياناتك أو أرقام هاتف مع أي جهة خارجية. يتم ربط سجل طلبياتك بأمان تام مع رقم حسابك المشفر في قواعد بيانات Firebase.
                  </p>
                </div>

                <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-border-default)] space-y-3">
                  <h4 className="font-bold text-xs text-[var(--color-text-primary)]">إدارة البيانات على هذا الجهاز</h4>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    يمكنك مسح المسودة المحلية المحفوظة مؤقتاً على هذا المتصفح في أي وقت.
                  </p>
                  <button
                    onClick={() => {
                      clearGuestDeviceProfile();
                      alert('تم مسح المسودة المحلية من هذا الجهاز بنجاح.');
                    }}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs cursor-pointer transition-all"
                  >
                    مسح البيانات والمسودة المحفوظة على الجهاز
                  </button>
                </div>

                {currentUser && (
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج ومسح الجلسة</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Store Location Footer */}
          <div className="pt-3 border-t border-[var(--color-border-default)] text-[11px] text-[var(--color-text-secondary)] space-y-0.5 text-center">
            <p className="font-extrabold text-[var(--color-text-primary)]">{STORE_INFO.name}</p>
            <p>{STORE_INFO.address}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
