# Everest Next.js Marketplace

Next.js 14 + Tailwind + Supabase implementation for Everest custom furniture.

## Includes

- Admin vendor management route: `/admin/vendors`
- Vendor dashboard: `/vendor`
- Vendor inventory workflow with album-based product variations:
  - Product -> multiple albums (material/color)
  - Per-album gallery images
  - Per-album `.glb/.gltf` model URL
  - Per-album stock availability (`ready` or `made_to_order`)
- Client product view: `/products/[slug]`
  - Dynamic album switching
  - Dynamic gallery + model update
  - `<model-viewer>` with AR, auto-rotate, camera controls, shadow intensity
  - Dimensions spec table (L/W/H)
- Vendor custom orders screen: `/vendor/orders`
- Supabase migration with RLS role architecture

## Setup

1. Install dependencies:
   - `npm install`
2. Copy env file:
   - `cp .env.example .env.local` (or create `.env.local` manually on Windows)
3. Add Supabase values in `.env.local`.
4. Apply migration from repo root:
   - `supabase db push`
5. Create storage buckets in Supabase:
   - `product-images` (public)
   - `product-models` (public)
   - `custom-order-models` (private or signed URL)
6. Start app:
   - `npm run dev`

## Role model

- `profiles.role = admin` can create/manage vendors.
- `profiles.role = vendor` can manage only own products/albums/images and view own custom orders.
- `profiles.role = client` can browse products and place custom orders.
