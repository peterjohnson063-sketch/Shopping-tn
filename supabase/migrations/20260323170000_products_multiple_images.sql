-- Allow vendors to save up to 4 product image URLs.
-- Run once in Supabase SQL editor (or via migration runner).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.product_images IS
  'Array of product image URLs (frontend currently limits to 4).';

-- Optional backfill for old single-image rows.
UPDATE public.products
SET product_images = jsonb_build_array(image_url)
WHERE (product_images IS NULL OR jsonb_array_length(product_images) = 0)
  AND image_url IS NOT NULL
  AND trim(image_url) <> '';

NOTIFY pgrst, 'reload schema';
