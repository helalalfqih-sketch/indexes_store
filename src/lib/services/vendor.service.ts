import type { SupabaseClient } from '@supabase/supabase-js';
import type { VendorRegisterInput, VendorProfileInput, VendorSettingsInput } from '../validators/vendor';

type DB = SupabaseClient<any>;

export interface VendorDetails {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  is_featured: boolean;
  commission_type: 'percentage' | 'fixed';
  commission_rate: number;
  fixed_commission_amount: number;
  rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface VendorAnalytics {
  total_sales: number;
  total_orders: number;
  net_earnings: number;
  pending_commission: number;
  active_products: number;
}

/**
 * Fetch vendor record associated with a user account.
 */
export async function getVendorByUserId(db: DB, userId: string): Promise<VendorDetails | null> {
  const { data, error } = await db
    .from('vendors')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as VendorDetails;
}

/**
 * Fetch public vendor details by slug.
 */
export async function getVendorBySlug(db: DB, slug: string): Promise<VendorDetails | null> {
  const { data, error } = await db
    .from('vendors')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return data as VendorDetails;
}

/**
 * Register a new vendor store.
 */
export async function registerVendor(
  db: DB,
  userId: string,
  tenantId: string,
  input: VendorRegisterInput
): Promise<VendorDetails | null> {
  const { data, error } = await db
    .from('vendors')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: 'pending',
      commission_type: 'percentage',
      commission_rate: 10.00,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error registering vendor:', error);
    return null;
  }

  const vendor = data as VendorDetails;

  // Initialize vendor profile
  await db.from('vendor_profiles').insert({
    vendor_id: vendor.id,
    business_type: input.business_type,
    contact_email: input.contact_email,
    contact_phone: input.contact_phone,
  });

  // Initialize vendor settings
  await db.from('vendor_settings').insert({
    vendor_id: vendor.id,
    auto_accept_orders: true,
  });

  return vendor;
}

/**
 * Get vendor profile details.
 */
export async function getVendorProfile(db: DB, vendorId: string) {
  const { data, error } = await db
    .from('vendor_profiles')
    .select('*')
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Update vendor profile & legal/bank details.
 */
export async function updateVendorProfile(
  db: DB,
  vendorId: string,
  input: VendorProfileInput
) {
  const { data, error } = await db
    .from('vendor_profiles')
    .upsert({
      vendor_id: vendorId,
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error updating vendor profile:', error);
    return null;
  }
  return data;
}

/**
 * Fetch vendor dashboard analytics summary.
 */
export async function getVendorAnalytics(db: DB, vendorId: string): Promise<VendorAnalytics> {
  const [ordersRes, productsRes, commissionsRes] = await Promise.all([
    db.from('vendor_orders').select('subtotal, net_amount').eq('vendor_id', vendorId),
    db.from('products').select('id', { count: 'exact' }).eq('vendor_id', vendorId),
    db.from('vendor_commissions').select('commission_amount, payout_status').eq('vendor_id', vendorId),
  ]);

  const orders = ordersRes.data ?? [];
  const totalSales = orders.reduce((sum, o) => sum + Number(o.subtotal ?? 0), 0);
  const netEarnings = orders.reduce((sum, o) => sum + Number(o.net_amount ?? 0), 0);
  const activeProducts = productsRes.count ?? 0;

  const commissions = commissionsRes.data ?? [];
  const pendingCommission = commissions
    .filter((c) => c.payout_status === 'pending')
    .reduce((sum, c) => sum + Number(c.commission_amount ?? 0), 0);

  return {
    total_sales: totalSales,
    total_orders: orders.length,
    net_earnings: netEarnings,
    pending_commission: pendingCommission,
    active_products: activeProducts,
  };
}

/**
 * List all vendors for platform administration.
 */
export async function listAllVendorsForAdmin(db: DB) {
  const { data, error } = await db
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as VendorDetails[];
}

/**
 * Platform admin updates vendor status or commission.
 */
export async function updateVendorStatusByAdmin(
  db: DB,
  vendorId: string,
  status: 'pending' | 'active' | 'suspended' | 'rejected',
  commissionRate?: number,
  commissionType?: 'percentage' | 'fixed'
) {
  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (commissionRate !== undefined) updatePayload.commission_rate = commissionRate;
  if (commissionType !== undefined) updatePayload.commission_type = commissionType;

  const { data, error } = await db
    .from('vendors')
    .update(updatePayload)
    .eq('id', vendorId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating vendor status:', error);
    return null;
  }
  return data as VendorDetails;
}
