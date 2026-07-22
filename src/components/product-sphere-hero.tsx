import {
  createElement,
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  Component,
  type ReactNode,
  type ErrorInfo,
} from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useNavigate, Link } from "@tanstack/react-router";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { formatPrice, STORE_CONTACT } from "@/lib/store-data";
import { toast } from "sonner";
import { Play, X } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import { OptimizedImage } from "@/components/optimized-image";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const BG_TOP    = "#040818";   // deep navy top
const BG_MID    = "#06091f";   // midnight center
const BG_BOT    = "#000209";   // pure dark bottom
const ACCENT    = "#4f8cff";   // electric blue
const ACCENT2   = "#a259ff";   // violet
const LIGHT     = "#eeeeff";
const RING_CLR  = "#3a6bdb";
const RADIUS    = 2.2;         // sphere radius
const TILE      = 0.70;        // card size

// ─── Image proxy ─────────────────────────────────────────────────────────────
function proxiedTextureUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return value;
    return `/api/public/image-proxy?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return value;
  }
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
class TileErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn("[TileErrorBoundary]", error, info);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type TileData = {
  product: LegacyProductShape;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
};

type R3FProps = Record<string, unknown> & { children?: ReactNode };

function cleanR3FProps(props: R3FProps) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!k.startsWith("data-")) out[k] = v;
  }
  return out;
}
function r3f(type: string, props: R3FProps) {
  const { children, ...rest } = props;
  return createElement(type, cleanR3FProps(rest), children);
}
const RMesh               = (p: R3FProps) => r3f("mesh", p);
const RGroup              = (p: R3FProps) => r3f("group", p);
const RPlaneGeometry      = (p: R3FProps) => r3f("planeGeometry", p);
const RSphereGeometry     = (p: R3FProps) => r3f("sphereGeometry", p);
const RTorusGeometry      = (p: R3FProps) => r3f("torusGeometry", p);
const RCircleGeometry     = (p: R3FProps) => r3f("circleGeometry", p);
const RMeshBasicMaterial  = (p: R3FProps) => r3f("meshBasicMaterial", p);
const RMeshStandardMaterial = (p: R3FProps) => r3f("meshStandardMaterial", p);
const RColor              = (p: R3FProps) => r3f("color", p);
const RFog                = (p: R3FProps) => r3f("fog", p);
const RAmbientLight       = (p: R3FProps) => r3f("ambientLight", p);
const RDirectionalLight   = (p: R3FProps) => r3f("directionalLight", p);
const RPointLight         = (p: R3FProps) => r3f("pointLight", p);

// ─── Fibonacci sphere distribution ───────────────────────────────────────────
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  if (count <= 1) return [new THREE.Vector3(0, 0, radius)];
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push(
      new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius),
    );
  }
  return pts;
}

// ─── Glowing orbital ring ────────────────────────────────────────────────────
function OrbitalRing() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.08;
    meshRef.current.rotation.z += delta * 0.04;
  });
  return (
    <RMesh ref={meshRef} rotation={[Math.PI / 2.5, 0.2, 0]}>
      <RTorusGeometry args={[RADIUS + 0.55, 0.018, 16, 120]} />
      <RMeshBasicMaterial color={RING_CLR} transparent opacity={0.55} />
    </RMesh>
  );
}

// Second ring — slightly different angle & speed
function OrbitalRing2() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.06;
    meshRef.current.rotation.z -= delta * 0.03;
  });
  return (
    <RMesh ref={meshRef} rotation={[0.8, 1.2, 0.4]}>
      <RTorusGeometry args={[RADIUS + 0.9, 0.010, 12, 100]} />
      <RMeshBasicMaterial color={ACCENT2} transparent opacity={0.30} />
    </RMesh>
  );
}

// ─── Ambient floating particles (3D dots) ────────────────────────────────────
function AmbientParticles({ count = 60 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10 - 3,
        ),
      );
    }
    return arr;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      const s = 0.015 + Math.random() * 0.025;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const t = clock.elapsedTime;
    positions.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * 0.3 + i) * 0.12,
        p.y + Math.cos(t * 0.25 + i * 1.3) * 0.10,
        p.z,
      );
      const s = 0.015 + Math.abs(Math.sin(t * 0.5 + i)) * 0.018;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <RCircleGeometry args={[1, 6]} />
      <RMeshBasicMaterial color={ACCENT} transparent opacity={0.35} />
    </instancedMesh>
  );
}

// ─── Product Card Tile ────────────────────────────────────────────────────────
function ProductTile({
  data,
  onHover,
  onLeave,
  onSelect,
  isHovered,
  cardShape = "rectangle",
}: {
  data: TileData;
  onHover: (p: LegacyProductShape) => void;
  onLeave: () => void;
  onSelect: (p: LegacyProductShape) => void;
  isHovered: boolean;
  cardShape?: "rectangle" | "circle";
}) {
  const rawUrl = data.product.image;
  const hasVideo = !!data.product.videoPlaybackId;
  const targetUrl = hasVideo
    ? `https://image.mux.com/${data.product.videoPlaybackId}/thumbnail.jpg?time=2`
    : rawUrl;
  const url = proxiedTextureUrl(targetUrl);

  const texture = useLoader(THREE.TextureLoader, url, (loader) => {
    loader.setCrossOrigin("anonymous");
  });

  if (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.flipY = true;
    texture.anisotropy = 4;
  }

  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = isHovered ? 1.28 : 1.0;
    const cur = meshRef.current.scale.x;
    const next = cur + (target - cur) * Math.min(1, delta * 10);
    meshRef.current.scale.setScalar(next);

    // Glow ring around hovered tile
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity += ((isHovered ? 0.6 : 0) - mat.opacity) * Math.min(1, delta * 8);
    }
  });

  return (
    <RGroup position={data.position} quaternion={data.quaternion}>
      {/* Glow backing ring */}
      <RMesh ref={glowRef}>
        {cardShape === "circle" ? (
          <RCircleGeometry args={[(TILE * 1.18) / 2, 32]} />
        ) : (
          <RPlaneGeometry args={[TILE * 1.18, TILE * 1.18]} />
        )}
        <RMeshBasicMaterial color={ACCENT} transparent opacity={0} side={THREE.DoubleSide} />
      </RMesh>
      {/* Main card */}
      <RMesh
        ref={meshRef}
        onPointerOver={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
        onClick={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          onSelect(data.product);
        }}
      >
        {cardShape === "circle" ? (
          <RCircleGeometry args={[TILE / 2, 32]} />
        ) : (
          <RPlaneGeometry args={[TILE, TILE]} />
        )}
        <RMeshBasicMaterial
          map={texture}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </RMesh>
    </RGroup>
  );
}

