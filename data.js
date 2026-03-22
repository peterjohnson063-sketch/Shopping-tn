
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

const PRODUCTS_DATA = [
  { id:1, name:'Velvet Sultan Sofa', brand:'Maalej Artisan', region:'Ksar Hellal', cat:'furniture', price:3299, oldPrice:3900, rating:4.8, reviews:127, badge:'Bestseller', emoji:'🛋', verified:true, stock:5, vendorId:1, desc:'Handcrafted in Ksar Hellal using premium Italian velvet over a solid walnut frame. This sofa blends traditional Tunisian craftsmanship with contemporary luxury design. Available in 8 colors.', specs:{width:'240cm', depth:'95cm', height:'85cm', material:'Solid Walnut + Italian Velvet', warranty:'5 years'} },
  { id:2, name:'Brass Moroccan Lantern', brand:'Sfax Lumières', region:'Sfax', cat:'lighting', price:849, oldPrice:null, rating:4.9, reviews:89, badge:'New', emoji:'💡', verified:true, stock:12, vendorId:2, desc:'Hand-hammered brass lantern with intricate geometric cutwork. Each piece is unique, crafted by master artisans with over 30 years of experience in metalwork.', specs:{height:'45cm', diameter:'30cm', material:'Hand-hammered Brass', warranty:'2 years'} },
  { id:3, name:'Antique Gold Mirror', brand:'Nabeul Glass', region:'Nabeul', cat:'decor', price:1599, oldPrice:null, rating:4.7, reviews:56, badge:null, emoji:'🪞', verified:true, stock:3, vendorId:3, desc:'Ornate full-length mirror with hand-gilded frame featuring traditional Tunisian geometric patterns. Made from recycled glass and sustainably sourced wood.', specs:{height:'180cm', width:'80cm', material:'Recycled Glass + Gilded Frame', warranty:'3 years'} },
  { id:4, name:'Champagne Bedroom Suite', brand:'Royal Sleep', region:'Tunis', cat:'bedroom', price:6800, oldPrice:null, rating:4.9, reviews:34, badge:'Premium', emoji:'🛏', verified:true, stock:2, vendorId:1, desc:'Complete 5-piece bedroom suite in champagne satin finish. Includes king bed, two nightstands, dresser, and wardrobe. Soft-close mechanisms throughout.', specs:{bedSize:'200x200cm', material:'MDF + Champagne Lacquer', warranty:'10 years'} },
  { id:5, name:'Hand-Painted Dinner Set', brand:'Nabeul Ceramics', region:'Nabeul', cat:'ceramics', price:420, oldPrice:500, rating:4.6, reviews:203, badge:'Popular', emoji:'🍽', verified:true, stock:20, vendorId:2, desc:'24-piece hand-painted ceramic dinner set. Each piece painted by artisans trained in traditional Nabeul pottery techniques. Dishwasher safe.', specs:{pieces:'24', material:'Nabeul Clay', dishwasherSafe:'Yes', warranty:'1 year'} },
  { id:6, name:'Custom Walnut Dining Set', brand:'Monastir Wood', region:'Monastir', cat:'furniture', price:4500, oldPrice:null, rating:5.0, reviews:18, badge:'Sur Mesure', emoji:'🪵', verified:true, stock:1, vendorId:3, desc:'Fully customizable dining table and chair set crafted from locally sourced Tunisian walnut. Quote includes consultation, 3D rendering, and delivery.', specs:{customizable:true, material:'Tunisian Walnut', leadTime:'4-6 weeks', warranty:'10 years'} },
  { id:7, name:'Rattan Garden Set', brand:'Djerba Outdoors', region:'Médenine', cat:'outdoor', price:2100, oldPrice:2800, rating:4.5, reviews:67, badge:'Sale', emoji:'🪑', verified:true, stock:8, vendorId:1, desc:'Weather-resistant rattan outdoor seating set. Includes 4-seater sofa, coffee table, and 2 lounge chairs. UV and rain resistant cushions included.', specs:{pieces:'7', material:'Synthetic Rattan + Aluminium', weatherproof:'Yes', warranty:'3 years'} },
  { id:8, name:'Abstract Canvas Art', brand:'Tunis Art Gallery', region:'Tunis', cat:'decor', price:680, oldPrice:null, rating:4.4, reviews:45, badge:null, emoji:'🖼', verified:false, stock:6, vendorId:2, desc:'Original abstract canvas painting by renowned Tunisian artist. Each piece is one-of-a-kind, signed and comes with certificate of authenticity.', specs:{size:'120x80cm', material:'Acrylic on Canvas', framed:'Yes', warranty:'N/A'} },
  { id:9, name:'Crystal Chandelier', brand:'Carthage Crystal', region:'Tunis', cat:'lighting', price:3800, oldPrice:4500, rating:4.8, reviews:29, badge:'Luxury', emoji:'🕯', verified:true, stock:4, vendorId:3, desc:'Handcrafted crystal chandelier with 48 premium Swarovski-inspired crystals. Suitable for rooms up to 50m². Includes professional installation guide.', specs:{diameter:'80cm', height:'100cm', bulbs:'12xE14', material:'Steel + Crystal', warranty:'5 years'} },
  { id:10, name:'Marble Coffee Table', brand:'Bizerte Stone', region:'Bizerte', cat:'furniture', price:1850, oldPrice:2200, rating:4.7, reviews:88, badge:'Trending', emoji:'🪨', verified:true, stock:7, vendorId:1, desc:'Solid Tunisian white marble coffee table with brushed gold steel base. Each table is unique — the natural veining pattern differs on every piece.', specs:{diameter:'100cm', height:'42cm', material:'Tunisian Marble + Gold Steel', warranty:'5 years'} },
  { id:11, name:'Jasmine Fragrance Set', brand:'Nabeul Blooms', region:'Nabeul', cat:'fragrance', price:185, oldPrice:null, rating:4.9, reviews:312, badge:'Bestseller', emoji:'🧴', verified:true, stock:50, vendorId:2, desc:'Artisanal jasmine fragrance collection made from hand-picked Cap Bon jasmine. Set includes 3 candles, diffuser, and 50ml eau de parfum.', specs:{pieces:'5', scent:'Jasmine + Amber', duration:'40h candles', warranty:'N/A'} },
  { id:12, name:'Kilim Berber Rug', brand:'Kairouan Weave', region:'Kairouan', cat:'decor', price:1200, oldPrice:1500, rating:4.8, reviews:156, badge:'Artisan', emoji:'🪡', verified:true, stock:9, vendorId:3, desc:'Authentic hand-woven Berber kilim rug from Kairouan masters. Natural wool dyed with traditional plant pigments. No two rugs are identical.', specs:{size:'200x300cm', material:'Natural Wool', handmade:'Yes', warranty:'Lifetime'} }
];

