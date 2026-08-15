import React, { useMemo, useRef, useState, useEffect, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from './types';
import { useLiteMode } from '@/lib/liteMode';

const FALLBACK_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%23181825"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">&#1604;&#1575; &#1578;&#1578;&#1608;&#1601;&#1585; &#1589;&#1608;&#1585;&#1577;</text></svg>';
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.src = FALLBACK_IMAGE;
};

export interface HolographicGlobeProps {
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  size?: number | string;
  className?: string;
  showTitleBadge?: boolean;
  maxProducts?: number;
  radius?: number;
  rotationSpeed?: number;
  cardShape?: 'rectangle' | 'circle';
  showName?: boolean;
  showPrice?: boolean;
  showParticles?: boolean;
  overlayBadge?: string;
  overlayTitle?: string;
  overlaySubtitle?: string;
  overlayTitleFontSize?: number;
  overlaySubtitleFontSize?: number;
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
    console.warn('WebGL Rendering fallback triggered:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 3D Spherical Coordinates for up to 50 Product Nodes via Fibonacci Sphere
const generateFibonacciCoords = (count: number) => {
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  const coords: { lat: number; lon: number }[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = ((2 * Math.PI * i) / phi) * (180 / Math.PI);
    coords.push({ lat, lon });
  }
  return coords;
};

const PRODUCT_COORDS_50 = generateFibonacciCoords(50);

// Holographic CGI Particle Globe Mesh Component
const ParticleSphere: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Points>(null);

  // Generate 850 surface particles for dense, glowing holographic grid
  const [positions, colors] = useMemo(() => {
    const count = 850;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const color1 = new THREE.Color('#00f0ff');
    const color2 = new THREE.Color('#a855f7');
    const color3 = new THREE.Color('#ff007f');

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.85 + (Math.random() - 0.5) * 0.08;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      let mixedColor = color1.clone();
      if (y > 0.5) {
        mixedColor.lerp(color2, Math.min(1, y / 2.5));
      } else if (y < -0.5) {
        mixedColor.lerp(color3, Math.min(1, Math.abs(y) / 2.5));
      }

      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }

    return [pos, col];
  }, []);

