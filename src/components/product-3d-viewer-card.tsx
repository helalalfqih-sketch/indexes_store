/**
 * Product3DViewerCard — standalone, Astryx-styled 3D product viewer.
 *
 * Uses the <model-viewer> web component (loaded on-demand via
 * `useModelViewer`) so it stays framework-agnostic, works with SSR,
 * and doesn't drag react-three-fiber into the bundle.
 *
 * Layout/controls are built with Astryx primitives (VStack/HStack/Button/
 * IconButton/Text) so it lives cleanly beside the existing shadcn +
 * Tailwind UI without conflicting.
 */
import { useRef, useState, type CSSProperties } from "react";
import { RotateCw, ZoomIn, ZoomOut, ShoppingCart } from "lucide-react";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { useModelViewer, useMounted } from "@/lib/model-viewer";

export const DEMO_MODEL_URL =
  "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb";
export const DEMO_POSTER_URL =
  "https://modelviewer.dev/assets/ShopifyModels/Chair.webp";

export type Product3DViewerCardProps = {
  modelSrc?: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  price?: string;
  onAddToCart?: () => void;
};

export function Product3DViewerCard({
  modelSrc = DEMO_MODEL_URL,
  poster = DEMO_POSTER_URL,
  title = "Sample Product",
  subtitle = "Interactive 3D preview",
  price = "$129.00",
  onAddToCart,
}: Product3DViewerCardProps) {
  const mounted = useMounted();
  useModelViewer();
  const mvRef = useRef<HTMLElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  const zoom = (delta: number) => {
    const el = mvRef.current as unknown as {
      getCameraOrbit?: () => { theta: number; phi: number; radius: number };
      cameraOrbit?: string;
    } | null;
    if (!el?.getCameraOrbit) return;
    const orbit = el.getCameraOrbit();
    const next = Math.max(0.5, Math.min(20, orbit.radius + delta));
    el.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${next}m`;
  };

  const mvStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    background: "transparent",
    ["--poster-color" as string]: "transparent",
  };

  return (
    <Card padding={4} maxWidth={520}>
      <VStack gap={3}>
        <VStack gap={0.5}>
          <Heading level={3}>{title}</Heading>
          <Text type="supporting">{subtitle}</Text>
        </VStack>

        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: 16,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, var(--color-surface-subdued, #f3f4f6), var(--color-surface, #fafafa))",
          }}
        >
          {mounted ? (
            <model-viewer
              ref={(node: HTMLElement | null) => {
                mvRef.current = node;
              }}
              src={modelSrc}
              poster={poster}
              alt={title}
              camera-controls=""
              touch-action="pan-y"
              {...(autoRotate ? { "auto-rotate": "" } : {})}
              rotation-per-second="30deg"
              interaction-prompt="none"
              exposure="1"
              shadow-intensity="1"
              environment-image="neutral"
              style={mvStyle}
            />
          ) : (
            <img
              src={poster}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>

        <HStack gap={2} wrap="wrap" vAlign="center">
          <Button
            label={autoRotate ? "Stop rotate" : "Rotate 360"}
            variant={autoRotate ? "primary" : "secondary"}
            size="sm"
            icon={<RotateCw size={14} />}
            onClick={() => setAutoRotate((v) => !v)}
          />
          <IconButton
            label="Zoom in"
            variant="secondary"
            size="sm"
            icon={<ZoomIn size={14} />}
            onClick={() => zoom(-0.5)}
          />
          <IconButton
            label="Zoom out"
            variant="secondary"
            size="sm"
            icon={<ZoomOut size={14} />}
            onClick={() => zoom(0.5)}
          />
        </HStack>

        <HStack gap={3} vAlign="center" justify="between" wrap="wrap">
          <Text type="large" weight="bold">{price}</Text>
          <Button
            label="Add to Cart"
            variant="primary"
            size="md"
            icon={<ShoppingCart size={16} />}
            onClick={onAddToCart}
          />
        </HStack>
      </VStack>
    </Card>
  );
}

export default Product3DViewerCard;
