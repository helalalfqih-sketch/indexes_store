import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  Suspense,
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useLiteMode } from "@/lib/liteMode";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80";
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

export interface HolographicGlobeProduct {
  id: string;
  slug?: string;
  name: string;
  image: string;
  price?: number;
  priceYER?: number;
  category?: string;
}

interface HolographicGlobeProps {
  products?: HolographicGlobeProduct[];
  onSelectProduct?: {
    bivarianceHack(product: HolographicGlobeProduct): void;
  }["bivarianceHack"];
  size?: number | string;
  className?: string;
  showTitleBadge?: boolean;
  paused?: boolean;
}

// Error Boundary for WebGL fallback on unsupported or context-lost mobile devices
interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<WebGLErrorBoundaryProps, WebGLErrorBoundaryState> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL Rendering fallback triggered:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 3D Spherical Coordinates for Product Nodes
const PRODUCT_COORDS = [
  { lat: 20, lon: 10 },
  { lat: 45, lon: 85 },
  { lat: -25, lon: 155 },
  { lat: 30, lon: 220 },
  { lat: -35, lon: 295 },
  { lat: 55, lon: 130 },
  { lat: -40, lon: 40 },
];

// Dense Photorealistic CGI Particle Sphere Component
const ParticleSphere: React.FC<{ isPaused?: boolean }> = ({ isPaused = false }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Create smooth round glowing point texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.2)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Generate outer glowing particles using Fibonacci distribution for fast rendering
  const { positions, colors } = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const count = isMobile ? 1200 : 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const radius = 2.25;

    const cyan = new THREE.Color("#00f0ff");
    const magenta = new THREE.Color("#ff007f");
    const violet = new THREE.Color("#a855f7");
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;

      const jitter = (Math.random() - 0.5) * 0.12;
      const r = radius + jitter;

      const x = r * radiusAtY * Math.cos(theta);
      const yPos = r * y;
      const z = r * radiusAtY * Math.sin(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = yPos;
      pos[i * 3 + 2] = z;

      const t = (y + 1) / 2;
      if (t > 0.5) {
        tempColor.copy(cyan).lerp(magenta, (t - 0.5) * 2);
      } else {
        tempColor.copy(magenta).lerp(violet, t * 2);
      }

      col[i * 3] = tempColor.r;
      col[i * 3 + 1] = tempColor.g;
      col[i * 3 + 2] = tempColor.b;
    }

    return { positions: pos, colors: col };
  }, []);

  // Hollow Core Particle Sphere Cloud
  const corePositions = useMemo(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const count = isMobile ? 600 : 800;
    const pos = new Float32Array(count * 3);
    const phi = (1 + Math.sqrt(5)) / 2;
    const radius = 1.35;

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = (2 * Math.PI * i) / phi;

      pos[i * 3] = radius * radiusAtY * Math.cos(theta);
      pos[i * 3 + 1] = radius * y;
      pos[i * 3 + 2] = radius * radiusAtY * Math.sin(theta);
    }
    return pos;
  }, []);

  // Calm, steady rotation animation with pause on touch/hover & prefers-reduced-motion support
  useFrame((state, delta) => {
    if (isPaused || prefersReducedMotion) return;

    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.15;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= delta * 0.1;
      coreRef.current.rotation.x += delta * 0.05;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.18;
      ring1Ref.current.rotation.x += delta * 0.06;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.15;
      ring2Ref.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group>
      {/* Outer 3D CGI Particle Sphere Cloud */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Hollow Core Stardust Particle Sphere (Replaces solid sphere mesh) */}
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[corePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#38bdf8"
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Glowing Equatorial Orbital Ring 1 (Cyan Accent) */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[3.1, 0.007, 12, 80]} />
        <meshBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Glowing Equatorial Orbital Ring 2 (Magenta Accent) */}
      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, Math.PI / 5, 0]}>
        <torusGeometry args={[2.95, 0.007, 12, 80]} />
        <meshBasicMaterial
          color="#ff007f"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// 3D Glassmorphic Squircle Product Card Overlay
