import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  size?: "thumbnail" | "card" | "large" | "original";
  className?: string;
  /** Set to true for above-the-fold / LCP images to skip lazy loading */
  eager?: boolean;
  /** Natural image width for CLS prevention (avoids layout shift) */
  naturalWidth?: number;
  /** Natural image height for CLS prevention (avoids layout shift) */
  naturalHeight?: number;
}

/** Build the optimized proxy URL before the first render so eager images start immediately. */
function getOptimizedUrl(url: string, targetSize: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:") return url;

    // Handle SVG/GIF bypass through the image proxy.
    if (url.includes(".svg") || url.includes(".gif")) {
      return `/api/public/image-proxy?url=${encodeURIComponent(url)}`;
    }

    let queryParams = "&format=webp";
    if (targetSize === "thumbnail") {
      queryParams += "&w=128&q=80";
    } else if (targetSize === "card") {
      queryParams += "&w=384&q=80";
    } else if (targetSize === "large") {
      queryParams += "&w=800&q=85";
    } else if (targetSize === "blur") {
      queryParams += "&w=16&q=15";
    }

    return `/api/public/image-proxy?url=${encodeURIComponent(url)}${queryParams}`;
  } catch {
    return url;
  }
}

export function OptimizedImage({
  src,
  alt,
  size = "card",
  className,
  eager = false,
  naturalWidth,
  naturalHeight,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [blurSrc, setBlurSrc] = useState<string>("");
  const [optimizedSrc, setOptimizedSrc] = useState<string>(() => getOptimizedUrl(src, size));
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    setOptimizedSrc(getOptimizedUrl(src, size));
    setBlurSrc("");
    setIsLoaded(false);
    setErrorCount(0);
  }, [src, size]);

  const handleError = () => {
    setErrorCount((current) => {
      if (current === 0) {
        setOptimizedSrc(src);
        return 1;
      }
      if (current === 1) {
        setOptimizedSrc("/images/product-placeholder.webp");
        setBlurSrc("");
        return 2;
      }
      return current;
    });
  };

  const loadingAttr = eager ? "eager" : "lazy";
  const fetchPriority = eager ? "high" : "auto";

  return (
    <div
      className={cn("relative overflow-hidden bg-black/5", className)}
      style={
        naturalWidth && naturalHeight
          ? { aspectRatio: `${naturalWidth} / ${naturalHeight}` }
          : undefined
      }
    >
      {blurSrc && !isLoaded && !eager && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          onError={() => setBlurSrc("")}
          className="absolute inset-0 h-full w-full scale-[1.05] object-cover blur-md transition-opacity duration-300 pointer-events-none"
          loading="eager"
          decoding="async"
        />
      )}

      {optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500 ease-in-out",
            isLoaded || eager ? "opacity-100" : "absolute inset-0 opacity-0",
          )}
          loading={loadingAttr}
          decoding="async"
          // @ts-ignore — fetchpriority is valid HTML5 but not yet in TS types
          fetchpriority={fetchPriority}
          width={
            naturalWidth ??
            (size === "thumbnail"
              ? 128
              : size === "card"
                ? 384
                : size === "large"
                  ? 800
                  : undefined)
          }
          height={
            naturalHeight ??
            (size === "thumbnail"
              ? 128
              : size === "card"
                ? 384
                : size === "large"
                  ? 800
                  : undefined)
          }
          {...props}
        />
      )}
    </div>
  );
}
