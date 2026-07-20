import { MapPin, MessageCircle, ShoppingBag, Truck } from "lucide-react";
import { STORE_CONTACT } from "@/lib/store-data";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteFooter({ isHome }: { isHome?: boolean }) {
  const waHref = whatsappLink("مرحباً، لدي استفسار عن اندكس ستور");
  return (
    <footer
      dir="rtl"
      className={`mt-8 border-t px-5 pb-6 pt-6 transition-colors duration-300 ${
        isHome
          ? "border-showcase-border bg-showcase text-showcase-foreground"
          : "border-border/60 bg-surface text-foreground"
      }`}
      style={{ fontFamily: "Tajawal, system-ui, sans-serif" }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
            <ShoppingBag className="h-4.5 w-4.5" />
          </div>
          <div className="leading-tight">
            <div
              className={`text-sm font-black ${isHome ? "text-showcase-foreground" : "text-primary"}`}
            >
              اندكس ستور
            </div>
            <div
              className={`text-[11px] ${isHome ? "text-showcase-muted" : "text-muted-foreground"}`}
            >
              اختيارك الأفضل
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5 text-[12px] leading-relaxed">
          <li className="flex items-start gap-2">
            <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
            <span>
              للطلب والاستفسار (واتساب):{" "}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-primary underline-offset-2 hover:underline"
              >
                {STORE_CONTACT}
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>العنوان: صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية</span>
          </li>
          <li className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>متوفر لدينا خدمة التوصيل لجميع المحافظات 🇾🇪</span>
          </li>
        </ul>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-xs font-bold text-success-foreground shadow-brand"
        >
          <MessageCircle className="h-4 w-4" />
          تواصل معنا الآن
        </a>

        <p
          className={`pt-2 text-center text-[10px] ${isHome ? "text-showcase-muted" : "text-muted-foreground"}`}
        >
          © اندكس ستور {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
