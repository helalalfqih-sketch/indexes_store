import type React from "react";
import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";

export interface TrustBarProps {
  trustBadges?: {
    badge1?: string;
    badge2?: string;
    badge3?: string;
    badge4?: string;
  };
}

export const TrustBar: React.FC<TrustBarProps> = ({ trustBadges }) => {
  const badgeList = [
    { icon: Truck, title: trustBadges?.badge1 },
    { icon: ShieldCheck, title: trustBadges?.badge2 },
    { icon: Headphones, title: trustBadges?.badge3 },
    { icon: RotateCcw, title: trustBadges?.badge4 },
  ].filter((item): item is { icon: typeof Truck; title: string } => Boolean(item.title?.trim()));

  if (badgeList.length === 0) return null;

  const gridColsClass =
    badgeList.length === 1
      ? "grid-cols-1"
      : badgeList.length === 2
        ? "grid-cols-2"
        : badgeList.length === 3
          ? "grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4";

  return (
    <section className="px-3 sm:px-6 my-5">
      <div
        className={`bg-[var(--color-surface-1)] backdrop-blur-md rounded-2xl py-3.5 px-2 border border-[var(--color-border-default)] grid ${gridColsClass} gap-1 text-center shadow-sm divide-x divide-x-reverse divide-[var(--color-border-subtle)] dir-rtl`}
      >
        {badgeList.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.title}-${idx}`}
              className="flex flex-col items-center justify-center p-1 text-center group cursor-default"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2F6BFF]/10 border border-[#2F6BFF]/20 flex items-center justify-center text-[#2F6BFF] mb-1.5 shrink-0 transition-all">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F6BFF] group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs font-bold text-[var(--color-text-primary)] leading-tight transition-colors">
                {item.title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
