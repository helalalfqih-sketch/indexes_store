import React from "react";
import { ScrollHelmetBackground } from "./ScrollHelmetBackground";

export const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none aria-hidden">
      {/* 0. Scroll-Animated Helmet Canvas */}
      <ScrollHelmetBackground />

      {/* 1. Base Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* 2. Top-Right Radial Soft Atmosphere (Subtle Blue / Dark Graphite) */}
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-radial from-[#2F6BFF]/10 via-[#101216]/5 to-transparent rounded-full blur-[120px]" />

      {/* 3. Mid-Left Radial Soft Atmosphere (Subtle Cyan/Slate) */}
      <div className="absolute top-[35%] -left-40 w-[550px] h-[550px] bg-radial from-[#38bdf8]/08 via-[#101216]/5 to-transparent rounded-full blur-[140px]" />

      {/* 4. Bottom-Right Radial Soft Atmosphere (Deep Dark Neutral) */}
      <div className="absolute bottom-[10%] -right-32 w-[600px] h-[600px] bg-radial from-[#2F6BFF]/08 via-transparent to-transparent rounded-full blur-[140px]" />

      {/* 5. Subtle Vertical Edge Light Guides */}
      <div className="hidden xl:block absolute top-0 bottom-0 left-[2%] w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      <div className="hidden xl:block absolute top-0 bottom-0 right-[2%] w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent" />
    </div>
  );
};
