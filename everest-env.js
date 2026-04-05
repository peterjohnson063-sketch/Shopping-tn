/* Overwritten on deploy: GitHub Actions writes window.EVEREST_GEMINI_API_KEY from secret GEMINI_API_KEY.
   Local dev: leave empty; use gemini-key.local.js (gitignored) for a real key. Never commit API keys. */
if (typeof window.EVEREST_GEMINI_API_KEY === 'undefined') {
  window.EVEREST_GEMINI_API_KEY = '';
}
