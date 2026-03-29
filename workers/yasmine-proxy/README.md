# Yasmine Gemini proxy (Cloudflare Worker)

Visitors never see a Gemini API key. The browser only calls this Worker; the key stays in `GEMINI_API_KEY`.

Models tried in order: **`gemini-1.5-flash-8b`**, **`gemini-1.5-flash-001`**, **`gemini-flash-latest`**, **`gemini-2.0-flash`**. On **429**, it tries the **next** model (limits can differ per model). Redeploy after pulling changes.

## One-time setup

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) and log in: `npx wrangler login`
2. From this folder (`workers/yasmine-proxy`):

   ```bash
   npx wrangler deploy
   npx wrangler secret put GEMINI_API_KEY
   ```

   Paste a key from [Google AI Studio](https://aistudio.google.com/apikey) (starts with `AIza`).

3. If your Worker URL changes, set `YASMINE_WORKER_URL` in `yasmine.js` to match.

## Redeploy after editing

```bash
npx wrangler deploy
```

To rotate the key: `npx wrangler secret put GEMINI_API_KEY` again, then redeploy if needed.
