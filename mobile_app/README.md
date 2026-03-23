# Everest Delivery Mobile App (Flutter)

Real driver app connected to the same Supabase database as the website.

## Included now

- Driver login (`users` table, role = `driver`)
- Assigned orders list (`orders.driver_id`)
- Optimized route launch (vendor -> customer) via Google Maps
- Driver actions:
  - Out for delivery
  - Delivered (with proof note)
- Live GPS writeback (`orders.driver_lat`, `orders.driver_lng`)
- Tracking events write (`order_tracking`)

## Setup

1. Install Flutter SDK.
2. Open this folder:
   - `mobile_app/`
3. Run:
   - `flutter pub get`
   - `flutter run`

## Notes

- This app uses your existing Supabase URL and anon key from web config.
- For production-level security, use real Supabase Auth JWT sessions and strict RLS policies.
