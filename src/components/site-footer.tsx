import { Link } from "@tanstack/react-router";
import { MapPin, MessageCircle, PackageSearch, Truck } from "lucide-react";
import { useAppearance } from "@/components/appearance-provider";
import { StoreBrand } from "@/components/brand/store-brand";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteFooter({ isHome }: { isHome?: boolean }) {
  const { settings } = useAppearance();

  const storeName = settings.navigation.storeName || "اندكس ستور";
  const tagline = settings.navigation.tagline || "اختيارك الأفضل";
  const phone = settings.navigation.whatsappPhone || "967771370740";
  const address = settings.navigation.addressText || "صنعاء - شارع بينون - مقابل صيدلية الرعاية الصحية";
  const deliveryInfo = settings.navigation.deliveryInfoText || "متوفر لدينا خدمة التوصيل لجميع المحافظات 🇾🇪";
  const copyright = settings.navigation.copyrightText || "جميع الحقوق محفوظة";

  const waHref = whatsappLink("مرحباً، لدي استفسار عن " + storeName, phone);

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
        <StoreBrand
          size="md"
          nameClassName={isHome ? "text-showcase-foreground" : "text-primary"}
          taglineClassName={isHome ? "text-showcase-muted" : "text-muted-foreground"}
        />

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
                {phone}
              </a>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>العنوان: {address}</span>
          </li>
          {deliveryInfo && (
            <li className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>{deliveryInfo}</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <PackageSearch className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              <Link
                to="/track"
                className="font-bold text-primary underline-offset-2 hover:underline"
              >
                تتبع طلبك
              </Link>{" "}
              — برقم الطلب وآخر 4 أرقام من هاتفك
            </span>
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
          © {storeName} {new Date().getFullYear()} — {copyright}
        </p>
      </div>
    </footer>
  );
}
