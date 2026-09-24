// Run from repository root with PGLITE_MODULE pointing to @electric-sql/pglite.
// Executes repository foundation migrations and real PostgreSQL RLS/trigger logic.
import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(
  process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : "@electric-sql/pglite"
);
const db = new PGlite();
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const [owner, other, admin, tenant, tenantB, product, productB] = [1, 2, 3, 11, 12, 21, 22].map(id);
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;
CREATE PUBLICATION supabase_realtime;`);
for (const file of fs
  .readdirSync("supabase/migrations")
  .filter((n) => n.startsWith("20260705"))
  .sort()) {
  await db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8"));
}
// This later column is already present in the live schema.
await db.exec(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{}';
INSERT INTO auth.users(id) VALUES ('${owner}'),('${other}'),('${admin}');
INSERT INTO tenants(id,slug,name,owner_user_id) VALUES ('${tenant}','a','A','${owner}'),('${tenantB}','b','B','${other}');
INSERT INTO products(id,tenant_id,slug,name,price,stock,is_published) VALUES
('${product}','${tenant}','a','A',100,5,true),('${productB}','${tenantB}','b','B',100,5,true);`);
async function as(role, user, fn) {
  await db.exec("BEGIN");
  try {
    await db.exec(`SET LOCAL ROLE ${role}`);
    await db.query(
      "SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claim.role',$2,true)",
      [user ?? "", role],
    );
    return await fn();
  } finally {
    await db.exec("ROLLBACK");
  }
}
let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log("PASS", name);
}
const adjust = (p) =>
  db.query(
    "INSERT INTO inventory_movements(tenant_id,product_id,delta,reason) VALUES($1,$2,-1,'adjustment')",
    [tenant, p],
  );
await check("baseline exposes other profiles", () =>
  as("authenticated", owner, async () =>
    assert.equal((await db.query("SELECT id FROM profiles")).rows.length, 3),
  ),
);
await check("baseline permits owner plan escalation", () =>
  as("authenticated", owner, () =>
    db.query("UPDATE tenants SET plan='enterprise' WHERE id=$1", [tenant]),
  ),
);
await check("baseline permits cross-tenant stock adjustment", () =>
  as("authenticated", owner, () => adjust(productB)),
);
await db.exec(
  fs.readFileSync("supabase/migrations/20260924190000_residual_security_boundaries.sql", "utf8"),
);
await check("cross-tenant stock adjustment rejected", () =>
  assert.rejects(
    as("authenticated", owner, () => adjust(productB)),
    /Invalid product tenant|foreign key/,
  ),
);
await check("legitimate stock adjustment preserved", () =>
  as("authenticated", owner, async () => {
    await adjust(product);
    assert.equal(
      (await db.query("SELECT stock FROM products WHERE id=$1", [product])).rows[0].stock,
      4,
    );
  }),
);
await check("product tenant cannot invalidate inventory relation", () =>
  as("service_role", null, async () => {
    await adjust(product);
    await assert.rejects(
      db.query("UPDATE products SET tenant_id=$1 WHERE id=$2", [tenantB, product]),
      /foreign key/,
    );
  }),
);
for (const field of [
  "plan='enterprise'",
  "status='suspended'",
  `owner_user_id='${other}'`,
  "features='{\"paid\":true}'",
  "created_at=now()-interval '1 day'",
]) {
  await check(`owner cannot alter ${field.split("=")[0]}`, () =>
    assert.rejects(
      as("authenticated", owner, () =>
        db.query(`UPDATE tenants SET ${field} WHERE id=$1`, [tenant]),
      ),
      /protected tenant/,
    ),
  );
}
await check("owner identity and settings edits preserved", () =>
  as("authenticated", owner, () =>
    db.query("UPDATE tenants SET name='Renamed',slug='renamed',settings='{}' WHERE id=$1", [
      tenant,
    ]),
  ),
);
await check("profiles limited to own row", () =>
  as("authenticated", owner, async () =>
    assert.deepEqual((await db.query("SELECT id FROM profiles")).rows, [{ id: owner }]),
  ),
);
await check("public bootstrap RPC denied", () =>
  assert.rejects(
    as("authenticated", owner, () => db.query("SELECT bootstrap_first_admin($1)", [owner])),
    /permission denied/,
  ),
);
await check("first service bootstrap succeeds only once", () =>
  as("service_role", null, async () => {
    assert.equal((await db.query("SELECT bootstrap_first_admin($1) ok", [admin])).rows[0].ok, true);
    assert.equal(
      (await db.query("SELECT bootstrap_first_admin($1) ok", [other])).rows[0].ok,
      false,
    );
  }),
);
await db.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')", [admin]);
await check("platform admin retains plan management and profile access", () =>
  as("authenticated", admin, async () => {
    await db.query("UPDATE tenants SET plan='enterprise' WHERE id=$1", [tenant]);
    assert.equal((await db.query("SELECT id FROM profiles")).rows.length, 3);
  }),
);
await check("service role retains protected tenant management", () =>
  as("service_role", null, () =>
    db.query("UPDATE tenants SET plan='enterprise' WHERE id=$1", [tenant]),
  ),
);
await check("anonymous AI quota RPC denied", () =>
  assert.rejects(
    as("anon", null, () => db.query("SELECT consume_ai_request()")),
    /permission denied/,
  ),
);
await check("quota allows 100 then refuses, without resetting budget", () =>
  as("authenticated", owner, async () => {
    for (let i = 0; i < 100; i++)
      assert.equal((await db.query("SELECT consume_ai_request() ok")).rows[0].ok, true);
    assert.equal((await db.query("SELECT consume_ai_request() ok")).rows[0].ok, false);
  }),
);
await check("authenticated users cannot overwrite quota rows", () =>
  assert.rejects(
    as("authenticated", owner, () => db.query("DELETE FROM ai_daily_usage")),
    /permission denied/,
  ),
);
console.log(`${passed} database security checks passed`);
await db.close();
