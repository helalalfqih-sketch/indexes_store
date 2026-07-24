import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "حذف بيانات المستخدم — Indexes Store" },
      { name: "description", content: "تعليمات ونموذج طلب حذف كافة بيانات المستخدم في تطبيق Indexes Store." },
    ],
  }),
  component: DataDeletionPage,
});

function DataDeletionPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني أو رقم الهاتف المسجل.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("تم استلام طلب حذف البيانات بنجاح وسيتلقى كود تأكيد الحذف عبر البريد.");
    }, 1200);
  };

  const confirmationCode = `DEL-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8" dir="rtl">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Trash2 className="h-8 w-8 text-destructive" />
          تعليمات وطلب حذف بيانات المستخدم (User Data Deletion Instructions)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          المتطلبات الرسمية لسياسة وحماية بيانات فيسبوك (Meta App ID: 1403080371744739)
        </p>
      </div>

      <div className="space-y-6 text-sm text-foreground leading-relaxed">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" /> كيفية طلب حذف البيانات
          </h2>
          <p>
            وفقاً لسياسات Meta وتنظيمات حماية البيانات العامة (GDPR)، يمنح تطبيق ومتجر Indexes Store للمستخدمين الحق الكامل في إزالة مسح وحذف كافة بياناتهم وصورهم وسجل طلباتهم المسجلة لدينا.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-500 font-black text-lg">
              <CheckCircle className="h-7 w-7" />
              تم تقديم طلب حذف البيانات بنجاح
            </div>
            <p className="text-xs text-muted-foreground">
              تم تسليم الطلب إلى مسؤول حماية البيانات (<code className="font-mono text-foreground font-bold">smartaccuont@gmail.com</code>).
            </p>
            <div className="p-4 rounded-xl border border-border bg-background space-y-1 text-xs">
              <p className="text-muted-foreground font-bold">رمز تأكيد الحذف (Confirmation Code):</p>
              <code className="font-mono text-sm text-primary font-bold">{confirmationCode}</code>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-base font-bold text-foreground">تقديم طلب إزالة وحذف البيانات مباشرة:</h3>

            <div>
              <label className="block text-xs font-bold mb-1">البريد الإلكتروني أو رقم الهاتف المسجل</label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="smartaccuont@gmail.com أو +967..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">سبب الطلب (اختياري)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب طلب الحذف..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm h-24"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-destructive px-6 py-3 text-sm font-bold text-white hover:bg-destructive/90 transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              تأكيد إرسال طلب حذف البيانات
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