interface ProductNodeProps {
  product: HolographicGlobeProduct;
  lat: number;
  lon: number;
  onSelectProduct?: (product: HolographicGlobeProduct) => void;
}

const ProductNode: React.FC<ProductNodeProps> = ({ product, lat, lon, onSelectProduct }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Convert Spherical Lat/Lon to 3D Cartesian coordinates on sphere radius ~2.55
  const position = useMemo(() => {
    const radius = 2.55;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;

    const x = radius * Math.cos(latRad) * Math.sin(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.cos(lonRad);
    return [x, y, z] as [number, number, number];
  }, [lat, lon]);

  return (
    <group position={position}>
      <Html center distanceFactor={9} zIndexRange={[100, 0]} style={{ pointerEvents: "auto" }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectProduct) onSelectProduct(product);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative cursor-pointer group flex flex-col items-center select-none"
        >
          {/* Glassmorphic Squircle Container as specified */}
          <div className="w-14 h-14 bg-[#0B0D14]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all duration-300 group-hover:scale-110 active:scale-95 group-hover:border-purple-400/80 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">
            <img
              src={product.image || FALLBACK_IMAGE}
              alt={product.name}
              onError={handleImageError}
              className="w-full h-full object-contain bg-transparent transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Interactive Hover Tooltip */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                className="absolute top-full mt-2.5 z-50 bg-[#050514]/95 border border-white/20 text-white p-3 rounded-2xl shadow-2xl shadow-black/95 backdrop-blur-xl pointer-events-none whitespace-nowrap text-right min-w-[140px] flex flex-col gap-1 dir-rtl"
              >
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[160px]">
                  {product.name}
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-cyan-300 font-bold font-mono">
                    {(product.priceYER ?? product.price ?? 0).toLocaleString("ar-YE")} ر.س
                  </span>
                  <span className="text-slate-300 text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                    {product.category ?? "منتج"}
                  </span>
                </div>
                <div className="text-[9px] text-purple-300 font-medium flex items-center gap-1 justify-end pt-1 border-t border-white/10 mt-0.5">
                  <span>عرض التفاصيل</span>
                  <span className="text-[11px]">←</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Html>
    </group>
  );
};

// Sleek 2D Holographic Fallback for Devices without WebGL support
const HolographicFallback: React.FC<{
  products: HolographicGlobeProduct[];
  onSelectProduct?: (p: HolographicGlobeProduct) => void;
}> = ({ products, onSelectProduct }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 relative">
      <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full border border-cyan-400/40 bg-gradient-to-tr from-cyan-900/30 via-purple-900/30 to-fuchsia-900/30 shadow-[0_0_50px_rgba(0,240,255,0.2)] animate-pulse flex items-center justify-center relative">
        <div className="absolute inset-2 rounded-full border border-dashed border-fuchsia-400/30 animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-6 rounded-full border border-cyan-300/20" />
        <div className="text-center p-2 z-10">
          <div className="text-cyan-300 text-xs font-bold mb-1">معرض إندكس التفاعلي</div>
          <div className="text-slate-400 text-[10px]">استعرض أحدث المنتجات</div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-around p-2 pointer-events-auto">
        {products.slice(0, 4).map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectProduct?.(p)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectProduct?.(p);
              }
            }}
            aria-label={`عرض تفاصيل ${p.name}`}
            className="w-12 h-12 rounded-[1.2rem] bg-[#050514]/80 border border-white/15 p-1.5 shadow-lg backdrop-blur-md hover:scale-110 active:scale-95 transition-transform"
          >
            <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  );
};

// Smart Touch-Aware OrbitControls to allow smooth vertical page scrolling on touch devices
interface SmartOrbitControlsProps {
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  rotateSpeed?: number;
}

