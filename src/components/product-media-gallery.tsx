/**
 * ProductMediaGallery
 * -------------------
 * Dynamic media gallery for the product detail page.
 *
 * Features:
 * - Shows all images from product.images[] as thumbnails
 * - Shows video thumbnails for each URL in product.videos[]
 * - Shows Mux video if product.videoPlaybackId exists
 * - Opens video in a full-screen modal player
 * - If no video exists, shows "Request Video" button that inserts into product_video_requests
 * - Keeps SSR/hydration safe (no window access in initial render)
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  X,
  Image as ImageIcon,
  Film,
  Box,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { OptimizedImage } from "@/components/optimized-image";
import { Product3DTile, modelFor, useMounted } from "@/lib/model-viewer";
import { requestProductVideo } from "@/lib/video-request.functions";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type MediaItem =
  | { kind: "image"; url: string; index: number }
  | { kind: "video-url"; url: string; index: number }
  | { kind: "video-mux"; playbackId: string }
  | { kind: "3d"; modelSrc: string; poster: string };

interface Props {
  product: {
    id: string;
    name: string;
    image: string;
    images?: string[] | null;
    videos?: string[] | null;
    videoPlaybackId?: string | null;
  };
}

/* ------------------------------------------------------------------ */
/*  Video URL detection                                                 */
/* ------------------------------------------------------------------ */

/** Returns true if the URL looks like a direct video file or stream */
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // Common video extensions
  if (/\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/.test(lower)) return true;
  // Mux stream URLs
  if (lower.includes("stream.mux.com") || lower.includes("player.mux.com")) return true;
  // YouTube / Vimeo embeds
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return true;
  if (lower.includes("vimeo.com")) return true;
  return false;
}

