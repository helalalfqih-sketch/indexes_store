/**
 * ProductMediaGallery
 * -------------------
 * Dynamic media gallery for the product detail page.
 *
 * Features:
 * - Shows all images and videos together in the same carousel / thumbnail strip
 * - Video support: MP4/WebM URL, Mux playback ID, poster image, controls enabled, autoplay disabled
 * - Video thumbnail with play icon overlay
 * - Fallback: maps video_playback_id or direct video URLs when product_media relation is absent
 * - Opens video in a full-screen modal player if requested
 * - If no video exists, shows "Request Video" button
 * - Keeps SSR/hydration safe and preserves RTL design
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
  Maximize2,
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
  | { kind: "video-url"; url: string; poster?: string; index: number }
  | { kind: "video-mux"; playbackId: string; poster?: string }
  | { kind: "3d"; modelSrc: string; poster: string };

interface Props {
  product: {
    id: string;
    name: string;
    image: string;
    images?: string[] | null;
    videos?: string[] | null;
    media?: Array<{
      type: "image" | "video";
      url: string;
      poster?: string | null;
      playbackId?: string | null;
    }> | null;
    videoPlaybackId?: string | null;
  };
}

/* ------------------------------------------------------------------ */
/*  Video URL detection                                                 */
/* ------------------------------------------------------------------ */

/** Returns true if the URL looks like a direct video file or stream */
function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.trim().toLowerCase();
  if (/\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?.*)?$/i.test(lower)) return true;
  if (lower.includes("stream.mux.com") || lower.includes("player.mux.com")) return true;
  if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com"))
    return true;
  if (lower.startsWith("data:video/")) return true;
  return false;
}

/** Extract Mux playback ID from a stream.mux.com URL or string */
function extractMuxId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const m = trimmed.match(/(?:stream\.mux\.com\/|player\.mux\.com\/|mux\.com\/)([A-Za-z0-9]+)/);
  if (m) return m[1];
  if (
    !trimmed.includes("http") &&
    !trimmed.includes("/") &&
    /^[A-Za-z0-9_-]{10,40}$/.test(trimmed)
  ) {
    return trimmed;
  }
  return null;
}

