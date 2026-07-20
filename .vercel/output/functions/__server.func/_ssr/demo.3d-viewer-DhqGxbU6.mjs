import { c as require_jsx_runtime } from "../_libs/@astryxdesign/core+[...].mjs";
import { n as Product3DViewerCard, t as Ai3dGeneratorPanel } from "./ai-3d-generator-unfg1c5a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/demo.3d-viewer-DhqGxbU6.js
var import_jsx_runtime = require_jsx_runtime();
function DemoPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-background px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-5xl space-y-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-black",
				children: "3D Viewer Demo"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Standalone Astryx-styled product viewer plus the AI 2D→3D generation flow."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid gap-6 md:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Product3DViewerCard, { onAddToCart: () => alert("Added to cart (demo)") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ai3dGeneratorPanel, { images: ["https://modelviewer.dev/assets/ShopifyModels/Chair.webp"] })]
			})]
		})
	});
}
//#endregion
export { DemoPage as component };
