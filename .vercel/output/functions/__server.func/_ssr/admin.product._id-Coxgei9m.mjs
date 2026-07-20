import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as MessageCircle, D as Search, Et as ArrowDown, G as LoaderCircle, J as Layers, L as Package, O as Save, Q as ImagePlus, St as ArrowUp, T as Share2, Tt as ArrowLeft, X as Info, Z as Image$1, dt as Copy, f as TriangleAlert, ft as Clock, lt as DollarSign, m as Trash2, o as WandSparkles, ot as Eye, s as Video, v as Star, vt as ChevronDown, y as Sparkles } from "../_libs/lucide-react.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { n as useI18n } from "./i18n-ut2VIwHl.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { f as aiAnalyzeImage, p as aiOptimizeDescription } from "./catalog.functions-DH8kSUAh.mjs";
import { a as getAdminProduct, f as updateAdminProduct, i as deleteAdminProduct, n as createAdminProduct, s as listAdminCategories } from "./admin.actions-CN1SCjW3.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Route } from "./admin.product._id-xemhzT_x.mjs";
import { t as Ai3dGeneratorPanel } from "./ai-3d-generator-unfg1c5a.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.product._id-Coxgei9m.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_PREFIX = "admin-product-card:";
function CollapsibleCard({ id, title, subtitle, icon, right, defaultOpen = true, children }) {
	const [open, setOpen] = (0, import_react.useState)(defaultOpen);
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const v = localStorage.getItem(STORAGE_PREFIX + id);
			if (v === "0") setOpen(false);
			else if (v === "1") setOpen(true);
		} catch {}
		setReady(true);
	}, [id]);
	(0, import_react.useEffect)(() => {
		if (!ready) return;
		try {
			localStorage.setItem(STORAGE_PREFIX + id, open ? "1" : "0");
		} catch {}
	}, [
		open,
		id,
		ready
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-2xl glass overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center gap-3 px-5 py-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setOpen((v) => !v),
				"aria-expanded": open,
				"aria-controls": `card-body-${id}`,
				className: "flex min-w-0 flex-1 items-center gap-3 text-start",
				children: [
					icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary",
						children: icon
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm font-black",
							children: title
						}), subtitle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-xs text-muted-foreground",
							children: subtitle
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}` })
				]
			}), right ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "shrink-0",
				children: right
			}) : null]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			id: `card-body-${id}`,
			className: "border-t border-border/60 px-5 py-4",
			children
		})]
	});
}
var isProbablyUrl = (s) => /^https?:\/\//i.test(s.trim());
function ImageManager({ value, onChange }) {
	const [urlDraft, setUrlDraft] = (0, import_react.useState)("");
	const [dragIndex, setDragIndex] = (0, import_react.useState)(null);
	(0, import_react.useRef)(null);
	const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
	const move = (from, to) => {
		if (to < 0 || to >= value.length) return;
		const next = value.slice();
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		onChange(next);
	};
	const setFeatured = (i) => move(i, 0);
	const onDragStart = (i) => setDragIndex(i);
	const onDragOver = (e) => e.preventDefault();
	const onDrop = (e, i) => {
		e.preventDefault();
		if (dragIndex === null || dragIndex === i) return;
		move(dragIndex, i);
		setDragIndex(null);
	};
	const fileInputRef = (0, import_react.useRef)(null);
	const handleFileChange = async (e) => {
		const files = Array.from(e.target.files ?? []);
		if (files.length === 0) return;
		const imageFiles = files.filter((f) => f.type.startsWith("image/"));
		if (imageFiles.length === 0) {
			toast.error("يرجى اختيار ملفات صور فقط");
			return;
		}
		const loaders = imageFiles.map((file) => {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.onerror = () => reject(/* @__PURE__ */ new Error("فشل قراءة الملف"));
				reader.readAsDataURL(file);
			});
		});
		try {
			const uniqueNewUrls = (await Promise.all(loaders)).filter((u) => !value.includes(u));
			if (uniqueNewUrls.length > 0) {
				onChange([...value, ...uniqueNewUrls]);
				toast.success(`تمت إضافة ${uniqueNewUrls.length} صورة من الجهاز`);
			}
		} catch (err) {
			toast.error("حدث خطأ أثناء قراءة الصور");
		}
		e.target.value = "";
	};
	const onFileDrop = async (e) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files ?? []);
		if (files.length > 0) {
			const imageFiles = files.filter((f) => f.type.startsWith("image/"));
			if (imageFiles.length === 0) {
				toast.error("يرجى سحب ملفات صور فقط");
				return;
			}
			const loaders = imageFiles.map((file) => {
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result);
					reader.onerror = () => reject(/* @__PURE__ */ new Error("فشل قراءة الملف"));
					reader.readAsDataURL(file);
				});
			});
			try {
				const uniqueNewUrls = (await Promise.all(loaders)).filter((u) => !value.includes(u));
				if (uniqueNewUrls.length > 0) {
					onChange([...value, ...uniqueNewUrls]);
					toast.success(`تمت إضافة ${uniqueNewUrls.length} صورة من الجهاز`);
				}
			} catch (err) {
				toast.error("حدث خطأ أثناء قراءة الصور");
			}
			return;
		}
		const items = e.dataTransfer?.items;
		if (!items) return;
		const urls = [];
		for (const item of items) {
			if (item.kind === "string" && item.type === "text/uri-list") await new Promise((res) => item.getAsString((s) => {
				if (isProbablyUrl(s) && !value.includes(s)) urls.push(s);
				res();
			}));
			if (item.kind === "string" && item.type === "text/plain") await new Promise((res) => item.getAsString((s) => {
				s.split(/[\n\s,]+/).forEach((u) => {
					if (isProbablyUrl(u) && !value.includes(u)) urls.push(u);
				});
				res();
			}));
		}
		if (urls.length) {
			onChange([...value, ...urls]);
			toast.success(`تمت إضافة ${urls.length} صورة`);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				onDragOver: (e) => e.preventDefault(),
				onDrop: onFileDrop,
				onClick: () => fileInputRef.current?.click(),
				className: "rounded-xl border-2 border-dashed border-border p-4 text-center cursor-pointer hover:bg-muted/10 hover:border-primary transition",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileInputRef,
						type: "file",
						multiple: true,
						accept: "image/*",
						className: "hidden",
						onChange: handleFileChange
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "mx-auto h-6 w-6 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs font-bold text-muted-foreground",
						children: "اسحب الصور هنا، أو انقر للاختيار من الجهاز"
					})
				]
			}),
			value.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-surface p-4 text-center text-xs text-muted-foreground",
				children: "لا توجد صور بعد. أضف روابط للصور لعرضها في المتجر."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
				children: value.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					draggable: true,
					onDragStart: () => onDragStart(i),
					onDragOver,
					onDrop: (e) => onDrop(e, i),
					className: `group relative overflow-hidden rounded-xl border border-border bg-surface ${dragIndex === i ? "opacity-50" : ""}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "aspect-square bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src,
								alt: "",
								className: "h-full w-full object-cover",
								loading: "lazy",
								onError: (e) => {
									e.currentTarget.style.opacity = "0.3";
								}
							})
						}),
						i === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-warning/90 px-2 py-0.5 text-[10px] font-black text-warning-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3 w-3" }), " رئيسية"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => move(i, i - 1),
										disabled: i === 0,
										className: "grid h-7 w-7 place-items-center rounded-md bg-black/50 text-white disabled:opacity-30",
										"aria-label": "تحريك للأعلى",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "h-3.5 w-3.5" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => move(i, i + 1),
										disabled: i === value.length - 1,
										className: "grid h-7 w-7 place-items-center rounded-md bg-black/50 text-white disabled:opacity-30",
										"aria-label": "تحريك للأسفل",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "h-3.5 w-3.5" })
									}),
									i !== 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setFeatured(i),
										className: "grid h-7 w-7 place-items-center rounded-md bg-black/50 text-white",
										"aria-label": "تعيين كصورة رئيسية",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5" })
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => remove(i),
								className: "grid h-7 w-7 place-items-center rounded-md bg-destructive/90 text-destructive-foreground",
								"aria-label": "حذف",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
							})]
						})
					]
				}, `${src}-${i}`))
			}),
			value.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted-foreground",
				children: [value.length, " صورة · الصورة الأولى هي الصورة الرئيسية"]
			})
		]
	});
}
function GooglePreview({ slug, title, description, origin }) {
	const url = `${origin ?? (typeof window !== "undefined" ? window.location.origin : "https://example.com")}/product/${slug || "product-slug"}`;
	const displayTitle = (title || "Product title").slice(0, 60);
	const displayDesc = (description || "Product description shown in search results.").slice(0, 160);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-white p-4 text-black shadow-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-xs text-[#5f6368]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate",
					children: url
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 truncate text-lg font-medium text-[#1a0dab]",
				children: displayTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 line-clamp-2 text-sm text-[#4d5156]",
				children: displayDesc
			})
		]
	});
}
var emptyForm = {
	slug: "",
	name: "",
	description: "",
	price: 0,
	old_price: null,
	currency: "YER",
	category_id: "",
	brand: "",
	images: [],
	model_url: "",
	stock: 0,
	tags: [],
	badge: "",
	is_published: true,
	sku: "",
	barcode: "",
	compare_at_price: null,
	cost_price: null,
	availability: "in stock",
	condition: "new",
	source_url: "",
	video_playback_id: "",
	model_3d_url: "",
	model_3d_thumbnail: "",
	model_3d_status: "pending",
	color: "",
	size: "",
	gender: "",
	material: "",
	age_group: "",
	pattern: "",
	google_product_category: "",
	fb_product_category: "",
	meta_sync_status: "not_synced"
};
var slugify = (s) => s.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
var NAME_MAX = 120;
var DESC_MAX = 4e3;
function ProductDetailPage() {
	const { id } = Route.useParams();
	const { t, dir } = useI18n();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const isNew = id === "new";
	const analyzeImage = useServerFn(aiAnalyzeImage);
	const optimizeDescription = useServerFn(aiOptimizeDescription);
	const productQ = useQuery({
		queryKey: ["admin-product", id],
		queryFn: () => getAdminProduct(id),
		enabled: !isNew
	});
	const categoriesQ = useQuery({
		queryKey: ["admin-categories"],
		queryFn: () => listAdminCategories()
	});
	const [form, setForm] = (0, import_react.useState)(emptyForm);
	const [initial, setInitial] = (0, import_react.useState)(emptyForm);
	const [slugTouched, setSlugTouched] = (0, import_react.useState)(false);
	const [categorySearch, setCategorySearch] = (0, import_react.useState)("");
	const [activeTab, setActiveTab] = (0, import_react.useState)("edit");
	const fileInputRef = (0, import_react.useRef)(null);
	const [dragOverAi, setDragOverAi] = (0, import_react.useState)(false);
	const [uploadingVideo, setUploadingVideo] = (0, import_react.useState)(false);
	const [localVideoUrl, setLocalVideoUrl] = (0, import_react.useState)("");
	const videoInputRef = (0, import_react.useRef)(null);
	const handleVideoChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("video/")) {
			toast.error("يرجى اختيار ملف فيديو صالح");
			return;
		}
		setUploadingVideo(true);
		setLocalVideoUrl(URL.createObjectURL(file));
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const mockPlaybackId = `mux-playback-${Date.now()}`;
		setForm((f) => ({
			...f,
			video_playback_id: mockPlaybackId
		}));
		setUploadingVideo(false);
		toast.success("تم رفع ومعالجة الفيديو بنجاح!");
	};
	const handleVideoDrop = async (e) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("video/")) {
			toast.error("يرجى سحب ملف فيديو صالح");
			return;
		}
		setUploadingVideo(true);
		setLocalVideoUrl(URL.createObjectURL(file));
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const mockPlaybackId = `mux-playback-${Date.now()}`;
		setForm((f) => ({
			...f,
			video_playback_id: mockPlaybackId
		}));
		setUploadingVideo(false);
		toast.success("تم رفع ومعالجة الفيديو بنجاح!");
	};
	const removeVideo = () => {
		setForm((f) => ({
			...f,
			video_playback_id: ""
		}));
		setLocalVideoUrl("");
		toast.success("تمت إزالة الفيديو");
	};
	(0, import_react.useEffect)(() => {
		if (isNew || !productQ.data) return;
		const p = productQ.data;
		let color = "";
		let size = "";
		let gender = "";
		let material = "";
		let age_group = "";
		let pattern = "";
		let google_product_category = "";
		let fb_product_category = "";
		const cleanTags = [];
		(p.tags ?? []).forEach((t) => {
			if (t.startsWith("_color:")) color = t.substring(7);
			else if (t.startsWith("_size:")) size = t.substring(6);
			else if (t.startsWith("_gender:")) gender = t.substring(8);
			else if (t.startsWith("_material:")) material = t.substring(10);
			else if (t.startsWith("_age:")) age_group = t.substring(5);
			else if (t.startsWith("_pattern:")) pattern = t.substring(9);
			else if (t.startsWith("_gcat:")) google_product_category = t.substring(6);
			else if (t.startsWith("_fbcat:")) fb_product_category = t.substring(6);
			else cleanTags.push(t);
		});
		const next = {
			slug: p.slug,
			name: p.name,
			description: p.description ?? "",
			price: Number(p.price),
			old_price: p.old_price != null ? Number(p.old_price) : null,
			currency: p.currency,
			category_id: p.category_id ?? "",
			brand: p.brand ?? "",
			images: p.images ?? [],
			model_url: p.model_url ?? "",
			stock: p.stock,
			tags: cleanTags,
			badge: p.badge ?? "",
			is_published: p.is_published,
			sku: p.sku ?? "",
			barcode: p.barcode ?? "",
			compare_at_price: p.compare_at_price != null ? Number(p.compare_at_price) : null,
			cost_price: p.cost_price != null ? Number(p.cost_price) : null,
			availability: p.availability ?? "in stock",
			condition: p.condition ?? "new",
			source_url: p.source_url ?? "",
			video_playback_id: p.video_playback_id ?? "",
			model_3d_url: p.model_3d_url ?? "",
			model_3d_thumbnail: p.model_3d_thumbnail ?? "",
			model_3d_status: p.model_3d_status ?? "pending",
			color,
			size,
			gender,
			material,
			age_group,
			pattern,
			google_product_category,
			fb_product_category,
			meta_sync_status: p.meta_sync_status ?? "not_synced"
		};
		setForm(next);
		setInitial(next);
		setSlugTouched(true);
	}, [productQ.data, isNew]);
	(0, import_react.useEffect)(() => {
		if (slugTouched) return;
		if (!form.name) return;
		setForm((f) => ({
			...f,
			slug: slugify(f.name)
		}));
	}, [form.name, slugTouched]);
	const dirty = (0, import_react.useMemo)(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
	(0, import_react.useEffect)(() => {
		if (!dirty) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [dirty]);
	const buildPayload = (0, import_react.useCallback)(() => {
		const finalTags = [...form.tags.filter(Boolean)];
		if (form.color.trim()) finalTags.push(`_color:${form.color.trim()}`);
		if (form.size.trim()) finalTags.push(`_size:${form.size.trim()}`);
		if (form.gender.trim()) finalTags.push(`_gender:${form.gender.trim()}`);
		if (form.material.trim()) finalTags.push(`_material:${form.material.trim()}`);
		if (form.age_group.trim()) finalTags.push(`_age:${form.age_group.trim()}`);
		if (form.pattern.trim()) finalTags.push(`_pattern:${form.pattern.trim()}`);
		if (form.google_product_category.trim()) finalTags.push(`_gcat:${form.google_product_category.trim()}`);
		if (form.fb_product_category.trim()) finalTags.push(`_fbcat:${form.fb_product_category.trim()}`);
		return {
			slug: form.slug.trim(),
			name: form.name.trim(),
			description: form.description,
			price: Number(form.price),
			old_price: form.old_price != null && form.old_price > 0 ? Number(form.old_price) : null,
			currency: form.currency,
			category_id: form.category_id || void 0,
			brand: form.brand || void 0,
			images: form.images.filter(Boolean),
			model_url: form.model_url || void 0,
			stock: Number(form.stock),
			tags: finalTags,
			is_published: form.is_published,
			badge: form.badge || void 0,
			sku: form.sku.trim() || null,
			barcode: form.barcode.trim() || null,
			compare_at_price: form.compare_at_price != null && form.compare_at_price > 0 ? Number(form.compare_at_price) : null,
			cost_price: form.cost_price != null && form.cost_price > 0 ? Number(form.cost_price) : null,
			availability: form.availability || null,
			condition: form.condition || null,
			source_url: form.source_url.trim() || null,
			video_playback_id: form.video_playback_id.trim() || null,
			model_3d_url: form.model_3d_url || null,
			model_3d_thumbnail: form.model_3d_thumbnail || null,
			model_3d_status: form.model_3d_status || "pending",
			meta_sync_status: form.meta_sync_status
		};
	}, [form]);
	const validate = () => {
		if (!form.name.trim()) return "اسم المنتج مطلوب";
		if (!form.slug.trim()) return "الرابط (slug) مطلوب";
		if (!/^[\p{L}\p{N}-]+$/iu.test(form.slug)) return "الرابط يجب أن يحوي أحرف وأرقام و - فقط";
		if (!(form.price >= 0)) return "السعر غير صالح";
		if (form.images.length === 0) return "يجب إضافة صورة واحدة على الأقل";
		return null;
	};
	const saveMut = useMutation({
		mutationFn: async () => {
			const err = validate();
			if (err) throw new Error(err);
			const payload = buildPayload();
			if (isNew) return createAdminProduct(payload);
			return updateAdminProduct({
				id,
				...payload
			});
		},
		onSuccess: (res) => {
			toast.success(isNew ? "تم إنشاء المنتج بنجاح" : "تم حفظ التغييرات");
			qc.invalidateQueries({ queryKey: ["admin-products"] });
			qc.invalidateQueries({ queryKey: ["admin-product", id] });
			if (isNew && res && "id" in res) navigate({
				to: "/admin/product/$id",
				params: { id: res.id },
				replace: true
			});
			else setInitial(form);
		},
		onError: (e) => toast.error(e.message)
	});
	const deleteMut = useMutation({
		mutationFn: () => deleteAdminProduct(id),
		onSuccess: () => {
			toast.success("تم الحذف");
			qc.invalidateQueries({ queryKey: ["admin-products"] });
			navigate({
				to: "/admin/products",
				replace: true
			});
		},
		onError: (e) => toast.error(e.message)
	});
	(0, import_react.useEffect)(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (!saveMut.isPending && dirty) saveMut.mutate();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [saveMut, dirty]);
	const analyzeImageMut = useMutation({
		mutationFn: async (base64Image) => {
			return (await analyzeImage({ data: { image: base64Image } })).text;
		},
		onSuccess: (rawResponse) => {
			const parsed = {};
			const regExp = RegExp(/===(TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===\s*([\s\S]*?)(?=\s*===(?:TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===|$)/g);
			let match;
			while ((match = regExp.exec(rawResponse)) !== null) {
				const key = match[1].toUpperCase();
				const val = match[2].trim();
				if (val && val !== "فارغ") parsed[key] = val;
			}
			setForm((f) => ({
				...f,
				name: parsed.TITLE || f.name,
				description: parsed.DESCRIPTION || f.description,
				brand: parsed.BRAND || f.brand,
				color: parsed.COLOR || f.color,
				size: parsed.SIZE || f.size,
				price: parsed.PRICE ? Number(parsed.PRICE) : f.price,
				google_product_category: parsed.G_CAT || f.google_product_category,
				fb_product_category: parsed.FB_CAT || f.fb_product_category,
				condition: parsed.CONDITION === "used" ? "used" : f.condition
			}));
			toast.success("تم تحليل الصورة وتعبئة الحقول تلقائياً!");
		},
		onError: (e) => {
			toast.error(`فشل تحليل الصورة: ${e.message}`);
		}
	});
	const optimizeDescMut = useMutation({
		mutationFn: async (text) => {
			if (!text.trim()) throw new Error("الرجاء كتابة أو لصق نص الوصف أولاً ليتم تحسينه");
			const medicalKeywords = [
				"جهاز طبي",
				"medical device",
				"ضغط الدم",
				"blood pressure",
				"جلوكوز",
				"glucose",
				"ecg",
				"نبض القلب",
				"oximeter",
				"أكسجين الدم",
				"oxygen",
				"مستشفى",
				"hospital",
				"تشخيص طبي",
				"diagnosis",
				"علاج طبي",
				"دواء طبي",
				"medicine",
				"أشعة x",
				"x-ray",
				"موجات فوق صوتية",
				"ultrasound",
				"منظار طبي",
				"endoscope",
				"عملية جراحية",
				"surgery",
				"عيادة طبية",
				"مريض طبي",
				"مختبر طبي",
				"laboratory test",
				"فحص طبي",
				"ترمومتر طبي",
				"stethoscope",
				"سماعة طبية",
				"حقنة طبية",
				"syringe",
				"medical needle",
				"إبرة طبية",
				"insulin",
				"أنسولين",
				"كولسترول",
				"cholesterol"
			];
			const lower = text.toLowerCase();
			if (medicalKeywords.some((kw) => lower.includes(kw))) throw new Error("تحذير: تم اكتشاف كلمات تشير إلى جهاز أو مستحضر طبي محظور في Meta!");
			let cleaned = text.replace(/(\+?967|00967)?[\s\-]?(7\d{8}|\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/g, "").replace(/اندكس\s*ستور|index\s*store|متجر\s*اندكس|للتواصل|للاستفسار|واتساب|whatsapp/gi, "").replace(/(للطلب|للتواصل|للاستفسار|تواصل معنا|اتصل بنا|راسلنا)[^\n]*\n?/gi, "").replace(/\n{3,}/g, "\n\n").trim();
			return (await optimizeDescription({ data: { text: cleaned } })).text;
		},
		onSuccess: (rawResponse) => {
			const parsed = {};
			const regExp = RegExp(/===(TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===\s*([\s\S]*?)(?=\s*===(?:TITLE|DESCRIPTION|BRAND|COLOR|SIZE|G_CAT|FB_CAT|CONDITION|HOOK|BODY|FEATURES|PRICE|SAR)===|$)/g);
			let match;
			while ((match = regExp.exec(rawResponse)) !== null) {
				const key = match[1].toUpperCase();
				const val = match[2].trim();
				if (val && val !== "فارغ") parsed[key] = val;
			}
			const titleStr = parsed.TITLE || "";
			const hookStr = parsed.HOOK || "";
			const rephrasedBody = parsed.BODY || "";
			const featuresText = parsed.FEATURES || "";
			const priceYer = parsed.PRICE || "";
			const priceSar = parsed.SAR || "";
			let formattedDesc = "";
			if (titleStr) formattedDesc += `${titleStr}\n`;
			if (hookStr) formattedDesc += `${hookStr}\n`;
			if (formattedDesc) formattedDesc += "\n";
			if (rephrasedBody) formattedDesc += `${rephrasedBody}\n\n`;
			if (featuresText) {
				featuresText.split("\n").forEach((fl) => {
					const line = fl.trim();
					if (line) formattedDesc += `✅ ${line.replace("✅", "").trim()}\n`;
				});
				formattedDesc += "\n";
			}
			if (priceYer) formattedDesc += `السعر: ${priceYer} ريال يمني\n`;
			if (priceSar) formattedDesc += `ما يعادل: ${priceSar} ريال سعودي`;
			setForm((f) => ({
				...f,
				name: titleStr ? hookStr ? `${titleStr} - ${hookStr}` : titleStr : f.name,
				description: formattedDesc,
				price: priceYer ? Number(priceYer) : f.price,
				google_product_category: parsed.G_CAT || f.google_product_category,
				fb_product_category: parsed.FB_CAT || f.fb_product_category,
				brand: parsed.BRAND || f.brand,
				color: parsed.COLOR || f.color,
				size: parsed.SIZE || f.size
			}));
			toast.success("تمت الصياغة والتسعير الذكي للمنتج بنجاح!");
		},
		onError: (e) => {
			toast.error(e.message);
		}
	});
	const compressAndResizeImage = (file, maxW = 800, maxH = 800) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement("canvas");
					let width = img.width;
					let height = img.height;
					if (width > height) {
						if (width > maxW) {
							height = Math.round(height * maxW / width);
							width = maxW;
						}
					} else if (height > maxH) {
						width = Math.round(width * maxH / height);
						height = maxH;
					}
					canvas.width = width;
					canvas.height = height;
					const ctx = canvas.getContext("2d");
					if (!ctx) {
						resolve(e.target?.result);
						return;
					}
					ctx.drawImage(img, 0, 0, width, height);
					resolve(canvas.toDataURL("image/jpeg", .7));
				};
				img.onerror = () => reject(/* @__PURE__ */ new Error("Failed to load image"));
				img.src = e.target?.result;
			};
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	};
	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const base64 = await compressAndResizeImage(file);
			setForm((f) => ({
				...f,
				images: [base64, ...f.images]
			}));
			analyzeImageMut.mutate(base64);
		} catch (err) {
			toast.error("حدث خطأ أثناء معالجة الصورة");
		}
	};
	const handleAiDrop = async (e) => {
		e.preventDefault();
		setDragOverAi(false);
		const files = Array.from(e.dataTransfer.files ?? []);
		if (files.length > 0) {
			const file = files[0];
			if (!file.type.startsWith("image/")) {
				toast.error("يرجى سحب ملف صورة صالح");
				return;
			}
			try {
				const base64 = await compressAndResizeImage(file);
				setForm((f) => ({
					...f,
					images: [base64, ...f.images]
				}));
				analyzeImageMut.mutate(base64);
			} catch (err) {
				toast.error("حدث خطأ أثناء معالجة الصورة");
			}
			return;
		}
		const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
		if (url && /^https?:\/\//i.test(url.trim())) {
			const cleanUrl = url.trim();
			setForm((f) => ({
				...f,
				images: [cleanUrl, ...f.images]
			}));
			analyzeImageMut.mutate(cleanUrl);
			return;
		}
		toast.error("لم يتم العثور على صورة صالحة");
	};
	const shareWhatsApp = () => {
		const text = encodeURIComponent(`🛍️ *${form.name}*\n\n${form.description}\n\n💰 السعر: ${form.price} ${form.currency}\n\nللطلب والاستفسار تواصل معنا 👇`);
		window.open(`https://wa.me/?text=${text}`, "_blank");
	};
	const shareFacebook = () => {
		const url = `${window.location.origin}/product/${form.slug}`;
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
	};
	const shareInstagram = () => {
		const text = encodeURIComponent(`🛍️ ${form.name}\n\n${form.description}\n\n💰 السعر: ${form.price} ${form.currency}`);
		toast.info("تم نسخ النص لمشاركته يدوياً");
		navigator.clipboard.writeText(decodeURIComponent(text));
	};
	if (!isNew && productQ.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductSkeleton, {});
	const categories = categoriesQ.data ?? [];
	categorySearch && categories.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
	form.old_price && form.old_price > 0 && form.price < form.old_price && Math.round((1 - form.price / form.old_price) * 100);
	const updatedAt = productQ.data?.updated_at;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 pb-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap items-center justify-between gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/products",
						className: "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-surface hover:border-primary transition",
						"aria-label": t("common.back"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: `h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}` })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-black sm:text-2xl",
						children: isNew ? "منتج جديد" : form.name || "بدون اسم"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground",
						children: [dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 text-warning",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-warning" }), "تغييرات غير محفوظة"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1 text-success",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success" }), "محفوظ"]
						}), updatedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), new Date(updatedAt).toLocaleString("ar")]
						})]
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex border-b border-border",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setActiveTab("edit"),
					className: `px-4 py-2.5 text-sm font-bold border-b-2 transition ${activeTab === "edit" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`,
					children: "تفاصيل المنتج (Editor)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setActiveTab("preview"),
					className: `px-4 py-2.5 text-sm font-bold border-b-2 transition ${activeTab === "preview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`,
					children: "معاينة المنتج (Preview)"
				})]
			}),
			activeTab === "edit" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 lg:col-span-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "media",
							title: "📷 صور المنتج",
							subtitle: `${form.images.length} صورة مرفوعة`,
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageManager, {
									value: form.images,
									onChange: (next) => setForm({
										...form,
										images: next
									})
								}), form.images.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-amber-500 flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3.5 w-3.5" }), " أضف صورة رئيسية للمنتج على الأقل ليتم قبوله ومزامنته"]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "video",
							title: "🎥 فيديو المنتج (اختياري)",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: videoInputRef,
									type: "file",
									accept: "video/*",
									className: "hidden",
									onChange: handleVideoChange
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									onDragOver: (e) => e.preventDefault(),
									onDrop: handleVideoDrop,
									onClick: () => videoInputRef.current?.click(),
									className: "rounded-xl border-2 border-dashed border-border p-5 text-center cursor-pointer hover:bg-muted/10 hover:border-primary transition",
									children: uploadingVideo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto h-6 w-6 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold text-muted-foreground",
											children: "جاري رفع ومعالجة الفيديو..."
										})]
									}) : form.video_playback_id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										onClick: (e) => e.stopPropagation(),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mx-auto max-w-xs overflow-hidden rounded-xl border border-border aspect-video bg-black flex items-center justify-center relative",
											children: localVideoUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
												src: localVideoUrl,
												controls: true,
												className: "h-full w-full object-cover"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-center text-xs text-muted-foreground p-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "mx-auto h-5 w-5 mb-1 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["معرف الفيديو النشط: ", form.video_playback_id] })]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: removeVideo,
											className: "rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition",
											children: "إزالة الفيديو"
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Video, { className: "mx-auto h-6 w-6 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold text-muted-foreground",
											children: "اسحب ملف الفيديو هنا، أو انقر للاختيار من الجهاز"
										})]
									})
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							onDragOver: (e) => {
								e.preventDefault();
								setDragOverAi(true);
							},
							onDragLeave: () => setDragOverAi(false),
							onDrop: handleAiDrop,
							className: `rounded-2xl border p-4 space-y-3 transition-all duration-200 ${dragOverAi ? "border-primary bg-primary/10 scale-[1.01]" : "border-primary/30 bg-primary/5"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4 text-primary animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-sm text-primary",
										children: "توليد وصف بالذكاء الاصطناعي"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground leading-relaxed",
									children: "ارفع صورة المنتج بالسحب والإفلات هنا، أو انقر للاختيار لتوليد العنوان والوصف والتصنيف والأسعار تلقائياً!"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "image/*",
										ref: fileInputRef,
										onChange: handleFileChange,
										className: "hidden"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => fileInputRef.current?.click(),
										disabled: analyzeImageMut.isPending,
										className: "flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition disabled:opacity-60",
										children: analyzeImageMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), " جاري تحليل الصورة..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image$1, { className: "h-4 w-4" }), " اختر صورة لتحليلها 🪄"] })
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "info",
							title: "📌 معلومات المنتج",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
										label: "عنوان المنتج *",
										required: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: form.name,
											onChange: (e) => setForm({
												...form,
												name: e.target.value.slice(0, NAME_MAX)
											}),
											placeholder: "مثال: قميص قطني أزرق للرجال",
											className: inputCls
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-bold text-muted-foreground",
											children: "وصف المنتج *"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => optimizeDescMut.mutate(form.description),
											disabled: optimizeDescMut.isPending,
											className: "inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 disabled:opacity-60 transition",
											children: optimizeDescMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }), " جاري التحسين والتسعير..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }), " تحسين وتسعير ذكي 🪄"] })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
										label: "",
										hint: "ادخل تفاصيل المنتج والسعر هنا ثم اضغط تحسين ذكي",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											value: form.description,
											onChange: (e) => setForm({
												...form,
												description: e.target.value.slice(0, DESC_MAX)
											}),
											rows: 6,
											placeholder: "اكتب وصفاً واضحاً للمنتج...",
											className: inputCls
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
										label: "العلامة التجارية",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: form.brand,
											onChange: (e) => setForm({
												...form,
												brand: e.target.value
											}),
											placeholder: "مثال: Samsung",
											className: inputCls
										})
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "pricing",
							title: "💰 السعر والتوفر",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "السعر *",
											required: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												value: form.price || "",
												onChange: (e) => setForm({
													...form,
													price: Number(e.target.value)
												}),
												placeholder: "0.00",
												className: inputCls,
												dir: "ltr"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "العملة",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: form.currency,
												onChange: (e) => setForm({
													...form,
													currency: e.target.value
												}),
												className: inputCls,
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "YER",
														children: "YER (ريال يمني)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "SAR",
														children: "SAR (ريال سعودي)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "USD",
														children: "USD (دولار أمريكي)"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "AED",
														children: "AED (درهم إماراتي)"
													})
												]
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "حالة التوفر",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: form.availability,
												onChange: (e) => setForm({
													...form,
													availability: e.target.value
												}),
												className: inputCls,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "in stock",
													children: "متوفر في المخزن (in stock)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "out of stock",
													children: "نفد المخزون (out of stock)"
												})]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "حالة المنتج",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: form.condition,
												onChange: (e) => setForm({
													...form,
													condition: e.target.value
												}),
												className: inputCls,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "new",
													children: "جديد (new)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "used",
													children: "مستعمل (used)"
												})]
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
										label: "الكمية المتاحة",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											value: form.stock || "",
											onChange: (e) => setForm({
												...form,
												stock: Number(e.target.value)
											}),
											placeholder: "1",
											className: inputCls,
											dir: "ltr"
										})
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "meta-specs",
							title: "📂 تفاصيل إضافية (Meta Catalog)",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "فئة منتج Google",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: form.google_product_category,
												onChange: (e) => setForm({
													...form,
													google_product_category: e.target.value
												}),
												placeholder: "Apparel & Accessories > Clothing",
												className: inputCls
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "فئة منتج Facebook",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: form.fb_product_category,
												onChange: (e) => setForm({
													...form,
													fb_product_category: e.target.value
												}),
												placeholder: "Clothing & Accessories > Clothing",
												className: inputCls
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "اللون",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: form.color,
												onChange: (e) => setForm({
													...form,
													color: e.target.value
												}),
												placeholder: "أزرق، أسود...",
												className: inputCls
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
											label: "المقاس",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: form.size,
												onChange: (e) => setForm({
													...form,
													size: e.target.value
												}),
												placeholder: "L, XL, 42...",
												className: inputCls
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
										label: "رابط صفحة المنتج (Source URL)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: form.source_url,
											onChange: (e) => setForm({
												...form,
												source_url: e.target.value
											}),
											placeholder: "https://...",
											className: inputCls,
											dir: "ltr"
										})
									})
								]
							})
						}),
						!isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "sharing",
							title: "📤 مشاركة المنتج والترويج",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: shareWhatsApp,
										className: "flex flex-col items-center justify-center p-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] hover:bg-[#25D366]/10 transition",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-5 w-5 mb-1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-bold",
											children: "واتساب"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: shareFacebook,
										className: "flex flex-col items-center justify-center p-3 rounded-xl border border-[#1877F2]/30 bg-[#1877F2]/5 text-[#1877F2] hover:bg-[#1877F2]/10 transition",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-5 w-5 mb-1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-bold",
											children: "فيسبوك"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: shareInstagram,
										className: "flex flex-col items-center justify-center p-3 rounded-xl border border-[#E1306C]/30 bg-[#E1306C]/5 text-[#E1306C] hover:bg-[#E1306C]/10 transition",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-5 w-5 mb-1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-bold",
											children: "انستقرام"
										})]
									})
								]
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "seo",
							title: "SEO ومحركات البحث",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
									label: "رابط مخصص (Slug)",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											value: form.slug,
											onChange: (e) => {
												setSlugTouched(true);
												setForm({
													...form,
													slug: e.target.value
												});
											},
											className: `${inputCls} font-mono`,
											dir: "ltr"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setSlugTouched(true);
												setForm({
													...form,
													slug: slugify(form.name)
												});
											},
											className: "shrink-0 rounded-xl border border-border px-3 text-xs font-bold hover:border-primary",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WandSparkles, { className: "h-3.5 w-3.5" })
										})]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GooglePreview, {
										slug: form.slug,
										title: form.name,
										description: form.description
									})
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "model3d",
							title: "النموذج ثلاثي الأبعاد",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ai3dGeneratorPanel, {
								images: form.images,
								currentModelUrl: form.model_3d_url || form.model_url || void 0,
								currentModelThumbnail: form.model_3d_thumbnail || void 0,
								currentModelStatus: form.model_3d_status || void 0,
								onGenerated: (url, thumb, status) => {
									setForm((f) => ({
										...f,
										model_3d_url: url,
										model_url: url,
										model_3d_thumbnail: thumb,
										model_3d_status: status
									}));
									if (!isNew) setTimeout(() => saveMut.mutate(), 100);
								}
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "publish",
							title: "حالة النشر والترخيص",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setForm({
											...form,
											is_published: true
										}),
										className: `rounded-xl border p-3 text-start transition ${form.is_published ? "border-success bg-success/10" : "border-border bg-surface"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs font-black text-white",
											children: "منشور"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[11px] text-muted-foreground",
											children: "يظهر بالمتجر"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setForm({
											...form,
											is_published: false
										}),
										className: `rounded-xl border p-3 text-start transition ${!form.is_published ? "border-warning bg-warning/10" : "border-border bg-surface"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-xs font-black text-white",
											children: "مسودة"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "block text-[11px] text-muted-foreground",
											children: "مخفي بالمتجر"
										})]
									})]
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleCard, {
							id: "meta-sync-card",
							title: "مزامنة Meta",
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "h-4 w-4" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "حالة المزامنة",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: form.meta_sync_status,
									onChange: (e) => setForm({
										...form,
										meta_sync_status: e.target.value
									}),
									className: inputCls,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "not_synced",
											children: "بانتظار المزامنة (not_synced)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "syncing",
											children: "جاري المزامنة (syncing)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "synced",
											children: "متزامن (synced)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "failed",
											children: "فشل المزامنة (failed)"
										})
									]
								})
							})
						})
					]
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductPreviewView, {
				form,
				categories
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-w-0 text-xs text-muted-foreground",
						children: saveMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3 w-3 animate-spin" }), " جاري الحفظ..."]
						}) : dirty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تغييرات غير محفوظة · اضغط حفظ للتأكيد" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "لا تغييرات" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [!isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								if (confirm(`حذف "${form.name}"؟`)) deleteMut.mutate();
							},
							disabled: deleteMut.isPending,
							className: "inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/20 transition disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "حذف" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => saveMut.mutate(),
							disabled: saveMut.isPending || !dirty && !isNew,
							className: "inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-60 transition",
							children: [saveMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-4 w-4" }), isNew ? "إنشاء المنتج" : "حفظ التغييرات"]
						})]
					})]
				})
			})
		]
	});
}
var inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary transition duration-200 mt-1";
function FormField({ label, children, required, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			label && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs font-bold text-muted-foreground flex items-center gap-1",
				children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-destructive",
					children: "*"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children }),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-1 block text-[10px] text-muted-foreground",
				children: hint
			})
		]
	});
}
function ProductSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-1/3 animate-pulse rounded-lg bg-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4 lg:col-span-3",
				children: [
					1,
					2,
					3
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-2xl bg-muted/50" }, i))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4 lg:col-span-2",
				children: [1, 2].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-2xl bg-muted/50" }, i))
			})]
		})]
	});
}
function ProductPreviewView({ form, categories }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-2xl border border-border bg-surface/30 p-6 space-y-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 md:grid-cols-2",
			children: [form.images[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "aspect-[4/3] rounded-2xl overflow-hidden bg-muted",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: form.images[0],
					alt: form.name,
					className: "h-full w-full object-cover"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-black text-white",
						children: form.name || "بدون اسم"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs text-primary font-bold",
							children: [
								form.price,
								" ",
								form.currency
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded bg-white/10 px-2 py-0.5 text-xs text-muted-foreground",
							children: categories.find((c) => c.id === form.category_id)?.name || "بدون تصنيف"
						})]
					}),
					form.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed",
						children: form.description
					})
				]
			})]
		})
	});
}
//#endregion
export { ProductDetailPage as component };
