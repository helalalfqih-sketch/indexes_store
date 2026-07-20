import { o as __toESM } from "../_runtime.mjs";
import { c as require_jsx_runtime, l as require_react } from "../_libs/@astryxdesign/core+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as supabase } from "./client-BDpLHRM3.mjs";
import { t as createSsrRpc } from "./createSsrRpc-DIPEs3na.mjs";
import { i as slugCheckSchema, n as SLUG_REGEX, r as onboardingSchema } from "./onboarding-ChP1P4kz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-EFsd4M9b.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useSession() {
	const [session, setSession] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let mounted = true;
		supabase.auth.getSession().then(({ data }) => {
			if (!mounted) return;
			setSession(data.session);
			setLoading(false);
		});
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
			setSession(s);
		});
		return () => {
			mounted = false;
			sub.subscription.unsubscribe();
		};
	}, []);
	return {
		session,
		loading,
		user: session?.user ?? null
	};
}
/**
* Onboarding server functions — self-service tenant creation for signed-in users.
*
* Flow:
*  1. User signs up / signs in (Supabase Auth).
*  2. UI calls `getOnboardingStatus` to know whether they already own a store.
*  3. If none, UI shows `/onboarding` form → calls `completeOnboarding`.
*
* We use `supabaseAdmin` (service role) inside these handlers because:
*  - The `tenants` INSERT policy is restricted to platform admins (correct default).
*  - We still authenticate the caller via `requireSupabaseAuth` and enforce
*    one-owner-one-tenant + slug uniqueness + reserved-slug guard in code.
*/
var getOnboardingStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("9b5ee8977748cf608ade0d3fc82adb7be3ba4ff3f46f0628e845ca30bcfebecc"));
var checkSlugAvailability = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => slugCheckSchema.parse(raw)).handler(createSsrRpc("87104f87ebd4a455738120fd50a8a5d67692552d1743a7eec30bc5fc58e47b6d"));
var completeOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => onboardingSchema.parse(raw)).handler(createSsrRpc("76990e408ca44ae9829bc6867b971b01b4ba1280c7bff0a8ff050dfba9fb7ce2"));
var slugify = (v) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 32);
function OnboardingPage() {
	const navigate = useNavigate();
	const { session, loading: sessionLoading } = useSession();
	const getStatus = useServerFn(getOnboardingStatus);
	const checkSlug = useServerFn(checkSlugAvailability);
	const submit = useServerFn(completeOnboarding);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [statusLoading, setStatusLoading] = (0, import_react.useState)(true);
	const [name, setName] = (0, import_react.useState)("");
	const [slug, setSlug] = (0, import_react.useState)("");
	const [slugTouched, setSlugTouched] = (0, import_react.useState)(false);
	const [slugState, setSlugState] = (0, import_react.useState)({
		checking: false,
		available: null,
		reason: null
	});
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!sessionLoading && !session) navigate({
			to: "/auth",
			search: { next: "/onboarding" },
			replace: true
		});
	}, [
		session,
		sessionLoading,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		if (!session) return;
		setStatusLoading(true);
		getStatus().then((s) => setStatus(s)).catch((e) => setError(e instanceof Error ? e.message : "تعذّر تحميل الحالة")).finally(() => setStatusLoading(false));
	}, [session, getStatus]);
	(0, import_react.useEffect)(() => {
		if (!slugTouched) setSlug(slugify(name));
	}, [name, slugTouched]);
	(0, import_react.useEffect)(() => {
		if (!slug || !SLUG_REGEX.test(slug)) {
			setSlugState({
				checking: false,
				available: null,
				reason: null
			});
			return;
		}
		setSlugState((s) => ({
			...s,
			checking: true
		}));
		const t = setTimeout(async () => {
			try {
				const res = await checkSlug({ data: { slug } });
				setSlugState({
					checking: false,
					available: res.available,
					reason: res.reason
				});
			} catch {
				setSlugState({
					checking: false,
					available: null,
					reason: null
				});
			}
		}, 350);
		return () => clearTimeout(t);
	}, [slug, checkSlug]);
	const canSubmit = (0, import_react.useMemo)(() => {
		return onboardingSchema.safeParse({
			name,
			slug
		}).success && slugState.available === true && !busy;
	}, [
		name,
		slug,
		slugState.available,
		busy
	]);
	async function onSubmit(e) {
		e.preventDefault();
		setError(null);
		const parsed = onboardingSchema.safeParse({
			name,
			slug
		});
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
			return;
		}
		setBusy(true);
		try {
			const tenant = await submit({ data: parsed.data });
			navigate({
				to: "/admin",
				search: { tenant: tenant.slug },
				replace: true
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "تعذّر إنشاء المتجر");
		} finally {
			setBusy(false);
		}
	}
	if (sessionLoading || statusLoading || !session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenteredMessage, { children: "جارٍ التحميل…" });
	if (status?.hasTenant) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CenteredCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold mb-2",
			children: "لديك متجر بالفعل"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm opacity-80 mb-4",
			children: [
				"المتجر: ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: status.tenant.name
				}),
				" (",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: status.tenant.slug }),
				")"
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/admin",
				className: "btn-primary",
				children: "لوحة التحكم"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "btn-ghost",
				children: "العودة للرئيسية"
			})]
		})
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CenteredCard, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-semibold mb-1",
			children: "أنشئ متجرك"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm opacity-70 mb-6",
			children: "دقيقة واحدة — اختر اسماً ومعرّفاً فريداً لمتجرك."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit,
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium",
						children: "اسم المتجر"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: name,
						onChange: (e) => setName(e.target.value),
						placeholder: "مثال: متجر اندكس",
						className: "input mt-1",
						required: true,
						maxLength: 80
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: "المعرّف (Slug)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: slug,
								onChange: (e) => {
									setSlugTouched(true);
									setSlug(slugify(e.target.value));
								},
								placeholder: "my-store",
								className: "input flex-1",
								required: true,
								minLength: 3,
								maxLength: 32,
								dir: "ltr"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs opacity-60",
								children: ".noqta.app"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlugHint, {
							slug,
							state: slugState
						})
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-red-500 bg-red-500/10 rounded-md p-3",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					disabled: !canSubmit,
					className: "btn-primary w-full",
					children: busy ? "جارٍ الإنشاء…" : "إنشاء المتجر"
				})
			]
		})
	] });
}
function SlugHint({ slug, state }) {
	if (!slug) return null;
	if (state.checking) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs opacity-60 mt-1",
		children: "جارٍ التحقق…"
	});
	if (state.available === true) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-emerald-500 mt-1",
		children: "المعرّف متاح ✓"
	});
	if (state.available === false) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs text-red-500 mt-1",
		children: state.reason === "reserved" ? "هذا المعرّف محجوز" : "المعرّف مستخدم بالفعل"
	});
	return null;
}
function CenteredCard({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen flex items-center justify-center p-6",
		dir: "rtl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl",
			children
		})
	});
}
function CenteredMessage({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen flex items-center justify-center text-sm opacity-70",
		dir: "rtl",
		children
	});
}
//#endregion
export { OnboardingPage as component };
