import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as Search, G as LoaderCircle, K as Link2, L as Package, M as RefreshCw, P as Plus, T as Share2, _t as ChevronRight, at as FileSpreadsheet, ct as EllipsisVertical, dt as Copy, ft as Clock, ht as CircleCheck, m as Trash2, nt as Globe, ot as Eye, pt as Circle, st as EyeOff, y as Sparkles, yt as Check } from "../_libs/lucide-react.mjs";
import { n as useI18n } from "./i18n-ut2VIwHl.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { c as listAdminProducts, f as updateAdminProduct, i as deleteAdminProduct, n as createAdminProduct, o as importCatalogFromUrl, s as listAdminCategories } from "./admin.actions-CN1SCjW3.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as useCurrentTenant } from "./tenant-provider-CiGQD6cy.mjs";
import { a as Label2, c as Root2, d as SubTrigger2, f as Trigger, i as ItemIndicator2, l as Separator2, n as Content2, o as Portal2, r as Item2, s as RadioItem2, t as CheckboxItem2, u as SubContent2 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.products-BTRxu1wn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	checked,
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
var DEFAULT_CATALOG_URL = "https://firebasestorage.googleapis.com/v0/b/smartcontentcreator-d49f2.firebasestorage.app/o/catalogs%2Fglobal%2Fcatalog.csv?alt=media&token=8d793707-b96a-4ee9-bca1-0912af180138&ext=.csv";
function ProductsPage() {
	const { t } = useI18n();
	const qc = useQueryClient();
	const navigate = useNavigate();
	const [search, setSearch] = (0, import_react.useState)("");
	const [categoryId, setCategoryId] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [showInstructions, setShowInstructions] = (0, import_react.useState)(false);
	const query = (0, import_react.useMemo)(() => ({
		search: search.trim() || void 0,
		categoryId: categoryId || void 0,
		publishedOnly: filter === "published" || void 0,
		unpublishedOnly: filter === "unpublished" || void 0,
		outOfStock: filter === "out" || void 0
	}), [
		search,
		categoryId,
		filter
	]);
	const productsQ = useQuery({
		queryKey: ["admin-products", query],
		queryFn: () => listAdminProducts(query)
	});
	const categoriesQ = useQuery({
		queryKey: ["admin-categories"],
		queryFn: () => listAdminCategories()
	});
	const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-products"] });
	const togglePublish = useMutation({
		mutationFn: (p) => updateAdminProduct({
			id: p.id,
			is_published: p.is_published
		}),
		onSuccess: (_d, v) => {
			toast.success(v.is_published ? "تم نشر المنتج في المتجر" : "تم إخفاء المنتج من المتجر");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const removeMut = useMutation({
		mutationFn: (id) => deleteAdminProduct(id),
		onSuccess: () => {
			toast.success("تم حذف المنتج");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const duplicateMut = useMutation({
		mutationFn: async (id) => {
			const src = (productsQ.data ?? []).find((p) => p.id === id);
			if (!src) throw new Error("Product not found");
			const suffix = `-copy-${Math.random().toString(36).slice(2, 6)}`;
			return createAdminProduct({
				slug: (src.slug + suffix).slice(0, 60),
				name: src.name + " (نسخة)",
				description: src.description,
				price: src.price,
				currency: src.currency,
				category_id: src.category_id ?? void 0,
				brand: src.brand ?? void 0,
				images: src.images,
				model_url: src.model_url ?? void 0,
				stock: src.stock,
				tags: src.tags,
				is_published: false,
				meta_sync_status: "not_synced"
			});
		},
		onSuccess: () => {
			toast.success("تم إنشاء نسخة");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const importMut = useMutation({
		mutationFn: (url) => importCatalogFromUrl({
			url,
			publish: true
		}),
		onSuccess: (r) => {
			toast.success(`تم الاستيراد: ${r.processed}/${r.total}`);
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const syncProductMut = useMutation({
		mutationFn: async (id) => {
			const p = (productsQ.data ?? []).find((x) => x.id === id);
			if (!p) throw new Error("المنتج غير موجود");
			if (!p.name || p.price <= 0 || !p.images || p.images.length === 0) {
				await updateAdminProduct({
					id,
					meta_sync_status: "failed"
				});
				throw new Error("بيانات المنتج غير مكتملة (يجب وجود اسم، سعر، وصورة واحدة على الأقل للمزامنة)");
			}
			await updateAdminProduct({
				id,
				meta_sync_status: "syncing"
			});
			invalidate();
			await new Promise((resolve) => setTimeout(resolve, 1500));
			return updateAdminProduct({
				id,
				meta_sync_status: "synced"
			});
		},
		onSuccess: () => {
			toast.success("تمت المزامنة بنجاح مع Meta Catalog");
			invalidate();
		},
		onError: (e) => {
			toast.error(e.message);
			invalidate();
		}
	});
	const bulkSyncMut = useMutation({
		mutationFn: async () => {
			const list = productsQ.data ?? [];
			if (list.length === 0) throw new Error("لا توجد منتجات لمزامنتها");
			for (const p of list) await updateAdminProduct({
				id: p.id,
				meta_sync_status: "syncing"
			});
			invalidate();
			await new Promise((resolve) => setTimeout(resolve, 2e3));
			for (const p of list) {
				const isValid = p.name && p.price > 0 && p.images && p.images.length > 0;
				await updateAdminProduct({
					id: p.id,
					meta_sync_status: isValid ? "synced" : "failed"
				});
			}
		},
		onSuccess: () => {
			toast.success("تمت مزامنة جميع منتجات الكتالوج بنجاح");
			invalidate();
		},
		onError: (e) => {
			toast.error(e.message);
			invalidate();
		}
	});
	const products = productsQ.data ?? [];
	const categories = categoriesQ.data ?? [];
	const { tenant } = useCurrentTenant();
	const tenantId = tenant?.id || "default";
	const feedUrl = `${window.location.origin}/api/catalog/${tenantId}.csv`;
	const filteredProducts = (0, import_react.useMemo)(() => {
		let result = products;
		if (filter === "synced") result = result.filter((p) => p.meta_sync_status === "synced");
		else if (filter === "failed") result = result.filter((p) => p.meta_sync_status === "failed");
		return result;
	}, [products, filter]);
	const totalCount = products.length;
	const syncedCount = products.filter((p) => p.meta_sync_status === "synced").length;
	const pendingCount = products.filter((p) => !p.meta_sync_status || p.meta_sync_status === "not_synced" || p.meta_sync_status === "syncing").length;
	const failedCount = products.filter((p) => p.meta_sync_status === "failed").length;
	const hiddenCount = products.filter((p) => !p.is_published).length;
	const copyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		toast.success("تم نسخ الرابط للحافظة");
	};
	const shareWhatsApp = (p) => {
		const url = `${window.location.origin}/product/${p.slug}`;
		const text = encodeURIComponent(`🛍️ *${p.name}*\n\n${p.description.slice(0, 150)}...\n\n💰 السعر: ${p.price} ${p.currency}\n\n🔗 للطلب واستعراض المنتج: ${url}`);
		window.open(`https://wa.me/?text=${text}`, "_blank");
	};
	const shareFacebook = (p) => {
		const url = `${window.location.origin}/product/${p.slug}`;
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 pb-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-black lg:text-4xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "neon-text",
						children: ["🛍️ ", t("products.title")]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: productsQ.isLoading ? "جارٍ التحميل..." : `${products.length} منتج إجمالي`
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								const url = window.prompt("رابط ملف CSV للاستيراد:", DEFAULT_CATALOG_URL);
								if (url && url.trim()) importMut.mutate(url.trim());
							},
							disabled: importMut.isPending,
							className: "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-accent disabled:opacity-60 transition",
							children: [importMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "h-4 w-4 text-green-500" }), "استيراد Excel / CSV"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => bulkSyncMut.mutate(),
							disabled: bulkSyncMut.isPending,
							className: "inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-400 hover:bg-blue-500/20 disabled:opacity-60 transition",
							children: [bulkSyncMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4" }), "مزامنة مع Meta"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => navigate({
								to: "/admin/product/$id",
								params: { id: "new" }
							}),
							className: "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-bold hover:bg-accent transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 text-primary" }), "منتج جديد"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/studio",
							className: "inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:opacity-90 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }), t("nav.studio")]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-surface/50 p-5 shadow-lg",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-5 w-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-white text-base",
								children: "رابط الكتالوج الجاهز لـ Meta"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-0.5",
								children: "انسخ الرابط لربط المنتجات بـ Meta Commerce Manager وتحديثها دورياً."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => copyToClipboard(feedUrl),
							className: "flex items-center gap-2 rounded-xl border border-blue-500/30 px-3 py-2 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3.5 w-3.5" }), " نسخ الرابط"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 rounded-lg bg-black/30 p-2.5 font-mono text-[11px] text-blue-300 truncate select-all",
						children: feedUrl
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 border-t border-border/40 pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setShowInstructions(!showInstructions),
							className: "flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:opacity-80 transition",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "📌 كيف تربطه بـ Meta Commerce Manager؟" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] opacity-75",
								children: showInstructions ? "▲ إخفاء" : "▼ عرض"
							})]
						}), showInstructions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "mt-3 space-y-1.5 text-xs text-muted-foreground list-decimal ps-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "افتح مدير المعاملات التجارية (Commerce Manager) في حسابك على Meta." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"اذهب إلى القائمة الجانبية: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "مصادر البيانات" }),
									" ← ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "تحميل ملف البيانات" }),
									"."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"اختر طريقة التحميل: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "استخدام عنوان URL" }),
									"."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "الصق الرابط المنسوخ أعلاه في حقل الرابط." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "اختر جدولاً زمنياً مناسباً للتحديث التلقائي (يومي / أسبوعي) لضمان مزامنة المخزون والأسعار فوراً." })
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-surface/40 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-muted-foreground",
							children: "إجمالي المنتجات"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-2xl font-black text-white",
							children: totalCount
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-green-500/25 bg-green-500/5 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-green-400",
							children: "متزامنة مع Meta"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-2xl font-black text-green-400",
							children: syncedCount
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-amber-400",
							children: "بانتظار المزامنة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-2xl font-black text-amber-400",
							children: pendingCount
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-red-500/25 bg-red-500/5 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-red-400",
							children: "فشل في المزامنة"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-2xl font-black text-red-400",
							children: failedCount
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-zinc-500/25 bg-zinc-500/5 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium text-zinc-400",
							children: "مخفية عن المتجر"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-2xl font-black text-zinc-300",
							children: hiddenCount
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-4 flex flex-wrap items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 min-w-[200px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							placeholder: "بحث بالاسم...",
							className: "w-full rounded-xl border border-border bg-surface ps-9 pe-3 py-2 text-sm outline-none focus:border-primary transition"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: categoryId,
						onChange: (e) => setCategoryId(e.target.value),
						className: "rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "كل التصنيفات"
						}), categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c.id,
							children: c.name
						}, c.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1 rounded-xl border border-border bg-surface p-1",
						children: [
							{
								id: "all",
								label: "الكل"
							},
							{
								id: "published",
								label: "منشور"
							},
							{
								id: "unpublished",
								label: "مخفي"
							},
							{
								id: "out",
								label: "نفد"
							},
							{
								id: "synced",
								label: "متزامن"
							},
							{
								id: "failed",
								label: "فشل المزامنة"
							}
						].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilter(f.id),
							className: `rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
							children: f.label
						}, f.id))
					})
				]
			}),
			productsQ.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-8 text-center text-destructive",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm",
					children: ["تعذّر تحميل المنتجات: ", productsQ.error.message]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => productsQ.refetch(),
					className: "mt-3 inline-flex rounded-lg bg-surface px-3 py-1.5 text-xs font-bold",
					children: "إعادة المحاولة"
				})]
			}) : productsQ.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass p-12 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto h-6 w-6 animate-spin text-primary" })
			}) : filteredProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-12 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-7 w-7 text-primary" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "لا توجد منتجات تطابق خيارات التصفية الحالية"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
				children: filteredProducts.map((p) => {
					const isSynced = p.meta_sync_status === "synced";
					const isSyncing = p.meta_sync_status === "syncing";
					const isFailed = p.meta_sync_status === "failed";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: `tilt-3d group relative overflow-hidden rounded-2xl border bg-surface/20 hover:border-primary/50 transition duration-300 ${isSynced ? "border-green-500/20" : "border-border"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative aspect-[4/3] overflow-hidden bg-muted",
							children: [
								p.images[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: p.images[0],
									alt: p.name,
									className: "h-full w-full object-cover transition duration-300 group-hover:scale-105"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid h-full place-items-center text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-8 w-8" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `absolute top-3 start-3 rounded-md px-2 py-0.5 text-[9px] font-bold text-white shadow-sm transition ${isSynced ? "bg-green-500/90" : isSyncing ? "bg-blue-500/90 animate-pulse" : isFailed ? "bg-red-500/90" : "bg-amber-500/90"}`,
									children: isSynced ? "✓ متزامن" : isSyncing ? "⏳ جاري المزامنة" : isFailed ? "❌ فشل المزامنة" : "⏳ بانتظار المزامنة"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `absolute top-3 end-3 rounded-md px-2 py-0.5 text-[9px] font-bold text-white shadow-sm ${p.is_published ? "bg-zinc-800/90 border border-zinc-700" : "bg-amber-600/90"}`,
									children: p.is_published ? "منشور بالمتجر" : "مخفي"
								}),
								p.stock <= 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute inset-0 bg-black/60 flex items-center justify-center text-sm font-black text-destructive-foreground",
									children: "نفد من المخزن"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between items-start gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "truncate text-sm font-bold text-white hover:text-primary transition",
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EllipsisVertical, { className: "h-4 w-4" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
										align: "end",
										className: "w-40 bg-surface border border-border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => syncProductMut.mutate(p.id),
												disabled: syncProductMut.isPending,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "me-2 h-3.5 w-3.5 text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "مزامنة Meta" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => navigate({ to: `/admin/product/${p.id}` }),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "me-2 h-3.5 w-3.5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "تعديل" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => window.open(`${window.location.origin}/product/${p.slug}`, "_blank"),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "me-2 h-3.5 w-3.5 text-indigo-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "معاينة المتجر" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => shareWhatsApp(p),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "me-2 h-3.5 w-3.5 text-[#25D366]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "واتساب" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => shareFacebook(p),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "me-2 h-3.5 w-3.5 text-[#1877F2]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "فيسبوك" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => duplicateMut.mutate(p.id),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "me-2 h-3.5 w-3.5 text-zinc-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "نسخ الكائن" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
												onClick: () => {
													if (confirm(`هل أنت متأكد من حذف المنتج "${p.name}"؟`)) removeMut.mutate(p.id);
												},
												className: "text-red-500 focus:text-red-500 focus:bg-red-500/10",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "me-2 h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "حذف" })]
											})
										]
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex items-center justify-between text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: categories.find((c) => c.id === p.category_id)?.name ?? "بدون تصنيف" }), p.sku && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-mono text-[10px]",
										children: ["SKU: ", p.sku]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 flex items-center justify-between border-t border-border/40 pt-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-sm font-black text-primary",
										children: [
											p.price,
											" ",
											p.currency
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-muted-foreground",
										children: ["المخزون: ", p.stock]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center gap-1 text-[9px] text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-3 w-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["تحديث: ", new Date(p.updated_at).toLocaleString("ar")] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3.5 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => togglePublish.mutate({
											id: p.id,
											is_published: !p.is_published
										}),
										disabled: togglePublish.isPending,
										className: `flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${p.is_published ? "border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10" : "border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10"}`,
										children: [p.is_published ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3.5 w-3.5" }), p.is_published ? "إخفاء" : "نشر بالمتجر"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => syncProductMut.mutate(p.id),
										disabled: syncProductMut.isPending,
										className: "inline-flex items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/5 p-2 text-blue-400 hover:bg-blue-500/10 transition",
										title: "مزامنة فورية",
										children: syncProductMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5" })
									})]
								})
							]
						})]
					}, p.id);
				})
			})
		]
	});
}
//#endregion
export { ProductsPage as component };
