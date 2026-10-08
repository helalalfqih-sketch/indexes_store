import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useAppearance } from "@/components/appearance-provider";

/**
 * Hero copy layer of the immersive globe: INDEXES pill, headline, subline and
 * the gradient CTA. Purely presentational — it sits above the canvas on its own
 * z-layer with a soft scrim so globe tiles can never hurt legibility.
 */
export function HeroCopy({ dots = 4 }: { dots?: number }) {
  const { settings } = useAppearance();
  const hero = settings.hero;

  return (
    <div className="relative px-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[130%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(2,6,17,0.82) 0%, rgba(2,6,17,0.55) 46%, rgba(2,6,17,0) 74%)",
        }}
      />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-line bg-ink-card/80 px-3 py-1 text-[12px] font-bold tracking-[4.5px] text-ink-text">
        {hero?.globeBadgeText ?? hero?.badgeText ?? "INDEXES"}
        <span className="h-1.5 w-1.5 rounded-full bg-neon" />
      </span>
      <h1
        className="mt-2.5 font-bold leading-[1.16] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
        style={{
          fontSize: hero?.globeTitleFontSize
            ? `${hero.globeTitleFontSize}px`
            : "clamp(27px, 7.6vw, 44px)",
        }}
      >
        {hero?.globeTitleText ?? hero?.title ?? "آلاف المنتجات"}
      </h1>
      <p
        className="mt-1 font-medium text-ink-text/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
        style={{
          fontSize: hero?.globeSubtitleFontSize
            ? `${hero.globeSubtitleFontSize}px`
            : "clamp(12.5px, 3.5vw, 17px)",
        }}
      >
        {hero?.globeSubtitleText ?? hero?.subtitle ?? "تسوّق بسهولة من اندكس ستور"}
      </p>
      <Link
        to={hero?.ctaLink || "/search"}
        search={{ q: "" }}
        className="press pointer-events-auto mx-auto mt-4 flex items-center justify-center gap-2 rounded-full bg-linear-to-l from-neon to-neon-2 font-bold text-white shadow-[0_18px_54px_-10px_var(--neon)]"
        style={{
          height: "clamp(46px, 12.2vw, 58px)",
          width: "clamp(178px, 48vw, 260px)",
          fontSize: "clamp(14.5px, 4vw, 19px)",
        }}
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
        {hero?.ctaText ?? "استكشف المنتجات"}
      </Link>

      <div className="mt-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink-line bg-ink-card/70 px-2.5 py-1.5">
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              className={
                i === 0 ? "h-1.5 w-5 rounded-full bg-neon" : "h-1.5 w-1.5 rounded-full bg-white/25"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
