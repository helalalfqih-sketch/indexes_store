import React, { useRef, useEffect, useState } from "react";
import { Product } from "./types";

interface HolographicGlobeProps {
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  size?: number;
  className?: string;
  showTitleBadge?: boolean;
}

// 3D product positions mapped on lat/lon
const PRODUCT_COORDS = [
  { lat: 0, lon: 0 },
  { lat: 35, lon: 72 },
  { lat: -35, lon: 144 },
  { lat: 25, lon: 216 },
  { lat: -25, lon: 288 },
  { lat: 55, lon: 120 },
  { lat: -55, lon: 300 },
];

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({
  products = [],
  onSelectProduct,
  size = 320,
  className = "",
  showTitleBadge = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rotYRef = useRef(0);
  const rotXRef = useRef(0.2);
  const velocityYRef = useRef(0.005); // Smooth continuous rotation
  const velocityXRef = useRef(0);
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [activeProducts, setActiveProducts] = useState<
    {
      product: Product;
      px: number;
      py: number;
      scale: number;
      opacity: number;
      isFront: boolean;
    }[]
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = size;
      const height = size;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = size * 0.36;

      // Update rotation
      if (!isDraggingRef.current) {
        rotYRef.current += velocityYRef.current;
        rotXRef.current += velocityXRef.current;
        velocityXRef.current *= 0.95; // dampening
      }

      const rotY = rotYRef.current;
      const rotX = rotXRef.current;

      // 1. Draw Core Radial Atmosphere Glow
      const bgGlow = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius * 1.35);
      bgGlow.addColorStop(0, "rgba(123, 63, 255, 0.25)");
      bgGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.15)");
      bgGlow.addColorStop(0.85, "rgba(56, 189, 248, 0.05)");
      bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Outer Sphere Rim Light
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 8;
      ctx.stroke();

      // 2. Draw Tilted Outer Orbital Ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.35);
      ctx.scale(1.35, 0.45);

      const ringGrad = ctx.createLinearGradient(-radius, 0, radius, 0);
      ringGrad.addColorStop(0, "rgba(123, 63, 255, 0.8)");
      ringGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.9)");
      ringGrad.addColorStop(1, "rgba(123, 63, 255, 0.8)");

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 2.0;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.stroke();

      const time = Date.now() * 0.0018;
      for (let p = 0; p < 4; p++) {
        const pAngle = time + (p * Math.PI) / 2;
        const px = Math.cos(pAngle) * radius;
        const py = Math.sin(pAngle) * radius;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p % 2 === 0 ? "#38bdf8" : "#a855f7";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();

      // 3D Projection Helper
      const project = (latDeg: number, lonDeg: number) => {
        const lat = (latDeg * Math.PI) / 180;
        const lon = (lonDeg * Math.PI) / 180;

        const x = radius * Math.cos(lat) * Math.sin(lon);
        const y = radius * Math.sin(lat);
        const z = radius * Math.cos(lat) * Math.cos(lon);

        const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);

        const y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        return {
          px: cx + x1,
          py: cy - y2,
          z: z2,
        };
      };

      // 3. Draw Latitude Rings
      const latitudes = [-65, -45, -25, 0, 25, 45, 65];
      const stepLon = 6;

      latitudes.forEach((lat) => {
        ctx.beginPath();
        let first = true;
        let isFrontRing = false;

        for (let lon = 0; lon <= 360; lon += stepLon) {
          const { px, py, z } = project(lat, lon);
          if (z > 0) isFrontRing = true;

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.strokeStyle = isFrontRing ? "rgba(168, 85, 247, 0.45)" : "rgba(123, 63, 255, 0.15)";
        ctx.lineWidth = isFrontRing ? 1.2 : 0.8;
        if (isFrontRing) {
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      });

      // 4. Draw Longitude Meridians
      const longitudes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
      const stepLat = 6;

      longitudes.forEach((lon) => {
        ctx.beginPath();
        let first = true;
        let isFrontMeridian = false;

        for (let lat = -90; lat <= 90; lat += stepLat) {
          const { px, py, z } = project(lat, lon);
          if (z > 0) isFrontMeridian = true;

          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }

        ctx.strokeStyle = isFrontMeridian ? "rgba(56, 189, 248, 0.65)" : "rgba(56, 189, 248, 0.15)";
        ctx.lineWidth = isFrontMeridian ? 1.4 : 0.8;
        if (isFrontMeridian) {
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      });

      // 5. Grid Node Dots
      latitudes.forEach((lat) => {
        longitudes.forEach((lon) => {
          const { px, py, z } = project(lat, lon);
          if (z > -radius * 0.1) {
            const alpha = Math.max(0, (z + radius * 0.2) / (radius * 1.2));
            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(224, 165, 255, ${alpha})`;
            ctx.shadowColor = "#00ffff";
            ctx.shadowBlur = 8;
            ctx.fill();
          }
        });
      });

      // 6. Calculate Product Positions
      const projectedProducts: {
        product: Product;
        px: number;
        py: number;
        scale: number;
        opacity: number;
        isFront: boolean;
      }[] = [];

      products.slice(0, 7).forEach((prod, idx) => {
        const coord = PRODUCT_COORDS[idx % PRODUCT_COORDS.length];
        const { px, py, z } = project(coord.lat, coord.lon);
        const scale = 0.65 + 0.35 * ((z + radius) / (2 * radius));
        const opacity = z > 0 ? Math.min(1, 0.4 + (z / radius) * 0.6) : 0.25;

        projectedProducts.push({
          product: prod,
          px,
          py,
          scale,
          opacity,
          isFront: z > 0,
        });
      });

      setActiveProducts(projectedProducts);

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [products, size]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    rotYRef.current += dx * 0.008;
    rotXRef.current += dy * 0.008;

    rotXRef.current = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotXRef.current));

    velocityYRef.current = dx * 0.002;
    velocityXRef.current = dy * 0.002;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_err) {
      // ignore pointer capture release error if not captured
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {showTitleBadge && (
        <div className="absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-[#120D22] border border-gray-800 px-3 py-1 rounded-full text-[10px] sm:text-[11.5px] font-extrabold text-white shadow-md whitespace-nowrap backdrop-blur-md">
          <span className="material-symbols-outlined text-[#7B3FFF] text-[15px]">3d_rotation</span>
          <span className="text-white">معرض المنتجات</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400">اسحب الكرة للدوران</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-grab active:cursor-grabbing touch-none z-10"
        style={{ width: size, height: size }}
      />

      {activeProducts.map(({ product, px, py, scale, opacity, isFront }) => {
        const badgeSize = Math.round(44 * scale);

        return (
          <div
            key={product.id}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectProduct && isFront) {
                onSelectProduct(product);
              }
            }}
            onMouseEnter={() => setHoveredProduct(product)}
            onMouseLeave={() => setHoveredProduct(null)}
            className={`absolute z-20 transition-transform duration-75 cursor-pointer flex flex-col items-center ${
              isFront ? "pointer-events-auto hover:scale-125" : "pointer-events-none"
            }`}
            style={{
              left: px,
              top: py,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity: opacity,
            }}
          >
            <div
              className={`rounded-2xl p-0.5 border shadow-md transition-all ${
                isFront
                  ? "bg-[#120D22] border-[#7B3FFF] shadow-purple-500/20"
                  : "bg-[#120D22]/60 border-gray-800/40"
              }`}
              style={{ width: badgeSize, height: badgeSize }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            {hoveredProduct?.id === product.id && isFront && (
              <div className="absolute top-full mt-1 bg-[#120D22] border border-[#7B3FFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none">
                {product.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
