import { o as __toESM } from "../_runtime.mjs";
import { a as Text, c as require_jsx_runtime, i as Button, l as require_react, n as Card, o as VStack, r as IconButton, s as HStack, t as Heading } from "../_libs/@astryxdesign/core+[...].mjs";
import { G as LoaderCircle, b as ShoppingCart, ht as CircleCheck, k as RotateCw, n as ZoomOut, r as ZoomIn, y as Sparkles } from "../_libs/lucide-react.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { lt as arrayType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as useMounted, r as useModelViewer } from "./model-viewer-CBb3o8sM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-3d-generator-unfg1c5a.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
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
var DEMO_MODEL_URL = "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb";
var DEMO_POSTER_URL = "https://modelviewer.dev/assets/ShopifyModels/Chair.webp";
function Product3DViewerCard({ modelSrc = DEMO_MODEL_URL, poster = DEMO_POSTER_URL, title = "Sample Product", subtitle = "Interactive 3D preview", price = "$129.00", onAddToCart }) {
	const mounted = useMounted();
	useModelViewer();
	const mvRef = (0, import_react.useRef)(null);
	const [autoRotate, setAutoRotate] = (0, import_react.useState)(true);
	const zoom = (delta) => {
		const el = mvRef.current;
		if (!el?.getCameraOrbit) return;
		const orbit = el.getCameraOrbit();
		const next = Math.max(.5, Math.min(20, orbit.radius + delta));
		el.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${next}m`;
	};
	const mvStyle = {
		width: "100%",
		height: "100%",
		background: "transparent",
		["--poster-color"]: "transparent"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		padding: 4,
		maxWidth: 520,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VStack, {
			gap: 3,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(VStack, {
					gap: .5,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heading, {
						level: 3,
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
						type: "supporting",
						children: subtitle
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					style: {
						position: "relative",
						width: "100%",
						aspectRatio: "1 / 1",
						borderRadius: 16,
						overflow: "hidden",
						background: "linear-gradient(135deg, var(--color-surface-subdued, #f3f4f6), var(--color-surface, #fafafa))"
					},
					children: mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("model-viewer", {
						ref: (node) => {
							mvRef.current = node;
						},
						src: modelSrc,
						poster,
						alt: title,
						"camera-controls": "",
						"touch-action": "pan-y",
						...autoRotate ? { "auto-rotate": "" } : {},
						"rotation-per-second": "30deg",
						"interaction-prompt": "none",
						exposure: "1",
						"shadow-intensity": "1",
						"environment-image": "neutral",
						style: mvStyle
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: poster,
						alt: title,
						style: {
							width: "100%",
							height: "100%",
							objectFit: "cover"
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(HStack, {
					gap: 2,
					wrap: "wrap",
					vAlign: "center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							label: autoRotate ? "Stop rotate" : "Rotate 360",
							variant: autoRotate ? "primary" : "secondary",
							size: "sm",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { size: 14 }),
							onClick: () => setAutoRotate((v) => !v)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Zoom in",
							variant: "secondary",
							size: "sm",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { size: 14 }),
							onClick: () => zoom(-.5)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Zoom out",
							variant: "secondary",
							size: "sm",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, { size: 14 }),
							onClick: () => zoom(.5)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(HStack, {
					gap: 3,
					vAlign: "center",
					justify: "between",
					wrap: "wrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Text, {
						type: "large",
						weight: "bold",
						children: price
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						label: "Add to Cart",
						variant: "primary",
						size: "md",
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { size: 16 }),
						onClick: onAddToCart
					})]
				})
			]
		})
	});
}
var generate3DModel = createServerFn({ method: "POST" }).inputValidator((raw) => objectType({ images: arrayType(stringType()).min(1) }).parse(raw)).handler(createSsrRpc("7d965ea1ab81962acd97e4b9c7c1e236cbd8e82ea61b689a356ddbecc45cdb34"));
/**
* AI 2D→3D Generator panel.
*
* Frontend-only architecture for the "generate 3D model from images"
* workflow. The actual call to an external provider (Meshy / Luma /
* Tripo / …) is stubbed in `generate3DFromImage` below — swap the
* setTimeout for a real fetch when the API key is wired up.
*/
function Ai3dGeneratorPanel({ images, currentModelUrl, currentModelThumbnail, currentModelStatus = "pending", onGenerated }) {
	const [status, setStatus] = (0, import_react.useState)(currentModelStatus || (currentModelUrl ? "completed" : "pending"));
	const [modelUrl, setModelUrl] = (0, import_react.useState)(currentModelUrl);
	const [progress, setProgress] = (0, import_react.useState)(0);
	const fetch3DModel = useServerFn(generate3DModel);
	const canGenerate = images.length > 0 && status !== "processing";
	const run = async () => {
		setStatus("processing");
		onGenerated?.("", "", "processing");
		setProgress(5);
		toast.info("يقوم الذكاء الاصطناعي حالياً بتوليد المجسم ثلاثي الأبعاد. يستغرق ذلك دقيقة تقريباً...");
		const timer = setInterval(() => {
			setProgress((p) => p < 90 ? p + 5 : p);
		}, 200);
		try {
			const { modelUrl: url } = await fetch3DModel({ data: { images } });
			clearInterval(timer);
			setProgress(100);
			setModelUrl(url);
			setStatus("completed");
			toast.success("تم توليد النموذج ثلاثي الأبعاد بنجاح!");
			onGenerated?.(url, images[0] ?? "", "completed");
		} catch (err) {
			clearInterval(timer);
			setStatus("failed");
			onGenerated?.("", "", "failed");
			const msg = err instanceof Error ? err.message : "Unknown error";
			toast.error(`فشل توليد المجسم ثلاثي الأبعاد: ${msg}`);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-fuchsia-500/5 p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-black",
							children: "AI 3D Generator"
						})]
					}),
					status === "completed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3" }), " جاهز"]
					}),
					status === "processing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 animate-pulse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }), " جاري التحميل..."]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted-foreground",
				children: "حوّل صور منتجك الـ 2D المرفوعة إلى مجسم تفاعلي 3D بالذكاء الاصطناعي."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: run,
				disabled: !canGenerate,
				className: "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-brand transition disabled:cursor-not-allowed disabled:opacity-50",
				children: status === "processing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
					" جاري التوليد... (",
					progress,
					"%)"
				] }) : status === "completed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "h-4 w-4" }), " إعادة توليد المجسم 3D"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), " توليد مجسم 3D ذكي"] })
			}),
			images.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[11px] text-muted-foreground text-destructive",
				children: "يرجى رفع صورة للمنتج أولاً لتتمكن من استخدام التوليد 3D."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 overflow-hidden rounded-xl border border-border/60 bg-surface",
				children: [
					status === "processing" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "aspect-square w-full animate-pulse rounded-lg bg-gradient-to-br from-muted via-muted/60 to-muted" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all",
									style: { width: `${progress}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-center text-[11px] font-bold text-muted-foreground",
								children: [
									"تخليق الشبكة ثلاثية الأبعاد (Mesh Generation) · ",
									progress,
									"%"
								]
							})
						]
					}),
					status !== "processing" && modelUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Product3DViewerCard, {
							modelSrc: modelUrl,
							poster: images[0] ?? "",
							title: "المعاينة ثلاثية الأبعاد",
							subtitle: "يمكنك تدوير المجسم واستعراضه",
							price: ""
						})
					}),
					status === "pending" && !modelUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid aspect-square place-items-center p-6 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mx-auto h-8 w-8 text-primary/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-xs font-bold text-muted-foreground",
							children: "لم يتم توليد مجسم بعد"
						})] })
					}),
					status === "failed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid aspect-square place-items-center p-6 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold text-destructive",
							children: "فشل توليد المجسم. يرجى المحاولة مجدداً."
						}) })
					})
				]
			})
		]
	});
}
//#endregion
export { Product3DViewerCard as n, Ai3dGeneratorPanel as t };