const SmartOrbitControls: React.FC<SmartOrbitControlsProps> = (props) => {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    // Set touchAction to pan-y so browser native vertical scroll is prioritized
    canvas.style.touchAction = "pan-y";

    let touchStartX = 0;
    let touchStartY = 0;
    let isVerticalScroll = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isVerticalScroll = false;
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && !isVerticalScroll) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

        // If swipe gesture is predominantly vertical (> deltaX and > 5px threshold),
        // disable OrbitControls touch capture so the browser scrolls the page
        if (deltaY > deltaX && deltaY > 5) {
          isVerticalScroll = true;
          if (controlsRef.current) {
            controlsRef.current.enabled = false;
          }
        }
      }
    };

    const handleTouchEnd = () => {
      isVerticalScroll = false;
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [gl]);

  return <OrbitControls ref={controlsRef} {...props} />;
};

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({
  products = [],
  onSelectProduct,
  size,
  className = "",
  showTitleBadge = true,
  paused = false,
}) => {
  const { isActive } = useLiteMode();

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => undefined);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  const dimensionStyle = size
    ? {
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
      }
    : undefined;

  if (isActive) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center rounded-[2rem] bg-[#02000A] overflow-hidden border border-white/10 ${className}`}
        style={dimensionStyle}
      >
        <HolographicFallback products={products} onSelectProduct={onSelectProduct} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none rounded-[2rem] bg-[#02000A] overflow-hidden shadow-2xl border border-white/10 ${className}`}
      style={{ ...dimensionStyle, touchAction: "pan-y" }}
    >
      {/* Deep Space Ambient Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,10,40,0.8)_0%,rgba(2,0,10,1)_100%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[radial-gradient(circle,rgba(0,240,255,0.12)_0%,rgba(255,0,127,0.08)_50%,transparent_100%)] pointer-events-none blur-xl" />

      {/* Header Title Badge */}
      {showTitleBadge && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#050514]/80 border border-white/15 px-3.5 py-1 rounded-full text-[11px] font-medium shadow-xl backdrop-blur-2xl whitespace-nowrap text-white pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-purple-300 bg-clip-text text-transparent font-bold">
            معرض إندكس 3D WebGL
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 text-[10px]">اسحب للدوران</span>
        </div>
      )}

      {/* R3F WebGL Canvas Scene with Error Boundary */}
      <div className="w-full h-full relative z-10" style={{ touchAction: "pan-y" }}>
        <WebGLErrorBoundary
          fallback={<HolographicFallback products={products} onSelectProduct={onSelectProduct} />}
        >
          <Canvas
            frameloop={paused ? "never" : "always"}
            camera={{ position: [0, 0, 7.5], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: "high-performance",
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: false,
            }}
            style={{ width: "100%", height: "100%", touchAction: "pan-y" }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.7} />
              <pointLight position={[10, 10, 10]} intensity={1.8} color="#00f0ff" />
              <pointLight position={[-10, -10, -10]} intensity={1.8} color="#ff007f" />

              {/* Deep Space Background Stars */}
              <Stars radius={60} depth={40} count={600} factor={3} saturation={0} fade speed={1} />

              {/* Atmospheric Space Dust Sparkles */}
              <Sparkles count={60} scale={10} size={2.5} speed={0.5} color="#00f0ff" />
              <Sparkles count={40} scale={12} size={2.0} speed={0.4} color="#ff007f" />

              {/* 3D CGI WebGL Particle Globe */}
              <ParticleSphere />

              {/* Product Card Overlays (Glassmorphic Squircles) */}
              {products.slice(0, 7).map((product, idx) => {
                const coord = PRODUCT_COORDS[idx % PRODUCT_COORDS.length];
                return (
                  <ProductNode
                    key={product.id}
                    product={product}
                    lat={coord.lat}
                    lon={coord.lon}
                    onSelectProduct={onSelectProduct}
                  />
                );
              })}

              {/* Smart Touch-Aware Cinematic Orbit Controls */}
              <SmartOrbitControls
                autoRotate={!paused}
                autoRotateSpeed={0.5}
                enableZoom={false}
                enablePan={false}
                rotateSpeed={0.6}
              />
            </Suspense>
          </Canvas>
        </WebGLErrorBoundary>
      </div>
    </div>
  );
};
