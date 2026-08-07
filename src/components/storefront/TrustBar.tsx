import React from "react";
import { motion } from "framer-motion";
import { Headphones, RotateCcw, Truck, ShieldCheck } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Truck, title: "توصيل سريع", desc: "خلال 24 - 48 ساعة" },
  { icon: ShieldCheck, title: "ضمان أصلي", desc: "جودة عالية %100" },
  { icon: Headphones, title: "دعم 24/7", desc: "خدمة عملاء مميزة" },
  { icon: RotateCcw, title: "استبدال وإرجاع", desc: "ضمان رضا العملاء" },
];

export const TrustBar: React.FC = () => {
  return (
    <section className="px-3 sm:px-6 my-5">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-[#100B1A]/90 backdrop-blur-md rounded-2xl py-3.5 px-2 border border-gray-800 grid grid-cols-4 gap-1 text-center shadow-sm divide-x divide-x-reverse divide-gray-800/60 dir-rtl"
      >
        {TRUST_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="flex flex-col items-center justify-center p-1 text-center group cursor-default"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#7B3FFF]/10 border border-[#7B3FFF]/20 flex items-center justify-center text-[#7B3FFF] mb-1.5 shrink-0 transition-all">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7B3FFF] group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white leading-tight transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{item.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
