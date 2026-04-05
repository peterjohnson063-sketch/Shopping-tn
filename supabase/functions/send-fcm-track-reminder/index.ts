/**
 * Optional Supabase Edge Function: send FCM HTTP v1 when the tab is closed.
 * Deploy: supabase functions deploy send-fcm-track-reminder
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(() => {
  return new Response(
    JSON.stringify({
      ok: true,
      hint: 'Implement FCM HTTP v1 + query orders/users with fcm_token',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
