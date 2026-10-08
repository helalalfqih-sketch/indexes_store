import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ProductGlobeCanvas } from "@/components/product-sphere-hero";
import { AiSearchPanel } from "@/components/home/ai-search-panel";
import { HeroCopy } from "@/components/home/hero-copy";
import { TrustStrip } from "@/components/home/trust-strip";
import {
  BannerBackdrop,
  BannerDots,
  OfferContent,
} from "@/components/home/exclusive-offers-banner";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { useIsDesktop } from "@/hooks/use-desktop";
import { DesktopHero } from "@/components/home/desktop-hero";

/** Sticky header height (mobile / >=1024px) — mirrors app-shell. */
const HEADER_SM = 58;
const HEADER_LG = 66;
/** Fraction of the canvas box height taken by the projected sphere.
 *  Matches the reference: the planet reads ~87% of the viewport width. */
const PROJECTION = 0.872;
const IDENTITY_H = 50;
const GLOBE_GAP = 4;

/** Fixed heights of the panels that close the initial state. */
const AI_H = 134;
const TRUST_H = 74;
const PANEL_GAP = 8;
/** Space reserved for the floating bottom navigation (nav height + gap). */
const NAV_RESERVE = 76;

type Geometry = {
  cw: number;
  header: number;
  heroH: number;
  stageH: number;
  sectionH: number;
  base: number;
  diameter: number;
  compactDiameter: number;
  globeCenterY: number;
  aiTop: number;
  trustTop: number;
  scaleEnd: number;
  copyW: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  /** Scroll progress at which the sticky stage releases: the timeline must be
   *  fully complete by then, otherwise the hero scrolls away mid-animation. */
  pEnd: number;
  exclusion: { x: number; y0: number; y1: number };
};

/** Scroll distance dedicated to the large → compact transformation. */
const TRAVEL = 340;

function useStageGeometry(stageRef: React.RefObject<HTMLDivElement | null>): Geometry {
  const [cw, setCw] = useState(362);
  // Viewport height is only read on the client; the SSR value matches the
  // first client render because the initial state is identical.
  const [vh, setVh] = useState(844);
  const [vw, setVw] = useState(390);
  /** Document offset of the sticky stage (header + shipping strip above it). */
  const [stageTop, setStageTop] = useState(HEADER_SM);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setCw(Math.round(rect.width) || 362);
      setVh(Math.round(window.innerHeight) || 844);
      setVw(Math.round(window.innerWidth) || 390);
      // The stage is sticky: its offset is only truthful at the top of the page.
      if (window.scrollY < 4) setStageTop(Math.max(0, Math.round(rect.top)));
    };
    measure();
    // Sections above the stage (shipping strip, fonts, async data) settle
    // after paint, so the offset is re-read a few times before it is trusted.
    const raf = requestAnimationFrame(measure);
    const timers = [120, 400, 1200, 2500].map((ms) => window.setTimeout(measure, ms));
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    if (node.parentElement) ro.observe(node.parentElement);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [stageRef]);

  return useMemo(() => {
    const header = vw >= 768 ? HEADER_LG : HEADER_SM;
    const desktop = cw >= 900;
    const large = cw >= 390;

    // The globe is budgeted from the space actually left on the first screen —
    // measured from the real stage offset — so the AI and trust panels always
    // stay fully visible above the floating bottom navigation.
    const available =
      vh -
      Math.max(stageTop, header) -
      IDENTITY_H -
      GLOBE_GAP -
      AI_H -
      TRUST_H -
      PANEL_GAP * 2 -
      (vw >= 768 ? NAV_RESERVE + 34 : NAV_RESERVE);
    // The planet reads edge-to-edge like the reference: the canvas box may
    // bleed past the page gutters, but never past the viewport, so no orbiting
    // tile is clipped by the screen edge.
    // Reference calibration: the planet must read nearly edge-to-edge. The
    // height budget is only a lower bound — on short viewports the sphere keeps
    // a minimum of 86% of the viewport width instead of collapsing.
    const base = Math.min(
      vw,
      desktop ? 660 : 520,
      Math.max(230, available / PROJECTION, vw * (desktop ? 0.72 : 0.81)),
    );
    const diameter = base * PROJECTION;

    // Commercial banner (Reference B): height = 39.3% of the banner width and
    // the globe artwork reads ~86% of the banner height on desktop.
    const heroH = desktop ? 340 : large ? 214 : 202;
    const compactDiameter = desktop ? 292 : large ? 172 : 162;
    const scaleEnd = compactDiameter / PROJECTION / base;

    const globeCenterY = IDENTITY_H + GLOBE_GAP + diameter / 2;
    const aiTop = IDENTITY_H + GLOBE_GAP + diameter + PANEL_GAP;
    const trustTop = aiTop + AI_H + PANEL_GAP;
    const stageH = Math.max(heroH, trustTop + TRUST_H);
    // Section track = the full initial-state stack (which overflows below the
    // sticky banner frame) + the transition travel. Budgeting only `heroH` let
    // the sections below scroll over the still-visible globe / AI / trust
    // panels, which is the overlap seen on short viewports.
    const sectionH = stageH + TRAVEL;
    // Sticky release point expressed as scroll progress (offset end→start).
    const pEnd = Math.min(0.94, Math.max(0.5, (sectionH - heroH) / sectionH));

    // Text-protection zone: wide enough that no tile crosses the headline,
    // subline or CTA while the initial state is on screen.
    const zoneW = desktop ? 270 : Math.min(cw * 0.7, 262);
    const zoneH = desktop ? 190 : 158;

    const xEnd = cw / 2 - 21 - compactDiameter * 0.58;
    // Copy column stops before the globe's visual edge (tiles included), so the
    // headline, catalog label and CTA are never covered by the sphere.
    const copyW = Math.max(
      118,
      Math.min(desktop ? 300 : 210, cw / 2 + xEnd - compactDiameter * 0.62 - 26),
    );

    return {
      cw,
      header,
      heroH,
      stageH,
      sectionH,
      base,
      diameter,
      compactDiameter,
      globeCenterY,
      aiTop,
      trustTop,
      scaleEnd,
      copyW,
      // Compact banner: globe sits on the RIGHT (positive translateX is always
      // physically right — CSS transforms are not mirrored in RTL), offer copy
      // occupies the left column.
      // Inset accounts for the orbiting product tiles, which sit slightly
      // outside the projected sphere radius, plus a >=10px safety margin.
      xEnd,

      // `y` positions the globe CENTER: the box is already offset by
      // margin-top:-base/2 from the stage top edge.
      yStart: globeCenterY,
      yEnd: heroH / 2,
      pEnd,
      exclusion: { x: zoneW / base, y0: -zoneH / base, y1: zoneH / base },
    };
  }, [cw, vh, vw, stageTop]);
}

