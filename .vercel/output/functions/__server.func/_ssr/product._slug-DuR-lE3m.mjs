import { o as __toESM } from "../_runtime.mjs";
import { i as formatPrice } from "./store-data-CaXOvYMv.mjs";
import { n as quickOrderLink } from "./whatsapp-C4cq1s8L.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as MessageCircle, L as Package, N as RefreshCcw, P as Plus, S as Shield, b as ShoppingCart, d as Truck, i as Zap, v as Star, wt as ArrowRight, y as Sparkles, z as Minus } from "../_libs/lucide-react.mjs";
import { a as useScroll, i as useTransform, o as motion } from "../_libs/framer-motion.mjs";
import { i as useMounted, n as modelFor, r as useModelViewer, t as Product3DTile } from "./model-viewer-CBb3o8sM.mjs";
import { t as useCart } from "./cart-store-CNi_4HlM.mjs";
import { t as Route } from "./product._slug-BNxmjCor.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product._slug-DuR-lE3m.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DARK = "#000209";
var LIGHT = "#EEEEEE";
var TAJAWAL = "Tajawal, system-ui, sans-serif";
function Reveal({ children, delay = 0, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		initial: {
			opacity: 0,
			y: 40
		},
		whileInView: {
			opacity: 1,
			y: 0
		},
		viewport: {
			once: true,
			margin: "-80px"
		},
		transition: {
			duration: .7,
			delay,
			ease: [
				.22,
				1,
				.36,
				1
			]
		},
		className,
		children
	});
}
function ProductPage() {
	const { product } = Route.useLoaderData();
	const [qty, setQty] = (0, import_react.useState)(1);
	const add = useCart((s) => s.add);
	const [added, setAdded] = (0, import_react.useState)(false);
	const heroRef = (0, import_react.useRef)(null);
	const mounted = useMounted();
	useModelViewer();
	const [showStickyBar, setShowStickyBar] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = heroRef.current;
		if (!el) return;
		const io = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { rootMargin: "-40% 0px 0px 0px" });
		io.observe(el);
		return () => io.disconnect();
	}, []);
	const { scrollYProgress } = useScroll({
		target: heroRef,
		offset: ["start start", "end start"]
	});
	const heroScale = useTransform(scrollYProgress, [0, 1], [1, .85]);
	const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, .3]);
	const handleAdd = () => {
		add(product, qty);
		setAdded(true);
		setTimeout(() => setAdded(false), 1500);
	};
	const orderHref = quickOrderLink(product);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		dir: "rtl",
		className: "flex flex-col pb-40",
		style: {
			background: DARK,
			color: LIGHT,
			fontFamily: TAJAWAL
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				ref: heroRef,
				className: "relative h-[100vh] overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-0",
						style: { background: "radial-gradient(circle at 50% 55%, rgba(238,238,238,0.18) 0%, rgba(238,238,238,0.05) 30%, transparent 60%)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-0",
						style: { background: "radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.9), transparent 60%)" }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "absolute end-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition hover:bg-white/10",
						style: { color: LIGHT },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute start-4 top-4 z-20",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold tracking-[0.3em] backdrop-blur-xl",
							style: { color: LIGHT },
							children: "INDEXES · PREMIUM"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						style: {
							scale: heroScale,
							opacity: heroOpacity
						},
						className: "relative z-10 h-full w-full",
						children: mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Product3DTile, {
								modelSrc: modelFor(product.id),
								poster: product.image,
								alt: product.name
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.image,
							alt: product.name,
							className: "h-full w-full object-contain"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-0 bottom-0 z-10 px-6 pb-14 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.h1, {
								initial: {
									opacity: 0,
									y: 30
								},
								animate: {
									opacity: 1,
									y: 0
								},
								transition: {
									duration: .9,
									delay: .15,
									ease: [
										.22,
										1,
										.36,
										1
									]
								},
								className: "text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl",
								style: { color: LIGHT },
								children: product.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									y: 20
								},
								animate: {
									opacity: 1,
									y: 0
								},
								transition: {
									duration: .9,
									delay: .35
								},
								className: "mt-4 flex items-center justify-center gap-3 text-sm",
								style: { color: "rgba(238,238,238,0.7)" },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-2xl font-black",
									style: { color: LIGHT },
									children: formatPrice(product.price)
								}), product.oldPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm line-through opacity-50",
									children: formatPrice(product.oldPrice)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: { opacity: 0 },
								animate: { opacity: 1 },
								transition: {
									delay: 1.2,
									duration: 1.2
								},
								className: "mt-8 flex items-center justify-center gap-2 text-[10px] tracking-[0.4em]",
								style: { color: "rgba(238,238,238,0.4)" },
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-px w-8",
										style: { background: "rgba(238,238,238,0.4)" }
									}),
									"SCROLL",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "h-px w-8",
										style: { background: "rgba(238,238,238,0.4)" }
									})
								]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-6 py-32",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-bold tracking-[0.4em]",
						style: { color: "rgba(238,238,238,0.5)" },
						children: "— نبذة"
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						delay: .1,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "mt-6 text-3xl font-black leading-[1.25] sm:text-4xl",
							style: { color: LIGHT },
							children: [
								"صُمّم ليكون",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"استثنائياً في كل تفصيل."
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
						delay: .2,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-8 text-base leading-loose",
							style: { color: "rgba(238,238,238,0.65)" },
							children: product.description
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "flex flex-col gap-32 px-6 py-16",
				children: [
					{
						tag: "الأداء",
						title: "أداء يفوق التوقعات.",
						body: "تقنية متطورة وتصميم دقيق يجعلانك تختبر الفرق من أول استخدام. سرعة، سلاسة، وموثوقية بلا حدود.",
						icon: Zap
					},
					{
						tag: "التصميم",
						title: "جماليات نظيفة، حِرفة عالية.",
						body: "خطوط أنيقة، خامات مختارة بعناية، وتفاصيل تنبض بالفخامة. قطعة تستحق أن تُعرض، لا أن تُخبّأ.",
						icon: Sparkles
					},
					{
						tag: "الجودة",
						title: "مضمون لسنوات قادمة.",
						body: "اختبارات صارمة وضمان شامل يمنحك راحة البال. لأن التميّز يستحق أن يدوم.",
						icon: Shield
					}
				].map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: i * .05,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-14 w-14 place-items-center rounded-2xl border",
								style: {
									borderColor: "rgba(238,238,238,0.15)",
									background: "rgba(238,238,238,0.03)"
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.icon, {
									className: "h-6 w-6",
									style: { color: LIGHT }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[10px] font-bold tracking-[0.4em]",
								style: { color: "rgba(238,238,238,0.5)" },
								children: ["— ", f.tag]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-3xl font-black leading-tight sm:text-4xl",
								style: { color: LIGHT },
								children: f.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base leading-loose",
								style: { color: "rgba(238,238,238,0.6)" },
								children: f.body
							})
						]
					})
				}, f.tag))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-6 py-32",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Reveal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] font-bold tracking-[0.4em]",
					style: { color: "rgba(238,238,238,0.5)" },
					children: "— المواصفات"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-6 text-3xl font-black sm:text-4xl",
					style: { color: LIGHT },
					children: "كل ما تحتاج معرفته."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-12 grid grid-cols-2 gap-3 sm:gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BentoCell, {
							className: "col-span-2 sm:col-span-1",
							label: "التقييم",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-4xl font-black",
									style: { color: LIGHT },
									children: product.rating
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
									className: "h-5 w-5 fill-current",
									style: { color: LIGHT }
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 text-xs",
								style: { color: "rgba(238,238,238,0.5)" },
								children: [
									"من ",
									product.reviews,
									" تقييم"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BentoCell, {
							label: "التوفر",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-baseline gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-4xl font-black",
									style: { color: LIGHT },
									children: product.stock
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs",
									style: { color: "rgba(238,238,238,0.5)" },
									children: "قطعة"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs",
								style: { color: "rgba(238,238,238,0.5)" },
								children: "متوفر الآن للشحن"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BentoCell, {
							label: "السعر",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-3xl font-black",
								style: { color: LIGHT },
								children: formatPrice(product.price)
							}), product.oldPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs line-through",
								style: { color: "rgba(238,238,238,0.4)" },
								children: formatPrice(product.oldPrice)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BentoCell, {
							className: "col-span-2",
							label: "الخدمات",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-4",
								children: [
									{
										icon: Truck,
										label: "شحن سريع"
									},
									{
										icon: Shield,
										label: "ضمان"
									},
									{
										icon: RefreshCcw,
										label: "إرجاع مجاني"
									}
								].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-2 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(s.icon, {
										className: "h-5 w-5",
										style: { color: LIGHT }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-semibold",
										style: { color: "rgba(238,238,238,0.75)" },
										children: s.label
									})]
								}, s.label))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BentoCell, {
							className: "col-span-2",
							label: "الفئة",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, {
									className: "h-5 w-5",
									style: { color: "rgba(238,238,238,0.6)" }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-lg font-bold",
									style: { color: LIGHT },
									children: product.categoryId
								})]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "px-6 pb-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between rounded-2xl border p-4",
					style: {
						borderColor: "rgba(238,238,238,0.12)",
						background: "rgba(238,238,238,0.03)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-bold",
						style: { color: LIGHT },
						children: "الكمية"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setQty(Math.max(1, qty - 1)),
								className: "grid h-9 w-9 place-items-center rounded-full border transition hover:bg-white/10",
								style: {
									borderColor: "rgba(238,238,238,0.2)",
									color: LIGHT
								},
								"aria-label": "نقصان",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-6 text-center text-lg font-black",
								style: { color: LIGHT },
								children: qty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setQty(Math.min(product.stock, qty + 1)),
								className: "grid h-9 w-9 place-items-center rounded-full transition hover:opacity-90",
								style: {
									background: LIGHT,
									color: DARK
								},
								"aria-label": "زيادة",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" })
							})
						]
					})]
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reveal, {
					delay: .05,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-[auto_1fr] gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleAdd,
							className: "flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-4 text-xs font-bold transition hover:bg-white/10",
							style: {
								borderColor: "rgba(238,238,238,0.2)",
								color: LIGHT
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "h-4 w-4" }), added ? "تمت الإضافة" : "السلة"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: orderHref,
							target: "_blank",
							rel: "noopener noreferrer",
							className: "flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-black transition hover:opacity-90",
							style: {
								background: LIGHT,
								color: DARK
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), "اطلب عبر واتساب"]
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
				initial: false,
				animate: {
					y: showStickyBar ? 0 : 120,
					opacity: showStickyBar ? 1 : 0
				},
				transition: {
					duration: .4,
					ease: [
						.22,
						1,
						.36,
						1
					]
				},
				className: "fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md px-3",
				style: { pointerEvents: showStickyBar ? "auto" : "none" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 rounded-2xl border p-2.5 shadow-2xl",
					style: {
						borderColor: "rgba(238,238,238,0.12)",
						background: "rgba(0,2,9,0.72)",
						backdropFilter: "blur(24px) saturate(160%)"
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1 ps-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs font-bold",
							style: { color: LIGHT },
							children: product.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-black",
							style: { color: "rgba(238,238,238,0.7)" },
							children: formatPrice(product.price)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: orderHref,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition hover:opacity-90",
						style: {
							background: LIGHT,
							color: DARK
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-3.5 w-3.5" }), "اطلب عبر واتساب"]
					})]
				})
			})
		]
	});
}
function BentoCell({ children, label, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `group relative overflow-hidden rounded-2xl border p-5 transition ${className}`,
		style: {
			borderColor: "rgba(238,238,238,0.1)",
			background: "rgba(238,238,238,0.02)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100",
				style: { background: "radial-gradient(circle at 50% 0%, rgba(238,238,238,0.08), transparent 70%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-[10px] font-bold tracking-[0.3em]",
				style: { color: "rgba(238,238,238,0.4)" },
				children: label.toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative",
				children
			})
		]
	});
}
//#endregion
export { ProductPage as component };
