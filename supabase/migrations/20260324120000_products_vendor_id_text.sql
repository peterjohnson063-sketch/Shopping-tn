-- products.vendor_id → text so both UUID and numeric public.users.id work (matches app after session heal).
-- Run once in Supabase Dashboard → SQL.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'products'
      AND c.column_name = 'vendor_id'
      AND c.data_type <> 'text'
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_vendor_id_fkey;
    ALTER TABLE public.products
      ALTER COLUMN vendor_id TYPE text USING (
        CASE
          WHEN vendor_id IS NULL THEN NULL
          ELSE trim(vendor_id::text)
        END
      );
    COMMENT ON COLUMN public.products.vendor_id IS 'Owning vendor: public.users.id as text (UUID or numeric string).';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
