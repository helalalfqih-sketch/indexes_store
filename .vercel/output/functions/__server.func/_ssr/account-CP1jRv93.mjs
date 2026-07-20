import { n as STORE_CONTACT } from "./store-data-CaXOvYMv.mjs";
import { r as whatsappLink } from "./whatsapp-C4cq1s8L.mjs";
import { c as require_jsx_runtime } from "../_libs/@astryxdesign/core+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as MessageCircle, C as ShieldCheck, H as MapPin, L as Package, W as LogIn, et as Heart, mt as CircleQuestionMark } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-CP1jRv93.js
var import_jsx_runtime = require_jsx_runtime();
function AccountPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 px-4 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex items-center gap-3 rounded-3xl gradient-brand p-4 text-white shadow-brand",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid h-14 w-14 place-items-center rounded-full bg-white/20 text-xl font-black",
						children: "ز"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-bold",
							children: "مرحباً بك في اندكس ستور"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-white/85",
							children: "سجّل دخولك لمتابعة طلباتك"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "h-3.5 w-3.5" }), "دخول"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "overflow-hidden rounded-2xl bg-surface shadow-card",
				children: [
					{
						icon: Package,
						label: "طلباتي",
						href: "/cart"
					},
					{
						icon: Heart,
						label: "المفضلة",
						href: "/"
					},
					{
						icon: MapPin,
						label: "عناويني",
						href: "/"
					},
					{
						icon: ShieldCheck,
						label: "الخصوصية والأمان",
						href: "/"
					},
					{
						icon: CircleQuestionMark,
						label: "المساعدة والدعم",
						href: "/"
					}
				].map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: i !== 0 ? "border-t border-border" : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: m.href,
						className: "flex items-center gap-3 p-3.5 text-sm font-semibold",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid h-9 w-9 place-items-center rounded-xl bg-primary-soft/20 text-primary",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.icon, { className: "h-4.5 w-4.5" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex-1",
								children: m.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "‹"
							})
						]
					})
				}, m.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: whatsappLink("مرحباً، لدي استفسار عن اندكس ستور"),
				target: "_blank",
				rel: "noopener noreferrer",
				className: "flex items-center justify-center gap-2 rounded-2xl bg-success py-3 text-sm font-bold text-success-foreground shadow-brand",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }),
					"تواصل مع الدعم — ",
					STORE_CONTACT
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "pb-2 text-center text-[11px] text-muted-foreground",
				children: [
					"© اندكس ستور ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" — جميع الحقوق محفوظة"
				]
			})
		]
	});
}
//#endregion
export { AccountPage as component };
