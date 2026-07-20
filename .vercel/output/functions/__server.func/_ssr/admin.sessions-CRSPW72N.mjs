import { c as require_jsx_runtime } from "../_libs/@astryxdesign/core+[...].mjs";
import { C as ShieldCheck, j as Rocket, ot as Eye, u as Upload, ut as Cpu } from "../_libs/lucide-react.mjs";
import { n as useI18n } from "./i18n-ut2VIwHl.mjs";
import { t as useAdmin } from "./admin-store-NQ8cLToP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.sessions-CRSPW72N.js
var import_jsx_runtime = require_jsx_runtime();
var steps = [
	"upload",
	"processing",
	"review",
	"approved",
	"published"
];
function SessionsPage() {
	const { t, lang } = useI18n();
	const sessions = useAdmin((s) => s.sessions);
	const update = useAdmin((s) => s.updateSession);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-black lg:text-4xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "neon-text",
				children: t("sessions.title")
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted-foreground",
			children: lang === "ar" ? "تتبع خط إنتاج الذكاء الاصطناعي للمنتجات." : "AI product pipeline tracking."
		})] }), sessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl glass p-12 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: lang === "ar" ? "لا توجد جلسات بعد" : "No sessions yet"
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: sessions.map((s) => {
				const idx = steps.indexOf(s.step);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl glass p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "truncate text-sm font-black",
									children: s.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: new Date(s.createdAt).toLocaleString()
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary",
								children: t(`sessions.step.${s.step}`)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 grid grid-cols-5 gap-2",
							children: steps.map((step, i) => {
								const Icon = [
									Upload,
									Cpu,
									Eye,
									ShieldCheck,
									Rocket
								][i];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => update(s.id, { step }),
									className: `relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-[10px] font-bold transition ${i <= idx ? "border-primary/40 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent"} ${i === idx ? "neon-ring" : ""}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: t(`sessions.step.${step}`)
									})]
								}, step);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 h-1.5 overflow-hidden rounded-full bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full gradient-brand transition-all",
								style: { width: `${(idx + 1) / steps.length * 100}%` }
							})
						})
					]
				}, s.id);
			})
		})]
	});
}
//#endregion
export { SessionsPage as component };
