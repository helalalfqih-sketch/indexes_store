import {
  createElement,
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { LegacyProductShape } from "@/lib/data-adapter";
import { formatPrice } from "@/lib/store-data";
import { useWebglQuality, type WebglQuality } from "@/lib/use-webgl-quality";
import { useLoadableProducts } from "@/lib/use-loadable-products";
import { getPublishedStorefrontAppearance } from "@/lib/actions/appearance.actions";

const DARK = "#000209";
const LIGHT = "#EEEEEE";
const RADIUS = 2.1;
/** Tile height; width is 4:5 of it. */
const TILE = 0.74;
const TILE_W = TILE * 0.8;

const PALETTE = ["#7C2CFF", "#A855F7", "#2563FF", "#22D3EE"];

function proxiedTextureUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return value;
    return `/api/public/image-proxy?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return value;
  }
}

/**
 * Process-wide texture cache keyed by the final normalized URL. Textures are
 * never disposed while the app lives, so scrolling / re-rendering the hero can
 * never trigger a reload or a white flash.
 */
const textureCache = new Map<string, Promise<THREE.Texture>>();

function loadTexture(url: string): Promise<THREE.Texture> {
  const hit = textureCache.get(url);
  if (hit) return hit;
  const pending = new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.flipY = true;
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      () => reject(new Error("texture decode failed")),
    );
  });
  pending.catch(() => textureCache.delete(url));
  textureCache.set(url, pending);
  return pending;
}

type TileData = {
  product: LegacyProductShape;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  quaternion: THREE.Quaternion;
};

type R3FProps = Record<string, unknown> & { children?: ReactNode };

function cleanR3FProps(props: R3FProps) {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("data-")) continue;
    clean[key] = value;
  }
  return clean;
}

function r3f(type: string, props: R3FProps) {
  const { children, ...rest } = props;
  return createElement(type, cleanR3FProps(rest), children);
}

const RMesh = (props: R3FProps) => r3f("mesh", props);
const RGroup = (props: R3FProps) => r3f("group", props);
const RPlaneGeometry = (props: R3FProps) => r3f("planeGeometry", props);
const RSphereGeometry = (props: R3FProps) => r3f("sphereGeometry", props);
const RMeshBasicMaterial = (props: R3FProps) => r3f("meshBasicMaterial", props);
const RMeshStandardMaterial = (props: R3FProps) => r3f("meshStandardMaterial", props);
const RColor = (props: R3FProps) => r3f("color", props);
const RFog = (props: R3FProps) => r3f("fog", props);
const RAmbientLight = (props: R3FProps) => r3f("ambientLight", props);
const RDirectionalLight = (props: R3FProps) => r3f("directionalLight", props);
const RPointLight = (props: R3FProps) => r3f("pointLight", props);
const RTorusGeometry = (props: R3FProps) => r3f("torusGeometry", props);
const RPoints = (props: R3FProps) => r3f("points", props);
const RPointsMaterial = (props: R3FProps) => r3f("pointsMaterial", props);

/** Distribute N points on a sphere (Fibonacci lattice) — even coverage, no clusters. */
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  if (count <= 1) return [new THREE.Vector3(0, 0, radius)];
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius));
  }
  return pts;
}

/**
 * Placement used when only a few product images are reachable: tiles sit in
 * high-latitude bands, so while the globe spins they orbit the upper and lower
 * limb instead of crowding (and being culled behind) the centred hero copy.
 */
function polarBandRing(count: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const az = (i / count) * Math.PI * 2 + (i % 2 === 0 ? 0 : Math.PI / count);
    const el = (i % 2 === 0 ? 1 : -1) * (8 + ((i * 9) % 18)) * (Math.PI / 180);
    const y = Math.sin(el);
    const r = Math.cos(el);
    pts.push(new THREE.Vector3(Math.sin(az) * r, y, Math.cos(az) * r).multiplyScalar(radius));
  }
  return pts;
}

/**
 * Screen-space (NDC) box that product tiles must never cover. Tiles entering it
 * fade their material opacity directly inside useFrame — no React state.
 */
export type ExclusionBox = { x: number; y0: number; y1: number } | null;

function ProductTile({
  data,
  onHover,
  onLeave,
  onSelect,
  isHovered,
  exclusion,
  billboard = true,
}: {
  data: TileData;
  onHover: (p: LegacyProductShape) => void;
  onLeave: () => void;
  onSelect: (p: LegacyProductShape) => void;
  isHovered: boolean;
  exclusion?: ExclusionBox;
  billboard?: boolean;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  // A tile whose image cannot be fetched must disappear completely — a dark
  // placeholder rectangle would read as a clipped/broken product tile.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const raw = data.product.image;
    if (!raw || typeof raw !== "string" || !raw.trim()) {
      setFailed(true);
      return;
    }
    let alive = true;
    setFailed(false);
    loadTexture(proxiedTextureUrl(raw))
      .then((tex) => {
        if (alive) setTexture(tex);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [data.product.image]);

  const groupRef = useRef<THREE.Group>(null);
  const imageMat = useRef<THREE.MeshBasicMaterial>(null);
  const backMat = useRef<THREE.MeshBasicMaterial>(null);
  const rimMat = useRef<THREE.MeshBasicMaterial>(null);
  const opacity = useRef(0);

  const world = useRef(new THREE.Vector3()).current;
  const outward = useRef(new THREE.Vector3()).current;
  const camDir = useRef(new THREE.Vector3()).current;
  const parentQ = useRef(new THREE.Quaternion()).current;
  const ndc = useRef(new THREE.Vector3()).current;

  useFrame(({ camera }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (failed) {
      group.visible = false;
      return;
    }

    group.getWorldPosition(world);
    group.parent?.getWorldQuaternion(parentQ);
    outward.copy(data.normal).applyQuaternion(parentQ);
    camDir.copy(camera.position).sub(world).normalize();
    const facing = outward.dot(camDir);

    // Back-side tiles fade completely instead of rendering through the sphere.
    let target = THREE.MathUtils.clamp((facing - 0.02) / 0.28, 0, 1);

    if (target > 0) {
      ndc.copy(world).project(camera);
      // Never let a tile touch the canvas edge — a half-cut tile reads broken.
      if (Math.abs(ndc.x) > 0.78 || ndc.y > 0.66 || ndc.y < -0.52) target = 0;
      else if (
        exclusion &&
        Math.abs(ndc.x) < exclusion.x &&
        ndc.y > exclusion.y0 &&
        ndc.y < exclusion.y1
      )
        target = 0;
    }

    const next = opacity.current + (target - opacity.current) * Math.min(1, delta * 9);
    opacity.current = next;
    const shown = next > 0.02;
    group.visible = shown;
    if (!shown) return;

    if (imageMat.current) imageMat.current.opacity = next;
    if (backMat.current) backMat.current.opacity = next * 0.92;
    if (rimMat.current) rimMat.current.opacity = next * 0.55;

    // Billboard: tiles always face the camera, so they never go edge-on.
    if (billboard) group.lookAt(camera.position);
    // Depth scaling: tiles near the sphere's silhouette read smaller than the
    // ones facing the camera, which gives the orbit real perspective.
    const depth = 0.74 + 0.34 * THREE.MathUtils.clamp(facing, 0, 1);
    const s = (isHovered ? 1.16 : 1) * depth;
    group.scale.setScalar(group.scale.x + (s - group.scale.x) * Math.min(1, delta * 8));
  });

  return (
    <RGroup
      ref={groupRef}
      position={data.position}
      quaternion={billboard ? undefined : data.quaternion}
      visible={false}
      onPointerOver={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover(data.product);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
        onLeave();
      }}
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        onSelect(data.product);
      }}
    >
      {/* neon rim */}
      <RMesh position={[0, 0, -0.02]}>
        <RPlaneGeometry args={[TILE_W * 1.1, TILE * 1.08]} />
        <RMeshBasicMaterial
          ref={rimMat}
          color={"#a78bfa"}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RMesh>
      {/* dark glass backing — the placeholder while the texture decodes */}
      <RMesh position={[0, 0, -0.01]}>
        <RPlaneGeometry args={[TILE_W * 1.04, TILE * 1.03]} />
        <RMeshBasicMaterial
          ref={backMat}
          color={"#0A1020"}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </RMesh>
      {texture ? (
        <RMesh>
          <RPlaneGeometry args={[TILE_W, TILE]} />
          <RMeshBasicMaterial
            ref={imageMat}
            key={texture.uuid}
            map={texture}
            toneMapped={false}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </RMesh>
      ) : null}
    </RGroup>
  );
}

function ProductSphere({
  products,
  onHoverAny,
  onSelect,
  exclusion = null,
  showCore = true,
  billboard = true,
  spin = true,
}: {
  products: LegacyProductShape[];
  onHoverAny: (p: LegacyProductShape | null) => void;
  onSelect: (p: LegacyProductShape) => void;
  exclusion?: ExclusionBox;
  showCore?: boolean;
  billboard?: boolean;
  spin?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const tiles = useMemo<TileData[]>(() => {
    const positions =
      products.length <= 10
        ? polarBandRing(products.length, RADIUS * 1.02)
        : fibonacciSphere(products.length, RADIUS * 1.02);
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
      return { product: p, position: pos, normal, quaternion: q };
    });
  }, [products]);

  useFrame((_, delta) => {
    if (!spin || !groupRef.current) return;
    const speed = hoveredId ? 0.02 : 0.11;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <RGroup ref={groupRef}>
      {showCore ? (
        <RMesh>
          <RSphereGeometry args={[RADIUS * 0.82, 32, 32]} />
          <RMeshStandardMaterial
            color={DARK}
            emissive={"#1f5eff"}
            emissiveIntensity={0.08}
            metalness={0.6}
            roughness={0.4}
            transparent
            opacity={0.55}
          />
        </RMesh>
      ) : null}
      {tiles.map((t, i) => (
        <ProductTile
          key={`${t.product.id}-${i}`}
          data={t}
          exclusion={exclusion}
          billboard={billboard}
          isHovered={hoveredId === t.product.id}
          onHover={(p) => {
            setHoveredId(p.id);
            onHoverAny(p);
          }}
          onLeave={() => {
            setHoveredId(null);
            onHoverAny(null);
          }}
          onSelect={onSelect}
        />
      ))}
    </RGroup>
  );
}

function Scene({
  products,
  onHoverAny,
  onSelect,
}: {
  products: LegacyProductShape[];
  onHoverAny: (p: LegacyProductShape | null) => void;
  onSelect: (p: LegacyProductShape) => void;
}) {
  return (
    <>
      <RColor attach="background" args={[DARK]} />
      <RFog attach="fog" args={[DARK, 9, 22]} />
      <RAmbientLight intensity={3} />
      <RDirectionalLight position={[0, 1.5, 6]} intensity={3.4} color={LIGHT} />
      <RDirectionalLight position={[5, 6, 5]} intensity={2.6} color={LIGHT} />
      <RDirectionalLight position={[-6, -3, -4]} intensity={1.8} color={"#9cc2ff"} />
      <RPointLight position={[4, 3, 4]} intensity={44} color={LIGHT} distance={16} decay={2} />
      <RPointLight
        position={[-4, -2, -3]}
        intensity={28}
        color={"#66a6ff"}
        distance={14}
        decay={2}
      />
      {createElement(
        Float,
        { speed: 1, rotationIntensity: 0.2, floatIntensity: 0.4 },
        <ProductSphere products={products} onHoverAny={onHoverAny} onSelect={onSelect} />,
      )}
      {createElement(Environment, { preset: "night" })}
    </>
  );
}

function Fallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-white/40">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
        LOADING SHOWCASE
      </div>
    </div>
  );
}

import { ProductCard } from "@/components/product-card";

export function ProductSphereHero({ products }: { products: LegacyProductShape[] }) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const quality = useWebglQuality();
  useEffect(() => setMounted(true), []);
  const [hovered, setHovered] = useState<LegacyProductShape | null>(null);

  const pool = useMemo(() => products.filter((p) => !!p.image).slice(0, 24), [products]);

  if (!mounted || !quality.supported) {
    return (
      <section
        dir="rtl"
        data-testid="hero-sphere-fallback"
        className="relative -mx-4 min-h-[420px] rounded-3xl p-6"
        style={{ background: DARK }}
      >
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-black text-white">كوكب المنتجات</h1>
          <p className="mt-1 text-xs text-white/60">تسوّق أشهر منتجاتنا الآن</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      dir="rtl"
      className="relative -mx-4 h-[85vh] min-h-[560px] overflow-hidden rounded-3xl"
      style={{ background: DARK }}
    >
      <div className="absolute inset-0">
        <Suspense fallback={<Fallback />}>
          {mounted && pool.length > 0 ? (
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0.2, 5.6], fov: 45 }}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            >
              <Suspense fallback={null}>
                <Scene
                  products={pool}
                  onHoverAny={setHovered}
                  onSelect={(p) => navigate({ to: "/product/$slug", params: { slug: p.slug } })}
                />
              </Suspense>
            </Canvas>
          ) : (
            <Fallback />
          )}
        </Suspense>
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,2,9,0.85) 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-8 text-center"
        style={{ fontFamily: "Tajawal, system-ui, sans-serif" }}
      >
        <span
          className="mb-3 inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.3em]"
          style={{ color: LIGHT, borderColor: "rgba(238,238,238,0.25)" }}
        >
          INDEXES · SHOWCASE
        </span>
        <h1 className="text-2xl font-black leading-tight sm:text-4xl" style={{ color: LIGHT }}>
          كوكب المنتجات
        </h1>
        <p
          className="mt-2 max-w-xs text-[11px] leading-relaxed sm:text-sm"
          style={{ color: "rgba(238,238,238,0.65)" }}
        >
          مرّر واستكشف — كل وجه منتج، اضغط لتفتحه.
        </p>
      </div>

      <motion.div
        initial={false}
        animate={{ y: hovered ? 0 : 30, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl border px-4 py-3"
        style={{
          borderColor: "rgba(238,238,238,0.12)",
          background: "rgba(0,2,9,0.72)",
          backdropFilter: "blur(20px)",
          color: LIGHT,
          fontFamily: "Tajawal, system-ui, sans-serif",
        }}
      >
        {hovered && (
          <>
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-xs font-bold">{hovered.name}</p>
              <p className="text-[11px] font-black" style={{ color: "rgba(238,238,238,0.7)" }}>
                {formatPrice(hovered.price)}
              </p>
            </div>
            <span
              className="text-[10px] tracking-[0.3em]"
              style={{ color: "rgba(238,238,238,0.6)" }}
            >
              اضغط للفتح
            </span>
          </>
        )}
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Storefront globe. Exactly one Canvas / one ProductSphere is
 * mounted for the whole scroll transition — never remounted, so
 * textures never reload and the material never switches.
 * ───────────────────────────────────────────────────────────── */

/** Layer 2 — world/data point layer. */
function GlobePoints({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const pts = fibonacciSphere(count, RADIUS * 0.995);
    const position = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const colors = PALETTE.map((c) => new THREE.Color(c));
    for (let i = 0; i < count; i++) {
      const p = pts[i];
      position[i * 3] = p.x;
      position[i * 3 + 1] = p.y;
      position[i * 3 + 2] = p.z;
      const c = colors[i % colors.length];
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("color", new THREE.BufferAttribute(color, 3));
    return g;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <RPoints geometry={geometry}>
      <RPointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </RPoints>
  );
}

function GlobeShell({ quality }: { quality: WebglQuality }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  // Same five layers in every tier — only the tessellation budget changes.
  const seg = Math.round(quality.segments / 6);
  const hSeg = Math.round(seg * 0.66);

  return (
    <RGroup ref={ref}>
      {/* Layer 1 — solid dark planet body */}
      <RMesh>
        <RSphereGeometry args={[RADIUS * 0.985, seg, hSeg]} />
        <RMeshStandardMaterial
          color={"#070C22"}
          roughness={0.9}
          metalness={0.1}
          emissive={"#170C42"}
          emissiveIntensity={0.7}
        />
      </RMesh>
      {/* Layer 2 — dotted world-map data layer */}
      <GlobePoints count={quality.points} />
      {/* Layer 3 — subtle wireframe */}
      <RMesh>
        <RSphereGeometry args={[RADIUS, seg, hSeg]} />
        <RMeshBasicMaterial
          color={"#7C3AED"}
          wireframe
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </RMesh>

      {/* Layer 4 — atmosphere (back-side rim halo, never a surface fill) */}
      <RMesh>
        <RSphereGeometry args={[RADIUS * 1.1, seg, hSeg]} />
        <RMeshBasicMaterial
          color={"#6D28D9"}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RMesh>
      {/* Layer 5 — cyan rim */}
      <RMesh>
        <RSphereGeometry args={[RADIUS * 1.19, seg, hSeg]} />
        <RMeshBasicMaterial
          color={"#22D3EE"}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </RMesh>
    </RGroup>
  );
}

/** Exactly three additive orbit rings: purple, blue, cyan. */
function OrbitTrails({ segments }: { segments: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.14;
    ref.current.rotation.z += delta * 0.04;
  });
  const rings = [
    { r: RADIUS * 1.1, rot: [1.2, 0, 0.35] as const, color: "#A855F7", opacity: 0.42 },
    { r: RADIUS * 1.2, rot: [1.5, 0.5, -0.25] as const, color: "#2563FF", opacity: 0.34 },
    { r: RADIUS * 1.3, rot: [1.05, -0.4, 0.7] as const, color: "#22D3EE", opacity: 0.3 },
  ];

  return (
    <RGroup ref={ref}>
      {rings.map((ring, i) => (
        <RMesh key={i} rotation={ring.rot}>
          <RTorusGeometry args={[ring.r, 0.009, 6, segments]} />
          <RMeshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </RMesh>
      ))}
    </RGroup>
  );
}

export function ProductGlobeCanvas({
  products,
  paused = false,
  exclusion = null,
}: {
  products: LegacyProductShape[];
  paused?: boolean;
  exclusion?: ExclusionBox;
}) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const quality = useWebglQuality();
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const { data: settings } = useQuery({
    queryKey: ["storefront-settings"],
    queryFn: () => getPublishedStorefrontAppearance(),
    staleTime: 60 * 1000,
  });

  const requestedMax = settings?.hero?.sphereMaxProducts ?? 50;

  // Oversampled pool → only images proven to decode become tiles
  const { items: loadable } = useLoadableProducts(products, requestedMax);

  // Unique products pool — no artificial duplication
  const pool = useMemo(() => {
    const list = loadable.length > 0 ? loadable : products;
    return list.slice(0, requestedMax);
  }, [loadable, products, requestedMax]);

  // The globe shell (core, wireframe, atmosphere, orbits) renders as soon as
  // WebGL is available — it never waits for products or textures.
  if (!mounted || !quality.supported) {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-[86%] w-[86%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(124,58,237,0.55),rgba(5,3,15,0.9)_70%)] shadow-[0_0_80px_-10px_var(--neon)]">
          {pool.slice(0, 8).map((p, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <img
                key={`${p.id}-${i}`}
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="absolute h-10 w-10 rounded-lg border border-ink-line bg-ink-card/80 object-contain p-1"
                style={{
                  left: `${50 + Math.cos(a) * 36 - 6}%`,
                  top: `${50 + Math.sin(a) * 36 - 6}%`,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={quality.dpr}
        frameloop={paused || hidden ? "never" : "always"}
        camera={{ position: [0, 0, 5.81], fov: 45 }}
        gl={{ antialias: quality.tier !== "low", alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <RAmbientLight intensity={1.35} />
          <RDirectionalLight position={[0, 1.5, 6]} intensity={1.6} color={LIGHT} />
          {/* rim lighting: purple one side, cyan the other, blue behind */}
          <RPointLight
            position={[4.2, 2.4, 2.2]}
            intensity={68}
            color={"#A855F7"}
            distance={18}
            decay={2}
          />
          <RPointLight
            position={[-4.2, -1.8, 2.4]}
            intensity={60}
            color={"#22D3EE"}
            distance={18}
            decay={2}
          />
          <RPointLight
            position={[0, 0, -5]}
            intensity={46}
            color={"#2563FF"}
            distance={16}
            decay={2}
          />
          <GlobeShell quality={quality} />
          <OrbitTrails segments={quality.segments} />
          <ProductSphere
            products={pool}
            showCore={false}
            exclusion={exclusion}
            spin={!quality.reduced}
            onHoverAny={() => {}}
            onSelect={(p) => navigate({ to: "/product/$slug", params: { slug: p.slug } })}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
