import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MessageCircle,
  Package,
  MapPin,
  Heart,
  HelpCircle,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import { STORE_CONTACT } from "@/lib/store-data";
import { whatsappLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "حسابي — اندكس ستور" }] }),
  component: AccountPage,
});

function AccountPage() {
  const menu = [
    { icon: Package, label: "طلباتي", href: "/cart" },
    { icon: Heart, label: "المفضلة", href: "/" },
    { icon: MapPin, label: "عناويني", href: "/" },
    { icon: ShieldCheck, label: "الخصوصية والأمان", href: "/" },
    { icon: HelpCircle, label: "المساعدة والدعم", href: "/" },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <section className="flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground shadow-brand">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-foreground/20 text-xl font-black">
          ز
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">مرحباً بك في اندكس ستور</p>
          <p className="text-xs text-primary-foreground/85">سجّل دخولك لمتابعة طلباتك</p>
        </div>
        <button className="flex items-center gap-1 rounded-xl bg-primary-foreground/20 px-3 py-1.5 text-xs font-bold transition hover:bg-primary-foreground/30">
          <LogIn className="h-3.5 w-3.5" />
          دخول
        </button>
      </section>

      <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
        {menu.map((m, i) => (
          <li key={m.label} className={i !== 0 ? "border-t border-border" : ""}>
            <Link to={m.href} className="flex items-center gap-3 p-3.5 text-sm font-semibold">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft/20 text-primary">
                <m.icon className="h-4.5 w-4.5" />
              </div>
              <span className="flex-1">{m.label}</span>
              <span className="text-muted-foreground">‹</span>
            </Link>
          </li>
        ))}
      </ul>

      <a
        href={whatsappLink("مرحباً، لدي استفسار عن اندكس ستور")}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl bg-success py-3 text-sm font-bold text-success-foreground shadow-brand"
      >
        <MessageCircle className="h-4 w-4" />
        تواصل مع الدعم — {STORE_CONTACT}
      </a>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        © اندكس ستور {new Date().getFullYear()} — جميع الحقوق محفوظة
      </p>
    </div>
  );
}
