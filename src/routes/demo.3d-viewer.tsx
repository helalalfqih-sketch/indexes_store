import { createFileRoute } from "@tanstack/react-router";
import { Product3DViewerCard } from "@/components/product-3d-viewer-card";
import { Ai3dGeneratorPanel } from "@/components/ai-3d-generator";

export const Route = createFileRoute("/demo/3d-viewer")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "3D Viewer Demo" },
      { name: "description", content: "Preview of the Astryx-powered 3D product viewer and AI generator." },
    ],
  }),
});

function DemoPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-2xl font-black">3D Viewer Demo</h1>
          <p className="text-sm text-muted-foreground">
            Standalone Astryx-styled product viewer plus the AI 2D→3D generation flow.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Product3DViewerCard
            onAddToCart={() => alert("Added to cart (demo)")}
          />
          <Ai3dGeneratorPanel
            images={[
              "https://modelviewer.dev/assets/ShopifyModels/Chair.webp",
            ]}
          />
        </section>
      </div>
    </div>
  );
}
