/**
 * Branch Manager Component
 * Multi-store branch management UI
 */
import { useState } from "react";
import { MapPin, Phone, Mail, Plus, Edit2, Trash2, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { listBranches, createBranch, updateBranch, deleteBranch } from "@/lib/branch.functions";
import { useCurrentTenant } from "@/components/tenant-provider";
import type { Database } from "@/integrations/supabase/types";

type BranchRow = Database["public"]["Tables"]["branches"]["Row"];

export function BranchManager() {
  const { tenant } = useCurrentTenant();
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRow | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    latitude: "",
    longitude: "",
    isMainBranch: false,
    managerName: "",
    managerPhone: "",
  });

  const listBranchesFn = useServerFn(listBranches);
  const createBranchFn = useServerFn(createBranch);
  const updateBranchFn = useServerFn(updateBranch);
  const deleteBranchFn = useServerFn(deleteBranch);

  const loadBranches = async () => {
    if (!tenant?.id) return;
    try {
      const data = await listBranchesFn();
      setBranches(data as BranchRow[]);
    } catch (e) {
      console.error("Failed to load branches:", e);
    }
  };

  const handleSubmit = async () => {
    if (!tenant?.id) return;
    try {
      if (editingBranch) {
        await updateBranchFn({
          data: {
            id: editingBranch.id,
            tenantId: tenant.id,
            updates: {
              ...formData,
              latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
              longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
            },
          },
        });
      } else {
        await createBranchFn({
          data: {
            tenantId: tenant.id,
            ...formData,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          },
        });
      }
      setIsOpen(false);
      setEditingBranch(null);
      loadBranches();
    } catch (e) {
      console.error("Failed to save branch:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!tenant?.id) return;
    if (!confirm("هل أنت متأكد من حذف هذا الفرع؟")) return;
    try {
      await deleteBranchFn({ data: { id, tenantId: tenant.id } });
      loadBranches();
    } catch (e) {
      console.error("Failed to delete branch:", e);
    }
  };

  const openEdit = (branch: BranchRow) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      slug: branch.slug,
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      email: branch.email || "",
      latitude: branch.latitude ? String(branch.latitude) : "",
      longitude: branch.longitude ? String(branch.longitude) : "",
      isMainBranch: branch.is_main_branch,
      managerName: branch.manager_name || "",
      managerPhone: branch.manager_phone || "",
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة الفروع</h2>
          <p className="text-muted-foreground">إدارة فروع متجرك</p>
        </div>
        <Button
          onClick={() => {
            setEditingBranch(null);
            setIsOpen(true);
          }}
        >
          <Plus className="ml-2 h-4 w-4" />
          فرع جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <Card key={branch.id} className={branch.is_main_branch ? "border-primary" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {branch.name}
                  {branch.is_main_branch && <Badge variant="default">الفرع الرئيسي</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(branch)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(branch.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {branch.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {branch.address}, {branch.city}
                  </span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{branch.phone}</span>
                </div>
              )}
              {branch.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{branch.email}</span>
                </div>
              )}
              {branch.latitude && branch.longitude && (
                <Badge variant="outline" className="text-xs">
                  {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBranch ? "تعديل فرع" : "فرع جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>اسم الفرع</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>الرابط (slug)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>العنوان</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label>الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>خط العرض</Label>
              <Input
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>
            <div>
              <Label>خط الطول</Label>
              <Input
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
            <div>
              <Label>اسم المدير</Label>
              <Input
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              />
            </div>
            <div>
              <Label>هاتف المدير</Label>
              <Input
                value={formData.managerPhone}
                onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>{editingBranch ? "حفظ التغييرات" : "إنشاء فرع"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
