import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldCheck,
  UserPlus,
  Users,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Edit2,
  Trash2,
  Loader2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  listTenantMembers,
  updateMemberRole,
  removeTenantMember,
  ALL_PERMISSIONS,
  ROLE_PRESETS,
  type TenantMemberRecord,
  type TenantRole,
  type PermissionKey,
} from "@/lib/users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "المستخدمون والصلاحيات — لوحة الإدارة" },
      { name: "description", content: "إدارة أدوار فريق العمل وصلاحيات الوصول للنظام." },
    ],
  }),
  component: AdminUsersComponent,
});

function AdminUsersComponent() {
  const queryClient = useQueryClient();
  const fetchMembersFn = useServerFn(listTenantMembers);
  const updateRoleFn = useServerFn(updateMemberRole);
  const removeMemberFn = useServerFn(removeTenantMember);

  const [editingMember, setEditingMember] = useState<TenantMemberRecord | null>(null);
  const [selectedRole, setSelectedRole] = useState<TenantRole>("employee");
  const [selectedPerms, setSelectedPerms] = useState<PermissionKey[]>([]);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-tenant-members"],
    queryFn: () => fetchMembersFn(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateRoleFn>[0]["data"]) => updateRoleFn({ data }),
    onSuccess: () => {
      toast.success("تم تحديث دور وصلاحيات العضو بنجاح ✨");
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-members"] });
      setEditingMember(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء تعديل الصلاحيات");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => removeMemberFn({ data: { memberId } }),
    onSuccess: () => {
      toast.success("تم إزالة العضو بنجاح من المتجر");
      queryClient.invalidateQueries({ queryKey: ["admin-tenant-members"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "فشل إزالة العضو");
    },
  });

  const openEditModal = (m: TenantMemberRecord) => {
    setEditingMember(m);
    setSelectedRole(m.role);
    setSelectedPerms(m.permissions || ROLE_PRESETS[m.role] || []);
  };

  const handleRoleChange = (role: TenantRole) => {
    setSelectedRole(role);
    setSelectedPerms(ROLE_PRESETS[role] || []);
  };

  const togglePermission = (perm: PermissionKey) => {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            إدارة المستخدمين والصلاحيات (RBAC)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تعيين أدوار فريق العمل وتحديد صلاحيات الوصول الدقيقة لموديلات النظام مع الحماية التامة بروافد RLS.
          </p>
        </div>
      </div>

      {/* Tenant RLS Security Banner */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-primary shrink-0" />
        <p className="text-xs text-primary font-semibold">
          نظام حماية المستأجرين (Tenant Isolation): مفعّل ومحمي عبر سياسات الأمان المباشرة Row Level Security (RLS).
        </p>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground font-bold uppercase">
              <tr>
                <th className="p-4 text-start">المستخدم</th>
                <th className="p-4 text-start">الدور الوظيفي (Role)</th>
                <th className="p-4 text-start">الصلاحيات الممنوحة</th>
                <th className="p-4 text-start">تاريخ الإنضمام</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-accent/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                        {m.profile?.full_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{m.profile?.full_name || "مستخدم متجر"}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{m.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                        m.role === "owner"
                          ? "bg-primary/15 text-primary"
                          : m.role === "manager"
                          ? "bg-success/15 text-success"
                          : m.role === "marketing"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.role === "owner" && "👑 مالك المتجر (Owner)"}
                      {m.role === "manager" && "💼 مدير (Manager)"}
                      {m.role === "marketing" && "📣 تسويق (Marketing)"}
                      {m.role === "employee" && "👷 موظف (Employee)"}
                      {m.role === "staff" && "👷 موظف (Staff)"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {m.role === "owner" ? (
                        <span className="text-[10px] font-bold text-primary">جميع الصلاحيات (Full Control)</span>
                      ) : m.permissions.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground">عرض فقط (Viewer)</span>
                      ) : (
                        m.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-md bg-accent px-1.5 py-0.5 text-[9px] font-bold text-foreground"
                          >
                            {p}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("ar-YE")}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(m)}
                        title="تعديل الدور والصلاحيات"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {m.role !== "owner" && (
                        <button
                          onClick={() => {
                            if (confirm("هل أنت تأكد من إزالة هذا العضو من المتجر؟")) {
                              removeMutation.mutate(m.id);
                            }
                          }}
                          title="حذف العضو"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Role & Permissions Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-showcase/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-surface border border-border p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> تعديل دور وصلاحيات العضو
              </h3>
              <button
                onClick={() => setEditingMember(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">اختر الدور الوظيفي (Role Preset)</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["owner", "manager", "marketing", "employee"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={editingMember.role === "owner" && r !== "owner"}
                    onClick={() => handleRoleChange(r)}
                    className={`rounded-xl border p-3 text-center text-xs font-bold transition ${
                      selectedRole === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-accent"
                    } disabled:opacity-40`}
                  >
                    {r === "owner" && "👑 Owner"}
                    {r === "manager" && "💼 Manager"}
                    {r === "marketing" && "📣 Marketing"}
                    {r === "employee" && "👷 Employee"}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions Matrix Checklist */}
            <div className="space-y-3">
              <label className="block text-xs font-bold">مصفوفة الصلاحيات المخصصة (Permissions Matrix)</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const checked = selectedRole === "owner" || selectedPerms.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                        checked
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={selectedRole === "owner"}
                        checked={checked}
                        onChange={() => togglePermission(perm.key)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <span>{perm.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold hover:bg-accent"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => {
                  updateMutation.mutate({
                    memberId: editingMember.id,
                    targetUserId: editingMember.user_id,
                    newRole: selectedRole,
                    permissions: selectedPerms,
                  });
                }}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {updateMutation.isPending ? "جارٍ الحفظ..." : "تطبيق الصلاحيات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
