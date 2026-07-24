import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — Indexes Store" },
      { name: "description", content: "سياسة الخصوصية وحماية بيانات المستخدمين في متجر اندكس للتجارة الإلكترونية." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8" dir="rtl">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
          سياسة الخصوصية وحماية البيانات (Privacy Policy)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          آخر تحديث: 24 يوليو 2026 — تطبيق Indexes Store (Meta App ID: 1403080371744739)
        </p>
      </div>

      <div className="space-y-6 text-sm text-foreground leading-relaxed">
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-500">
            <Lock className="h-5 w-5" /> 1. الجمع والاستخدام
          </h2>
          <p>
            يقوم تطبيق ومتجر Indexes Store برعاية خصوصيتك تماماً. نجمع البيانات الضرورية فقط لتقديم خدمات الشراء والمزامنة مع Meta WhatsApp API، والتي تشمل:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>رقم الهاتف والبريد الإلكتروني للاتصال بالعملاء وتسهيل الطلبات (smartaccuont@gmail.com).</li>
            <li>بيانات الطلب والوسائط الواردة عبر الواتساب لمعالجة المنتجات فقط.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-500">
            <CheckCircle className="h-5 w-5" /> 2. الأمان وحفظ البيانات
          </h2>
          <p>
            تتم معالجة وحفظ كافة البيانات في خوادم مشفرة وتتبع أحدث معايير الأمان الحساسة. لا نبيع ولا نشارك أي من بيانات المستخدمين مع أي طرف ثالث لأغراض إعلانية غير مصرح بها.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-500">
            <ShieldCheck className="h-5 w-5" /> 3. حقوق المستخدم وحذف البيانات
          </h2>
          <p>
            يحق لكل مستخدم طلب تقديم حذف كامل لبياناته المسجلة في منصتنا في أي وقت عبر زيارة صفحة {" "}
            <a href="/data-deletion" className="text-primary underline font-bold">تعليمات حذف البيانات</a> أو التواصل مباشرة مع مسئول الحماية على البريد الإلكتروني: <code className="font-mono text-emerald-500">smartaccuont@gmail.com</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
