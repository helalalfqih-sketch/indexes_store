import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth.functions-B1kGOTVQ.js
var getSessionUser_createServerFn_handler = createServerRpc({
	id: "b315abc2326c37b8b2cbcd599f0c9210ed4e1a822e88a41d22b6da6a9faecfb4",
	name: "getSessionUser",
	filename: "src/lib/auth.functions.ts"
}, (opts) => getSessionUser.__executeServer(opts));
var getSessionUser = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSessionUser_createServerFn_handler, async ({ context }) => {
	const { supabase, userId, claims } = context;
	const [{ data: profile }, { data: roleRows }] = await Promise.all([supabase.from("profiles").select("*").eq("id", userId).maybeSingle(), supabase.from("user_roles").select("role").eq("user_id", userId)]);
	const roles = (roleRows ?? []).map((r) => r.role);
	return {
		id: userId,
		email: claims.email ?? null,
		profile: profile ?? null,
		roles
	};
});
//#endregion
export { getSessionUser_createServerFn_handler };
