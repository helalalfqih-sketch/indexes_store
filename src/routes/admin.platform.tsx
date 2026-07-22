import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  listTenants,
  createTenant,
  updateTenantPlan,
  updateTenantStatus,
} from "@/lib/tenants.functions";
import { Building2, Plus, Pause, Play, Package as PackageIcon, Users, Store } from "lucide-react";

export const Route = createFileRoute("/admin/platform")({
  head: () => ({
    meta: [{ title: "Platform — SaaS Tenants" }, { name: "robots", content: "noindex" }],
  }),
  component: PlatformPage,
});

function PlatformPage() {
  const qc = useQueryClient();
  const list = useServerFn(listTenants);
  const create = useServerFn(createTenant);
  const setPlan = useServerFn(updateTenantPlan);
  const setStatus = useServerFn(updateTenantStatus);

  const tenantsQ = useQuery({ queryKey: ["saas", "tenants"], queryFn: () => list() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["saas", "tenants"] });

  const createMut = useMutation({
    mutationFn: (data: { slug: string; name: string; plan: "free" | "pro" | "enterprise" }) =>
      create({ data }),
    onSuccess: invalidate,
  });
  const planMut = useMutation({
    mutationFn: (data: { id: string; plan: "free" | "pro" | "enterprise" }) => setPlan({ data }),
    onSuccess: invalidate,
  });
  const statusMut = useMutation({
    mutationFn: (data: { id: string; status: "active" | "suspended" | "pending" }) =>
      setStatus({ data }),
    onSuccess: invalidate,
  });

  const [showNew, setShowNew] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState<"free" | "pro" | "enterprise">("free");

  const submitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug || !newName) return;
    createMut.mutate(
      { slug: newSlug, name: newName, plan: newPlan },
      {
        onSuccess: () => {
          setShowNew(false);
          setNewSlug("");
          setNewName("");
          setNewPlan("free");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Platform / Tenants</h1>
            <p className="text-sm text-muted-foreground">
              Global SaaS control panel — manage every store on the platform.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New tenant
        </button>
      </header>

      {showNew && (
        <form
          onSubmit={submitNew}
          className="glass grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-4"
        >
          <input
            className="col-span-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
            placeholder="slug (store1)"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            required
          />
          <input
            className="col-span-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
            placeholder="Store name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <select
            className="col-span-1 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm"
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value as "free" | "pro" | "enterprise")}
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <button
            className="col-span-1 md:col-span-4 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={createMut.isPending}
          >
            {createMut.isPending ? "Creating..." : "Create tenant"}
          </button>
          {createMut.error && (
            <p className="col-span-4 text-xs text-destructive">
              {(createMut.error as Error).message}
            </p>
          )}
        </form>
      )}

      {tenantsQ.isLoading && <p className="text-sm text-muted-foreground">Loading tenants…</p>}
      {tenantsQ.error && (
        <p className="text-sm text-destructive">
          Failed to load: {(tenantsQ.error as Error).message}
        </p>
      )}

      <div className="grid gap-4">
        {tenantsQ.data?.map((t) => (
          <article
            key={t.id}
            className="grid gap-4 rounded-2xl border border-border bg-surface p-4 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{t.name}</h2>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.slug}</code>
                <StatusBadge status={t.status} />
                <PlanBadge plan={t.plan} />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <PackageIcon className="h-3 w-3" /> {t.usage.products} products
                </span>
                <span>· {t.usage.categories} categories</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {t.usage.members} members
                </span>
                <span>
                  · limit: {Number.isFinite(t.limits.maxProducts) ? t.limits.maxProducts : "∞"}{" "}
                  products
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-border bg-background/50 px-2 py-1.5 text-xs"
                value={t.plan}
                onChange={(e) =>
                  planMut.mutate({
                    id: t.id,
                    plan: e.target.value as "free" | "pro" | "enterprise",
                  })
                }
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              {t.status === "active" ? (
                <button
                  onClick={() => statusMut.mutate({ id: t.id, status: "suspended" })}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
                >
                  <Pause className="h-3 w-3" /> Suspend
                </button>
              ) : (
                <button
                  onClick={() => statusMut.mutate({ id: t.id, status: "active" })}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent"
                >
                  <Play className="h-3 w-3" /> Activate
                </button>
              )}
            </div>
          </article>
        ))}
        {tenantsQ.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No tenants yet.</p>
        )}
      </div>

      {/* Marketplace Vendors Section */}
      <section className="pt-8 border-t border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Marketplace Vendors (التجار)</h2>
            <p className="text-xs text-muted-foreground">
              Review vendor applications, set commissions, and approve marketplace seller stores.
            </p>
          </div>
        </div>

        <VendorManagementList />
      </section>
    </div>
  );
}

function VendorManagementList() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    setLoading(true);
    const { listAllVendorsForAdmin } = await import("@/lib/services/vendor.service");
    const { supabase } = await import("@/integrations/supabase/client");
    const data = await listAllVendorsForAdmin(supabase);
    setVendors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleUpdateStatus = async (vendorId: string, status: any, rate?: number) => {
    const { updateVendorStatusByAdmin } = await import("@/lib/services/vendor.service");
    const { supabase } = await import("@/integrations/supabase/client");
    await updateVendorStatusByAdmin(supabase, vendorId, status, rate);
    fetchVendors();
  };

  if (loading) return <p className="text-xs text-muted-foreground">Loading vendors...</p>;

  return (
    <div className="space-y-3">
      {vendors.map((v) => (
        <div
          key={v.id}
          className="p-4 rounded-xl border border-border bg-surface flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{v.name}</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v.slug}</code>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  v.status === "active"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : v.status === "pending"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500"
                }`}
              >
                {v.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              العمولة: {v.commission_rate}% ({v.commission_type}) • التقييم: ★ {v.rating ?? 5.0}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {v.status === "pending" && (
              <button
                onClick={() => handleUpdateStatus(v.id, "active")}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                موافقة وتفعيل
              </button>
            )}
            {v.status === "active" ? (
              <button
                onClick={() => handleUpdateStatus(v.id, "suspended")}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
              >
                إيقاف مؤقت
              </button>
            ) : (
              <button
                onClick={() => handleUpdateStatus(v.id, "active")}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                تفعيل المتجر
              </button>
            )}
          </div>
        </div>
      ))}
      {vendors.length === 0 && <p className="text-xs text-muted-foreground">لا يوجد تجار حالياً.</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "suspended" | "pending" }) {
  const cls =
    status === "active"
      ? "bg-success/15 text-success"
      : status === "suspended"
        ? "bg-destructive/15 text-destructive"
        : "bg-warning/15 text-warning";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      {status}
    </span>
  );
}

function PlanBadge({ plan }: { plan: "free" | "pro" | "enterprise" }) {
  const cls =
    plan === "enterprise"
      ? "bg-primary/15 text-primary"
      : plan === "pro"
        ? "bg-primary-light/15 text-primary"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      {plan}
    </span>
  );
}
