import React from "react";
import { motion } from "framer-motion";
import { Rocket, Zap, Truck } from "lucide-react";

interface ShippingBannerProps {
  onOpenShippingInfo?: () => void;
}

export const ShippingBanner: React.FC<ShippingBannerProps> = ({ onOpenShippingInfo }) => {
  return (
    <div className="px-3 sm:px-6 py-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        onClick={onOpenShippingInfo}
        className="relative overflow-hidden flex flex-col gap-2.5 border border-gray-800 rounded-2xl px-4 py-3 bg-[#100B1A]/80 backdrop-blur-md hover:border-purple-500/40 transition-all cursor-pointer group shadow-sm"
      >
        {/* Line 1 */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#7B3FFF]/10 border border-[#7B3FFF]/30 flex items-center justify-center text-[#7B3FFF] shrink-0 group-hover:scale-110 transition-transform">
              <Truck className="w-3.5 h-3.5 text-[#7B3FFF]" />
            </div>
            <span>
              توصيل سريع خلال{" "}
              <strong className="text-white font-black mx-1 text-sm">24 - 48</strong> ساعة إلى كافة
              المحافظات اليمنية
            </span>
          </div>

          <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        {/* Line 2 */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-300 border-t border-gray-800/60 pt-2 relative z-10">
          <div className="flex items-center gap-2">
            <span>
              شحن مجاني للطلبات فوق{" "}
              <strong className="text-white font-black mx-1 text-sm">30,000</strong> ريال
            </span>
          </div>

          <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:rotate-12 transition-transform">
            <Rocket className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
