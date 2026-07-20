import { Suspense, useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import * as THREE from "three";

const DARK = "#000209";
const LIGHT = "#EEEEEE";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function Crystal({ rotate, rise }: { rotate: number; rise: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.15;
    // scroll-driven overlay
    ref.current.rotation.x = rotate * Math.PI * 1.2;
    ref.current.rotation.z = rotate * Math.PI * 0.6;
    ref.current.position.y = rise;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[1.15, 1]} />
        <MeshDistortMaterial
          color={LIGHT}
          emissive={LIGHT}
          emissiveIntensity={0.15}
          metalness={0.85}
          roughness={0.15}
          distort={0.28}
          speed={1.6}
          flatShading
        />
      </mesh>
    </Float>
  );
}

function WaveGrid() {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(20, 20, 60, 60), []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = Math.sin(x * 0.6 + t * 1.2) * 0.15 + Math.cos(y * 0.5 + t) * 0.15;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  });
  return (
    <mesh
      ref={ref}
      geometry={geo}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.2, 0]}
    >
      <meshStandardMaterial
        color={LIGHT}
        emissive={LIGHT}
        emissiveIntensity={0.04}
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

function Scene({ progress }: { progress: ReturnType<typeof useSpring> }) {
  const [rotate, setRotate] = useState(0);
  const [rise, setRise] = useState(0);
  useEffect(() => {
    const unsub = progress.on("change", (v) => {
      setRotate(v);
      setRise(v * 1.6);
    });
    return () => unsub();
  }, [progress]);

  return (
    <>
      <color attach="background" args={[DARK]} />
      <fog attach="fog" args={[DARK, 6, 16]} />
      <ambientLight intensity={0.25} color={LIGHT} />
      <pointLight position={[2.5, 2, 3]} intensity={40} color={LIGHT} distance={12} decay={2} />
      <pointLight position={[-3, -1, -2]} intensity={18} color={LIGHT} distance={10} decay={2} />
      <Crystal rotate={rotate} rise={rise} />
      <WaveGrid />
      <Environment preset="night" />
    </>
  );
}

function CanvasFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-widest text-white/40">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" />
        LOADING EXPERIENCE
      </div>
    </div>
  );
}

export function WebGLHero() {
  const mounted = useMounted();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20, mass: 0.3 });
  const textY = useTransform(smooth, [0, 1], [0, -80]);
  const textOpacity = useTransform(smooth, [0, 0.7], [1, 0]);

  return (
    <section
      ref={containerRef}
      dir="rtl"
      className="relative -mx-4 h-[92vh] overflow-hidden rounded-3xl"
      style={{ background: DARK }}
    >
      {/* WebGL canvas */}
      <div className="absolute inset-0">
        <Suspense fallback={<CanvasFallback />}>
          {mounted ? (
            <Canvas
              dpr={[1, 1.75]}
              camera={{ position: [0, 0.4, 5], fov: 45 }}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            >
              <Suspense fallback={null}>
                <Scene progress={smooth} />
              </Suspense>
            </Canvas>
          ) : (
            <CanvasFallback />
          )}
        </Suspense>
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(0,2,9,0.85) 100%)",
        }}
      />

      {/* Text overlay */}
      <motion.div
        style={{ y: textY, opacity: textOpacity, fontFamily: "Tajawal, system-ui, sans-serif" }}
        className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <span
          className="mb-4 inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.3em]"
          style={{ color: LIGHT, borderColor: "rgba(238,238,238,0.25)" }}
        >
          INDEXES · STORE
        </span>
        <h1
          className="text-3xl font-black leading-[1.15] sm:text-5xl"
          style={{ color: LIGHT }}
        >
          مرحباً بك في
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(120deg, ${LIGHT} 0%, rgba(238,238,238,0.4) 100%)`,
            }}
          >
            مستقبل التسوّق
          </span>
        </h1>
        <p
          className="mt-4 max-w-xs text-xs leading-relaxed sm:text-sm"
          style={{ color: "rgba(238,238,238,0.65)" }}
        >
          اندكس ستور — تجربة تسوّق سينمائية، تفاعلية، ومصمّمة بعناية لعشّاق التميّز.
        </p>
        <div className="mt-6 flex items-center gap-2 text-[10px] tracking-[0.4em]" style={{ color: "rgba(238,238,238,0.5)" }}>
          <span className="h-px w-8" style={{ background: "rgba(238,238,238,0.5)" }} />
          SCROLL
          <span className="h-px w-8" style={{ background: "rgba(238,238,238,0.5)" }} />
        </div>
      </motion.div>
    </section>
  );
}
