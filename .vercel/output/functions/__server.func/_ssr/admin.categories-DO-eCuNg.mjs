import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { G as LoaderCircle, O as Save, P as Plus, m as Trash2, ot as Eye, rt as FolderTree, st as EyeOff, tt as GripVertical } from "../_libs/lucide-react.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { c as listAdminProducts, d as updateAdminCategory, r as deleteAdminCategory, s as listAdminCategories, t as createAdminCategory } from "./admin.actions-CN1SCjW3.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as ReorderGroup, t as ReorderItem } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.categories-DO-eCuNg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emptyDraft = {
	slug: "",
	name: "",
	description: "",
	image_url: "",
	icon: "",
	color: "",
	parent_id: "",
	sort: 0,
	is_active: true
};
function CategoriesPage() {
	const qc = useQueryClient();
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [editDraft, setEditDraft] = (0, import_react.useState)(emptyDraft);
	const q = useQuery({
		queryKey: ["admin-categories"],
		queryFn: () => listAdminCategories()
	});
	const productsQ = useQuery({
		queryKey: ["admin-products"],
		queryFn: () => listAdminProducts()
	});
	const [categories, setCategories] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (q.data) setCategories(q.data);
	}, [q.data]);
	const invalidate = () => {
		qc.invalidateQueries({ queryKey: ["admin-categories"] });
	};
	const createMut = useMutation({
		mutationFn: () => createAdminCategory({
			slug: draft.slug.trim(),
			name: draft.name.trim(),
			description: draft.description || null,
			image_url: draft.image_url || null,
			icon: draft.icon || null,
			color: draft.color || null,
			parent_id: draft.parent_id || null,
			sort: Number(draft.sort),
			is_active: draft.is_active
		}),
		onSuccess: () => {
			toast.success("تم إضافة التصنيف");
			setCreating(false);
			setDraft(emptyDraft);
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const updateMut = useMutation({
		mutationFn: (id) => updateAdminCategory({
			id,
			slug: editDraft.slug.trim(),
			name: editDraft.name.trim(),
			description: editDraft.description || null,
			image_url: editDraft.image_url || null,
			icon: editDraft.icon || null,
			color: editDraft.color || null,
			parent_id: editDraft.parent_id || null,
			sort: Number(editDraft.sort),
			is_active: editDraft.is_active
		}),
		onSuccess: () => {
			toast.success("تم الحفظ");
			setEditingId(null);
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const toggleMut = useMutation({
		mutationFn: (v) => updateAdminCategory({
			id: v.id,
			is_active: v.is_active
		}),
		onSuccess: () => invalidate(),
		onError: (e) => toast.error(e.message)
	});
	const saveOrderMut = useMutation({
		mutationFn: async (ordered) => {
			for (let i = 0; i < ordered.length; i++) {
				const cat = ordered[i];
				if (cat.sort !== i) await updateAdminCategory({
					id: cat.id,
					sort: i
				});
			}
		},
		onSuccess: () => {
			toast.success("تم حفظ الترتيب الجديد");
			invalidate();
		},
		onError: (e) => toast.error(`تعذر حفظ الترتيب: ${e.message}`)
	});
	const deleteMut = useMutation({
		mutationFn: (id) => deleteAdminCategory(id),
		onSuccess: () => {
			toast.success("تم حذف التصنيف");
			invalidate();
		},
		onError: (e) => toast.error(`تعذّر الحذف: ${e.message} (قد يحتوي التصنيف على منتجات)`)
	});
	const products = productsQ.data ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-black lg:text-4xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "neon-text",
						children: "التصنيفات"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: q.isLoading ? "جارٍ التحميل..." : `${categories.length} تصنيف`
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						setCreating((v) => !v);
						setDraft(emptyDraft);
					},
					className: "inline-flex items-center gap-2 rounded-xl gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4" }), "تصنيف جديد"]
				})]
			}),
			creating && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-5 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-black",
						children: "إنشاء تصنيف"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DraftForm, {
						draft,
						setDraft,
						categories
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setCreating(false),
							className: "rounded-lg border border-border px-3 py-1.5 text-xs font-bold",
							children: "إلغاء"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => createMut.mutate(),
							disabled: createMut.isPending || !draft.name || !draft.slug,
							className: "inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60",
							children: [createMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-3.5 w-3.5" }), "حفظ"]
						})]
					})
				]
			}),
			q.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass p-8 text-center text-destructive",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: q.error.message
				})
			}) : q.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass p-12 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto h-6 w-6 animate-spin text-primary" })
			}) : categories.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-12 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderTree, { className: "h-7 w-7 text-primary" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "لا توجد تصنيفات"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "text-xs text-muted-foreground border-b border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "w-8" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-start p-3",
								children: "الاسم"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-start p-3",
								children: "Slug"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-start p-3",
								children: "الأب"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-start p-3",
								children: "الحالة"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-end p-3",
								children: "إجراءات"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReorderGroup, {
						values: categories,
						onReorder: (newOrder) => {
							setCategories(newOrder);
							saveOrderMut.mutate(newOrder);
						},
						as: "tbody",
						children: categories.map((c) => {
							const editing = editingId === c.id;
							const productCount = products.filter((p) => p.category_id === c.id).length;
							return editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
								className: "border-b border-border/40 align-top bg-surface/30",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									colSpan: 6,
									className: "p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DraftForm, {
										draft: editDraft,
										setDraft: setEditDraft,
										categories: categories.filter((k) => k.id !== c.id)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-end gap-2 mt-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setEditingId(null),
											className: "rounded-lg border border-border px-3 py-1.5 text-xs font-bold",
											children: "إلغاء"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => updateMut.mutate(c.id),
											disabled: updateMut.isPending,
											className: "inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground",
											children: [updateMut.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "h-3.5 w-3.5" }), "حفظ"]
										})]
									})]
								})
							}, c.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReorderItem, {
								value: c,
								as: "tr",
								className: "border-b border-border/40 align-middle bg-card hover:bg-muted/10 transition",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 text-center align-middle",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "h-3.5 w-3.5 text-muted-foreground/60 cursor-grab active:cursor-grabbing" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 font-bold align-middle",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [c.image_url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: c.image_url,
												alt: "",
												className: "h-7 w-7 rounded-lg object-cover border border-border",
												onError: (e) => {
													e.currentTarget.style.display = "none";
												}
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "block text-[10px] font-normal text-muted-foreground",
												children: [productCount, " منتج"]
											})] })]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 font-mono text-xs text-muted-foreground align-middle",
										children: c.slug
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 text-xs align-middle",
										children: categories.find((k) => k.id === c.parent_id)?.name ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 align-middle",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full px-2 py-0.5 text-[10px] font-bold ${c.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`,
											children: c.is_active ? "مفعّل" : "معطّل"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "p-3 align-middle",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex justify-end gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => toggleMut.mutate({
														id: c.id,
														is_active: !c.is_active
													}),
													className: "grid h-7 w-7 place-items-center rounded-lg hover:bg-accent",
													title: c.is_active ? "تعطيل" : "تفعيل",
													children: c.is_active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3.5 w-3.5" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => {
														setEditingId(c.id);
														setEditDraft({
															slug: c.slug,
															name: c.name,
															description: c.description ?? "",
															image_url: c.image_url ?? "",
															icon: c.icon ?? "",
															color: c.color ?? "",
															parent_id: c.parent_id ?? "",
															sort: c.sort ?? 0,
															is_active: c.is_active
														});
													},
													className: "rounded-lg px-2 py-1 text-xs font-bold hover:bg-accent",
													children: "تعديل"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => {
														if (confirm(`حذف "${c.name}"؟`)) deleteMut.mutate(c.id);
													},
													className: "grid h-7 w-7 place-items-center rounded-lg text-destructive hover:bg-destructive/10",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3.5 w-3.5" })
												})
											]
										})
									})
								]
							}, c.id);
						})
					})]
				})
			})
		]
	});
}
var inputCls = "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
function DraftForm({ draft, setDraft, categories }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 sm:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "الاسم"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.name,
					onChange: (e) => setDraft({
						...draft,
						name: e.target.value
					}),
					className: `${inputCls} mt-1`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "Slug"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.slug,
					onChange: (e) => setDraft({
						...draft,
						slug: e.target.value
					}),
					className: `${inputCls} mt-1 font-mono`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block sm:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "رابط صورة الفئة (Image URL)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.image_url,
					onChange: (e) => setDraft({
						...draft,
						image_url: e.target.value
					}),
					className: `${inputCls} mt-1`,
					placeholder: "https://example.com/image.jpg"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block sm:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "الوصف"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.description,
					onChange: (e) => setDraft({
						...draft,
						description: e.target.value
					}),
					className: `${inputCls} mt-1`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "الأب"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: draft.parent_id,
					onChange: (e) => setDraft({
						...draft,
						parent_id: e.target.value
					}),
					className: `${inputCls} mt-1`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "— لا يوجد —"
					}), categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: c.id,
						children: c.name
					}, c.id))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "ترتيب العرض"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					value: draft.sort,
					onChange: (e) => setDraft({
						...draft,
						sort: Number(e.target.value)
					}),
					className: `${inputCls} mt-1`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "أيقونة"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.icon,
					onChange: (e) => setDraft({
						...draft,
						icon: e.target.value
					}),
					className: `${inputCls} mt-1`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-bold text-muted-foreground",
					children: "لون"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft.color,
					onChange: (e) => setDraft({
						...draft,
						color: e.target.value
					}),
					className: `${inputCls} mt-1`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "flex items-center gap-2 sm:col-span-2 rounded-xl bg-surface p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: draft.is_active,
					onChange: (e) => setDraft({
						...draft,
						is_active: e.target.checked
					}),
					className: "h-4 w-4"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-bold",
					children: "مفعّل"
				})]
			})
		]
	});
}
//#endregion
export { CategoriesPage as component };
