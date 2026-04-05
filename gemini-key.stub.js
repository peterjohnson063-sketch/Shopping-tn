/* Safe to commit. Key sources (local.js wins if present):
   - window.EVEREST_GEMINI_API_KEY — set by everest-env.js (GitHub Actions injects at deploy).
   - window.__EVEREST_ENV__.GEMINI_API_KEY — optional alternate (manual / other tooling).
   - gemini-key.local.js — gitignored; copy from gemini-key.local.example.js. */
(function () {
  var env =
    typeof window !== 'undefined' && typeof window.__EVEREST_ENV__ === 'object' && window.__EVEREST_ENV__
      ? window.__EVEREST_ENV__
      : {};
  var fromEnv = String(env.GEMINI_API_KEY || env.EVEREST_GEMINI_API_KEY || '').trim();
  var existing =
    typeof window.EVEREST_GEMINI_API_KEY !== 'undefined'
      ? String(window.EVEREST_GEMINI_API_KEY || '').trim()
      : '';
  if (typeof window.EVEREST_GEMINI_API_KEY === 'undefined') {
    window.EVEREST_GEMINI_API_KEY = fromEnv || '';
  } else if (!existing && fromEnv) {
    window.EVEREST_GEMINI_API_KEY = fromEnv;
  }
})();
