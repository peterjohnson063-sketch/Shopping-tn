/**
 * Everest Yasmine — Gemini proxy. API key only in Worker secret GEMINI_API_KEY.
 */
var MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
var GEMINI_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models/';

var cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors),
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: { message: 'Use POST' } }, 405);
    }

    var key = env.GEMINI_API_KEY;
    if (!key || !String(key).trim()) {
      return jsonResponse({ error: { message: 'Worker misconfigured: missing GEMINI_API_KEY secret' } }, 200);
    }

    var body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: { message: 'Invalid JSON body' } }, 200);
    }

    var contents = body && body.contents;
    if (!contents || !Array.isArray(contents)) {
      return jsonResponse({ error: { message: 'Expected { contents: [...] }' } }, 200);
    }

    var lastData = { error: { message: 'No model responded' } };

    for (var i = 0; i < MODELS.length; i++) {
      var model = MODELS[i];
      var url = GEMINI_ROOT + model + ':generateContent?key=' + encodeURIComponent(String(key).trim());
      var r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents }),
      });
      var data;
      try {
        data = await r.json();
      } catch (je) {
        lastData = { error: { message: 'Non-JSON response', code: r.status } };
        if (r.status === 429 || r.status === 503) continue;
        return jsonResponse(lastData, 200);
      }
      lastData = data;

      var c0 = data.candidates && data.candidates[0];
      var part = c0 && c0.content && c0.content.parts && c0.content.parts[0];
      if (part && part.text) {
        return jsonResponse(data, 200);
      }

      if (data.error) {
        var code = data.error.code;
        var msg = String(data.error.message || '');
        if (code === 400 && (msg.indexOf('API key') !== -1 || msg.indexOf('API_KEY') !== -1)) {
          return jsonResponse(data, 200);
        }
        if (code === 403) {
          return jsonResponse(data, 200);
        }
        if (
          code === 429 ||
          code === 503 ||
          /RESOURCE_EXHAUSTED|quota|exceeded your current quota|high demand|UNAVAILABLE|try again later|overloaded/i.test(msg)
        ) {
          continue;
        }
        if (code === 404) continue;
        return jsonResponse(data, 200);
      }

      if (r.status === 429 || r.status === 503) continue;
    }

    return jsonResponse(lastData, 200);
  },
};