// ─── Drag-to-rotate controller ────────────────────────────────────────────────
function useDragRotation(groupRef: React.RefObject<THREE.Group>) {
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (x: number, y: number) => {
      isDragging.current = true;
      lastPos.current = { x, y };
      autoRotate.current = false;
      velocity.current = { x: 0, y: 0 };
    };
    const onMove = (x: number, y: number) => {
      if (!isDragging.current || !groupRef.current) return;
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      groupRef.current.rotation.y += dx * 0.008;
      groupRef.current.rotation.x += dy * 0.008;
      velocity.current = { x: dy * 0.008, y: dx * 0.008 };
      lastPos.current = { x, y };
    };
    const onUp = () => {
      isDragging.current = false;
      // Resume auto-rotate after 2.5 s of inactivity
      setTimeout(() => { autoRotate.current = true; }, 2500);
    };

    const mouseDown = (e: MouseEvent) => onDown(e.clientX, e.clientY);
    const mouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const touchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      onDown(t.clientX, t.clientY);
    };
    const touchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    };

    el.addEventListener("mousedown", mouseDown);
    el.addEventListener("mousemove", mouseMove);
    el.addEventListener("mouseup", onUp);
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchmove", touchMove, { passive: false });
    el.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("mousedown", mouseDown);
      el.removeEventListener("mousemove", mouseMove);
      el.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove", touchMove);
      el.removeEventListener("touchend", onUp);
    };
  }, [gl, groupRef]);

  return { isDragging, autoRotate, velocity };
}