const PROMO_CODES = {}; // Promo codes are temporary events — none active

const LOYALTY_TIERS = [
  { name:'Bronze', min:0, max:999, color:'#cd7f32', perks:['5% cashback','Free standard shipping','Early access to sales'] },
  { name:'Silver', min:1000, max:4999, color:'#c0c0c0', perks:['8% cashback','Free express shipping','Priority support','Birthday bonus'] },
  { name:'Gold', min:5000, max:14999, color:'#7c3aed', perks:['12% cashback','Free white-glove delivery','VIP support line','Exclusive products','Monthly gift'] },
  { name:'Platinum', min:15000, max:Infinity, color:'#1e0a4e', perks:['18% cashback','Dedicated account manager','All Gold perks','Annual luxury gift','Private sale events'] }
];

// Canonical categories: same slugs as shop filters (index.html) + seed `cat` in PRODUCTS_DATA
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
// Do not seed `products` — real rows come from Supabase via app.initializeProducts()
if (!DB.get('users')) DB.set('users', [
  { id:1, firstName:'Admin', lastName:'Everest', email:'admin@everest.tn', phone:'20000001', wilaya:'Monastir', delegation:'Monastir', password:'admin123', role:'admin', points:15000, verified:true, avatar:'👑' },
  { id:2, firstName:'Ahmed', lastName:'Maalej', email:'vendor@everest.tn', phone:'20000002', wilaya:'Monastir', delegation:'Ksar Hellal', password:'vendor123', role:'vendor', points:5000, verified:true, avatar:'🧑‍🎨' },
  { id:3, firstName:'Sami', lastName:'Livreur', email:'driver@everest.tn', phone:'20000003', wilaya:'Tunis', delegation:'Tunis', password:'driver123', role:'driver', points:500, verified:true, avatar:'🚚' }
]);
if (!DB.get('orders')) DB.set('orders', [
  { id:1, vendorId:1, userId:1, userName:'Ahmed Ben', phone:'55 123 456', items:[{id:1,name:'Velvet Sultan Sofa',price:3299,qty:1}], total:3299, status:'delivered', created_at:'2026-03-10T10:00:00', tracking_number:'TN1001' },
  { id:2, vendorId:1, userId:2, userName:'Sarra Ali', phone:'55 987 654', items:[{id:4,name:'Champagne Bedroom Suite',price:6800,qty:1}], total:6800, status:'ready', created_at:'2026-03-12T14:30:00', tracking_number:'TN1002' },
  { id:3, vendorId:1, userId:3, userName:'Moez K', phone:'55 456 789', items:[{id:7,name:'Rattan Garden Set',price:2100,qty:1}], total:2100, status:'pending', created_at:'2026-03-15T09:15:00', tracking_number:'TN1003' },
  { id:4, vendorId:2, userId:4, userName:'Lila S', phone:'55 111 222', items:[{id:2,name:'Brass Moroccan Lantern',price:849,qty:2}], total:1698, status:'out_for_delivery', driver_id:3, delivery_lat:36.8065, delivery_lng:10.1815, address:'Lac 2, Tunis', wilaya:'Tunis', created_at:'2026-03-11T16:45:00', tracking_number:'TN1004' },
  { id:5, vendorId:2, userId:5, userName:'Karim M', phone:'55 333 444', items:[{id:5,name:'Hand-Painted Dinner Set',price:420,qty:1}], total:420, status:'delivered', created_at:'2026-03-08T11:20:00', tracking_number:'TN1005' },
  { id:6, vendorId:3, userId:6, userName:'Youssef T', phone:'55 777 888', items:[{id:3,name:'Antique Gold Mirror',price:1599,qty:1}], total:1599, status:'ready', created_at:'2026-03-14T13:10:00', tracking_number:'TN1006' }
]);
if (!DB.get('reviews')) DB.set('reviews', [
  { id:1, productId:1, userId:1, userName:'Ahmed M.', rating:5, comment:'Absolutely stunning quality! Delivered in Ksar Hellal within 3 days. The velvet is premium and the craftsmanship is unmatched.', date:'2026-02-15', verified:true },
  { id:2, productId:1, userId:2, userName:'Fatma B.', rating:5, comment:'Best sofa I\'ve ever owned. Worth every dinar!', date:'2026-02-20', verified:true },
  { id:3, productId:2, userId:1, userName:'Mohamed T.', rating:5, comment:'Gorgeous lantern, exactly as pictured. Very fast shipping to Monastir.', date:'2026-03-01', verified:true }
]);
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

