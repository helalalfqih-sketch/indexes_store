BEGIN;

ALTER FUNCTION public.update_storefront_settings_updated_at()
  SET search_path = public;

ALTER FUNCTION public.update_ai_agent_tasks_updated_at()
  SET search_path = public;

COMMIT;