  // Generate 320 internal stardust particles
  const corePositions = useMemo(() => {
    const count = 320;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 2.3;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  return (
    <group>
      {/* Outer Holographic Surface Lattice Points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Hollow Core Stardust Particle Sphere */}
      <points ref={coreRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[corePositions, 3]}
          />
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
  product: Product;
  lat: number;
  lon: number;
  radius?: number;
  cardShape?: 'rectangle' | 'circle';
  showName?: boolean;
  showPrice?: boolean;
  onSelectProduct?: (product: Product) => void;
}

const ProductNode: React.FC<ProductNodeProps> = ({
  product,
  lat,
  lon,
  radius = 1.8,
  cardShape = 'circle',
  showName = true,
  showPrice = true,
  onSelectProduct,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Convert Spherical Lat/Lon to 3D Cartesian coordinates on sphere radius
  const position = useMemo(() => {
    const r = radius > 0 ? radius : 1.8;
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;

    const x = r * Math.cos(latRad) * Math.sin(lonRad);
    const y = r * Math.sin(latRad);
    const z = r * Math.cos(latRad) * Math.cos(lonRad);
    return [x, y, z] as [number, number, number];
  }, [lat, lon, radius]);

  const isCircle = cardShape === 'circle';

  return (
    <group position={position}>
      <Html
        center
        distanceFactor={8}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectProduct) onSelectProduct(product);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative cursor-pointer group flex flex-col items-center select-none transition-transform duration-300 hover:scale-115"
        >
          {/* Card Shape (دائري ناعم وجميل أو مستطيل حسب الإعداد) */}
          <div className={`w-11 h-11 sm:w-13 sm:h-13 bg-[#09071a]/85 backdrop-blur-xl border border-cyan-400/50 ${isCircle ? 'rounded-full' : 'rounded-2xl'} p-1 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300 group-hover:border-purple-400 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]`}>
            <img
              src={product.image || FALLBACK_IMAGE}
              alt={product.name}
              onError={handleImageError}
              className={`w-full h-full object-contain ${isCircle ? 'rounded-full' : 'rounded-xl'} bg-transparent transition-transform duration-300 group-hover:scale-110`}
            />
          </div>

          {/* Name & Price Badge */}
          {(showName || showPrice) && (
            <div className="mt-1 flex flex-col items-center pointer-events-none">
              {showName && (
                <span className="px-1.5 py-0.5 rounded-md bg-black/80 border border-white/15 text-[8px] sm:text-[9px] font-bold text-white max-w-[85px] truncate text-center leading-tight shadow-md">
                  {product.name}
                </span>
              )}
              {showPrice && (
                <span className="text-[7.5px] sm:text-[8.5px] font-black text-cyan-300 font-mono mt-0.5 drop-shadow">
                  {product.priceYER.toLocaleString('ar-YE')} ر.ي
                </span>
              )}
            </div>
          )}

          {/* Interactive Hover Tooltip */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                className="absolute top-full mt-1 z-50 bg-[#050514]/95 border border-white/20 text-white p-3 rounded-2xl shadow-2xl shadow-black/95 backdrop-blur-xl pointer-events-none whitespace-nowrap text-right min-w-[140px] flex flex-col gap-1 dir-rtl"
              >
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[160px]">
                  {product.name}
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-cyan-300 font-bold font-mono">
                    {product.priceYER.toLocaleString('ar-YE')} ر.ي
                  </span>
                  <span className="text-slate-300 text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                    {product.category}
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
  products: Product[];
  onSelectProduct?: (p: Product) => void;
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
            aria-label={`عرض تفاصيل ${p.name}`}
            onClick={() => onSelectProduct?.(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProduct?.(p);
              }
            }}
            className="w-12 h-12 rounded-[1.2rem] bg-[#050514]/80 border border-white/15 p-1.5 shadow-lg backdrop-blur-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
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
  const controlsRef = useRef<any>(null);
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    // Set touchAction to pan-y so browser native vertical scroll is prioritized
    canvas.style.touchAction = 'pan-y';

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

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gl]);

  return <OrbitControls ref={controlsRef} {...props} />;
};

export const HolographicGlobe: React.FC<HolographicGlobeProps> = ({
  products = [],
  onSelectProduct,
  size,
  className = '',
  showTitleBadge = true,
  maxProducts = 50,
  radius = 1.8,
  rotationSpeed = 0.5,
  cardShape = 'circle',
  showName = true,
  showPrice = true,
  showParticles = true,
  overlayBadge = 'INDEXES · LIVE SHOWCASE',
  overlayTitle = 'آلاف المنتجات',
  overlaySubtitle = 'اسحب الكرة — كل وجه منتج، اضغط لتفتحه',
  overlayTitleFontSize = 28,
  overlaySubtitleFontSize = 12,
}) => {
  const { isActive } = useLiteMode();

  const dimensionStyle = size
    ? {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }
    : undefined;

  const displayProducts = useMemo(() => {
    const limit = maxProducts > 0 ? maxProducts : 50;
    return products.slice(0, limit);
  }, [products, maxProducts]);

  useEffect(() => {
    const animId = requestAnimationFrame(() => {});
    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  if (isActive) {
    return (
      <div className={`relative flex flex-col items-center justify-center rounded-[2rem] bg-[#02000A] overflow-hidden border border-white/10 ${className}`} style={dimensionStyle}>
        <HolographicFallback products={displayProducts} onSelectProduct={onSelectProduct} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none rounded-[2rem] bg-[#02000A] overflow-hidden shadow-2xl border border-white/10 ${className}`}
      style={{ ...dimensionStyle, touchAction: 'pan-y' }}
    >
      {/* Deep Space Ambient Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,10,40,0.8)_0%,rgba(2,0,10,1)_100%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[radial-gradient(circle,rgba(0,240,255,0.12)_0%,rgba(255,0,127,0.08)_50%,transparent_100%)] pointer-events-none blur-xl" />

      {/* Header Title Badge & Overlay Typography */}
      {showTitleBadge && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-center pointer-events-none px-4 w-full">
          <div className="inline-flex items-center gap-1.5 bg-[#050514]/85 border border-cyan-400/30 px-3 py-0.5 rounded-full text-[10px] font-black shadow-xl backdrop-blur-2xl text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{overlayBadge}</span>
          </div>
          <h3
            style={{ fontSize: `${overlayTitleFontSize}px` }}
            className="font-black text-white leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
          >
            {overlayTitle}
          </h3>
          <p
            style={{ fontSize: `${overlaySubtitleFontSize}px` }}
            className="text-gray-300 font-medium"
          >
            {overlaySubtitle}
          </p>
        </div>
      )}

      {/* R3F WebGL Canvas Scene with Error Boundary */}
      <div className="w-full h-full relative z-10" style={{ touchAction: 'pan-y' }}>
        <WebGLErrorBoundary
          fallback={<HolographicFallback products={displayProducts} onSelectProduct={onSelectProduct} />}
        >
          <Canvas
            camera={{ position: [0, 0, 7.5], fov: 45 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: false,
              alpha: true,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: false,
            }}
            style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.7} />
              <pointLight position={[10, 10, 10]} intensity={1.8} color="#00f0ff" />
              <pointLight position={[-10, -10, -10]} intensity={1.8} color="#ff007f" />

              {/* Deep Space Background Stars */}
              <Stars radius={60} depth={40} count={600} factor={3} saturation={0} fade speed={1} />

              {/* Atmospheric Space Dust Sparkles (تأثير الجسيمات الخلفية مفعّل) */}
              {showParticles && (
                <>
                  <Sparkles count={60} scale={10} size={2.5} speed={0.5} color="#00f0ff" />
                  <Sparkles count={40} scale={12} size={2.0} speed={0.4} color="#ff007f" />
                </>
              )}

              {/* 3D CGI WebGL Particle Globe */}
              <ParticleSphere />

              {/* Product Card Overlays (Up to 50 Circular Nodes) */}
              {displayProducts.map((product, idx) => {
                const coord = PRODUCT_COORDS_50[idx % PRODUCT_COORDS_50.length];
                return (
                  <ProductNode
                    key={product.id}
                    product={product}
                    lat={coord.lat}
                    lon={coord.lon}
                    radius={radius}
                    cardShape={cardShape}
                    showName={showName}
                    showPrice={showPrice}
                    onSelectProduct={onSelectProduct}
                  />
                );
              })}

              {/* Smart Touch-Aware Cinematic Orbit Controls */}
              <SmartOrbitControls
                autoRotate
                autoRotateSpeed={rotationSpeed}
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