// ─── Product Sphere ───────────────────────────────────────────────────────────
function ProductSphere({
  products,
  onHoverAny,
  onSelect,
  hoveredId,
  radius = 2.2,
  tileScale = 0.8,
  cardShape = "rectangle",
}: {
  products: LegacyProductShape[];
  onHoverAny: (p: LegacyProductShape | null) => void;
  onSelect: (p: LegacyProductShape) => void;
  hoveredId: string | null;
  radius?: number;
  tileScale?: number;
  cardShape?: "rectangle" | "circle";
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { isDragging, autoRotate, velocity } = useDragRotation(
    groupRef as React.RefObject<THREE.Group>,
  );

  const rotationPausedUntil = useRef<number>(0);

  const tiles = useMemo<TileData[]>(() => {
    const positions = fibonacciSphere(products.length, radius);
    const up = new THREE.Vector3(0, 1, 0);
    return products.map((p, i) => {
      const pos = positions[i];
      const normal = pos.clone().normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      const right = new THREE.Vector3().crossVectors(up, normal).normalize();
      if (right.lengthSq() > 0.001) {
        const tileUp = new THREE.Vector3().crossVectors(normal, right).normalize();
        const m = new THREE.Matrix4().makeBasis(right, tileUp, normal);
        q.setFromRotationMatrix(m);
      }
      return { product: p, position: pos, quaternion: q };
    });
  }, [products, radius]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const isPaused = Date.now() < rotationPausedUntil.current;
    if (!isDragging.current && autoRotate.current && !isPaused) {
      // Gentle, slow auto-rotation — never dizzying
      groupRef.current.rotation.y += delta * (hoveredId ? 0.015 : 0.09);
      groupRef.current.rotation.x += delta * 0.012;
    } else if (!isDragging.current) {
      // Inertia decay
      velocity.current.x *= 0.92;
      velocity.current.y *= 0.92;
      groupRef.current.rotation.x += velocity.current.x;
      groupRef.current.rotation.y += velocity.current.y;
    }
  });

  const fallbackMat = (
    <RMeshBasicMaterial color="#1e2a4a" side={THREE.DoubleSide} />
  );

  return (
    <RGroup ref={groupRef}>
      {/* Core glow sphere */}
      <RMesh>
        <RSphereGeometry args={[RADIUS * 0.78, 40, 40]} />
        <RMeshStandardMaterial
          color={"#0a0e2a"}
          emissive={ACCENT}
          emissiveIntensity={0.12}
          metalness={0.85}
          roughness={0.25}
          transparent
          opacity={0.45}
        />
      </RMesh>

      {/* Orbital rings */}
      <OrbitalRing />
      <OrbitalRing2 />

      {/* Product tiles */}
      {tiles.map((t) => {
        const fb = (
          <RMesh key={t.product.id} position={t.position} quaternion={t.quaternion}>
            {cardShape === "circle" ? (
              <RCircleGeometry args={[TILE / 2, 32]} />
            ) : (
              <RPlaneGeometry args={[TILE, TILE]} />
            )}
            {fallbackMat}
          </RMesh>
        );
        return (
          <TileErrorBoundary key={t.product.id} fallback={fb}>
            <Suspense fallback={fb}>
              <ProductTile
                data={t}
                isHovered={hoveredId === t.product.id}
                cardShape={cardShape}
                onHover={() => {}}
                onLeave={() => {}}
                onSelect={(p) => {
                  onHoverAny(p);
                  rotationPausedUntil.current = Date.now() + 5000;
                }}
              />
            </Suspense>
          </TileErrorBoundary>
        );
      })}
    </RGroup>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({
  products,
  onHoverAny,
  onSelect,
  hoveredId,
  radius = 2.2,
  tileScale = 0.8,
  cardShape = "rectangle",
}: {
  products: LegacyProductShape[];
  onHoverAny: (p: LegacyProductShape | null) => void;
  onSelect: (p: LegacyProductShape) => void;
  hoveredId: string | null;
  radius?: number;
  tileScale?: number;
  cardShape?: "rectangle" | "circle";
}) {
  const { size, camera } = useThree();

  // Dynamically adjust camera positioning based on viewport aspect ratio
  useEffect(() => {
    const aspect = size.width / size.height;
    if (aspect < 1) {
      // Narrow portrait layout (e.g. mobile viewport simulation on desktop)
      camera.position.z = 5.8 / (aspect * 1.15);
      camera.position.y = 0.55;
    } else {
      // Normal landscape layout (e.g. desktop full screen)
      camera.position.z = 5.8;
      camera.position.y = 0.25;
    }
    camera.lookAt(0, -0.15, 0);
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]);

  return (
    <>
      <RColor attach="background" args={[BG_MID]} />
      <RFog attach="fog" args={[BG_BOT, 10, 26]} />

      {/* Soft fill */}
      <RAmbientLight intensity={1.8} />

      {/* Key light — warm top */}
      <RDirectionalLight position={[2, 4, 6]} intensity={2.8} color={"#c8d4ff"} />

      {/* Accent rim — blue left */}
      <RDirectionalLight position={[-5, 2, -3]} intensity={2.0} color={ACCENT} />

      {/* Violet back */}
      <RDirectionalLight position={[0, -4, -5]} intensity={1.4} color={ACCENT2} />

      {/* Warm point fill */}
      <RPointLight position={[3, 2, 4]} intensity={30} color={"#d0e0ff"} distance={14} decay={2} />
      <RPointLight position={[-3, -2, -3]} intensity={18} color={ACCENT2} distance={12} decay={2} />

      {createElement(
        Float,
        { speed: 0.6, rotationIntensity: 0.08, floatIntensity: 0.18 },
        <ProductSphere
          products={products}
          onHoverAny={onHoverAny}
          onSelect={onSelect}
          hoveredId={hoveredId}
          radius={radius}
          tileScale={tileScale}
          cardShape={cardShape}
        />,
      )}
    </>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────
function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-12 w-12">
          <span
            className="absolute inset-0 animate-spin rounded-full border-2"
            style={{ borderColor: `${ACCENT} transparent transparent transparent` }}
          />
          <span
            className="absolute inset-2 animate-ping rounded-full"
            style={{ background: ACCENT, opacity: 0.3 }}
          />
        </div>
        <span
          className="text-[10px] font-medium tracking-[0.35em]"
          style={{ color: "rgba(200,210,255,0.45)", fontFamily: "Tajawal, system-ui, sans-serif" }}
        >
          جاري تحميل المعرض…
        </span>
      </div>
    </div>
  );
}

// ─── 2D Starfield background (CSS-only, zero JS cost) ────────────────────────
function StarField() {
  const stars = useMemo(() => {
    const arr: { x: number; y: number; r: number; op: number; dur: number }[] = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: 0.5 + Math.random() * 1.2,
        op: 0.15 + Math.random() * 0.45,
        dur: 2 + Math.random() * 4,
      });
    }
    return arr;
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r * 2}px`,
            height: `${s.r * 2}px`,
            background: "white",
            opacity: s.op,
            animationDuration: `${s.dur}s`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function ProductSphereHero({
  products,
  badgeText = "INDEXES · LIVE SHOWCASE",
  title = "معرض المنتجات الذكي",
  subtitle = "اسحب الكرة — كل وجه منتج، اضغط لتفتحه",
  maxProducts = 28,
  radius = 2.2,
  tileScale = 0.8,
  cardShape = "rectangle",
  showName = true,
  showPrice = true,
}: {
  products: LegacyProductShape[];
  badgeText?: string;
  title?: string;
  subtitle?: string;
  maxProducts?: number;
  radius?: number;
  tileScale?: number;
  cardShape?: "rectangle" | "circle";
  showName?: boolean;
  showPrice?: boolean;
}) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<LegacyProductShape | null>(null);
  const [showHint, setShowHint] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [activeSpecsProduct, setActiveSpecsProduct] = useState<LegacyProductShape | null>(null);

  useEffect(() => {
    setMounted(true);
    // Hide the drag hint after first interaction or 4 seconds
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismissHint = useCallback(() => setShowHint(false), []);

  const pool = useMemo(
    () => products.filter((p) => !!p.image).slice(0, maxProducts),
    [products, maxProducts],
  );

  const hoveredId = hovered?.id ?? null;

  const handleSelect = useCallback(
    (p: LegacyProductShape) => navigate({ to: "/product/$slug", params: { slug: p.slug } }),
    [navigate],
  );

  return (
    <section
      dir="rtl"
      className="relative -mx-4 overflow-hidden rounded-3xl h-[52vh] min-h-[380px] sm:h-[88vh] sm:min-h-[580px]"
      style={{
        background: `radial-gradient(ellipse at 50% 30%, #0d1435 0%, #06091f 55%, ${BG_BOT} 100%)`,
      }}
      onPointerDown={dismissHint}
      onTouchStart={dismissHint}
    >
      {/* Starfield (pure CSS) */}
      <StarField />

      {/* Edge glow gradients */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 60% 40% at 20% 80%, rgba(79,140,255,0.08) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 35% at 80% 20%, rgba(162,89,255,0.07) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {/* WebGL Canvas */}
      <div className="absolute inset-0" style={{ touchAction: "pan-y" }}>
        <Suspense fallback={<Fallback />}>
          {mounted && pool.length > 0 ? (
            <Canvas
               dpr={[1, 1.5]}
              camera={{ position: [0, 0.3, 5.8], fov: 44 }}
              gl={{
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                stencil: false,
                depth: true,
              }}
            >
              <Suspense fallback={null}>
                <Scene
                  products={pool}
                  onHoverAny={setHovered}
                  onSelect={handleSelect}
                  hoveredId={hoveredId}
                  radius={radius}
                  tileScale={tileScale}
                  cardShape={cardShape}
                />
              </Suspense>
            </Canvas>
          ) : (
            <Fallback />
          )}
        </Suspense>
      </div>

      {/* Top vignette */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        style={{
          background: `linear-gradient(to bottom, ${BG_TOP}ee 0%, transparent 100%)`,
        }}
      />

      {/* Bottom vignette */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{
          background: `linear-gradient(to top, ${BG_BOT}f5 0%, transparent 100%)`,
        }}
      />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-7 text-center"
        style={{ fontFamily: "Tajawal, system-ui, sans-serif" }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            border: "1px solid rgba(79,140,255,0.35)",
            background: "rgba(79,140,255,0.10)",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: ACCENT }}
          />
          <span
            className="text-[9px] font-bold tracking-[0.35em]"
            style={{ color: "rgba(200,220,255,0.85)" }}
          >
            {badgeText}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="text-3xl font-black leading-tight sm:text-5xl"
          style={{
            color: LIGHT,
            textShadow: `0 0 40px ${ACCENT}55, 0 2px 12px rgba(0,0,0,0.8)`,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-2 text-[11px] leading-relaxed sm:text-sm"
          style={{ color: "rgba(180,200,255,0.60)" }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* ── Drag hint ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-2xl">✦</span>
              <span
                className="text-[9px] font-bold tracking-[0.4em]"
                style={{ color: "rgba(180,200,255,0.55)", fontFamily: "Tajawal, system-ui" }}
              >
                اسحب
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hovered product card ─────────────────────────────────────────── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered.id}
            initial={{ y: 24, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-4 bottom-5 z-20 mx-auto sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[380px]"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="flex flex-col gap-2 rounded-2xl p-3"
              style={{
                pointerEvents: "auto",
                background: "rgba(6,9,31,0.88)",
                border: "1px solid rgba(79,140,255,0.22)",
                backdropFilter: "blur(24px)",
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(79,140,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)`,
                fontFamily: "Tajawal, system-ui, sans-serif",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Thumbnail */}
                <div
                  className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl animate-fade-in"
                  style={{ border: "1px solid rgba(79,140,255,0.25)" }}
                >
                  <OptimizedImage
                    src={hovered.image}
                    alt={hovered.name}
                    size="thumbnail"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Info */}
                {(showName || showPrice) && (
                  <div className="min-w-0 flex-1 text-right">
                    {showName && (
                      <p
                        className="truncate text-xs font-bold leading-snug"
                        style={{ color: LIGHT }}
                      >
                        {hovered.name}
                      </p>
                    )}
                    {showPrice && (
                      <p
                        className="mt-0.5 text-[11px] font-black"
                        style={{ color: ACCENT }}
                      >
                        {formatPrice(hovered.price)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2 border-t border-white/5 pt-2">
                {/* CTA "افتح" */}
                <button
                  type="button"
                  onClick={() => setActiveSpecsProduct(hovered)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-black tracking-wider transition hover:scale-[1.02] active:scale-95 text-white cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT2} 100%)`,
                    boxShadow: `0 0 12px ${ACCENT}35`,
                  }}
                >
                  افتح المنتج 🛍️
                </button>

                {/* Category Button */}
                <button
                  type="button"
                  onClick={() => {
                    navigate({
                      to: "/category/$id",
                      params: { id: hovered.categoryId || "other" },
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-white/10 text-white border border-white/10 px-2 py-1.5 text-[10px] font-bold hover:bg-white/15 transition active:scale-95 cursor-pointer"
                >
                  <span>الفئة 📁</span>
                </button>

                {/* Video Play Button */}
                {hovered.videoPlaybackId && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(true)}
                    className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition active:scale-95 cursor-pointer"
                    title="فيديو توضيحي"
                  >
                    <Play className="h-4 w-4 fill-white text-white" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product count badge (bottom-right corner) ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="pointer-events-none absolute bottom-5 left-5 z-10 hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{
          background: "rgba(6,9,31,0.70)",
          border: "1px solid rgba(79,140,255,0.18)",
          backdropFilter: "blur(10px)",
          fontFamily: "Tajawal, system-ui, sans-serif",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: "#4ade80" }}
        />
        <span
          className="text-[9px] font-bold"
          style={{ color: "rgba(180,210,255,0.65)" }}
        >
          {pool.length} منتج
        </span>
      </motion.div>

      {/* Video Modal Overlay */}
      {showVideo && hovered && hovered.videoPlaybackId && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface/90 shadow-2xl p-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowVideo(false);
              }}
              className="absolute top-4 end-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              <MuxPlayer
                playbackId={hovered.videoPlaybackId}
                autoPlay={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <div className="p-4 text-start">
              <h4 className="text-sm font-black text-foreground">{hovered.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">فيديو توضيحي للمنتج</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Product Specs & Details Modal */}
      <AnimatePresence>
        {activeSpecsProduct && typeof document !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setActiveSpecsProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg overflow-y-auto max-h-[85vh] rounded-3xl glass-dark p-6 shadow-2xl space-y-6 text-start"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase">تفاصيل ومواصفات المنتج</span>
                  <h3 className="text-base font-black text-white mt-0.5">{activeSpecsProduct.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSpecsProduct(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Media Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                <OptimizedImage
                  src={activeSpecsProduct.image}
                  alt={activeSpecsProduct.name}
                  size="large"
                  className="h-full w-full object-contain p-2"
                />
                {activeSpecsProduct.badge && (
                  <span className="absolute end-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg">
                    {activeSpecsProduct.badge}
                  </span>
                )}
              </div>

              {/* Specifications List */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-right">
                  <span className="text-white/40 block">السعر الحالي</span>
                  <span className="text-sm font-black text-primary mt-0.5 block">{formatPrice(activeSpecsProduct.price)}</span>
                </div>
                {activeSpecsProduct.oldPrice && (
                  <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-right">
                    <span className="text-white/40 block">السعر السابق</span>
                    <span className="text-sm font-black text-white/40 line-through mt-0.5 block">{formatPrice(activeSpecsProduct.oldPrice)}</span>
                  </div>
                )}
                <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-right">
                  <span className="text-white/40 block">الفئة</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {activeSpecsProduct.categoryId === "electronics" ? "إلكترونيات" : activeSpecsProduct.categoryId === "kitchen" ? "المطبخ" : "متنوعات"}
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-right">
                  <span className="text-white/40 block">حالة التوفر</span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block">{activeSpecsProduct.stock > 0 ? `متوفر (${activeSpecsProduct.stock} قطع)` : "نفذت الكمية"}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-right">
                <h4 className="text-xs font-bold text-white/60">وصف المنتج ومميزاته:</h4>
                <p className="text-xs text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">{activeSpecsProduct.description || "لا يوجد وصف متوفر لهذا المنتج حالياً."}</p>
              </div>

              {/* Video Section */}
              <div className="space-y-2 border-t border-white/5 pt-4 text-right">
                <h4 className="text-xs font-bold text-white/60">الفيديو التوضيحي:</h4>
                {activeSpecsProduct.videoPlaybackId ? (
                  <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black/60 border border-white/5">
                    <MuxPlayer
                      playbackId={activeSpecsProduct.videoPlaybackId}
                      autoPlay={false}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-center flex flex-col items-center gap-3">
                    <span className="text-[10px] text-white/50">لا يتوفر فيديو توضيحي لهذا المنتج في الوقت الحالي</span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const { supabase } = await import("@/integrations/supabase/client");
                          if (supabase) {
                            await (supabase as any).from("product_video_requests").insert({
                              product_id: activeSpecsProduct.id,
                              product_name: activeSpecsProduct.name
                            });
                          }
                        } catch (err) {
                          console.error("Failed to request video:", err);
                        }
                        toast.success("تم إرسال طلب توفير فيديو للمنتج بنجاح إلى المدير! 👍");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white hover:bg-primary/95 transition cursor-pointer shadow-brand"
                    >
                      طلب توفير فيديو للمنتج 🎥
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 border-t border-white/10 pt-4">
                <a
                  href={`https://wa.me/${STORE_CONTACT}?text=${encodeURIComponent(`مرحباً، أريد طلب منتج: ${activeSpecsProduct.name}\nالسعر: ${formatPrice(activeSpecsProduct.price)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3.5 text-xs font-black text-white transition shadow-lg"
                >
                  اطلب الآن عبر واتساب 💬
                </a>
                <Link
                  to="/product/$slug"
                  params={{ slug: activeSpecsProduct.slug }}
                  className="inline-flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-3.5 text-xs font-bold text-white transition"
                >
                  صفحة المنتج الكاملة
                </Link>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </section>
  );
}
