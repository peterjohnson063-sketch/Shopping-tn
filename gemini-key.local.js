/* Safe to commit — empty placeholder. Does not override a key already set by everest-env.js (GitHub Actions).
   For a local-only API key, set EVEREST_GEMINI_API_KEY here while developing; do not commit real AIza keys. */
(function () {
  if (typeof window.EVEREST_GEMINI_API_KEY === 'undefined' || !String(window.EVEREST_GEMINI_API_KEY || '').trim()) {
    window.EVEREST_GEMINI_API_KEY = '';
  }
})();
