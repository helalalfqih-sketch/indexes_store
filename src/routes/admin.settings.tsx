import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Zap, Check } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Theme = "light" | "dark" | "neon";

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const [theme, setTheme] = useState<Theme>("light");
  const [api, setApi] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const th = (localStorage.getItem("noqta:theme") as Theme | null) ?? "light";
    setTheme(th);
    setApi(localStorage.getItem("noqta:api") ?? "");
    applyTheme(th);
  }, []);

  const applyTheme = (th: Theme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "neon");
    if (th === "dark") root.classList.add("dark");
    if (th === "neon") root.classList.add("dark", "neon");
  };

  const save = () => {
    localStorage.setItem("noqta:theme", theme);
    localStorage.setItem("noqta:api", api);
    applyTheme(theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("settings.theme.light"), icon: Sun },
    { id: "dark", label: t("settings.theme.dark"), icon: Moon },
    { id: "neon", label: t("settings.theme.neon"), icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black lg:text-4xl text-foreground">{t("settings.title")}</h1>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black">{t("settings.theme")}</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {themes.map((th) => {
            const Icon = th.icon;
            const active = theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-bold transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-surface"
                    : "border-border hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                {th.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black">{t("settings.lang")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["ar", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-xl border p-4 text-sm font-bold transition ${
                lang === l
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-accent"
              }`}
            >
              {l === "ar" ? "العربية" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-black">{t("settings.api")}</h2>
        <input
          value={api}
          onChange={(e) => setApi(e.target.value)}
          placeholder="https://api.example.com"
          className="mt-3 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90 transition"
        >
          {t("settings.save")}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
            <Check className="h-4 w-4" /> {t("settings.saved")}
          </span>
        )}
      </div>
    </div>
  );
}