/** Extract Mux playback ID from a stream.mux.com URL */
function extractMuxId(url: string): string | null {
  const m = url.match(/stream\.mux\.com\/([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

function buildMediaList(product: Props["product"], has3D: boolean): MediaItem[] {
  const items: MediaItem[] = [];

  // Split images[] into actual images vs video URLs
  const allUrls =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image].filter(Boolean);

  let imgCounter = 0;
  let vidCounter = 0;

  for (const url of allUrls) {
    if (isVideoUrl(url)) {
      const muxId = extractMuxId(url);
      if (muxId) {
        items.push({ kind: "video-mux", playbackId: muxId });
      } else {
        items.push({ kind: "video-url", url, index: vidCounter++ });
      }
    } else {
      items.push({ kind: "image", url, index: imgCounter++ });
    }
  }

  // Explicit videos[] array (direct URLs, not in images)
  const explicitVids = Array.isArray(product.videos) ? product.videos.filter(Boolean) : [];
  for (const url of explicitVids) {
    const muxId = extractMuxId(url);
    if (muxId) {
      items.push({ kind: "video-mux", playbackId: muxId });
    } else {
      items.push({ kind: "video-url", url, index: vidCounter++ });
    }
  }

  // Mux videoPlaybackId field (classic Mux integration)
  if (product.videoPlaybackId) {
    // Avoid duplicate if already added from images[]
    const alreadyAdded = items.some(
      (m) => m.kind === "video-mux" && m.playbackId === product.videoPlaybackId
    );
    if (!alreadyAdded) {
      items.push({ kind: "video-mux", playbackId: product.videoPlaybackId });
    }
  }

  // 3D model
  if (has3D) {
    items.push({ kind: "3d", modelSrc: modelFor(product.id)!, poster: product.image });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                       */
/* ------------------------------------------------------------------ */

/** Convert watch URL → embed URL for YouTube/Vimeo */
function toEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`;
  return null;
}

function VideoModal({
  src,
  muxId,
  title,
  onClose,
}: {
  src?: string;
  muxId?: string;
  title: string;
  onClose: () => void;
}) {
  const embedUrl = src ? toEmbedUrl(src) : null;
  const isDirectVideo = src && !embedUrl;
  const muxPlayerUrl = muxId ? `https://player.mux.com/${muxId}` : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute end-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
          aria-label="إغلاق الفيديو"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="aspect-video w-full bg-black">
          {isDirectVideo ? (
            <video
              src={src}
              autoPlay
              controls
              className="h-full w-full"
              title={title}
            />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              className="h-full w-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          ) : muxPlayerUrl ? (
            <iframe
              src={muxPlayerUrl}
              title={title}
              className="h-full w-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : null}
        </div>

        <div className="bg-black px-4 py-3 text-xs font-bold text-white/70 text-center">
          {title}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                       */
/* ------------------------------------------------------------------ */

export function ProductMediaGallery({ product }: Props) {
  const mounted = useMounted();
  const has3D = mounted && !!modelFor(product.id);

  const mediaList = buildMediaList(product, has3D);
  const imageItems = mediaList.filter((m) => m.kind === "image") as Extract<MediaItem, { kind: "image" }>[];
  const hasAnyVideo =
    (Array.isArray(product.videos) && product.videos.length > 0) ||
    !!product.videoPlaybackId;

  const [activeIndex, setActiveIndex] = useState(0);
  const [videoModal, setVideoModal] = useState<{ src?: string; muxId?: string } | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const requestVideoFn = useServerFn(requestProductVideo);

  const activeItem = mediaList[activeIndex] ?? mediaList[0];

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % mediaList.length);
  }, [mediaList.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  const handleRequestVideo = async () => {
    setRequesting(true);
    try {
      const res = await requestVideoFn({
        data: { productId: product.id, productName: product.name },
      });
      setRequestSent(true);
      toast.success(res?.message || "تم إرسال طلب الفيديو ✨");
    } catch {
      toast.error("حدث خطأ أثناء إرسال الطلب. حاول مجدداً.");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Main Viewer ── */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-showcase-border bg-black/40 shadow-2xl">
        <AnimatePresence mode="wait">
          {activeItem?.kind === "3d" ? (
            <motion.div
              key="3d"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <Product3DTile
                modelSrc={(activeItem as Extract<MediaItem, { kind: "3d" }>).modelSrc}
                poster={(activeItem as Extract<MediaItem, { kind: "3d" }>).poster}
                alt={product.name}
              />
            </motion.div>
          ) : activeItem?.kind === "video-url" || activeItem?.kind === "video-mux" ? (
            <motion.div
              key="video-thumb"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full w-full flex items-center justify-center bg-black cursor-pointer group"
              onClick={() => {
                if (activeItem.kind === "video-url") {
                  setVideoModal({ src: (activeItem as Extract<MediaItem, { kind: "video-url" }>).url });
                } else {
                  setVideoModal({ muxId: (activeItem as Extract<MediaItem, { kind: "video-mux" }>).playbackId });
                }
              }}
            >
              <OptimizedImage
                src={product.image}
                alt={product.name}
                size="large"
                className="h-full w-full object-cover opacity-40 group-hover:opacity-30 transition"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 fill-white text-white ms-1" />
                </div>
                <span className="rounded-full bg-black/60 px-4 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  انقر لتشغيل الفيديو
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={(activeItem as Extract<MediaItem, { kind: "image" }>)?.url ?? "img"}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full"
            >
              <OptimizedImage
                src={(activeItem as Extract<MediaItem, { kind: "image" }>)?.url ?? product.image}
                alt={product.name}
                size="large"
                className="h-full w-full object-contain p-4"
                eager={activeIndex === 0}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prev / Next nav arrows (when > 1 media) */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute end-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition"
              aria-label="السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute start-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition"
              aria-label="التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Mode Label Badge */}
        <div className="absolute start-3 bottom-3 z-10 flex items-center gap-1.5">
          {activeItem?.kind === "3d" && (
            <span className="flex items-center gap-1 rounded-full border border-primary/40 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-primary backdrop-blur-md">
              <Box className="h-3 w-3" />
              عرض ثلاثي الأبعاد
            </span>
          )}
          {(activeItem?.kind === "video-url" || activeItem?.kind === "video-mux") && (
            <span className="flex items-center gap-1 rounded-full border border-red-500/40 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-red-400 backdrop-blur-md">
              <Film className="h-3 w-3" />
              فيديو
            </span>
          )}
          {activeItem?.kind === "image" && imageItems.length > 1 && (
            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white/70 backdrop-blur-md">
              <ImageIcon className="h-3 w-3" />
              {(activeItem as Extract<MediaItem, { kind: "image" }>).index + 1} / {imageItems.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Thumbnails Strip ── */}
      {mediaList.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {mediaList.map((item, idx) => {
            const isActive = idx === activeIndex;
            const baseClass = `relative flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
              isActive
                ? "border-primary ring-2 ring-primary/30 scale-105"
                : "border-showcase-border/50 opacity-60 hover:opacity-90 hover:border-showcase-border"
            }`;

            if (item.kind === "image") {
              return (
                <button
                  key={`img-${idx}`}
                  onClick={() => setActiveIndex(idx)}
                  className={baseClass}
                  aria-label={`صورة ${item.index + 1}`}
                >
                  <OptimizedImage
                    src={item.url}
                    alt={`${product.name} ${item.index + 1}`}
                    size="thumbnail"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            }

            if (item.kind === "video-url" || item.kind === "video-mux") {
              return (
                <button
                  key={`vid-${idx}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`${baseClass} bg-black flex items-center justify-center`}
                  aria-label="فيديو المنتج"
                >
                  <OptimizedImage
                    src={product.image}
                    alt="فيديو"
                    size="thumbnail"
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                  />
                  <Play className="relative z-10 h-5 w-5 fill-white text-white" />
                  <span className="absolute bottom-1 right-1 rounded-sm bg-black/70 px-1 text-[8px] font-bold text-white">
                    فيديو
                  </span>
                </button>
              );
            }

            if (item.kind === "3d") {
              return (
                <button
                  key="3d-thumb"
                  onClick={() => setActiveIndex(idx)}
                  className={`${baseClass} bg-black/60 flex flex-col items-center justify-center gap-0.5`}
                  aria-label="عرض ثلاثي الأبعاد"
                >
                  <Box className="h-5 w-5 text-primary" />
                  <span className="text-[8px] font-bold text-primary">3D</span>
                </button>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* ── Request Video CTA (shown only when no video exists) ── */}
      {!hasAnyVideo && (
        <button
          onClick={handleRequestVideo}
          disabled={requesting || requestSent}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition ${
            requestSent
              ? "border-success/40 bg-success/10 text-success cursor-default"
              : "border-showcase-border/60 bg-showcase-foreground/5 text-showcase-foreground/80 hover:bg-showcase-foreground/10 hover:border-primary/40"
          }`}
          aria-label="طلب توفير فيديو للمنتج"
        >
          {requesting ? (
            <span className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Video className="h-4 w-4 text-primary" />
          )}
          <span>
            {requestSent ? "✅ تم إرسال طلب الفيديو — سنضيفه فور تجهيزه" : "اطلب توفير فيديو لهذا المنتج"}
          </span>
        </button>
      )}

      {/* ── Video Modal ── */}
      <AnimatePresence>
        {videoModal && (
          <VideoModal
            src={videoModal.src}
            muxId={videoModal.muxId}
            title={product.name}
            onClose={() => setVideoModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
