import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as RotateCcw, G as LoaderCircle, O as Save, a as X, o as WandSparkles, u as Upload, y as Sparkles } from "../_libs/lucide-react.mjs";
import { n as useI18n } from "./i18n-ut2VIwHl.mjs";
import { t as useAdmin } from "./admin-store-NQ8cLToP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.studio-BOEA9xWS.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StudioPage() {
	const { t, lang } = useI18n();
	const navigate = useNavigate();
	const inputRef = (0, import_react.useRef)(null);
	const [images, setImages] = (0, import_react.useState)([]);
	const [hint, setHint] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const addProduct = useAdmin((s) => s.addProduct);
	const addSession = useAdmin((s) => s.addSession);
	const updateSession = useAdmin((s) => s.updateSession);
	const handleFiles = async (files) => {
		if (!files) return;
		const arr = Array.from(files).slice(0, 6);
		const dataUrls = await Promise.all(arr.map((f) => new Promise((res, rej) => {
			const r = new FileReader();
			r.onload = () => res(r.result);
			r.onerror = rej;
			r.readAsDataURL(f);
		})));
		setImages((prev) => [...prev, ...dataUrls].slice(0, 6));
	};
	const analyze = async () => {
		setError(null);
		if (!images.length && !hint.trim()) {
			setError(lang === "ar" ? "أضف صورة أو تلميحاً على الأقل" : "Add an image or a hint first");
			return;
		}
		setLoading(true);
		setResult(null);
		const sessionId = crypto.randomUUID();
		addSession({
			id: sessionId,
			step: "processing",
			title: hint || (lang === "ar" ? "جلسة جديدة" : "New session"),
			createdAt: Date.now(),
			updatedAt: Date.now()
		});
		try {
			const base = "/".replace(/\/$/, "");
			const res = await fetch(`${base}/api/ai/analyze-product`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					hint,
					language: lang,
					images
				})
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
			setResult(data);
			updateSession(sessionId, {
				step: "review",
				title: data.title
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			setError(msg);
			updateSession(sessionId, { step: "upload" });
		} finally {
			setLoading(false);
		}
	};
	const save = () => {
		if (!result) return;
		const id = crypto.randomUUID();
		const product = {
			id,
			title: result.title,
			description: result.description,
			category: result.category,
			slug: result.slug,
			tags: result.tags,
			seoTitle: result.seoTitle,
			seoDescription: result.seoDescription,
			priceMin: result.priceEstimate.min,
			priceMax: result.priceEstimate.max,
			currency: result.priceEstimate.currency,
			images,
			status: "draft",
			createdAt: Date.now()
		};
		addProduct(product);
		navigate({
			to: "/admin/product/$id",
			params: { id }
		});
	};
	const reset = () => {
		setImages([]);
		setHint("");
		setResult(null);
		setError(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), " AI Studio"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 text-3xl font-black lg:text-4xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "neon-text",
					children: t("studio.title")
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: t("studio.subtitle")
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						onClick: () => inputRef.current?.click(),
						onDragOver: (e) => e.preventDefault(),
						onDrop: (e) => {
							e.preventDefault();
							handleFiles(e.dataTransfer.files);
						},
						className: "group cursor-pointer rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-8 text-center transition hover:bg-primary/10",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-brand shadow-brand",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-6 w-6 text-primary-foreground" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 text-sm font-bold",
								children: t("studio.drop")
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-xs text-muted-foreground",
								children: "PNG · JPG · WEBP · ≤ 6"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: inputRef,
								type: "file",
								accept: "image/*",
								multiple: true,
								className: "hidden",
								onChange: (e) => handleFiles(e.target.files)
							})
						]
					}),
					images.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-3 gap-2",
						children: images.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "group relative aspect-square overflow-hidden rounded-xl border border-border/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src,
								alt: "",
								className: "h-full w-full object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setImages((prev) => prev.filter((_, j) => j !== i)),
								className: "absolute end-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100",
								"aria-label": "remove",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3.5 w-3.5" })
							})]
						}, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-bold text-muted-foreground",
							children: t("studio.hint")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: hint,
							onChange: (e) => setHint(e.target.value),
							rows: 3,
							placeholder: t("studio.hintPh"),
							className: "mt-2 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none ring-primary/30 focus:ring-2"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: analyze,
							disabled: loading,
							className: "inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-60",
							children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-4 w-4" }), loading ? t("studio.analyzing") : t("studio.analyze")]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: reset,
							className: "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-accent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "h-4 w-4" }), t("studio.reset")]
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-bold text-destructive",
						children: error
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-black",
							children: t("studio.result")
						}), result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: save,
							className: "inline-flex items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-bold text-success-foreground hover:opacity-90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), t("studio.save")]
						})]
					}),
					loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mx-auto grid h-20 w-20 place-items-center rounded-full gradient-brand animate-pulse-glow",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-8 w-8 text-primary-foreground animate-pulse" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-sm text-muted-foreground",
								children: lang === "ar" ? "الذكاء يفكر..." : "AI is thinking..."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2",
								children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-4 animate-pulse rounded-lg bg-muted",
									style: { width: `${90 - i * 12}%` }
								}, i))
							})
						]
					}),
					!loading && !result && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground",
						children: lang === "ar" ? "ستظهر بيانات المنتج المقترحة هنا بعد التحليل." : "AI-generated product details will appear here."
					}),
					result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("studio.title2"),
								value: result.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: t("studio.desc"),
								value: result.description,
								multiline: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: t("studio.category"),
									value: result.category
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
									label: t("studio.slug"),
									value: result.slug,
									mono: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-bold text-muted-foreground",
								children: t("studio.tags")
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 flex flex-wrap gap-1.5",
								children: result.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary",
									children: ["#", tag]
								}, tag))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border/60 bg-accent/40 p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-bold text-muted-foreground",
										children: t("studio.seo")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-sm font-bold",
										children: result.seoTitle
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-muted-foreground",
										children: result.seoDescription
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-gradient-to-br from-primary/15 to-fuchsia-500/10 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-bold text-muted-foreground",
									children: t("studio.price")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 text-2xl font-black neon-text",
									children: [
										result.priceEstimate.min,
										" – ",
										result.priceEstimate.max,
										" ",
										result.priceEstimate.currency
									]
								})]
							})
						]
					})
				]
			})]
		})]
	});
}
function Field({ label, value, multiline, mono }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-xs font-bold text-muted-foreground",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `mt-1 rounded-xl border border-border/60 bg-surface p-3 text-sm ${mono ? "font-mono" : ""} ${multiline ? "" : "truncate"}`,
		children: value
	})] });
}
//#endregion
export { StudioPage as component };
