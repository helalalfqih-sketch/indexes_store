/**
 * FloatingProduct — the hero product hovering above the showroom platform.
 * Textured billboard that keeps the product image's real aspect ratio,
 * floats gently and rotates slowly for the premium showroom feel.
 */
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useTexture } from "@react-three/drei";
import type { Group } from "three";

export function FloatingProduct({ imageUrl }: { imageUrl: string }) {
  const texture = useTexture(imageUrl);
  const group = useRef<Group>(null);

  // Preserve the real image aspect ratio (max edge = 2.2 world units)
  const [w, h] = useMemo(() => {
    const img = texture.image as { width?: number; height?: number } | undefined;
    const iw = img?.width ?? 1;
    const ih = img?.height ?? 1;
    const max = 2.2;
    return iw >= ih ? [max, (ih / iw) * max] : [(iw / ih) * max, max];
  }, [texture]);

  // Slow showroom rotation
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.35;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7} floatingRange={[-0.06, 0.12]}>
      <group ref={group} position={[0, 1.25, 0]}>
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} side={2} />
        </mesh>
      </group>
    </Float>
  );
}
