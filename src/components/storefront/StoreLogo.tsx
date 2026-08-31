import React from 'react';
import { useAppearance } from '@/components/appearance-provider';

interface StoreLogoProps {
  variant?: 'icon' | 'header' | 'badge' | 'full';
  className?: string;
}

export const StoreLogo: React.FC<StoreLogoProps> = ({ variant = 'header', className = '' }) => {
  const { settings } = useAppearance();
  const configuredLogo =
    settings.store_identity?.logoUrl ||
    settings.navigation?.logoUrl ||
    settings.store_identity?.faviconUrl;
  const storeName =
    settings.brand_settings?.storeName ||
    settings.navigation?.storeName ||
    "إندكس ستور";
  const tagline =
    settings.brand_settings?.tagline ||
    settings.navigation?.tagline ||
    "الجودة والفخامة";

  // If user uploaded a real logo in Admin Settings, render it seamlessly
  const renderConfiguredImage = (boxClasses: string) => {
    if (!configuredLogo) return null;
    return (
      <img
        src={configuredLogo}
        alt={storeName}
        className={`${boxClasses} object-contain rounded-xl`}
      />
    );
  };

  if (variant === 'icon') {
    if (configuredLogo) {
      return (
        <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-neutral-900 border border-[#2F6BFF]/40 p-1.5 shadow-lg ${className}`}>
          {renderConfiguredImage('w-full h-full')}
        </div>
      );
    }

    return (
      <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#090D16] border border-[#2F6BFF]/40 p-2 shadow-lg shadow-blue-500/10 ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="iconGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2F6BFF" />
              <stop offset="50%" stopColor="#7B3FFF" />
              <stop offset="100%" stopColor="#FFB800" />
            </linearGradient>
            <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2F6BFF" floodOpacity="0.4" />
            </filter>
          </defs>
          <rect x="5" y="5" width="90" height="90" rx="24" fill="url(#iconGlow)" opacity="0.15" />
          <rect x="7" y="7" width="86" height="86" rx="22" stroke="url(#iconGlow)" strokeWidth="3" />
          
          <path
            d="M 28 32 H 36 L 44 62 H 72 L 78 40 H 38"
            stroke="url(#iconGlow)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#shadowGlow)"
          />
          <circle cx="47" cy="72" r="5" fill="#FFB800" />
          <circle cx="69" cy="72" r="5" fill="#2F6BFF" />
          <circle cx="76" cy="34" r="3.5" fill="#FF3B3B" />
        </svg>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`relative flex items-center gap-3 bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-[#2F6BFF]/40 p-3 rounded-2xl shadow-xl dir-rtl ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-[#2F6BFF]/50 p-1.5 shrink-0 flex items-center justify-center shadow-md overflow-hidden">
          {configuredLogo ? (
            renderConfiguredImage('w-full h-full')
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="badgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2F6BFF" />
                  <stop offset="100%" stopColor="#FFB800" />
                </linearGradient>
              </defs>
              <path
                d="M 28 32 H 36 L 44 62 H 72 L 78 40 H 38"
                stroke="url(#badgeGlow)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="47" cy="72" r="6" fill="#FFB800" />
              <circle cx="69" cy="72" r="6" fill="#2F6BFF" />
            </svg>
          )}
        </div>
        <div className="flex flex-col text-right">
          <span className="text-white font-black text-base tracking-wide leading-tight">
            {storeName}
          </span>
          <span className="text-[#FFB800] text-[11px] font-bold">
            {tagline}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B0F19] border-2 border-[#2F6BFF]/60 p-2 shadow-2xl shadow-blue-500/20 mb-3 flex items-center justify-center overflow-hidden">
          {configuredLogo ? (
            renderConfiguredImage('w-full h-full')
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="fullGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2F6BFF" />
                  <stop offset="50%" stopColor="#7B3FFF" />
                  <stop offset="100%" stopColor="#FFB800" />
                </linearGradient>
              </defs>
              <path
                d="M 25 30 H 35 L 43 62 H 73 L 80 38 H 37"
                stroke="url(#fullGlow)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="46" cy="73" r="6" fill="#FFB800" />
              <circle cx="70" cy="73" r="6" fill="#2F6BFF" />
              <circle cx="78" cy="30" r="4" fill="#FF3B3B" />
            </svg>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white">
          {storeName}
        </h2>
        <p className="text-[#FFB800] text-xs font-extrabold mt-0.5 dir-rtl">
          {tagline}
        </p>
      </div>
    );
  }

  // Header default variant
  return (
    <div className={`flex items-center gap-2 select-none cursor-pointer dir-rtl ${className}`}>
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-[#2F6BFF]/50 p-1 shrink-0 flex items-center justify-center shadow-md shadow-blue-600/15 group-hover:border-[#2F6BFF] transition-all overflow-hidden">
        {configuredLogo ? (
          renderConfiguredImage('w-full h-full')
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hdrGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2F6BFF" />
                <stop offset="100%" stopColor="#FFB800" />
              </linearGradient>
            </defs>
            <path
              d="M 25 30 H 35 L 43 62 H 73 L 80 38 H 37"
              stroke="url(#hdrGlow)"
              strokeWidth="6.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="46" cy="73" r="6.5" fill="#FFB800" />
            <circle cx="70" cy="73" r="6.5" fill="#2F6BFF" />
          </svg>
        )}
      </div>
      <div className="hidden lg:flex flex-col text-right">
        <span className="text-xs sm:text-sm font-black text-[var(--color-text-primary)] leading-none tracking-tight">
          {storeName}
        </span>
        <span className="text-[9px] font-bold text-[#FFB800] leading-tight mt-0.5">
          {tagline}
        </span>
      </div>
    </div>
  );
};
