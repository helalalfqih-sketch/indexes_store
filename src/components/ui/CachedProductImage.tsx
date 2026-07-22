import { useState, type ImgHTMLAttributes } from "react";

interface CachedProductImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: "square" | "video" | "4/3" | "auto";
  eager?: boolean;
  blurDataUrl?: string;
}

export function CachedProductImage({
  src,
  alt,
  aspectRatio = "square",
  eager = false,
  blurDataUrl,
  className = "",
  ...props
}: CachedProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "4/3"
      ? "aspect-[4/3]"
      : "";

  const fallbackDataUrl =
    blurDataUrl ||
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a233d'/%3E%3C/svg%3E";

  return (
    <div
      className={`relative overflow-hidden bg-showcase-border/30 ${aspectClass} ${className}`}
      style={{
        backgroundImage: !loaded ? `url("${fallbackDataUrl}")` : undefined,
        backgroundSize: "cover",
      }}
    >
      <img
        src={error ? "/placeholder.svg" : src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ fetchpriority: eager ? "high" : "auto" } as any)}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}