function buildMediaList(product: Props["product"], has3D: boolean): MediaItem[] {
  const items: MediaItem[] = [];
  const seenUrls = new Set<string>();

  let imgCounter = 0;
  let vidCounter = 0;
  const defaultPoster = product.image || (product.images && product.images[0]) || "";

  // 1. Process explicit media array if provided
  if (Array.isArray(product.media) && product.media.length > 0) {
    for (const item of product.media) {
      if (!item || !item.url || seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      if (item.type === "video" || isVideoUrl(item.url)) {
        const muxId = item.playbackId || extractMuxId(item.url);
        if (muxId) {
          items.push({
            kind: "video-mux",
            playbackId: muxId,
            poster: item.poster || defaultPoster,
          });
        } else {
          items.push({
            kind: "video-url",
            url: item.url,
            poster: item.poster || defaultPoster,
            index: vidCounter++,
          });
        }
      } else {
        items.push({
          kind: "image",
          url: item.url,
          index: imgCounter++,
        });
      }
    }
  }

  // 2. Process images[] array
  const allImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image].filter(Boolean);

  for (const url of allImages) {
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    if (isVideoUrl(url)) {
      const muxId = extractMuxId(url);
      if (muxId) {
        items.push({ kind: "video-mux", playbackId: muxId, poster: defaultPoster });
      } else {
        items.push({ kind: "video-url", url, poster: defaultPoster, index: vidCounter++ });
      }
    } else {
      items.push({ kind: "image", url, index: imgCounter++ });
    }
  }

  // 3. Process explicit videos[] array
  const explicitVids = Array.isArray(product.videos) ? product.videos.filter(Boolean) : [];
  for (const url of explicitVids) {
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
    const muxId = extractMuxId(url);
    if (muxId) {
      items.push({ kind: "video-mux", playbackId: muxId, poster: defaultPoster });
    } else {
      items.push({ kind: "video-url", url, poster: defaultPoster, index: vidCounter++ });
    }
  }

  // 4. Process Mux videoPlaybackId field
  if (product.videoPlaybackId) {
    const muxId = extractMuxId(product.videoPlaybackId) || product.videoPlaybackId;
    const vUrl = `https://stream.mux.com/${muxId}.m3u8`;
    if (
      !seenUrls.has(vUrl) &&
      !items.some((m) => m.kind === "video-mux" && m.playbackId === muxId)
    ) {
      seenUrls.add(vUrl);
      const poster = `https://image.mux.com/${muxId}/thumbnail.webp`;
      items.push({ kind: "video-mux", playbackId: muxId, poster });
    }
  }

  // 5. 3D model
  if (has3D) {
    items.push({ kind: "3d", modelSrc: modelFor(product.id)!, poster: defaultPoster });
  }

  return items;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                       */
/* ------------------------------------------------------------------ */

/** Convert watch URL → embed URL for YouTube/Vimeo */
function toEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
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

        <div className="aspect-video w-full bg-black flex items-center justify-center">
          {isDirectVideo ? (
            <video
              src={src}
              autoPlay={false}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-contain"
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
  const imageItems = mediaList.filter((m) => m.kind === "image") as Extract<
    MediaItem,
    { kind: "image" }
  >[];
  const hasAnyVideo = mediaList.some((m) => m.kind === "video-url" || m.kind === "video-mux");

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
          ) : activeItem?.kind === "video-url" ? (
            <motion.div
              key={`video-url-${activeItem.url}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full w-full flex items-center justify-center bg-black"
            >
              {!toEmbedUrl(activeItem.url) ? (
                <video
                  src={activeItem.url}
                  poster={activeItem.poster || product.image}
                  controls
                  autoPlay={false}
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div
                  className="relative h-full w-full flex items-center justify-center cursor-pointer group"
                  onClick={() => setVideoModal({ src: activeItem.url })}
                >
                  <OptimizedImage
                    src={activeItem.poster || product.image}
                    alt={product.name}
                    size="large"
                    className="h-full w-full object-cover opacity-50 group-hover:opacity-40 transition"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 fill-white text-white ms-1" />
                    </div>
                    <span className="rounded-full bg-black/60 px-4 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      انقر لتشغيل الفيديو
                    </span>
                  </div>
                </div>
              )}
              {/* Fullscreen Expand Button */}
              <button
                onClick={() => setVideoModal({ src: activeItem.url })}
                className="absolute top-3 end-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition"
                aria-label="توسيع الفيديو"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </motion.div>
          ) : activeItem?.kind === "video-mux" ? (
            <motion.div
              key={`video-mux-${activeItem.playbackId}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full w-full flex items-center justify-center bg-black cursor-pointer group"
              onClick={() => setVideoModal({ muxId: activeItem.playbackId })}
            >
              <OptimizedImage
                src={
                  activeItem.poster ||
                  `https://image.mux.com/${activeItem.playbackId}/thumbnail.webp`
                }
                alt={product.name}
                size="large"
                className="h-full w-full object-cover opacity-50 group-hover:opacity-40 transition"
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
              {(activeItem as Extract<MediaItem, { kind: "image" }>).index + 1} /{" "}
              {imageItems.length}
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
              const posterSrc = item.poster || product.image;
              return (
                <button
                  key={`vid-${idx}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`${baseClass} bg-black flex items-center justify-center group`}
                  aria-label="فيديو المنتج"
                >
                  <OptimizedImage
                    src={posterSrc}
                    alt="فيديو"
                    size="thumbnail"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-40 transition"
                  />
                  <div className="relative z-10 grid h-7 w-7 place-items-center rounded-full bg-primary/90 text-white shadow-md">
                    <Play className="h-3.5 w-3.5 fill-white text-white ms-0.5" />
                  </div>
                  <span className="absolute bottom-1 right-1 rounded-md bg-black/80 px-1 py-0.5 text-[8px] font-bold text-white">
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
            {requestSent
              ? "✅ تم إرسال طلب الفيديو — سنضيفه فور تجهيزه"
              : "اطلب توفير فيديو لهذا المنتج"}
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
