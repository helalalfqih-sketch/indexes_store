import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-D-sVoEic.mjs";
import { t as createServerRpc } from "./createServerRpc-WJgk8O8C.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-bootstrap.functions-CazNjiol.js
/**
* Grants the current signed-in user the "admin" role IFF no admin exists yet.
* Safe first-admin bootstrap for a fresh Cloud project.
* After the first admin is created, this becomes a no-op.
*/
var claimFirstAdmin_createServerFn_handler = createServerRpc({
	id: "f69ba697386f27cc1997a0856406673eef7a223ae9c9c372f21b46cbec023940",
	name: "claimFirstAdmin",
	filename: "src/lib/admin-bootstrap.functions.ts"
}, (opts) => claimFirstAdmin.__executeServer(opts));
var claimFirstAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(claimFirstAdmin_createServerFn_handler, async ({ context }) => {
	const { userId } = context;
	const { supabaseAdmin } = await import("./client.server-Bw6iWMJ-.mjs");
	const { data: existing, error: countErr } = await supabaseAdmin.from("user_roles").select("id", {
		count: "exact",
		head: true
	}).eq("role", "admin");
	if (countErr) throw countErr;
	const { count } = await supabaseAdmin.from("user_roles").select("*", {
		count: "exact",
		head: true
	}).eq("role", "admin");
	if ((count ?? 0) > 0) return {
		granted: false,
		reason: "admin_exists"
	};
	const { error } = await supabaseAdmin.from("user_roles").insert({
		user_id: userId,
		role: "admin"
	});
	if (error) throw error;
	return { granted: true };
});
//#endregion
export { claimFirstAdmin_createServerFn_handler };
