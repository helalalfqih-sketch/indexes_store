import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/model-viewer-CBb3o8sM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PLACEHOLDER_MODELS = [
	"https://modelviewer.dev/shared-assets/models/Astronaut.glb",
	"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
	"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
	"https://modelviewer.dev/shared-assets/models/reflective-sphere.glb"
];
function modelFor(id) {
	let h = 0;
	for (const c of id) h = h * 31 + c.charCodeAt(0) >>> 0;
	return PLACEHOLDER_MODELS[h % PLACEHOLDER_MODELS.length];
}
var scriptInjected = false;
function useModelViewer() {
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined" || scriptInjected) return;
		if (document.querySelector("script[data-mv-loader]")) {
			scriptInjected = true;
			return;
		}
		const s = document.createElement("script");
		s.type = "module";
		s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
		s.setAttribute("data-mv-loader", "1");
		document.head.appendChild(s);
		scriptInjected = true;
	}, []);
}
function useMounted() {
	const [m, setM] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setM(true), []);
	return m;
}
/**
* Auto-rotating, non-interactive 3D product tile for storefront grids.
* Pointer events are disabled so the wrapping <Link> receives clicks
* and page scroll is never captured. Falls back to a 2D image poster.
*/
function Product3DTile({ modelSrc, poster, alt }) {
	const mounted = useMounted();
	useModelViewer();
	const [failed, setFailed] = (0, import_react.useState)(false);
	const [inView, setInView] = (0, import_react.useState)(false);
	const [imgLoaded, setImgLoaded] = (0, import_react.useState)(false);
	const wrapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!wrapRef.current || inView) return;
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) if (e.isIntersecting) {
				setInView(true);
				io.disconnect();
				break;
			}
		}, { rootMargin: "200px 0px" });
		io.observe(wrapRef.current);
		return () => io.disconnect();
	}, [inView]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative h-full w-full",
		children: [
			!imgLoaded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200/60 via-slate-100/40 to-slate-200/60" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: poster,
				alt,
				loading: "lazy",
				decoding: "async",
				onLoad: () => setImgLoaded(true),
				draggable: false,
				className: `h-full w-full object-contain p-2 transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`
			}),
			mounted && inView && !failed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("model-viewer", {
				src: modelSrc,
				alt,
				poster,
				"auto-rotate": "",
				"rotation-per-second": "30deg",
				"interaction-prompt": "none",
				"disable-zoom": "",
				"disable-pan": "",
				"disable-tap": "",
				loading: "lazy",
				reveal: "auto",
				exposure: "1",
				"shadow-intensity": "0",
				"environment-image": "neutral",
				onError: () => setFailed(true),
				style: {
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
					background: "transparent",
					objectFit: "contain",
					["--poster-color"]: "transparent"
				}
			})
		]
	});
}
//#endregion
export { useMounted as i, modelFor as n, useModelViewer as r, Product3DTile as t };
