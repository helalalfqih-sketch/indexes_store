/**
 * ProductStage — cinematic 3D showroom (React Three Fiber + drei).
 *
 * A floating elliptical platform with a copper metallic rim and a reflective
 * top (MeshReflectorMaterial), realistic teal/copper rim lighting, and the
 * product hovering + slowly rotating above it.
 *
 * Performance contract:
 * - This module is ONLY loaded via React.lazy (three.js stays out of the main
 *   bundle) and the parent renders it after the section enters the viewport.
 * - dpr capped at [1, 2], reflector resolution 512, no HDR environment maps.
 * - Presentation-only: no data fetching in here.
 */
import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { MeshReflectorMaterial, ContactShadows } from "@react-three/drei";
import { FloatingProduct } from "./FloatingProduct";

/* Copper metallic rim + reflective elliptical top */
function Platform() {
  return (
    <group position={[0, 0, 0]} scale={[1.45, 1, 1]}>
      {/* Copper rim ring */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.52, 1.58, 0.12, 64]} />
        <meshStandardMaterial color="#b87e52" metalness={0.92} roughness={0.28} />
      </mesh>
      {/* Reflective stage top */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[1.5, 64]} />
        <MeshReflectorMaterial
          blur={[220, 60]}
          resolution={512}
          mixBlur={0.9}
          mixStrength={5}
          roughness={0.55}
          depthScale={0.5}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.2}
          color="#0a1c27"
          metalness={0.55}
          mirror={0.6}
        />
      </mesh>
    </group>
  );
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      {/* Studio key light from above */}
      <spotLight position={[0, 6, 2.5]} angle={0.55} penumbra={1} intensity={60} color="#ffffff" />
      {/* Teal rim glow */}
      <pointLight position={[-3.5, 1.4, -2]} intensity={14} color="#2dd4bf" />
      {/* Copper warm accent */}
      <pointLight position={[3.5, 0.8, -1.5]} intensity={10} color="#b87e52" />
      {/* Neon price-blue front fill */}
      <pointLight position={[0, 1.2, 3.5]} intensity={5} color="#38bdf8" />
    </>
  );
}

/* Graceful degradation: any 3D/texture failure hides the canvas silently */
class StageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function ProductStage({ imageUrl }: { imageUrl: string }) {
  return (
    <StageErrorBoundary>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.35, 4.6], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", touchAction: "pan-y" }}
      >
        <Suspense fallback={null}>
          <Lighting />
          <FloatingProduct imageUrl={imageUrl} />
          <Platform />
          <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={6} blur={2.4} far={2.2} />
        </Suspense>
      </Canvas>
    </StageErrorBoundary>
  );
}
