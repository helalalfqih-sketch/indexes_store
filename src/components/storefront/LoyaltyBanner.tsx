import React from "react";
import { motion } from "framer-motion";
import { Gem, Crown, ChevronLeft, Star } from "lucide-react";

interface LoyaltyBannerProps {
  onOpenLoyaltyModal: () => void;
}

export const LoyaltyBanner: React.FC<LoyaltyBannerProps> = ({ onOpenLoyaltyModal }) => {
  return (
    <div className="px-3 sm:px-6 my-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        onClick={onOpenLoyaltyModal}
        className="bg-[#100B1A]/90 backdrop-blur-md border border-gray-800 rounded-3xl p-4 sm:p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer hover:border-purple-500/40 hover:bg-[#161026] transition-all group shadow-sm"
      >
        {/* Subtle Ambient Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#7B3FFF]/08 rounded-full blur-2xl pointer-events-none" />

        {/* Diamond Graphic & Title */}
        <div className="relative z-10 flex items-center gap-4 text-right w-full md:w-auto">
          {/* Icon Box */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#7B3FFF]/10 border border-[#7B3FFF]/30 flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-transform">
            <Gem className="w-7 h-7 sm:w-8 sm:h-8 text-[#7B3FFF]" />
            <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black rounded-full p-1 shadow-md">
              <Crown className="w-3.5 h-3.5 text-black" />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-white mb-1 transition-colors">
              برنامج INDEXES المميز
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm mb-2 max-w-sm">
              اكتسب نقاط مع كل طلب واستبدلها بمكافآت حصرية
            </p>
            <button className="bg-[#18112B] border border-gray-800 group-hover:bg-[#7B3FFF] text-white font-bold px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1 transition-all">
              <span>اكتشف المزايا</span>
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* User Status / Current Points Card */}
        <div className="relative z-10 bg-[#18112B] border border-gray-800 rounded-2xl p-3.5 w-full md:w-56 shrink-0 flex flex-col gap-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
            <span>نقاطك الحالية</span>
            <span className="text-amber-400 flex items-center gap-1 font-black text-sm">
              <span>2,560</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-gray-400">المستوى</span>
            <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
              <span>ذهبي</span>
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </span>
          </div>

          {/* Level Progress Bar */}
          <div className="w-full bg-[#120D22] h-1.5 rounded-full overflow-hidden mt-1">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "75%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="bg-gradient-to-r from-[#7B3FFF] to-[#3B82F6] h-full rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
