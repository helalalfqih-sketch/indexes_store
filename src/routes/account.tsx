import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, MapPin, Package, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type Address = {
  id: string;
  address1?: string;
  address2?: string;
  city?: string;
  zoneCode?: string;
  country?: string;
  zip?: string;
  phoneNumber?: string;
};
type Order = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
};
type Customer = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: { emailAddress?: string };
  phoneNumber?: { phoneNumber?: string };
  addresses: { nodes: Address[] };
  orders: { nodes: Order[] };
};

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "حسابي — اندكس ستور" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/customer/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload) => setCustomer(payload?.customer ?? null))
      .catch(() => setError("تعذر تحميل الحساب الآن"))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Skeleton />;
  if (!customer)
    return (
      <main
        className="mx-auto grid min-h-[55vh] w-full max-w-xl place-items-center px-4 py-10"
        dir="rtl"
      >
        <section className="w-full space-y-5 rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-6 text-center shadow-[var(--shadow-md)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-primary-ui-soft)] text-[var(--color-primary-ui)]">
            <User />
          </span>
          <div>
            <h1 className="text-2xl font-black leading-[1.6]">حساب العميل</h1>
            <p className="mt-2 text-sm leading-[1.7] text-[var(--color-text-secondary)]">
              سجّل الدخول الآمن عبر Shopify لمشاهدة طلباتك وعناوينك الحقيقية.
            </p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <a
            href="/api/customer/login?returnTo=/account"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary-ui)] px-5 text-base font-bold text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ui)] focus-visible:ring-offset-2 active:bg-[var(--color-primary-active)]"
          >
            <LogIn />
            تسجيل الدخول أو إنشاء حساب
          </a>
          <p className="text-sm leading-[1.7] text-[var(--color-text-secondary)]">
            يظهر Google داخل صفحة Shopify فقط إذا كان مفعّلًا في إعدادات حسابات العملاء.
          </p>
        </section>
      </main>
    );
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6" dir="rtl">
      <header className="flex items-center gap-4 rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-5 shadow-[var(--shadow-sm)]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--color-primary-ui-soft)] text-[var(--color-primary-ui)]">
          <User />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black leading-[1.6]">
            {customer.displayName ||
              [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
              "عميل اندكس ستور"}
          </h1>
          <p className="truncate text-sm leading-[1.7] text-[var(--color-text-secondary)]">
            {customer.emailAddress?.emailAddress}
          </p>
        </div>
        <a
          href="/api/customer/logout"
          aria-label="تسجيل الخروج"
          className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-[var(--color-border-default)] hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ui)]"
        >
          <LogOut />
        </a>
      </header>
      <Section title="طلباتي" icon={<Package />}>
        <div className="flex justify-end">
          <Link
            to="/track"
            className="min-h-11 py-3 text-sm font-bold text-[var(--color-primary-ui)]"
          >
            تتبع طلب ضيف
          </Link>
        </div>
        {customer.orders.nodes.length ? (
          <ul className="divide-y divide-[var(--color-border-default)] overflow-hidden rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)]">
            {customer.orders.nodes.map((order) => (
              <li key={order.id} className="grid grid-cols-[1fr_auto] gap-2 p-4">
                <div>
                  <p className="font-bold">{order.name}</p>
                  <p className="text-sm leading-[1.7] text-[var(--color-text-secondary)]">
                    {new Date(order.processedAt).toLocaleDateString("ar-YE")} ·{" "}
                    {order.fulfillmentStatus}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-black text-[var(--color-primary-ui)]">
                    {new Intl.NumberFormat("ar-YE", {
                      style: "currency",
                      currency: order.totalPrice.currencyCode,
                    }).format(Number(order.totalPrice.amount))}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {order.financialStatus}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="لا توجد طلبات مرتبطة بهذا الحساب بعد." />
        )}
      </Section>
      <Section title="عناويني" icon={<MapPin />}>
        {customer.addresses.nodes.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {customer.addresses.nodes.map((address) => (
              <li
                key={address.id}
                className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-1)] p-4 text-sm leading-[1.7]"
              >
                <p className="font-bold">{address.address1}</p>
                <p className="text-[var(--color-text-secondary)]">
                  {[address.address2, address.city, address.zoneCode, address.country, address.zip]
                    .filter(Boolean)
                    .join("، ")}
                </p>
                {address.phoneNumber && (
                  <p dir="ltr" className="text-right text-[var(--color-text-secondary)]">
                    {address.phoneNumber}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="لا توجد عناوين محفوظة في Shopify." />
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-black leading-[1.6] text-[var(--color-text-primary)]">
        <span className="text-[var(--color-primary-ui)]">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-3xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-1)] p-5 text-center text-sm leading-[1.7] text-[var(--color-text-secondary)]">
      {text}
    </div>
  );
}
function Skeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6" aria-busy="true">
      <div className="h-24 animate-pulse rounded-3xl bg-[var(--color-surface-2)]" />
      <div className="h-44 animate-pulse rounded-3xl bg-[var(--color-surface-2)]" />
      <Loader2 className="mx-auto animate-spin text-[var(--color-primary-ui)]" />
    </main>
  );
}
