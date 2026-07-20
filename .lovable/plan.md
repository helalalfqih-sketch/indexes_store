# NOZON Phase 2 — Hybrid Production Backend

**Approach:** Lovable Cloud (Supabase) + TanStack Server Functions داخل نفس المشروع. لا Node/Express/Prisma منفصل. لا تغيير على أي UI حالي (WebGL Hero, Cinematic Story, Routes, Colors). فقط إضافة طبقات ناقصة.

## Architecture Target

```
src/
├── integrations/supabase/     (managed by Lovable Cloud)
├── lib/
│   ├── domain/                types + DTOs (User, Product, Order, ...)
│   ├── repositories/          data access (Supabase queries only)
│   ├── services/              business logic (uses repos via DI)
│   ├── validators/            zod schemas
│   ├── providers/
│   │   ├── whatsapp/          interface + wa-me adapter + business-api adapter (TODO)
│   │   ├── payments/          interface + adapters: cod, bank-transfer, kuraimi, mtn, sabafon, hawala
│   │   ├── sms/               interface + TODO adapter
│   │   └── email/             interface + Lovable email adapter (TODO wiring)
│   ├── *.functions.ts         thin createServerFn wrappers → services
│   └── *.server.ts            server-only helpers
└── routes/                    UNCHANGED UI; only data source swapped where needed
```

- كل Feature معزول: `services/orders.ts` لا يعرف Supabase مباشرة — يستهلك `repositories/orders.ts`.
- Server Functions فقط تستدعي Services. الواجهة لا تعرف Supabase.
- قابل للترحيل: استبدال repo بـ REST client لا يمس UI ولا services.

## Execution Roadmap (تنفيذ مرحلي بعد الموافقة على كل مرحلة)

### Phase A — Foundation (سننفذها فور الموافقة على الخطة)
1. تفعيل Lovable Cloud.
2. إنشاء هيكل المجلدات + domain types + الـ interfaces الفارغة للـ providers.
3. Migration #1 — الجداول الأساسية: `profiles`, `user_roles` (enum: admin/customer)، `has_role()` security definer، RLS + GRANTS.
4. Auth: صفحة `/auth` (email+password + Google عبر lovable broker)، `_authenticated/route.tsx` (integration-managed)، `attachSupabaseAuth` middleware في `start.ts`.
5. تحديث `admin-shell` ليتحقق من `has_role('admin')` بدل localStorage.

### Phase B — Catalog & Inventory
Migration #2: `categories`, `products`, `product_images`, `inventory_movements`, `reviews`, `coupons`.
- Repositories + services + server-fns + validators.
- Admin CRUD (products/categories/coupons/reviews moderation).
- Inventory: current/reserved stock, low-stock alerts, adjustment history.
- استبدال `store-data.ts` الثابت بمصدر Supabase (نفس شكل DTO — لا تغيير UI).

### Phase C — Orders & Checkout
Migration #3: `orders`, `order_items`, `addresses`, `order_events` (timeline), `admin_logs`.
- Enums: order_status, payment_status, shipping_status.
- Services: create order (reserve stock), transitions, cancel/refund, timeline.
- Payment provider interface + 6 adapters (COD جاهز، الباقي TODO).
- WhatsApp service: `buildOrderMessage`, `sendOrder` — fallback إلى wa.me الحالي إذا لا مفاتيح.

### Phase D — Customer Area
Migration #4: `wishlist`, `cart_items` (server-side)، `notifications`, `recently_viewed`.
- Server-side cart merge مع `cart-store` الحالي.
- Order history, wishlist, addresses, profile settings, notifications inbox.

### Phase E — Admin Dashboard Extension
- Analytics views (SQL views): revenue, orders, top products/categories, conversion.
- شاشات: Orders mgmt, Customers, Inventory, Coupons, Reviews, Notifications, WhatsApp logs, Admin activity logs, System settings, SEO manager.
- كلها إضافات على `admin-shell` الحالي — بدون كسر أي شاشة.

### Phase F — Search & Performance
- Full-text search (Postgres tsvector + GIN index) + filters/sort/price range.
- Autocomplete server-fn.
- Pagination + virtual lists في القوائم الطويلة فقط (لا مساس بالصفحة الرئيسية السينمائية).
- Redis: TODO — الاعتماد على Supabase caching + TanStack Query stale-time.

### Phase G — SEO
- `sitemap.xml` server route (dynamic من products/categories).
- تحديث `robots.txt`.
- JSON-LD: Product/Organization/Breadcrumb schemas في route heads (بدون تغيير التصميم).
- تحسين meta/og/twitter لكل route.

### Phase H — Notifications & Providers
- Lovable Email setup (بعد فحص domain status).
- SMS/WhatsApp Business API interfaces جاهزة — TODO للمفاتيح.
- Retry queue بسيط عبر جدول `notification_queue` + pg_cron.

### Phase I — Security Hardening
- Zod validators على كل server-fn.
- Audit logs (`admin_logs`) لكل عملية admin.
- CSRF: server-fns محمية بـ same-origin افتراضياً.
- File upload validation (mime + size) لـ Supabase Storage.
- RLS review + policy tests.

---

## Rules (مطبقة في كل مرحلة)
- TypeScript strict.
- لا تعديل على: `webgl-hero.tsx`, `cinematic-story.tsx`, `product-card.tsx`, `styles.css`, routes UI.
- لا بيانات وهمية. لا mock. TODO فقط حيث تلزم مفاتيح API.
- بعد كل Phase: تقرير "تم / متبقي" ثم انتظار موافقة قبل التالية.
- استبدال `store-data.ts` الثابت بمصدر Supabase يحافظ حرفياً على نفس شكل DTO المستخدم في UI.

## Deliverable لهذه الجولة (بعد الموافقة)
تنفيذ **Phase A فقط**: تفعيل Cloud + هيكل المجلدات + Auth + roles + admin gate + interfaces للـ providers. ثم تقرير وانتظار.
