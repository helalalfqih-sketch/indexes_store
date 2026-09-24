import { Link } from "@tanstack/react-router";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { MapPin, MessageCircle, PackageSearch, HelpCircle, ShoppingCart } from "lucide-react";
import { useAppearance } from "@/components/appearance-provider";
import { mapPublishedStorefrontSettings } from "@/lib/adapters/storefront-settings.adapter";

export function SiteFooter(_props: { isHome?: boolean }) {
  const { settings } = useAppearance();
  const { contact } = mapPublishedStorefrontSettings(settings);
  const phone = contact.whatsappPhone.replace(/\D/g, "");
  return (
    <footer className="sf-footer">
      <HStack className="sf-service-links" gap={4} wrap="wrap">
        <Link to="/track">
          <PackageSearch aria-hidden="true" /> تتبع طلبك
        </Link>
        <Link to="/pages/faq">
          <HelpCircle aria-hidden="true" /> مركز المساعدة
        </Link>
        <Link to="/pages/$slug" params={{ slug: "about-us" }}>
          تعرف على المتجر
        </Link>
      </HStack>
      <HStack className="sf-footer-inner" gap={8} wrap="wrap" align="start">
        <VStack gap={2} className="sf-footer-brand">
          <ShoppingCart aria-hidden="true" />
          <strong>{contact.storeName}</strong>
          <small lang="en">INDEXES STORE</small>
          <p>{contact.copyrightText}</p>
        </VStack>
        <VStack gap={3} className="sf-footer-contact">
          <strong>نحن بالقرب منك</strong>
          {contact.address && (
            <p>
              <MapPin aria-hidden="true" />
              {contact.address}
            </p>
          )}
          {contact.deliveryInfoText && <p>{contact.deliveryInfoText}</p>}
        </VStack>
        <VStack gap={3}>
          <strong>للطلب والاستفسار</strong>
          {phone && (
            <a
              className="sf-whatsapp"
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle aria-hidden="true" /> تواصل عبر واتساب
            </a>
          )}
          <Link to="/pages/$slug" params={{ slug: "privacy" }}>
            سياسة الخصوصية
          </Link>
        </VStack>
      </HStack>
    </footer>
  );
}
