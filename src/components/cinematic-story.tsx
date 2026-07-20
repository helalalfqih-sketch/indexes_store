import { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { MessageCircle } from "lucide-react";

// Public, muted, looping ambient video — CDN hosted, safe for autoplay.
const VIDEO_SRC = "https://cdn.coverr.co/videos/coverr-a-luxury-modern-living-room-4568/1080p.mp4";
const VIDEO_POSTER =
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=70";

const WA_LINK =
  "https://wa.me/967774437523?text=" +
  encodeURIComponent("مرحباً، أريد الاستفسار عن منتجات اندكس ستور");

const HEADLINE = "اندكس ستور: حيث تلتقي الفخامة بالتقنية";

const STORY_BLOCKS = [
  {
    kicker: "الفصل الأول",
    title: "تجربة تسوّق سينمائية",
    body: "لا نبيع منتجات فقط — نصنع لحظات. كل تفصيلة داخل اندكس ستور مصمّمة لتمنحك إحساسًا بالفخامة منذ اللمسة الأولى.",
  },
  {
    kicker: "الفصل الثاني",
    title: "تقنية بلا حدود",
    body: "أحدث الأجهزة الذكية، الإكسسوارات الفاخرة، والتجارب ثلاثية الأبعاد التي تجعلك تعيش المنتج قبل اقتنائه.",
  },
  {
    kicker: "الفصل الثالث",
    title: "خدمة تليق بك",
    body: "توصيل لكل المحافظات، دعم مباشر عبر الواتساب، وضمان جودة على كل قطعة. أنت في المكان الصحيح.",
  },
];

const headlineWords = HEADLINE.split(" ");

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function CinematicStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Slow parallax for the video (zooms subtly during the pin)
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.55, 0.7, 0.85]);
  // Background editorial typography drift
  const bgTypoX = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      aria-label="قصة اندكس ستور"
      className="relative w-full"
      style={{
        // 4 viewports: headline + 3 chapters + CTA sit inside a pinned stage
        height: "400vh",
        fontFamily: "Tajawal, system-ui, sans-serif",
      }}
    >
      {/* Sticky pinned stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-showcase">
        {/* Video background */}
        <motion.div
          style={{ scale: videoScale, y: videoY }}
          className="absolute inset-0 h-full w-full"
        >
          <video
            src={VIDEO_SRC}
            poster={VIDEO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Dark gradient overlay for readability */}
        <motion.div style={{ opacity: overlayOpacity }} className="absolute inset-0" aria-hidden>
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--showcase) 90%, transparent) 0%, color-mix(in oklab, var(--showcase) 35%, transparent) 40%, color-mix(in oklab, var(--showcase) 55%, transparent) 70%, color-mix(in oklab, var(--showcase) 95%, transparent) 100%)",
            }}
          />
        </motion.div>

        {/* Massive editorial background typography (blend mode) */}
        <motion.div
          style={{ x: bgTypoX }}
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="select-none font-black tracking-tight text-showcase-foreground/25 mix-blend-overlay whitespace-nowrap"
            style={{
              fontSize: "clamp(8rem, 26vw, 26rem)",
              lineHeight: 0.85,
            }}
          >
            INDEXES
          </span>
        </motion.div>

        {/* Foreground scroll-telling content */}
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center text-showcase-foreground">
          {/* Headline — split into words, staggered entry */}
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.4 }}
            className="mx-auto max-w-5xl font-black leading-[1.15] tracking-tight text-[clamp(2rem,5vw,5rem)]"
          >
            {headlineWords.map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                custom={i}
                variants={wordVariants}
                className="inline-block px-1"
              >
                {w}
              </motion.span>
            ))}
          </motion.h2>

          {/* Chapters — fade sequentially */}
          <div className="mt-10 flex w-full max-w-2xl flex-col gap-6">
            {STORY_BLOCKS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.6 }}
                transition={{
                  duration: 0.9,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-2xl border border-showcase-border bg-showcase-foreground/[0.03] p-5 backdrop-blur-sm"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-showcase-muted">
                  {b.kicker}
                </p>
                <h3 className="mt-1.5 text-lg font-black text-showcase-foreground text-[clamp(1.1rem,2.4vw,1.6rem)]">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-showcase-foreground/80 text-[clamp(0.9rem,1.6vw,1.05rem)]">
                  {b.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Sticky final CTA — materializes at end of scroll */}
          <motion.a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.9 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-showcase-foreground/25 bg-showcase-foreground/10 px-7 py-3.5 text-sm font-black text-showcase-foreground shadow-2xl backdrop-blur-xl transition hover:bg-showcase-foreground/20"
          >
            <MessageCircle className="h-4 w-4" />
            <span>ابدأ رحلتك معنا عبر واتساب</span>
          </motion.a>
        </div>

        {/* Bottom vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background: "linear-gradient(to top, var(--showcase) 0%, transparent 100%)",
          }}
        />
      </div>
    </section>
  );
}
