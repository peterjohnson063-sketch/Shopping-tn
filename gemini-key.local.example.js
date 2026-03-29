/* Copy to gemini-key.local.js (same folder as index.html). Gitignored.
   Flow: Cloudflare Worker is tried first; browser uses this key only as fallback on http(s).
   API: v1beta — tries gemini-2.0-flash, gemini-flash-latest, etc. (see yasmine.js).

   Live site: upload gemini-key.local.js next to index.html, or set Worker secret only:
   workers/yasmine-proxy/README.md */
window.EVEREST_GEMINI_API_KEY = 'AIzaSyApGwkeucofgLdb_y2YtpVdajPxmOzPwaU';
