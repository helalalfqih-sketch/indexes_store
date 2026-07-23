import { createFileRoute } from "@tanstack/react-router";
import {
  CreditCard,
  Save,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Banknote,
  Wallet,
  Info,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
});

type PaymentMethod = {
  id: string;
  name: string;
  name_en: string;
  description: string;
  icon: string;
  is_active: boolean;
  instructions: string;
  details: string;
};

const DEFAULT_METHODS: PaymentMethod[] = [
  {
    id: "cod",
    name: "الدفع عند الاستلام",
    name_en: "Cash on Delivery",
    description: "الدفع نقداً عند استلام الطلب",
    icon: "💵",
    is_active: true,
    instructions: "سيتم الدفع نقداً لمندوب التوصيل عند استلام طلبك.",
    details: "",
  },
  {
    id: "bank_transfer",
    name: "التحويل البنكي",
    name_en: "Bank Transfer",
    description: "تحويل إلى حساب المتجر مباشرة",
    icon: "🏦",
    is_active: true,
    instructions: "قم بتحويل المبلغ إلى الحساب التالي وأرسل صورة التحويل.",
    details: "البنك اليمني للتجارة والاستثمار\nاسم الحساب: اندكس ستور\nرقم الحساب: 12345678",
  },
  {
    id: "sabafon",
    name: "محفظة سبأفون",
    name_en: "SabaFon Wallet",
    description: "الدفع عبر محفظة سبأفون",
    icon: "📱",
    is_active: true,
    instructions: "حوّل المبلغ إلى رقم المحفظة وأرسل الرقم المرجعي.",
    details: "رقم المحفظة: 967771370740\nاسم الحساب: اندكس ستور",
  },
  {
    id: "mtn",
    name: "MTN موبايل موني",
    name_en: "MTN Mobile Money",
    description: "الدفع عبر MTN موبايل موني",
    icon: "📲",
    is_active: false,
    instructions: "حوّل المبلغ إلى رقم MTN موني وأرسل التأكيد.",
    details: "رقم MTN: 967770000000",
  },
  {
    id: "kuraimi",
    name: "بنك الكريمي",
    name_en: "Kuraimi Bank",
    description: "التحويل عبر بنك الكريمي",
    icon: "🏛️",
    is_active: false,
    instructions: "حوّل المبلغ عبر تطبيق الكريمي وأرسل الإيصال.",
    details: "رقم الحساب الكريمي: 99887766",
  },
];

function PaymentsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>(DEFAULT_METHODS);
  const [editing, setEditing] = useState<string | null>(null);

  const toggle = (id: string) =>
    setMethods((ms) =>
      ms.map((m) => (m.id === id ? { ...m, is_active: !m.is_active } : m)),
    );

  const update = (id: string, field: keyof PaymentMethod, value: string | boolean) =>
    setMethods((ms) => ms.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const saveAll = () => toast.success("تم حفظ إعدادات الدفع");

  const activeCount = methods.filter((m) => m.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            طرق الدفع
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} طريقة دفع نشطة
          </p>
        </div>
        <button
          onClick={saveAll}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
        >
          <Save className="h-4 w-4" />
          حفظ الإعدادات
        </button>
      </div>

      <div className="space-y-4">
        {methods.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border bg-surface transition ${
              m.is_active ? "border-primary/20" : "border-border opacity-70"
            }`}
          >
            {/* Method header */}
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <div className="font-bold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(editing === m.id ? null : m.id)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-border hover:bg-accent transition"
                >
                  {editing === m.id ? "إغلاق" : "تعديل"}
                </button>
                <button onClick={() => toggle(m.id)}>
                  {m.is_active ? (
                    <ToggleRight className="h-7 w-7 text-primary" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Expandable edit area */}
            {editing === m.id && (
              <div className="border-t border-border/50 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    <Info className="inline h-3 w-3" /> تعليمات الدفع (ستظهر للعميل)
                  </label>
                  <textarea
                    value={m.instructions}
                    onChange={(e) => update(m.id, "instructions", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                    تفاصيل الحساب (أرقام حسابات، أسماء)
                  </label>
                  <textarea
                    value={m.details}
                    onChange={(e) => update(m.id, "details", e.target.value)}
                    rows={3}
                    placeholder="مثال: رقم الحساب، اسم البنك..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview note */}
      <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <span>
          التعليمات والتفاصيل المُدخلة ستظهر للعملاء في صفحة السلة عند اختيار طريقة الدفع.
          تأكد من دقة بيانات الحسابات قبل الحفظ.
        </span>
      </div>
    </div>
  );
}
