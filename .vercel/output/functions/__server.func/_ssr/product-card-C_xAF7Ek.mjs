import { o as __toESM } from "../_runtime.mjs";
import { i as formatPrice } from "./store-data-CaXOvYMv.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { v as Star } from "../_libs/lucide-react.mjs";
import { a as useScroll, i as useTransform, o as motion, r as useSpring } from "../_libs/framer-motion.mjs";
import { n as modelFor, t as Product3DTile } from "./model-viewer-CBb3o8sM.mjs";
import { t as ze } from "../_libs/mux__mux-player-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product-card-C_xAF7Ek.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductCard({ product }) {
	const discount = product.oldPrice ? Math.round((product.oldPrice - product.price) / product.oldPrice * 100) : 0;
	const ref = (0, import_react.useRef)(null);
	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ["start end", "end start"]
	});
	const raw = useSpring(scrollYProgress, {
		stiffness: 120,
		damping: 24,
		mass: .25
	});
	const scale = useTransform(raw, [
		0,
		.5,
		1
	], [
		.94,
		1.04,
		.94
	]);
	const opacity = useTransform(raw, [
		0,
		.5,
		1
	], [
		.55,
		1,
		.55
	]);
	const filter = useTransform(useTransform(raw, [
		0,
		.5,
		1
	], [
		.85,
		1.08,
		.85
	]), (b) => `brightness(${b})`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		style: {
			scale,
			opacity
		},
		transition: {
			type: "spring",
			stiffness: 120,
			damping: 20
		},
		"data-product-id": product.id,
		"data-product-slug": product.slug,
		"data-product-name": product.name,
		"data-product-price": product.price,
		className: "will-change-transform",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			ref,
			to: "/product/$slug",
			params: { slug: product.slug },
			className: "group flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card transition active:scale-[0.98]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				style: { filter },
				className: "relative aspect-square overflow-hidden bg-white",
				children: [
					product.videoPlaybackId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ze, {
						playbackId: product.videoPlaybackId,
						autoPlay: "muted",
						loop: true,
						style: {
							position: "absolute",
							inset: 0,
							width: "100%",
							height: "100%",
							objectFit: "cover"
						}
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Product3DTile, {
						modelSrc: modelFor(product.id),
						poster: product.image,
						alt: product.name
					}),
					product.badge && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute end-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground",
						children: product.badge
					}),
					discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "absolute start-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground",
						children: [
							"-",
							discount,
							"%"
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col gap-1.5 p-2.5 text-slate-900",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "line-clamp-2 min-h-10 text-xs font-bold leading-tight text-slate-900",
						children: product.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1 text-[10px] text-slate-600",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3 w-3 fill-warning stroke-warning" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-slate-900",
								children: product.rating
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"(",
								product.reviews,
								")"
							] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex items-baseline gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-black text-primary",
							children: formatPrice(product.price)
						}), product.oldPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] text-slate-500 line-through",
							children: formatPrice(product.oldPrice)
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { ProductCard as t };
