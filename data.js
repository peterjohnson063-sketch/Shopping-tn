
// ═══════════════════════════════════════════════
// EVEREST — MOCK DATABASE & STATE MANAGER
// ═══════════════════════════════════════════════
const WILAYAS = {
  'Monastir': ['Monastir','Moknine','Ksar Hellal','Jemmal','Sayada','Bembla','Beni Hassen','Sahline','Zeramdine','Ouardanine','Téboulba'],
  'Sousse': ['Sousse Ville','Hammam Sousse','Akouda','Kalaa Kebira','Kalaa Seghira','Msaken','Sidi Bou Ali','Enfida'],
  'Sfax': ['Sfax Ville','Sakiet Ezzit','Sakiet Eddaïer','Chihia','Gremda','El Ain','Thyna','Bir Ali Ben Khalifa'],
  'Tunis': ['Tunis','La Marsa','Carthage','Sidi Bou Said','La Goulette','Le Bardo','Ariana','Manouba'],
  'Nabeul': ['Nabeul','Hammamet','Kelibia','Korba','Menzel Temime','El Haouaria','Soliman'],
  'Kairouan': ['Kairouan','Sbikha','Chebika','El Alaa','Haffouz','Nasrallah'],
  'Bizerte': ['Bizerte','Menzel Bourguiba','Mateur','Tinja','Ras Jebel'],
  'Béja': ['Béja','Medjez El Bab','Testour','Nefza','Thibar'],
  'Jendouba': ['Jendouba','Tabarka','Aïn Draham','Fernana','Bou Salem'],
  'Kef': ['Le Kef','Dahmani','Sakiet Sidi Youssef','Tajerouine'],
  'Siliana': ['Siliana','Makthar','Rouhia','Kesra'],
  'Zaghouan': ['Zaghouan','Fahs','Nadhour','Bir Mcherga'],
  'Ben Arous': ['Ben Arous','Rades','Ezzahra','Hammam Lif','Megrine'],
  'Mahdia': ['Mahdia','Ksour Essef','Chebba','Bou Merdes','El Jem'],
  'Kasserine': ['Kasserine','Sbeitla','Feriana','Thala','Hassi El Ferid'],
  'Sidi Bouzid': ['Sidi Bouzid','Jelma','Cebbala','Meknassy'],
  'Gabès': ['Gabès','El Hamma','Mareth','Matmata'],
  'Médenine': ['Médenine','Djerba','Zarzis','Ben Guerdane','Houmt Souk'],
  'Tataouine': ['Tataouine','Remada','Ghomrassen','Beni Médhour'],
  'Tozeur': ['Tozeur','Nefta','Degache','Hazoua'],
  'Kebili': ['Kebili','Douz','Souk Lahad','El Faouar'],
  'Gafsa': ['Gafsa','Metlaoui','Moularès','El Ksar','Redeyef'],
  'Manouba': ['Manouba','Oued Ellil','Tébourba','El Batan']
};

// Demo catalog removed — live catalog comes from Supabase; keep export for API compatibility
const PRODUCTS_DATA = [];

const PROMO_CODES = {}; // Promo codes are temporary events — none active

const LOYALTY_TIERS = [
  { name:'Bronze', min:0, max:999, color:'#cd7f32', perks:['5% cashback','Free standard shipping','Early access to sales'] },
  { name:'Silver', min:1000, max:4999, color:'#c0c0c0', perks:['8% cashback','Free express shipping','Priority support','Birthday bonus'] },
  { name:'Gold', min:5000, max:14999, color:'#7c3aed', perks:['12% cashback','Free white-glove delivery','VIP support line','Exclusive products','Monthly gift'] },
  { name:'Platinum', min:15000, max:Infinity, color:'#1e0a4e', perks:['18% cashback','Dedicated account manager','All Gold perks','Annual luxury gift','Private sale events'] }
];

// Canonical categories: same slugs as shop filters (index.html)
const PRODUCT_CATEGORIES = [
  { slug: 'furniture', label: '🛋️ Furniture', emoji: '🛋' },
  { slug: 'lighting', label: '💡 Lighting', emoji: '💡' },
  { slug: 'decor', label: '🎨 Decor', emoji: '🪞' },
  { slug: 'ceramics', label: '🏺 Ceramics', emoji: '🍽' },
  { slug: 'bedroom', label: '🛏️ Bedroom', emoji: '🛏' },
  { slug: 'outdoor', label: '🌿 Outdoor', emoji: '🪑' },
  { slug: 'fragrance', label: '🧴 Fragrance', emoji: '🧴' },
];

const CATEGORY_SLUG_SET = new Set(PRODUCT_CATEGORIES.map(function (c) { return c.slug; }));

/** Map legacy upload values / synonyms to a canonical slug. Returns null if unknown. */
function resolveProductCategorySlug(input) {
  if (input == null) return null;
  var raw = String(input).trim().toLowerCase();
  if (!raw) return null;
  var aliases = {
    sofa: 'furniture', wood: 'furniture', 'furniture_wood': 'furniture',
    rug: 'decor', rugs: 'decor', kilim: 'decor', carpet: 'decor', tapestry: 'decor',
    ceramic: 'ceramics', pottery: 'ceramics',
    lamp: 'lighting', lights: 'lighting',
    scent: 'fragrance', perfume: 'fragrance',
  };
  var s = aliases[raw] || raw;
  return CATEGORY_SLUG_SET.has(s) ? s : null;
}

