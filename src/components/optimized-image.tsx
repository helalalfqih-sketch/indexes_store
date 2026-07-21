import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  size?: "thumbnail" | "card" | "large" | "original";
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  size = "card",
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [blurSrc, setBlurSrc] = useState<string>("");
  const [optimizedSrc, setOptimizedSrc] = useState<string>("");

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

      let queryParams = "";
      if (targetSize === "thumbnail") {
        queryParams = "&w=128&q=80";
      } else if (targetSize === "card") {
        queryParams = "&w=384&q=80";
      } else if (targetSize === "large") {
        queryParams = "&w=800&q=80";
      } else if (targetSize === "blur") {
        queryParams = "&w=16&q=15"; // Tiny blur placeholder
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
  }, [src, size]);

  return (
    <div className={cn("relative overflow-hidden bg-black/5", className)}>
      {/* Blurry low-quality image placeholder */}
      {blurSrc && !isLoaded && (
        <img
          src={blurSrc}
          alt={alt}
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
          className={cn(
            "h-full w-full object-cover transition-opacity duration-500 ease-in-out",
            isLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
          )}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}
