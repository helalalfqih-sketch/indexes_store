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
  const [optimizedSrc, setOptimizedSrc] = useState<string>("");
  const [errorCount, setErrorCount] = useState(0);

  // Build the optimized proxy URL based on requested size presets
  const getOptimizedUrl = (url: string, targetSize: string): string => {
    if (!url) return "";
    try {
      // Validate URL format
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:") return url;

      // Handle SVG/GIF bypass
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
        queryParams += "&w=16&q=15"; // Tiny blur placeholder
      }

      return `/api/public/image-proxy?url=${encodeURIComponent(url)}${queryParams}`;
    } catch {
      return url; // Return original if not a valid absolute URL
    }
  };

  useEffect(() => {
    // Generate blur placeholder and target URLs
    setBlurSrc(getOptimizedUrl(src, "blur"));
    setOptimizedSrc(getOptimizedUrl(src, size));
    setIsLoaded(false); // Reset loaded state if src changes
    setErrorCount(0); // Reset errors
  }, [src, size, errorCount]);

  const handleError = () => {
    if (errorCount === 0) {
      // First retry: use original source directly bypassing proxy
      setOptimizedSrc(src);
      setErrorCount(1);
    } else if (errorCount === 1) {
      // Second failure: use fallback placeholder
      setOptimizedSrc(`https://placehold.co/600x600/120226/eef4fc?text=INDEXES`);
      setErrorCount(2);
    }
  };

  const loadingAttr = eager ? "eager" : "lazy";
  // fetchpriority is a non-standard attribute — use React's way
  const fetchPriority = eager ? "high" : "auto";

  return (
    <div
      className={cn("relative overflow-hidden bg-black/5", className)}
      // Reserve layout space to prevent CLS when dimensions are known
      style={
        naturalWidth && naturalHeight
          ? { aspectRatio: `${naturalWidth} / ${naturalHeight}` }
          : undefined
      }
    >
      {/* Blurry low-quality image placeholder */}
      {blurSrc && !isLoaded && !eager && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover filter blur-md scale-[1.05] transition-opacity duration-300 pointer-events-none"
          loading="eager"
          decoding="async"
        />
      )}

      {/* Main optimized image */}
      {optimizedSrc && (
        <img
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500 ease-in-out",
            isLoaded || eager ? "opacity-100" : "opacity-0 absolute inset-0"
          )}
          loading={loadingAttr}
          decoding="async"
          // @ts-ignore — fetchpriority is valid HTML5 but not yet in TS types
          fetchpriority={fetchPriority}
          width={naturalWidth ?? (size === "thumbnail" ? 128 : size === "card" ? 384 : size === "large" ? 800 : undefined)}
          height={naturalHeight ?? (size === "thumbnail" ? 128 : size === "card" ? 384 : size === "large" ? 800 : undefined)}
          {...props}
        />
      )}
    </div>
  );
}
