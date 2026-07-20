import { useEffect, useRef, useState, type CSSProperties } from "react";

// Public placeholder GLB models — deterministically assigned per product id.
export const PLACEHOLDER_MODELS = [
  "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
  "https://modelviewer.dev/shared-assets/models/reflective-sphere.glb",
];

export function modelFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PLACEHOLDER_MODELS[h % PLACEHOLDER_MODELS.length];
}

// React 19 type shim for the <model-viewer> web component.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & Record<string, unknown>,
        HTMLElement
      >;
    }
  }
}

let scriptInjected = false;
export function useModelViewer() {
  useEffect(() => {
    if (typeof document === "undefined" || scriptInjected) return;
    if (document.querySelector("script[data-mv-loader]")) {
      scriptInjected = true;
      return;
    }
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
    s.setAttribute("data-mv-loader", "1");
    document.head.appendChild(s);
    scriptInjected = true;
  }, []);
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/**
 * Auto-rotating, non-interactive 3D product tile for storefront grids.
 * Pointer events are disabled so the wrapping <Link> receives clicks
 * and page scroll is never captured. Falls back to a 2D image poster.
 */
export function Product3DTile({
  modelSrc,
  poster,
  alt,
}: {
  modelSrc: string;
  poster: string;
  alt: string;
}) {
  const mounted = useMounted();
  useModelViewer();
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver — only mount heavy 3D once tile enters viewport
  useEffect(() => {
    if (!wrapRef.current || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(wrapRef.current);
    return () => io.disconnect();
  }, [inView]);

  const showModel = mounted && inView && !failed;

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {/* Skeleton shimmer */}
      {!imgLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/60 via-slate-100/40 to-slate-200/60" />
      )}
      {/* Poster image — always renders as base layer, lazy */}
      <img
        src={poster}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setImgLoaded(true)}
        draggable={false}
        className={`h-full w-full object-contain p-2 transition-opacity duration-500 ${
          imgLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {showModel && (
        <model-viewer
          src={modelSrc}
          alt={alt}
          poster={poster}
          auto-rotate=""
          rotation-per-second="30deg"
          interaction-prompt="none"
          disable-zoom=""
          disable-pan=""
          disable-tap=""
          loading="lazy"
          reveal="auto"
          exposure="1"
          shadow-intensity="0"
          environment-image="neutral"
          onError={() => setFailed(true)}
          style={
            {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              background: "transparent",
              objectFit: "contain",
              ["--poster-color" as string]: "transparent",
            } as CSSProperties
          }
        />
      )}
    </div>
  );
}
