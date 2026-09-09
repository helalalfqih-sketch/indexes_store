-- CHECKOUT-001: validate products and create the complete order atomically.
-- Each function call is one transaction. Any exception rolls back the order.
-- Keep this migration self-contained because some deployed environments have
-- legacy orders columns even when later repository migrations exist.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS idempotency_key uuid;

CREATE UNIQUE INDEX IF NOT EXISTS orders_tenant_idempotency_key_unique
  ON public.orders (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_checkout_order_v2(
  _tenant_id uuid,
  _user_id uuid,
  _customer_name text,
  _customer_phone text,
  _customer_address text,
  _customer_email text,
  _notes text,
  _coupon_code text,
  _expected_total numeric,
  _payment_provider text,
  _idempotency_key uuid,
  _items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_order_id uuid;
  v_existing public.orders%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_item jsonb;
  v_item_rows jsonb := '[]'::jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_shipping_fee numeric(12,2) := 3000;
  v_total numeric(12,2);
  v_currency text := null;
  v_inserted_count integer := 0;
  v_has_restock_item boolean := false;
  v_final_notes text := COALESCE(_notes, '');
  v_cart_config jsonb;
  v_free_shipping_threshold numeric := 30000;
  v_default_shipping_fee numeric := 3000;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = _tenant_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'CHECKOUT_TENANT_UNAVAILABLE';
  END IF;

  IF jsonb_typeof(_items) <> 'array'
     OR jsonb_array_length(_items) < 1
     OR jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'CHECKOUT_ITEMS_INVALID';
  END IF;

  IF _idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.orders
    WHERE tenant_id = _tenant_id AND idempotency_key = _idempotency_key
    LIMIT 1;

    IF FOUND THEN
      SELECT count(*) INTO v_inserted_count
      FROM public.order_items
      WHERE tenant_id = _tenant_id AND order_id = v_existing.id;
      IF v_inserted_count <> jsonb_array_length(_items) THEN
        RAISE EXCEPTION 'CHECKOUT_IDEMPOTENCY_INCOMPLETE';
      END IF;
      RETURN jsonb_build_object(
        'orderId', v_existing.id,
        'total', v_existing.total,
        'currency', v_existing.currency,
        'itemsCount', v_inserted_count
      );
    END IF;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(_items)
  LOOP
    IF v_item->>'source' <> 'supabase' THEN
      RAISE EXCEPTION 'CHECKOUT_PRODUCT_SOURCE_UNSUPPORTED';
    END IF;
    BEGIN
      v_product_id := (v_item->>'id')::uuid;
      v_quantity := (v_item->>'quantity')::integer;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'CHECKOUT_ITEM_INVALID';
    END;
    IF v_quantity < 1 OR v_quantity > 999 THEN
      RAISE EXCEPTION 'CHECKOUT_QUANTITY_INVALID';
    END IF;

    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_product_id
      AND tenant_id = _tenant_id
      AND is_published = true
    FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'CHECKOUT_PRODUCT_UNAVAILABLE';
    END IF;

    v_unit_price := v_product.price;
    IF v_unit_price IS NULL OR v_unit_price <= 0 THEN
      RAISE EXCEPTION 'CHECKOUT_PRODUCT_PRICE_INVALID';
    END IF;
    IF v_currency IS NULL THEN
      v_currency := COALESCE(v_product.currency, 'YER');
    ELSIF v_currency <> COALESCE(v_product.currency, 'YER') THEN
      RAISE EXCEPTION 'CHECKOUT_MIXED_CURRENCY';
    END IF;
    IF COALESCE(v_product.stock, 0) <= 0 THEN
      v_has_restock_item := true;
    ELSIF v_quantity > v_product.stock THEN
      RAISE EXCEPTION 'CHECKOUT_INSUFFICIENT_STOCK';
    END IF;

    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_item_rows := v_item_rows || jsonb_build_array(jsonb_build_object(
      'tenant_id', _tenant_id,
      'product_id', v_product.id,
      'quantity', v_quantity,
      'unit_price', v_unit_price,
      'total_price', v_line_total,
      'product_name_snapshot', v_product.name,
      'product_sku_snapshot', v_product.sku
    ));
  END LOOP;

  CASE upper(trim(COALESCE(_coupon_code, '')))
    WHEN 'INDEXES10' THEN v_discount := round(v_subtotal * 0.10);
    WHEN 'INDEXES20' THEN v_discount := round(v_subtotal * 0.20);
    ELSE v_discount := 0;
  END CASE;

  SELECT value INTO v_cart_config
  FROM public.storefront_settings
  WHERE tenant_id = _tenant_id AND key = 'cart_config'
  ORDER BY updated_at DESC
  LIMIT 1;
  IF COALESCE(v_cart_config->>'freeShippingThreshold', v_cart_config->>'free_shipping_threshold', '') ~ '^[0-9]+(?:\.[0-9]+)?$' THEN
    v_free_shipping_threshold := COALESCE(
      v_cart_config->>'freeShippingThreshold',
      v_cart_config->>'free_shipping_threshold'
    )::numeric;
  END IF;
  IF COALESCE(v_cart_config->>'defaultShippingFee', v_cart_config->>'default_shipping_fee', '') ~ '^[0-9]+(?:\.[0-9]+)?$' THEN
    v_default_shipping_fee := COALESCE(
      v_cart_config->>'defaultShippingFee',
      v_cart_config->>'default_shipping_fee'
    )::numeric;
  END IF;

  v_shipping_fee := CASE
    WHEN v_subtotal - v_discount >= v_free_shipping_threshold THEN 0
    ELSE v_default_shipping_fee
  END;
  v_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);
  IF _expected_total IS NOT NULL AND abs(_expected_total - v_total) > 0.01 THEN
    RAISE EXCEPTION 'CHECKOUT_TOTAL_CHANGED';
  END IF;

  IF v_has_restock_item THEN
    v_final_notes := CASE
      WHEN v_final_notes = '' THEN '[restock requested: stock 0]'
      ELSE v_final_notes || ' | [restock requested: stock 0]'
    END;
  END IF;

  INSERT INTO public.orders (
    tenant_id, user_id, customer_name, customer_phone, customer_address,
    customer_email, notes, status, payment_status, payment_provider,
    subtotal, shipping_fee, total, currency, coupon_code, discount_amount,
    idempotency_key
  ) VALUES (
    _tenant_id, _user_id, _customer_name, _customer_phone, _customer_address,
    _customer_email, NULLIF(v_final_notes, ''), 'pending', 'pending', _payment_provider,
    v_subtotal, v_shipping_fee, v_total, COALESCE(v_currency, 'YER'),
    NULLIF(trim(COALESCE(_coupon_code, '')), ''), v_discount, _idempotency_key
  )
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (
    order_id, tenant_id, product_id, quantity, unit_price, total_price,
    product_name_snapshot, product_sku_snapshot
  )
  SELECT
    v_order_id, x.tenant_id, x.product_id, x.quantity, x.unit_price,
    x.total_price, x.product_name_snapshot, x.product_sku_snapshot
  FROM jsonb_to_recordset(v_item_rows) AS x(
    tenant_id uuid,
    product_id uuid,
    quantity integer,
    unit_price numeric,
    total_price numeric,
    product_name_snapshot text,
    product_sku_snapshot text
  );

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  IF v_inserted_count <> jsonb_array_length(_items) THEN
    RAISE EXCEPTION 'CHECKOUT_LINE_ITEM_COUNT_MISMATCH';
  END IF;

  INSERT INTO public.order_status_history (
    order_id, tenant_id, from_status, to_status, changed_by, note
  ) VALUES (
    v_order_id, _tenant_id, NULL, 'pending', _user_id,
    'Order created via atomic checkout'
  );

  RETURN jsonb_build_object(
    'orderId', v_order_id,
    'total', v_total,
    'currency', COALESCE(v_currency, 'YER'),
    'itemsCount', v_inserted_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_checkout_order_v2(
  uuid, uuid, text, text, text, text, text, text, numeric, text, uuid, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_checkout_order_v2(
  uuid, uuid, text, text, text, text, text, text, numeric, text, uuid, jsonb
) TO service_role;
