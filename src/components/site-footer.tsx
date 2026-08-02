import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MapPin, MessageCircle, Music2, PackageSearch, Truck, Twitter } from "lucide-react";
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

        {/* Accessible, icon-first social links — no fixed platform labels in the layout. */}
        <div className="flex items-center justify-center gap-2 border-t border-border/20 pt-3">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="واتساب"
            title="واتساب"
            className="grid h-11 w-11 place-items-center rounded-full border border-success/30 bg-success/10 text-success transition hover:bg-success hover:text-success-foreground"
          >
            <MessageCircle className="h-5 w-5" />
          </a>
          {settings.navigation.socialLinks?.facebook && (
            <a
              href={settings.navigation.socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="فيسبوك"
              title="فيسبوك"
              className="grid h-11 w-11 place-items-center rounded-full border border-border/40 text-showcase-muted transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              <Facebook className="h-5 w-5" />
            </a>
          )}
          {settings.navigation.socialLinks?.instagram && (
            <a
              href={settings.navigation.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="إنستغرام"
              title="إنستغرام"
              className="grid h-11 w-11 place-items-center rounded-full border border-border/40 text-showcase-muted transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {settings.navigation.socialLinks?.tiktok && (
            <a
              href={settings.navigation.socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="تيك توك"
              title="تيك توك"
              className="grid h-11 w-11 place-items-center rounded-full border border-border/40 text-showcase-muted transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              <Music2 className="h-5 w-5" />
            </a>
          )}
          {settings.navigation.socialLinks?.twitter && (
            <a
              href={settings.navigation.socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="إكس"
              title="إكس"
              className="grid h-11 w-11 place-items-center rounded-full border border-border/40 text-showcase-muted transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              <Twitter className="h-5 w-5" />
            </a>
          )}
        </div>

        {/* CMS Pages Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border/20 pt-3 text-[11px] font-semibold text-muted-foreground">
          <Link to="/pages/$slug" params={{ slug: "about-us" }} className="hover:text-primary transition">
            من نحن
          </Link>
          <span>•</span>
          <Link to="/pages/$slug" params={{ slug: "privacy-policy" }} className="hover:text-primary transition">
            سياسة الخصوصية
          </Link>
          <span>•</span>
          <Link to="/pages/$slug" params={{ slug: "terms" }} className="hover:text-primary transition">
            الشروط والأحكام
          </Link>
          <span>•</span>
          <Link to="/pages/$slug" params={{ slug: "return-policy" }} className="hover:text-primary transition">
            سياسة الإرجاع
          </Link>
          <span>•</span>
          <Link to="/pages/$slug" params={{ slug: "shipping-policy" }} className="hover:text-primary transition">
            سياسة الشحن
          </Link>
          <span>•</span>
          <Link to="/pages/$slug" params={{ slug: "faq" }} className="hover:text-primary transition">
            الأسئلة الشائعة
          </Link>
        </div>

        <p
          className={`pt-2 text-center text-[10px] ${isHome ? "text-showcase-muted" : "text-muted-foreground"}`}
        >
          © {storeName} {new Date().getFullYear()} — {copyright}
        </p>
      </div>
    </footer>
  );
}
