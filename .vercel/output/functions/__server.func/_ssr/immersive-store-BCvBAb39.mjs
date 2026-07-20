import { o as __toESM } from "../_runtime.mjs";
import { a as products, i as formatPrice } from "./store-data-CaXOvYMv.mjs";
import { n as quickOrderLink } from "./whatsapp-C4cq1s8L.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { $ as House, B as MessageCircle, a as X, k as RotateCw, wt as ArrowRight, y as Sparkles } from "../_libs/lucide-react.mjs";
import { o as motion, s as AnimatePresence } from "../_libs/framer-motion.mjs";
import { t as useCart } from "./cart-store-CNi_4HlM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/immersive-store-BCvBAb39.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var indexes_store_bg_jpg_asset_default = {
	version: 1,
	asset_id: "8cb5a83a-9ca2-4abf-965b-0828c6fb64d8",
	project_id: "80f7d5cf-5026-49dd-8137-91bdaa674a1a",
	url: "/__l5e/assets-v1/8cb5a83a-9ca2-4abf-965b-0828c6fb64d8/indexes-store-bg.jpg",
	r2_key: "a/v1/80f7d5cf-5026-49dd-8137-91bdaa674a1a/8cb5a83a-9ca2-4abf-965b-0828c6fb64d8/indexes-store-bg.jpg",
	original_filename: "indexes-store-bg.jpg",
	size: 324589,
	content_type: "image/jpeg",
	created_at: "2026-07-04T22:11:55Z"
};
var PLACEHOLDER_MODELS = [
	"https://modelviewer.dev/shared-assets/models/Astronaut.glb",
	"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb",
	"https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb",
	"https://modelviewer.dev/shared-assets/models/reflective-sphere.glb"
];
var modelFor = (id) => {
	let h = 0;
	for (const c of id) h = h * 31 + c.charCodeAt(0) >>> 0;
	return PLACEHOLDER_MODELS[h % PLACEHOLDER_MODELS.length];
};
function useModelViewer() {
	(0, import_react.useEffect)(() => {
		if (typeof document === "undefined") return;
		if (document.querySelector("script[data-mv-loader]")) return;
		const s = document.createElement("script");
		s.type = "module";
		s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
		s.setAttribute("data-mv-loader", "1");
		document.head.appendChild(s);
	}, []);
}
function useMounted() {
	const [m, setM] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setM(true), []);
	return m;
}
function ImmersiveStore() {
	const [activeId, setActiveId] = (0, import_react.useState)(null);
	const addToCart = useCart((s) => s.add);
	const items = useCart((s) => s.items);
	const total = useCart((s) => s.total);
	const mounted = useMounted();
	useModelViewer();
	const product = (0, import_react.useMemo)(() => products.find((p) => p.id === activeId) ?? null, [activeId]);
	(0, import_react.useEffect)(() => {
		document.documentElement.style.overflow = "hidden";
		document.body.style.overflow = "hidden";
		return () => {
			document.documentElement.style.overflow = "";
			document.body.style.overflow = "";
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape") setActiveId(null);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const handleOrder = () => {
		if (!product) return;
		window.open(quickOrderLink(product), "_blank");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		className: "fixed inset-0 h-screen w-screen overflow-hidden bg-[#04060d] text-white",
		style: { fontFamily: "Tajawal, sans-serif" },
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: indexes_store_bg_jpg_asset_default.url,
						alt: "",
						"aria-hidden": true,
						className: "h-full w-full scale-110 object-cover opacity-30 blur-2xl",
						draggable: false
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(31,94,255,0.35),transparent_55%),radial-gradient(circle_at_85%_90%,rgba(102,166,255,0.28),transparent_55%),radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.85)_100%)]" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "pointer-events-none absolute inset-0 opacity-40",
						animate: { backgroundPosition: [
							"0% 50%",
							"100% 50%",
							"0% 50%"
						] },
						transition: {
							duration: 22,
							repeat: Infinity,
							ease: "linear"
						},
						style: {
							background: "conic-gradient(from 180deg at 50% 50%, rgba(31,94,255,0.12), rgba(102,166,255,0.08), rgba(168,85,247,0.1), rgba(31,94,255,0.12))",
							backgroundSize: "200% 200%",
							mixBlendMode: "screen"
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-3 pt-4 sm:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/",
						className: "pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-bold text-white backdrop-blur-xl transition hover:bg-white/20 sm:text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" }), "الرئيسية"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto hidden items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[11px] font-bold text-white/90 backdrop-blur-xl sm:flex",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "grid h-2 w-2 place-items-center rounded-full bg-[#66A6FF] shadow-[0_0_10px_#66A6FF]" }), "المعرض السباتيال — اندكس ستور"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-bold text-white backdrop-blur-xl sm:text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5 text-[#66A6FF]" }), "Vision · 3D"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 top-20 z-30 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.h1, {
					initial: {
						opacity: 0,
						y: -8
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: { duration: .6 },
					className: "text-lg font-black tracking-tight sm:text-2xl",
					children: ["استكشف منتجاتك ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[#66A6FF]",
						children: "بحرية"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-1 max-w-xs text-[11px] text-white/60 sm:max-w-md sm:text-sm",
					children: "المس أي دائرة لتفتح النموذج ثلاثي الأبعاد وتدور حوله بلمسة إصبع"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 flex items-center justify-center px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid w-full max-w-3xl grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-6 sm:gap-y-10",
					children: products.map((p, i) => {
						const col = i % 4;
						const arc = Math.sin(col / 3 * Math.PI) * 22;
						const delay = .08 * i;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveId(p.id),
							className: "group flex flex-col items-center focus:outline-none",
							style: { transform: `translateY(${-arc}px)` },
							"aria-label": p.name,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
									layoutId: `orb-${p.id}`,
									initial: {
										opacity: 0,
										scale: .6
									},
									animate: {
										opacity: 1,
										scale: 1,
										y: [
											0,
											-6,
											0
										]
									},
									transition: {
										opacity: {
											duration: .5,
											delay
										},
										scale: {
											duration: .5,
											delay,
											type: "spring",
											stiffness: 140,
											damping: 14
										},
										y: {
											duration: 4 + i % 4 * .6,
											repeat: Infinity,
											ease: "easeInOut",
											delay: i % 4 * .4
										}
									},
									whileHover: { scale: 1.08 },
									whileTap: { scale: .96 },
									className: "relative aspect-square w-full overflow-hidden rounded-full ring-1 ring-white/15",
									style: {
										background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.35), rgba(31,94,255,0.15) 55%, rgba(4,6,13,0.6) 100%)",
										boxShadow: "0 20px 60px -18px rgba(31,94,255,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 30px -6px rgba(102,166,255,0.35)",
										backdropFilter: "blur(14px)"
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: p.image,
											alt: "",
											loading: "lazy",
											className: "h-full w-full object-cover",
											draggable: false
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_45%)]" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-2 line-clamp-1 max-w-[70px] text-center text-[10px] font-bold text-white/80 sm:max-w-[110px] sm:text-xs",
									children: p.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 text-[10px] font-black text-[#66A6FF] sm:text-xs",
									children: formatPrice(p.price)
								})
							]
						}, p.id);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-3 pb-5 sm:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-full border border-white/15 bg-black/40 px-3.5 py-2 text-[10px] text-white/70 backdrop-blur-xl sm:text-[11px]",
					children: "اسحب النموذج للتدوير · 360°"
				}), mounted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/cart",
					className: "pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-[#1F5EFF]/85 px-3.5 py-2 text-[11px] font-bold text-white shadow-[0_10px_40px_-10px_#1F5EFF] backdrop-blur-xl transition hover:bg-[#1F5EFF] sm:text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-4 w-4" }),
						"السلة (",
						items.length,
						") · ",
						formatPrice(total())
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: product && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: .35 },
				className: "fixed inset-0 z-50 bg-black/55 backdrop-blur-md",
				onClick: () => setActiveId(null)
			}, "backdrop"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
					initial: {
						opacity: 0,
						y: 20
					},
					animate: {
						opacity: 1,
						y: 0
					},
					exit: {
						opacity: 0,
						y: 20
					},
					transition: {
						duration: .4,
						delay: .05
					},
					className: "pointer-events-auto relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 shadow-[0_40px_120px_-20px_rgba(31,94,255,0.6)]",
					style: {
						background: "linear-gradient(140deg, rgba(31,94,255,0.22), rgba(10,14,28,0.75))",
						backdropFilter: "blur(28px) saturate(160%)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setActiveId(null),
						className: "absolute end-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white/90 backdrop-blur-md transition hover:bg-black/70",
						"aria-label": "إغلاق",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 p-3 sm:grid-cols-2 sm:gap-6 sm:p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							layoutId: `orb-${product.id}`,
							className: "relative aspect-square overflow-hidden rounded-2xl ring-1 ring-white/15 sm:aspect-auto sm:h-[520px]",
							style: {
								background: "radial-gradient(circle at 30% 25%, rgba(102,166,255,0.35), rgba(15,20,40,0.7) 60%, rgba(4,6,13,0.9) 100%)",
								boxShadow: "inset 0 0 60px rgba(31,94,255,0.25), 0 0 0 1px rgba(255,255,255,0.06) inset"
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModelStage, {
								src: modelFor(product.id),
								poster: product.image
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-none absolute start-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white/90 backdrop-blur-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCw, { className: "h-3 w-3" }), " اسحب للتدوير"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col justify-between gap-4 p-1 sm:p-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#66A6FF]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3" }), " تجربة ثلاثية الأبعاد"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1.5 text-xl font-black leading-tight sm:text-3xl",
									children: product.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-baseline gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-2xl font-black text-white sm:text-4xl",
										children: formatPrice(product.price)
									}), product.oldPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-white/40 line-through sm:text-sm",
										children: formatPrice(product.oldPrice)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-xs leading-relaxed text-white/75 sm:text-sm",
									children: product.description
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-4 grid grid-cols-3 gap-2 text-center",
									children: [
										{
											k: "التقييم",
											v: `${product.rating} ★`
										},
										{
											k: "المخزون",
											v: `${product.stock}`
										},
										{
											k: "التقييمات",
											v: `${product.reviews}`
										}
									].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-white/10 bg-white/5 px-2 py-2 backdrop-blur-md",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[9px] text-white/60 sm:text-[10px]",
											children: s.k
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-black text-white sm:text-sm",
											children: s.v
										})]
									}, s.k))
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => addToCart(product, 1),
									className: "rounded-xl bg-white/95 px-3 py-3 text-xs font-bold text-[#0F172A] transition hover:bg-white sm:text-sm",
									children: "إضافة للسلة"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: handleOrder,
									className: "flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-3 text-xs font-bold text-white transition hover:bg-[#1EBE5D] sm:text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), "اطلب عبر واتساب"]
								})]
							})]
						})]
					})]
				}, "modal")
			})] }) })
		]
	});
}
function ModelStage({ src, poster }) {
	if (!useMounted()) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid h-full w-full place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: poster,
			alt: "",
			className: "h-2/3 w-2/3 rounded-2xl object-cover opacity-70"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("model-viewer", {
		src,
		alt: "نموذج ثلاثي الأبعاد",
		"camera-controls": "",
		"auto-rotate": "",
		"touch-action": "pan-y",
		exposure: "1.1",
		"shadow-intensity": "1",
		"interaction-prompt": "none",
		"environment-image": "neutral",
		style: {
			width: "100%",
			height: "100%",
			background: "transparent"
		}
	});
}
//#endregion
export { ImmersiveStore as component };
