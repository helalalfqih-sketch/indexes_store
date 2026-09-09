import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

interface TrustPageProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function TrustPage({ title, description, children }: TrustPageProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10" dir="rtl">
      <nav
        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"
        aria-label="مسار الصفحة"
      >
        <Link to="/" className="transition hover:text-primary">
          الرئيسية
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-bold text-foreground">{title}</span>
      </nav>
      <article className="space-y-6 rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-10">
        <header className="border-b border-border/80 pb-6">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
            صفحة معلومات رسمية في اندكس ستور
          </p>
        </header>
        <div className="prose prose-sm max-w-none space-y-5 leading-relaxed text-foreground dark:prose-invert">
          {children}
        </div>
      </article>
    </main>
  );
}
