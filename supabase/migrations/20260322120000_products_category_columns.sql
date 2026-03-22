-- Shopping-tn — products category columns for PostgREST / Supabase API
-- Run the whole file in: Supabase Dashboard → SQL → New query → Run
--
-- Your error ("Could not find the 'cat' column") happens because the frontend
-- used to send JSON key `cat` while many schemas use `category` instead.
-- The JS client now maps `cat` → `category` by default (see supabase-fixed.js).
--
-- Use ONE of sections (1), (2), or (3) depending on what you want.

-- ── (1) Text slug column named `category` (recommended; matches client default) ──
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category text;

COMMENT ON COLUMN public.products.category IS 'Category slug, e.g. furniture, decor, ceramics';

-- Optional backfill from legacy `cat` if you added `cat` manually earlier:
-- UPDATE public.products SET category = cat WHERE category IS NULL AND cat IS NOT NULL;


-- ── (2) If you prefer the column to be literally named `cat` ──
-- ALTER TABLE public.products
--   ADD COLUMN IF NOT EXISTS cat text;
-- Then in index.html BEFORE supabase-fixed.js, add:
--   <script>window.STN_PRODUCT_CATEGORY_COLUMN = 'cat';</script>


-- ── (3) Optional: FK to a `categories` table (only if that table exists) ──
-- ALTER TABLE public.products
--   ADD COLUMN IF NOT EXISTS category_id bigint REFERENCES public.categories (id);


-- ── (4) Vendor upload: long text + image (mapped from form `desc` → `description`, `image` → `image_url`) ──
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;


-- ── (5) Previous / list price for sales (mapped from app `oldPrice` → `old_price`, numeric) ──
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS old_price numeric;

COMMENT ON COLUMN public.products.old_price IS 'Optional higher “was” price; null when no discount';


-- ── Reload PostgREST schema cache (Supabase) ──
-- Usually the API picks up new columns within a short time after DDL.
-- If inserts still fail with "schema cache", run:
NOTIFY pgrst, 'reload schema';

-- If NOTIFY alone does not help: Dashboard → Project Settings → pause project → resume,
-- or contact Supabase support; hosted projects normally refresh after migrations.
