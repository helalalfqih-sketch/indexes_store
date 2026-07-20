import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, g as Link, v as useSearch } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BDpLHRM3.mjs";
import { mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
import { t as createLovableAuth } from "../_libs/lovable.dev__cloud-auth-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DyvCMPGw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var lovableAuth = createLovableAuth({ oauthBrokerUrl: "/".replace(/\/$/, "") + "/~oauth/initiate" });
var lovable = { auth: { signInWithOAuth: async (provider, opts) => {
	const result = await lovableAuth.signInWithOAuth(provider, {
		redirect_uri: opts?.redirect_uri,
		extraParams: { ...opts?.extraParams }
	});
	if (result.redirected) return result;
	if (result.error) return result;
	try {
		await supabase.auth.setSession(result.tokens);
	} catch (e) {
		return { error: e instanceof Error ? e : new Error(String(e)) };
	}
	return result;
} } };
var emailSchema = stringType().trim().email("بريد إلكتروني غير صالح").max(255);
var passwordSchema = stringType().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(72, "كلمة المرور طويلة جداً");
var signInSchema = objectType({
	email: emailSchema,
	password: passwordSchema
});
var signUpSchema = objectType({
	email: emailSchema,
	password: passwordSchema,
	full_name: stringType().trim().min(2, "الاسم قصير جداً").max(120)
});
function AuthPage() {
	const navigate = useNavigate();
	const { next } = useSearch({ from: "/auth" });
	const [mode, setMode] = (0, import_react.useState)("signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) navigate({
				to: sanitizeNext(next),
				replace: true
			});
		});
		const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_IN" && session) navigate({
				to: sanitizeNext(next),
				replace: true
			});
		});
		return () => sub.subscription.unsubscribe();
	}, [navigate, next]);
	const onSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setBusy(true);
		try {
			if (mode === "signin") {
				const input = signInSchema.parse({
					email,
					password
				});
				const { error } = await supabase.auth.signInWithPassword(input);
				if (error) throw error;
			} else {
				const cleanBase = "/".replace(/\/$/, "");
				const redirectUrl = window.location.origin + cleanBase + "/auth";
				const input = signUpSchema.parse({
					email,
					password,
					full_name: fullName
				});
				const { error } = await supabase.auth.signUp({
					email: input.email,
					password: input.password,
					options: {
						data: { full_name: input.full_name },
						emailRedirectTo: redirectUrl
					}
				});
				if (error) throw error;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	};
	const onGoogle = async () => {
		setError(null);
		const cleanBase = "/".replace(/\/$/, "");
		const redirectUrl = window.location.origin + cleanBase + "/auth";
		const result = await lovable.auth.signInWithOAuth("google", {
			redirect_uri: redirectUrl,
			extraParams: { prompt: "select_account" }
		});
		if (result.error) setError(result.error instanceof Error ? result.error.message : String(result.error));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-[#000209] text-[#EEEEEE] flex items-center justify-center px-4 py-12",
		dir: "rtl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-6 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-2xl font-black",
						children: "اندكس ستور"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-white/60",
						children: mode === "signin" ? "أهلاً بعودتك، سجّل دخولك للمتابعة" : "أنشئ حساباً جديداً"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-5 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMode("signin"),
						className: `rounded-lg py-2 font-semibold transition ${mode === "signin" ? "bg-white/10 text-white" : "text-white/60"}`,
						children: "تسجيل الدخول"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMode("signup"),
						className: `rounded-lg py-2 font-semibold transition ${mode === "signup" ? "bg-white/10 text-white" : "text-white/60"}`,
						children: "إنشاء حساب"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit,
					className: "space-y-3",
					children: [
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: fullName,
							onChange: (e) => setFullName(e.target.value),
							placeholder: "الاسم الكامل",
							autoComplete: "name",
							required: true,
							className: "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "email",
							value: email,
							onChange: (e) => setEmail(e.target.value),
							placeholder: "البريد الإلكتروني",
							autoComplete: "email",
							required: true,
							className: "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "كلمة المرور",
							autoComplete: mode === "signin" ? "current-password" : "new-password",
							required: true,
							minLength: 8,
							className: "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy,
							className: "w-full rounded-xl bg-white py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-60",
							children: busy ? "جارٍ..." : mode === "signin" ? "دخول" : "إنشاء حساب"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "my-5 flex items-center gap-3 text-xs text-white/40",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-white/10" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "أو" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-white/10" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: onGoogle,
					className: "flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold transition hover:bg-white/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						width: "18",
						height: "18",
						viewBox: "0 0 24 24",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							fill: "#EA4335",
							d: "M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.3 12 2.3 6.7 2.3 2.5 6.6 2.5 12s4.3 9.7 9.5 9.7c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6z"
						})
					}), "متابعة عبر Google"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-center text-xs text-white/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "hover:text-white",
						children: "← العودة للمتجر"
					})
				})
			]
		})
	});
}
function sanitizeNext(next) {
	if (!next) return "/";
	if (!next.startsWith("/") || next.startsWith("//")) return "/";
	return next;
}
//#endregion
export { AuthPage as component };
