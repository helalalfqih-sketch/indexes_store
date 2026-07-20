# Repositories

Only these modules are allowed to call `supabase.from(<table>)`. UI, hooks,
and services must go through the repository — never query Supabase directly.

Rules
- Pure functions, receive a `SupabaseClient<Database>` explicitly (DI).
- Return **DTOs** from `@/lib/domain/*`, never raw DB rows.
- No business rules here — just query composition + mapping.
- Never import server-only secrets; the caller decides which client to pass.

Current
- `products.repo.ts`
- `categories.repo.ts`
- `inventory.repo.ts`