function StoreIdentity() {
  return (
    <div className="flex h-[56px] items-center justify-end gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="min-w-0 text-end">
          <p className="flex items-center justify-end gap-1.5 truncate text-[17.5px] font-bold leading-tight">
            اندكس ستور
          </p>
          <p className="truncate text-[12.5px] leading-tight text-ink-muted">
            كل ما تحتاجه في مكان واحد
          </p>
        </div>
        <span className="grid h-[56px] w-[56px] shrink-0 place-items-center gap-0.5 rounded-[18px] border border-neon/55 bg-ink-card text-neon-2 shadow-[0_0_26px_-10px_var(--neon)]">
          <ShoppingBag className="mx-auto h-[22px] w-[22px]" strokeWidth={1.7} />
          <span className="block text-[7px] font-bold tracking-[0.14em] text-ink-text">
            INDEXES
          </span>
        </span>
      </div>
    </div>
  );
}

export function ScrollGlobeHero({ products }: { products: LegacyProductShape[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const geom = useStageGeometry(stageRef);
  const isDesktop = useIsDesktop();
  const [visible, setVisible] = useState(true);

  // Progress is scoped to this hero element only, so an unrelated route's
  // scroll position can never leak into it.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const p = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.9,
    restDelta: 0.001,
  });

  // Timeline stops are expressed against the old 0…0.78 range and rescaled so
  // the animation always finishes exactly when the sticky stage releases.
  const k = geom.pEnd / 0.78;
  const at = (t: number) => t * k;

  // Exact timeline — transform + opacity only, never layout.
  const initialOpacity = useTransform(p, [at(0.06), at(0.22)], [1, 0]);
  const copyY = useTransform(p, [at(0.06), at(0.22)], [0, -18]);
  const aiY = useTransform(p, [at(0.06), at(0.22)], [0, 24]);
  const scale = useTransform(
    p,
    [at(0.1), at(0.4), at(0.72)],
    [1, geom.scaleEnd + (1 - geom.scaleEnd) * 0.32, geom.scaleEnd],
  );
  const x = useTransform(p, [at(0.1), at(0.72)], [0, geom.xEnd]);
  const y = useTransform(p, [at(0.1), at(0.72)], [geom.yStart, geom.yEnd]);
  const shellOpacity = useTransform(p, [at(0.3), at(0.66)], [0, 1]);
  const shellScale = useTransform(p, [at(0.3), at(0.66)], [0.98, 1]);
  const offerOpacity = useTransform(p, [at(0.38), at(0.68)], [0, 1]);
  const offerX = useTransform(p, [at(0.38), at(0.68)], [-24, 0]);

  // Protect the copy zone from tiles while the initial state is on screen.
  const [protectText, setProtectText] = useState(true);
  useEffect(() => {
    const unsub = p.on("change", (v) => {
      const next = v < 0.24 * k;
      setProtectText((prev) => (prev === next ? prev : next));
    });
    return unsub;
  }, [p, k]);

  // Pause WebGL when the stage leaves the viewport.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries[0]?.isIntersecting ?? true),
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  // Desktop (>=1024px) uses its own two-column composition; the mobile
  // immersive geometry below is untouched.
  if (isDesktop) return <DesktopHero products={products} />;

  if (reduced) {
    return (
      <div ref={sectionRef} className="flex flex-col gap-3">
        <div ref={stageRef} className="flex flex-col gap-3">
          <StoreIdentity />
          <div className="relative mx-auto" style={{ width: geom.base, height: geom.base }}>
            <ProductGlobeCanvas products={products} paused={!visible} exclusion={geom.exclusion} />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
              <HeroCopy />
            </div>
          </div>
          <AiSearchPanel height={AI_H} />
          <TrustStrip />
          <section
            className="relative overflow-hidden rounded-[24px] border border-[rgba(139,92,246,0.42)] bg-ink-card"
            style={{ height: geom.heroH }}
          >
            <BannerBackdrop />
            <div dir="ltr" className="relative z-10 flex h-full items-center pl-4">
              <div dir="rtl">
                <OfferContent compact={geom.cw < 900} width={geom.copyW} />
              </div>
            </div>
            <BannerDots />
          </section>
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative" style={{ height: geom.sectionH }}>
      {/* The sticky box is the compact banner frame; the initial-state layers
          overflow downward from it and fade out before the banner appears. */}
      <div ref={stageRef} className="sticky" style={{ top: geom.header, height: geom.heroH }}>
        {/* Compact banner shell (final state) — fades and scales into place */}
        <motion.section
          aria-label="استكشاف المنتجات"
          style={{ opacity: shellOpacity, scale: shellScale, height: geom.heroH }}
          className="relative z-10 overflow-hidden rounded-[24px] border border-[rgba(139,92,246,0.42)] bg-[linear-gradient(145deg,rgba(15,21,43,0.96),rgba(5,8,22,0.98))] will-change-transform"
        >
          <BannerBackdrop />
          {/* Explicit LTR grid: offer copy in the left column, globe area on
              the right. Arabic text keeps its RTL alignment inside the column. */}
          <motion.div
            dir="ltr"
            style={{ opacity: offerOpacity, x: offerX }}
            className="relative z-10 flex h-full items-center pl-4 md:pl-16"
          >
            <div dir="rtl">
              <OfferContent compact={geom.cw < 900} width={geom.copyW} />
            </div>
          </motion.div>

          <BannerDots />
        </motion.section>

        {/* One persistent globe — never remounted, never re-materialised */}
        <motion.div
          initial={false}
          style={{
            width: geom.base,
            height: geom.base,
            marginLeft: -geom.base / 2,
            marginTop: -geom.base / 2,
            x,
            y,
            scale,
          }}
          className="pointer-events-none absolute left-1/2 top-0 z-20 origin-center will-change-transform"
        >
          {/* Fixed pixel box: the WebGL canvas must never be re-measured from
              the scaled parent, or three.js shrinks the drawing buffer twice. */}
          <div
            className="pointer-events-auto absolute left-0 top-0"
            style={{ width: geom.base, height: geom.base }}
          >
            <ProductGlobeCanvas
              products={products}
              paused={!visible}
              exclusion={protectText ? geom.exclusion : null}
            />
          </div>
        </motion.div>

        {/* Store identity (initial state) */}
        <motion.div
          style={{ opacity: initialOpacity }}
          className={`absolute inset-x-0 top-0 z-30 will-change-transform ${protectText ? "" : "pointer-events-none"}`}
        >
          <StoreIdentity />
        </motion.div>

        {/* Central copy (initial state) */}
        <motion.div
          style={{ opacity: initialOpacity, y: copyY, top: geom.globeCenterY }}
          className="pointer-events-none absolute inset-x-0 z-30 -translate-y-1/2 will-change-transform"
        >
          <HeroCopy />
        </motion.div>

        {/* AI search — part of the initial experience, fades out with it */}
        <motion.div
          style={{ opacity: initialOpacity, y: aiY, top: geom.aiTop }}
          className={`absolute inset-x-0 z-30 will-change-transform ${protectText ? "" : "pointer-events-none"}`}
        >
          <AiSearchPanel height={AI_H} />
        </motion.div>

        {/* Trust benefits — closes the initial screen, per the reference */}
        <motion.div
          style={{ opacity: initialOpacity, y: aiY, top: geom.trustTop }}
          className={`absolute inset-x-0 z-30 will-change-transform ${protectText ? "" : "pointer-events-none"}`}
        >
          <TrustStrip />
        </motion.div>
      </div>
    </div>
  );
}
