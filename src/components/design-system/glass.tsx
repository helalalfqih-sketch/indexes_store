/**
 * Cinematic Design System — glass primitives.
 *
 * Single source of truth for the futuristic showroom UI. Every new storefront
 * section should compose these primitives instead of hand-rolling rgba values.
 * All primitives consume the :root tokens (--glass-bg / --glass-border /
 * --glass-blur, --neon-blue / --teal-glow / --accent-copper) so a single token
 * change re-skins the whole experience (and stays CMS-linkable later).
 *
 * Presentation-only: no data fetching, no business logic.
 */
import { forwardRef, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* GlassCard — bordered glass surface (grid cards, tiles, modals)      */
/* ------------------------------------------------------------------ */
export const GlassCard = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function GlassCard({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("rounded-3xl glass-dark text-showcase-foreground", className)}
        {...props}
      />
    );
  },
);

/* ------------------------------------------------------------------ */
/* GlassPanel — large borderless floating section (hero panels, bars)  */
/* ------------------------------------------------------------------ */
export const GlassPanel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function GlassPanel({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("rounded-[32px] glass-float text-showcase-foreground", className)}
        {...props}
      />
    );
  },
);

/* ------------------------------------------------------------------ */
/* FloatingCard — glass row/card with hover lift + ambient glow        */
/* ------------------------------------------------------------------ */
export const FloatingCard = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function FloatingCard({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl glass-float text-showcase-foreground transition-all duration-300",
          "hover:-translate-y-1 hover:glow-neon",
          className,
        )}
        {...props}
      />
    );
  },
);

/* ------------------------------------------------------------------ */
/* GlowButton — pill CTA with neon glow (variants: neon/teal/copper)   */
/* ------------------------------------------------------------------ */
type GlowVariant = "neon" | "teal" | "copper" | "primary";

const GLOW_STYLES: Record<GlowVariant, string> = {
  neon: "bg-neon/90 text-[#04121d] glow-neon hover:bg-neon",
  teal: "bg-teal-glow/90 text-[#04121d] glow-teal hover:bg-teal-glow",
  copper: "bg-copper/90 text-white glow-copper hover:bg-copper",
  primary: "bg-primary text-primary-foreground shadow-brand hover:brightness-110",
};

export const GlowButton = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & { variant?: GlowVariant }
>(function GlowButton({ className, variant = "neon", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={props.type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5",
        "text-sm font-black transition-all duration-200 active:scale-95 hover:scale-[1.03]",
        GLOW_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
});

/* ------------------------------------------------------------------ */
/* NeonIcon — icon inside a glowing glass tile                         */
/* ------------------------------------------------------------------ */
export function NeonIcon({
  icon: Icon,
  variant = "neon",
  className,
  iconClassName,
}: {
  icon: ElementType<{ className?: string }>;
  variant?: GlowVariant;
  className?: string;
  iconClassName?: string;
}) {
  const tone =
    variant === "teal"
      ? "text-teal-glow glow-teal bg-teal-glow/10 border-teal-glow/25"
      : variant === "copper"
        ? "text-copper glow-copper bg-copper/10 border-copper/25"
        : variant === "primary"
          ? "text-primary shadow-brand bg-primary/15 border-primary/25"
          : "text-neon glow-neon bg-neon/10 border-neon/25";
  return (
    <span
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border backdrop-blur-md",
        tone,
        className,
      )}
    >
      <Icon className={cn("h-5 w-5", iconClassName)} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ParticleField — floating cinematic light particles (CSS-only)       */
/* ------------------------------------------------------------------ */
export function ParticleField({ count = 14, className }: { count?: number; className?: string }) {
  const particles = Array.from({ length: count }, (_, i) => {
    // Deterministic pseudo-random spread (stable SSR/client markup)
    const seed = (i * 2654435761) % 1000;
    const left = (seed % 100) + 0.5;
    const bottom = ((seed * 7) % 60) - 5;
    const size = 2 + ((seed * 13) % 4);
    const duration = 11 + ((seed * 17) % 12);
    const delay = -((seed * 19) % 14);
    const alpha = 0.25 + ((seed * 23) % 35) / 100;
    const drift = ((seed * 29) % 40) - 20;
    const tone = i % 5 === 0 ? "var(--teal-glow)" : i % 7 === 0 ? "var(--accent-copper)" : "var(--neon-blue)";
    return { left, bottom, size, duration, delay, alpha, drift, tone, key: i };
  });

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {particles.map((p) => (
        <span
          key={p.key}
          className="absolute rounded-full animate-particle"
          style={{
            left: `${p.left}%`,
            bottom: `${p.bottom}%`,
            width: p.size,
            height: p.size,
            background: p.tone,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${p.size * 3}px ${p.tone}`,
            ["--particle-duration" as string]: `${p.duration}s`,
            ["--particle-delay" as string]: `${p.delay}s`,
            ["--particle-alpha" as string]: `${p.alpha}`,
            ["--particle-x" as string]: `${p.drift}px`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Convenience: section shell with consistent spacing                  */
/* ------------------------------------------------------------------ */
export function ShowroomSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("relative", className)}>{children}</section>;
}
