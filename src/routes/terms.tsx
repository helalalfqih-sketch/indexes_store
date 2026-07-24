import { createFileRoute } from "@tanstack/react-router";
import { FileText, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "شروط الخدمة — Indexes Store" },
      { name: "description", content: "شروط وأحكام استخدام متجر اندكس للتجارة الإلكترونية." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8" dir="rtl">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          شروط وإرشادات الخدمة (Terms of Service)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          متجر وتطبيق Indexes Store — Meta App ID: 1403080371744739
        </p>
      </div>

      <div className="space-y-6 text-sm text-foreground leading-relaxed">
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" /> 1. القبول والترخيص
          </h2>
          <p>
            باستخدامك لمنصة ومتجر Indexes Store، فإنك توافق على الالتزام بكافة الشروط والأحكام الواردة هنا، والامتثال لسياسات التجارة الإلكترونية المعمول بها.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
            <CheckCircle className="h-5 w-5" /> 2. طلبات الشراء والتوصيل
          </h2>
          <p>
            يتم تجهيز كافة الطلبات وتوصيلها وفقاً لبيانات العنوان المرفقة من قبل العميل، وتتم عمليات الدفع والتسليم وفق الشفافية التامة المعتمدة في متجرنا.
          </p>
        </div>
      </div>
    </div>
  );
}
