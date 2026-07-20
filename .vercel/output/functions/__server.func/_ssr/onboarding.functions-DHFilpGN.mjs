import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
import { i as slugCheckSchema, r as onboardingSchema, t as RESERVED_SLUGS } from "./onboarding-ChP1P4kz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding.functions-DHFilpGN.js
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
var getOnboardingStatus_createServerFn_handler = createServerRpc({
	id: "9b5ee8977748cf608ade0d3fc82adb7be3ba4ff3f46f0628e845ca30bcfebecc",
	name: "getOnboardingStatus",
	filename: "src/lib/onboarding.functions.ts"
}, (opts) => getOnboardingStatus.__executeServer(opts));
var getOnboardingStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getOnboardingStatus_createServerFn_handler, async ({ context }) => {
	const { supabase, userId } = context;
	const owned = await supabase.from("tenants").select("id, slug, name, plan, status").eq("owner_user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
	if (owned.data) return {
		hasTenant: true,
		role: "owner",
		tenant: owned.data
	};
	const member = await supabase.from("tenant_members").select("role, tenants(id, slug, name, plan, status)").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
	if (member.data?.tenants) return {
		hasTenant: true,
		role: member.data.role,
		tenant: member.data.tenants
	};
	return {
		hasTenant: false,
		role: null,
		tenant: null
	};
});
var checkSlugAvailability_createServerFn_handler = createServerRpc({
	id: "87104f87ebd4a455738120fd50a8a5d67692552d1743a7eec30bc5fc58e47b6d",
	name: "checkSlugAvailability",
	filename: "src/lib/onboarding.functions.ts"
}, (opts) => checkSlugAvailability.__executeServer(opts));
var checkSlugAvailability = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => slugCheckSchema.parse(raw)).handler(checkSlugAvailability_createServerFn_handler, async ({ data }) => {
	if (RESERVED_SLUGS.has(data.slug)) return {
		available: false,
		reason: "reserved"
	};
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: hit, error } = await supabaseAdmin.from("tenants").select("id").eq("slug", data.slug).maybeSingle();
	if (error) throw error;
	return {
		available: !hit,
		reason: hit ? "taken" : null
	};
});
var completeOnboarding_createServerFn_handler = createServerRpc({
	id: "76990e408ca44ae9829bc6867b971b01b4ba1280c7bff0a8ff050dfba9fb7ce2",
	name: "completeOnboarding",
	filename: "src/lib/onboarding.functions.ts"
}, (opts) => completeOnboarding.__executeServer(opts));
var completeOnboarding = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((raw) => onboardingSchema.parse(raw)).handler(completeOnboarding_createServerFn_handler, async ({ data, context }) => {
	const { userId } = context;
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	if ((await supabaseAdmin.from("tenants").select("id").eq("owner_user_id", userId).limit(1).maybeSingle()).data) throw new Error("لديك متجر بالفعل");
	if ((await supabaseAdmin.from("tenants").select("id").eq("slug", data.slug).maybeSingle()).data) throw new Error("هذا المعرّف مستخدم بالفعل");
	const { data: tenant, error } = await supabaseAdmin.from("tenants").insert({
		slug: data.slug,
		name: data.name,
		owner_user_id: userId,
		plan: data.plan ?? "free",
		status: "active"
	}).select("*").single();
	if (error) throw error;
	await supabaseAdmin.from("tenant_members").upsert({
		tenant_id: tenant.id,
		user_id: userId,
		role: "owner"
	}, { onConflict: "tenant_id,user_id" });
	return tenant;
});
//#endregion
export { checkSlugAvailability_createServerFn_handler, completeOnboarding_createServerFn_handler, getOnboardingStatus_createServerFn_handler };
