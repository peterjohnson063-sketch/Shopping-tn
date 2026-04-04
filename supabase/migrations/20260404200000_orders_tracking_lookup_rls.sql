-- Everest: help the Track page find orders by `tracking_number` with the anon API key.
-- If SB.findOrder() returns empty but the row exists, RLS is likely blocking SELECT on `public.orders`.
--
-- Option A — demo / internal: allow read on all orders (simple; tighten later).
-- Option B — production: use a Supabase Edge Function with service_role to resolve tracking, or narrow policies.

ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_anon_select_for_tracking_v1" ON public.orders;
CREATE POLICY "orders_anon_select_for_tracking_v1"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);

-- If you already have conflicting SELECT policies, merge manually or drop duplicates.
NOTIFY pgrst, 'reload schema';
