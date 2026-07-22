import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateCommission } from './commission.service';

type DB = SupabaseClient<any>;

export interface OrderItemWithVendor {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  vendor_id: string | null;
}

/**
 * Split a customer order into vendor sub-orders when products belong to different vendors.
 */
export async function splitOrderIntoVendorOrders(
  db: DB,
  params: {
    tenantId: string;
    orderId: string;
    items: OrderItemWithVendor[];
  }
) {
  // Group items by vendor_id (null vendor_id = main store items)
  const vendorGroups: Record<string, OrderItemWithVendor[]> = {};

  for (const item of params.items) {
    const key = item.vendor_id ?? 'MAIN_STORE';
    if (!vendorGroups[key]) vendorGroups[key] = [];
    vendorGroups[key].push(item);
  }

  const createdSubOrders = [];

  for (const [vendorKey, groupItems] of Object.entries(vendorGroups)) {
    // If items belong to main store, no vendor_orders sub-record needed
    if (vendorKey === 'MAIN_STORE') continue;

    // Fetch vendor details for commission rates
    const { data: vendor } = await db
      .from('vendors')
      .select('id, commission_type, commission_rate, fixed_commission_amount')
      .eq('id', vendorKey)
      .maybeSingle();

    if (!vendor) continue;

    const subtotal = groupItems.reduce((sum, item) => sum + Number(item.total_price ?? 0), 0);

    const commission = calculateCommission(
      subtotal,
      vendor.commission_type ?? 'percentage',
      Number(vendor.commission_rate ?? 10),
      Number(vendor.fixed_commission_amount ?? 0)
    );

    // Generate vendor order number: VORD-{8-hex}-{short-vendor-id}
    const shortVendor = vendorKey.substring(0, 4).toUpperCase();
    const shortOrder = params.orderId.substring(0, 8).toUpperCase();
    const vendorOrderNumber = `VORD-${shortOrder}-${shortVendor}`;

    // Create sub-order
    const { data: subOrder, error: subOrderErr } = await db
      .from('vendor_orders')
      .insert({
        tenant_id: params.tenantId,
        order_id: params.orderId,
        vendor_id: vendor.id,
        vendor_order_number: vendorOrderNumber,
        subtotal: commission.grossAmount,
        commission_amount: commission.commissionAmount,
        net_amount: commission.netAmount,
        status: 'pending',
      })
      .select('*')
      .single();

    if (subOrderErr || !subOrder) {
      console.error('Error creating vendor sub-order:', subOrderErr);
      continue;
    }

    // Link line items
    const lineItemsPayload = groupItems.map((item) => ({
      vendor_order_id: subOrder.id,
      order_item_id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    await db.from('vendor_order_items').insert(lineItemsPayload);

    // Log commission entry
    await db.from('vendor_commissions').insert({
      tenant_id: params.tenantId,
      vendor_id: vendor.id,
      order_id: params.orderId,
      vendor_order_id: subOrder.id,
      gross_amount: commission.grossAmount,
      commission_type: commission.commissionType,
      commission_rate: commission.commissionRate,
      commission_amount: commission.commissionAmount,
      net_amount: commission.netAmount,
      payout_status: 'pending',
    });

    createdSubOrders.push(subOrder);
  }

  return createdSubOrders;
}

/**
 * Fetch orders for a specific vendor dashboard.
 */
export async function getVendorOrders(db: DB, vendorId: string) {
  const { data, error } = await db
    .from('vendor_orders')
    .select(`
      *,
      orders (
        customer_name,
        customer_phone,
        customer_address,
        created_at
      )
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

/**
 * Update vendor order status.
 */
export async function updateVendorOrderStatus(
  db: DB,
  vendorOrderId: string,
  vendorId: string,
  newStatus: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  trackingNumber?: string
) {
  const payload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (trackingNumber) payload.tracking_number = trackingNumber;

  const { data, error } = await db
    .from('vendor_orders')
    .update(payload)
    .eq('id', vendorOrderId)
    .eq('vendor_id', vendorId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating vendor order status:', error);
    return null;
  }
  return data;
}
