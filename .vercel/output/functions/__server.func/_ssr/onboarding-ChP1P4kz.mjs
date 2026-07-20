import { dt as enumType, mt as stringType, pt as objectType } from "../_libs/@ai-sdk/gateway+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-ChP1P4kz.js
var SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
var RESERVED_SLUGS = /* @__PURE__ */ new Set([
	"www",
	"app",
	"admin",
	"api",
	"auth",
	"assets",
	"static",
	"cdn",
	"default",
	"public",
	"root",
	"system",
	"support",
	"help",
	"docs",
	"mail",
	"billing",
	"checkout",
	"cart",
	"login",
	"signup",
	"signin",
	"dashboard",
	"onboarding",
	"settings",
	"account",
	"platform"
]);
var onboardingSchema = objectType({
	name: stringType().trim().min(2, "الاسم قصير جداً").max(80, "الاسم طويل جداً"),
	slug: stringType().trim().toLowerCase().min(3, "المعرّف قصير جداً").max(32, "المعرّف طويل جداً").regex(SLUG_REGEX, "استخدم أحرفاً لاتينية صغيرة وأرقاماً وشرطات فقط").refine((s) => !RESERVED_SLUGS.has(s), "هذا المعرّف محجوز"),
	plan: enumType([
		"free",
		"pro",
		"enterprise"
	]).optional()
});
var slugCheckSchema = objectType({ slug: stringType().trim().toLowerCase().min(3).max(32).regex(SLUG_REGEX) });
//#endregion
export { slugCheckSchema as i, SLUG_REGEX as n, onboardingSchema as r, RESERVED_SLUGS as t };
