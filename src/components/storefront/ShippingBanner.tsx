import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Zap, Truck } from 'lucide-react';

export interface ShippingBannerProps {
  onOpenShippingInfo?: () => void;
  shippingConfig?: {
    deliveryText?: string;
    freeText?: string;
    threshold?: number;
  };
}

export const ShippingBanner: React.FC<ShippingBannerProps> = ({ onOpenShippingInfo, shippingConfig }) => {
  const deliveryText = shippingConfig?.deliveryText || 'توصيل سريع خلال 24-48 ساعة للمحافظات';
  const freeThreshold = Number(shippingConfig?.threshold) || 30000;
  const freeText = shippingConfig?.freeText || 'شحن مجاني فوق';

  return (
    <div className="px-3 sm:px-6 py-1.5">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        onClick={onOpenShippingInfo}
        className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3 border border-[var(--color-border-default)] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 bg-[var(--color-surface-1)] backdrop-blur-md hover:border-[var(--color-border-strong)] transition-all cursor-pointer group shadow-sm text-xs"
      >
        {/* Line 1 / Primary info */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-[11px] sm:text-xs text-[var(--color-text-secondary)] relative z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#2F6BFF]/10 border border-[#2F6BFF]/30 flex items-center justify-center text-[#2F6BFF] shrink-0 group-hover:scale-110 transition-transform">
              <Truck className="w-3 h-3 text-[#2F6BFF]" />
            </div>
            <span>{deliveryText}</span>
          </div>

          <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex sm:hidden items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
          </div>
        </div>

        {/* Line 2 / Free shipping threshold */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 text-[11px] sm:text-xs text-[var(--color-text-secondary)] border-t sm:border-t-0 border-[var(--color-border-subtle)] pt-1 sm:pt-0 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline">•</span>
            <span>{freeText} <strong className="text-[var(--color-text-primary)] font-black text-xs">{(Number(freeThreshold) || 30000).toLocaleString('ar-YE')} ريال</strong></span>
          </div>

          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:rotate-12 transition-transform">
            <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

