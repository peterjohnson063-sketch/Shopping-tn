/* Copy to gemini-key.local.js (same folder as index.html). Gitignored.
   Key = Google AI Studio → Create API key (free tier). Restrict key: HTTP referrers include your live URL.

   Live (GitHub Pages): set repo secret GEMINI_API_KEY; push to main — Actions injects everest-env.js as window.EVEREST_GEMINI_API_KEY.
   Or upload gemini-key.local.js on the host. Optional Worker: workers/yasmine-proxy/README.md */
window.EVEREST_GEMINI_API_KEY = 'AIzaSy…';
