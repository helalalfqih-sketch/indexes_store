import { createFileRoute } from "@tanstack/react-router";
import { Upload, Cpu, Eye, ShieldCheck, Rocket } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAdmin, type SessionStep } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/sessions")({
  component: SessionsPage,
});

const steps: SessionStep[] = ["upload", "processing", "review", "approved", "published"];

function SessionsPage() {
  const { t, lang } = useI18n();
  const sessions = useAdmin((s) => s.sessions);
  const update = useAdmin((s) => s.updateSession);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black lg:text-4xl text-foreground">{t("sessions.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "ar"
            ? "تتبع خط إنتاج الذكاء الاصطناعي للمنتجات."
            : "AI product pipeline tracking."}
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl glass p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {lang === "ar" ? "لا توجد جلسات بعد" : "No sessions yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const idx = steps.indexOf(s.step);
            return (
              <div key={s.id} className="rounded-2xl glass p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black">{s.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {t(`sessions.step.${s.step}`)}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-5 gap-2">
                  {steps.map((step, i) => {
                    const Icon = [Upload, Cpu, Eye, ShieldCheck, Rocket][i];
                    const done = i <= idx;
                    const current = i === idx;
                    return (
                      <button
                        key={step}
                        onClick={() => update(s.id, { step })}
                        className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[10px] font-bold transition ${
                          done
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:bg-accent"
                        } ${current ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-surface" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{t(`sessions.step.${step}`)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
