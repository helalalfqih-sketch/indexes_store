-- Run only in the isolated checkout-schema-fixture database, after both migrations.
DO $$
DECLARE
  rate integer;
  subtotal numeric;
  q jsonb;
  discount numeric;
  expected numeric;
BEGIN
  FOREACH rate IN ARRAY ARRAY[0,10,20] LOOP
    FOREACH subtotal IN ARRAY ARRAY[29999,30000,30001,36800,37500,37501] LOOP
      discount := round(subtotal * rate / 100);
      expected := subtotal - discount + CASE WHEN subtotal - discount >= 30000 THEN 0 ELSE 3000 END;
      q := public.checkout_totals_v1(subtotal, CASE WHEN rate=0 THEN '' ELSE 'INDEXES'||rate END, '{}');
      IF (q->>'total')::numeric <> expected THEN RAISE EXCEPTION 'quote threshold regression'; END IF;
    END LOOP;
  END LOOP;
  q := public.checkout_totals_v1(36800,'INDEXES20','{}');
  IF q->>'currency' <> 'YER' OR (q->>'total')::numeric <> 32440 OR (q->>'shipping')::numeric <> 3000 THEN
    RAISE EXCEPTION 'reported cart/delivery case regressed';
  END IF;
  BEGIN
    PERFORM public.checkout_totals_v1(36800,'INVALID','{}');
    RAISE EXCEPTION 'invalid coupon accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'CHECKOUT_COUPON_INVALID' THEN RAISE; END IF;
  END;
END $$;