/** User-typed "other" category → safe slug (a–z, 0–9, underscore). */
function slugifyCategoryInput(text) {
  if (!text || typeof text !== 'string') return null;
  var s = text.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (!s || s.length > 40) return null;
  if (!/^[a-z][a-z0-9_]*$/.test(s)) return null;
  return s;
}

function categoryEmoji(slug) {
  for (var i = 0; i < PRODUCT_CATEGORIES.length; i++) {
    if (PRODUCT_CATEGORIES[i].slug === slug) return PRODUCT_CATEGORIES[i].emoji;
  }
  return '📦';
}

// ── DB ──
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('stn_'+key)); } catch(e) { return null; } },
  set(key, val) { localStorage.setItem('stn_'+key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem('stn_'+key); }
};

// ── INIT DEFAULT DATA ──
// One-time: remove legacy demo catalog from localStorage so Supabase is the source of truth
(function () {
  try {
    if (!localStorage.getItem('stn_demo_products_purged_v1')) {
      localStorage.removeItem('stn_products');
      localStorage.setItem('stn_demo_products_purged_v1', '1');
    }
  } catch (e) {}
})();
// One-time: clear demo users, orders, reviews, and cart state for a real workspace (runs once per browser)
(function () {
  try {
    if (!localStorage.getItem('stn_workspace_demo_reset_v1')) {
      ['stn_users', 'stn_orders', 'stn_reviews', 'stn_cart', 'stn_wishlist', 'stn_currentUser', 'stn_products', 'stn_admin_removed_user_ids'].forEach(function (k) {
        try { localStorage.removeItem(k); } catch (e2) {}
      });
      localStorage.setItem('stn_workspace_demo_reset_v1', '1');
    }
  } catch (e) {}
})();
// Do not seed `products` — real rows come from Supabase via app.initializeProducts()
if (!DB.get('users')) DB.set('users', []);
if (!DB.get('orders')) DB.set('orders', []);
if (!DB.get('reviews')) DB.set('reviews', []);
if (!DB.get('cart')) DB.set('cart', []);
if (!DB.get('wishlist')) DB.set('wishlist', []);
if (!DB.get('currentUser')) DB.set('currentUser', null);

/** Strip secrets before persisting session user to localStorage (passwords must not live in the browser store). */
function userForSession(u) {
  if (!u || typeof u !== 'object') return u;
  const o = { ...u };
  delete o.password;
  delete o.pass;
  delete o.apikey;
  delete o.api_key;
  return o;
}

// ── Structured logging (no secrets). Set window.STN_LOG_LEVEL = 'error' | 'warn' | 'info' | 'debug'
(function initSTNLog() {
  const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
  function levelNum() {
    if (typeof window === 'undefined') return LEVELS.info;
    const s = String(window.STN_LOG_LEVEL || 'info').toLowerCase();
    return LEVELS[s] !== undefined ? LEVELS[s] : LEVELS.info;
  }
  const SECRET_KEY = /^(password|passphrase|secret|token|apikey|api_key|authorization|refresh_token|access_token)$/i;
  function sanitize(val, depth) {
    const d = depth == null ? 0 : depth;
    if (d > 5) return '[…]';
    if (val == null) return val;
    if (typeof val !== 'object') return val;
    if (val instanceof Error) return { name: val.name, message: val.message };
    if (Array.isArray(val)) return val.map((v) => sanitize(v, d + 1));
    const o = {};
    for (const k of Object.keys(val)) {
      if (SECRET_KEY.test(k)) {
        o[k] = '[REDACTED]';
        continue;
      }
      o[k] = sanitize(val[k], d + 1);
    }
    return o;
  }
  const ts = () => new Date().toISOString();
  window.STNLog = {
    sanitize,
    error(tag, err, meta) {
      const payload = {
        level: 'error',
        time: ts(),
        tag,
        error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
      };
      if (meta != null) payload.meta = sanitize(meta);
      console.error('[STN]', payload);
    },
    warn(tag, msg, meta) {
      if (levelNum() < LEVELS.warn) return;
      console.warn('[STN]', ts(), tag, msg, meta != null ? sanitize(meta) : '');
    },
    info(tag, msg, meta) {
      if (levelNum() < LEVELS.info) return;
      console.info('[STN]', ts(), tag, msg, meta != null ? sanitize(meta) : '');
    },
    debug(tag, msg, meta) {
      if (levelNum() < LEVELS.debug) return;
      console.log('[STN]', ts(), tag, msg, meta != null ? sanitize(meta) : '');
    },
  };
})();

window.STN = {
  DB,
  PRODUCTS_DATA,
  WILAYAS,
  PROMO_CODES,
  LOYALTY_TIERS,
  userForSession,
  PRODUCT_CATEGORIES,
  resolveProductCategorySlug,
  slugifyCategoryInput,
  categoryEmoji,
};
console.log('🛒 Everest data layer ready');

