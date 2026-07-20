import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { R as Moon, g as Sun, i as Zap, yt as Check } from "../_libs/lucide-react.mjs";
import { n as useI18n } from "./i18n-ut2VIwHl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.settings-DorA5v0I.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const { t, lang, setLang } = useI18n();
	const [theme, setTheme] = (0, import_react.useState)("light");
	const [api, setApi] = (0, import_react.useState)("");
	const [saved, setSaved] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		const th = localStorage.getItem("noqta:theme") ?? "light";
		setTheme(th);
		setApi(localStorage.getItem("noqta:api") ?? "");
		applyTheme(th);
	}, []);
	const applyTheme = (th) => {
		const root = document.documentElement;
		root.classList.remove("dark", "neon");
		if (th === "dark") root.classList.add("dark");
		if (th === "neon") root.classList.add("dark", "neon");
	};
	const save = () => {
		localStorage.setItem("noqta:theme", theme);
		localStorage.setItem("noqta:api", api);
		applyTheme(theme);
		setSaved(true);
		setTimeout(() => setSaved(false), 1600);
	};
	const themes = [
		{
			id: "light",
			label: t("settings.theme.light"),
			icon: Sun
		},
		{
			id: "dark",
			label: t("settings.theme.dark"),
			icon: Moon
		},
		{
			id: "neon",
			label: t("settings.theme.neon"),
			icon: Zap
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-black lg:text-4xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "neon-text",
					children: t("settings.title")
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-black",
					children: t("settings.theme")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-3",
					children: themes.map((th) => {
						const Icon = th.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setTheme(th.id),
							className: `flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-bold transition ${theme === th.id ? "border-primary bg-primary/10 text-primary neon-ring" : "border-border hover:bg-accent"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-5 w-5" }), th.label]
						}, th.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-black",
					children: t("settings.lang")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-2 gap-3",
					children: ["ar", "en"].map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setLang(l),
						className: `rounded-xl border p-4 text-sm font-bold transition ${lang === l ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`,
						children: l === "ar" ? "العربية" : "English"
					}, l))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl glass p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-black",
					children: t("settings.api")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: api,
					onChange: (e) => setApi(e.target.value),
					placeholder: "https://api.example.com",
					className: "mt-3 w-full rounded-xl border border-border bg-surface p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: save,
					className: "inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand",
					children: t("settings.save")
				}), saved && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-1.5 text-xs font-bold text-success",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }),
						" ",
						t("settings.saved")
					]
				})]
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
