# Services

Business logic layer. Composes repositories. Called by `createServerFn`
handlers in `src/lib/*.functions.ts`. Never talk to Supabase directly.

Phase B ships thin server-fn wrappers directly over repositories
(`src/lib/catalog.functions.ts`). Dedicated services will move here in
Phase C when order/payment orchestration is introduced.
