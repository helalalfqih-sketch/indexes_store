-- SECURITY DEFINER functions run with their owner's privileges and must not
-- inherit PostgreSQL's default EXECUTE grant to PUBLIC.

BEGIN;

-- Trigger functions and server-only RPCs are never called directly by browsers.
REVOKE ALL ON FUNCTION public.apply_inventory_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attach_tenant_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, text, text, jsonb, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_best_sellers(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_whatsapp_tenant_by_phone(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.insert_media_file(uuid, text, text, text, text, text, bigint, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_sale(uuid, uuid, uuid, integer, numeric, numeric, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_webhook_event(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_webhook_event_status(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.apply_inventory_movement() TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_tenant_owner() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, uuid, public.notification_type, text, text, jsonb, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_best_sellers(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_whatsapp_tenant_by_phone(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_media_file(uuid, text, text, text, text, text, bigint, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_sale(uuid, uuid, uuid, integer, numeric, numeric, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_webhook_event(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_webhook_event_status(uuid, text, text, text) TO service_role;

-- Authorization helpers are required by authenticated server functions and RLS.
-- They must not be callable by anonymous clients.
REVOKE ALL ON FUNCTION public.can_manage_tenant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_tenant_permission(uuid, uuid, public.tenant_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_tenant_role(uuid, uuid, public.tenant_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_tenant_member(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_manage_tenant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_tenant_permission(uuid, uuid, public.tenant_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, uuid, public.tenant_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated, service_role;

-- Authenticated interaction with these two RPCs is intentional and internally
-- authorization-checked. Remove only the inherited PUBLIC/anonymous grants.
REVOKE ALL ON FUNCTION public.increment_review_helpful(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_order_branch(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_order_branch(uuid, uuid) TO authenticated, service_role;

COMMIT;
