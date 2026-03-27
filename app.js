
// ═══════════════════════════════════════════════
// EVEREST — MAIN APPLICATION ENGINE
// ═══════════════════════════════════════════════

'use strict';

// ── STATE ──
const State = {
  currentPage: 'home',
  currentUser: null,
  cart: [],
  wishlist: [],
  products: [], // Filled from Supabase in init (no demo catalog)
  orders: [],
  notifications: [],
  filters: {
    category: 'all',
    price: [0, 5000],
    rating: 0,
    search: '',
    sort: 'name'
  },
  reviews: [],
  driverOrdersList: [],
  dashSection: 'overview',
  vendorSection: 'dashboard',
  selectedProduct: null,
  vendorEditingProductId: null,
  vendorUploadImageUrls: [],
  flashInterval: null,
  countdownInterval: null,
};

const DELIVERY_STATUS_FLOW = [
  'pending',
  'confirmed',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
];

const DELIVERY_ACTIVE_STATUSES = new Set(['confirmed', 'processing', 'ready', 'out_for_delivery', 'transit', 'shipped']);

function normalizeOrderStatus(st) {
  var s = String(st == null ? '' : st).trim().toLowerCase();
  if (!s) return 'pending';
  if (s === 'out-for-delivery' || s === 'out_for_delivery') return 'out_for_delivery';
  if (s === 'cancelled') return 'canceled';
  return s;
}

function nextOrderStatus(current) {
  var s = normalizeOrderStatus(current);
  var idx = DELIVERY_STATUS_FLOW.indexOf(s);
  if (idx < 0) return DELIVERY_STATUS_FLOW[0];
  if (idx >= DELIVERY_STATUS_FLOW.length - 1) return s;
  return DELIVERY_STATUS_FLOW[idx + 1];
}

function orderStatusBadge(status) {
  var s = normalizeOrderStatus(status);
  if (s === 'delivered') return { label: '✓ Delivered', bg: '#dcfce7', fg: '#166534' };
  if (s === 'out_for_delivery') return { label: '🚚 Out for delivery', bg: '#dbeafe', fg: '#1d4ed8' };
  if (s === 'ready') return { label: '📦 Ready for pickup', bg: '#ede9fe', fg: '#6d28d9' };
  if (s === 'processing') return { label: '⚙️ Processing', bg: '#ede9fe', fg: '#6d28d9' };
  if (s === 'confirmed') return { label: '✅ Confirmed', bg: '#e0f2fe', fg: '#0369a1' };
  if (s === 'shipped' || s === 'transit') return { label: '🚚 Transit', bg: '#dbeafe', fg: '#1d4ed8' };
  if (s === 'canceled') return { label: '✖ Canceled', bg: '#fee2e2', fg: '#b91c1c' };
  return { label: '⏳ Pending', bg: '#fef9c3', fg: '#92400e' };
}

const WILAYA_COORDS = {
  Tunis: [36.8065, 10.1815], Ariana: [36.8663, 10.1647], Ben_Arous: [36.7531, 10.2189], Manouba: [36.8101, 10.0956],
  Nabeul: [36.4561, 10.7376], Sousse: [35.8256, 10.6084], Monastir: [35.7643, 10.8113], Mahdia: [35.5047, 11.0622],
  Sfax: [34.7406, 10.7603], Kairouan: [35.6781, 10.0963], Bizerte: [37.2744, 9.8739], Beja: [36.7256, 9.1817],
  Jendouba: [36.5011, 8.7802], Kef: [36.1742, 8.7049], Siliana: [36.0887, 9.3708], Zaghouan: [36.4029, 10.1429],
  Kasserine: [35.1676, 8.8365], Sidi_Bouzid: [35.0382, 9.4858], Gabes: [33.8815, 10.0982], Medenine: [33.3549, 10.5055],
  Tataouine: [32.9297, 10.4518], Tozeur: [33.9197, 8.1335], Kebili: [33.7044, 8.969], Gafsa: [34.425, 8.7842]
};

function wilayaToCoord(raw) {
  var k = String(raw == null ? '' : raw).trim();
  if (!k) return null;
  var norm = k
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/\s+/g, '_');
  return WILAYA_COORDS[norm] || WILAYA_COORDS[k] || null;
}

function haversineKm(aLat, aLng, bLat, bLng) {
  var R = 6371;
  var dLat = (bLat - aLat) * Math.PI / 180;
  var dLng = (bLng - aLng) * Math.PI / 180;
  var aa = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

function _driverKycBucket() {
  return (typeof window !== 'undefined' && window.STN_DRIVER_KYC_BUCKET) || 'driver-kyc';
}

function compressImageFileToJpegBlob(file, maxEdge, quality) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var u = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(u);
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var m = Math.max(w, h);
      var scale = m > maxEdge ? maxEdge / m : 1;
      var cw = Math.max(1, Math.round(w * scale));
      var ch = Math.max(1, Math.round(h * scale));
      var c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, cw, ch);
      c.toBlob(
        function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('Could not compress image'));
        },
        'image/jpeg',
        quality != null ? quality : 0.82
      );
    };
    img.onerror = function () {
      URL.revokeObjectURL(u);
      reject(new Error('Invalid image file'));
    };
    img.src = u;
  });
}

function blobToDataUrl(blob) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () {
      resolve(String(r.result || ''));
    };
    r.onerror = function () {
      reject(new Error('read failed'));
    };
    r.readAsDataURL(blob);
  });
}

/** Max successful sign-ups per browser tab per hour; failed attempts do not count. */
var _STN_REG_RL_KEY = 'stn_reg_rl_v2';
var _STN_REG_RL_MAX = 5;
var _STN_REG_RL_WINDOW_MS = 60 * 60 * 1000;

function _regRateLimitRead() {
  var usedLocalFallback = false;
  try {
    sessionStorage.removeItem('reg_count');
  } catch (e) {}
  try {
    var raw = sessionStorage.getItem(_STN_REG_RL_KEY);
    if (!raw) return { n: 0, t0: 0 };
    var j = JSON.parse(raw);
    return { n: Math.max(0, Number(j.n) || 0), t0: Number(j.t0) || 0 };
  } catch (e2) {
    return { n: 0, t0: 0 };
  }
}

/** Returns minutes to wait if blocked, else null. */
function _regRateLimitBlockedMinutes() {
  var now = Date.now();
  var st = _regRateLimitRead();
  if (!st.t0 || now - st.t0 > _STN_REG_RL_WINDOW_MS) return null;
  if (st.n < _STN_REG_RL_MAX) return null;
  return Math.max(1, Math.ceil((_STN_REG_RL_WINDOW_MS - (now - st.t0)) / 60000));
}

function _regRateLimitRecordSuccess() {
  var now = Date.now();
  var st = _regRateLimitRead();
  if (!st.t0 || now - st.t0 > _STN_REG_RL_WINDOW_MS) {
    st = { n: 1, t0: now };
  } else {
    st.n += 1;
  }
  try {
    sessionStorage.setItem(_STN_REG_RL_KEY, JSON.stringify(st));
  } catch (e) {}
}

/**
 * Opt-in runtime evidence: `?stn_diag=1` or hash `#stn_diag` / `#stn_diag=1` — JS errors in a bottom bar
 * and sessionStorage `stn_diag_log`. Console: STN_DIAG_COPY() to copy all text.
 */
function _stnDiagUrlEnabled() {
  var q = String(location.search || '');
  var h = String(location.hash || '');
  if (/[\?&]stn_diag=1(?:&|$)/.test(q)) return true;
  if (/#stn_diag(?:=1)?(?:\?|$)/.test(h) || h === '#stn_diag' || h.indexOf('stn_diag=1') >= 0) return true;
  return false;
}

function _stnInstallDiagOverlayIfQuery() {
  try {
    if (!_stnDiagUrlEnabled()) return;
    if (document.getElementById('stn-diag-overlay')) return;
    var box = document.createElement('div');
    box.id = 'stn-diag-overlay';
    box.setAttribute('aria-live', 'assertive');
    box.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;max-height:28vh;overflow:auto;background:#0f172a;color:#fca5a5;font:12px/1.45 ui-monospace,monospace;z-index:2147483646;padding:10px 12px;white-space:pre-wrap;box-shadow:0 -4px 24px rgba(0,0,0,.35);border-top:2px solid #dc2626;';
    function appendLine(text) {
      var line = new Date().toISOString().slice(11, 23) + ' ' + text;
      box.textContent += (box.textContent ? '\n' : '') + line;
      try {
        var prev = sessionStorage.getItem('stn_diag_log') || '';
        sessionStorage.setItem('stn_diag_log', (prev ? prev + '\n' : '') + line);
      } catch (e) {}
      try {
        fetch('http://127.0.0.1:7472/ingest/e32ef648-4ad1-46fd-b914-26d2c0d1af57', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a2e097' },
          body: JSON.stringify({
            sessionId: 'a2e097',
            location: 'stn_diag',
            message: String(text).slice(0, 500),
            timestamp: Date.now(),
          }),
        }).catch(function () {});
      } catch (e2) {}
    }
    window.addEventListener('error', function (e) {
      appendLine(
        'error: ' +
          (e && e.message) +
          ' @ ' +
          (e && e.filename) +
          ':' +
          (e && e.lineno)
      );
    });
    window.addEventListener('unhandledrejection', function (e) {
      var r = e && e.reason;
      appendLine('rejection: ' + (r && r.message ? r.message : String(r)));
    });
    box.textContent = '[stn_diag] listening for errors…';
    document.body.appendChild(box);
    window.STN_DIAG_COPY = function () {
      return (
        (box.textContent || '') +
        '\n--- sessionStorage ---\n' +
        (sessionStorage.getItem('stn_diag_log') || '')
      );
    };
  } catch (e) {}
}

// ── INIT ──
async function init() {
  _stnInstallDiagOverlayIfQuery();
  State.currentUser = STN.DB.get('currentUser');
  if (State.currentUser && State.currentUser.password) {
    State.currentUser = STN.userForSession(State.currentUser);
    STN.DB.set('currentUser', State.currentUser);
  }
  await healCurrentUserFromSupabase();
  State.cart = STN.DB.get('cart') || [];
  State.wishlist = STN.DB.get('wishlist') || [];

  // Keep Shop (products page) and dashboards in sync when products change
  if (!window.__productsChangedListenerInstalled) {
    window.__productsChangedListenerInstalled = true;
    window.addEventListener('products:changed', async () => {
      try {
        await initializeProducts();
        await initializeReviews();
        applyReviewAggregatesToProducts();
        if (State.currentPage === 'vendor-dashboard' || document.getElementById('page-vendor-dashboard')?.classList?.contains('active')) {
          if (typeof refreshVendorData === 'function') {
            refreshVendorData();
          }
        }
      } catch (e) {
        if (typeof STNLog !== 'undefined') STNLog.warn('products.changed', 'listener failed', { message: e && e.message });
      }
    });
  }

  State.orders = STN.DB.get('orders') || [];
  State.reviews = STN.DB.get('reviews') || [];

  initCursor();
  initNav();
  initAdminDriverApproveDelegation();
  initReveal();
  updateCartBadge();
  updateWishlistBadge();
  updateNavUser();
  startFlashTimer();

  // Show newsletter popup after 5s
  setTimeout(() => {
    if (!STN.DB.get('newsletter_dismissed')) {
      document.getElementById('newsletter-popup')?.classList.add('show');
    }
  }, 5000);

  // Activate home page directly (avoids scroll-to-top on init)
  document.getElementById('page-home')?.classList.add('active');
  document.getElementById('navbtn-home')?.classList.add('active');
  State.currentPage = 'home';

  await initializeProducts();
  await initializeReviews();
  applyReviewAggregatesToProducts();
  renderHome();
  setTimeout(initReveal, 80);
}

/** Re-render product-driven UI after catalog updates (home grids, shop grid). */
function refreshProductViewsAfterCatalogLoad() {
  try {
    if (State.currentPage === 'home') renderHome();
    if (State.currentPage === 'products') filterAndRenderProducts();
    if (State.currentPage === 'wishlist') renderWishlist();
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('products.refreshViews', e && e.message);
  }
}

function _safeNum(n, fallback) {
  var x = Number(n);
  return Number.isFinite(x) ? x : (fallback == null ? 0 : fallback);
}

function applyReviewAggregatesToProducts() {
  if (!Array.isArray(State.products)) return;
  var byPid = {};
  (State.reviews || []).forEach(function (r) {
    var pid = String(r.productId != null ? r.productId : r.product_id != null ? r.product_id : '');
    if (!pid) return;
    var rating = _safeNum(r.rating, 0);
    if (!byPid[pid]) byPid[pid] = { sum: 0, count: 0 };
    if (rating > 0) {
      byPid[pid].sum += rating;
      byPid[pid].count += 1;
    }
  });
  State.products = State.products.map(function (p) {
    var key = String(p.id);
    var agg = byPid[key];
    var out = Object.assign({}, p);
    if (agg && agg.count > 0) {
      out.rating = Math.round((agg.sum / agg.count) * 10) / 10;
      out.reviews = agg.count;
    } else {
      out.rating = _safeNum(out.rating, 0);
      out.reviews = _safeNum(out.reviews, 0);
    }
    return out;
  });
}

async function initializeReviews() {
  var cached = STN.DB.get('reviews');
  State.reviews = Array.isArray(cached) ? cached : [];
  if (typeof SB === 'undefined' || typeof SB.getProductReviews !== 'function') return;
  try {
    var remote = await SB.getProductReviews(4000);
    if (Array.isArray(remote)) {
      State.reviews = remote.map(function (r) {
        var uid = r.user_id != null ? r.user_id : r.userId;
        return {
          id: r.id,
          productId: r.product_id != null ? r.product_id : r.productId,
          userId: uid,
          userName: r.user_name || r.userName || 'Customer',
          rating: _safeNum(r.rating, 0),
          comment: r.comment || '',
          date: String(r.created_at || r.date || '').split('T')[0],
          verified: true,
        };
      });
      STN.DB.set('reviews', State.reviews);
    }
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('reviews.init', 'Supabase unavailable', { message: e && e.message });
  }
}

// Initialize products from Supabase only (empty array if none or offline without cache)
async function initializeProducts() {
  if (typeof SB === 'undefined' || typeof SB.getProducts !== 'function') {
    State.products = Array.isArray(State.products) ? State.products : [];
    refreshProductViewsAfterCatalogLoad();
    return;
  }
  try {
    const supabaseProducts = await SB.getProducts();
    if (Array.isArray(supabaseProducts)) {
      State.products = supabaseProducts;
      STN.DB.set('products', State.products);
      if (typeof STNLog !== 'undefined') {
        STNLog.info('products.init', 'Loaded from Supabase', { count: supabaseProducts.length });
      }
    } else {
      State.products = [];
      STN.DB.set('products', []);
    }
  } catch (error) {
    if (typeof STNLog !== 'undefined') {
      STNLog.warn('products.init', 'Supabase unavailable', { err: error && error.message });
    }
    var cached = STN.DB.get('products');
    State.products = Array.isArray(cached) ? cached : [];
  }
  applyReviewAggregatesToProducts();
  refreshProductViewsAfterCatalogLoad();
}

// ── CURSOR ──
function initCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });
  (function animate() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animate);
  })();
  document.querySelectorAll('a,button,.cat-card,.product-card,.filter-btn,.glass,.tier-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-big'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-big'));
  });
}

// ── NAV ──
function initNav() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-drawer-open')) toggleNavDrawer(false);
  });
}

/** Delegated clicks: Approve / Verify driver (avoids fragile inline onclick). */
function initAdminDriverApproveDelegation() {
  if (window.__stnAdminDriverApproveDelegation) return;
  window.__stnAdminDriverApproveDelegation = true;
  var root = document.getElementById('page-admin');
  if (!root) return;
  root.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-stn-verify-driver]');
    if (!btn) return;
    e.preventDefault();
    var raw = btn.getAttribute('data-stn-verify-driver');
    if (raw == null || raw === '') return;
    if (typeof verifyDriverAccount === 'function') verifyDriverAccount(raw);
  });
}

/** Mobile hamburger drawer (Amazon-style menu) */
function toggleNavDrawer(open) {
  var openNext;
  if (arguments.length === 0) {
    openNext = !document.body.classList.contains('nav-drawer-open');
  } else {
    openNext = !!open;
  }
  document.body.classList.toggle('nav-drawer-open', openNext);
  var overlay = document.getElementById('nav-drawer-overlay');
  var drawer = document.getElementById('nav-drawer');
  var btn = document.getElementById('nav-menu-btn');
  if (overlay) {
    overlay.classList.toggle('open', openNext);
    overlay.setAttribute('aria-hidden', openNext ? 'false' : 'true');
  }
  if (drawer) {
    drawer.classList.toggle('open', openNext);
    drawer.setAttribute('aria-hidden', openNext ? 'false' : 'true');
  }
  if (btn) btn.setAttribute('aria-expanded', openNext ? 'true' : 'false');
  document.body.style.overflow = openNext ? 'hidden' : '';
}

function navLabelForHeader(full, short) {
  var mobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  return mobile ? short : full;
}

function updateNavUser() {
  var btn = document.getElementById('nav-user-area');
  if (!btn) return;
  if (State.currentUser) {
    var role = State.currentUser.role;
    var name = State.currentUser.first_name || State.currentUser.firstName || '';
    var el = document.createElement('button');
    el.className = 'nav-header-user-btn';
    el.style.cssText = 'border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;display:flex;align-items:center;gap:0.5rem;max-width:100%;';
    if (role === 'admin') {
      el.style.background = 'linear-gradient(135deg,#7c3aed,#4a1fa8)';
      el.style.color = 'white';
      el.textContent = navLabelForHeader('Admin Dashboard', 'Admin');
      el.onclick = function(){ showPage('admin'); };
    } else if (role === 'vendor') {
      el.style.background = 'linear-gradient(135deg,#059669,#047857)';
      el.style.color = 'white';
      el.textContent = navLabelForHeader('My Dashboard', 'Dashboard');
      el.onclick = function(){ showPage('vendor'); };
    } else if (role === 'driver') {
      el.style.background = 'linear-gradient(135deg,#0ea5e9,#0369a1)';
      el.style.color = 'white';
      el.textContent = navLabelForHeader('My deliveries', 'Deliveries');
      el.onclick = function(){ showPage('driver'); };
    } else {
      el.style.background = 'white';
      el.style.color = '#374151';
      el.style.border = '1px solid #e5e7eb';
      var longName = name || 'My Account';
      var shortName = name ? (name.length > 9 ? name.slice(0, 8) + '…' : name) : 'Account';
      el.textContent = navLabelForHeader(longName, shortName);
      el.onclick = function(){ showPage('account'); };
    }
    btn.innerHTML = '';
    btn.appendChild(el);
  } else {
    var el2 = document.createElement('button');
    el2.className = 'nav-header-user-btn guest-signin';
    el2.setAttribute('aria-label', navLabelForHeader('Sign in to your account', 'Sign in'));
    el2.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:0.35rem;';
    var ico = document.createElement('span');
    ico.className = 'nav-user-ico';
    ico.setAttribute('aria-hidden', 'true');
    ico.textContent = '👤';
    var txt = document.createElement('span');
    txt.className = 'nav-user-txt';
    txt.textContent = navLabelForHeader('Sign In', 'Sign in');
    el2.appendChild(ico);
    el2.appendChild(txt);
    el2.onclick = function(){ showPage('auth'); };
    btn.innerHTML = '';
    btn.appendChild(el2);
  }
  var dli = document.getElementById('nav-drawer-driver-item');
  if (dli) dli.style.display = State.currentUser && State.currentUser.role === 'driver' ? 'block' : 'none';
  syncBottomNavActive(State.currentPage || 'home');
}

// ── PAGE NAVIGATION ──
function showPage(id) {
  console.log('🔄 showPage called with:', id);

  if (typeof toggleNavDrawer === 'function') toggleNavDrawer(false);

  // Stop tracking timers/subscriptions when leaving the track page
  if (State.currentPage === 'track' && id !== 'track') {
    stopRealtimeTracking();
  }
  if (State.currentPage === 'driver' && id !== 'driver') {
    if (typeof stopDriverGpsForDelivery === 'function') stopDriverGpsForDelivery();
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (!page) {
    console.log('❌ Page element not found: page-' + id);
    return;
  }
  
  console.log('✅ Page element found:', page);
  page.classList.add('active');
  State.currentPage = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // update nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('navbtn-' + id);
  if (navBtn) navBtn.classList.add('active');

  // render page content
  const renderers = {
    home: renderHome,
    products: renderProducts,
    carpenter: renderCarpenter,
    track: renderTrack,
    wishlist: renderWishlist,
    auth: renderAuth,
    account: renderAccount,
    admin: renderAdmin,
    vendor: renderVendor,
    'vendor-dashboard': renderVendorDashboard,
    driver: renderDriver,
    loyalty: renderLoyalty,
    about: renderAbout,
  };
  
  console.log('🔄 Available renderers:', Object.keys(renderers));
  console.log('🔄 Looking for renderer:', id);
  
  if (renderers[id]) {
    console.log('✅ Found renderer, calling:', id);
    renderers[id]();
  } else {
    console.log('❌ No renderer found for:', id);
  }

  setTimeout(initReveal, 80);
  // Re-apply current language after page render
  const activeLangBtn = document.querySelector('.lang-btn.active');
  if (activeLangBtn) {
    const lang = activeLangBtn.id.replace('lang-','');
    setTimeout(() => { if(typeof setLang === 'function') setLang(lang, { silent: true, internal: true }); }, 100);
  }
  syncBottomNavActive(id);
  return false;
}

// ── REVEAL ──
function initReveal() {
  // Immediately make ALL reveal elements on current active page visible
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    activePage.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
  // Also use observer for scroll reveals
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 65);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.01 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => obs.observe(el));
}

// ── TOAST ──
function toast(msg, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  if (type === 'success') el.style.borderColor = 'rgba(46,213,115,0.4)';
  if (type === 'error') el.style.borderColor = 'rgba(255,71,87,0.4)';
  container.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 3200);
}

// ── Motion (Framer Motion ecosystem — motion.dev) via ESM CDN for vanilla JS ──
var EVEREST_MOTION_CDN = 'https://cdn.jsdelivr.net/npm/motion@11.15.0/+esm';

function mobileNavAccount() {
  if (!State.currentUser) {
    showPage('auth');
    return;
  }
  var role = State.currentUser.role;
  if (role === 'admin') showPage('admin');
  else if (role === 'vendor') showPage('vendor');
  else if (role === 'driver') showPage('driver');
  else showPage('account');
}

function syncBottomNavActive(pageId) {
  var nav = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.querySelectorAll('.bottom-nav__btn').forEach(function (b) { b.classList.remove('active'); });
  var map = { home: 'bottomnav-home', products: 'bottomnav-products', track: 'bottomnav-track' };
  var accountPages = { account: 1, auth: 1, vendor: 1, admin: 1, 'vendor-dashboard': 1, driver: 1 };
  if (accountPages[pageId]) {
    var acc = document.getElementById('bottomnav-account');
    if (acc) acc.classList.add('active');
    return;
  }
  var bid = map[pageId];
  if (bid) {
    var el = document.getElementById(bid);
    if (el) el.classList.add('active');
  }
}

// ── DELIVERY DRIVER APP ──
var _driverGpsWatchId = null;
var _driverGpsOrderKey = null;

/** Drivers must be approved by admin (verified or is_verified true). */
function isDriverVerified(u) {
  if (!u || u.role !== 'driver') return true;
  function truthy(v) {
    if (v === true || v === 1) return true;
    var s = String(v == null ? '' : v).toLowerCase().trim();
    return s === 'true' || s === 't' || s === '1';
  }
  return truthy(u.verified) || truthy(u.is_verified);
}

/** Banned, soft-deleted, or active timeout — blocks login and driver app. */
function isUserSuspended(u) {
  if (!u) return false;
  if (u.deleted_at != null && String(u.deleted_at).trim() !== '') return true;
  if (u.banned === true || u.banned === 1 || u.banned === '1' || String(u.banned).toLowerCase() === 'true') return true;
  if (u.timeout_until && new Date(u.timeout_until) > new Date()) return true;
  return false;
}

async function refreshCurrentUserFromRemote() {
  var cur = State.currentUser;
  if (!cur || cur.id == null || typeof SB === 'undefined' || !SB.getUserById) return;
  try {
    var row = await SB.getUserById(cur.id);
    if (!row) return;
    State.currentUser = STN.userForSession({
      ...row,
      firstName: row.first_name,
      lastName: row.last_name,
    });
    STN.DB.set('currentUser', State.currentUser);
    updateNavUser();
  } catch (e) {}
}

function stopDriverGpsForDelivery() {
  if (_driverGpsWatchId != null && navigator.geolocation) {
    try { navigator.geolocation.clearWatch(_driverGpsWatchId); } catch (e) {}
  }
  _driverGpsWatchId = null;
  _driverGpsOrderKey = null;
}

function driverOrderStopLabel(order) {
  var a = order.address || order.delivery_address || '';
  var w = order.wilaya || '';
  return (a + ' ' + w).trim() || 'Customer address on file';
}

function orderCreatedAtIso(order) {
  return order.created_at || order.createdAt || null;
}

function orderDeadlineAtIso(order) {
  return (
    order.delivery_deadline_at ||
    order.delivery_deadline ||
    order.deadline_at ||
    order.deadline ||
    order.expected_delivery_at ||
    null
  );
}

function orderCustomerFullName(order) {
  var direct = String(order.client_name || order.customer_name || '').trim();
  if (direct) return direct;
  var first = String(order.customer_first_name || order.first_name || '').trim();
  var last = String(order.customer_last_name || order.last_name || '').trim();
  var full = (first + ' ' + last).trim();
  return full || String(order.userName || 'Customer');
}

function driverOpenMapsByKey(key) {
  var list = State.driverOrdersList || [];
  var o = list.find(function (x) {
    return String(x.tracking_number || '') === String(key) || String(x.id) === String(key);
  });
  if (!o) { toast('Stop not found — refresh', 'error'); return; }
  var lat = o.delivery_lat != null ? o.delivery_lat : o.lat;
  var lng = o.delivery_lng != null ? o.delivery_lng : o.lng;
  var q = driverOrderStopLabel(o);
  var url =
    lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(lat + ',' + lng)
      : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q || 'Tunisia');
  window.open(url, '_blank');
}

function driverOpenOptimizedRoute(key) {
  var list = State.driverOrdersList || [];
  var o = list.find(function (x) {
    return String(x.tracking_number || '') === String(key) || String(x.id) === String(key);
  });
  if (!o) { toast('Stop not found — refresh', 'error'); return; }
  var pickup = _orderVendorCoord(o);
  var drop = _orderCustomerCoord(o);
  if (!pickup || !drop) {
    driverOpenMapsByKey(key);
    return;
  }
  var url = 'https://www.google.com/maps/dir/?api=1&origin=' +
    encodeURIComponent(pickup[0] + ',' + pickup[1]) +
    '&destination=' + encodeURIComponent(drop[0] + ',' + drop[1]) +
    '&travelmode=driving';
  window.open(url, '_blank');
}

async function patchDriverLocationOnOrder(orderKey, lat, lng) {
  try {
    if (typeof SB !== 'undefined' && SB.updateOrder) await SB.updateOrder(orderKey, { driver_lat: lat, driver_lng: lng });
  } catch (e) {}
  var orders = STN.DB.get('orders') || [];
  var o = orders.find(function (x) {
    return String(x.id) === String(orderKey) || x.tracking_number === orderKey;
  });
  if (o) {
    o.driver_lat = lat;
    o.driver_lng = lng;
    STN.DB.set('orders', orders);
  }
}

function startDriverGpsForOrder(orderKey) {
  if (!isDriverVerified(State.currentUser)) {
    toast('Your driver account is not verified yet', 'error');
    return;
  }
  stopDriverGpsForDelivery();
  if (!navigator.geolocation) {
    toast('GPS not available on this device', 'error');
    return;
  }
  _driverGpsOrderKey = orderKey;
  _driverGpsWatchId = navigator.geolocation.watchPosition(
    function (pos) {
      patchDriverLocationOnOrder(orderKey, pos.coords.latitude, pos.coords.longitude);
    },
    function () {
      toast('Allow location in browser settings to share GPS', 'error');
    },
    { enableHighAccuracy: true, maximumAge: 25000, timeout: 20000 }
  );
  toast('Live GPS on for this stop (updates while you drive)', 'success');
}

async function loadDriverOrdersList() {
  var uid = State.currentUser && State.currentUser.id;
  if (uid == null) return [];
  if (isUserSuspended(State.currentUser)) return [];
  if (!isDriverVerified(State.currentUser)) return [];
  if (typeof SB !== 'undefined' && SB.getDriverOrders) {
    try {
      var remote = await SB.getDriverOrders(uid);
      if (Array.isArray(remote) && remote.length) return remote;
    } catch (e) {}
  }
  var orders = STN.DB.get('orders') || [];
  return orders.filter(function (o) {
    return String(o.driver_id) === String(uid) || String(o.driverId) === String(uid);
  });
}

async function driverMarkOutForDelivery(orderKey) {
  if (!isDriverVerified(State.currentUser)) {
    toast('Your driver account is not verified yet', 'error');
    return;
  }
  try {
    if (typeof SB !== 'undefined' && SB.updateOrderStatus) await SB.updateOrderStatus(orderKey, 'out_for_delivery');
    if (typeof SB !== 'undefined' && SB.addTracking) {
      await SB.addTracking(orderKey, 'out_for_delivery', 'Driver left vendor and is heading to destination', null).catch(function () {});
    }
  } catch (e) {}
  var orders = STN.DB.get('orders') || [];
  var o = orders.find(function (x) {
    return String(x.id) === String(orderKey) || x.tracking_number === orderKey;
  });
  if (o) {
    o.status = 'out_for_delivery';
    STN.DB.set('orders', orders);
  }
  toast('Marked out for delivery', 'success');
  renderDriver();
}

async function driverMarkDelivered(orderKey) {
  if (!isDriverVerified(State.currentUser)) {
    toast('Your driver account is not verified yet', 'error');
    return;
  }
  stopDriverGpsForDelivery();
  var podNote = prompt('Proof of delivery note (recipient name / code):', '');
  var podPhoto = prompt('Optional proof photo URL (leave empty if none):', '') || '';
  var deliveredAt = new Date().toISOString();
  try {
    if (typeof SB !== 'undefined' && SB.updateOrder) {
      await SB.updateOrder(orderKey, {
        status: 'delivered',
        delivered_at: deliveredAt,
        pod_note: podNote || null,
        pod_photo_url: podPhoto || null,
      });
    } else if (typeof SB !== 'undefined' && SB.updateOrderStatus) {
      await SB.updateOrderStatus(orderKey, 'delivered');
    }
    if (typeof SB !== 'undefined' && SB.addTracking) {
      await SB.addTracking(orderKey, 'delivered', 'Delivered to customer', null).catch(function () {});
    }
  } catch (e) {}
  var orders = STN.DB.get('orders') || [];
  var o = orders.find(function (x) {
    return String(x.id) === String(orderKey) || x.tracking_number === orderKey;
  });
  if (o) {
    o.status = 'delivered';
    o.delivered_at = deliveredAt;
    o.pod_note = podNote || null;
    o.pod_photo_url = podPhoto || null;
    STN.DB.set('orders', orders);
  }
  toast('Delivered — great job!', 'success');
  renderDriver();
}

async function driverAcceptOrder(orderKey) {
  if (!isDriverVerified(State.currentUser)) {
    toast('Your driver account is not verified yet', 'error');
    return;
  }
  var u = State.currentUser;
  var plate = u.vehicle_plate_number || u.vehiclePlateNumber;
  var model = u.vehicle_model || u.vehicleModel;
  var color = u.vehicle_color || u.vehicleColor;
  if (!plate || !model || !color) {
    toast('Vehicle details missing on your profile — contact support', 'error');
    return;
  }
  var body = {
    driver_accepted_at: new Date().toISOString(),
    delivery_vehicle_plate: String(plate).trim(),
    delivery_vehicle_model: String(model).trim(),
    delivery_vehicle_color: String(color).trim(),
  };
  try {
    if (typeof SB !== 'undefined' && SB.updateOrder) await SB.updateOrder(orderKey, body);
    if (typeof SB !== 'undefined' && SB.addTracking) {
      await SB.addTracking(orderKey, 'ready', 'Driver accepted the delivery and prepared vehicle details', null).catch(function () {});
    }
  } catch (e) {}
  var orders = STN.DB.get('orders') || [];
  var o = orders.find(function (x) {
    return String(x.id) === String(orderKey) || x.tracking_number === orderKey;
  });
  if (o) {
    Object.assign(o, body);
    STN.DB.set('orders', orders);
  }
  toast('Delivery accepted — customer can see your vehicle', 'success');
  renderDriver();
}

function renderDriver() {
  if (!State.currentUser || State.currentUser.role !== 'driver') {
    toast('Delivery app is for driver accounts only', 'error');
    showPage('auth');
    return;
  }
  var page = document.getElementById('page-driver');
  if (!page) return;
  page.innerHTML =
    '<div class="s" style="padding-top:5.25rem;padding-bottom:6rem;max-width:560px;margin:0 auto">' +
    '<div id="driver-app-head"></div>' +
    '<div id="driver-orders-list"><p style="text-align:center;color:#94a3b8;padding:2rem">Loading…</p></div></div>';

  refreshCurrentUserFromRemote().then(function () {
    var head = document.getElementById('driver-app-head');
    var list = document.getElementById('driver-orders-list');
    if (!head || !list) return;

    if (isUserSuspended(State.currentUser)) {
      var cu = State.currentUser;
      var bannedNow =
        cu.banned === true ||
        cu.banned === 1 ||
        cu.banned === '1' ||
        String(cu.banned || '').toLowerCase() === 'true';
      var br = (cu.ban_reason != null && String(cu.ban_reason).trim() !== '' ? String(cu.ban_reason).trim() : '');
      var reasonBlock =
        bannedNow && br
          ? '<div style="margin-top:1rem;padding:0.85rem 1rem;background:white;border:1px solid #fecaca;border-radius:12px">' +
            '<p style="margin:0 0 0.35rem;font-size:0.72rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.06em">Message from admin</p>' +
            '<p style="margin:0;font-size:0.9rem;color:#450a0a;line-height:1.5;white-space:pre-wrap;word-break:break-word">' +
            _detailEscapeHtml(br) +
            '</p></div>'
          : '';
      var timeoutNote = '';
      if (cu.timeout_until && new Date(cu.timeout_until) > new Date()) {
        try {
          timeoutNote =
            '<p style="margin:0.75rem 0 0;font-size:0.82rem;color:#7f1d1d">Temporary restriction until <strong>' +
            _detailEscapeHtml(new Date(cu.timeout_until).toLocaleString()) +
            '</strong>.</p>';
        } catch (e) {}
      }
      head.innerHTML =
        '<div style="background:linear-gradient(135deg,#fef2f2,#ffe4e6);border:1px solid #fecaca;border-radius:16px;padding:1.25rem 1.35rem;margin-bottom:1.25rem">' +
        '<h1 style="font-family:var(--font-display,Georgia,serif);font-size:1.45rem;color:#991b1b;margin:0 0 0.5rem">⛔ Account not active</h1>' +
        '<p style="margin:0;font-size:0.88rem;color:#7f1d1d;line-height:1.55">Your delivery partner access is suspended or was not approved after admin review. You cannot accept deliveries.' +
        (bannedNow ? ' If a reason is shown below, it was added by the admin team.' : '') +
        '</p>' +
        timeoutNote +
        reasonBlock +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:0.65rem;align-items:center;margin-bottom:1rem">' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="logout()" style="font-weight:700">Log out</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" onclick="renderDriver()">Refresh status</button>' +
        '</div>';
      list.innerHTML = '';
      State.driverOrdersList = [];
      return;
    }

    if (!isDriverVerified(State.currentUser)) {
      head.innerHTML =
        '<div style="background:linear-gradient(135deg,#fff7ed,#ffedd5);border:1px solid #fed7aa;border-radius:16px;padding:1.25rem 1.35rem;margin-bottom:1.25rem">' +
        '<h1 style="font-family:var(--font-display,Georgia,serif);font-size:1.45rem;color:#9a3412;margin:0 0 0.5rem">⏳ Verification pending</h1>' +
        '<p style="margin:0;font-size:0.88rem;color:#7c2d12;line-height:1.55">Your CIN and licence are being reviewed by Everest admin. You cannot view or accept deliveries until your account is approved.</p></div>' +
        '<button type="button" class="btn btn-ghost btn-sm" onclick="renderDriver()">Refresh status</button>';
      list.innerHTML = '';
      State.driverOrdersList = [];
      return;
    }

    head.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap">' +
      '<div><h1 style="font-family:var(--font-display,Georgia,serif);font-size:1.65rem;color:#1e0a4e;font-weight:600;margin:0">🚚 Deliveries</h1>' +
      '<p style="margin:0.35rem 0 0;font-size:0.82rem;color:#64748b">Accept a stop first so the customer sees your vehicle · Then navigate &amp; deliver</p></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" onclick="renderDriver()">Refresh</button></div>';

    loadDriverOrdersList().then(function (orders) {
      State.driverOrdersList = orders || [];
      if (!orders.length) {
        list.innerHTML =
          '<div style="text-align:center;padding:3rem 1.5rem;background:#f8fafc;border-radius:16px;border:1px dashed #cbd5e1">' +
          '<div style="font-size:2.5rem;margin-bottom:0.75rem">📭</div>' +
          '<p style="color:#475569;font-size:0.95rem;margin:0">No assigned stops yet.<br/><span style="font-size:0.82rem;color:#94a3b8">Admin assigns verified drivers in <strong>Orders</strong> (<code style="background:#e2e8f0;padding:0.1rem 0.35rem;border-radius:4px">driver_id</code>).</span></p></div>';
        return;
      }
      var html = orders
        .map(function (o) {
          var idKey = o.tracking_number || o.id;
          var safeKey = String(idKey).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          var status = (o.status || 'pending').replace(/_/g, ' ');
          var items = Array.isArray(o.items)
            ? o.items
                .map(function (i) {
                  return i.name || 'Item';
                })
                .join(' · ')
            : '—';
          var createdAt = orderCreatedAtIso(o);
          var deadlineAt = orderDeadlineAtIso(o);
          var phone = o.phone || o.client_phone || '';
          var canDeliver = o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'canceled';
          var showOut = canDeliver && (o.status === 'shipped' || o.status === 'processing' || o.status === 'ready');
          var accepted = !!o.driver_accepted_at;
          var showAccept = canDeliver && !accepted;
          return (
            '<article style="background:white;border:1px solid rgba(107,63,212,0.14);border-radius:16px;padding:1rem 1.1rem;margin-bottom:1rem;box-shadow:0 2px 12px rgba(74,31,168,0.05)">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem;margin-bottom:0.5rem">' +
            '<div><div style="font-size:0.62rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#7c3aed">#' +
            (o.tracking_number || o.id) +
            '</div>' +
            '<div style="font-size:0.95rem;font-weight:700;color:#1e0a4e;margin-top:0.2rem">' +
            orderCustomerFullName(o) +
            '</div>' +
            (phone ? '<div style="font-size:0.8rem;color:#64748b;margin-top:0.15rem"><a href="tel:' + phone.replace(/\s/g, '') + '" style="color:#0369a1">' + phone + '</a></div>' : '') +
            '<div style="font-size:0.78rem;color:#64748b;margin-top:0.35rem;line-height:1.4">' +
            driverOrderStopLabel(o) +
            '</div></div>' +
            '<span style="font-size:0.65rem;font-weight:700;padding:0.28rem 0.55rem;border-radius:999px;background:#e0f2fe;color:#0369a1;white-space:nowrap;text-transform:capitalize">' +
            status +
            '</span></div>' +
            (accepted
              ? '<p style="font-size:0.72rem;color:#059669;margin:0 0 0.75rem;font-weight:600">✓ You accepted this delivery</p>'
              : '') +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.8rem">' +
            '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0.45rem 0.55rem">' +
            '<div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.07em;color:#64748b">Ordered at</div>' +
            '<div style="font-size:0.76rem;color:#0f172a;font-weight:600">' +
            (createdAt ? new Date(createdAt).toLocaleString('fr-TN') : '—') +
            '</div></div>' +
            '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:0.45rem 0.55rem">' +
            '<div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.07em;color:#9a3412">Finish before</div>' +
            '<div style="font-size:0.76rem;color:#9a3412;font-weight:700">' +
            (deadlineAt ? new Date(deadlineAt).toLocaleString('fr-TN') : 'As soon as possible') +
            '</div></div>' +
            '</div>' +
            '<div style="font-size:0.76rem;color:#64748b;margin-bottom:1rem;line-height:1.45">' +
            items +
            '</div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0.45rem">' +
            (showAccept
              ? '<button type="button" class="btn btn-gold btn-sm" onclick="driverAcceptOrder(\'' + safeKey + '\')">Accept delivery</button>'
              : '') +
            '<button type="button" class="btn btn-outline btn-sm" onclick="driverOpenMapsByKey(\'' +
            safeKey +
            '\')">Navigate</button>' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="driverOpenOptimizedRoute(\'' +
            safeKey +
            '\')">Optimized route</button>' +
            (accepted && canDeliver
              ? '<button type="button" class="btn btn-ghost btn-sm" onclick="startDriverGpsForOrder(\'' + safeKey + '\')">Share GPS</button>'
              : '') +
            (accepted && showOut
              ? '<button type="button" class="btn btn-ghost btn-sm" onclick="driverMarkOutForDelivery(\'' + safeKey + '\')">Out for delivery</button>'
              : '') +
            (accepted && canDeliver
              ? '<button type="button" class="btn btn-gold btn-sm" onclick="driverMarkDelivered(\'' + safeKey + '\')">Delivered</button>'
              : '') +
            '</div></article>'
          );
        })
        .join('');
      list.innerHTML = html;
    });
  });
}

async function showCelebrationOverlay() {
  var layer = document.createElement('div');
  layer.className = 'celebration-layer';
  layer.setAttribute('aria-hidden', 'true');
  var burst = document.createElement('div');
  burst.className = 'celebration-burst';
  var wrap = document.createElement('div');
  wrap.className = 'celebration-check-wrap';
  wrap.innerHTML =
    '<svg class="celebration-check" viewBox="0 0 64 64" width="72" height="72" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" stroke-width="2" opacity="0.2"/><path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M18 34l10 10 18-22"/></svg>';
  layer.appendChild(burst);
  layer.appendChild(wrap);
  document.body.appendChild(layer);

  var colors = ['#7c3aed', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#f59e0b'];
  var pieceEls = [];
  var i;
  for (i = 0; i < 28; i++) {
    var p = document.createElement('span');
    p.className = 'celebration-piece';
    p.style.background = colors[i % colors.length];
    burst.appendChild(p);
    pieceEls.push(p);
  }

  try {
    var mod = await import(EVEREST_MOTION_CDN);
    var animate = mod.animate;
    var check = wrap.querySelector('.celebration-check');
    if (animate && check) {
      animate(
        check,
        { opacity: [0, 1], scale: [0.35, 1.08, 1], rotate: [-18, 0] },
        { duration: 0.52, easing: [0.34, 1.35, 0.64, 1] }
      );
    }
    if (animate && pieceEls.length) {
      pieceEls.forEach(function (el, idx) {
        var a = (Math.PI * 2 * idx) / pieceEls.length + (Math.random() - 0.5) * 0.9;
        var dist = 88 + Math.random() * 110;
        var tx = Math.cos(a) * dist;
        var ty = Math.sin(a) * dist - 28;
        var rot = (Math.random() - 0.5) * 520;
        animate(
          el,
          { x: [0, tx], y: [0, ty], opacity: [1, 0], rotate: [0, rot] },
          { duration: 0.82 + Math.random() * 0.35, delay: idx * 0.016, easing: [0.22, 1, 0.36, 1] }
        );
      });
    }
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.debug('celebration', 'motion unavailable', { message: e && e.message });
  }

  setTimeout(function () {
    if (layer.parentNode) layer.parentNode.removeChild(layer);
  }, 2100);
}

async function animateProductCardsEntry(grid) {
  if (!grid) return;
  if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
    return;
  }
  var cards = grid.querySelectorAll('.product-card');
  if (!cards.length) return;
  cards.forEach(function (c) {
    c.style.opacity = '0';
    c.style.transform = 'translateY(28px) scale(0.94)';
  });
  try {
    var mod = await import(EVEREST_MOTION_CDN);
    var animate = mod.animate;
    var stagger = mod.stagger;
    if (!animate || !stagger) throw new Error('motion exports missing');
    animate(
      cards,
      { opacity: [0, 1], y: [28, 0], scale: [0.94, 1] },
      { duration: 0.42, delay: stagger(0.048), easing: [0.22, 1, 0.36, 1] }
    );
  } catch (e) {
    cards.forEach(function (c) {
      c.style.opacity = '';
      c.style.transform = '';
      c.classList.add('reveal', 'visible');
    });
  }
}

// ── CART ──
function updateCartBadge() {
  const total = State.cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  document.querySelectorAll('#bottom-nav .cart-badge').forEach(b => {
    b.style.display = total > 0 ? 'flex' : 'none';
  });
  const fc = document.getElementById('float-cart-count');
  if (fc) { fc.textContent = total; fc.style.display = total > 0 ? 'flex' : 'none'; }
}

function addToCart(productId) {
  const product = State.products.find(function (p) {
    return String(p.id) === String(productId);
  });
  if (!product) {
    toast('Could not add to cart — product missing. Refresh and try again.', 'error');
    return;
  }
  const canonicalId = product.id;
  const existing = State.cart.find(function (i) {
    return String(i.id) === String(canonicalId);
  });
  if (existing) {
    existing.qty++;
  } else {
    State.cart.push({
      id: canonicalId,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      qty: 1,
    });
  }
  STN.DB.set('cart', State.cart);
  updateCartBadge();
  toast(`✦ Added: ${product.name}`, 'success');
}

function removeFromCart(productId) {
  State.cart = State.cart.filter(i => String(i.id) !== String(productId));
  STN.DB.set('cart', State.cart);
  updateCartBadge();
  renderCartDrawer();
}

function updateQty(productId, delta) {
  const item = State.cart.find(i => String(i.id) === String(productId));
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  STN.DB.set('cart', State.cart);
  updateCartBadge();
  renderCartDrawer();
}

function getCartTotal() {
  let subtotal = State.cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (State.promoApplied) {
    const promo = STN.PROMO_CODES[State.promoApplied];
    if (promo.type === 'percent') subtotal *= (1 - promo.value / 100);
    else subtotal -= promo.value;
  }
  return Math.max(0, subtotal);
}

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  renderCartDrawer();
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
}

function renderCartDrawer() {
  const body = document.getElementById('cart-body');
  if (!body) return;

  if (State.cart.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:1rem">🛒</div>
        <p style="margin-bottom:1.5rem">Your cart is empty</p>
        <button class="btn btn-ghost btn-sm" onclick="closeCart();showPage('products')">Browse Collections</button>
      </div>`;
    document.getElementById('cart-footer').innerHTML = '';
    return;
  }

  body.innerHTML = State.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${(item.price * item.qty).toLocaleString()} TND</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
        <button class="wishlist-btn" onclick="removeFromCart('${item.id}')" style="width:28px;height:28px;font-size:0.8rem;color:var(--danger);border-color:rgba(255,71,87,0.2)">✕</button>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty('${item.id}',-1)">−</button>
          <span style="font-size:0.85rem;min-width:20px;text-align:center">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}',1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = State.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = getCartTotal();
  const saved = subtotal - total;

  document.getElementById('cart-footer').innerHTML = `
    <div style="padding:1.2rem 1.6rem;border-top:1px solid rgba(107,63,212,0.12)">
      
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-muted);margin-bottom:0.4rem"><span>Subtotal</span><span>${subtotal.toLocaleString()} TND</span></div>
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-muted);margin-bottom:0.8rem"><span>Shipping</span><span style="color:var(--success)">Free</span></div>
      <div style="display:flex;justify-content:space-between;font-size:1rem;color:var(--champagne);font-weight:600;margin-bottom:1.2rem"><span>Total</span><span>${total.toLocaleString()} TND</span></div>
      <button class="btn btn-gold btn-full" onclick="checkout()">Checkout →</button>
    </div>`;
}

function applyPromo() {
  const code = document.getElementById('promo-input')?.value?.trim()?.toUpperCase();
  if (!code) return;
  if (STN.PROMO_CODES[code]) {
    State.promoApplied = code;
    toast(`✦ Promo applied: ${STN.PROMO_CODES[code].desc}`, 'success');
    renderCartDrawer();
  } else {
    toast('⚠️ Invalid promo code', 'error');
  }
}

async function checkout() {
  // Show checkout form — works for guests AND logged in users
  closeCart();
  
  // Build checkout modal
  const existing = document.getElementById('checkout-modal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(30,10,78,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  modal.innerHTML = `
    <div style="background:white;border-radius:24px;padding:2.5rem;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;position:relative">
      <button onclick="document.getElementById('checkout-modal').remove()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#7b72a8">✕</button>
      <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#1e0a4e;margin-bottom:0.3rem">Complete Order</h3>
      <p style="color:#7b72a8;font-size:0.8rem;margin-bottom:1.5rem">Total: <strong style="color:#7c3aed">${getCartTotal().toLocaleString()} TND</strong></p>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:0.8rem">
        <div>
          <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.4rem">First Name *</label>
          <input id="co-fname" type="text" value="${State.currentUser?.firstName || ''}" placeholder="Mohamed" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.4rem">Last Name *</label>
          <input id="co-lname" type="text" value="${State.currentUser?.lastName || ''}" placeholder="Trabelsi" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
        </div>
      </div>
      <div style="margin-bottom:0.8rem">
        <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.4rem">Phone *</label>
        <input id="co-phone" type="tel" value="${State.currentUser?.phone || ''}" placeholder="+216 XX XXX XXX" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
      </div>
      <div style="margin-bottom:0.8rem">
        <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.4rem">Wilaya *</label>
        <input id="co-wilaya" type="text" value="${State.currentUser?.wilaya || ''}" placeholder="Monastir" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
      </div>
      <div style="margin-bottom:1.5rem">
        <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.4rem">Full Address *</label>
        <input id="co-address" type="text" placeholder="12 Rue Habib Bourguiba, Monastir" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
      </div>
      <div style="margin-bottom:1.2rem;padding:0.9rem;border:1px solid rgba(107,63,212,0.14);border-radius:12px;background:#fcfbff">
        <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.65rem">Payment Method *</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.45rem">
          ${checkoutPaymentMethodTile('cash', '💵 Cash on Delivery')}
          ${checkoutPaymentMethodTile('visa', '💳 Visa')}
          ${checkoutPaymentMethodTile('mastercard', '💳 MasterCard')}
          ${checkoutPaymentMethodTile('credit_card', '🏦 Credit Card')}
          ${checkoutPaymentMethodTile('paypal', '🅿️ PayPal')}
          ${checkoutPaymentMethodTile('e_dinar', '🇹🇳 e-Dinar')}
          ${checkoutPaymentMethodTile('flouci', '📱 Flouci')}
          ${checkoutPaymentMethodTile('konnect', '🔗 Konnect')}
        </div>
      </div>
      <div id="co-payment-extra" style="margin-bottom:1.2rem"></div>
      ${!State.currentUser ? `<p style="font-size:0.75rem;color:#7b72a8;margin-bottom:1rem;text-align:center">💡 <a onclick="document.getElementById('checkout-modal').remove();showPage('auth')" style="color:#7c3aed;cursor:pointer">Sign in</a> to track your order easily</p>` : ''}
      <button id="co-submit-btn" onclick="submitOrder()" style="width:100%;padding:1rem;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:0.05em">Pay & Place Order ✦</button>
    </div>`;
  document.body.appendChild(modal);
  installCheckoutPaymentUi();
}

function showForgotPassword() {
  var email = document.getElementById('login-email') ? document.getElementById('login-email').value.trim() : '';
  var modal = document.createElement('div');
  modal.id = 'forgot-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(30,10,78,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  var html = '<div style="background:white;border-radius:20px;padding:2rem;max-width:400px;width:100%">';
  html += '<h3 style="font-family:Cormorant Garamond,serif;font-size:1.5rem;color:#1e0a4e;margin-bottom:0.5rem">Reset Password</h3>';
  html += '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:1.5rem">Enter your email to reset your password.</p>';
  html += '<input type="email" id="forgot-email" value="' + email + '" placeholder="your@email.com" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.75rem;font-size:0.875rem;margin-bottom:1rem;box-sizing:border-box;font-family:Outfit,sans-serif"/>';
  html += '<button onclick="submitForgotPassword()" style="width:100%;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.875rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;margin-bottom:0.75rem">Reset Password</button>';
  html += '<button onclick="var m=document.getElementById(\'forgot-modal\');if(m)m.remove();" style="width:100%;background:none;border:none;color:#6b7280;font-size:0.85rem;cursor:pointer;font-family:Outfit,sans-serif">Cancel</button>';
  html += '</div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

function submitForgotPassword() {
  var emailEl = document.getElementById('forgot-email');
  var email = emailEl ? emailEl.value.trim() : '';
  if (!email) { toast('Please enter your email', 'error'); return; }
  var users = STN.DB.get('users') || [];
  var user = users.find(function(u){ return u.email === email; });
  if (!user) { toast('No account found with this email', 'error'); return; }
  var modal = document.getElementById('forgot-modal');
  if (modal) modal.remove();
  var newPass = prompt('Enter your new password (min 8 characters):');
  if (!newPass || newPass.length < 8) { toast('Password must be at least 8 characters!', 'error'); return; }
  var confirm = prompt('Confirm new password:');
  if (newPass !== confirm) { toast('Passwords do not match!', 'error'); return; }
  var idx = users.findIndex(function(u){ return u.email === email; });
  if (idx !== -1) {
    users[idx].password = newPass;
    STN.DB.set('users', users);
    toast('Password updated! You can now login.', 'success');
  }
}

function closeSuccessModal() {
  const m = document.getElementById('success-modal');
  if (m) m.remove();
  const c = document.getElementById('checkout-modal');
  if (c) c.remove();
  showPage('track');
}

async function submitOrder() {
  const fname = document.getElementById('co-fname')?.value?.trim();
  const lname = document.getElementById('co-lname')?.value?.trim();
  const phone = document.getElementById('co-phone')?.value?.trim();
  const wilaya = document.getElementById('co-wilaya')?.value?.trim();
  const address = document.getElementById('co-address')?.value?.trim();
  
  if (!fname || !lname || !phone || !wilaya || !address) { toast('⚠️ Please fill all fields', 'error'); return; }
  
  const btn = document.getElementById('co-submit-btn');
  const paymentMethod = getSelectedCheckoutPaymentMethod();
  const paymentValidation = validateCheckoutPaymentDetails(paymentMethod);
  if (!paymentValidation.ok) {
    toast(paymentValidation.message, 'error');
    return;
  }
  const paymentMeta = paymentValidation.meta || {};
  btn.textContent = 'Processing...';
  btn.disabled = true;

  try {
    const chargeResult = await simulateCheckoutPayment(paymentMethod, paymentMeta);
    if (!chargeResult.ok) {
      toast(chargeResult.message || 'Payment was not completed', 'error');
      btn.textContent = 'Pay & Place Order ✦';
      btn.disabled = false;
      return;
    }

    // Get shop names from cart items
    const shopNames = [...new Set(State.cart.map(i => i.brand || i.shopName || 'Everest').filter(Boolean))].join(', ');
    
    const nowIso = new Date().toISOString();
    const deadlineIso = new Date(Date.now() + (90 * 60 * 1000)).toISOString();
    const baseOrderPayload = {
      user_id: State.currentUser?.id || null,
      items: State.cart,
      total: getCartTotal(),
      status: 'pending',
      wilaya,
      address,
      phone,
      notes: fname + ' ' + lname,
      client_name: (fname + ' ' + lname).trim(),
      customer_first_name: fname,
      customer_last_name: lname,
      created_at: nowIso,
      delivery_deadline_at: deadlineIso
    };
    const extendedOrderPayload = {
      ...baseOrderPayload,
      payment_method: paymentMethod,
      payment_provider: paymentProviderForMethod(paymentMethod),
      payment_status: chargeResult.status || 'pending',
      payment_transaction_ref: chargeResult.reference || null,
      payment_meta: paymentMeta
    };
    let order;
    try {
      order = await SB.createOrder(extendedOrderPayload);
    } catch (paymentFieldErr) {
      // Backward-compat: orders table might not include payment_* columns yet.
      order = await SB.createOrder(baseOrderPayload);
    }

    document.getElementById('checkout-modal').remove();
    State.cart = [];
    State.promoApplied = null;
    STN.DB.set('cart', []);
    updateCartBadge();

    // Show success with tracking number
    const successModal = document.createElement('div');
    successModal.id = 'success-modal';
    successModal.style.cssText = 'position:fixed;inset:0;background:rgba(30,10,78,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
    const trackNum = order.tracking_number;
    successModal.innerHTML = `
      <div style="background:white;border-radius:24px;padding:2.5rem;max-width:420px;width:100%;text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">🎉</div>
        <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#1e0a4e;margin-bottom:0.5rem">Order Confirmed!</h3>
        <p style="color:#7b72a8;font-size:0.85rem;margin-bottom:1.5rem">Your tracking number:</p>
        <div style="background:#f8f7ff;border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:1rem;margin-bottom:1.5rem">
          <p style="font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:#7c3aed;font-weight:600;letter-spacing:0.1em">${trackNum}</p>
          <button onclick="navigator.clipboard?.writeText('${trackNum}');toast('✦ Copied!','success')" style="background:none;border:none;color:#7b72a8;font-size:0.72rem;cursor:pointer;margin-top:0.3rem">📋 Copy</button>
        </div>
        <p style="font-size:0.78rem;color:#7b72a8;margin-bottom:1.5rem">Save this number to track your order!</p>
        <button onclick="closeSuccessModal()" style="width:100%;padding:0.9rem;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;border-radius:12px;font-size:0.9rem;cursor:pointer">Track My Order →</button>
      </div>`;
    document.body.appendChild(successModal);
    showCelebrationOverlay();

  } catch(e) {
    if (typeof STNLog !== 'undefined') STNLog.error('checkout.submitOrder', e, {});
    toast('⚠️ Order failed. Try again.', 'error');
    const btn = document.getElementById('co-submit-btn');
    if (btn) { btn.textContent = 'Pay & Place Order ✦'; btn.disabled = false; }
  }
}

function checkoutPaymentMethodTile(value, label) {
  return `
    <label style="display:flex;align-items:center;gap:0.45rem;padding:0.55rem 0.6rem;border:1px solid rgba(107,63,212,0.18);border-radius:10px;background:white;cursor:pointer;font-size:0.76rem;color:#3d3460">
      <input type="radio" name="co-payment-method" value="${value}" ${value === 'cash' ? 'checked' : ''} style="accent-color:#7c3aed"/>
      <span>${label}</span>
    </label>
  `;
}

function installCheckoutPaymentUi() {
  const radios = document.querySelectorAll('input[name="co-payment-method"]');
  radios.forEach(r => r.addEventListener('change', onCheckoutPaymentMethodChange));
  onCheckoutPaymentMethodChange();
}

function getSelectedCheckoutPaymentMethod() {
  return document.querySelector('input[name="co-payment-method"]:checked')?.value || 'cash';
}

function onCheckoutPaymentMethodChange() {
  const method = getSelectedCheckoutPaymentMethod();
  const extra = document.getElementById('co-payment-extra');
  const btn = document.getElementById('co-submit-btn');
  if (!extra) return;
  if (btn) btn.textContent = method === 'cash' ? 'Place Order ✦' : 'Pay & Place Order ✦';

  if (method === 'cash') {
    extra.innerHTML = `<p style="font-size:0.78rem;color:#7b72a8;background:#f8f7ff;border:1px solid rgba(107,63,212,0.12);padding:0.7rem;border-radius:10px">You will pay in cash when your order arrives.</p>`;
    return;
  }

  if (method === 'paypal') {
    extra.innerHTML = `
      <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">PayPal Email *</label>
      <input id="co-paypal-email" type="email" placeholder="you@example.com" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
    `;
    return;
  }

  if (method === 'flouci' || method === 'konnect') {
    extra.innerHTML = `
      <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">Wallet Phone *</label>
      <input id="co-wallet-phone" type="tel" placeholder="+216 XX XXX XXX" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
    `;
    return;
  }

  if (method === 'e_dinar') {
    extra.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.7rem">
        <div>
          <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">e-Dinar Number *</label>
          <input id="co-edinar-number" type="text" placeholder="1234 5678 9012 3456" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">PIN *</label>
          <input id="co-edinar-pin" type="password" maxlength="6" placeholder="****" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
        </div>
      </div>
    `;
    return;
  }

  // Visa / MasterCard / Credit Card
  extra.innerHTML = `
    <div style="display:grid;gap:0.7rem">
      <div>
        <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">Card Number *</label>
        <input id="co-card-number" type="text" placeholder="4242 4242 4242 4242" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.7rem">
        <div>
          <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">Expiry (MM/YY) *</label>
          <input id="co-card-expiry" type="text" placeholder="12/28" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">CVV *</label>
          <input id="co-card-cvv" type="password" maxlength="4" placeholder="123" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
        </div>
      </div>
      <div>
        <label style="font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;color:#7b72a8;display:block;margin-bottom:0.35rem">Card Holder *</label>
        <input id="co-card-holder" type="text" placeholder="MOHAMED TRABELSI" style="width:100%;padding:0.7rem;border:1px solid rgba(107,63,212,0.2);border-radius:10px;font-size:0.85rem;outline:none;box-sizing:border-box"/>
      </div>
    </div>
  `;
}

function paymentProviderForMethod(method) {
  if (method === 'visa') return 'visa';
  if (method === 'mastercard') return 'mastercard';
  if (method === 'credit_card') return 'bank_gateway';
  if (method === 'paypal') return 'paypal';
  if (method === 'e_dinar') return 'e_dinar';
  if (method === 'flouci') return 'flouci';
  if (method === 'konnect') return 'konnect';
  return 'cash_on_delivery';
}

function validateCheckoutPaymentDetails(method) {
  if (method === 'cash') return { ok: true, meta: {} };

  if (method === 'paypal') {
    const email = String(document.getElementById('co-paypal-email')?.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: '⚠️ Enter a valid PayPal email' };
    }
    return { ok: true, meta: { paypal_email: email } };
  }

  if (method === 'flouci' || method === 'konnect') {
    const phone = String(document.getElementById('co-wallet-phone')?.value || '').trim();
    if (phone.replace(/\D/g, '').length < 8) {
      return { ok: false, message: '⚠️ Enter a valid wallet phone number' };
    }
    return { ok: true, meta: { wallet_phone: phone } };
  }

  if (method === 'e_dinar') {
    const number = String(document.getElementById('co-edinar-number')?.value || '').replace(/\s+/g, '');
    const pin = String(document.getElementById('co-edinar-pin')?.value || '').trim();
    if (number.length < 12) return { ok: false, message: '⚠️ Enter a valid e-Dinar number' };
    if (!/^\d{4,6}$/.test(pin)) return { ok: false, message: '⚠️ Enter a valid e-Dinar PIN' };
    return { ok: true, meta: { e_dinar_last4: number.slice(-4) } };
  }

  const cardNumberRaw = String(document.getElementById('co-card-number')?.value || '');
  const cardNumber = cardNumberRaw.replace(/\D/g, '');
  const expiry = String(document.getElementById('co-card-expiry')?.value || '').trim();
  const cvv = String(document.getElementById('co-card-cvv')?.value || '').trim();
  const holder = String(document.getElementById('co-card-holder')?.value || '').trim();
  if (cardNumber.length < 13 || cardNumber.length > 19) return { ok: false, message: '⚠️ Enter a valid card number' };
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return { ok: false, message: '⚠️ Enter expiry as MM/YY' };
  if (!/^\d{3,4}$/.test(cvv)) return { ok: false, message: '⚠️ Enter a valid CVV' };
  if (holder.length < 3) return { ok: false, message: '⚠️ Enter card holder name' };
  return { ok: true, meta: { card_last4: cardNumber.slice(-4), card_holder: holder } };
}

function simulateCheckoutPayment(method) {
  return new Promise((resolve) => {
    // Front-end simulation placeholder until backend gateway webhooks are wired.
    setTimeout(function () {
      const ref = 'PAY-' + Date.now().toString(36).toUpperCase();
      if (method === 'cash') {
        resolve({ ok: true, status: 'pending', reference: ref });
        return;
      }
      resolve({ ok: true, status: 'paid', reference: ref });
    }, method === 'cash' ? 200 : 900);
  });
}

// ── WISHLIST ──
function updateWishlistBadge() {
  document.querySelectorAll('.wishlist-badge').forEach(b => b.textContent = State.wishlist.length);
}

function toggleWishlist(productId) {
  const pid = String(productId);
  const idx = State.wishlist.findIndex(function (w) {
    return String(w) === pid;
  });
  const product = State.products.find(function (p) {
    return String(p.id) === pid;
  });
  if (idx === -1) {
    State.wishlist.push(product ? product.id : productId);
    toast(`♥ Added to wishlist: ${product?.name}`, 'success');
  } else {
    State.wishlist.splice(idx, 1);
    toast(`Removed from wishlist`, 'default');
  }
  STN.DB.set('wishlist', State.wishlist);
  updateWishlistBadge();
  document.querySelectorAll('[data-wish]').forEach(function (btn) {
    var wid = btn.getAttribute('data-wish');
    if (String(wid) !== pid) return;
    var on = State.wishlist.some(function (w) {
      return String(w) === pid;
    });
    btn.classList.toggle('active', on);
    btn.textContent = on ? '♥' : '♡';
  });
}

// ── STAR RENDERING ──
function renderStars(rating) {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
}

function renderStarsInput(id) {
  return `<div class="star-input" id="stars-${id}">
    ${[1, 2, 3, 4, 5]
      .map(function (n) {
        return `<span onclick='setRating(${JSON.stringify(id)},${n})' data-val="${n}">☆</span>`;
      })
      .join('')}
  </div>`;
}

let currentRating = 0;
function setRating(id, val) {
  currentRating = val;
  const container = document.getElementById('stars-' + id);
  if (!container) return;
  container.querySelectorAll('span').forEach((s, i) => {
    s.textContent = i < val ? '★' : '☆';
    s.classList.toggle('active', i < val);
  });
}

// ── PRODUCT CARD HTML ──
function _cardEscapeAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function _productImageList(p) {
  if (!p || typeof p !== 'object') return [];
  var out = [];
  var raw = p.product_images;
  if (Array.isArray(raw)) {
    out = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) out = parsed;
    } catch (e) {}
  }
  if ((!out || out.length === 0) && (p.image || p.image_url)) {
    out = [p.image || p.image_url];
  }
  return out
    .map(function (u) { return String(u || '').trim(); })
    .filter(function (u) { return /^https?:\/\//i.test(u); })
    .slice(0, 4);
}
function _primaryProductImage(p) {
  var imgs = _productImageList(p);
  return imgs.length ? imgs[0] : '';
}
/** Listing / grid: real photo when vendor uploaded one (image_url), else gradient + emoji. */
function productCardMediaHTML(p) {
  const src = _primaryProductImage(p);
  if (src) {
    return `<img class="product-card-photo" src="${_cardEscapeAttr(src)}" alt="${_cardEscapeAttr(p.name || 'Product')}" loading="lazy" decoding="async" />`;
  }
  const from = p.bgFrom || '#2d1554';
  const to = p.bgTo || '#4a2080';
  return `<div class="product-emoji" style="background:linear-gradient(135deg,${from},${to})">${p.emoji || '📦'}</div>`;
}
function productCardHTML(p) {
  const isWished = State.wishlist.some(function (w) {
    return String(w) === String(p.id);
  });
  return `
  <div class="product-card" data-cat="${p.cat}">
    <div class="product-img-wrap">
      ${productCardMediaHTML(p)}
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      ${p.verified ? `<span class="product-verified">✓ Verified</span>` : ''}
      <div class="product-overlay">
        <button class="btn btn-gold btn-sm" onclick='openProductDetail(${JSON.stringify(p.id)})'>View Details</button>
        <button class="wishlist-btn ${isWished ? 'active' : ''}" data-wish="${_cardEscapeAttr(String(p.id))}" onclick='toggleWishlist(${JSON.stringify(p.id)})'>${isWished ? '♥' : '♡'}</button>
      </div>
    </div>
    <div class="product-body">
      <div class="product-brand">${p.brand} · ${p.region}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-rating">
        <span class="stars" style="letter-spacing:2px">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}</span>
        <span class="rating-num">${p.rating} (${p.reviews})</span>
      </div>
      <div class="product-price-row">
        <span class="price">${p.price.toLocaleString()}</span>
        <span class="price-currency">TND</span>
        ${p.oldPrice ? `<span class="price-old">${p.oldPrice.toLocaleString()} TND</span>` : ''}
        <button class="btn btn-gold btn-sm" style="margin-left:auto;padding:0.45rem 1rem;font-size:0.65rem" onclick='addToCart(${JSON.stringify(p.id)})'>+ Cart</button>
      </div>
    </div>
  </div>`;
}

// ── PRODUCT DETAIL MODAL ──
function _detailEscapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function _detailEscapeAttr(s) {
  return _detailEscapeHtml(s).replace(/'/g, '&#39;');
}
function _everestPartnerIconSmallHtml() {
  return '<span class="everest-partner-icon" role="img" aria-label="Everest Partner" title="Everest Partner" style="font-size:1.35rem;line-height:1">⛰️</span>';
}
function _everestPartnerGalleryMainHtml() {
  return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.75rem;height:100%;min-height:12rem;padding:2rem;background:linear-gradient(135deg,#ede9fe,#ddd6fe);border-radius:12px">
    <span style="font-size:4rem;line-height:1" role="img" aria-label="Everest Partner">⛰️</span>
    <span style="font-size:0.85rem;font-weight:600;letter-spacing:0.06em;color:#5b21b6;text-transform:uppercase">Everest Partner</span>
  </div>`;
}
function _detailGalleryMainProductHtml(p) {
  const src = _primaryProductImage(p);
  if (src) {
    return `<img src="${_detailEscapeAttr(String(src))}" alt="" style="max-width:100%;max-height:100%;object-fit:contain"/>`;
  }
  return _detailEscapeHtml(p.emoji || '✨');
}
function bindProductDetailThumbs(p) {
  const main = document.getElementById('gallery-main');
  if (!main) return;
  document.querySelectorAll('#product-modal-body .gallery-thumb').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('#product-modal-body .gallery-thumb').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const kind = t.getAttribute('data-detail-kind');
      if (kind === 'vendor') {
        main.innerHTML = window.__detailVendorMainHtml || _everestPartnerGalleryMainHtml();
      } else if (kind === 'product') {
        const src = _primaryProductImage(p);
        if (src) main.innerHTML = _detailGalleryMainProductHtml(p);
        else main.textContent = p.emoji || '';
      } else if (kind === 'product-image') {
        var imgSrc = (t.getAttribute('data-src') || '').trim();
        if (imgSrc) {
          main.innerHTML = `<img src="${_detailEscapeAttr(imgSrc)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain"/>`;
        }
      } else if (kind === 'emoji') {
        const em = t.getAttribute('data-emoji') || t.textContent;
        main.textContent = em || '';
      }
    });
  });
}
async function hydrateProductDetailVendor(p) {
  const nameEl = document.getElementById('detail-vendor-name');
  const wrap = document.getElementById('detail-vendor-logo-wrap');
  const thumbInner = document.getElementById('detail-vendor-thumb-inner');
  const fallbackName = p.brand || 'Everest Partner';

  const setEverest = () => {
    window.__detailVendorMainHtml = _everestPartnerGalleryMainHtml();
    const inner = _everestPartnerIconSmallHtml();
    if (wrap) wrap.innerHTML = inner;
    if (thumbInner) thumbInner.innerHTML = inner;
  };

  const setFromUrl = (url) => {
    const safe = _detailEscapeAttr(String(url));
    const thumbImg = `<img src="${safe}" alt="" style="width:100%;height:100%;object-fit:cover"/>`;
    const mainImg = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:1rem"><img src="${safe}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:12px"/></div>`;
    window.__detailVendorMainHtml = mainImg;
    if (wrap) wrap.innerHTML = thumbImg;
    if (thumbInner) thumbInner.innerHTML = thumbImg;
  };

  const refreshMainIfVendorThumbActive = () => {
    const active = document.querySelector('#product-modal-body .gallery-thumb.active');
    if (active && active.getAttribute('data-detail-kind') === 'vendor') {
      const main = document.getElementById('gallery-main');
      if (main) main.innerHTML = window.__detailVendorMainHtml || _everestPartnerGalleryMainHtml();
    }
  };

  if (nameEl) nameEl.textContent = fallbackName;
  setEverest();

  const vid = p.vendorId != null ? p.vendorId : p.vendor_id;
  if (vid == null || vid === '' || typeof SB === 'undefined' || typeof SB.getUserById !== 'function') {
    refreshMainIfVendorThumbActive();
    return;
  }

  try {
    const u = await SB.getUserById(vid);
    if (!u) {
      refreshMainIfVendorThumbActive();
      return;
    }
    const displayName =
      u.shop_name ||
      u.shopName ||
      u.name ||
      [u.first_name, u.last_name].filter(Boolean).join(' ') ||
      [u.firstName, u.lastName].filter(Boolean).join(' ') ||
      fallbackName;
    if (nameEl) nameEl.textContent = displayName;

    const rawLogo =
      u.vendor_logo_url ||
      u.logo_url ||
      u.vendor_logo ||
      u.avatar_url ||
      (typeof u.avatar === 'string' && /^https?:\/\//i.test(u.avatar) ? u.avatar : null);
    if (rawLogo) setFromUrl(rawLogo);
    else setEverest();
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('product.detail.vendor', 'fetch failed', { message: e && e.message });
    setEverest();
  }
  refreshMainIfVendorThumbActive();
}

async function openProductDetail(productId) {
  const p = State.products.find(function (pr) {
    return String(pr.id) === String(productId);
  });
  if (!p) {
    toast('Product not found. Try refreshing the page.', 'error');
    return;
  }
  State.selectedProduct = p;

  const productReviews = State.reviews.filter(function (r) {
    return String(r.productId) === String(productId);
  });
  const body = document.getElementById('product-modal-body');
  if (!body) {
    toast('Product details panel is missing. Reload the page.', 'error');
    return;
  }
  const fallbackName = p.brand || 'Everest Partner';

  const productImages = _productImageList(p);
  const productSrc = productImages[0] || '';
  const productThumbInner = productSrc
    ? `<img src="${_detailEscapeAttr(String(productSrc))}" alt="" style="width:100%;height:100%;object-fit:cover"/>`
    : _detailEscapeHtml(p.emoji || '✨');

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem">
      <div>
        <div class="gallery-main" id="gallery-main">${_detailGalleryMainProductHtml(p)}</div>
        <div class="gallery-thumbs" style="margin-top:0.8rem">
          <div class="gallery-thumb" data-detail-kind="vendor" id="detail-vendor-thumb" style="padding:2px;overflow:hidden;border:2px solid rgba(124,58,237,0.2)">
            <div id="detail-vendor-thumb-inner" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ede9fe,#ddd6fe)">${_everestPartnerIconSmallHtml()}</div>
          </div>
          <div class="gallery-thumb active" data-detail-kind="product" style="padding:2px;overflow:hidden">${productThumbInner}</div>
          ${productImages.slice(1).map(function (src) {
            return `<div class="gallery-thumb" data-detail-kind="product-image" data-src="${_detailEscapeAttr(src)}" style="padding:2px;overflow:hidden"><img src="${_detailEscapeAttr(src)}" alt="" style="width:100%;height:100%;object-fit:cover"/></div>`;
          }).join('')}
          ${['🔍', '📐', '🎨'].map(e => `<div class="gallery-thumb" data-detail-kind="emoji" data-emoji="${_detailEscapeAttr(e)}">${e}</div>`).join('')}
        </div>
      </div>
      <div>
        ${p.badge ? `<span class="product-badge" style="position:relative;top:auto;left:auto;display:inline-block;margin-bottom:0.8rem">${p.badge}</span>` : ''}
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:1rem" id="detail-vendor-row">
          <div id="detail-vendor-logo-wrap" style="width:56px;height:56px;border-radius:14px;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#ede9fe,#ddd6fe);border:1px solid rgba(124,58,237,0.25);display:flex;align-items:center;justify-content:center" title="Everest Partner">${_everestPartnerIconSmallHtml()}</div>
          <div>
            <div style="font-size:0.8rem;color:var(--text-muted)"><span style="font-weight:600">Sold by: </span><span id="detail-vendor-name" style="font-weight:600;color:var(--champagne)">${_detailEscapeHtml(fallbackName)}</span></div>
          </div>
        </div>
        <div class="product-brand" style="margin-bottom:0.3rem">${p.brand} · ${p.region}</div>
        <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:300;color:var(--champagne);margin-bottom:0.8rem">${p.name}</h2>
        <div class="product-rating" style="margin-bottom:1rem">
          <span class="stars" style="font-size:0.9rem;letter-spacing:2px">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}</span>
          <span class="rating-num">${p.rating} · ${p.reviews} reviews</span>
          ${p.verified ? `<span class="verified-buyer">✓ Verified Seller</span>` : ''}
        </div>
        <div style="margin-bottom:1.5rem">
          <span style="font-size:2rem;font-family:var(--font-display);color:var(--champagne)">${p.price.toLocaleString()}</span>
          <span style="font-size:1rem;color:var(--text-muted);margin-left:0.3rem">TND</span>
          ${p.oldPrice ? `<span class="price-old" style="margin-left:0.8rem">${p.oldPrice.toLocaleString()} TND</span>` : ''}
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted);line-height:1.8;margin-bottom:1.5rem">${p.desc}</p>
        ${p.specs ? `
        <div style="margin-bottom:1.5rem">
          ${Object.entries(p.specs).map(([k,v]) => `<div class="spec-row"><span class="spec-key">${k.charAt(0).toUpperCase()+k.slice(1)}</span><span class="spec-val">${v}</span></div>`).join('')}
        </div>` : ''}
        <div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:1.2rem">
          <div class="qty-selector">
            <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
            <div class="qty-display" id="detail-qty">1</div>
            <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
          </div>
          <button class="btn btn-gold" style="flex:1" onclick='addToCart(${JSON.stringify(p.id)});closeModal("product-modal")'>Add to Cart</button>
          <button class="wishlist-btn ${State.wishlist.some(function (w) { return String(w) === String(p.id); }) ? 'active' : ''}" data-wish="${_detailEscapeAttr(String(p.id))}" onclick='toggleWishlist(${JSON.stringify(p.id)})'>${State.wishlist.some(function (w) { return String(w) === String(p.id); }) ? '♥' : '♡'}</button>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted)">📦 In stock: ${p.stock} units · 🚚 Free delivery · 🔄 30-day returns</div>
      </div>
    </div>

    <!-- Reviews -->
    <div style="margin-top:2.5rem;border-top:1px solid rgba(107,63,212,0.12);padding-top:2rem">
      <h3 style="font-family:var(--font-display);font-size:1.4rem;color:var(--champagne);margin-bottom:1.5rem">Customer Reviews <span style="font-size:0.9rem;color:var(--text-muted)">(${productReviews.length})</span></h3>
      ${productReviews.length > 0 ? productReviews.map(r => `
        <div class="review-card" style="margin-bottom:1rem">
          <div class="review-header">
            <div>
              <div class="reviewer-name">${r.userName}</div>
              <div class="stars" style="font-size:0.75rem;margin:0.2rem 0">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.3rem">
              <span class="review-date">${r.date}</span>
              ${r.verified ? `<span class="verified-buyer">✓ Verified</span>` : ''}
            </div>
          </div>
          <p class="review-text">${r.comment}</p>
        </div>`).join('') : '<p style="color:var(--text-muted);font-size:0.85rem">No reviews yet. Be the first!</p>'}

      <!-- Leave Review -->
      ${State.currentUser ? `
      <div class="glass" style="margin-top:1.5rem;padding:1.5rem">
        <h4 style="font-size:0.85rem;color:var(--champagne);margin-bottom:1rem;letter-spacing:0.05em">Leave Your Review</h4>
        <div style="margin-bottom:0.8rem">
          <div class="section-label" style="margin-bottom:0.4rem">Rating</div>
          ${renderStarsInput(p.id)}
        </div>
        <textarea class="form-textarea" id="review-text" placeholder="Share your experience…" style="min-height:80px;margin-bottom:0.8rem"></textarea>
        <button class="btn btn-gold btn-sm" onclick='submitReview(${JSON.stringify(p.id)})'>Submit Review</button>
      </div>` : `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:1rem"><a href="#" onclick="showPage('auth')" style="color:var(--gold)">Sign in</a> to leave a review</p>`}
    </div>`;

  window.__detailVendorMainHtml = _everestPartnerGalleryMainHtml();
  openModal('product-modal');
  bindProductDetailThumbs(p);
  hydrateProductDetailVendor(p);
}

let detailQty = 1;
function changeDetailQty(d) {
  detailQty = Math.max(1, detailQty + d);
  const el = document.getElementById('detail-qty');
  if (el) el.textContent = detailQty;
}

async function submitReview(productId) {
  if (!State.currentUser) return;
  if (currentRating === 0) { toast('⚠️ Please select a rating', 'error'); return; }
  const text = document.getElementById('review-text')?.value?.trim();
  if (!text) { toast('⚠️ Please write a review', 'error'); return; }
  if (text.length < 3) { toast('⚠️ Please add a bit more detail in your review.', 'error'); return; }

  var first = State.currentUser.first_name || State.currentUser.firstName || '';
  var last = State.currentUser.last_name || State.currentUser.lastName || '';
  var userName = (first + ' ' + (last ? String(last).charAt(0) + '.' : '')).trim() || 'Customer';
  var uid = State.currentUser.id != null ? String(State.currentUser.id) : '';
  if (!uid) { toast('⚠️ Your profile is missing an id. Please sign in again.', 'error'); return; }

  var payload = {
    product_id: productId,
    user_id: uid,
    user_name: userName,
    rating: currentRating,
    comment: text,
    created_at: new Date().toISOString(),
  };

  try {
    if (typeof SB !== 'undefined' && SB && typeof SB.getProductReviewByUser === 'function') {
      var existing = await SB.getProductReviewByUser(productId, uid);
      var saved = existing && existing.id
        ? await SB.updateProductReview(existing.id, {
            rating: payload.rating,
            comment: payload.comment,
            user_name: payload.user_name,
            created_at: payload.created_at,
          })
        : await SB.createProductReview(payload);
      if (saved) {
        await initializeReviews();
      } else {
        throw new Error('Review save returned no row.');
      }
    } else {
      throw new Error('Supabase reviews API is unavailable.');
    }
  } catch (err) {
    // Fallback for temporary network outages: keep local review so UX still works.
    var localId = Date.now();
    var existingLocalIdx = State.reviews.findIndex(function (r) {
      return String(r.productId) === String(productId) && String(r.userId) === String(uid);
    });
    var localReview = {
      id: localId,
      productId: productId,
      userId: uid,
      userName: userName,
      rating: currentRating,
      comment: text,
      date: new Date().toISOString().split('T')[0],
      verified: true
    };
    if (existingLocalIdx >= 0) State.reviews[existingLocalIdx] = localReview;
    else State.reviews.push(localReview);
    STN.DB.set('reviews', State.reviews);
    usedLocalFallback = true;
    if (typeof STNLog !== 'undefined') STNLog.warn('reviews.submit', 'fallback local save', { message: err && err.message });
    toast('✦ Review saved locally (offline mode). It will sync when backend is reachable.', 'default');
  }

  applyReviewAggregatesToProducts();
  STN.DB.set('products', State.products);
  if (!usedLocalFallback) toast('✦ Review submitted! Thank you.', 'success');
  currentRating = 0;
  openProductDetail(productId);
}

// ── MODALS ──
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// ── AUTH ──
function renderAuth() {
  const page = document.getElementById('page-auth');
  if (!page) return;

  page.innerHTML = `
  <div class="s" style="max-width:520px;margin:0 auto;padding-top:5rem">
    <div class="s-header">
      <span class="eyebrow">Welcome to Everest</span>
      <h1 class="display" style="font-size:3rem;margin-bottom:0.5rem">Your Account</h1>
      <div class="divider center"></div>
    </div>
    <div class="tabs" style="margin-bottom:2rem">
      <button class="tab-btn active" id="tab-login" onclick="switchAuthTab('login')">Sign In</button>
      <button class="tab-btn" id="tab-register" onclick="switchAuthTab('register')">Create Account</button>
    </div>

    <!-- LOGIN -->
    <div id="auth-login" class="glass-lg" style="padding:2.5rem">
      <div class="form-group" style="margin-bottom:1rem">
        <label class="form-label">Email Address</label>
        <input type="email" class="form-input" id="login-email" placeholder="your@email.com"/>
      </div>
      <div class="form-group" style="margin-bottom:0.5rem">
        <label class="form-label">Password</label>
        <input type="password" class="form-input" id="login-pass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"/>
      </div>
      <div style="text-align:right;margin-bottom:1.5rem">
        <span style="font-size:0.75rem;color:var(--accent);cursor:pointer;text-decoration:underline" onclick="showForgotPassword()">Forgot password?</span>
      </div>
      <button class="btn btn-gold btn-full btn-lg" onclick="doLogin()">Sign In →</button>
      <div style="margin-top:1.2rem;text-align:center;font-size:0.75rem;color:var(--text-muted)">Demo: admin@everest.tn / admin123</div>
    </div>

    <!-- REGISTER -->
    <div id="auth-register" style="display:none">
      <div class="glass-lg" style="padding:2.5rem">
        <div class="form-row" style="margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">First Name *</label>
            <input type="text" class="form-input" id="reg-fname" placeholder="Mohamed"/>
          </div>
          <div class="form-group">
            <label class="form-label">Last Name *</label>
            <input type="text" class="form-input" id="reg-lname" placeholder="Trabelsi"/>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Email Address *</label>
          <input type="email" class="form-input" id="reg-email" placeholder="your@email.com"/>
        </div>
        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Phone Number *</label>
          <input type="tel" class="form-input" id="reg-phone" placeholder="+216 XX XXX XXX"/>
        </div>
        <div class="form-row" style="margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Wilaya (State) *</label>
            <select class="form-select" id="reg-wilaya" onchange="populateDelegations()">
              <option value="">Select Wilaya…</option>
              ${Object.keys(STN.WILAYAS).map(w => `<option value="${w}">${w}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Delegation *</label>
            <select class="form-select" id="reg-delegation">
              <option value="">Select Wilaya first…</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:1rem">
          <label class="form-label">Password *</label>
          <input type="password" class="form-input" id="reg-pass" placeholder="Min. 8 characters"/>
        </div>
        <div class="form-group" style="margin-bottom:1.5rem">
          <label class="form-label">Confirm Password *</label>
          <input type="password" class="form-input" id="reg-pass2" placeholder="Repeat password"/>
        </div>
        <div class="form-group" style="margin-bottom:1.5rem;padding:1rem;background:#f5f2ff;border-radius:12px;border:1px solid rgba(107,63,212,0.2)">
          <label style="display:flex;align-items:center;gap:0.8rem;cursor:pointer">
            <input type="checkbox" id="reg-is-vendor" onchange="var d=document.getElementById('reg-is-driver');var df=document.getElementById('reg-driver-fields');if(this.checked&&d)d.checked=false;if(df)df.style.display='none';document.getElementById('reg-vendor-fields').style.display=this.checked?'block':'none'" style="width:18px;height:18px;accent-color:#7c3aed"/>
            <span style="font-size:0.85rem;color:#1e0a4e;font-weight:500">🏪 I am an artisan/vendor — I want to sell on Everest</span>
          </label>
        </div>
        <div class="form-group" style="margin-bottom:1.5rem;padding:1rem;background:#ecfeff;border-radius:12px;border:1px solid rgba(14,165,233,0.25)">
          <label style="display:flex;align-items:center;gap:0.8rem;cursor:pointer">
            <input type="checkbox" id="reg-is-driver" onchange="var v=document.getElementById('reg-is-vendor');var vf=document.getElementById('reg-vendor-fields');var df=document.getElementById('reg-driver-fields');if(this.checked&&v){v.checked=false;}if(vf)vf.style.display='none';if(df)df.style.display=this.checked?'block':'none';" style="width:18px;height:18px;accent-color:#0ea5e9"/>
            <span style="font-size:0.85rem;color:#0c4a6e;font-weight:500">🚚 I am a delivery partner — I deliver Everest orders</span>
          </label>
        </div>
        <div id="reg-vendor-fields" style="display:none;margin-bottom:1.5rem;padding:1rem;background:#f8f7ff;border-radius:12px;border:1px solid rgba(107,63,212,0.15)">
          <div class="form-group" style="margin-bottom:1rem">
            <label class="form-label">Shop/Brand Name *</label>
            <input type="text" class="form-input" id="reg-shop" placeholder="ex: Ateliers Maalej"/>
          </div>
          <div class="form-group">
            <label class="form-label">What do you make?</label>
            <select class="form-select" id="reg-specialty">
              <option value="furniture">🪑 Furniture & Wood</option>
              <option value="lighting">💡 Lighting & Lamps</option>
              <option value="ceramics">🏺 Ceramics & Pottery</option>
              <option value="textiles">🧵 Textiles & Rugs</option>
              <option value="decor">🎭 Home Decor</option>
              <option value="outdoor">🌿 Outdoor & Garden</option>
            </select>
          </div>
        </div>
        <div id="reg-driver-fields" style="display:none;margin-bottom:1.5rem;padding:1.15rem;background:#f0f9ff;border-radius:12px;border:1px solid rgba(14,165,233,0.3)">
          <p style="font-size:0.78rem;font-weight:700;color:#0c4a6e;margin-bottom:0.85rem">Delivery partner — documents &amp; vehicle (required)</p>
          <div class="form-group" style="margin-bottom:0.85rem">
            <label class="form-label">CIN (national ID number) *</label>
            <input type="text" class="form-input" id="reg-driver-cin" placeholder="e.g. 12345678" maxlength="32"/>
          </div>
          <div class="form-row" style="margin-bottom:0.85rem">
            <div class="form-group">
              <label class="form-label">Vehicle plate *</label>
              <input type="text" class="form-input" id="reg-driver-plate" placeholder="123 تونس 4567"/>
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle model *</label>
              <input type="text" class="form-input" id="reg-driver-vmodel" placeholder="Peugeot Partner"/>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0.85rem">
            <label class="form-label">Vehicle colour *</label>
            <input type="text" class="form-input" id="reg-driver-vcolor" placeholder="White"/>
          </div>
          <div class="form-group" style="margin-bottom:0.85rem">
            <label class="form-label">Photo of CIN (identity card) *</label>
            <input type="file" class="form-input" id="reg-driver-cin-file" accept="image/*"/>
          </div>
          <div class="form-group" style="margin-bottom:0.35rem">
            <label class="form-label">Photo of driving licence *</label>
            <input type="file" class="form-input" id="reg-driver-lic-file" accept="image/*"/>
          </div>
          <div class="form-group" style="margin-bottom:0.35rem">
            <label class="form-label">B3 (criminal record extract) *</label>
            <input type="file" class="form-input" id="reg-driver-b3-file" accept="image/*,application/pdf"/>
          </div>
          <p style="font-size:0.68rem;color:#64748b;margin:0">CIN/licence as JPEG or PNG, B3 as image or PDF, max 8 MB each. An admin must verify your documents before you can accept deliveries.</p>
        </div>
        <button class="btn btn-gold btn-full btn-lg" onclick="doRegister()">Create Account →</button>
      </div>
    </div>
  </div>`;
}

function switchAuthTab(tab) {
  document.getElementById('auth-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-register').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  // Add vendor toggle listener
  setTimeout(() => {
    const cb = document.getElementById('reg-is-vendor');
    const fields = document.getElementById('reg-vendor-fields');
    const drv = document.getElementById('reg-is-driver');
    if (cb && fields) {
      cb.onchange = () => {
        var df = document.getElementById('reg-driver-fields');
        if (cb.checked && drv) drv.checked = false;
        if (df) df.style.display = 'none';
        fields.style.display = cb.checked ? 'block' : 'none';
      };
    }
    if (drv && cb && fields) {
      drv.onchange = () => {
        var df = document.getElementById('reg-driver-fields');
        if (drv.checked) {
          cb.checked = false;
          fields.style.display = 'none';
        }
        if (df) df.style.display = drv.checked ? 'block' : 'none';
      };
    }
  }, 100);
}

function populateDelegations() {
  const wilaya = document.getElementById('reg-wilaya')?.value;
  const delSel = document.getElementById('reg-delegation');
  if (!wilaya || !delSel) return;
  const delegations = STN.WILAYAS[wilaya] || [];
  delSel.innerHTML = `<option value="">Select Delegation…</option>` + delegations.map(d => `<option value="${d}">${d}</option>`).join('');
}

/**
 * Merge `public.users` (Supabase) into the session by email so `id` always matches the database
 * (fixes local demo ids vs UUID / bigint server ids). Patches the cached `users` list for the same email.
 */
async function healCurrentUserFromSupabase() {
  var u = State.currentUser;
  if (!u || typeof SB === 'undefined' || typeof SB.getUser !== 'function') return false;
  var emailRaw = String(u.email || '').trim();
  if (!emailRaw) return false;
  try {
    var row = await SB.getUser(emailRaw);
    if (!row && emailRaw.toLowerCase() !== emailRaw) {
      row = await SB.getUser(emailRaw.toLowerCase());
    }
    if (!row || row.id == null) return false;
    var merged = Object.assign({}, u, row, {
      firstName: row.first_name != null ? row.first_name : u.firstName,
      lastName: row.last_name != null ? row.last_name : u.lastName,
      first_name: row.first_name != null ? row.first_name : u.first_name,
      last_name: row.last_name != null ? row.last_name : u.last_name,
      shop_name: row.shop_name != null ? row.shop_name : u.shop_name,
      shopName: row.shop_name != null ? row.shop_name : u.shopName,
      id: row.id,
      role: row.role || u.role,
      verified: row.verified !== undefined ? row.verified : u.verified,
      wilaya: row.wilaya != null ? row.wilaya : u.wilaya,
      delegation: row.delegation != null ? row.delegation : u.delegation,
      phone: row.phone != null ? row.phone : u.phone,
      banned: row.banned !== undefined && row.banned !== null ? row.banned : u.banned,
      ban_reason: row.ban_reason !== undefined ? row.ban_reason : u.ban_reason,
      banned_at: row.banned_at !== undefined ? row.banned_at : u.banned_at,
      timeout_until: row.timeout_until !== undefined ? row.timeout_until : u.timeout_until,
      timeout_hours: row.timeout_hours !== undefined ? row.timeout_hours : u.timeout_hours,
      deleted_at: row.deleted_at !== undefined ? row.deleted_at : u.deleted_at,
    });
    State.currentUser = STN.userForSession(merged);
    STN.DB.set('currentUser', State.currentUser);
    var emKey = emailRaw.toLowerCase();
    var list = STN.DB.get('users') || [];
    var ix = list.findIndex(function (x) {
      return String(x.email || '').toLowerCase() === emKey;
    });
    if (ix >= 0) {
      list[ix] = Object.assign({}, list[ix], { id: row.id });
      STN.DB.set('users', list);
    }
    if (typeof updateNavUser === 'function') updateNavUser();
    return true;
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('auth.healSession', e && e.message);
    return false;
  }
}

async function doLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const pass = document.getElementById('login-pass')?.value;
  if (!email || !pass) { toast('⚠️ Please fill all fields', 'error'); return; }
  
  // Check hardcoded admin/vendor first
  const local = (STN.DB.get('users') || []).find(u => u.email === email && u.password === pass);
  if (local) {
    if (isUserSuspended(local)) {
      var whyL = (local.ban_reason || '').toString().trim();
      toast(
        whyL
          ? 'Account not active. Admin note: ' + (whyL.length > 160 ? whyL.slice(0, 157) + '…' : whyL)
          : 'This account is suspended or no longer active.',
        'error'
      );
      return;
    }
    const sessionUser = STN.userForSession(local);
    State.currentUser = sessionUser;
    STN.DB.set('currentUser', sessionUser);
    await healCurrentUserFromSupabase();
    STN.DB.set('currentUser', State.currentUser);
    updateNavUser();
    toast(`✦ Welcome back, ${State.currentUser.firstName || local.firstName}!`, 'success');
    if (State.currentUser.role === 'admin') showPage('admin');
    else if (State.currentUser.role === 'vendor') showPage('vendor');
    else if (State.currentUser.role === 'driver') showPage('driver');
    else showPage('home');
    return;
  }

  // Check Supabase
  try {
    const user = await SB.getUser(email);
    if (!user || user.password !== pass) { toast('⚠️ Invalid email or password', 'error'); return; }
    if (isUserSuspended(user)) {
      var whyS = (user.ban_reason || '').toString().trim();
      toast(
        whyS
          ? 'Account not active. Admin note: ' + (whyS.length > 160 ? whyS.slice(0, 157) + '…' : whyS)
          : 'This account is suspended or no longer active.',
        'error'
      );
      return;
    }
    State.currentUser = STN.userForSession({ ...user, firstName: user.first_name, lastName: user.last_name });
    STN.DB.set('currentUser', State.currentUser);
    await healCurrentUserFromSupabase();
    STN.DB.set('currentUser', State.currentUser);
    updateNavUser();
    toast(`✦ Welcome back, ${user.first_name}!`, 'success');
    if (user.role === 'admin') showPage('admin');
    else if (user.role === 'vendor') showPage('vendor');
    else if (user.role === 'driver') showPage('driver');
    else showPage('home');
  } catch(e) {
    if (typeof STNLog !== 'undefined') STNLog.error('auth.login', e, { email });
    toast('⚠️ Login failed. Try again.', 'error');
  }
}

async function doRegister() {
  const fname = document.getElementById('reg-fname')?.value?.trim();
  const lname = document.getElementById('reg-lname')?.value?.trim();
  const email = document.getElementById('reg-email')?.value?.trim();
  const phone = document.getElementById('reg-phone')?.value?.trim();
  const wilaya = document.getElementById('reg-wilaya')?.value;
  const delegation = document.getElementById('reg-delegation')?.value;
  const pass = document.getElementById('reg-pass')?.value;
  const pass2 = document.getElementById('reg-pass2')?.value;

  // ── ANTI-CHEAT CHECKS ──
  // 1. Real email validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast('Please enter a valid email address', 'error'); return;
  }
  // 2. Phone validation (Tunisia: 8 digits)
  if (phone && !/^[0-9+\s\-]{8,15}$/.test(phone)) {
    toast('Please enter a valid phone number', 'error'); return;
  }
  // 3. No fake names (numbers in name, too short)
  if (fname && (fname.length < 2 || /\d/.test(fname))) {
    toast('Please enter a real first name', 'error'); return;
  }
  if (lname && (lname.length < 2 || /\d/.test(lname))) {
    toast('Please enter a real last name', 'error'); return;
  }
  // 4. Strong password
  if (pass && pass.length < 8) {
    toast('Password must be at least 8 characters', 'error'); return;
  }
  // 5. Check for duplicate email
  const existingUsers = STN.DB.get('users') || [];
  if (existingUsers.find(u => u.email === email)) {
    toast('An account with this email already exists', 'error'); return;
  }
  // 6. Rate limit — only counts successful sign-ups; window resets after 1 hour
  var regWaitMin = _regRateLimitBlockedMinutes();
  if (regWaitMin != null) {
    toast('Too many new accounts from this browser in the last hour. Try again in about ' + regWaitMin + ' minutes.', 'error');
    return;
  }

  if (!fname || !lname || !email || !phone || !wilaya || !delegation || !pass) { toast('⚠️ Please fill all required fields', 'error'); return; }
  if (pass !== pass2) { toast('⚠️ Passwords do not match', 'error'); return; }
  if (pass.length < 8) { toast('⚠️ Password must be at least 8 characters', 'error'); return; }

  const users = STN.DB.get('users') || [];
  if (users.find(u => u.email === email)) { toast('⚠️ Email already registered', 'error'); return; }

  const isVendor = document.getElementById('reg-is-vendor')?.checked;
  const isDriver = document.getElementById('reg-is-driver')?.checked;
  const shopName = document.getElementById('reg-shop')?.value?.trim();
  const specialty = document.getElementById('reg-specialty')?.value;
  if (isVendor && isDriver) { toast('⚠️ Choose either vendor or delivery partner, not both', 'error'); return; }
  if (isVendor && !shopName) { toast('⚠️ Please enter your shop name', 'error'); return; }

  var cin = '';
  var plate = '';
  var vmodel = '';
  var vcolor = '';
  var fCin = null;
  var fLic = null;
  var fB3 = null;
  if (isDriver) {
    cin = document.getElementById('reg-driver-cin')?.value?.trim() || '';
    plate = document.getElementById('reg-driver-plate')?.value?.trim() || '';
    vmodel = document.getElementById('reg-driver-vmodel')?.value?.trim() || '';
    vcolor = document.getElementById('reg-driver-vcolor')?.value?.trim() || '';
    fCin = document.getElementById('reg-driver-cin-file')?.files?.[0];
    fLic = document.getElementById('reg-driver-lic-file')?.files?.[0];
    fB3 = document.getElementById('reg-driver-b3-file')?.files?.[0];
    if (!cin || !plate || !vmodel || !vcolor) {
      toast('Fill all delivery partner and vehicle fields', 'error');
      return;
    }
    if (!fCin || !fLic || !fB3) {
      toast('Upload CIN, driving licence, and B3 document', 'error');
      return;
    }
    if (fCin.size > 8 * 1024 * 1024 || fLic.size > 8 * 1024 * 1024 || fB3.size > 8 * 1024 * 1024) {
      toast('Each uploaded document must be under 8 MB', 'error');
      return;
    }
  }

  try {
    var regRole = 'customer';
    if (isVendor) regRole = 'vendor';
    else if (isDriver) regRole = 'driver';

    var cinUrl = '';
    var licUrl = '';
    var b3Url = '';
    if (isDriver && typeof SB.uploadStorageObject === 'function') {
      var cinBlob = await compressImageFileToJpegBlob(fCin, 1600, 0.82);
      var licBlob = await compressImageFileToJpegBlob(fLic, 1600, 0.82);
      var emailSlug = encodeURIComponent(String(email).replace(/[@.\s]/g, '_')).slice(0, 80);
      var pathBase = emailSlug + '/' + Date.now();
      try {
        var up1 = await SB.uploadStorageObject(_driverKycBucket(), pathBase + '-cin.jpg', cinBlob, 'image/jpeg');
        cinUrl = up1.publicUrl;
      } catch (e1) {
        var d1 = await blobToDataUrl(cinBlob);
        if (d1.length > 650000) {
          toast('CIN photo is too large without Storage — add bucket driver-kyc or use a smaller image', 'error');
          return;
        }
        cinUrl = d1;
      }
      try {
        var up2 = await SB.uploadStorageObject(_driverKycBucket(), pathBase + '-licence.jpg', licBlob, 'image/jpeg');
        licUrl = up2.publicUrl;
      } catch (e2) {
        var d2 = await blobToDataUrl(licBlob);
        if (d2.length > 650000) {
          toast('Licence photo is too large without Storage — add bucket driver-kyc or use a smaller image', 'error');
          return;
        }
        licUrl = d2;
      }
      try {
        var b3IsPdf = String(fB3.type || '').toLowerCase().indexOf('pdf') >= 0;
        if (b3IsPdf) {
          var up3pdf = await SB.uploadStorageObject(_driverKycBucket(), pathBase + '-b3.pdf', fB3, 'application/pdf');
          b3Url = up3pdf.publicUrl;
        } else {
          var b3Blob = await compressImageFileToJpegBlob(fB3, 1800, 0.84);
          var up3img = await SB.uploadStorageObject(_driverKycBucket(), pathBase + '-b3.jpg', b3Blob, 'image/jpeg');
          b3Url = up3img.publicUrl;
        }
      } catch (e3) {
        toast('B3 upload failed. Please retry with a clearer file.', 'error');
        return;
      }
    } else if (isDriver) {
      toast('Registration client is missing storage support', 'error');
      return;
    }

    var userPayload = {
      email, password: pass,
      first_name: fname, last_name: lname,
      phone, wilaya, delegation,
      role: regRole,
      points: 100,
      verified: isVendor || isDriver ? false : true,
      avatar: isVendor ? '🏪' : isDriver ? '🚚' : '👤',
      shop_name: shopName || null,
      specialty: specialty || null
    };
    if (isDriver) {
      userPayload.id_card_number = cin;
      userPayload.vehicle_plate_number = plate;
      userPayload.vehicle_model = vmodel;
      userPayload.vehicle_color = vcolor;
      userPayload.cin_document_url = cinUrl;
      userPayload.license_document_url = licUrl;
      userPayload.b3_document_url = b3Url;
      userPayload.verified = false;
      userPayload.is_verified = false;
    }

    var remoteExisting = null;
    try {
      if (typeof SB !== 'undefined' && SB.getUser) {
        remoteExisting = await SB.getUser(email);
      }
    } catch (ignoreDupProbe) {}
    if (remoteExisting) {
      toast('⚠️ This email is already registered', 'error');
      return;
    }

    const newUser = await SB.createUser(userPayload);
    var insertFallback = newUser._stnInsertFallbackLevel;
    if (insertFallback != null) delete newUser._stnInsertFallbackLevel;
    _regRateLimitRecordSuccess();
    try {
      var regUsers = STN.DB.get('users') || [];
      var regSid = String(newUser.id);
      var regIx = regUsers.findIndex(function (u) {
        return String(u.id) === regSid;
      });
      var regSession = STN.userForSession({
        ...newUser,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
      });
      if (regIx === -1) {
        regUsers.push(regSession);
      } else if (
        String(regUsers[regIx].email || '').toLowerCase() !== String(newUser.email || '').toLowerCase()
      ) {
        regUsers[regIx] = regSession;
      } else {
        Object.assign(regUsers[regIx], regSession);
      }
      STN.DB.set('users', regUsers);
    } catch (regLocalErr) {}
    State.currentUser = STN.userForSession({ ...newUser, firstName: newUser.first_name, lastName: newUser.last_name });
    STN.DB.set('currentUser', State.currentUser);
    await healCurrentUserFromSupabase();
    STN.DB.set('currentUser', State.currentUser);
    updateNavUser();
    if (isVendor) {
      toast(`✦ Welcome ${shopName}! Your vendor account is pending verification.`, 'success');
      showPage('vendor');
    } else if (isDriver) {
      toast(`✦ Welcome, ${fname}! Your documents are under review — you can accept deliveries after an admin verifies you.`, 'success');
      if (insertFallback > 0) {
        toast(
          'Note: some driver fields could not be stored (database may need migrations). Ask an admin to update Supabase, then edit your profile if needed.',
          'default'
        );
      }
      showPage('driver');
    } else {
      toast(`✦ Welcome to Everest, ${fname}! You earned 100 bonus points!`, 'success');
      showPage('home');
    }
  } catch(e) {
    if (typeof STNLog !== 'undefined') STNLog.error('auth.register', e, { email });
    var em = String(e && e.message ? e.message : 'Registration failed');
    var low = em.toLowerCase();
    if (low.indexOf('duplicate') >= 0 || low.indexOf('unique') >= 0) {
      toast('⚠️ Email already registered!', 'error');
    } else {
      var short = em.length > 200 ? em.slice(0, 197) + '…' : em;
      toast('⚠️ ' + short, 'error');
    }
  }
}

function logout() {
  State.currentUser = null;
  STN.DB.set('currentUser', null);
  updateNavUser();
  toast('Signed out successfully');
  showPage('home');
}

/** Customer, vendor, or driver: remove own profile (not admin). Uses Supabase delete or soft-delete; falls back to local-only if SB is unavailable. */
async function deleteMyAccount() {
  if (!State.currentUser) {
    showPage('auth');
    return;
  }
  var role = State.currentUser.role;
  if (role === 'admin') {
    toast('Admin accounts cannot be deleted from here. Contact another admin or support.', 'error');
    return;
  }
  var uid = State.currentUser.id;
  if (uid == null || uid === '') {
    toast('This session has no account id. Use Log out instead.', 'error');
    return;
  }
  var email = State.currentUser.email || 'your account';
  if (
    !confirm(
      'Delete your Everest account?\n\n' +
        email +
        '\n\nYou will be signed out. This cannot be undone in the app. Continue?'
    )
  ) {
    return;
  }
  if (!confirm('Final confirmation: permanently delete this account?')) return;

  function clearLocalSessionAndUserRow() {
    var usersArr = STN.DB.get('users') || [];
    STN.DB.set(
      'users',
      usersArr.filter(function (u) {
        return String(u.id) !== String(uid);
      })
    );
    _stnAdminRemovedUserIdRemember(uid);
    State.currentUser = null;
    STN.DB.set('currentUser', null);
    updateNavUser();
    showPage('home');
  }

  if (typeof SB === 'undefined' || typeof SB.deleteUser !== 'function') {
    clearLocalSessionAndUserRow();
    toast('Removed from this device (cloud delete unavailable).', 'success');
    return;
  }

  var deleteHow = '';
  try {
    await SB.deleteUser(uid);
    deleteHow = 'hard';
  } catch (eDel) {
    try {
      if (typeof SB.updateUser === 'function') {
        await SB.updateUser(uid, {
          deleted_at: new Date().toISOString(),
          banned: true,
          ban_reason: 'Account deleted by user',
          banned_at: new Date().toISOString(),
        });
        deleteHow = 'soft';
      } else {
        throw eDel;
      }
    } catch (eSoft) {
      var em = String((eDel && eDel.message) || eDel || '');
      toast(
        em.indexOf('permission') >= 0 || em.indexOf('RLS') >= 0 || em.indexOf('policy') >= 0
          ? 'Could not delete: server blocked the request. Try again or contact support.'
          : 'Could not delete: ' + (em.length > 120 ? em.slice(0, 117) + '…' : em),
        'error'
      );
      if (typeof STNLog !== 'undefined') STNLog.error('deleteMyAccount', eDel, { uid });
      return;
    }
  }

  clearLocalSessionAndUserRow();
  toast(
    deleteHow === 'hard'
      ? 'Your account was deleted.'
      : 'Your account was closed (profile hidden on the server).',
    'success'
  );
}

// ── HOME ──
function renderHome() {
  const products = State.products;
  
  // Featured - first 8
  const grid = document.getElementById('home-featured-grid');
  if (grid) {
    grid.innerHTML = products.slice(0, 8).map(productCardHTML).join('');
    animateProductCardsEntry(grid);
  }

  // Best sellers - sort by reviews
  const bsGrid = document.getElementById('home-bestsellers-grid');
  if (bsGrid) {
    const bs = [...products].sort((a,b) => b.reviews - a.reviews).slice(0, 8);
    bsGrid.innerHTML = bs.map(productCardHTML).join('');
    animateProductCardsEntry(bsGrid);
  }

  // New arrivals - last 6
  const newGrid = document.getElementById('home-new-grid');
  if (newGrid) {
    newGrid.innerHTML = products.slice(-6).map(productCardHTML).join('');
    animateProductCardsEntry(newGrid);
  }

  startFlashTimer();
  initReveal();
}

// ── PRODUCTS ──
function renderProducts() {
  // Initialize the sidebar with current products
  filterAndRenderProducts();
  initReveal();
}

function filterProducts(cat, btn) {
  State.filterCat = cat;
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  
  // Update sidebar categories based on legacy filter
  const allCheckbox = document.getElementById('cat-all');
  const categoryCheckbox = document.getElementById(`cat-${cat}`);
  
  if (cat === 'all') {
    // Check "All Products" and uncheck others
    if (allCheckbox) allCheckbox.checked = true;
    document.querySelectorAll('.category-item input[type="checkbox"]:not(#cat-all)').forEach(cb => {
      cb.checked = false;
    });
    FilterState.categories = [];
  } else {
    // Uncheck "All Products" and check specific category
    if (allCheckbox) allCheckbox.checked = false;
    if (categoryCheckbox) categoryCheckbox.checked = true;
    FilterState.categories = [cat];
  }
  
  // Apply filters
  applyFilters();
}

function searchProducts() {
  const q = String(document.getElementById('prod-search')?.value || '')
    .trim()
    .toLowerCase();
  State.searchQuery = q;
  // Keep one single filtering path for search + sidebar filters.
  applyFilters();
  initReveal();
}
window.searchProducts = searchProducts;

// ── TRACK ──
async function renderTrack() {
  initReveal();
  
  // Add test button for development
  addTestButton();
  
  // If user is logged in, show their orders automatically
  if (State.currentUser && State.currentUser.id) {
    const trackInput = document.getElementById('track-num');
    const emptyDiv = document.getElementById('track-empty');
    const resultDiv = document.getElementById('track-result');

    try {
      const orders = await SB.getUserOrders(State.currentUser.id);
      if (orders && orders.length > 0 && emptyDiv && resultDiv) {
        emptyDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
          <div style="margin-bottom:2rem">
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#1e0a4e;margin-bottom:0.5rem">Your Orders</h3>
            <p style="color:#7b72a8;font-size:0.85rem">${orders.length} order${orders.length > 1 ? 's' : ''} found</p>
          </div>
          ${orders.map(order => {
            const statusColors = { pending:'#f59e0b', confirmed:'#3b82f6', processing:'#8b5cf6', shipped:'#06b6d4', delivered:'#10b981' };
            const color = statusColors[order.status] || '#7c3aed';
            return `<div style="background:white;border:1px solid rgba(107,63,212,0.15);border-radius:16px;padding:1.5rem;margin-bottom:1rem;cursor:pointer;transition:all 0.2s" onclick="document.getElementById('track-num').value='${order.tracking_number}';trackOrder()" onmouseover="this.style.borderColor='#7c3aed'" onmouseout="this.style.borderColor='rgba(107,63,212,0.15)'">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem">
                <div>
                  <p style="font-size:0.7rem;color:#7b72a8;margin-bottom:0.2rem">Tracking Number</p>
                  <p style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#1e0a4e;font-weight:600">${order.tracking_number}</p>
                </div>
                <span style="background:${color}20;color:${color};padding:0.3rem 0.8rem;border-radius:20px;font-size:0.72rem;font-weight:600;text-transform:uppercase">● ${order.status}</span>
              </div>
              <div style="display:flex;gap:1.5rem;margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(107,63,212,0.08)">
                <div><p style="font-size:0.65rem;color:#7b72a8">Date</p><p style="font-size:0.8rem;color:#1e0a4e">${new Date(order.created_at).toLocaleDateString('fr-TN')}</p></div>
                <div><p style="font-size:0.65rem;color:#7b72a8">Total</p><p style="font-size:0.8rem;color:#1e0a4e">${Number(order.total).toLocaleString()} TND</p></div>
                <div><p style="font-size:0.65rem;color:#7b72a8">Items</p><p style="font-size:0.8rem;color:#1e0a4e">${order.items ? order.items.length : 0}</p></div>
              </div>
              <p style="font-size:0.72rem;color:#7c3aed;margin-top:0.8rem">Click to see full tracking →</p>
            </div>`;
          }).join('')}`;
        return;
      }
    } catch(e) {}
  }
  
  const empty = document.getElementById('track-empty');
  const result = document.getElementById('track-result');
  if (empty) empty.style.display = 'block';
  if (result) result.style.display = 'none';
}

// Real-time tracking state (fetch SB has no WebSocket; polling + safe stubs)
let currentTrackingOrder = null;
let trackingSubTokens = [];
let trackingUpdateInterval = null;

async function trackOrder() {
  const num = document.getElementById('track-num')?.value?.trim().toUpperCase();
  if (!num) { toast('⚠️ Please enter a tracking number', 'error'); return; }

  const resultDiv = document.getElementById('track-result');
  const emptyDiv = document.getElementById('track-empty');
  if (!resultDiv || !emptyDiv) { toast('⚠️ Tracking UI not found', 'error'); return; }

  // Show loading
  emptyDiv.style.display = 'none';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div style="text-align:center;padding:3rem"><div style="font-size:2rem;animation:spin 1s linear infinite;display:inline-block">⏳</div><p style="color:#7b72a8;margin-top:1rem">Looking up your order...</p></div>';

  try {
    const order = await SB.findOrder(num);
    if (!order) {
      resultDiv.style.display = 'none';
      emptyDiv.style.display = 'block';
      toast('⚠️ Order not found. Check your tracking number!', 'error');
      return;
    }

    // Store current order for real-time updates
    currentTrackingOrder = order;

    // Start real-time tracking
    startRealtimeTracking(order);

    // Render initial tracking UI
    await renderTrackingUI(order);

  } catch(e) {
    resultDiv.style.display = 'none';
    emptyDiv.style.display = 'block';
    toast('⚠️ Error fetching order. Try again.', 'error');
  }
}

function startRealtimeTracking(order) {
  trackingSubTokens.forEach(function (t) {
    try { SB.unsubscribe(t); } catch (e) {}
  });
  trackingSubTokens = [];
  if (trackingUpdateInterval) {
    clearInterval(trackingUpdateInterval);
    trackingUpdateInterval = null;
  }

  if (typeof SB.subscribeToOrders === 'function') {
    const t1 = SB.subscribeToOrders(async (payload) => {
      if (payload.new && payload.new.id === order.id) {
        console.log('🔄 Order status updated:', payload.new);
        currentTrackingOrder = payload.new;
        await renderTrackingUI(payload.new);
        toast('📦 Order status updated!', 'success');
      }
    });
    if (t1) trackingSubTokens.push(t1);
  }

  if (typeof SB.subscribeToTracking === 'function') {
    const t2 = SB.subscribeToTracking(order.id, async (payload) => {
      console.log('📍 Tracking event updated:', payload);
      if (currentTrackingOrder) {
        await renderTrackingUI(currentTrackingOrder);
      }
    });
    if (t2) trackingSubTokens.push(t2);
  }

  // Polling (primary path for fetch-based SB)
  trackingUpdateInterval = setInterval(async () => {
    try {
      const updatedOrder = await SB.getOrder(order.id);
      if (!updatedOrder || !currentTrackingOrder) return;
      var statusCh = updatedOrder.status !== currentTrackingOrder.status;
      var vehCh =
        String(updatedOrder.driver_accepted_at || '') !== String(currentTrackingOrder.driver_accepted_at || '') ||
        String(updatedOrder.delivery_vehicle_plate || '') !== String(currentTrackingOrder.delivery_vehicle_plate || '') ||
        String(updatedOrder.delivery_vehicle_model || '') !== String(currentTrackingOrder.delivery_vehicle_model || '') ||
        String(updatedOrder.delivery_vehicle_color || '') !== String(currentTrackingOrder.delivery_vehicle_color || '');
      if (statusCh || vehCh) {
        currentTrackingOrder = updatedOrder;
        await renderTrackingUI(updatedOrder);
        if (statusCh) toast('📦 Order status updated!', 'success');
      }
    } catch(e) {
      console.log('⚠️ Polling update failed:', e);
    }
  }, 30000);
}

async function renderTrackingUI(order) {
  const resultDiv = document.getElementById('track-result');
  if (!resultDiv) return;

  let tracking = [];
  try {
    const raw = await SB.getTracking(order.id);
    tracking = Array.isArray(raw) ? raw : [];
  } catch (e) {
    tracking = [];
  }
  const steps = [
    { key: 'pending', label: '🕐 Order Received', desc: 'Your order has been received' },
    { key: 'confirmed', label: '✅ Confirmed', desc: 'Artisan is preparing your order' },
    { key: 'processing', label: '🔨 Crafting', desc: 'Being handcrafted with care' },
    { key: 'ready', label: '📦 Ready for pickup', desc: 'Driver can pick up your package' },
    { key: 'out_for_delivery', label: '🚚 Out for delivery', desc: 'Driver is on the way' },
    { key: 'delivered', label: '🎉 Delivered', desc: 'Enjoy your purchase!' }
  ];
  var normalizedStatus = normalizeOrderStatus(order.status);
  if (normalizedStatus === 'shipped' || normalizedStatus === 'transit') normalizedStatus = 'out_for_delivery';
  const currentStepIndex = steps.findIndex(s => s.key === normalizedStatus);
  const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', ready: '#7c3aed', out_for_delivery: '#06b6d4', delivered: '#10b981' };
  const statusColor = statusColors[normalizedStatus] || '#7c3aed';
  const showVehicle =
    !!order.driver_accepted_at &&
    !!(order.delivery_vehicle_plate || order.delivery_vehicle_model || order.delivery_vehicle_color);

  resultDiv.innerHTML = `
    <div style="padding:2rem;background:white;border-radius:20px;border:1px solid rgba(107,63,212,0.15);box-shadow:0 4px 24px rgba(74,31,168,0.08);margin-bottom:1.5rem">
      <!-- Real-time indicator -->
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;padding:0.75rem;background:#f0fdf4;border-radius:12px;border:1px solid #dcfce7">
        <div style="width:8px;height:8px;background:#10b981;border-radius:50%;animation:pulse 2s infinite"></div>
        <span style="font-size:0.75rem;color:#059669;font-weight:600">🔴 LIVE TRACKING</span>
        <span style="font-size:0.7rem;color:#6b7280;margin-left:auto">Updates automatically</span>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(107,63,212,0.1)">
        <div>
          <p style="font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#7b72a8;margin-bottom:0.3rem">Tracking Number</p>
          <p style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:#1e0a4e;font-weight:600">${order.tracking_number}</p>
        </div>
        <span style="background:${statusColor}20;color:${statusColor};padding:0.4rem 1rem;border-radius:20px;font-size:0.75rem;font-weight:600;text-transform:uppercase">● ${normalizedStatus.replace(/_/g, ' ')}</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem">
        <div style="text-align:center;padding:1rem;background:#f8f7ff;border-radius:12px">
          <p style="font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#7b72a8;margin-bottom:0.3rem">Date</p>
          <p style="font-size:0.85rem;color:#1e0a4e;font-weight:500">${new Date(order.created_at).toLocaleDateString('fr-TN')}</p>
        </div>
        <div style="text-align:center;padding:1rem;background:#f8f7ff;border-radius:12px">
          <p style="font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#7b72a8;margin-bottom:0.3rem">Items</p>
          <p style="font-size:0.85rem;color:#1e0a4e;font-weight:500">${order.items ? order.items.length : 0}</p>
        </div>
        <div style="text-align:center;padding:1rem;background:#f8f7ff;border-radius:12px">
          <p style="font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#7b72a8;margin-bottom:0.3rem">Total</p>
          <p style="font-size:0.85rem;color:#1e0a4e;font-weight:500">${Number(order.total).toLocaleString()} TND</p>
        </div>
      </div>

      ${showVehicle ? `
      <div style="padding:1.25rem;background:linear-gradient(135deg,#ecfeff,#f0f9ff);border-radius:14px;border:1px solid rgba(6,182,212,0.35);margin-bottom:1.75rem">
        <p style="font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#0e7490;font-weight:700;margin-bottom:0.75rem">Your delivery vehicle</p>
        <div style="display:grid;gap:0.45rem;font-size:0.88rem;color:#164e63">
          ${order.delivery_vehicle_plate ? `<div><span style="font-weight:600;color:#155e75">Plate:</span> ${_detailEscapeHtml(order.delivery_vehicle_plate)}</div>` : ''}
          ${order.delivery_vehicle_model ? `<div><span style="font-weight:600;color:#155e75">Model:</span> ${_detailEscapeHtml(order.delivery_vehicle_model)}</div>` : ''}
          ${order.delivery_vehicle_color ? `<div><span style="font-weight:600;color:#155e75">Colour:</span> ${_detailEscapeHtml(order.delivery_vehicle_color)}</div>` : ''}
        </div>
      </div>` : ''}

      <!-- Real-time Timeline -->
      <div style="position:relative;padding-left:2rem">
        <div style="position:absolute;left:0.45rem;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#7c3aed,#e8e4ff)"></div>
        ${steps.map((step, i) => {
          const done = i <= currentStepIndex;
          const active = i === currentStepIndex;
          const trackEvent = tracking.find(t => normalizeOrderStatus(t.status) === step.key);
          return `<div style="position:relative;margin-bottom:1.5rem;opacity:${done ? '1' : '0.4'}${active ? ';animation:fadeIn 0.5s ease-in' : ''}">
            <div style="position:absolute;left:-1.6rem;top:0.2rem;width:14px;height:14px;border-radius:50%;background:${active ? '#7c3aed' : done ? '#9b72f0' : '#e8e4ff'};border:2px solid ${done ? '#7c3aed' : '#d4d0f0'};${active ? 'box-shadow:0 0 0 4px rgba(124,58,237,0.15);animation:pulse 2s infinite' : ''}"></div>
            <p style="font-size:0.85rem;font-weight:600;color:#1e0a4e;margin-bottom:0.2rem">${step.label}</p>
            <p style="font-size:0.75rem;color:#7b72a8">${trackEvent ? trackEvent.message : step.desc}</p>
            ${trackEvent ? `<p style="font-size:0.68rem;color:#b0a8d4;margin-top:0.2rem">${new Date(trackEvent.created_at).toLocaleString('fr-TN')}${trackEvent.location ? ' · ' + trackEvent.location : ''}</p>` : ''}
            ${active ? `<div style="margin-top:0.5rem;padding:0.4rem 0.8rem;background:#f0f9ff;border-radius:8px;display:inline-block">
              <span style="font-size:0.65rem;color:#1d4ed8;font-weight:600">⚡ IN PROGRESS</span>
            </div>` : ''}
          </div>`;
        }).join('')}
      </div>

      <!-- Refresh button -->
      <div style="margin-top:2rem;text-align:center">
        <button onclick="refreshTracking()" style="background:#f0f9ff;color:#1d4ed8;border:1px solid #0ea5e9;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer">🔄 Refresh Status</button>
      </div>
    </div>`;
  
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function refreshTracking() {
  if (currentTrackingOrder) {
    renderTrackingUI(currentTrackingOrder);
    toast('🔄 Tracking refreshed', 'default');
  }
}

function stopRealtimeTracking() {
  trackingSubTokens.forEach(function (t) {
    try { SB.unsubscribe(t); } catch (e) {}
  });
  trackingSubTokens = [];
  if (trackingUpdateInterval) {
    clearInterval(trackingUpdateInterval);
    trackingUpdateInterval = null;
  }
  currentTrackingOrder = null;
}

// ── TESTING FUNCTIONS ──
// Test function to simulate real-time order status updates
async function testRealtimeTracking() {
  console.log('🧪 Starting real-time tracking test...');
  
  // Get a sample order for testing
  const testTrackingNum = 'STN-TEST123';
  
  try {
    // Create a test order if it doesn't exist
    let testOrder = await SB.findOrder(testTrackingNum);
    
    if (!testOrder) {
      // Create a sample test order
      testOrder = await SB.createOrder({
        user_id: 1,
        items: [{ id: 1, name: 'Test Product', price: 100, quantity: 1 }],
        total: 100,
        notes: 'Test order for real-time tracking',
        phone: '+21612345678',
        status: 'pending'
      });
      
      // Update tracking number to our test value
      await SB.updateOrderStatus(testOrder.id, 'pending');
      testOrder.tracking_number = testTrackingNum;
      console.log('✅ Test order created:', testOrder);
    } else {
      console.log('✅ Using existing test order:', testOrder);
    }
    
    // Simulate status changes every 5 seconds
    const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const messages = [
      '🕐 Order received — being prepared by artisan',
      '✅ Order confirmed — artisan starting work',
      '🔨 Crafting your item with care',
      '🚚 On the way to your location',
      '🎉 Delivered successfully!'
    ];
    const locations = [
      'Ksar Hellal Workshop',
      'Ksar Hellal Workshop', 
      'Ksar Hellal Workshop',
      'In Transit - Sahel Region',
      'Delivered - Customer Address'
    ];
    
    let currentStatusIndex = statuses.indexOf(testOrder.status);
    
    const statusInterval = setInterval(async () => {
      if (currentStatusIndex < statuses.length - 1) {
        currentStatusIndex++;
        const newStatus = statuses[currentStatusIndex];
        const message = messages[currentStatusIndex];
        const location = locations[currentStatusIndex];
        
        console.log(`🔄 Updating order status to: ${newStatus}`);
        
        // Update order status
        await SB.updateOrderStatus(testOrder.id, newStatus);
        
        // Add tracking event
        await SB.addTracking(testOrder.id, newStatus, message, location);
        
        // Show notification
        toast(`📦 Order status updated to: ${newStatus}`, 'success');
        
        if (newStatus === 'delivered') {
          clearInterval(statusInterval);
          console.log('🎉 Test completed! Order delivered.');
        }
      } else {
        clearInterval(statusInterval);
      }
    }, 5000);
    
    // Start tracking the test order
    document.getElementById('track-num').value = testTrackingNum;
    await trackOrder();
    
    toast('🧪 Real-time tracking test started! Watch for updates...', 'default');
    
  } catch (error) {
    if (typeof STNLog !== 'undefined') STNLog.error('track.testRealtime', error, {});
    toast('⚠️ Test failed. Check console for details.', 'error');
  }
}

// Add test button to tracking page (for development)
function addTestButton() {
  const trackPage = document.getElementById('page-track');
  if (trackPage && !document.getElementById('test-tracking-btn')) {
    const testBtn = document.createElement('button');
    testBtn.id = 'test-tracking-btn';
    testBtn.textContent = '🧪 Test Real-time Updates';
    testBtn.style.cssText = 'background:#f0f9ff;color:#1d4ed8;border:1px solid #0ea5e9;padding:0.6rem 1.5rem;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer;margin:1rem;display:block;width:max-content;';
    testBtn.onclick = testRealtimeTracking;
    
    // Insert before the tracking form
    const form = trackPage.querySelector('form');
    if (form) {
      form.parentNode.insertBefore(testBtn, form);
    }
  }
}

// ── WISHLIST PAGE ──
function renderWishlist() {
  const grid = document.getElementById('wishlist-grid');
  if (!grid) return;
  const items = State.products.filter(p => State.wishlist.includes(p.id));
  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:1rem">♡</div><p>Your wishlist is empty</p><button class="btn btn-ghost btn-sm" style="margin-top:1.5rem" onclick="showPage('products')">Browse Collections</button></div>`;
  } else {
    grid.innerHTML = items.map(productCardHTML).join('');
    animateProductCardsEntry(grid);
  }
  initReveal();
}

// ── ACCOUNT ──
function renderAccount() {
  if (!State.currentUser) { showPage('auth'); return; }
  const u = State.currentUser;
  var fn = u.firstName || u.first_name || '';
  var ln = u.lastName || u.last_name || '';
  var role = u.role || 'customer';
  var pts = Number(u.points);
  if (!Number.isFinite(pts)) pts = 0;
  const tier = STN.LOYALTY_TIERS.find(t => pts >= t.min && pts <= t.max) || STN.LOYALTY_TIERS[0];
  const nextTier = STN.LOYALTY_TIERS[STN.LOYALTY_TIERS.indexOf(tier) + 1];
  const progress = nextTier ? ((pts - tier.min) / (nextTier.min - tier.min)) * 100 : 100;
  var shopLine =
    role === 'vendor'
      ? '<div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.35rem">Seller · ' +
        (u.shop_name || u.shopName || 'Shop') +
        '</div>'
      : '';
  var navBtns =
    role === 'vendor'
      ? '<button class="btn btn-ghost btn-sm" onclick="showPage(\'vendor\')">Seller hub</button>'
      : '<button class="btn btn-ghost btn-sm" onclick="showPage(\'track\')">My Orders</button>\n          <button class="btn btn-ghost btn-sm" onclick="showPage(\'wishlist\')">Wishlist (' +
        State.wishlist.length +
        ')</button>';
  const page = document.getElementById('page-account');
  if (!page) return;
  page.innerHTML = `
  <div class="s">
    <div class="s-header reveal">
      <span class="eyebrow">My Account</span>
      <h1 class="display" style="font-size:3rem">Hello, <em class="gold-text">${fn || 'there'}!</em></h1>
      <div class="divider center"></div>
    </div>
    <div class="grid-2" style="gap:2rem;margin-bottom:3rem">
      <div class="glass-lg reveal" style="padding:2rem">
        <div style="display:flex;align-items:center;gap:1.2rem;margin-bottom:1.5rem">
          <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--purple-mid),var(--purple-glow));border:2px solid rgba(124,58,237,0.3);display:flex;align-items:center;justify-content:center;font-size:1.8rem">${u.avatar || '👤'}</div>
          <div>
            <div style="font-size:1.1rem;color:var(--champagne);font-weight:500">${fn} ${ln}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${u.email || ''}</div>
            <div style="font-size:0.7rem;color:var(--gold);margin-top:0.2rem">${u.wilaya || '—'} · ${u.delegation || '—'}</div>
            ${shopLine}
          </div>
        </div>
        <div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-bottom:1rem">
          ${navBtns}
        </div>
        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;padding-top:1rem;border-top:1px solid rgba(124,58,237,0.12)">
          <button type="button" class="btn btn-danger btn-sm" onclick="logout()">Log out</button>
          <button type="button" class="btn btn-ghost btn-sm" style="border-color:rgba(220,38,38,0.45);color:#b91c1c" onclick="deleteMyAccount()">Delete account</button>
        </div>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:0.75rem 0 0;max-width:28rem">Deleting removes your profile from Everest (or hides it if the server only allows a soft delete). You can register again with the same email only if the database allows it.</p>
      </div>
      <div class="glass-lg reveal" style="padding:2rem;border-color:rgba(${tier.color},0.3)">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <div style="font-size:2rem">🏆</div>
          <div>
            <div style="font-size:0.65rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-muted)">Loyalty Status</div>
            <div style="font-size:1.4rem;font-family:var(--font-display);color:var(--champagne)">${tier.name} <em class="gold-text">Member</em></div>
          </div>
        </div>
        <div style="font-size:1.8rem;font-family:var(--font-display);color:var(--champagne);margin-bottom:0.3rem">${pts.toLocaleString()} <span style="font-size:1rem;color:var(--text-muted)">points</span></div>
        ${nextTier ? `
        <div style="background:var(--bg-1,#f8f7ff);border-radius:4px;height:6px;margin:0.8rem 0;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--gold),var(--champagne));border-radius:4px;transition:width 1s"></div>
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${(nextTier.min - pts).toLocaleString()} points to ${nextTier.name}</div>` : '<div style="font-size:0.72rem;color:var(--success)">✦ Maximum tier reached!</div>'}
      </div>
    </div>
  </div>`;
}

// ── ADMIN ──
/** Merge demo/local users with Supabase so admin can verify drivers who registered online. */
function _remoteUserRowForAdminMerge(r) {
  var o = Object.assign({}, r);
  delete o.password;
  if (r.first_name != null && r.first_name !== '') o.firstName = r.first_name;
  if (r.last_name != null && r.last_name !== '') o.lastName = r.last_name;
  if (r.is_verified != null) o.is_verified = !!r.is_verified;
  if (r.verified != null) o.verified = !!r.verified;
  return o;
}

function _stnAdminRemovedUserIdsGet() {
  try {
    var arr = STN.DB.get('admin_removed_user_ids');
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function _stnAdminRemovedUserIdRemember(userId) {
  var s = String(userId);
  var arr = _stnAdminRemovedUserIdsGet();
  if (arr.indexOf(s) === -1) {
    arr.push(s);
    STN.DB.set('admin_removed_user_ids', arr);
  }
}

function _stnAdminRemovedUserIdForget(userId) {
  var s = String(userId);
  var arr = _stnAdminRemovedUserIdsGet().filter(function (x) {
    return String(x) !== s;
  });
  STN.DB.set('admin_removed_user_ids', arr);
}

function _stnFilterRemovedUserIdsFromList(list) {
  var removed = new Set(_stnAdminRemovedUserIdsGet().map(String));
  return (Array.isArray(list) ? list : []).filter(function (u) {
    return u == null || u.id == null || !removed.has(String(u.id));
  });
}

async function mergeLocalAndRemoteUsersForAdmin() {
  var local = STN.DB.get('users') || [];
  if (typeof SB === 'undefined' || typeof SB.getUsers !== 'function') {
    return _stnFilterRemovedUserIdsFromList(local.slice());
  }
  try {
    var remote = await SB.getUsers(500);
    if (!remote || !remote.length) return _stnFilterRemovedUserIdsFromList(local.slice());
    var byId = new Map();
    local.forEach(function (u) {
      byId.set(String(u.id), Object.assign({}, u));
    });
    remote.forEach(function (r) {
      if (!r || r.id == null) return;
      var id = String(r.id);
      if (r.deleted_at != null && String(r.deleted_at).trim() !== '') {
        byId.delete(id);
        return;
      }
      _stnAdminRemovedUserIdForget(r.id);
      var ex = byId.get(id);
      var full = _remoteUserRowForAdminMerge(r);
      if (!ex) {
        byId.set(id, full);
        return;
      }
      var emLocal = String(ex.email || '').toLowerCase();
      var emRemote = String(r.email || '').toLowerCase();
      if (emLocal === emRemote) {
        Object.assign(ex, full);
      } else {
        // Demo seed id (e.g. 3) collided with next Supabase serial — keep server row only
        byId.set(id, full);
      }
    });
    return _stnFilterRemovedUserIdsFromList(Array.from(byId.values()));
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('admin.mergeUsers', e && e.message);
    return _stnFilterRemovedUserIdsFromList(local.slice());
  }
}

function _admDriverInfoCell(label, val) {
  var v = val == null || String(val).trim() === '' ? '—' : String(val);
  return (
    '<div><span style="display:block;font-size:0.62rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.25rem">' +
    _detailEscapeHtml(label) +
    '</span><span style="font-size:0.84rem;color:#0f172a;font-weight:500">' +
    _detailEscapeHtml(v) +
    '</span></div>'
  );
}

/** Thumbnail + link for CIN / licence URLs (http(s) or data:image). */
function _admDriverDocPreview(url, title) {
  var u = (url || '').toString().trim();
  if (!u) {
    return (
      '<div style="min-height:160px;border:2px dashed #e2e8f0;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:0.82rem;text-align:center;padding:1.25rem;background:#f8fafc">' +
      _detailEscapeHtml('No ' + title + ' uploaded') +
      '</div>'
    );
  }
  var href = _cardEscapeAttr(u);
  return (
    '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:0.65rem">' +
    '<a href="' +
    href +
    '" target="_blank" rel="noopener noreferrer" style="display:block;line-height:0">' +
    '<img src="' +
    href +
    '" alt="' +
    _cardEscapeAttr(title) +
    '" loading="lazy" decoding="async" style="width:100%;max-height:220px;object-fit:contain;border-radius:10px;background:#fff"/></a>' +
    '<p style="font-size:0.68rem;color:#64748b;margin:0.5rem 0 0;text-align:center">' +
    '<a href="' +
    href +
    '" target="_blank" rel="noopener" style="color:#0369a1;font-weight:600">Open full image</a></p></div>'
  );
}

function dashOrderTimestamp(order) {
  var t = order.created_at || order.createdAt;
  if (!t) return null;
  var ms = new Date(t).getTime();
  return isNaN(ms) ? null : ms;
}

function dashOrderTotal(order) {
  var n = Number(order.total != null ? order.total : order.amount);
  return isNaN(n) ? 0 : n;
}

function dashOrderBelongsToVendor(order, vendorId) {
  var v = order.vendor_id != null ? order.vendor_id : order.vendorId;
  return v != null && String(v) === String(vendorId);
}

function dashSumRevenue(orders) {
  return orders.reduce(function (s, o) {
    return s + dashOrderTotal(o);
  }, 0);
}

function dashDailyRevenueSeries(orders, numDays) {
  var series = [];
  var now = new Date();
  for (var i = numDays - 1; i >= 0; i--) {
    var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
    var next = new Date(day.getTime() + 86400000);
    var sum = orders.reduce(function (s, o) {
      var ts = dashOrderTimestamp(o);
      if (ts == null) return s;
      if (ts >= day.getTime() && ts < next.getTime()) return s + dashOrderTotal(o);
      return s;
    }, 0);
    series.push(sum);
  }
  return series;
}

function dashAnalyticsForOrders(orders, periodDays) {
  periodDays = periodDays || 7;
  var now = Date.now();
  var dayMs = 86400000;
  var curStart = now - periodDays * dayMs;
  var prevStart = curStart - periodDays * dayMs;
  var cur = orders.filter(function (o) {
    var ts = dashOrderTimestamp(o);
    return ts != null && ts >= curStart && ts <= now;
  });
  var prev = orders.filter(function (o) {
    var ts = dashOrderTimestamp(o);
    return ts != null && ts >= prevStart && ts < curStart;
  });
  return {
    revenueAll: dashSumRevenue(orders),
    revenuePeriod: dashSumRevenue(cur),
    revenuePrev: dashSumRevenue(prev),
    ordersPeriod: cur.length,
    ordersPrev: prev.length,
    daily: dashDailyRevenueSeries(orders, periodDays),
    aovPeriod: cur.length ? dashSumRevenue(cur) / cur.length : 0,
    aovPrev: prev.length ? dashSumRevenue(prev) / prev.length : 0,
  };
}

function dashPctChange(prev, cur) {
  if (prev <= 0 && cur <= 0) return 0;
  if (prev <= 0) return 100;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

function dashDeltaClass(pct) {
  if (pct > 0.05) return 'up';
  if (pct < -0.05) return 'down';
  return 'flat';
}

function dashFormatDelta(pct, labelUp, labelDown) {
  var cls = dashDeltaClass(pct);
  if (cls === 'flat') return { html: '<span class="dash-pro-stat-delta flat">vs prior week · flat</span>', cls: cls };
  var arrow = pct > 0 ? '↑' : '↓';
  var txt = pct > 0 ? labelUp : labelDown;
  return {
    html:
      '<span class="dash-pro-stat-delta ' +
      cls +
      '">' +
      arrow +
      ' ' +
      Math.abs(pct) +
      '% ' +
      txt +
      '</span>',
    cls: cls,
  };
}

/** Only show % change when prior week has a real baseline (avoids fake +100% from zero). */
function dashHonestRevenueDeltaHtml(analytics) {
  if (analytics.ordersPeriod === 0 && analytics.revenuePeriod === 0) {
    return '<span class="dash-pro-stat-delta flat">No dated orders in the last 7 days</span>';
  }
  if (analytics.ordersPrev === 0 && analytics.revenuePrev === 0) {
    return '<span class="dash-pro-stat-delta flat">No dated sales in the week before — % not shown</span>';
  }
  var pct = dashPctChange(analytics.revenuePrev, analytics.revenuePeriod);
  return dashFormatDelta(pct, 'vs prior week', 'vs prior week').html;
}

function dashHonestOrdersDeltaHtml(analytics) {
  if (analytics.ordersPeriod === 0) {
    return '<span class="dash-pro-stat-delta flat">No dated orders in the last 7 days</span>';
  }
  if (analytics.ordersPrev === 0) {
    return '<span class="dash-pro-stat-delta flat">Prior week: 0 dated orders</span>';
  }
  var pct = dashPctChange(analytics.ordersPrev, analytics.ordersPeriod);
  return dashFormatDelta(pct, 'vs prior week', 'vs prior week').html;
}

function dashHonestAovDeltaHtml(analytics) {
  if (analytics.ordersPeriod === 0) {
    return '<span class="dash-pro-stat-delta flat">No orders this week</span>';
  }
  if (analytics.ordersPrev === 0) {
    return '<span class="dash-pro-stat-delta flat">Prior week had no orders (AOV N/A)</span>';
  }
  var pct = dashPctChange(analytics.aovPrev, analytics.aovPeriod);
  return dashFormatDelta(pct, 'vs prior week AOV', 'vs prior week AOV').html;
}

function dashHonestMiniRevPhrase(analytics) {
  if (analytics.ordersPeriod === 0 && analytics.revenuePeriod === 0) return 'No dated activity this week';
  if (analytics.ordersPrev === 0 && analytics.revenuePrev === 0) return 'No prior-week baseline — % hidden';
  var pct = dashPctChange(analytics.revenuePrev, analytics.revenuePeriod);
  if (Math.abs(pct) < 0.05) return 'Flat vs prior week';
  return (pct > 0 ? '↑ ' : '↓ ') + Math.abs(pct) + '% vs prior week';
}

function dashHonestMiniOrdPhrase(analytics) {
  if (analytics.ordersPeriod === 0) return 'No dated orders this week';
  if (analytics.ordersPrev === 0) return 'Prior week: 0 dated orders';
  var pct = dashPctChange(analytics.ordersPrev, analytics.ordersPeriod);
  if (Math.abs(pct) < 0.05) return 'Flat vs prior week';
  return (pct > 0 ? '↑ ' : '↓ ') + Math.abs(pct) + '% vs prior week';
}

function dashSparklineBars(values, width, height) {
  width = width || 320;
  height = height || 72;
  var gid = 'dashGrad-' + Math.random().toString(36).slice(2, 11);
  var max = Math.max.apply(null, values.concat([1]));
  var n = values.length;
  var slot = width / n;
  var pad = slot * 0.18;
  var bw = Math.max(2, slot - pad * 2);
  var rects = [];
  for (var i = 0; i < n; i++) {
    var v = values[i];
    var bh = Math.max(3, (v / max) * (height - 14));
    var x = i * slot + pad;
    var y = height - 7 - bh;
    rects.push(
      '<rect x="' +
        x.toFixed(2) +
        '" y="' +
        y.toFixed(2) +
        '" width="' +
        bw.toFixed(2) +
        '" height="' +
        bh.toFixed(2) +
        '" rx="4" fill="url(#' +
        gid +
        ')"/>'
    );
  }
  return (
    '<svg class="dash-pro-spark-svg" width="100%" height="' +
    height +
    '" viewBox="0 0 ' +
    width +
    ' ' +
    height +
    '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="' +
    gid +
    '" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#9b72f0"/></linearGradient></defs>' +
    rects.join('') +
    '</svg>'
  );
}

function dashTopProductLines(orders, limit) {
  var map = {};
  orders.forEach(function (o) {
    var items = o.items;
    if (!Array.isArray(items)) return;
    items.forEach(function (it) {
      var name = String(it.name || 'Item').trim().substring(0, 56) || 'Item';
      var qty = Number(it.qty != null ? it.qty : it.quantity) || 1;
      map[name] = (map[name] || 0) + qty;
    });
  });
  return Object.keys(map)
    .map(function (k) {
      return { name: k, qty: map[k] };
    })
    .sort(function (a, b) {
      return b.qty - a.qty;
    })
    .slice(0, limit || 5);
}

function dashTopWilayas(orders, limit) {
  var map = {};
  orders.forEach(function (o) {
    var w = (o.wilaya && String(o.wilaya).trim()) || 'Unknown';
    map[w] = (map[w] || 0) + 1;
  });
  return Object.keys(map)
    .map(function (k) {
      return { name: k, count: map[k] };
    })
    .sort(function (a, b) {
      return b.count - a.count;
    })
    .slice(0, limit || 6);
}

function dashTopVendors(orders, users, limit) {
  var map = {};
  orders.forEach(function (o) {
    var vid = o.vendor_id != null ? o.vendor_id : o.vendorId;
    if (vid == null || vid === '') return;
    var key = String(vid);
    map[key] = (map[key] || 0) + dashOrderTotal(o);
  });
  return Object.keys(map)
    .map(function (id) {
      var u = (users || []).find(function (x) {
        return String(x.id) === id;
      });
      var name = u
        ? String(u.shop_name || u.shopName || u.first_name || u.firstName || 'Vendor').substring(0, 40)
        : 'Vendor #' + id;
      return { id: id, name: name, revenue: map[id] };
    })
    .sort(function (a, b) {
      return b.revenue - a.revenue;
    })
    .slice(0, limit || 5);
}

function dashFulfillmentStats(orders) {
  var delivered = 0;
  var canceled = 0;
  orders.forEach(function (o) {
    var s = String(o.status || '').toLowerCase().replace(/-/g, '_');
    if (s === 'cancelled' || s === 'canceled') canceled++;
    else if (s === 'delivered') delivered++;
  });
  var open = orders.length - canceled;
  return {
    delivered: delivered,
    canceled: canceled,
    rate: open > 0 ? Math.round((delivered / open) * 1000) / 10 : 0,
  };
}

function dashStatusFunnel(orders) {
  var c = { pending: 0, processing: 0, transit: 0, delivered: 0, canceled: 0 };
  orders.forEach(function (o) {
    var s = String(o.status || 'pending')
      .toLowerCase()
      .replace(/-/g, '_');
    if (s === 'cancelled' || s === 'canceled') c.canceled++;
    else if (s === 'delivered') c.delivered++;
    else if (s === 'shipped' || s === 'out_for_delivery' || s === 'transit') c.transit++;
    else if (s === 'processing' || s === 'ready') c.processing++;
    else c.pending++;
  });
  return c;
}

function _dashEscapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function buildAdminOverviewHTML(orders, users, products) {
  var vendors = users.filter(function (u) {
    return u.role === 'vendor';
  });
  var drivers = users.filter(function (u) {
    return u.role === 'driver';
  });
  var shoppers = users.filter(function (u) {
    var r = u.role || 'customer';
    return r === 'customer' || r === 'user';
  });
  var analytics = dashAnalyticsForOrders(orders, 7);
  var fulfil = dashFulfillmentStats(orders);
  var funnel = dashStatusFunnel(orders);
  var topV = dashTopVendors(orders, users, 5);
  var topP = dashTopProductLines(orders, 5);
  var wilayas = dashTopWilayas(orders, 6);
  var pendingVendor = vendors.filter(function (v) {
    return !v.verified;
  }).length;
  var verifiedDrivers = drivers.filter(function (d) {
    return typeof isDriverVerified === 'function' && isDriverVerified(d);
  }).length;
  var inFlight = funnel.pending + funnel.processing + funnel.transit;
  var stockLow = (products || []).filter(function (p) {
    return (p.stock || 0) < 5;
  }).length;

  var kpi = [
    {
      label: 'Gross sales (all time)',
      value: analytics.revenueAll.toLocaleString() + ' TND',
      delta:
        '<span class="dash-pro-stat-delta flat">' +
        orders.length +
        ' orders · lifetime GMV</span>',
    },
    {
      label: 'Last 7 days revenue',
      value: analytics.revenuePeriod.toLocaleString() + ' TND',
      delta: dashHonestRevenueDeltaHtml(analytics),
    },
    {
      label: 'Orders (7d)',
      value: String(analytics.ordersPeriod),
      delta: dashHonestOrdersDeltaHtml(analytics),
    },
    {
      label: 'Avg order value (7d)',
      value: Math.round(analytics.aovPeriod).toLocaleString() + ' TND',
      delta: dashHonestAovDeltaHtml(analytics),
    },
    {
      label: 'Active catalog',
      value: String((products || []).length),
      delta:
        '<span class="dash-pro-stat-delta flat">' +
        stockLow +
        ' SKUs low stock</span>',
    },
    {
      label: 'Fulfillment rate',
      value: fulfil.rate + '%',
      delta:
        '<span class="dash-pro-stat-delta flat">' +
        fulfil.delivered +
        ' delivered · ' +
        fulfil.canceled +
        ' canceled</span>',
    },
  ];

  var kpiHtml = kpi
    .map(function (k) {
      return (
        '<div class="dash-pro-stat"><div class="dash-pro-stat-label">' +
        k.label +
        '</div><div class="dash-pro-stat-value dash-pro-mono">' +
        k.value +
        '</div>' +
        k.delta +
        '</div>'
      );
    })
    .join('');

  var funnelRows = [
    { key: 'pending', label: 'Awaiting action', n: funnel.pending, color: '#fbbf24' },
    { key: 'processing', label: 'Processing', n: funnel.processing, color: '#60a5fa' },
    { key: 'transit', label: 'In transit', n: funnel.transit, color: '#a78bfa' },
    { key: 'delivered', label: 'Delivered', n: funnel.delivered, color: '#1db954' },
    { key: 'canceled', label: 'Canceled', n: funnel.canceled, color: '#f87171' },
  ]
    .map(function (r) {
      return (
        '<div class="dash-pro-list-row"><div class="dash-pro-list-name" style="display:flex;align-items:center;gap:0.5rem"><span style="width:8px;height:8px;border-radius:50%;background:' +
        r.color +
        '"></span>' +
        r.label +
        '</div><span class="dash-pro-list-meta dash-pro-mono">' +
        r.n +
        '</span></div>'
      );
    })
    .join('');

  var topVHtml =
    topV.length === 0
      ? '<p style="padding:0.5rem 0;color:#7b72a8;font-size:0.8rem">No vendor-attributed orders in the loaded data yet.</p>'
      : topV
          .map(function (v) {
            return (
              '<div class="dash-pro-list-row"><span class="dash-pro-list-name">' +
              _dashEscapeHtml(v.name) +
              '</span><span class="dash-pro-list-meta dash-pro-mono">' +
              v.revenue.toLocaleString() +
              ' TND</span></div>'
            );
          })
          .join('');

  var topPHtml =
    topP.length === 0
      ? '<p style="padding:0.5rem 0;color:#7b72a8;font-size:0.8rem">Top SKUs appear when order rows include line items with product names.</p>'
      : topP
          .map(function (p) {
            return (
              '<div class="dash-pro-list-row"><span class="dash-pro-list-name">' +
              _dashEscapeHtml(p.name) +
              '</span><span class="dash-pro-list-meta dash-pro-mono">' +
              p.qty +
              ' units</span></div>'
            );
          })
          .join('');

  var wilayaHtml = wilayas
    .map(function (w) {
      return (
        '<div class="dash-pro-list-row"><span class="dash-pro-list-name">' +
        _dashEscapeHtml(w.name) +
        '</span><span class="dash-pro-list-meta dash-pro-mono">' +
        w.count +
        ' orders</span></div>'
      );
    })
    .join('');

  var recentRows =
    orders.length === 0
      ? '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#7b72a8">No orders in the loaded dataset</td></tr>'
      : orders
          .slice(-8)
          .reverse()
          .map(function (o) {
      var st = String(o.status || 'pending').toLowerCase();
      var stColor =
        st === 'delivered'
          ? 'rgba(5,150,105,0.12)'
          : st === 'shipped' || st === 'out_for_delivery'
          ? 'rgba(37,99,235,0.1)'
          : st === 'cancelled' || st === 'canceled'
          ? 'rgba(220,38,38,0.1)'
          : 'rgba(217,119,6,0.12)';
      var stFg =
        st === 'delivered'
          ? '#047857'
          : st === 'shipped' || st === 'out_for_delivery'
          ? '#1d4ed8'
          : st === 'cancelled' || st === 'canceled'
          ? '#b91c1c'
          : '#b45309';
      return (
        '<tr><td class="dash-pro-mono" style="color:#7c3aed;font-weight:700">' +
        _dashEscapeHtml(String(o.tracking_number || o.id || '—')) +
        '</td><td>' +
        _dashEscapeHtml(String(o.client_name || o.phone || 'Guest')) +
        '</td><td class="dash-pro-mono">' +
        dashOrderTotal(o).toLocaleString() +
        ' TND</td><td><span class="dash-pro-pill" style="background:' +
        stColor +
        ';color:' +
        stFg +
        '">' +
        _dashEscapeHtml(st) +
        '</span></td><td style="font-size:0.72rem">' +
        (o.created_at ? _dashEscapeHtml(new Date(o.created_at).toLocaleDateString()) : '—') +
        '</td></tr>'
      );
          })
          .join('');

  return (
    '<div>' +
    '<div style="margin-bottom:1.5rem">' +
    '<h1 class="dash-pro-hero-title">Marketplace overview</h1>' +
    '<p class="dash-pro-hero-sub">Figures load from Supabase (orders, users) and your live product catalog. Week-over-week % appears only when the prior week had dated orders — nothing is invented.</p>' +
    '</div>' +
    '<div class="dash-pro-kpi-grid">' +
    kpiHtml +
    '</div>' +
    '<div class="dash-pro-card" style="margin-bottom:1.25rem">' +
    '<div class="dash-pro-chart-box">' +
    '<div class="dash-pro-chart-head"><strong>Revenue trajectory</strong><span>Last 7 days · TND</span></div>' +
    dashSparklineBars(analytics.daily, 640, 80) +
    '</div></div>' +
    '<div class="dash-pro-grid-2">' +
    '<div class="dash-pro-stack">' +
    '<div class="dash-pro-card">' +
    '<div class="dash-pro-card-h"><span>Recent orders</span><button type="button" onclick="switchAdmin(\'orders\')">Open pipeline</button></div>' +
    '<div class="dash-pro-table-wrap"><table class="dash-pro-table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead><tbody>' +
    recentRows +
    '</tbody></table></div></div>' +
    '<div class="dash-pro-mini">' +
    '<div class="dash-pro-mini-tile"><span>Accounts</span><strong class="dash-pro-mono">' +
    users.length +
    '</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">' +
    shoppers.length +
    ' shoppers · ' +
    vendors.length +
    ' vendors · ' +
    drivers.length +
    ' drivers</div></div>' +
    '<div class="dash-pro-mini-tile"><span>In pipeline</span><strong class="dash-pro-mono">' +
    inFlight +
    '</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">Excludes canceled</div></div>' +
    '<div class="dash-pro-mini-tile"><span>Drivers on duty</span><strong class="dash-pro-mono">' +
    verifiedDrivers +
    '</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">Verified profiles</div></div>' +
    '<div class="dash-pro-mini-tile"><span>GMV / order</span><strong class="dash-pro-mono">' +
    (orders.length ? Math.round(analytics.revenueAll / Math.max(orders.length, 1)) : 0).toLocaleString() +
    ' TND</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">All-time average</div></div>' +
    '</div></div>' +
    '<div class="dash-pro-stack">' +
    '<div class="dash-pro-card"><div class="dash-pro-card-h"><span>Order pipeline</span><span class="dash-pro-mono" style="font-size:0.72rem;color:#7b72a8">' +
    orders.length +
    ' total</span></div><div style="padding:0 1.2rem 1rem">' +
    funnelRows +
    '</div></div>' +
    '<div class="dash-pro-card"><div class="dash-pro-card-h"><span>Top vendors by GMV</span><button type="button" onclick="switchAdmin(\'vendors\')">Manage</button></div><div style="padding:0 1.2rem 1rem">' +
    topVHtml +
    '</div></div>' +
    '<div class="dash-pro-callout">' +
    '<h4>Vendor approvals</h4>' +
    '<div class="big dash-pro-mono">' +
    pendingVendor +
    '</div>' +
    '<p style="margin:0;font-size:0.8rem;color:#7b72a8">Shops waiting for verification</p>' +
    '<button type="button" onclick="switchAdmin(\'vendors\')" style="margin-top:0.85rem;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border:none;padding:0.5rem 1.15rem;border-radius:10px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 12px rgba(124,58,237,0.25)">Review queue</button>' +
    '</div>' +
    '</div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-top:1.25rem">' +
    '<div class="dash-pro-card"><div class="dash-pro-card-h"><span>Top SKUs (units)</span></div><div style="padding:0 1.2rem 1rem">' +
    topPHtml +
    '</div></div>' +
    '<div class="dash-pro-card"><div class="dash-pro-card-h"><span>Demand by wilaya</span></div><div style="padding:0 1.2rem 1rem">' +
    wilayaHtml +
    '</div></div>' +
    '</div></div>'
  );
}

function renderAdmin() {
  if (!State.currentUser || State.currentUser.role !== 'admin') {
    toast('Admin access required', 'error'); showPage('auth'); return;
  }
  const page = document.getElementById('page-admin');
  if (!page) return;
  page.innerHTML = buildAdminHTML();
  switchAdmin('overview');
}

function buildAdminHTML() {
  var tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'logistics', label: 'Logistics' },
    { id: 'users', label: 'Customers' },
    { id: 'drivers', label: 'Drivers' },
    { id: 'vendors', label: 'Vendors' },
    { id: 'vendor-dashboard', label: 'Vendor view' },
  ];
  var tabsHTML = tabs
    .map(function (t) {
      return (
        '<button type="button" class="dash-pro-tab" id="adm-nav-' +
        t.id +
        '" onclick="switchAdmin(\'' +
        t.id +
        '\')">' +
        t.label +
        '</button>'
      );
    })
    .join('');
  return (
    '<div class="dash-pro">' +
    '<div class="dash-pro-topbar">' +
    '<div class="dash-pro-brand"><span class="dash-pro-brand-mark">●</span> Everest admin</div>' +
    '<div class="dash-pro-tabs">' +
    tabsHTML +
    '</div></div>' +
    '<div class="dash-pro-body" id="admin-content"></div>' +
    '</div>'
  );
}

async function switchAdmin(section) {
  document.querySelectorAll('.dash-pro-tab').forEach(function (el) {
    el.classList.remove('dash-pro-tab--active');
    el.classList.remove('adm-active');
  });
  var active = document.getElementById('adm-nav-' + section);
  if (active) {
    active.classList.add('dash-pro-tab--active');
    active.classList.add('adm-active');
  }

  const content = document.getElementById('admin-content');
  if (!content) return;

  var users = STN.DB.get('users') || [];
  var orders = STN.DB.get('orders') || [];

  if (section === 'overview') {
    content.innerHTML =
      '<div style="padding:2.75rem 1.5rem;text-align:center;color:#7b72a8;font-size:0.9rem">Loading orders and users from the database…</div>';
    try {
      if (typeof SB !== 'undefined' && SB.getOrders) {
        var ro = await SB.getOrders();
        if (Array.isArray(ro)) orders = ro;
      }
    } catch (e) {
      if (typeof STNLog !== 'undefined') STNLog.warn('admin.overview.getOrders', e && e.message);
    }
    try {
      users = await mergeLocalAndRemoteUsersForAdmin();
    } catch (e2) {
      if (typeof STNLog !== 'undefined') STNLog.warn('admin.overview.mergeUsers', e2 && e2.message);
    }
    var navOv = document.getElementById('adm-nav-overview');
    if (!navOv || !navOv.classList.contains('adm-active')) return;
    content.innerHTML = buildAdminOverviewHTML(orders, users, State.products || []);
    return;
  }

  try {
    if (typeof SB !== 'undefined' && SB.getOrders) {
      var rx = await SB.getOrders();
      if (Array.isArray(rx)) orders = rx;
    }
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('admin.tab.getOrders', e && e.message);
  }

  const vendors = users.filter(u => u.role === 'vendor');
  const revenue = dashSumRevenue(orders);

  if (section === 'orders') {
    try {
      users = await mergeLocalAndRemoteUsersForAdmin();
    } catch (mu) {
      if (typeof STNLog !== 'undefined') STNLog.warn('admin.orders.mergeUsers', mu && mu.message);
    }
    var driverUsers = users.filter(function (u) {
      return u.role === 'driver' && isDriverVerified(u);
    });
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:#111827">Orders</h1>
            <p style="color:#6b7280;font-size:0.875rem">${orders.length} total orders · ${revenue.toLocaleString()} TND total revenue</p>
          </div>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="background:#f9fafb">${['Tracking #','Client','Shop','Wilaya / Address','Items','Total','Status','Driver','Date','Action'].map(h=>`<th style="text-align:left;padding:0.75rem 0.875rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap">${h}</th>`).join('')}</tr></thead>
              <tbody>${orders.length===0?'<tr><td colspan="10" style="text-align:center;padding:3rem;color:#9ca3af">No orders yet</td></tr>':[...orders].reverse().map(o=>{
                var oid = o.id != null ? o.id : o.tracking_number;
                var assignedDrv = o.driver_id || o.driverId;
                var drvOpts = '<option value="">—</option>';
                if (assignedDrv && !driverUsers.some(function (d) { return String(d.id) === String(assignedDrv); })) {
                  drvOpts +=
                    '<option value="' +
                    assignedDrv +
                    '" selected>Unverified driver #' +
                    assignedDrv +
                    '</option>';
                }
                drvOpts += driverUsers
                  .map(function (d) {
                    var sel = String(assignedDrv || '') === String(d.id) ? ' selected' : '';
                    var nm = d.firstName || d.first_name || 'Driver';
                    return '<option value="' + d.id + '"' + sel + '>' + nm + ' #' + d.id + '</option>';
                  })
                  .join('');
                var sbg = orderStatusBadge(o.status || 'pending');
                return `
                <tr style="border-top:1px solid #f3f4f6" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;font-weight:600;color:#7c3aed;white-space:nowrap">${o.tracking_number||o.id||'-'}</td>
                  <td style="padding:0.75rem 0.875rem">
                    <div style="font-size:0.78rem;font-weight:600;color:#111827">${o.client_name||o.phone||'Guest'}</div>
                    <div style="font-size:0.7rem;color:#9ca3af">${o.phone||''}</div>
                  </td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;color:#374151">${o.shop_names||'Everest'}</td>
                  <td style="padding:0.75rem 0.875rem">
                    <div style="font-size:0.78rem;font-weight:600;color:#374151">${o.wilaya||'-'}</div>
                    <div style="font-size:0.7rem;color:#9ca3af;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.address||''}</div>
                  </td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;color:#374151">${Array.isArray(o.items)?o.items.map(i=>i.name||'Item').join(', ').substring(0,30)+(o.items.length>1?'...':''):'1 item'}</td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;font-weight:700;color:#111827;white-space:nowrap">${(o.total||0).toLocaleString()} TND</td>
                  <td style="padding:0.75rem 0.875rem">
                    <span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;white-space:nowrap;background:${sbg.bg};color:${sbg.fg}">
                      ${sbg.label}
                    </span>
                  </td>
                  <td style="padding:0.75rem 0.5rem;vertical-align:top">
                    <select id="adm-drv-${oid}" style="font-size:0.68rem;max-width:118px;padding:0.2rem;border-radius:6px;border:1px solid #e5e7eb">${drvOpts}</select>
                    <button type="button" onclick="assignOrderDriver('${oid}', document.getElementById('adm-drv-${oid}').value)" style="display:block;margin-top:0.35rem;background:#e0f2fe;color:#0369a1;border:none;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.65rem;cursor:pointer;font-weight:600">Assign</button>
                    <button type="button" onclick="autoAssignOrderDriver('${oid}')" style="display:block;margin-top:0.3rem;background:#ede9fe;color:#6d28d9;border:none;padding:0.2rem 0.5rem;border-radius:6px;font-size:0.65rem;cursor:pointer;font-weight:700">Auto</button>
                  </td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.72rem;color:#9ca3af;white-space:nowrap">${o.created_at?new Date(o.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Today'}</td>
                  <td style="padding:0.75rem 0.875rem">
                    <button onclick="advanceOrder('${oid}')" style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.72rem;cursor:pointer;font-weight:600;white-space:nowrap">Advance →</button>
                  </td>
                </tr>`;
              }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

  } else if (section === 'products') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:#111827">Products</h1>
            <p style="color:#6b7280;font-size:0.875rem">${State.products.length} products listed</p>
          </div>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="background:#f9fafb">${['Product','Category','Price','Stock','Rating','Status','Action'].map(h=>`<th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${h}</th>`).join('')}</tr></thead>
              <tbody>${State.products.map(p=>`
                <tr style="border-top:1px solid #f3f4f6" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                  <td style="padding:0.875rem 1rem">
                    <div style="display:flex;align-items:center;gap:0.75rem">
                      <div style="width:36px;height:36px;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">${p.emoji}</div>
                      <div><div style="font-size:0.82rem;font-weight:600;color:#111827">${p.name}</div><div style="font-size:0.72rem;color:#9ca3af">${p.brand}</div></div>
                    </div>
                  </td>
                  <td style="padding:0.875rem 1rem;font-size:0.8rem;color:#374151;text-transform:capitalize">${p.cat}</td>
                  <td style="padding:0.875rem 1rem;font-size:0.8rem;font-weight:600;color:#111827">${p.price.toLocaleString()} TND</td>
                  <td style="padding:0.875rem 1rem;font-size:0.8rem"><span style="color:${p.stock>5?'#059669':'#dc2626'};font-weight:600">${p.stock}</span></td>
                  <td style="padding:0.875rem 1rem;font-size:0.8rem;color:#f59e0b;font-weight:600">★ ${p.rating}</td>
                  <td style="padding:0.875rem 1rem"><span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:${p.verified?'#dcfce7':'#fef9c3'};color:${p.verified?'#166534':'#92400e'}">${p.verified?'✓ Live':'⏳ Pending'}</span></td>
                  <td style="padding:0.875rem 1rem"><button onclick='openProductDetail(${JSON.stringify(p.id)})' style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.3rem 0.8rem;border-radius:6px;font-size:0.75rem;cursor:pointer">View</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

  } else if (section === 'users') {
    content.innerHTML =
      '<p style="padding:2rem;text-align:center;color:#64748b;font-size:0.9rem">Loading users…</p>';
    mergeLocalAndRemoteUsersForAdmin().then(function (mergedUsers) {
      var pane = document.getElementById('admin-content');
      var navU = document.getElementById('adm-nav-users');
      if (!pane || !navU || !navU.classList.contains('adm-active')) return;
      var users = mergedUsers;
      var userRows = users.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#9ca3af">No users yet</td></tr>'
      : users.map(function(u) {
          var isBanned = u.banned;
          var isTimedOut = u.timeout_until && new Date(u.timeout_until) > new Date();
          var timeoutLeft = isTimedOut ? Math.ceil((new Date(u.timeout_until)-new Date())/3600000)+'h left' : '';
          var statusBadge = isBanned
            ? '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#fee2e2;color:#dc2626">&#128683; Banned</span>'
            : isTimedOut
            ? '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#fef3c7;color:#d97706">&#9203; '+timeoutLeft+'</span>'
            : '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#dcfce7;color:#166534">&#10003; Active</span>';
          var roleColor = u.role==='admin'?'#92400e':u.role==='vendor'?'#6d28d9':u.role==='driver'?'#0369a1':'#374151';
          var roleBg = u.role==='admin'?'#fef3c7':u.role==='vendor'?'#ede9fe':u.role==='driver'?'#e0f2fe':'#f3f4f6';
          var cinL = u.cin_document_url || '';
          var licL = u.license_document_url || '';
          var docLinks =
            u.role === 'driver'
              ? '<div style="font-size:0.65rem;margin-bottom:0.4rem;line-height:1.45;max-width:200px">' +
                (cinL
                  ? '<a href="' +
                    String(cinL).replace(/"/g, '%22') +
                    '" target="_blank" rel="noopener" style="color:#0369a1;font-weight:600">CIN</a>'
                  : '<span style="color:#9ca3af">No CIN</span>') +
                ' · ' +
                (licL
                  ? '<a href="' +
                    String(licL).replace(/"/g, '%22') +
                    '" target="_blank" rel="noopener" style="color:#0369a1;font-weight:600">Permis</a>'
                  : '<span style="color:#9ca3af">No licence</span>') +
                (u.id_card_number ? '<br/><span style="color:#64748b">CIN: ' + String(u.id_card_number).replace(/</g, '') + '</span>' : '') +
                '</div>'
              : '';
          var driverEscId = _cardEscapeAttr(String(u.id));
          var driverVerifyBtn =
            u.role === 'driver' && !isDriverVerified(u)
              ? '<button type="button" data-stn-verify-driver="' +
                driverEscId +
                '" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:0.25rem 0.55rem;border-radius:6px;font-size:0.68rem;cursor:pointer;font-weight:600;margin-bottom:0.35rem;display:inline-block">Verify driver</button><br/>'
              : u.role === 'driver' && isDriverVerified(u)
              ? '<span style="font-size:0.65rem;color:#059669;font-weight:600;display:inline-block;margin-bottom:0.35rem">Verified</span><br/>'
              : '';
          var actions = u.role === 'admin' ? '<span style="color:#9ca3af;font-size:0.72rem">Admin</span>' : (
            docLinks + driverVerifyBtn +
            (isBanned
              ? '<button data-action="unban" data-id="'+u.id+'" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;font-weight:600">Unban</button>'
              : '<button data-action="timeout" data-id="'+u.id+'" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;font-weight:600;margin-right:0.3rem">&#9203; Timeout</button><button data-action="ban" data-id="'+u.id+'" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;font-weight:600">&#128683; Ban</button>') +
            '<div style="margin-top:0.5rem"><button type="button" data-action="delete-account" data-id="'+u.id+'" style="background:#0f172a;color:#fff;border:none;padding:0.3rem 0.65rem;border-radius:6px;font-size:0.66rem;cursor:pointer;font-weight:700">Delete account</button></div>'
          );
          return '<tr style="border-top:1px solid #f3f4f6'+(isBanned?';background:#fff5f5':'')+'">' +
            '<td style="padding:0.75rem 1rem"><div style="display:flex;align-items:center;gap:0.75rem"><div style="width:32px;height:32px;border-radius:50%;background:'+(isBanned?'#ef4444':'linear-gradient(135deg,#7c3aed,#9b72f0)')+';display:flex;align-items:center;justify-content:center;color:white;font-size:0.8rem;font-weight:700">'+((u.first_name||u.firstName||'?')[0].toUpperCase())+'</div><div><div style="font-size:0.82rem;font-weight:600;color:'+(isBanned?'#ef4444':'#111827')+'">'+(u.first_name||u.firstName||'')+' '+(u.last_name||u.lastName||'')+(isBanned?' &#128683;':'')+'</div>'+(isTimedOut?'<div style="font-size:0.68rem;color:#f59e0b">&#9203; '+timeoutLeft+'</div>':'')+'</div></div></td>' +
            '<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#6b7280">'+u.email+'</td>' +
            '<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#374151">'+(u.wilaya||'-')+'</td>' +
            '<td style="padding:0.75rem 1rem"><span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:'+roleBg+';color:'+roleColor+';text-transform:capitalize">'+(u.role||'customer')+'</span></td>' +
            '<td style="padding:0.75rem 1rem;font-size:0.78rem;font-weight:600;color:#7c3aed">'+((u.points||0).toLocaleString())+'</td>' +
            '<td style="padding:0.75rem 1rem">'+statusBadge+'</td>' +
            '<td style="padding:0.75rem 1rem">'+actions+'</td>' +
            '</tr>';
        }).join('');
      pane.innerHTML =
        '<div><div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;font-weight:700;color:#111827">Customers</h1><p style="color:#6b7280;font-size:0.875rem">' +
        users.length +
        ' users (incl. drivers) &middot; ' +
        users.filter(function (u) {
          return u.banned;
        }).length +
        ' banned · Use <strong>Verify driver</strong> to approve delivery partners, or <strong>Ban</strong> to block.</p></div><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb"><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Customer</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Email</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Wilaya</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Role</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Points</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Actions</th></tr></thead><tbody>' +
        userRows +
        '</tbody></table></div></div></div>';
      var tbl = pane.querySelector('table');
      if (tbl)
        tbl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-action]');
          if (!btn) return;
          var id = btn.dataset.id;
          if (btn.dataset.action === 'ban') banUser(id);
          else if (btn.dataset.action === 'timeout') timeoutUser(id);
          else if (btn.dataset.action === 'unban') unbanUser(id);
          else if (btn.dataset.action === 'delete-account') adminDeleteUserAccount(id);
        });
    });
  } else if (section === 'drivers') {
    content.innerHTML =
      '<p style="padding:2rem;text-align:center;color:#64748b;font-size:0.9rem">Loading delivery partners…</p>';
    mergeLocalAndRemoteUsersForAdmin().then(function (merged) {
      var pane = document.getElementById('admin-content');
      var navD = document.getElementById('adm-nav-drivers');
      if (!pane || !navD || !navD.classList.contains('adm-active')) return;
      var drivers = merged.filter(function (u) {
        return u.role === 'driver';
      });
      var pendingCount = drivers.filter(function (u) {
        return !isDriverVerified(u) && !u.banned;
      }).length;
      var cards =
        drivers.length === 0
          ? '<div style="text-align:center;padding:3.5rem 1.5rem;background:white;border:1px solid #e5e7eb;border-radius:16px;color:#64748b;font-size:0.95rem">No delivery partners yet. They appear here after signing up as <strong>Delivery partner</strong>.</div>'
          : drivers
              .map(function (d) {
                var fn = d.first_name || d.firstName || '';
                var ln = d.last_name || d.lastName || '';
                var verified = isDriverVerified(d);
                var isBanned = !!d.banned;
                var cinU = (d.cin_document_url || '').toString().trim();
                var licU = (d.license_document_url || '').toString().trim();
                var plate = d.vehicle_plate_number || d.vehiclePlateNumber || '';
                var vmodel = d.vehicle_model || d.vehicleModel || '';
                var vcolor = d.vehicle_color || d.vehicleColor || '';
                var idAttr = _cardEscapeAttr(String(d.id));
                var actions = '';
                if (!isBanned) {
                  if (!verified) {
                    actions +=
                      '<button type="button" data-stn-verify-driver="' +
                      idAttr +
                      '" style="background:linear-gradient(135deg,#059669,#10b981);color:white;border:none;padding:0.55rem 1.25rem;border-radius:10px;font-size:0.82rem;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(5,150,105,0.35)">✓ Approve driver</button>';
                  }
                  actions +=
                    '<button type="button" data-adm-drv-ban="' +
                    idAttr +
                    '" style="background:#fff1f2;color:#b91c1c;border:1px solid #fecaca;padding:0.55rem 1.1rem;border-radius:10px;font-size:0.82rem;font-weight:600;cursor:pointer">Reject (ban)</button>' +
                    '<button type="button" data-adm-drv-timeout="' +
                    idAttr +
                    '" style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;padding:0.55rem 1.1rem;border-radius:10px;font-size:0.82rem;font-weight:600;cursor:pointer">Timeout</button>';
                } else {
                  actions +=
                    '<button type="button" data-adm-drv-unban="' +
                    idAttr +
                    '" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:0.55rem 1.1rem;border-radius:10px;font-size:0.82rem;font-weight:600;cursor:pointer">Unban</button>';
                }
                actions +=
                  '<button type="button" data-adm-drv-delete="' +
                  idAttr +
                  '" style="background:#0f172a;color:#fff;border:none;padding:0.55rem 1.1rem;border-radius:10px;font-size:0.82rem;font-weight:700;cursor:pointer">Delete account</button>';
                var statusPill = isBanned
                  ? '<span style="display:inline-block;background:#fee2e2;color:#991b1b;padding:0.4rem 0.85rem;border-radius:999px;font-size:0.75rem;font-weight:700">Banned</span>'
                  : verified
                  ? '<span style="display:inline-block;background:#dcfce7;color:#166534;padding:0.4rem 0.85rem;border-radius:999px;font-size:0.75rem;font-weight:700">✓ Approved</span>'
                  : '<span style="display:inline-block;background:#fef3c7;color:#b45309;padding:0.4rem 0.85rem;border-radius:999px;font-size:0.75rem;font-weight:700">⏳ Pending your review</span>';
                var banNote =
                  isBanned && (d.ban_reason || '').toString().trim()
                    ? '<p style="margin:0.65rem 0 0;font-size:0.8rem;color:#7f1d1d;line-height:1.45;max-width:42rem"><strong>Rejection note (driver sees this):</strong> ' +
                      _detailEscapeHtml(String(d.ban_reason).trim()) +
                      '</p>'
                    : '';
                return (
                  '<div class="adm-driver-card" style="background:white;border:1px solid #e5e7eb;border-radius:18px;padding:1.5rem 1.5rem 1.35rem;box-shadow:0 4px 20px rgba(15,23,42,0.06)">' +
                  '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #f1f5f9">' +
                  '<div style="min-width:0;flex:1">' +
                  '<h2 style="margin:0;font-size:1.2rem;font-weight:700;color:#0f172a;letter-spacing:-0.02em">' +
                  _detailEscapeHtml((fn + ' ' + ln).trim() || 'Driver') +
                  '</h2>' +
                  '<p style="margin:0.4rem 0 0;font-size:0.85rem;color:#64748b;word-break:break-all">' +
                  _detailEscapeHtml(d.email || '') +
                  '</p>' +
                  '<p style="margin:0.35rem 0 0;font-size:0.72rem;color:#94a3b8">User ID: ' +
                  _detailEscapeHtml(String(d.id)) +
                  '</p>' +
                  banNote +
                  '</div>' +
                  '<div style="flex-shrink:0">' +
                  statusPill +
                  '</div></div>' +
                  '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem 1.25rem;margin-bottom:1.35rem">' +
                  _admDriverInfoCell('Phone', d.phone) +
                  _admDriverInfoCell('Wilaya', d.wilaya) +
                  _admDriverInfoCell('Delegation', d.delegation) +
                  _admDriverInfoCell('CIN number', d.id_card_number) +
                  _admDriverInfoCell('Vehicle plate', plate) +
                  _admDriverInfoCell('Vehicle model', vmodel) +
                  _admDriverInfoCell('Vehicle colour', vcolor) +
                  _admDriverInfoCell('Loyalty points', d.points != null ? String(d.points) : '') +
                  '</div>' +
                  '<p style="font-size:0.72rem;font-weight:700;color:#0c4a6e;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 0.65rem">Submitted documents</p>' +
                  '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-bottom:1.35rem">' +
                  '<div><p style="font-size:0.7rem;font-weight:600;color:#0369a1;margin:0 0 0.45rem">National ID (CIN)</p>' +
                  _admDriverDocPreview(cinU, 'CIN') +
                  '</div><div><p style="font-size:0.7rem;font-weight:600;color:#0369a1;margin:0 0 0.45rem">Driving licence</p>' +
                  _admDriverDocPreview(licU, 'licence') +
                  '</div></div>' +
                  '<div style="display:flex;flex-wrap:wrap;gap:0.65rem;align-items:center">' +
                  actions +
                  '</div></div>'
                );
              })
              .join('');
      pane.innerHTML =
        '<div><div style="margin-bottom:1.5rem">' +
        '<h1 style="font-size:1.55rem;font-weight:800;color:#0f172a;margin:0;letter-spacing:-0.03em">Delivery partners</h1>' +
        '<p style="color:#64748b;font-size:0.9rem;margin:0.5rem 0 0;line-height:1.5">' +
        '<strong>' +
        drivers.length +
        '</strong> driver(s) · <strong>' +
        pendingCount +
        '</strong> waiting for approval. Review photos below, then <strong>Approve</strong> or <strong>Reject (ban)</strong>.</p></div>' +
        '<div style="display:flex;flex-direction:column;gap:1.35rem">' +
        cards +
        '</div></div>';
      pane.onclick = function (e) {
        var bBan = e.target.closest('[data-adm-drv-ban]');
        if (bBan) {
          banUser(bBan.getAttribute('data-adm-drv-ban'));
          return;
        }
        var bUn = e.target.closest('[data-adm-drv-unban]');
        if (bUn) {
          unbanUser(bUn.getAttribute('data-adm-drv-unban'));
          return;
        }
        var bTo = e.target.closest('[data-adm-drv-timeout]');
        if (bTo) {
          timeoutUser(bTo.getAttribute('data-adm-drv-timeout'));
          return;
        }
        var bDel = e.target.closest('[data-adm-drv-delete]');
        if (bDel) {
          adminDeleteUserAccount(bDel.getAttribute('data-adm-drv-delete'));
        }
      };
    });
  } else if (section === 'logistics') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:#111827">🗺️ Live Logistics Map</h1>
            <p style="color:#6b7280;font-size:0.875rem">Real-time order tracking and delivery management</p>
          </div>
          <div style="display:flex;gap:0.5rem">
            <button onclick="refreshLogisticsMap()" style="background:#7c3aed;color:white;border:none;padding:0.6rem 1rem;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:600">🔄 Refresh</button>
            <button onclick="centerOnDriver()" style="background:#059669;color:white;border:none;padding:0.6rem 1rem;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:600">📍 Center on Driver</button>
          </div>
        </div>
        <div id="logistics-kpi-row"></div>
        
        <!-- Map Container -->
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08)">
          <!-- Map Controls -->
          <div style="background:#f8f9fa;border-bottom:1px solid #e5e7eb;padding:1rem;display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;gap:1rem;align-items:center">
              <span style="font-size:0.85rem;font-weight:600;color:#374151">Orders:</span>
              <span id="logistics-order-count" style="background:#7c3aed;color:white;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.75rem;font-weight:600">0</span>
            </div>
            <div style="display:flex;gap:1rem;align-items:center">
              <span style="font-size:0.85rem;font-weight:600;color:#374151">Active:</span>
              <span id="logistics-active-count" style="background:#059669;color:white;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.75rem;font-weight:600">0</span>
            </div>
          </div>
          
          <!-- Map -->
          <div id="logistics-map" style="height:500px;position:relative;background:#f0f4f8">
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#9ca3af">
              <div style="font-size:2rem;margin-bottom:0.5rem">🗺️</div>
              <p style="font-size:0.9rem;">Loading interactive map...</p>
              <p style="font-size:0.75rem;color:#6b7280;margin-top:0.5rem">Orders with coordinates will appear here</p>
            </div>
          </div>
          
          <!-- Order List -->
          <div style="background:#f8f9fa;border-top:1px solid #e5e7eb;padding:1rem;max-height:300px;overflow-y:auto">
            <h3 style="font-size:0.95rem;font-weight:600;color:#111827;margin-bottom:1rem">Active Deliveries</h3>
            <div id="logistics-order-list" style="display:flex;flex-direction:column;gap:0.75rem">
              <div style="text-align:center;padding:2rem;color:#9ca3af">
                <div style="font-size:2rem;margin-bottom:0.5rem">📦</div>
                <p style="font-weight:500;margin-bottom:0.5rem">No active deliveries</p>
                <p style="font-size:0.875rem;">Orders with delivery coordinates will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    renderAdminLogisticsKpis();
    // Initialize map after DOM is ready
    setTimeout(() => initializeLogisticsMap(), 100);
    
  } else if (section === 'vendor-dashboard') {
    // Check if user is a vendor
    if (!State.currentUser || State.currentUser.role !== 'vendor') {
      content.innerHTML = `
        <div style="text-align:center;padding:4rem;color:#9ca3af">
          <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
          <h2 style="margin-bottom:0.5rem;color:#1e0a4e">Vendor Access Required</h2>
          <p style="margin-bottom:2rem;color:#6b7280">You need to be logged in as a vendor to access this dashboard.</p>
          <button onclick="showPage('auth')" style="background:#7c3aed;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">Sign In as Vendor</button>
        </div>
      `;
      return;
    }
    
    content.innerHTML = buildVendorDashboardHTML();
    initializeVendorDashboard(content).catch(err => {
      if (typeof STNLog !== 'undefined') STNLog.error('vendor.dashboard.init', err, {});
      content.innerHTML = '<div style="text-align:center;padding:4rem;color:#dc2626"><div style="font-size:3rem;margin-bottom:1rem">⚠️</div><h2>Dashboard Error</h2><p>'+err.message+'</p><button onclick="location.reload()" style="background:#dc2626;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Reload</button></div>';
    });
    
  } else if (section === 'vendors') {
    content.innerHTML =
      '<p style="padding:2rem;text-align:center;color:#64748b;font-size:0.9rem">Loading vendors…</p>';
    mergeLocalAndRemoteUsersForAdmin().then(function (merged) {
      var pane = document.getElementById('admin-content');
      var navV = document.getElementById('adm-nav-vendors');
      if (!pane || !navV || !navV.classList.contains('adm-active')) return;
      var vendors = merged.filter(function (u) {
        return u.role === 'vendor';
      });
      var vendorRows = vendors.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#9ca3af">No vendors yet</td></tr>'
      : vendors.map(function(v) {
          var isBanned = v.banned;
          var isTimedOut = v.timeout_until && new Date(v.timeout_until) > new Date();
          var timeoutLeft = isTimedOut ? Math.ceil((new Date(v.timeout_until)-new Date())/3600000)+'h left' : '';
          var vProds = State.products.filter(function(p){ return p.vendorId===v.id || p.brand===(v.shop_name||v.shopName); }).length;
          var sb = isBanned ? '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#fee2e2;color:#dc2626">Banned</span>'
            : isTimedOut ? '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#fef3c7;color:#d97706">Timeout '+timeoutLeft+'</span>'
            : v.verified ? '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#dcfce7;color:#166534">Approved</span>'
            : '<span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:#fef9c3;color:#92400e">Pending</span>';
          var act = '';
          if (!v.verified && !isBanned) act += '<button data-action="approve" data-id="'+v.id+'" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;margin-right:0.3rem">Approve</button>';
          act += isBanned
            ? '<button data-action="unban" data-id="'+v.id+'" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer">Unban</button>'
            : '<button data-action="timeout" data-id="'+v.id+'" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;margin-right:0.3rem">Timeout</button><button data-action="ban" data-id="'+v.id+'" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;margin-right:0.3rem">Ban</button>';
          act +=
            '<button data-action="delete-account" data-id="' +
            v.id +
            '" style="background:#0f172a;color:#fff;border:none;padding:0.25rem 0.55rem;border-radius:6px;font-size:0.68rem;cursor:pointer;font-weight:700">Delete</button>';
          return '<tr style="border-top:1px solid #f3f4f6'+(isBanned?';background:#fff5f5':'')+'">'
            +'<td style="padding:0.75rem 1rem;font-size:0.82rem;font-weight:600;color:'+(isBanned?'#ef4444':'#111827')+'">'+(v.first_name||v.firstName||'')+' '+(v.last_name||v.lastName||'')+(isTimedOut?' <small style="color:#f59e0b">'+timeoutLeft+'</small>':'')+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#6b7280">'+v.email+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;font-weight:600;color:#374151">'+(v.shop_name||v.shopName||'-')+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#374151">'+(v.wilaya||'-')+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;font-weight:600;color:#7c3aed">'+vProds+'</td>'
            +'<td style="padding:0.75rem 1rem">'+sb+'</td>'
            +'<td style="padding:0.75rem 1rem">'+act+'</td>'
            +'</tr>';
        }).join('');
      pane.innerHTML =
        '<div><div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;font-weight:700;color:#111827">Vendors</h1><p style="color:#6b7280;font-size:0.875rem">' +
        vendors.length +
        ' vendors · <strong>Approve</strong> pending shops, or <strong>Ban</strong> to reject.</p></div><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb"><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Vendor</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Email</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Shop</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Wilaya</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Products</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Actions</th></tr></thead><tbody>' +
        vendorRows +
        '</tbody></table></div></div></div>';
      var vtbl = pane.querySelector('table');
      if (vtbl)
        vtbl.addEventListener('click', function (e) {
          var b = e.target.closest('[data-action]');
          if (!b) return;
          var id = b.dataset.id,
            action = b.dataset.action;
          if (action === 'approve') verifyVendor(id);
          else if (action === 'ban') banUser(id);
          else if (action === 'timeout') timeoutUser(id);
          else if (action === 'unban') unbanUser(id);
          else if (action === 'delete-account') adminDeleteUserAccount(id);
        });
    });
  }
}

function advanceOrder(orderId) {
  const orders = STN.DB.get('orders') || [];
  const order = orders.find(o => o.id === orderId || o.tracking_number === orderId);
  if (!order) { toast('Order not found', 'error'); return; }
  var next = nextOrderStatus(order.status || 'pending');
  if (normalizeOrderStatus(order.status) === 'delivered') { toast('Order already delivered!', 'default'); return; }
  order.status = next;
  STN.DB.set('orders', orders);
  toast('Order advanced to: ' + order.status, 'success');
  try {
    if (typeof SB !== 'undefined' && SB.updateOrderStatus) SB.updateOrderStatus(orderId, order.status).catch(function(){});
  } catch (e) {}
  switchAdmin('orders');
}

async function assignOrderDriver(orderRef, driverUserId) {
  if (!driverUserId) { toast('Choose a delivery partner', 'error'); return; }
  try {
    if (typeof SB !== 'undefined' && SB.getUserById) {
      var drvRow = await SB.getUserById(driverUserId);
      if (drvRow && isUserSuspended(drvRow)) {
        toast('That account is suspended or removed — pick another driver', 'error');
        return;
      }
      if (drvRow && drvRow.role === 'driver' && !isDriverVerified(drvRow)) {
        toast('That driver is not verified yet — approve them in Admin → Drivers', 'error');
        return;
      }
    }
  } catch (e) {}
  var localUsers = STN.DB.get('users') || [];
  var locDrv = localUsers.find(function (u) {
    return String(u.id) === String(driverUserId);
  });
  if (locDrv && isUserSuspended(locDrv)) {
    toast('That account is suspended — pick another driver', 'error');
    return;
  }
  if (locDrv && locDrv.role === 'driver' && !isDriverVerified(locDrv)) {
    toast('That driver is not verified yet — Admin → Drivers', 'error');
    return;
  }
  var orders = STN.DB.get('orders') || [];
  var o = orders.find(function (x) {
    return String(x.id) === String(orderRef) || x.tracking_number === orderRef;
  });
  if (o) {
    o.driver_id = driverUserId;
    o.driverId = driverUserId;
    STN.DB.set('orders', orders);
  }
  try {
    if (typeof SB !== 'undefined' && SB.updateOrder) await SB.updateOrder(orderRef, { driver_id: driverUserId });
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('assignOrderDriver', e && e.message);
  }
  toast('Driver assigned to order', 'success');
  switchAdmin('orders');
}

function _orderVendorCoord(order) {
  if (!order || typeof order !== 'object') return null;
  var lat = Number(order.vendor_lat != null ? order.vendor_lat : order.pickup_lat);
  var lng = Number(order.vendor_lng != null ? order.vendor_lng : order.pickup_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return wilayaToCoord(order.vendor_wilaya || order.vendor_region || order.wilaya || '');
}

function _orderCustomerCoord(order) {
  if (!order || typeof order !== 'object') return null;
  var lat = Number(order.delivery_lat != null ? order.delivery_lat : order.customer_lat);
  var lng = Number(order.delivery_lng != null ? order.delivery_lng : order.customer_lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
  return wilayaToCoord(order.wilaya || order.customer_wilaya || order.region || '');
}

function _driverCurrentCoord(driver, orders) {
  if (!driver) return null;
  var last = null;
  (orders || []).forEach(function (o) {
    var did = o.driver_id != null ? o.driver_id : o.driverId;
    if (String(did || '') !== String(driver.id)) return;
    var st = normalizeOrderStatus(o.status);
    if (!(st === 'out_for_delivery' || st === 'transit' || st === 'processing' || st === 'ready' || st === 'shipped')) return;
    var lat = Number(o.driver_lat);
    var lng = Number(o.driver_lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!last || String(o.updated_at || o.created_at || '') > String(last.t || '')) {
      last = { t: o.updated_at || o.created_at || '', coord: [lat, lng] };
    }
  });
  if (last) return last.coord;
  return wilayaToCoord(driver.wilaya || '');
}

function _driverActiveLoad(driverId, orders) {
  return (orders || []).filter(function (o) {
    var did = o.driver_id != null ? o.driver_id : o.driverId;
    if (String(did || '') !== String(driverId)) return false;
    return DELIVERY_ACTIVE_STATUSES.has(normalizeOrderStatus(o.status));
  }).length;
}

async function autoAssignOrderDriver(orderRef) {
  var orders = STN.DB.get('orders') || [];
  var target = orders.find(function (o) { return String(o.id) === String(orderRef) || String(o.tracking_number) === String(orderRef); });
  if (!target) { toast('Order not found for auto-dispatch', 'error'); return; }

  var users = await mergeLocalAndRemoteUsersForAdmin().catch(function () {
    return STN.DB.get('users') || [];
  });
  var candidates = (users || []).filter(function (u) {
    return u.role === 'driver' && isDriverVerified(u) && !isUserSuspended(u);
  });
  if (!candidates.length) { toast('No verified active drivers available', 'error'); return; }

  var pickup = _orderVendorCoord(target);
  var drop = _orderCustomerCoord(target);
  if (!pickup || !drop) {
    toast('Auto-dispatch needs vendor/customer coordinates (or wilaya)', 'error');
    return;
  }

  var best = null;
  var scored = candidates.map(function (d) {
    var dCoord = _driverCurrentCoord(d, orders) || pickup;
    var toPickupKm = haversineKm(dCoord[0], dCoord[1], pickup[0], pickup[1]);
    var routeKm = haversineKm(pickup[0], pickup[1], drop[0], drop[1]);
    var load = _driverActiveLoad(d.id, orders);
    var score = (toPickupKm * 0.58) + (routeKm * 0.32) + (load * 4.5);
    var row = {
      driver_id: String(d.id),
      driver_name: (d.first_name || d.firstName || 'Driver') + ' ' + (d.last_name || d.lastName || ''),
      distance_to_vendor_km: Math.round(toPickupKm * 100) / 100,
      route_distance_km: Math.round(routeKm * 100) / 100,
      active_load: load,
      score: Math.round(score * 100) / 100,
    };
    if (!best || row.score < best.score) best = row;
    return row;
  }).sort(function (a, b) { return a.score - b.score; });

  if (!best) { toast('Auto-dispatch failed to score drivers', 'error'); return; }
  await assignOrderDriver(orderRef, best.driver_id);

  if (typeof SB !== 'undefined') {
    try {
      if (SB.logDispatchDecision) {
        await SB.logDispatchDecision({
          order_id: target.id || target.tracking_number || orderRef,
          selected_driver_id: best.driver_id,
          reason_code: 'best_eta_capacity',
          score_breakdown: scored.slice(0, 8),
          created_at: new Date().toISOString(),
          mode: 'auto',
        });
      }
      if (SB.req) {
        for (var i = 0; i < Math.min(scored.length, 10); i++) {
          await SB.req('POST', 'dispatch_score', {
            order_id: target.id || target.tracking_number || orderRef,
            driver_id: scored[i].driver_id,
            distance_to_vendor_km: scored[i].distance_to_vendor_km,
            route_distance_km: scored[i].route_distance_km,
            active_load: scored[i].active_load,
            score: scored[i].score,
            created_at: new Date().toISOString(),
          }).catch(function () {});
        }
      }
    } catch (e) {}
  }
  toast('Auto-dispatch selected ' + best.driver_name.trim() + ' (score ' + best.score + ')', 'success');
}

/**
 * PATCH driver approval to Supabase. Tries shapes that match different schemas:
 * - is_verified (driver KYC migration)
 * - verified only (some vendor-oriented schemas)
 * - both (if both columns exist)
 */
async function _sbPatchDriverVerifiedForApprove(userId) {
  if (typeof SB === 'undefined' || typeof SB.updateUser !== 'function') {
    return { ok: true, mode: 'no-remote' };
  }
  var lastErr = null;
  try {
    await SB.updateUser(userId, { is_verified: true });
    return { ok: true, mode: 'is_verified' };
  } catch (e1) {
    lastErr = e1;
  }
  try {
    await SB.updateUser(userId, { verified: true });
    return { ok: true, mode: 'verified-only' };
  } catch (e2) {
    lastErr = e2;
  }
  try {
    await SB.updateUser(userId, { verified: true, is_verified: true });
    return { ok: true, mode: 'both' };
  } catch (e3) {
    lastErr = e3;
  }
  return { ok: false, err: lastErr };
}

async function verifyDriverAccount(userId) {
  try {
    toast('Saving approval to the database…', 'default');
    if (typeof SB !== 'undefined' && SB.getUserById) {
      var probe = await SB.getUserById(userId);
      if (probe && isUserSuspended(probe)) {
        toast('Cannot verify a suspended or removed account', 'error');
        return;
      }
    }
    var users = STN.DB.get('users') || [];
    var idx = users.findIndex(function (u) {
      return String(u.id) === String(userId);
    });
    if (idx !== -1 && isUserSuspended(users[idx])) {
      toast('Cannot verify a suspended account', 'error');
      return;
    }

    var remote = await _sbPatchDriverVerifiedForApprove(userId);
    if (!remote.ok) {
      var msg = remote.err && remote.err.message ? String(remote.err.message) : 'Update failed';
      var low = msg.toLowerCase();
      toast(
        low.indexOf('policy') >= 0 ||
          low.indexOf('permission') >= 0 ||
          low.indexOf('rls') >= 0 ||
          low.indexOf('no user row') >= 0
          ? 'Database blocked the update. In Supabase → SQL, run the file supabase/migrations/20260325110000_users_grant_and_rls_update.sql (GRANT + UPDATE policy), then try again.'
          : 'Could not approve driver: ' + (msg.length > 120 ? msg.slice(0, 117) + '…' : msg),
        'error'
      );
      if (typeof STNLog !== 'undefined') STNLog.warn('verifyDriverAccount.remote', remote.err);
      return;
    }

    users = STN.DB.get('users') || [];
    idx = users.findIndex(function (u) {
      return String(u.id) === String(userId);
    });
    if (remote.mode !== 'no-remote' && typeof SB !== 'undefined' && SB.getUserById) {
      try {
        var row = await SB.getUserById(userId);
        if (row) {
          var merged = STN.userForSession({
            ...row,
            firstName: row.first_name,
            lastName: row.last_name,
            verified: true,
            is_verified: true,
          });
          if (idx >= 0) users[idx] = merged;
          else users.push(merged);
          STN.DB.set('users', users);
        }
      } catch (e) {
        if (typeof STNLog !== 'undefined') STNLog.warn('verifyDriverAccount.refetch', e && e.message);
        if (idx >= 0) {
          users[idx].verified = true;
          users[idx].is_verified = true;
          STN.DB.set('users', users);
        }
      }
    } else {
      if (idx >= 0) {
        users[idx].verified = true;
        users[idx].is_verified = true;
        STN.DB.set('users', users);
      }
    }

    if (State.currentUser && String(State.currentUser.id) === String(userId)) {
      State.currentUser.verified = true;
      State.currentUser.is_verified = true;
      STN.DB.set('currentUser', State.currentUser);
      updateNavUser();
    }
    toast('Driver approved — they can accept deliveries.', 'success');
    var navActive = document.querySelector('[id^="adm-nav-"].adm-active');
    var sec =
      navActive && navActive.id && navActive.id.indexOf('adm-nav-') === 0
        ? navActive.id.replace('adm-nav-', '')
        : 'users';
    switchAdmin(sec === 'drivers' ? 'drivers' : 'users');
  } catch (ex) {
    var em = ex && ex.message ? String(ex.message) : String(ex);
    toast('Approve failed: ' + (em.length > 140 ? em.slice(0, 137) + '…' : em), 'error');
    if (typeof STNLog !== 'undefined') STNLog.error('verifyDriverAccount', ex, { userId });
  }
}

window.verifyDriverAccount = verifyDriverAccount;

async function verifyVendor(userId) {
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx !== -1) {
    users[idx].verified = true;
    STN.DB.set('users', users);
  }
  try {
    if (typeof SB !== 'undefined' && SB.updateUser) {
      await SB.updateUser(userId, { verified: true });
    }
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.warn('verifyVendor', e && e.message);
  }
  toast('Vendor approved!', 'success');
  switchAdmin('vendors');
}

/**
 * Ban a user (admin). Optional `reason` skips the prompt; otherwise admin enters text shown to the user.
 * @param {string|number} userId
 * @param {string} [reason] pre-filled rejection note
 */
async function banUser(userId, reason) {
  if (!confirm('Are you sure you want to BAN this user? They will see your reason on their account.')) return;
  var note =
    reason != null && String(reason).trim() !== ''
      ? String(reason).trim()
      : null;
  if (note == null) {
    var entered = window.prompt(
      'Reason for rejection (the user will see this). Leave blank for a generic message:',
      ''
    );
    if (entered === null) return;
    entered = String(entered).trim();
    note = entered || 'Your application did not meet our requirements at this time. Contact support if you have questions.';
  }
  var now = new Date().toISOString();
  try {
    if (typeof SB !== 'undefined' && SB.updateUser) {
      await SB.updateUser(userId, {
        banned: true,
        ban_reason: note,
        banned_at: now,
      });
    }
  } catch (e) {
    var em = String((e && e.message) || e || '');
    toast(
      em
        ? 'Ban failed on server (run SQL migration for banned columns + UPDATE policy): ' +
            (em.length > 120 ? em.slice(0, 117) + '…' : em)
        : 'Ban failed on server — check Supabase RLS UPDATE on users',
      'error'
    );
    if (typeof STNLog !== 'undefined') STNLog.error('banUser', e, { userId });
    return;
  }
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx !== -1) {
    users[idx].banned = true;
    users[idx].ban_reason = note;
    users[idx].banned_at = now;
    STN.DB.set('users', users);
  }
  if (State.currentUser && String(State.currentUser.id) === String(userId)) {
    State.currentUser = null;
    STN.DB.set('currentUser', null);
    updateNavUser();
    showPage('home');
  }
  toast('User banned — saved to database', 'success');
  const activeSection = document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

async function timeoutUser(userId) {
  const hours = prompt('Timeout duration in hours? (e.g. 24, 48, 72)', '24');
  if (!hours) return;
  const h = parseInt(hours);
  if (isNaN(h) || h <= 0) { toast('Invalid duration', 'error'); return; }
  const until = new Date(Date.now() + h * 3600000).toISOString();
  try {
    if (typeof SB !== 'undefined' && SB.updateUser) {
      await SB.updateUser(userId, { timeout_until: until, timeout_hours: h });
    }
  } catch (e) {
    toast('Timeout failed on server — check RLS UPDATE on users', 'error');
    if (typeof STNLog !== 'undefined') STNLog.error('timeoutUser', e, { userId });
    return;
  }
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx !== -1) {
    users[idx].timeout_until = until;
    users[idx].timeout_hours = h;
    STN.DB.set('users', users);
  }
  toast('User timed out for ' + h + ' hours (saved to database)', 'success');
  const activeSection = document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

async function unbanUser(userId) {
  try {
    if (typeof SB !== 'undefined' && SB.updateUser) {
      await SB.updateUser(userId, {
        banned: false,
        ban_reason: null,
        banned_at: null,
        timeout_until: null,
        timeout_hours: null,
        deleted_at: null,
      });
    }
  } catch (e) {
    toast('Unban failed on server — check RLS UPDATE on users', 'error');
    if (typeof STNLog !== 'undefined') STNLog.error('unbanUser', e, { userId });
    return;
  }
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => String(u.id) === String(userId));
  if (idx !== -1) {
    users[idx].banned = false;
    users[idx].timeout_until = null;
    users[idx].deleted_at = null;
    STN.DB.set('users', users);
  }
  toast('User restored — saved to database', 'success');
  const activeSection = document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

/** Permanently remove a user from Supabase + local demo list (admin only). */
async function adminDeleteUserAccount(userId) {
  if (!State.currentUser || State.currentUser.role !== 'admin') {
    toast('Admin access required', 'error');
    return;
  }
  if (String(State.currentUser.id) === String(userId)) {
    toast('You cannot delete your own account', 'error');
    return;
  }
  var locals = STN.DB.get('users') || [];
  var localTarget = locals.find(function (u) {
    return String(u.id) === String(userId);
  });
  var emailHint = localTarget && localTarget.email ? String(localTarget.email) : 'this user';
  try {
    if (typeof SB !== 'undefined' && SB.getUserById) {
      var rem = await SB.getUserById(userId);
      if (rem && rem.role === 'admin') {
        toast('Admin accounts cannot be deleted from the panel', 'error');
        return;
      }
      if (rem && rem.email) emailHint = String(rem.email);
    }
  } catch (probeErr) {}
  if (localTarget && localTarget.role === 'admin') {
    toast('Admin accounts cannot be deleted from the panel', 'error');
    return;
  }
  if (
    !confirm(
      'Delete account permanently?\n\n' +
        emailHint +
        '\n\nThis removes the row from the database. Orders may still reference this user id. OK?'
    )
  ) {
    return;
  }
  if (!confirm('Final confirmation: DELETE this user forever?')) return;

  var deleteHow = '';
  try {
    if (typeof SB !== 'undefined' && SB.deleteUser) {
      await SB.deleteUser(userId);
      deleteHow = 'hard';
    } else {
      throw new Error('deleteUser not available');
    }
  } catch (eDel) {
    try {
      if (typeof SB !== 'undefined' && SB.updateUser) {
        await SB.updateUser(userId, {
          deleted_at: new Date().toISOString(),
          banned: true,
          ban_reason: 'Account removed by admin',
          banned_at: new Date().toISOString(),
        });
        deleteHow = 'soft';
      } else {
        throw eDel;
      }
    } catch (eSoft) {
      var em = String((eDel && eDel.message) || eDel || '');
      toast(
        em.indexOf('permission') >= 0 || em.indexOf('RLS') >= 0 || em.indexOf('policy') >= 0
          ? 'Delete blocked: add DELETE or UPDATE policy on users, or run migrations (see supabase/migrations).'
          : '⚠️ ' + (em.length > 140 ? em.slice(0, 137) + '…' : em),
        'error'
      );
      if (typeof STNLog !== 'undefined') STNLog.error('adminDeleteUserAccount', eDel, { userId });
      return;
    }
  }

  var users = STN.DB.get('users') || [];
  var next = users.filter(function (u) {
    return String(u.id) !== String(userId);
  });
  STN.DB.set('users', next);
  _stnAdminRemovedUserIdRemember(userId);
  if (State.currentUser && String(State.currentUser.id) === String(userId)) {
    State.currentUser = null;
    STN.DB.set('currentUser', null);
    updateNavUser();
    showPage('home');
  }
  toast(
    deleteHow === 'hard'
      ? 'Account deleted from database'
      : 'Account disabled and hidden (soft delete — row kept if DB blocked hard delete)',
    'success'
  );
  var activeSection =
    document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

// ── VENDOR DASHBOARD (PROFESSIONAL) ──
function renderVendorDashboard() {
  if (typeof STNLog !== 'undefined') STNLog.debug('vendor.dashboard', 'renderVendorDashboard', STNLog.sanitize(State.currentUser));
  
  if (!State.currentUser || State.currentUser.role !== 'vendor') {
    if (typeof STNLog !== 'undefined') STNLog.warn('vendor.dashboard', 'access denied', STNLog.sanitize(State.currentUser));
    const page = document.getElementById('page-vendor-dashboard');
    if (page) {
      page.innerHTML = `
        <div style="text-align:center;padding:4rem;background:white;border-radius:20px;margin:2rem">
          <div style="font-size:4rem;margin-bottom:1rem">🔒</div>
          <h2 style="color:#1e0a4e;font-size:2rem;margin-bottom:1rem">Vendor Access Required</h2>
          <p style="color:#666;margin-bottom:2rem">Please sign in with your vendor account to access the dashboard.</p>
          <button onclick="showPage('auth')" style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:1rem 2rem;border-radius:10px;font-weight:600;cursor:pointer;font-size:1rem">Sign In as Vendor</button>
        </div>
      `;
    }
    return;
  }

  if (typeof STNLog !== 'undefined') STNLog.info('vendor.dashboard', 'authenticated', { id: State.currentUser.id, role: State.currentUser.role });

  // Load professional dashboard
  const page = document.getElementById('page-vendor-dashboard');
  if (!page) {
    if (typeof STNLog !== 'undefined') STNLog.warn('vendor.dashboard', 'page element missing', { id: 'page-vendor-dashboard' });
    return;
  }
  
  page.innerHTML = buildProfessionalDashboardHTML();
  initializeProfessionalDashboard();
}

function buildProfessionalDashboardHTML() {
  return `
    <div class="dashboard-container dash-pro-root">
      <div class="dash-pro-hero">
        <div>
          <p class="dash-pro-eyebrow">Seller workspace</p>
          <h1 class="dash-pro-hero-title">Performance</h1>
          <p class="dash-pro-hero-sub">Live GMV, fulfillment, catalog exposure, and logistics — tuned for daily operations on Everest.</p>
        </div>
        <div class="dash-pro-hero-meta">
          <div class="dash-pro-shop" id="vendor-name"></div>
          <span class="dash-pro-live" id="vendor-verify-pill">Live</span>
        </div>
        <div class="dash-pro-hero-actions" style="width:100%;flex-basis:100%;display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.15rem;padding-top:0.65rem;border-top:1px solid var(--dp-border)">
          <button type="button" class="btn btn-secondary btn-sm" onclick="showPage('account')">Account</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="logout()">Log out</button>
          <button type="button" class="btn btn-sm" style="background:#fff;color:#b91c1c;border:1px solid rgba(220,38,38,0.35)" onclick="deleteMyAccount()">Delete account</button>
        </div>
      </div>

      <div class="kpi-grid" id="kpi-grid">
        <div class="loading">
          <div class="spinner"></div>
          Loading dashboard...
        </div>
      </div>

      <div class="panel" id="vendor-analytics-anchor" tabindex="-1">
        <div class="panel-header">
          <h2 class="panel-title">Revenue trajectory</h2>
          <span id="vendor-chart-sub" style="font-size:0.75rem;color:#7b72a8;font-weight:600"></span>
        </div>
        <div id="vendor-revenue-chart" style="padding:0 1.25rem 1.35rem;min-height:88px"></div>
      </div>

      <div class="dash-pro-mini" id="vendor-mini-stats" style="margin-bottom:1.35rem"></div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Left Panel -->
        <div class="left-panel">
          <!-- Recent Orders -->
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">📦 Recent Orders</h2>
              <button class="btn btn-primary" onclick="viewAllOrders()">View All</button>
            </div>
            <div id="orders-list">
              <div class="loading">
                <div class="spinner"></div>
                Loading orders...
              </div>
            </div>
          </div>

          <!-- Interactive Map -->
          <div class="panel" style="margin-top: 30px;">
            <div class="panel-header">
              <h2 class="panel-title">🗺️ Live Logistics Map - Tunisia</h2>
              <button class="btn btn-secondary" onclick="refreshMap()">Refresh</button>
            </div>
            <div id="vendor-map"></div>
          </div>
        </div>

        <!-- Right Panel -->
        <div class="right-panel">
          <!-- Inventory -->
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">📊 Inventory Status</h2>
              <button class="btn btn-primary" onclick="addProduct()">+ Add Product</button>
            </div>
            <div id="inventory-list">
              <div class="loading">
                <div class="spinner"></div>
                Loading inventory...
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="panel" style="margin-top: 30px;">
            <div class="panel-header">
              <h2 class="panel-title">⚡ Quick Actions</h2>
            </div>
            <div class="quick-actions">
              <button class="btn btn-primary" onclick="addProduct()">➕ Add New Product</button>
              <button class="btn btn-secondary" onclick="viewAnalytics()">📈 View Analytics</button>
              <button class="btn btn-secondary" onclick="viewSettings()">⚙️ Settings</button>
              <button class="btn btn-secondary" onclick="exportData()">📥 Export Data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function initializeProfessionalDashboard() {
  if (typeof STNLog !== 'undefined') STNLog.info('vendor.proDashboard', 'initializing', {});
  
  try {
    window.dashboard = new ProfessionalVendorDashboard();
    await window.dashboard.init();
    if (typeof STNLog !== 'undefined') STNLog.info('vendor.proDashboard', 'ready', {});
  } catch (error) {
    if (typeof STNLog !== 'undefined') STNLog.error('vendor.proDashboard.init', error, {});
    document.getElementById('kpi-grid').innerHTML = `
      <div class="error-message" style="grid-column: 1/-1;">
        <strong>❌ Error:</strong> ${error.message}
        <br><button onclick="location.reload()" style="background:#dc2626;color:white;border:none;padding:0.5rem 1rem;border-radius:5px;margin-top:10px;cursor:pointer">🔄 Reload</button>
      </div>
    `;
  }
}

// Professional Vendor Dashboard Class
class ProfessionalVendorDashboard {
  constructor() {
    this.vendorData = null;
    this.orders = [];
    this.products = [];
    this.map = null;
  }

  async init() {
    if (typeof STNLog !== 'undefined') STNLog.debug('vendor.proDashboard', 'init start', {});
    
    try {
      // Get vendor data from current user
      this.vendorData = State.currentUser;
      
      if (!this.vendorData || this.vendorData.role !== 'vendor') {
        throw new Error('Vendor authentication required');
      }

      // Load data from Supabase
      await this.loadData();
      
      // Render dashboard
      this.renderDashboard();
      
      // Initialize map
      this.initMap();
      
      if (typeof STNLog !== 'undefined') STNLog.info('vendor.proDashboard', 'init complete', {});
    } catch (error) {
      if (typeof STNLog !== 'undefined') STNLog.error('vendor.proDashboard.classInit', error, {});
      throw error;
    }
  }

  async loadData() {
    try {
      if (typeof STNLog !== 'undefined') STNLog.debug('vendor.proDashboard', 'loadData start', {});
      
      // Load orders (prefer vendor-scoped API; normalize vendor_id / vendorId)
      try {
        const vid = this.vendorData.id;
        let loaded = null;
        if (typeof SB !== 'undefined' && typeof SB.getVendorOrders === 'function') {
          loaded = await SB.getVendorOrders(vid);
        }
        if (loaded && loaded.length) {
          this.orders = loaded;
        } else {
          const allOrders = await SB.getOrders();
          this.orders = (allOrders || []).filter(function (o) {
            return dashOrderBelongsToVendor(o, vid);
          });
        }
        if (typeof STNLog !== 'undefined') STNLog.debug('vendor.proDashboard', 'orders loaded', { count: this.orders.length });
      } catch (error) {
        if (typeof STNLog !== 'undefined') STNLog.warn('vendor.proDashboard', 'orders fetch failed; using local', { message: error && error.message });
        var vidLocal = this.vendorData.id;
        var local = STN.DB.get('orders') || [];
        this.orders = local.filter(function (o) {
          return dashOrderBelongsToVendor(o, vidLocal);
        });
      }

      // Load products
      try {
        const allProducts = await SB.getProducts();
        const vid = this.vendorData.id;
        this.products = allProducts
          ? allProducts.filter(function (p) {
              var pv = p.vendor_id != null ? p.vendor_id : p.vendorId;
              return pv != null && String(pv) === String(vid);
            })
          : [];
        if (typeof STNLog !== 'undefined') STNLog.debug('vendor.proDashboard', 'products loaded', { count: this.products.length });
      } catch (error) {
        if (typeof STNLog !== 'undefined') STNLog.warn('vendor.proDashboard', 'products fetch failed; using state', { message: error && error.message });
        var pvId = this.vendorData.id;
        this.products = (State.products || []).filter(function (p) {
          var pv = p.vendor_id != null ? p.vendor_id : p.vendorId;
          return pv != null && String(pv) === String(pvId);
        });
      }

      if (typeof STNLog !== 'undefined') STNLog.debug('vendor.proDashboard', 'loadData summary', {
        orders: this.orders.length,
        products: this.products.length,
        vendorId: this.vendorData && this.vendorData.id,
      });
    } catch (error) {
      if (typeof STNLog !== 'undefined') STNLog.error('vendor.proDashboard.loadData', error, {});
      throw error;
    }
  }

  renderDashboard() {
    this.renderHeader();
    this.renderKPIs();
    this.renderVendorAnalytics();
    this.renderOrders();
    this.renderInventory();
  }

  renderHeader() {
    const vendorNameEl = document.getElementById('vendor-name');
    if (vendorNameEl) {
      vendorNameEl.textContent = this.vendorData.shop_name || this.vendorData.name || 'Your shop';
    }
    const pill = document.getElementById('vendor-verify-pill');
    if (pill) {
      const ok = !!this.vendorData.verified;
      pill.textContent = ok ? 'Verified' : 'Pending review';
      pill.className = 'dash-pro-live' + (ok ? '' : ' dash-pro-live--pending');
    }
  }

  renderVendorAnalytics() {
    const chartEl = document.getElementById('vendor-revenue-chart');
    const cap = document.getElementById('vendor-chart-sub');
    const mini = document.getElementById('vendor-mini-stats');
    const a = dashAnalyticsForOrders(this.orders, 7);
    if (chartEl) {
      chartEl.innerHTML = dashSparklineBars(a.daily, 720, 86);
    }
    if (cap) {
      const mx = Math.max.apply(null, a.daily.concat([0]));
      cap.textContent =
        mx > 0
          ? 'Best day · ' + mx.toLocaleString() + ' TND (last 7d)'
          : 'No dated revenue in the last 7 days';
    }
    if (mini) {
      const fulfil = dashFulfillmentStats(this.orders);
      const inTransit = this.orders.filter(function (o) {
        const s = String(o.status || '')
          .toLowerCase()
          .replace(/-/g, '_');
        return (
          s === 'shipped' ||
          s === 'out_for_delivery' ||
          s === 'transit' ||
          s === 'processing' ||
          s === 'ready'
        );
      }).length;
      const low = this.products.filter(function (p) {
        return (p.stock || 0) < 5;
      }).length;
      const stockVal = this.products.reduce(function (s, p) {
        return s + (Number(p.price) || 0) * (Number(p.stock) || 0);
      }, 0);
      mini.innerHTML =
        '<div class="dash-pro-mini-tile"><span>Weekly revenue pulse</span><strong style="font-size:0.88rem">' +
        dashHonestMiniRevPhrase(a) +
        '</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">Same 7-day window as the chart above</div></div>' +
        '<div class="dash-pro-mini-tile"><span>Orders this week</span><strong class="dash-pro-mono">' +
        a.ordersPeriod +
        '</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">' +
        dashHonestMiniOrdPhrase(a) +
        ' · prior ' +
        a.ordersPrev +
        '</div></div>' +
        '<div class="dash-pro-mini-tile"><span>In fulfillment</span><strong class="dash-pro-mono">' +
        inTransit +
        '</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">Processing → shipped → out for delivery</div></div>' +
        '<div class="dash-pro-mini-tile"><span>Retail stock value</span><strong class="dash-pro-mono">' +
        Math.round(stockVal).toLocaleString() +
        ' TND</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">' +
        low +
        ' SKU below 5 units · ' +
        this.products.length +
        ' live SKUs</div></div>' +
        '<div class="dash-pro-mini-tile"><span>Fulfillment</span><strong class="dash-pro-mono">' +
        fulfil.rate +
        '%</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">' +
        fulfil.delivered +
        ' delivered · ' +
        fulfil.canceled +
        ' canceled</div></div>' +
        '<div class="dash-pro-mini-tile"><span>Average order (7d)</span><strong class="dash-pro-mono">' +
        Math.round(a.aovPeriod).toLocaleString() +
        ' TND</strong><div style="font-size:0.7rem;color:#7b72a8;margin-top:0.35rem">Previous week ' +
        Math.round(a.aovPrev).toLocaleString() +
        ' TND</div></div>';
    }
  }

  renderKPIs() {
    const kpiGrid = document.getElementById('kpi-grid');
    const lifetime = dashSumRevenue(this.orders);
    const a = dashAnalyticsForOrders(this.orders, 7);
    const fulfil = dashFulfillmentStats(this.orders);
    const lowStockProducts = this.products.filter(function (p) {
      return (p.stock || 0) < 5;
    }).length;
    const deliveredOrders = this.orders.filter(function (o) {
      return o.status === 'delivered';
    }).length;
    const kpis = [
      {
        icon: '💰',
        value: lifetime.toLocaleString() + ' TND',
        label: 'Lifetime GMV',
        change: '<span style="color:#7b72a8">' + this.orders.length + ' orders all-time</span>',
      },
      {
        icon: '📈',
        value: a.revenuePeriod.toLocaleString() + ' TND',
        label: '7-day revenue',
        change: dashHonestRevenueDeltaHtml(a),
      },
      {
        icon: '📦',
        value: String(a.ordersPeriod),
        label: 'Orders (7 days)',
        change: dashHonestOrdersDeltaHtml(a),
      },
      {
        icon: '✅',
        value: String(deliveredOrders),
        label: 'Delivered (lifetime)',
        change:
          '<span style="color:#7b72a8">' +
          fulfil.rate +
          '% fulfillment · ' +
          fulfil.canceled +
          ' canceled</span>',
      },
      {
        icon: '⚠️',
        value: String(lowStockProducts),
        label: 'Low stock SKUs',
        change:
          '<span style="color:#7b72a8">' +
          this.products.length +
          ' products · restock soon</span>',
      },
      {
        icon: '🎯',
        value: Math.round(a.aovPeriod).toLocaleString() + ' TND',
        label: 'Avg order value (7d)',
        change: dashHonestAovDeltaHtml(a),
      },
    ];

    kpiGrid.innerHTML = kpis
      .map(function (kpi) {
        return (
          '<div class="kpi-card">' +
          '<div class="kpi-icon">' +
          kpi.icon +
          '</div>' +
          '<div class="kpi-value">' +
          kpi.value +
          '</div>' +
          '<div class="kpi-label">' +
          kpi.label +
          '</div>' +
          '<div class="kpi-change">' +
          kpi.change +
          '</div></div>'
        );
      })
      .join('');
  }

  renderOrders() {
    const ordersList = document.getElementById('orders-list');
    
    if (this.orders.length === 0) {
      ordersList.innerHTML = '<p style="text-align: center; color: #666;">No orders yet</p>';
      return;
    }

    ordersList.innerHTML = this.orders.slice(0, 5).map(order => `
      <div class="order-item">
        <div class="order-info">
          <div class="order-id">${order.tracking_number || order.id || 'ORD-' + Math.random().toString(36).substr(2, 9)}</div>
          <div class="order-customer">${order.notes || order.phone || 'Guest Customer'}</div>
        </div>
        <div style="text-align: right;">
          <div class="order-amount">${order.total || order.amount || 0} TND</div>
          <span class="order-status status-${order.status || 'pending'}">${order.status || 'pending'}</span>
        </div>
      </div>
    `).join('');
  }

  renderInventory() {
    const inventoryList = document.getElementById('inventory-list');
    
    if (this.products.length === 0) {
      inventoryList.innerHTML = '<p style="text-align: center; color: #666;">No products yet</p>';
      return;
    }

    inventoryList.innerHTML = this.products.slice(0, 5).map(product => `
      <div class="product-item">
        <div class="product-emoji">${product.emoji || '📦'}</div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-stock ${product.stock < 5 ? 'low-stock' : ''}">
            Stock: ${product.stock || 0} units
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 600;">${product.price || 0} TND</div>
        </div>
      </div>
    `).join('');
  }

  initMap() {
    const mapContainer = document.getElementById('vendor-map');
    
    if (!mapContainer) return;

    try {
      if (this.map && typeof this.map.remove === 'function') {
        this.map.remove();
        this.map = null;
      }
      // Initialize map centered on Sousse, Tunisia
      this.map = L.map('vendor-map').setView([35.8256, 10.6084], 10);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add vendor location marker
      L.marker([35.8256, 10.6084])
        .addTo(this.map)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>🏪 ${this.vendorData.shop_name || this.vendorData.name}</strong><br>
            ${this.vendorData.wilaya || 'Sousse'}<br>
            ${this.products.length} Products<br>
            ${this.orders.length} Orders
          </div>
        `)
        .openPopup();

      // Add delivery markers for shipped orders
      this.orders
        .filter(function (o) {
          var s = String(o.status || '')
            .toLowerCase()
            .replace(/-/g, '_');
          return s === 'shipped' || s === 'transit' || s === 'out_for_delivery';
        })
        .forEach((order, index) => {
        // Random locations around Tunisia for demo
        const tunisiaLocations = [
          [36.8065, 10.1815], // Tunis
          [35.8256, 10.6084], // Sousse
          [34.7406, 10.7603], // Sfax
          [35.7643, 10.8113], // Monastir
          [35.6781, 10.0963], // Kairouan
          [33.8815, 10.0982], // Gabès
        ];
        
        const location = tunisiaLocations[index % tunisiaLocations.length];
        
        L.marker(location, {
          icon: L.divIcon({
            html: '🚚',
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        })
        .addTo(this.map)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>🚚 Delivery</strong><br>
            Order: ${order.tracking_number || order.id}<br>
            Customer: ${order.notes || order.phone || 'Customer'}<br>
            Status: ${order.status}
          </div>
        `);
      });

      // Add product location markers
      this.products.forEach((product, index) => {
        if (product.region || product.location) {
          const coords = this.getTunisiaCoordinates(product.region || product.location);
          if (coords) {
            L.marker(coords)
              .addTo(this.map)
              .bindPopup(`
                <div style="text-align: center;">
                  <strong>${product.emoji || '📦'} ${product.name}</strong><br>
                  ${product.region || product.location}<br>
                  Stock: ${product.stock || 0}<br>
                  Price: ${product.price || 0} TND
                </div>
              `);
          }
        }
      });

      if (typeof STNLog !== 'undefined') STNLog.debug('vendor.map', 'initialized', {});
    } catch (error) {
      if (typeof STNLog !== 'undefined') STNLog.error('vendor.map', error, {});
      mapContainer.innerHTML = `
        <div style="height: 300px; display: flex; align-items: center; justify-content: center; background: #f0f4f8; border-radius: 15px;">
          <div style="text-align: center; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🗺️</div>
            <p>Tunisia Map</p>
            <p style="font-size: 0.8rem;">Showing vendor locations and deliveries</p>
          </div>
        </div>
      `;
    }
  }

  getTunisiaCoordinates(region) {
    const coordinates = {
      'Tunis': [36.8065, 10.1815],
      'Sousse': [35.8256, 10.6084],
      'Sfax': [34.7406, 10.7603],
      'Monastir': [35.7643, 10.8113],
      'Kairouan': [35.6781, 10.0963],
      'Gabès': [33.8815, 10.0982],
      'Ariana': [36.8625, 10.1956],
      'Ben Arous': [36.7543, 10.2256],
      'Manouba': [36.8053, 10.0589],
      'Bizerte': [37.2746, 9.8739],
      'Béja': [36.7256, 9.1817],
      'Jendouba': [36.5039, 8.7807],
      'Le Kef': [36.1756, 8.7122],
      'Siliana': [36.0856, 9.3673],
      'Kasserine': [35.1683, 8.8376],
      'Gafsa': [34.4248, 8.7848],
      'Tozeur': [33.9252, 8.1348],
      'Kebili': [33.7048, 8.9705],
      'Tataouine': [32.9296, 10.4535],
      'Mahdia': [35.5049, 11.0622],
      'Ksar Hellal': [35.6439, 10.8113],
      'Moknine': [35.6347, 10.7889],
      'Msaken': [35.7203, 10.5985],
      'Kalaa Kebira': [35.6821, 10.0956],
      'Enfidha': [36.1286, 10.3535],
      'Hammamet': [36.3988, 10.6158],
      'Nabeul': [36.4561, 10.7357],
      'Zarzis': [33.5119, 11.0624],
      'Médenine': [33.3540, 10.6179],
      'Djerba': [33.8138, 10.8664],
      'Tabarka': [36.9569, 8.7550]
    };
    
    return coordinates[region] || [35.8256, 10.6084]; // Default to Sousse
  }
}

// Global functions for buttons (vendor professional dashboard)
function scrollToVendorAnalyticsAnchor() {
  var n = 0;
  function tick() {
    var el = document.getElementById('vendor-analytics-anchor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof el.focus === 'function') el.focus({ preventScroll: true });
      return;
    }
    n++;
    if (n < 50) setTimeout(tick, 120);
  }
  tick();
}

function viewAllOrders() {
  showPage('vendor');
  setTimeout(function () {
    switchVendorSection('orders');
  }, 80);
}

function addProduct() {
  showPage('vendor');
  setTimeout(function () {
    switchVendorSection('upload');
  }, 80);
}

function viewAnalytics() {
  if (State.currentPage !== 'vendor-dashboard') {
    showPage('vendor-dashboard');
  }
  scrollToVendorAnalyticsAnchor();
  toast('Revenue chart and weekly stats', 'default');
}

function viewSettings() {
  showPage('account');
}

function exportVendorCsvEscape(val) {
  var s = String(val == null ? '' : val);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function exportData() {
  var d = window.dashboard;
  if (!d || !Array.isArray(d.orders) || !Array.isArray(d.products)) {
    toast('Open your seller dashboard first, then export again.', 'default');
    return;
  }
  var lines = [];
  lines.push('orders');
  lines.push(
    ['tracking', 'status', 'total_tnd', 'client', 'phone', 'wilaya', 'created_at']
      .map(exportVendorCsvEscape)
      .join(',')
  );
  (d.orders || []).forEach(function (o) {
    lines.push(
      [
        o.tracking_number || o.id,
        o.status,
        o.total != null ? o.total : o.amount,
        o.client_name,
        o.phone,
        o.wilaya,
        o.created_at || o.date,
      ]
        .map(exportVendorCsvEscape)
        .join(',')
    );
  });
  lines.push('');
  lines.push('products');
  lines.push(['id', 'name', 'price_tnd', 'stock'].map(exportVendorCsvEscape).join(','));
  (d.products || []).forEach(function (p) {
    lines.push([p.id, p.name, p.price, p.stock].map(exportVendorCsvEscape).join(','));
  });
  var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'everest-vendor-export-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV download started (orders + products from this session)', 'success');
}

function refreshMap() {
  if (window.dashboard && typeof window.dashboard.initMap === 'function') {
    window.dashboard.initMap();
    toast('Map refreshed', 'success');
  } else {
    toast('Map is not ready yet', 'default');
  }
}

// ── VENDOR DASHBOARD ──
function renderVendor() {
  if (!State.currentUser) {
    if (typeof STNLog !== 'undefined') STNLog.info('vendor.page', 'no session; redirect to auth', {});
    showPage('auth');
    return;
  }
  
  if (typeof STNLog !== 'undefined') STNLog.debug('vendor.page', 'render', STNLog.sanitize(State.currentUser));
  
  const page = document.getElementById('page-vendor');
  if (!page) {
    if (typeof STNLog !== 'undefined') STNLog.warn('vendor.page', 'element missing', { id: 'page-vendor' });
    return;
  }
  
  page.innerHTML = buildVendorHTML();
  switchVendorSection('overview');
}

function buildVendorHTML() {
  var u = State.currentUser;
  var shopName = u.shop_name || u.shopName || 'My Shop';
  var isVerified = u.verified;
  var tabs = [
    {id:'overview', label:'Overview'},
    {id:'dashboard', label:'📊 Dashboard'},
    {id:'upload', label:'Upload Product'},
    {id:'inventory', label:'My Products'},
    {id:'orders', label:'My Orders'}
  ];
  var tabsHTML = tabs.map(function(t) {
    return '<button id="vnd-nav-'+t.id+'" onclick="switchVendorSection(\'' + t.id + '\')" style="background:none;border:none;border-bottom:2px solid transparent;padding:0.875rem 1.25rem;cursor:pointer;font-size:0.875rem;font-weight:500;color:#6b7280;font-family:Outfit,sans-serif;white-space:nowrap;transition:all 0.15s">'+t.label+'</button>';
  }).join('');
  return '<div style="background:#f9fafb;min-height:100vh">'
    + '<div style="background:white;border-bottom:2px solid #e5e7eb;padding:0 2rem;display:flex;align-items:center;gap:1rem;overflow-x:auto;flex-wrap:wrap">'
    + '<span style="font-size:0.9rem;font-weight:700;color:#7c3aed;padding:0.875rem 0;margin-right:0.5rem;white-space:nowrap;flex-shrink:0">&#127978; '+shopName+'</span>'
    + '<span style="font-size:0.7rem;font-weight:600;color:'+(isVerified?'#059669':'#d97706')+';padding:0.2rem 0.6rem;background:'+(isVerified?'#f0fdf4':'#fffbeb')+';border-radius:20px;flex-shrink:0">'+(isVerified?'Verified':'Pending')+'</span>'
    + '<div style="display:flex;flex:1;min-width:0">' + tabsHTML + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;padding:0.5rem 0;flex-shrink:0">'
    + '<button type="button" onclick="showPage(\'account\')" style="background:#f5f3ff;color:#5b21b6;border:1px solid #ddd6fe;padding:0.45rem 0.85rem;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif">Account</button>'
    + '<button type="button" onclick="logout()" style="background:#7c3aed;color:white;border:none;padding:0.45rem 0.85rem;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif">Log out</button>'
    + '<button type="button" onclick="deleteMyAccount()" style="background:white;color:#b91c1c;border:1px solid #fecaca;padding:0.45rem 0.85rem;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif">Delete account</button>'
    + '</div>'
    + '</div>'
    + '<div style="padding:2rem" id="vendor-content"></div>'
    + '</div>';
}

function buildVendorCategorySelectOptionsHTML() {
  var cats = (typeof STN !== 'undefined' && STN.PRODUCT_CATEGORIES) ? STN.PRODUCT_CATEGORIES : [];
  var parts = ['<option value="">— Select category —</option>'];
  for (var i = 0; i < cats.length; i++) {
    var c = cats[i];
    parts.push('<option value="' + c.slug + '">' + c.label + '</option>');
  }
  parts.push('<option value="__new__">+ Other (new category)…</option>');
  return parts.join('');
}

function onVendorCategoryChange(val) {
  var wrap = document.getElementById('vp-cat-other-wrap');
  var input = document.getElementById('vp-cat-other');
  if (wrap) wrap.style.display = val === '__new__' ? 'block' : 'none';
  if (input && val !== '__new__') input.value = '';
}

/** Drop optional UI fields when PostgREST reports missing columns (emoji, badge, etc.). */
function vendorUploadSlimProductPayload(p) {
  var o = Object.assign({}, p);
  delete o.emoji;
  delete o.badge;
  delete o.verified;
  delete o.reviews;
  delete o.rating;
  return o;
}

function switchVendorSection(section) {
  console.log('🔄 switchVendorSection:', section);

  // Guard: ensure products are always available
  if (!State.products || !Array.isArray(State.products)) {
    State.products = STN.DB.get('products') || [];
  }

  // Highlight active tab
  document.querySelectorAll('[id^="vnd-nav-"]').forEach(function(el) {
    el.style.borderBottomColor = 'transparent';
    el.style.color = '#6b7280';
    el.style.fontWeight = '500';
    el.classList.remove('vnd-active');
  });
  var vActive = document.getElementById('vnd-nav-' + section);
  if (vActive) {
    vActive.style.borderBottomColor = '#7c3aed';
    vActive.style.color = '#7c3aed';
    vActive.style.fontWeight = '700';
    vActive.classList.add('vnd-active');
  }

  // Dashboard tab → go to full dashboard page
  if (section === 'dashboard') {
    showPage('vendor-dashboard');
    return;
  }

  var content = document.getElementById('vendor-content');
  if (!content) { console.warn('vendor-content not found'); return; }

  var u = State.currentUser || {};
  var shopName = u.shop_name || u.shopName || u.name || '';
  var myProds = (State.products || []).filter(function(p) {
    return p.vendorId === u.id || (shopName && p.brand === shopName);
  });
  var orders = STN.DB.get('orders') || [];

  try {

  if (section === 'overview') {
    var pendingOrds = orders.filter(function(o){ return o.status==='pending'; }).length;
    var totalRev = orders.reduce(function(s,o){ return s+(o.total||0); }, 0);
    var recentOrds = orders.slice().reverse().slice(0,5);
    var today = new Date().toLocaleDateString('en-GB', {weekday:'long',day:'numeric',month:'long'});
    var statusBg = u.verified ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#d97706,#b45309)';
    var statusText = u.verified ? '&#9989; Live' : '&#9203; Pending';
    var statusDesc = u.verified ? 'Products visible to customers' : 'Waiting for admin approval';

    var recentHTML = recentOrds.length === 0
      ? '<p style="text-align:center;color:#9ca3af;padding:2rem">No orders yet</p>'
      : recentOrds.map(function(o){
          var sc = o.status==='delivered'?'#dcfce7':o.status==='shipped'?'#dbeafe':'#fef9c3';
          var st = o.status==='delivered'?'#166534':o.status==='shipped'?'#1d4ed8':'#92400e';
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid #f3f4f6">'
            +'<div><div style="font-size:0.82rem;font-weight:600;color:#111827">'+(o.tracking_number||o.id||'—')+'</div>'
            +'<div style="font-size:0.72rem;color:#9ca3af">'+(o.notes||o.phone||'Guest')+'</div></div>'
            +'<div style="text-align:right"><div style="font-size:0.82rem;font-weight:700">'+(o.total||0).toLocaleString()+' TND</div>'
            +'<span style="font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:20px;background:'+sc+';color:'+st+'">'+(o.status||'pending')+'</span></div>'
            +'</div>';
        }).join('');

    content.innerHTML = '<div>'
      +'<div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;font-weight:700;color:#111827">Welcome back, '+(u.first_name||u.firstName||u.name||'Vendor')+'! 👋</h1>'
      +'<p style="color:#6b7280;font-size:0.875rem">'+today+'</p></div>'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">My Products</div><div style="font-size:1.8rem;font-weight:700;color:#7c3aed">'+myProds.length+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Total Orders</div><div style="font-size:1.8rem;font-weight:700;color:#2563eb">'+orders.length+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Pending</div><div style="font-size:1.8rem;font-weight:700;color:#d97706">'+pendingOrds+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Revenue</div><div style="font-size:1.4rem;font-weight:700;color:#059669">'+totalRev.toLocaleString()+' TND</div></div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 280px;gap:1.5rem">'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">'
      +'<h3 style="font-size:0.95rem;font-weight:600;color:#111827">Recent Orders</h3>'
      +'<button onclick="switchVendorSection(\'orders\')" style="color:#7c3aed;background:none;border:none;font-size:0.8rem;cursor:pointer;font-weight:600">View All</button></div>'
      +recentHTML+'</div>'
      +'<div style="display:flex;flex-direction:column;gap:1rem">'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem">'
      +'<h3 style="font-size:0.9rem;font-weight:600;color:#111827;margin-bottom:0.875rem">Quick Actions</h3>'
      +'<button onclick="switchVendorSection(\'upload\')" style="width:100%;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.65rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;margin-bottom:0.5rem;display:block">+ Upload Product</button>'
      +'<button onclick="switchVendorSection(\'orders\')" style="width:100%;background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.65rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;margin-bottom:0.5rem;display:block">View Orders</button>'
      +'<button onclick="showPage(\'products\')" style="width:100%;background:#f9fafb;color:#374151;border:1px solid #e5e7eb;padding:0.65rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;display:block">View Store</button>'
      +'</div>'
      +'<div style="background:'+statusBg+';border-radius:12px;padding:1.25rem;color:white">'
      +'<div style="font-size:0.72rem;opacity:0.8;margin-bottom:0.3rem">Shop Status</div>'
      +'<div style="font-size:1.2rem;font-weight:700;margin-bottom:0.4rem">'+statusText+'</div>'
      +'<div style="font-size:0.75rem;opacity:0.8">'+statusDesc+'</div>'
      +'</div>'
      +'</div></div></div>';

  } else if (section === 'upload') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem">
          <h1 id="vp-form-title" style="font-size:1.5rem;font-weight:700;color:#111827">Upload Product</h1>
          <p id="vp-form-subtitle" style="color:#6b7280;font-size:0.875rem">Add a new product to your shop</p>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;max-width:700px">
          <div style="margin-bottom:1.5rem">
            <label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.5rem">Product Image</label>
            <div id="upload-zone" onclick="document.getElementById('vp-image-file').click()" style="border:2px dashed #e9d5ff;border-radius:10px;padding:2rem;text-align:center;cursor:pointer;background:#fafafa" onmouseover="this.style.borderColor='#7c3aed';this.style.background='#f5f3ff'" onmouseout="this.style.borderColor='#e9d5ff';this.style.background='#fafafa'">
              <div id="upload-preview" style="display:none;margin-bottom:1rem"></div>
              <div id="upload-placeholder"><div style="font-size:2rem;margin-bottom:0.5rem">📸</div><p style="color:#6b7280;margin-bottom:0.25rem;font-size:0.875rem;font-weight:500">Click to upload up to 4 images</p></div>
              <div id="upload-loading" style="display:none"><div style="font-size:1.5rem">⏳</div><p style="color:#7c3aed;font-size:0.85rem">Uploading...</p></div>
            </div>
            <input type="file" id="vp-image-file" accept="image/*" multiple style="display:none" onchange="uploadVendorImages(this)"/>
            <input type="hidden" id="vp-image-url"/>
            <input type="hidden" id="vp-edit-id"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Product Name *</label><input type="text" id="vp-title" placeholder="e.g. Velvet Sultan Sofa" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Brand Name *</label><input type="text" id="vp-brand" placeholder="Your brand" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
          </div>
          <div style="margin-bottom:1rem"><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Description *</label><textarea id="vp-desc" placeholder="Describe your product..." style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;min-height:100px;resize:vertical;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Price (TND) *</label><input type="number" id="vp-price" placeholder="1299" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Old Price</label><input type="number" id="vp-old-price" placeholder="1599" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Stock *</label><input type="number" id="vp-stock" placeholder="10" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Category *</label>
              <select id="vp-cat" onchange="onVendorCategoryChange(this.value)" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;background:white;outline:none;box-sizing:border-box">
                ${buildVendorCategorySelectOptionsHTML()}
              </select>
              <div id="vp-cat-other-wrap" style="display:none;margin-top:0.5rem">
                <label style="display:block;font-size:0.75rem;font-weight:600;color:#374151;margin-bottom:0.35rem">New category (slug)</label>
                <input type="text" id="vp-cat-other" placeholder="e.g. artisan_leather" autocomplete="off" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.875rem;box-sizing:border-box"/>
                <p style="font-size:0.7rem;color:#6b7280;margin-top:0.35rem;line-height:1.35">Lowercase letters, numbers, underscores. We register it in the database when a <code style="font-size:0.65rem">categories</code> table exists; otherwise the product still saves with this category text.</p>
              </div>
            </div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Badge (optional)</label><input type="text" id="vp-badge" placeholder="New, Bestseller..." style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:0.75rem">
            <button id="vp-submit-btn" onclick="uploadProduct()" style="background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;width:100%">Upload Product →</button>
            <button id="vp-cancel-edit-btn" onclick="cancelVendorProductEdit()" style="display:none;background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;padding:0.875rem 1rem;border-radius:8px;font-size:0.85rem;font-weight:600;cursor:pointer">Cancel Edit</button>
          </div>
        </div>
      </div>`;
    vendorSetUploadMode(null);

  } else if (section === 'inventory') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">
          <div><h1 style="font-size:1.5rem;font-weight:700;color:#111827">My Products</h1>
          <p style="color:#6b7280;font-size:0.875rem">${myProds.length} products in your shop</p></div>
          <button onclick="switchVendorSection('upload')" style="background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.7rem 1.25rem;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer">+ Add Product</button>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          ${myProds.length === 0
            ? '<div style="text-align:center;padding:4rem;color:#9ca3af"><div style="font-size:3rem;margin-bottom:1rem">📦</div><p style="font-weight:500;margin-bottom:0.5rem">No products yet</p><p style="font-size:0.875rem">Upload your first product to start selling!</p></div>'
            : `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
                <thead><tr style="background:#f9fafb">${['Product','Price','Stock','Status','Action'].map(h=>`<th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">${h}</th>`).join('')}</tr></thead>
                <tbody>${myProds.map(p=>`
                  <tr style="border-top:1px solid #f3f4f6">
                    <td style="padding:0.875rem 1rem"><div style="display:flex;align-items:center;gap:0.75rem">
                      <div style="width:40px;height:40px;background:#f5f3ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">${p.emoji||'📦'}</div>
                      <div><div style="font-size:0.82rem;font-weight:600;color:#111827">${p.name}</div><div style="font-size:0.72rem;color:#9ca3af">${p.cat||p.category||''}</div></div>
                    </div></td>
                    <td style="padding:0.875rem 1rem;font-size:0.875rem;font-weight:600;color:#111827">${(p.price||0).toLocaleString()} TND</td>
                    <td style="padding:0.875rem 1rem;font-size:0.875rem"><span style="color:${(p.stock||0)>5?'#059669':'#dc2626'};font-weight:600">${p.stock||0} units</span></td>
                    <td style="padding:0.875rem 1rem"><span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:${p.verified?'#dcfce7':'#fef9c3'};color:${p.verified?'#166534':'#92400e'}">${p.verified?'✓ Live':'⏳ Pending'}</span></td>
                    <td style="padding:0.875rem 1rem;display:flex;gap:0.45rem;align-items:center">
                      <button onclick='editVendorProduct(${JSON.stringify(p.id)})' style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;padding:0.3rem 0.8rem;border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:600">Edit</button>
                      <button onclick='deleteVendorProduct(${JSON.stringify(p.id)})' style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.3rem 0.8rem;border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:600">Delete</button>
                    </td>
                  </tr>`).join('')}
                </tbody></table></div>`}
        </div>
      </div>`;

  } else if (section === 'orders') {
    var pendingO = orders.filter(function(o){ return o.status==='pending'; });
    var processingO = orders.filter(function(o){ return o.status==='processing'||o.status==='ready'; });
    var doneO = orders.filter(function(o){ return o.status==='shipped'||o.status==='delivered'; });

    var orderRows = orders.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#9ca3af"><div style="font-size:3rem;margin-bottom:1rem">📭</div><p>No orders yet</p></td></tr>'
      : orders.slice().reverse().map(function(o) {
          var isPending = o.status==='pending';
          var isShipped = o.status==='shipped'||o.status==='delivered';
          var isReady = o.status==='ready';
          var statusBadge = isShipped
            ? '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#dcfce7;color:#166534">✓ '+o.status+'</span>'
            : isReady
            ? '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#dbeafe;color:#1d4ed8">📦 Ready</span>'
            : '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#fef9c3;color:#92400e">⏳ New</span>';
          var actionBtn = isShipped
            ? '<span style="color:#9ca3af;font-size:0.75rem">Done</span>'
            : '<button data-oid="'+o.id+'" data-otrack="'+(o.tracking_number||'')+'" class="vendor-confirm-btn" style="background:linear-gradient(135deg,#059669,#047857);color:white;border:none;padding:0.4rem 1rem;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:600">✓ Confirm</button>';
          var items = Array.isArray(o.items) ? o.items.map(function(i){ return i.name||'Item'; }).join(', ').substring(0,40) : '1 item';
          return '<tr style="border-top:1px solid #f3f4f6;'+(isPending?'background:#fffbeb':'')+'">'
            +'<td style="padding:0.75rem 1rem;font-size:0.8rem;font-weight:600;color:#7c3aed">'+(o.tracking_number||o.id||'—')+'</td>'
            +'<td style="padding:0.75rem 1rem"><div style="font-size:0.8rem;font-weight:600;color:#111827">'+(o.notes||o.phone||'Guest')+'</div></td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#374151">'+(o.wilaya||'—')+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#374151;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+items+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.8rem;font-weight:700;color:#111827">'+(o.total||0).toLocaleString()+' TND</td>'
            +'<td style="padding:0.75rem 1rem">'+statusBadge+'</td>'
            +'<td style="padding:0.75rem 1rem">'+actionBtn+'</td>'
            +'</tr>';
        }).join('');

    content.innerHTML = '<div>'
      +'<div style="margin-bottom:1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">'
      +'<div><h1 style="font-size:1.5rem;font-weight:700;color:#111827">My Orders</h1>'
      +'<p style="color:#6b7280;font-size:0.875rem">'+orders.length+' orders · <span style="color:#f59e0b;font-weight:600">'+pendingO.length+' new</span></p></div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">'
      +'<div style="background:white;border:1px solid #fde68a;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#fffbeb;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">⏳</div><div><div style="font-size:1.5rem;font-weight:700;color:#92400e">'+pendingO.length+'</div><div style="font-size:0.78rem;color:#6b7280">New Orders</div></div></div>'
      +'<div style="background:white;border:1px solid #c7d2fe;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">📦</div><div><div style="font-size:1.5rem;font-weight:700;color:#6d28d9">'+processingO.length+'</div><div style="font-size:0.78rem;color:#6b7280">Processing</div></div></div>'
      +'<div style="background:white;border:1px solid #bbf7d0;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">✓</div><div><div style="font-size:1.5rem;font-weight:700;color:#166534">'+doneO.length+'</div><div style="font-size:0.78rem;color:#6b7280">Completed</div></div></div>'
      +'</div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">'
      +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
      +'<thead><tr style="background:#f9fafb"><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Order #</th><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Customer</th><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Region</th><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Items</th><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Total</th><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th><th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase">Action</th></tr></thead>'
      +'<tbody>'+orderRows+'</tbody></table></div></div></div>';

    // Bind confirm buttons
    content.querySelectorAll('.vendor-confirm-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (typeof vendorConfirmOrder === 'function') vendorConfirmOrder(btn.dataset.oid, btn.dataset.otrack);
      });
    });
  }

  } catch(err) {
    if (typeof STNLog !== 'undefined') STNLog.error('vendor.switchSection', err, { section: typeof section !== 'undefined' ? section : '' });
    content.innerHTML = '<div style="text-align:center;padding:4rem;color:#dc2626">'
      +'<div style="font-size:3rem;margin-bottom:1rem">⚠️</div>'
      +'<h3 style="margin-bottom:0.5rem">Something went wrong</h3>'
      +'<p style="margin-bottom:1.5rem;color:#6b7280">'+err.message+'</p>'
      +'<button onclick="location.reload()" style="background:#7c3aed;color:white;border:none;padding:0.75rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Reload Page</button>'
      +'</div>';
  }
}


function vendorConfirmOrder(orderId, trackingNum) {
  if (!confirm('Confirm this order is ready for pickup?')) return;

  var orders = STN.DB.get('orders') || [];
  var idx = orders.findIndex(function(o){ return o.id == orderId || o.tracking_number == trackingNum; });
  if (idx !== -1) {
    orders[idx].status = 'ready';
    STN.DB.set('orders', orders);
  }
  if (typeof SB !== 'undefined' && orderId) {
    SB.updateOrderStatus(orderId, 'ready').catch(function(){});
  }

  toast('Order confirmed! Ready for pickup.', 'success');

  var order = orders[idx] || {};
  var msg = '*New Order Ready - Everest*\n\n'
    + 'Tracking: ' + (order.tracking_number || trackingNum || orderId) + '\n'
    + 'Client: ' + (order.notes || order.phone || 'Guest') + '\n'
    + 'Phone: ' + (order.phone || '-') + '\n'
    + 'Wilaya: ' + (order.wilaya || '-') + '\n'
    + 'Address: ' + (order.address || '-') + '\n'
    + 'Total: ' + ((order.total||0).toLocaleString()) + ' TND';

  var waUrl = 'https://wa.me/?text=' + encodeURIComponent(msg);

  var popup = document.createElement('div');
  popup.id = 'vendor-confirm-popup';
  popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  var inner = document.createElement('div');
  inner.style.cssText = 'background:white;border-radius:16px;padding:2rem;max-width:400px;width:100%;text-align:center';
  inner.innerHTML = '<div style="font-size:2.5rem;margin-bottom:1rem">&#9989;</div>'
    + '<h3 style="font-size:1.2rem;font-weight:700;color:#111827;margin-bottom:0.5rem">Order Ready!</h3>'
    + '<p style="color:#6b7280;font-size:0.85rem;margin-bottom:1.5rem">Send order details to delivery man via WhatsApp</p>';

  var waBtn = document.createElement('a');
  waBtn.href = waUrl;
  waBtn.target = '_blank';
  waBtn.style.cssText = 'display:block;background:#25d366;color:white;text-decoration:none;padding:0.875rem;border-radius:8px;font-weight:700;font-size:0.9rem;margin-bottom:0.75rem';
  waBtn.textContent = 'Send via WhatsApp';
  inner.appendChild(waBtn);

  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'width:100%;background:none;border:1px solid #e5e7eb;color:#6b7280;padding:0.7rem;border-radius:8px;cursor:pointer;font-family:Outfit,sans-serif';
  closeBtn.textContent = 'Close';
  closeBtn.onclick = function() {
    var p = document.getElementById('vendor-confirm-popup');
    if (p) p.remove();
    switchVendorSection('orders');
  };
  inner.appendChild(closeBtn);
  popup.appendChild(inner);
  document.body.appendChild(popup);
}


function renderUploadPreviews(urls) {
  var preview = document.getElementById('upload-preview');
  var placeholder = document.getElementById('upload-placeholder');
  if (!preview || !placeholder) return;
  if (!Array.isArray(urls) || urls.length === 0) {
    preview.style.display = 'none';
    preview.innerHTML = '';
    placeholder.style.display = 'block';
    return;
  }
  preview.style.display = 'grid';
  preview.style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))';
  preview.style.gap = '0.5rem';
  preview.innerHTML = urls.slice(0, 4).map(function (url, idx) {
    var safe = _cardEscapeAttr(url);
    return '<div style="position:relative;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;height:74px;background:#fff">'
      + '<img src="' + safe + '" alt="" style="width:100%;height:100%;object-fit:cover"/>'
      + '<button type="button" onclick="removeVendorUploadImage(' + idx + ')" title="Remove image" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:999px;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:20px">×</button>'
      + '</div>';
  }).join('');
  placeholder.style.display = 'none';
}

function removeVendorUploadImage(index) {
  if (!Array.isArray(State.vendorUploadImageUrls)) State.vendorUploadImageUrls = [];
  State.vendorUploadImageUrls = State.vendorUploadImageUrls.filter(function (_, i) { return i !== index; });
  var hiddenUrl = document.getElementById('vp-image-url');
  if (hiddenUrl) hiddenUrl.value = State.vendorUploadImageUrls[0] || '';
  renderUploadPreviews(State.vendorUploadImageUrls);
}

async function uploadVendorImages(input) {
  const files = Array.from(input.files || []).filter(function (f) { return f && /^image\//i.test(f.type || ''); });
  if (!files.length) return;
  if (!Array.isArray(State.vendorUploadImageUrls)) State.vendorUploadImageUrls = [];
  const remainingSlots = Math.max(0, 4 - State.vendorUploadImageUrls.length);
  if (remainingSlots <= 0) {
    toast('⚠️ You can upload up to 4 images only.', 'error');
    input.value = '';
    return;
  }
  const queue = files.slice(0, remainingSlots);
  if (files.length > queue.length) {
    toast('Only first ' + queue.length + ' image(s) were added (max 4 total).', 'default');
  }
  const placeholder = document.getElementById('upload-placeholder');
  const loading = document.getElementById('upload-loading');
  const preview = document.getElementById('upload-preview');
  const hiddenUrl = document.getElementById('vp-image-url');

  if (!placeholder || !loading || !preview) {
    toast('⚠️ Upload area not found. Open Upload Product again.', 'error');
    return;
  }

  placeholder.style.display = 'none';
  loading.style.display = 'block';

  try {
    for (var i = 0; i < queue.length; i++) {
      const formData = new FormData();
      formData.append('file', queue[i]);
      formData.append('upload_preset', 'Shopping');
      formData.append('cloud_name', 'dzhnza3dn');
      const r = await fetch('https://api.cloudinary.com/v1_1/dzhnza3dn/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await r.json().catch(function () { return {}; });
      if (!r.ok) {
        const msg = (data && (data.error && data.error.message)) || 'HTTP ' + r.status;
        throw new Error(msg);
      }
      if (!data.secure_url) throw new Error('Upload failed: no secure_url');
      State.vendorUploadImageUrls.push(data.secure_url);
      State.vendorUploadImageUrls = State.vendorUploadImageUrls.slice(0, 4);
    }
    if (hiddenUrl) hiddenUrl.value = State.vendorUploadImageUrls[0] || '';
    renderUploadPreviews(State.vendorUploadImageUrls);
    loading.style.display = 'none';
    toast('✦ ' + queue.length + ' image(s) uploaded.', 'success');
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.error('media.cloudinary', e, { files: queue.map(function (f) { return f.name; }) });
    if (loading) loading.style.display = 'none';
    renderUploadPreviews(State.vendorUploadImageUrls);
    toast('⚠️ Upload failed. Check your internet connection.', 'error');
  } finally {
    input.value = '';
  }
}

async function uploadToCloudinary(input) {
  return uploadVendorImages(input);
}

function vendorSetUploadMode(product) {
  var formTitle = document.getElementById('vp-form-title');
  var subtitle = document.getElementById('vp-form-subtitle');
  var submitBtn = document.getElementById('vp-submit-btn');
  var cancelBtn = document.getElementById('vp-cancel-edit-btn');
  var editId = document.getElementById('vp-edit-id');
  var hiddenUrl = document.getElementById('vp-image-url');
  var catSelect = document.getElementById('vp-cat');
  var fields = ['vp-title', 'vp-brand', 'vp-desc', 'vp-price', 'vp-old-price', 'vp-stock', 'vp-badge', 'vp-cat-other'];
  if (!product) {
    State.vendorEditingProductId = null;
    State.vendorUploadImageUrls = [];
    if (editId) editId.value = '';
    fields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    var brandInput = document.getElementById('vp-brand');
    if (brandInput && State.currentUser) {
      brandInput.value = State.currentUser.shop_name || State.currentUser.shopName || '';
    }
    if (catSelect) {
      catSelect.value = '';
      onVendorCategoryChange('');
    }
    if (hiddenUrl) hiddenUrl.value = '';
    if (formTitle) formTitle.textContent = 'Upload Product';
    if (subtitle) subtitle.textContent = 'Add a new product to your shop';
    if (submitBtn) submitBtn.textContent = 'Upload Product →';
    if (cancelBtn) cancelBtn.style.display = 'none';
    renderUploadPreviews([]);
    return;
  }

  State.vendorEditingProductId = product.id;
  State.vendorUploadImageUrls = _productImageList(product);
  if (editId) editId.value = String(product.id);
  var fieldMap = {
    'vp-title': product.name || '',
    'vp-brand': product.brand || '',
    'vp-desc': product.desc || product.description || '',
    'vp-price': product.price != null ? product.price : '',
    'vp-old-price': product.oldPrice != null ? product.oldPrice : '',
    'vp-stock': product.stock != null ? product.stock : '',
    'vp-badge': product.badge || '',
  };
  Object.keys(fieldMap).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = fieldMap[id];
  });
  if (catSelect) {
    catSelect.value = product.cat || product.category || '';
    onVendorCategoryChange(catSelect.value);
  }
  if (hiddenUrl) hiddenUrl.value = State.vendorUploadImageUrls[0] || '';
  if (formTitle) formTitle.textContent = 'Edit Product';
  if (subtitle) subtitle.textContent = 'Update details and photos without deleting the product';
  if (submitBtn) submitBtn.textContent = 'Save Changes →';
  if (cancelBtn) cancelBtn.style.display = 'inline-block';
  renderUploadPreviews(State.vendorUploadImageUrls);
}

function editVendorProduct(productId) {
  var p = (State.products || []).find(function (x) { return String(x.id) === String(productId); });
  if (!p) {
    toast('Product not found.', 'error');
    return;
  }
  switchVendorSection('upload');
  setTimeout(function () { vendorSetUploadMode(p); }, 50);
}

function cancelVendorProductEdit() {
  vendorSetUploadMode(null);
}

/**
 * Ensures session id matches Supabase `users.id`, then returns that id for `products.vendor_id`
 * (text column supports UUID or numeric string — see migration products_vendor_id_text).
 */
async function resolveVendorIdForProductUpload() {
  if (!State.currentUser) return { id: null, err: 'not_signed_in' };
  await healCurrentUserFromSupabase();
  var u = State.currentUser;
  if (!u || u.id == null || String(u.id).trim() === '') {
    return { id: null, err: 'no_id' };
  }
  return { id: String(u.id).trim(), err: null };
}

async function deleteVendorProduct(productId) {
  try {
    // Delete from Supabase first
    await SB.deleteProduct(productId);
    
    // Update local state
    State.products = State.products.filter(p => p.id !== productId);
    STN.DB.set('products', State.products);
    
    toast('Product deleted successfully!', 'success');
    switchVendorSection('inventory');

    // Notify other parts of the app to refresh (Shop page, dashboards, etc.)
    try { window.dispatchEvent(new CustomEvent('products:changed', { detail: { source: 'deleteVendorProduct', productId } })); } catch(e) {}
    
    // Refresh products display if on products page
    if (State.currentPage === 'products') {
      // Re-fetch from Supabase to get the latest data
      await initializeProducts();
      filterAndRenderProducts();
    }
  } catch (error) {
    if (typeof STNLog !== 'undefined') STNLog.error('vendor.deleteProduct', error, { productId });
    toast('⚠️ Failed to delete product. Please try again.', 'error');
  }
}

async function uploadProduct() {
  const title = document.getElementById('vp-title')?.value?.trim();
  const brand = document.getElementById('vp-brand')?.value?.trim();
  const desc = document.getElementById('vp-desc')?.value?.trim();
  const price = parseFloat(document.getElementById('vp-price')?.value);
  const stock = parseInt(document.getElementById('vp-stock')?.value, 10);
  const badge = document.getElementById('vp-badge')?.value?.trim();
  const editProductId = document.getElementById('vp-edit-id')?.value?.trim() || null;
  var imageList = Array.isArray(State.vendorUploadImageUrls) ? State.vendorUploadImageUrls.slice(0, 4) : [];
  if (imageList.length === 0) {
    var singleFallback = document.getElementById('vp-image-url')?.value?.trim();
    if (singleFallback) imageList = [singleFallback];
  }
  const imageUrl = imageList[0] || null;
  var oldPriceField = document.getElementById('vp-old-price')?.value;
  var oldPrice = null;
  if (oldPriceField != null && String(oldPriceField).trim() !== '') {
    var op = parseFloat(String(oldPriceField).trim().replace(',', '.'));
    if (Number.isFinite(op)) oldPrice = op;
  }

  const catSelect = document.getElementById('vp-cat');
  if (!catSelect) {
    toast('⚠️ Upload form is not ready. Open “Upload Product” again.', 'error');
    return;
  }

  const rawCat = (catSelect.value || '').trim();
  if (!rawCat) {
    toast('⚠️ Please select a category.', 'error');
    return;
  }

  if (!title || !brand || !desc || !Number.isFinite(price) || !Number.isFinite(stock)) {
    toast('⚠️ Please fill all required fields (name, brand, description, price, stock).', 'error');
    return;
  }

  if (stock < 0) {
    toast('⚠️ Stock cannot be negative.', 'error');
    return;
  }

  if (!State.currentUser || State.currentUser.role !== 'vendor') {
    toast('⚠️ You must be signed in as a vendor to upload.', 'error');
    return;
  }

  var vendorIdRes = await resolveVendorIdForProductUpload();
  if (!vendorIdRes.id) {
    if (vendorIdRes.err === 'not_signed_in') {
      toast('⚠️ Sign in as a vendor to upload.', 'error');
    } else {
      toast(
        '⚠️ Your profile has no user id, or Supabase could not load your account by email. Use “Create Account” on this site (not demo-only), then sign in with that email. If it persists, check that Row Level Security allows SELECT on public.users for sign-in.',
        'error'
      );
    }
    return;
  }
  var effectiveVendorId = vendorIdRes.id;

  let catSlug = null;
  if (rawCat === '__new__') {
    const customRaw = document.getElementById('vp-cat-other')?.value?.trim() || '';
    const customSlug = STN.slugifyCategoryInput(customRaw);
    if (!customSlug) {
      toast('⚠️ Enter a valid new category (e.g. handwoven_bags). Use letters, numbers, underscores only.', 'error');
      return;
    }
    const asKnown = STN.resolveProductCategorySlug(customSlug);
    if (asKnown) {
      catSlug = asKnown;
    } else {
      var createdRow = null;
      if (typeof SB !== 'undefined' && SB.ensureCategoryRecord) {
        try {
          createdRow = await SB.ensureCategoryRecord(customSlug, customRaw);
        } catch (e) {
          if (typeof STNLog !== 'undefined') STNLog.warn('vendor.uploadProduct', 'ensureCategoryRecord threw', { message: e && e.message });
        }
      }
      catSlug = (createdRow && createdRow.slug) ? createdRow.slug : customSlug;
      if (!createdRow) {
        if (typeof STNLog !== 'undefined') STNLog.info('vendor.uploadProduct', 'using new slug without categories row (table missing or RLS)', { catSlug: catSlug });
      }
    }
  } else {
    catSlug = STN.resolveProductCategorySlug(rawCat);
    if (!catSlug) {
      toast('⚠️ Invalid category. Choose an option from the list.', 'error');
      return;
    }
  }

  var categoryRow = null;
  try {
    if (typeof SB !== 'undefined' && SB.ensureCategoryRecord) {
      var labelHint = (STN.PRODUCT_CATEGORIES || []).find(function (c) { return c.slug === catSlug; });
      categoryRow = await SB.ensureCategoryRecord(catSlug, labelHint ? labelHint.label : catSlug);
    }
  } catch (e) {
    if (typeof STNLog !== 'undefined') STNLog.debug('vendor.uploadProduct', 'ensureCategoryRecord optional failed', { message: e && e.message });
  }

  const newProduct = {
    name: title,
    brand: brand,
    vendorId: effectiveVendorId,
    region: State.currentUser?.wilaya || 'Tunisia',
    cat: catSlug,
    category: catSlug,
    price,
    oldPrice,
    rating: 0,
    reviews: 0,
    badge: badge || null,
    emoji: STN.categoryEmoji(catSlug),
    image: imageUrl,
    image_url: imageUrl,
    product_images: imageList,
    verified: false,
    stock,
    desc,
    created_at: new Date().toISOString(),
  };

  if (categoryRow != null && categoryRow.id != null && categoryRow.id !== undefined) {
    newProduct.category_id = categoryRow.id;
  }

  if (typeof STNLog !== 'undefined') STNLog.debug('vendor.uploadProduct', 'payload', STNLog.sanitize(newProduct));

  try {
    if (typeof SB === 'undefined' || !SB?.createProduct) {
      throw new Error('Supabase client not ready (SB.createProduct missing)');
    }

    toast(editProductId ? '⏳ Saving product changes...' : '⏳ Uploading product...', 'default');
    var errMsg = function (e) { return String(e && e.message ? e.message : e); };
    var tryPayload = Object.assign({}, newProduct);
    var tryOpts;
    var slimmedUi = false;
    var regionRemoved = false;
    var savedProduct = null;
    var maxAttempts = 8;
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        savedProduct = editProductId
          ? await SB.updateProduct(editProductId, tryPayload, tryOpts)
          : await SB.createProduct(tryPayload, tryOpts);
        break;
      } catch (tryErr) {
        var m1 = errMsg(tryErr);
        var recovered = false;
        if (tryPayload.category_id != null && /category_id/i.test(m1) && /Could not find|column|schema|PGRST/i.test(m1)) {
          delete tryPayload.category_id;
          recovered = true;
        } else if (
          tryPayload.category_id != null &&
          /Could not find.*'category'|Could not find the 'category'|schema cache/i.test(m1) &&
          !/category_id/i.test(m1)
        ) {
          tryOpts = { omitCategorySlug: true };
          recovered = true;
        } else if (/Could not find.*'old_price'|Could not find the 'old_price'|column.*old_price/i.test(m1)) {
          delete tryPayload.oldPrice;
          delete tryPayload.old_price;
          recovered = true;
        } else if (/Could not find.*'product_images'|Could not find the 'product_images'|column.*product_images/i.test(m1)) {
          delete tryPayload.product_images;
          recovered = true;
        } else if (!slimmedUi && /Could not find the '(emoji|badge|verified|reviews|rating)' column/i.test(m1)) {
          tryPayload = vendorUploadSlimProductPayload(tryPayload);
          slimmedUi = true;
          recovered = true;
        } else if (!regionRemoved && /Could not find the 'region' column/i.test(m1)) {
          delete tryPayload.region;
          regionRemoved = true;
          recovered = true;
        }
        if (typeof STNLog !== 'undefined' && recovered) {
          STNLog.warn('vendor.uploadProduct', 'retry after API/schema mismatch', { attempt: attempt + 1, snippet: m1.slice(0, 160) });
        }
        if (!recovered) throw tryErr;
      }
    }

    if (!savedProduct) {
      throw new Error('Upload failed after retries. Check Supabase columns and RLS policies.');
    }

    var savedForUi = Object.assign({}, savedProduct || {}, {
      name: title,
      brand: brand,
      desc: desc,
      price: price,
      oldPrice: oldPrice,
      stock: stock,
      badge: badge || null,
      cat: catSlug,
      category: catSlug,
      image: imageUrl,
      image_url: imageUrl,
      product_images: imageList,
      vendorId: effectiveVendorId,
    });

    if (editProductId) {
      var idx = State.products.findIndex(function (p) { return String(p.id) === String(editProductId); });
      if (idx >= 0) State.products[idx] = savedForUi;
      else State.products.push(savedForUi);
    } else {
      State.products.push(savedForUi);
    }
    STN.DB.set('products', State.products);
    vendorSetUploadMode(null);

    toast(editProductId ? '✦ Product updated successfully.' : '✦ Success! Product saved with up to 4 images. Pending admin verification.', 'success');
    showCelebrationOverlay();
    switchVendorSection('inventory');

    if (State.currentPage === 'products') {
      await initializeProducts();
      filterAndRenderProducts();
    }
    try {
      await initializeProducts();
      if (State.currentPage === 'products') filterAndRenderProducts();
    } catch (refreshErr) {}

    try { window.dispatchEvent(new CustomEvent('products:changed', { detail: { source: 'uploadProduct', productId: savedProduct?.id } })); } catch(e) {}
  } catch (error) {
    if (typeof STNLog !== 'undefined') STNLog.error('vendor.uploadProduct', error, { catSlug: catSlug });
    var hint = '';
    if (error && error.message && /category_id/i.test(error.message)) {
      hint = ' If your `products` table has no `category_id` column, remove it from API payloads or add it in Supabase.';
    } else if (error && error.message && /product_images/i.test(error.message)) {
      hint = ' Run migration `supabase/migrations/20260323170000_products_multiple_images.sql` in Supabase SQL editor.';
    } else if (error && error.message && /No product row was updated|row-level security|rls|permission denied/i.test(error.message)) {
      hint = ' Supabase is blocking UPDATE on `public.products`. Add/adjust an UPDATE policy for vendors.';
    } else if (error && error.message && /invalid input syntax for type uuid/i.test(error.message)) {
      hint =
        ' Your `products.vendor_id` column is UUID but vendor ids can be numeric. In Supabase → SQL, run the migration file `supabase/migrations/20260324120000_products_vendor_id_text.sql` once.';
    }
    var actionText = editProductId ? 'save product changes' : 'upload product';
    toast('⚠️ Failed to ' + actionText + ': ' + (error?.message || 'Unknown error') + hint, 'error');
  }
}

// ── CARPENTER ──
function renderCarpenter() {}

function submitCarpenterRequest() {
  const name = document.getElementById('c-name')?.value?.trim();
  const email = document.getElementById('c-email')?.value?.trim();
  const type = document.getElementById('c-ftype')?.value;
  const desc = document.getElementById('c-desc')?.value?.trim();
  if (!name || !email || !type || !desc) { toast('⚠️ Please fill all required fields', 'error'); return; }

  document.getElementById('carp-form').style.display = 'none';
  document.getElementById('carp-success').style.display = 'block';

  const ref = 'CARP-' + Date.now().toString().slice(-6);
  document.getElementById('carp-ref').textContent = ref;
  toast(`✦ Request ${ref} submitted! Artisan will contact you within 24h.`, 'success');
}

// ── LOYALTY ──
function renderLoyalty() {
  initReveal();
  const grid = document.getElementById('loyalty-tiers-grid');
  const promoSection = document.getElementById('loyalty-promo-section');
  if (promoSection) promoSection.style.display = 'none';
  if (!grid) return;
  const u = State.currentUser;

  // Promo codes removed - events only

  // Render tier cards
  grid.innerHTML = STN.LOYALTY_TIERS.map((tier, i) => `
    <div class="tier-card" style="border-color:rgba(107,63,212,0.2);position:relative">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${tier.color};border-radius:var(--radius) var(--radius) 0 0"></div>
      <div class="tier-badge" style="border-color:${tier.color};margin-bottom:1rem">
        ${['🥉','🥈','🥇','💎'][i]}
      </div>
      <div style="font-family:var(--font-display);font-size:1.4rem;color:#1e0a4e;margin-bottom:0.3rem">${tier.name}</div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:1.2rem">${tier.min.toLocaleString()}${tier.max !== Infinity ? '–' + tier.max.toLocaleString() : '+'} pts</div>
      <ul style="text-align:left;display:flex;flex-direction:column;gap:0.5rem">
        ${tier.perks.map(p => `<li style="font-size:0.78rem;color:#3d3460;display:flex;gap:0.5rem;align-items:flex-start"><span style="color:${tier.color};flex-shrink:0;margin-top:1px">◆</span>${p}</li>`).join('')}
      </ul>
      ${u && u.points >= tier.min && u.points <= tier.max ? `<div style="margin-top:1.2rem;font-size:0.7rem;background:rgba(46,213,115,0.1);border:1px solid rgba(46,213,115,0.25);color:var(--success);padding:0.35rem 0.8rem;border-radius:30px;display:inline-block">✓ Your Current Tier</div>` : ''}
    </div>`).join('');
  initReveal();
  setTimeout(function() { document.querySelectorAll('#page-loyalty .reveal').forEach(function(el){el.classList.add('visible');}); }, 100);
}

// ── ABOUT ──
function renderAbout() {
  // Make all reveal elements visible immediately
  setTimeout(function() {
    document.querySelectorAll('#page-about .reveal').forEach(function(el) {
      el.classList.add('visible');
    });
    initReveal();
  }, 50);
}

// ── FLASH SALE TIMER ──
function startFlashTimer() {
  const end = new Date();
  end.setHours(end.getHours() + 5, end.getMinutes() + 30, 0, 0);
  if (State.countdownInterval) clearInterval(State.countdownInterval);
  State.countdownInterval = setInterval(() => {
    const diff = end - new Date();
    if (diff <= 0) { clearInterval(State.countdownInterval); return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.querySelectorAll('.flash-h').forEach(el => el.textContent = String(h).padStart(2,'0'));
    document.querySelectorAll('.flash-m').forEach(el => el.textContent = String(m).padStart(2,'0'));
    document.querySelectorAll('.flash-s').forEach(el => el.textContent = String(s).padStart(2,'0'));
  }, 1000);
}

// ── NEWSLETTER ──
function dismissNewsletter() {
  document.getElementById('newsletter-popup')?.classList.remove('show');
  STN.DB.set('newsletter_dismissed', true);
}

function subscribeNewsletter() {
  const email = document.getElementById('nl-email')?.value?.trim();
  if (!email) { toast('⚠️ Please enter your email', 'error'); return; }
  dismissNewsletter();
      toast(`✦ Subscribed! Welcome to the Everest family 🇹🇳`, 'success');
}

// ── HOME SEARCH ──
function homeSearch() {
  const q = document.getElementById('home-search')?.value?.trim();
  if (q) {
    showPage('products');
    setTimeout(() => {
      const input = document.getElementById('prod-search');
      if (input) { input.value = q; searchProducts(); }
    }, 200);
  } else {
    showPage('products');
  }
}
// Keep compatibility with inline handlers used in index.html
function searchHome() {
  homeSearch();
}
window.homeSearch = homeSearch;
window.searchHome = searchHome;

// ── START ──
document.addEventListener('DOMContentLoaded', init);

// ── E-COMMERCE SIDEBAR FUNCTIONS ──

// Filter state management
const FilterState = {
  categories: [],
  priceMin: 0,
  priceMax: 5000,
  rating: null,
  inStock: true,
  outOfStock: false,
  freeShipping: false,
  cashOnDelivery: false,
  onSale: false,
  sortBy: 'featured'
};

// Toggle sidebar on mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar-card');
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  
  if (sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.remove();
  } else {
    sidebar.classList.add('open');
    document.body.appendChild(overlay);
    overlay.onclick = () => toggleSidebar();
  }
}

// Update price range slider
function updatePriceSlider() {
  const minSlider = document.getElementById('price-min-slider');
  const maxSlider = document.getElementById('price-max-slider');
  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');
  const minDisplay = document.getElementById('price-display-min');
  const maxDisplay = document.getElementById('price-display-max');
  const range = document.getElementById('price-range');
  
  let minVal = parseInt(minSlider.value);
  let maxVal = parseInt(maxSlider.value);
  
  // Ensure min <= max
  if (minVal > maxVal) {
    if (event.target.id === 'price-min-slider') {
      minVal = maxVal;
      minSlider.value = maxVal;
    } else {
      maxVal = minVal;
      maxSlider.value = minVal;
    }
  }
  
  // Update inputs and displays
  minInput.value = minVal;
  maxInput.value = maxVal;
  minDisplay.textContent = `${minVal} TND`;
  maxDisplay.textContent = `${maxVal} TND`;
  
  // Update range visual
  const minPercent = (minVal / 5000) * 100;
  const maxPercent = (maxVal / 5000) * 100;
  range.style.left = `${minPercent}%`;
  range.style.right = `${100 - maxPercent}%`;
  
  // Update filter state and apply
  FilterState.priceMin = minVal;
  FilterState.priceMax = maxVal;
  applyFilters();
}

// Set rating filter
function setRatingFilter(rating) {
  FilterState.rating = rating;
  applyFilters();
}

// Apply all filters
function applyFilters() {
  // Update category filters
  const categoryCheckboxes = document.querySelectorAll('.category-item input[type="checkbox"]');
  FilterState.categories = [];
  
  categoryCheckboxes.forEach(checkbox => {
    if (checkbox.checked && checkbox.value !== 'all') {
      FilterState.categories.push(checkbox.value);
    }
  });
  
  // Handle "All Products" checkbox
  const allCheckbox = document.getElementById('cat-all');
  if (allCheckbox.checked) {
    FilterState.categories = [];
    // Uncheck other categories
    categoryCheckboxes.forEach(cb => {
      if (cb.value !== 'all') cb.checked = false;
    });
  } else {
    // Uncheck "All Products" if any specific category is selected
    if (FilterState.categories.length > 0) {
      allCheckbox.checked = false;
    }
  }
  
  // Update availability filters
  FilterState.inStock = document.getElementById('in-stock').checked;
  FilterState.outOfStock = document.getElementById('out-of-stock').checked;
  
  // Update special offer filters
  const offerCheckboxes = document.querySelectorAll('.offer-item input[type="checkbox"]');
  FilterState.freeShipping = offerCheckboxes[0]?.checked || false;
  FilterState.cashOnDelivery = offerCheckboxes[1]?.checked || false;
  FilterState.onSale = offerCheckboxes[2]?.checked || false;
  
  // Update active filters display
  updateActiveFiltersBar();
  
  // Apply filters to products
  filterAndRenderProducts();
}

// Update active filters bar
function updateActiveFiltersBar() {
  const bar = document.getElementById('active-filters-bar');
  const list = document.getElementById('active-filters-list');
  const filterCount = document.getElementById('filter-count');
  
  const activeFilters = [];
  
  // Add category filters
  FilterState.categories.forEach(cat => {
    const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
    activeFilters.push({ type: 'category', value: cat, label: catName });
  });
  
  // Add price range filter
  if (FilterState.priceMin > 0 || FilterState.priceMax < 5000) {
    activeFilters.push({
      type: 'price',
      value: `${FilterState.priceMin}-${FilterState.priceMax}`,
      label: `${FilterState.priceMin}-${FilterState.priceMax} TND`
    });
  }
  
  // Add rating filter
  if (FilterState.rating !== null) {
    activeFilters.push({
      type: 'rating',
      value: FilterState.rating,
      label: `${FilterState.rating}+ Stars`
    });
  }
  
  // Add availability filters
  if (!FilterState.inStock) {
    activeFilters.push({ type: 'availability', value: 'in-stock', label: 'In Stock' });
  }
  if (FilterState.outOfStock) {
    activeFilters.push({ type: 'availability', value: 'out-of-stock', label: 'Out of Stock' });
  }
  
  // Add special offer filters
  if (FilterState.freeShipping) {
    activeFilters.push({ type: 'offer', value: 'free-shipping', label: 'Free Shipping' });
  }
  if (FilterState.cashOnDelivery) {
    activeFilters.push({ type: 'offer', value: 'cod', label: 'Cash on Delivery' });
  }
  if (FilterState.onSale) {
    activeFilters.push({ type: 'offer', value: 'sale', label: 'On Sale' });
  }
  
  // Update filter count
  filterCount.textContent = activeFilters.length;
  
  // Show/hide active filters bar
  if (activeFilters.length > 0) {
    bar.style.display = 'flex';
    
    // Render filter tags
    list.innerHTML = activeFilters.map(filter => `
      <div class="active-filter-tag">
        ${filter.label}
        <button onclick="removeFilter('${filter.type}', '${filter.value}')">×</button>
      </div>
    `).join('');
  } else {
    bar.style.display = 'none';
  }
}

// Remove individual filter
function removeFilter(type, value) {
  switch (type) {
    case 'category':
      const catCheckbox = document.getElementById(`cat-${value}`);
      if (catCheckbox) catCheckbox.checked = false;
      break;
    case 'price':
      document.getElementById('price-min').value = 0;
      document.getElementById('price-max').value = 5000;
      document.getElementById('price-min-slider').value = 0;
      document.getElementById('price-max-slider').value = 5000;
      FilterState.priceMin = 0;
      FilterState.priceMax = 5000;
      updatePriceSlider();
      return;
    case 'rating':
      const ratingRadio = document.querySelector(`input[name="rating"][value="${value}"]`);
      if (ratingRadio) ratingRadio.checked = false;
      FilterState.rating = null;
      break;
    case 'availability':
      if (value === 'in-stock') {
        document.getElementById('in-stock').checked = true;
      } else if (value === 'out-of-stock') {
        document.getElementById('out-of-stock').checked = false;
      }
      break;
    case 'offer':
      const offerIndex = ['free-shipping', 'cod', 'sale'].indexOf(value);
      const offerCheckbox = document.querySelectorAll('.offer-item input[type="checkbox"]')[offerIndex];
      if (offerCheckbox) offerCheckbox.checked = false;
      break;
  }
  
  applyFilters();
}

// Clear all filters
function clearAllFilters() {
  // Reset checkboxes
  document.querySelectorAll('.category-item input[type="checkbox"]').forEach(cb => {
    cb.checked = cb.value === 'all';
  });
  
  document.querySelectorAll('.offer-item input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  
  document.querySelectorAll('input[name="rating"]').forEach(rb => {
    rb.checked = false;
  });
  
  // Reset availability
  document.getElementById('in-stock').checked = true;
  document.getElementById('out-of-stock').checked = false;
  
  // Reset price
  document.getElementById('price-min').value = 0;
  document.getElementById('price-max').value = 5000;
  document.getElementById('price-min-slider').value = 0;
  document.getElementById('price-max-slider').value = 5000;
  
  // Reset filter state
  FilterState.categories = [];
  FilterState.priceMin = 0;
  FilterState.priceMax = 5000;
  FilterState.rating = null;
  FilterState.inStock = true;
  FilterState.outOfStock = false;
  FilterState.freeShipping = false;
  FilterState.cashOnDelivery = false;
  FilterState.onSale = false;
  
  updatePriceSlider();
  applyFilters();
}

// Filter and render products
function filterAndRenderProducts() {
  let filteredProducts = [...State.products];
  
  // Search filter
  if (State.searchQuery) {
    const query = String(State.searchQuery).toLowerCase();
    filteredProducts = filteredProducts.filter(product => {
      const searchable = [
        product?.name,
        product?.title,
        product?.brand,
        product?.region,
        product?.category,
        product?.cat,
        product?.desc,
        product?.description,
        product?.material,
        product?.color,
      ]
        .filter(v => v !== undefined && v !== null)
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }
  
  // Category filter
  if (FilterState.categories.length > 0) {
    filteredProducts = filteredProducts.filter(product => 
      FilterState.categories.includes(product.category || product.cat)
    );
  }
  
  // Price filter
  filteredProducts = filteredProducts.filter(product => 
    product.price >= FilterState.priceMin && product.price <= FilterState.priceMax
  );
  
  // Rating filter
  if (FilterState.rating !== null) {
    filteredProducts = filteredProducts.filter(product => 
      (product.rating || 0) >= FilterState.rating
    );
  }
  
  // Availability filter
  if (FilterState.inStock && !FilterState.outOfStock) {
    filteredProducts = filteredProducts.filter(product => product.inStock !== false);
  } else if (!FilterState.inStock && FilterState.outOfStock) {
    filteredProducts = filteredProducts.filter(product => product.inStock === false);
  }
  
  // Special offers filters (mock implementation)
  if (FilterState.freeShipping) {
    filteredProducts = filteredProducts.filter(product => 
      product.freeShipping || product.price >= 500
    );
  }
  
  if (FilterState.onSale) {
    filteredProducts = filteredProducts.filter(product => 
      product.oldPrice && product.oldPrice > product.price
    );
  }
  
  // Sort products
  sortProductsArray(filteredProducts, FilterState.sortBy);
  
  // Update results count
  const resultsCount = document.getElementById('results-count');
  if (resultsCount) {
    resultsCount.textContent = filteredProducts.length;
  }
  
  // Render products
  renderProductsGrid(filteredProducts);
}

// Sort products array
function sortProductsArray(products, sortBy) {
  switch (sortBy) {
    case 'price-low':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'newest':
      products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'featured':
    default:
      // Keep original order or implement featured logic
      break;
  }
}

// Sort products (called from dropdown)
function sortProducts(sortBy) {
  FilterState.sortBy = sortBy;
  filterAndRenderProducts();
}

/** Decode `data-stn-pid` from a shop grid product card (safe for numeric + UUID ids). */
function _stnProductsGridPidFromCard(card) {
  if (!card) return null;
  var raw = card.getAttribute('data-stn-pid');
  if (raw == null || raw === '') return null;
  try {
    return decodeURIComponent(raw);
  } catch (e) {
    return raw;
  }
}

/** Same as opening product detail (overlay “Quick View” button). Declared before grid delegate for clarity. */
function quickView(productId) {
  openProductDetail(productId);
}

/**
 * One delegated click handler on #products-grid — avoids fragile inline onclick for Supabase UUIDs / CSP.
 */
function _stnInstallProductsGridClickDelegate(grid) {
  if (!grid || grid.getAttribute('data-stn-delegated') === '1') return;
  grid.setAttribute('data-stn-delegated', '1');
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.product-card[data-stn-pid]');
    if (!card || !grid.contains(card)) return;
    var pid = _stnProductsGridPidFromCard(card);
    if (pid == null || pid === '') {
      return;
    }

    if (e.target.closest('.stn-card-quick')) {
      e.preventDefault();
      e.stopPropagation();
      quickView(pid);
      return;
    }
    if (e.target.closest('.stn-card-cart')) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(pid);
      return;
    }
    if (e.target.closest('.stn-card-wish')) {
      e.preventDefault();
      e.stopPropagation();
      toggleWishlist(pid);
      return;
    }
    if (e.target.closest('button') || e.target.closest('a')) return;
    openProductDetail(pid);
  });
}

// Render products grid
function renderProductsGrid(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  
  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">No products found</h3>
        <p style="color: var(--text-muted);">Try adjusting your filters or search terms</p>
        <button class="btn btn-outline" onclick="clearAllFilters()" style="margin-top: 1rem;">Clear All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map(product => createProductCard(product)).join('');
  _stnInstallProductsGridClickDelegate(grid);
  animateProductCardsEntry(grid);
}

// Create product card HTML (clicks handled by _stnInstallProductsGridClickDelegate on #products-grid)
function createProductCard(product) {
  const isInWishlist = State.wishlist.some(function (w) {
    return String(w) === String(product.id);
  });
  const rating = product.rating || 0;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  var pidEnc = encodeURIComponent(String(product.id));

  return `
    <div class="product-card" data-stn-pid="${pidEnc}">
      <div class="product-img-wrap">
        ${productCardMediaHTML(product)}
        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
        ${product.verified ? `<div class="product-verified">✓ Verified</div>` : ''}
        <div class="product-overlay">
          <button type="button" class="btn btn-white btn-sm stn-card-quick">👁️ Quick View</button>
          <button type="button" class="btn btn-gold btn-sm stn-card-cart">🛒 Add to Cart</button>
        </div>
      </div>
      <div class="product-body">
        <div class="product-brand">${product.brand || 'Everest'}</div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">(${product.reviews || 0})</span>
        </div>
        <div class="product-price-row">
          <span class="price">${product.price} <span class="price-currency">TND</span></span>
          ${product.oldPrice ? `<span class="price-old">${product.oldPrice} TND</span>` : ''}
          <button type="button" class="wishlist-btn stn-card-wish ${isInWishlist ? 'active' : ''}">
            ${isInWishlist ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── VENDOR DASHBOARD FUNCTIONS ──

function buildVendorDashboardHTML() {
  if (typeof STNLog !== 'undefined') STNLog.debug('vendor.dashboard', 'buildVendorDashboardHTML', STNLog.sanitize(State.currentUser));
  
  return `
    <div style="background:#f9fafb;min-height:100vh">
      <!-- Vendor Dashboard Header -->
      <div style="background:white;border-bottom:2px solid #e5e7eb;padding:1.5rem 2rem;display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="font-size:1.8rem;font-weight:700;color:#1e0a4e;margin-bottom:0.25rem">Vendor Dashboard</h1>
          <p style="color:#6b7280;font-size:0.9rem">Welcome back, ${State.currentUser?.name || 'Vendor'}! Here's your business overview.</p>
        </div>
        <div style="display:flex;gap:1rem">
          <button onclick="refreshVendorData()" style="background:#7c3aed;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Refresh</button>
          <button onclick="switchVendorSection('settings')" style="background:transparent;border:2px solid #7c3aed;color:#7c3aed;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">⚙️ Settings</button>
        </div>
      </div>

      <!-- Vendor Dashboard Content -->
      <div style="padding:2rem">
        <!-- KPI Cards -->
        <div id="vendor-kpi-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin-bottom:2rem">
          <!-- KPI cards will be populated by JavaScript -->
        </div>

        <!-- Main Dashboard Grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
          <!-- Left Column: Orders & Inventory -->
          <div style="display:flex;flex-direction:column;gap:2rem">
            <!-- Orders Management -->
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f8f9ff;display:flex;align-items:center;justify-content:space-between">
                <h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📦 Orders Management</h3>
                <div style="display:flex;gap:0.5rem">
                  <button onclick="switchVendorSection('orders')" style="background:#7c3aed;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">View All</button>
                </div>
              </div>
              <div id="vendor-orders-summary" style="padding:1.5rem">
                <!-- Orders summary will be populated by JavaScript -->
              </div>
            </div>

            <!-- Inventory Management -->
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f0fdf4;display:flex;align-items:center;justify-content:space-between">
                <h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📊 Inventory Management</h3>
                <div style="display:flex;gap:0.5rem">
                  <button onclick="switchVendorSection('inventory')" style="background:#059669;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">Manage</button>
                </div>
              </div>
              <div id="vendor-inventory-summary" style="padding:1.5rem">
                <!-- Inventory summary will be populated by JavaScript -->
              </div>
            </div>
          </div>

          <!-- Right Column: Analytics & Logistics -->
          <div style="display:flex;flex-direction:column;gap:2rem">
            <!-- Sales Analytics -->
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#fef3c7;display:flex;align-items:center;justify-content:space-between">
                <h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📈 Sales Analytics</h3>
                <div style="display:flex;gap:0.5rem">
                  <select id="analytics-period" onchange="updateVendorAnalytics()" style="border:1px solid #e5e7eb;border-radius:6px;padding:0.5rem;font-size:0.8rem;color:#1e0a4e">
                    <option value="7">Last 7 days</option>
                    <option value="30" selected>Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                </div>
              </div>
              <div id="vendor-analytics-chart" style="padding:1.5rem;height:300px;position:relative">
                <!-- Analytics chart will be populated by JavaScript -->
              </div>
            </div>

            <!-- Logistics Tracking -->
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
              <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f0f9ff;display:flex;align-items:center;justify-content:space-between">
                <h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">🚚 Logistics Tracking</h3>
                <div style="display:flex;gap:0.5rem">
                  <button onclick="switchVendorSection('logistics')" style="background:#2563eb;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">Live Map</button>
                </div>
              </div>
              <div id="vendor-logistics-map" style="min-height:420px;position:relative">
                <!-- Logistics map will be populated by JavaScript -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── VENDOR DASHBOARD DATA LOADING ──

async function ensureVendorDataLoaded() {
  console.log('🔄 Ensuring vendor data is loaded...');
  
  // Check if products are loaded
  if (!State.products || State.products.length === 0) {
    console.log('📦 Products not loaded, loading from Supabase...');
    try {
      await initializeProducts();
      console.log('✅ Products loaded from Supabase:', State.products.length);
    } catch (error) {
      console.error('Failed to load products:', error);
      throw new Error('Failed to load products data');
    }
  }
  
  // Check if orders are loaded
  const orders = STN.DB.get('orders') || [];
  if (orders.length === 0) {
    console.log('📋 Orders not loaded, initializing...');
    try {
      // Try to load orders from Supabase if available
      if (typeof SB !== 'undefined' && SB.getOrders) {
        const supabaseOrders = await SB.getOrders();
        if (supabaseOrders && supabaseOrders.length > 0) {
          STN.DB.set('orders', supabaseOrders);
          console.log('✅ Orders loaded from Supabase:', supabaseOrders.length);
        }
      }
    } catch (error) {
      console.warn('Could not load orders from Supabase, using local data');
    }
  }
  
  console.log('✅ Vendor data loading complete');
  console.log('📊 Final data state:', {
    products: State.products.length,
    orders: (STN.DB.get('orders') || []).length,
    vendorId: State.currentUser?.id
  });
  return true;
}

async function initializeVendorDashboard(rootEl) {
  const root = rootEl || document.getElementById('page-vendor-dashboard');
  if (!root) { console.error('No root for vendor dashboard'); return; }

  // Ensure products available
  if (!State.products || !Array.isArray(State.products) || State.products.length === 0) {
    State.products = STN.DB.get('products') || [];
  }
  
  console.log('✅ Vendor access check passed - user is vendor');
  console.log('🔍 Vendor user details:', {
    id: State.currentUser.id,
    email: State.currentUser.email,
    role: State.currentUser.role,
    firstName: State.currentUser.firstName
  });
  
  // Show loading states
  const kpiContainer = document.getElementById('vendor-kpi-cards');
  const ordersContainer = document.getElementById('vendor-orders-summary');
  const inventoryContainer = document.getElementById('vendor-inventory-summary');
  const analyticsContainer = document.getElementById('vendor-analytics-chart');
  const logisticsContainer = document.getElementById('vendor-logistics-map');
  
  // Show loading indicators
  if (kpiContainer) kpiContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading KPIs...</div>';
  if (ordersContainer) ordersContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading orders...</div>';
  if (inventoryContainer) inventoryContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading inventory...</div>';
  if (analyticsContainer) analyticsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading analytics...</div>';
  if (logisticsContainer) logisticsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading logistics...</div>';
  
  try {
    console.log('🔄 Loading all components...');
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('⏰ Dashboard loading timeout - showing partial results');
      const containers = [kpiContainer, ordersContainer, inventoryContainer, analyticsContainer, logisticsContainer];
      containers.forEach(container => {
        if (container && container.innerHTML.includes('Loading')) {
          container.innerHTML = '<div style="text-align:center;padding:2rem;color:#dc2626">⚠️ Loading timeout - please refresh</div>';
        }
      });
    }, 10000); // 10 second timeout
    
    const results = await Promise.allSettled([
      safeLoadKPIs(),
      safeLoadOrders(),
      safeLoadInventory(),
      safeLoadAnalytics(),
      safeLoadLogistics()
    ]);
    
    clearTimeout(loadingTimeout);
    
    // Check results
    const failures = results.filter(r => r.status === 'rejected');
    const successes = results.filter(r => r.status === 'fulfilled');
    
    console.log(`📊 Results: ${successes.length} successful, ${failures.length} failed`);
    
    if (failures.length > 0) {
      console.error('❌ Some components failed to load:', failures);
      // Show partial success
      console.log('✅ Vendor dashboard partially loaded');
    } else {
      console.log('✅ All vendor dashboard components loaded successfully');
    }
    
    // Hide loading states
    const allContainers = [kpiContainer, ordersContainer, inventoryContainer, analyticsContainer, logisticsContainer];
    allContainers.forEach(container => {
      if (container && container.innerHTML.includes('Loading')) {
        console.log('✅ Component loading completed');
      }
    });
    
  } catch (error) {
    console.error('❌ Critical error initializing vendor dashboard:', error);
    
    // Show error state
    document.getElementById('page-vendor-dashboard').innerHTML = `
      <div style="text-align:center;padding:4rem;color:#dc2626">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h2 style="margin-bottom:0.5rem;color:#dc2626">Dashboard Initialization Failed</h2>
        <p style="margin-bottom:2rem;color:#dc2626">Unable to load vendor dashboard. Please try refreshing the page.</p>
        <button onclick="location.reload()" style="background:#dc2626;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Refresh Page</button>
      </div>
    `;
  }
}


// Safe data loading with timeout
async function safeLoadData() {
  const vendorId = State.currentUser?.id;

  function normalizeProduct(p) {
    if (!p || typeof p !== 'object') return p;
    // Back-compat normalization: DB might use `category`/`description`
    if (p.cat == null && p.category != null) p.cat = p.category;
    if (p.desc == null && p.description != null) p.desc = p.description;
    return p;
  }

  function normalizeOrder(o) {
    if (!o || typeof o !== 'object') return o;
    // Back-compat normalization: DB might use snake_case
    if (o.vendorId == null && o.vendor_id != null) o.vendorId = o.vendor_id;
    if (o.userId == null && o.user_id != null) o.userId = o.user_id;
    return o;
  }

  if (!State.products || !Array.isArray(State.products) || State.products.length === 0) {
    var cachedP = STN.DB.get('products');
    if (Array.isArray(cachedP)) State.products = cachedP;
  }

  if (typeof SB !== 'undefined' && SB?.getProducts) {
    try {
      const sp = await SB.getProducts();
      if (Array.isArray(sp)) {
        State.products = sp.map(normalizeProduct);
        STN.DB.set('products', State.products);
        refreshProductViewsAfterCatalogLoad();
      }
    } catch (e) {
      // Non-fatal: keep whatever is in memory/local
    }
  }

  if (typeof SB !== 'undefined') {
    try {
      let ords = null;
      if (vendorId && SB.getVendorOrders) {
        ords = await SB.getVendorOrders(vendorId);
      } else if (SB.getOrders) {
        ords = await SB.getOrders();
      }

      if (Array.isArray(ords) && ords.length > 0) {
        const normalized = ords.map(normalizeOrder);
        STN.DB.set('orders', normalized);
      }
    } catch (e) {
      // Non-fatal
    }
  }

  return true;
}

// Safe KPI loading
async function safeLoadKPIs() {
  try {
    const vendorId = State.currentUser?.id;
    if (typeof STNLog !== 'undefined') STNLog.debug('vendor.kpi', 'load', { vendorId });
    
    if (!vendorId) {
      if (typeof STNLog !== 'undefined') STNLog.warn('vendor.kpi', 'no vendor id', STNLog.sanitize(State.currentUser));
      return null;
    }

    // Wait for data
    await safeLoadData();
    
    const orders = STN.DB.get('orders') || [];
    const products = State.products || [];
    if (typeof STNLog !== 'undefined') STNLog.debug('vendor.kpi', 'dataset sizes', { products: products.length, orders: orders.length });
    
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);
    const vendorProducts = products.filter(p => p.vendorId === vendorId);
    
    if (typeof STNLog !== 'undefined') STNLog.debug('vendor.kpi', 'vendor slice', { vendorProducts: vendorProducts.length, vendorOrders: vendorOrders.length });

    // If no products found, show empty state
    if (vendorProducts.length === 0) {
      console.warn('⚠️ No products found for vendor', vendorId);
      const kpiContainer = document.getElementById('vendor-kpi-cards');
      if (kpiContainer) {
        kpiContainer.innerHTML = `
          <div style="text-align:center;padding:3rem;color:#9ca3af">
            <div style="font-size:3rem;margin-bottom:1rem">📦</div>
            <h3 style="margin-bottom:0.5rem;color:#1e0a4e">No Products Found</h3>
            <p style="margin-bottom:1.5rem">You haven't added any products yet.</p>
            <button onclick="switchVendorSection('upload')" style="background:#7c3aed;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">Add Your First Product</button>
          </div>
        `;
      }
      return true;
    }

    // Calculate KPIs safely
    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const dailySales = vendorOrders.filter(o => new Date(o.created_at) >= new Date(today.getTime() - 24 * 60 * 60 * 1000));
    const weeklySales = vendorOrders.filter(o => new Date(o.created_at) >= thisWeek);
    const monthlySales = vendorOrders.filter(o => new Date(o.created_at) >= thisMonth);
    
    const totalRevenue = vendorOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue = vendorOrders.length > 0 ? totalRevenue / vendorOrders.length : 0;
    const deliveredOrders = vendorOrders.filter(o => o.status === 'delivered');
    const conversionRate = vendorOrders.length > 0 ? (deliveredOrders.length / vendorOrders.length * 100) : 0;
    
    const lowStockProducts = vendorProducts.filter(p => (p.stock || 0) < 10);

    // Real change indicators (no fake +12% etc.)
    function pctChange(curr, prev) {
      if (!prev) return curr ? '+100%' : '0%';
      const v = ((curr - prev) / prev) * 100;
      const sign = v > 0 ? '+' : '';
      return sign + v.toFixed(0) + '%';
    }

    const now = Date.now();
    const prevDayStart = new Date(now - 48 * 60 * 60 * 1000);
    const lastDayStart = new Date(now - 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const prevDayOrders = vendorOrders.filter(o => new Date(o.created_at) >= prevDayStart && new Date(o.created_at) < lastDayStart);
    const prevWeekOrders = vendorOrders.filter(o => new Date(o.created_at) >= prevWeekStart && new Date(o.created_at) < lastWeekStart);
    const lastWeekOrders = vendorOrders.filter(o => new Date(o.created_at) >= lastWeekStart);

    const prevWeekRevenue = prevWeekOrders.reduce((s, o) => s + (o.total || 0), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + (o.total || 0), 0);

    console.log('💰 KPIs calculated:', {
      dailySales: dailySales.length,
      weeklySales: weeklySales.length,
      monthlySales: monthlySales.length,
      totalRevenue,
      averageOrderValue,
      conversionRate,
      lowStockProducts: lowStockProducts.length
    });

    // Generate KPI cards
    const kpiCards = [
      {
        title: 'Daily Sales',
        value: dailySales.length,
        change: pctChange(dailySales.length, prevDayOrders.length),
        icon: '💰',
        color: '#7c3aed',
        bg: '#f5f3ff'
      },
      {
        title: 'Weekly Sales',
        value: weeklySales.length,
        change: pctChange(weeklySales.length, prevWeekOrders.length),
        icon: '📊',
        color: '#059669',
        bg: '#ecfdf5'
      },
      {
        title: 'Total Revenue',
        value: totalRevenue.toLocaleString() + ' TND',
        change: pctChange(lastWeekRevenue, prevWeekRevenue),
        icon: '💵',
        color: '#2563eb',
        bg: '#eff6ff'
      },
      {
        title: 'Conversion Rate',
        value: conversionRate.toFixed(1) + '%',
        change: 'Based on delivered / total',
        icon: '🎯',
        color: '#d97706',
        bg: '#fffbeb'
      },
      {
        title: 'Avg Order Value',
        value: averageOrderValue.toFixed(0) + ' TND',
        change: vendorOrders.length ? 'Live' : '—',
        icon: '📊',
        color: '#7c3aed',
        bg: '#f5f3ff'
      },
      {
        title: 'Low Stock Alerts',
        value: lowStockProducts.length,
        change: lowStockProducts.length > 0 ? '⚠️ Action needed' : '✅ All good',
        icon: '📦',
        color: lowStockProducts.length > 0 ? '#dc2626' : '#059669',
        bg: lowStockProducts.length > 0 ? '#fee2e2' : '#ecfdf5'
      }
    ];

    const kpiHTML = kpiCards.map(kpi => `
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem;transition:transform 0.2s,box-shadow 0.2s;cursor:pointer"
           onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
        <div style="display:flex;align-items:center;gap:1rem">
          <div style="width:48px;height:48px;background:${kpi.bg};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">
            ${kpi.icon}
          </div>
          <div>
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:0.25rem">${kpi.title}</div>
            <div style="font-size:1.75rem;font-weight:700;color:#1e0a4e;line-height:1">${kpi.value}</div>
          </div>
        </div>
        ${(() => {
          const ch = String(kpi.change || '');
          const isPct = /^[+-]?\d/.test(ch);
          const isPositive = ch.startsWith('+');
          const bg = !isPct ? '#f3f4f6' : (isPositive ? '#dcfce7' : '#fee2e2');
          const fg = !isPct ? '#374151' : (isPositive ? '#166534' : '#dc2626');
          return `<div style="background:${bg};color:${fg};padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600">${ch}</div>`;
        })()}
      </div>
    `).join('');

    const container = document.getElementById('vendor-kpi-cards');
    if (container) {
      container.innerHTML = kpiHTML;
      console.log('✅ KPIs loaded successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error loading KPIs:', error);
    return false;
  }
}

// Safe orders loading
async function safeLoadOrders() {
  try {
    console.log('🔄 Loading orders...');
    const vendorId = State.currentUser?.id;
    console.log('🔍 Fetching orders for Vendor:', vendorId);
    
    if (!vendorId) {
      console.error('❌ No vendor ID found for orders');
      return null;
    }

    // Wait for data
    await safeLoadData();

    const orders = STN.DB.get('orders') || [];
    console.log('📊 Total orders in database:', orders.length);
    
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);
    console.log('📋 Vendor orders found:', vendorOrders.length);
    
    const recentOrders = vendorOrders.slice(-5).reverse();

    const ordersHTML = recentOrders.length === 0 
      ? '<div style="text-align:center;padding:2rem;color:#9ca3af">No recent orders</div>'
      : `
        <div style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h4 style="font-size:1rem;font-weight:600;color:#1e0a4e">Recent Orders</h4>
            <div style="display:flex;gap:0.5rem">
              <button onclick="switchVendorSection('orders')" style="background:#7c3aed;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">View All</button>
            </div>
          </div>
          ${recentOrders.map(order => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid #f3f4f6">
              <div>
                <div style="font-size:0.82rem;font-weight:600;color:#111827">${(order.tracking_number || order.id)}</div>
                <div style="font-size:0.72rem;color:#9ca3af">${(order.notes || order.phone || 'Guest')}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:0.82rem;font-weight:700">${(order.total || 0).toLocaleString()} TND</div>
                ${(() => {
                  const st = (order.status || 'pending').toLowerCase();
                  const bg = st === 'delivered' ? '#dcfce7' : st === 'shipped' || st === 'transit' ? '#dbeafe' : st === 'ready' ? '#fef9c3' : '#fee2e2';
                  const fg = st === 'delivered' ? '#166534' : st === 'shipped' || st === 'transit' ? '#1d4ed8' : st === 'ready' ? '#92400e' : '#991b1b';
                  return `<span style="font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:20px;background:${bg};color:${fg}">${st}</span>`;
                })()}
              </div>
            </div>
          `).join('')}
        </div>
      `;

    const container = document.getElementById('vendor-orders-summary');
    if (container) {
      container.innerHTML = ordersHTML;
      console.log('✅ Orders loaded successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    return false;
  }
}

// Safe inventory loading
async function safeLoadInventory() {
  try {
    console.log('🔄 Loading inventory...');
    const vendorId = State.currentUser?.id;
    console.log('🔍 Fetching inventory for Vendor:', vendorId);
    
    if (!vendorId) {
      console.error('❌ No vendor ID found for inventory');
      return null;
    }

    // Wait for data
    await safeLoadData();

    const products = State.products || [];
    console.log('📊 Total products in database:', products.length);
    
    const vendorProducts = products.filter(p => p.vendorId === vendorId);
    const lowStockProducts = vendorProducts.filter(p => (p.stock || 0) < 10);
    
    console.log('📦 Vendor products found:', vendorProducts.length);
    console.log('⚠️ Low stock products:', lowStockProducts.length);
    console.log('📦 Vendor product details:', vendorProducts.map(p => ({id: p.id, name: p.name, stock: p.stock})));

    const inventoryHTML = `
      <div style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <h4 style="font-size:1rem;font-weight:600;color:#1e0a4e">Inventory Overview</h4>
          <div style="display:flex;gap:0.5rem">
            <button onclick="switchVendorSection('inventory')" style="background:#059669;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">Manage</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
          <div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;text-align:center">
            <div style="font-size:2rem;margin-bottom:0.5rem">📦</div>
            <div style="font-size:1.5rem;font-weight:700;color:#1e0a4e">${vendorProducts.length}</div>
            <div style="font-size:0.8rem;color:#6b7280">Total Products</div>
          </div>
          <div style="background:#fffbeb;border:1px solid #e5e7eb;border-radius:8px;padding:1rem;text-align:center">
            <div style="font-size:2rem;margin-bottom:0.5rem">⚠️</div>
            <div style="font-size:1.5rem;font-weight:700;color:#d97706">${lowStockProducts.length}</div>
            <div style="font-size:0.8rem;color:#6b7280">Low Stock Items</div>
          </div>
        </div>
        ${vendorProducts.length === 0 ? `
          <div style="text-align:center;padding:2rem;color:#9ca3af">
            <p>No products in inventory. <a href="#" onclick="switchVendorSection('upload')" style="color:#7c3aed;text-decoration:underline">Add your first product</a></p>
          </div>
        ` : ''}
      </div>
    `;

    const container = document.getElementById('vendor-inventory-summary');
    if (container) {
      container.innerHTML = inventoryHTML;
      console.log('✅ Inventory loaded successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error loading inventory:', error);
    return false;
  }
}

// Safe analytics loading
async function safeLoadAnalytics() {
  try {
    console.log('🔄 Loading analytics...');
    const vendorId = State.currentUser?.id;
    if (!vendorId) {
      console.warn('No vendor ID found for analytics');
      return null;
    }

    // Wait for data
    await safeLoadData();

    const orders = STN.DB.get('orders') || [];
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);

    const days = parseInt(document.getElementById('analytics-period')?.value || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const periodOrders = vendorOrders.filter(o => new Date(o.created_at) >= since);
    const periodRevenue = periodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Simple chart visualization
    const chartHTML = `
      <div style="height:100%;display:flex;flex-direction:column">
        <div style="flex:1;display:flex;align-items:end;justify-content:space-around;position:relative">
          <div style="text-align:center">
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:1rem">Last ${days} Days</div>
            <div style="font-size:2rem;font-weight:700;color:#1e0a4e">${periodOrders.length}</div>
            <div style="font-size:0.8rem;color:#9ca3af">Orders</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:1rem">Total Revenue</div>
            <div style="font-size:2rem;font-weight:700;color:#059669">${periodRevenue.toLocaleString()} TND</div>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('vendor-analytics-chart');
    if (container) {
      container.innerHTML = chartHTML;
      console.log('✅ Analytics loaded successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error loading analytics:', error);
    return false;
  }
}

function updateVendorAnalytics() {
  safeLoadAnalytics().catch(() => {});
}

// Safe logistics loading — same stack as admin (Leaflet + OSM), scoped to vendor orders + live vehicle animation
async function safeLoadLogistics() {
  try {
    const mapContainer = document.getElementById('vendor-logistics-map');
    if (!mapContainer) {
      console.warn('Logistics map container not found');
      return null;
    }
    await renderVendorLogisticsMapCore(false);
    if (!window.__vendorLogisticsSyncInterval) {
      window.__vendorLogisticsSyncInterval = setInterval(function () {
        const dashEl = document.getElementById('page-vendor-dashboard');
        if (!dashEl || !dashEl.classList || !dashEl.classList.contains('active')) return;
        renderVendorLogisticsMapCore(false).catch(function () {});
      }, 40000);
    }
    return true;
  } catch (error) {
    console.error('❌ Error loading logistics:', error);
    const mapContainer = document.getElementById('vendor-logistics-map');
    if (mapContainer) {
      mapContainer.innerHTML =
        '<div style="height:100%;min-height:280px;background:#f0f4f8;border-radius:8px;display:flex;align-items:center;justify-content:center">' +
        '<div style="text-align:center;color:#6b7280;padding:1.5rem">' +
        '<div style="font-size:2rem;margin-bottom:1rem">🚚</div>' +
        '<h4 style="margin-bottom:0.5rem;color:#1e0a4e">Live map unavailable</h4>' +
        '<p style="margin-bottom:1rem;font-size:0.875rem">Check your connection and tap Refresh.</p>' +
        '<button type="button" onclick="vendorLogisticsRefresh()" style="background:#7c3aed;color:white;border:none;padding:0.5rem 1rem;border-radius:8px;font-weight:600;cursor:pointer">Try again</button>' +
        '</div></div>';
    }
    return false;
  }
}

// Helper function to get coordinates for Tunisian regions
function getTunisiaCoordinates(region) {
  const coordinates = {
    'Tunis': [36.8065, 10.1815],
    'Sousse': [35.8256, 10.6084],
    'Sfax': [34.7406, 10.7603],
    'Monastir': [35.7643, 10.8113],
    'Kairouan': [35.6781, 10.0963],
    'Gabès': [33.8815, 10.0982],
    'Ariana': [36.8625, 10.1956],
    'Ben Arous': [36.7543, 10.2256],
    'Manouba': [36.8053, 10.0589],
    'Bizerte': [37.2746, 9.8739],
    'Béja': [36.7256, 9.1817],
    'Jendouba': [36.5039, 8.7807],
    'Le Kef': [36.1756, 8.7122],
    'Siliana': [36.0856, 9.3673],
    'Kasserine': [35.1683, 8.8376],
    'Gafsa': [34.4248, 8.7848],
    'Tozeur': [33.9252, 8.1348],
    'Kebili': [33.7048, 8.9705],
    'Tataouine': [32.9296, 10.4535],
    'Mahdia': [35.5049, 11.0622],
    'Ksar Hellal': [35.6439, 10.8113],
    'Moknine': [35.6347, 10.7889],
    'Msaken': [35.7203, 10.5985],
    'Kalaa Kebira': [35.6821, 10.0956],
    'Enfidha': [36.1286, 10.3535],
    'Hammamet': [36.3988, 10.6158],
    'Nabeul': [36.4561, 10.7357],
    'Zarzis': [33.5119, 11.0624],
    'Médenine': [33.3540, 10.6179],
    'Djerba': [33.8138, 10.8664],
    'Tabarka': [36.9569, 8.7550],
    'El Kef': [36.1756, 8.7122],
    'Kebili': [33.7048, 8.9705]
  };
  
  // Return coordinates if found, otherwise default to Sousse
  return coordinates[region] || [35.8256, 10.6084];
}

/** Customer / drop-off point for map (GPS if present, else wilaya / delegation / first line item product region). */
function resolveOrderDestinationLatLng(order) {
  if (!order || typeof order !== 'object') return [35.8256, 10.6084];
  const lat = order.delivery_lat != null ? order.delivery_lat : order.lat;
  const lng = order.delivery_lng != null ? order.delivery_lng : order.lng;
  if (lat != null && lng != null && !Number.isNaN(+lat) && !Number.isNaN(+lng)) {
    return [+lat, +lng];
  }
  const wilaya = order.wilaya || order.shipping_wilaya || order.shippingWilaya;
  if (wilaya) return getTunisiaCoordinates(String(wilaya).trim());
  const loc = order.location || order.delegation || order.city || order.address_line;
  if (loc) {
    const parts = String(loc).split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      const c = getTunisiaCoordinates(parts[i]);
      if (c && (c[0] !== 35.8256 || parts.length === 1)) return c;
    }
  }
  const items = order.items;
  if (Array.isArray(items) && items.length && Array.isArray(State.products)) {
    const pid = items[0].id != null ? items[0].id : items[0].product_id;
    const prod = State.products.find(pr => String(pr.id) === String(pid));
    if (prod && prod.region) return getTunisiaCoordinates(prod.region);
  }
  return getTunisiaCoordinates(order.region);
}

function resolveVendorHubLatLng(vendorId, vendorProducts) {
  const prods = (vendorProducts || []).filter(p => String(p.vendorId) === String(vendorId));
  const regions = [...new Set(prods.map(p => p.region).filter(Boolean))];
  if (regions.length === 0) return [35.8256, 10.6084];
  const coords = regions.map(r => getTunisiaCoordinates(r));
  const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [lat, lng];
}

function logisticsEverestPackageIcon() {
  return L.divIcon({
    html:
      '<div style="background:linear-gradient(135deg,#7c3aed,#4a1fa8);color:white;width:32px;height:32px;border-radius:50% 50% 0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(124,58,237,0.35);border:2px solid white;transform:rotate(-45deg)"><span style="transform:rotate(45deg)">📦</span></div>',
    className: 'everest-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

function logisticsHubIcon() {
  return L.divIcon({
    html:
      '<div style="background:#1e0a4e;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #c4b5fd;box-shadow:0 2px 10px rgba(30,10,78,0.35)">🏪</div>',
    className: 'vendor-hub-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function logisticsVehicleIcon() {
  return L.divIcon({
    html:
      '<div class="vendor-logistics-vehicle" style="background:linear-gradient(135deg,#059669,#047857);color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 12px rgba(5,150,105,0.45);border:3px solid white;animation:vendor-vehicle-pulse 2.2s ease-in-out infinite">🚚</div>',
    className: 'vendor-logistics-vehicle-wrap',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

function interpolateLatLng(a, b, t) {
  const u = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}

/** Progress 0–1 along hub→customer for live map (real GPS if provided; else time-based + small jitter). */
function computeVendorDeliveryProgress(order) {
  const st = String(order.status || 'pending').toLowerCase();
  if (st === 'delivered') return 1;
  if (st === 'cancelled' || st === 'canceled') return 0;
  const gpsLat = order.driver_lat != null ? order.driver_lat : order.vehicle_lat;
  const gpsLng = order.driver_lng != null ? order.driver_lng : order.vehicle_lng;
  if (gpsLat != null && gpsLng != null && !Number.isNaN(+gpsLat) && !Number.isNaN(+gpsLng)) {
    return { useGps: true, lat: +gpsLat, lng: +gpsLng };
  }
  const enRoute =
    st === 'shipped' ||
    st === 'transit' ||
    st === 'processing' ||
    st === 'out_for_delivery' ||
    st === 'out-for-delivery';
  if (!enRoute) return { useGps: false, t: 0 };
  const t0 = new Date(order.updated_at || order.shipped_at || order.created_at || Date.now()).getTime();
  const legMs = 10 * 60 * 1000;
  const linear = Math.min(0.97, Math.max(0.06, (Date.now() - t0) / legMs));
  const jitter = 0.014 * Math.sin(Date.now() / 2600);
  return { useGps: false, t: Math.min(0.99, Math.max(0.03, linear + jitter)) };
}

function stopVendorLogisticsAnimation() {
  const st = window.__vendorLogistics;
  if (st && st.rafId != null) {
    cancelAnimationFrame(st.rafId);
    st.rafId = null;
  }
}

function startVendorLogisticsAnimation() {
  stopVendorLogisticsAnimation();
  const st = window.__vendorLogistics;
  if (!st || !st.map || !Array.isArray(st.animTargets)) return;

  const frame = function () {
    const s = window.__vendorLogistics;
    const page = document.getElementById('page-vendor-dashboard');
    if (!s || !s.map || !page || !page.classList.contains('active')) {
      if (s) s.rafId = null;
      return;
    }
    s.animTargets.forEach(function (row) {
      const prog = computeVendorDeliveryProgress(row.order);
      let latlng;
      if (prog && prog.useGps) latlng = [prog.lat, prog.lng];
      else if (prog && typeof prog.t === 'number') latlng = interpolateLatLng(row.hub, row.dest, prog.t);
      else latlng = row.hub;
      if (latlng && row.marker) row.marker.setLatLng(latlng);
    });
    s.rafId = requestAnimationFrame(frame);
  };
  st.rafId = requestAnimationFrame(frame);
}

function updateVendorLogisticsOrderList(vendorOrdersOnMap) {
  const listContainer = document.getElementById('vendor-logistics-order-list');
  if (!listContainer) return;
  if (!vendorOrdersOnMap.length) {
    listContainer.innerHTML =
      '<div style="text-align:center;padding:1.5rem;color:#9ca3af"><div style="font-size:1.75rem;margin-bottom:0.5rem">📦</div><p style="font-weight:500;margin-bottom:0.35rem">No mapped orders yet</p><p style="font-size:0.8rem">Shipped or in-transit orders appear with live vehicle position</p></div>';
    return;
  }
  listContainer.innerHTML = vendorOrdersOnMap
    .map(function (order) {
      const st = String(order.status || 'pending').toLowerCase();
      const statusColor =
        st === 'delivered' ? '#dcfce7' : st === 'shipped' || st === 'transit' ? '#dbeafe' : '#fef9c3';
      const statusTextColor =
        st === 'delivered' ? '#166534' : st === 'shipped' || st === 'transit' ? '#1d4ed8' : '#92400e';
      const id = order.id != null ? order.id : order.tracking_number;
      return (
        '<div class="vendor-logistics-list-item" data-order-focus="' +
        String(id).replace(/"/g, '&quot;') +
        '" style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:0.85rem;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor=\'#7c3aed\';this.style.boxShadow=\'0 2px 8px rgba(124,58,237,0.12)\'" onmouseout="this.style.borderColor=\'#e5e7eb\';this.style.boxShadow=\'\'">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.35rem">' +
        '<div><div style="font-weight:600;color:#1e0a4e;font-size:0.88rem">#' +
        (order.tracking_number || order.id) +
        '</div>' +
        '<div style="font-size:0.72rem;color:#6b7280">' +
        (order.userName || order.phone || 'Customer') +
        ' · ' +
        (order.wilaya || order.location || 'TN') +
        '</div></div>' +
        '<span style="background:' +
        statusColor +
        ';color:' +
        statusTextColor +
        ';padding:0.2rem 0.65rem;border-radius:20px;font-size:0.65rem;font-weight:600">' +
        (st === 'delivered' ? '✓ Delivered' : st === 'shipped' || st === 'transit' ? '🚚 En route' : '⏳ ' + st) +
        '</span></div>' +
        '<div style="font-size:0.72rem;color:#374151"><strong>Total:</strong> ' +
        (order.total || 0).toLocaleString() +
        ' TND</div></div>'
      );
    })
    .join('');

  listContainer.querySelectorAll('.vendor-logistics-list-item').forEach(function (el) {
    el.addEventListener('click', function () {
      const raw = el.getAttribute('data-order-focus');
      focusVendorLogisticsOrder(raw);
    });
  });
}

function focusVendorLogisticsOrder(orderKey) {
  const st = window.__vendorLogistics;
  if (!st || !st.map || !st.orderDestinations) return;
  const row = st.orderDestinations.find(function (o) {
    return String(o.id) === String(orderKey) || String(o.tracking_number) === String(orderKey);
  });
  if (!row) return;
  st.map.setView(row.dest, Math.max(st.map.getZoom(), 11), { animate: true });
  if (row.destMarker && row.destMarker.openPopup) row.destMarker.openPopup();
}

async function renderVendorLogisticsMapCore(fromUserRefresh) {
  const outer = document.getElementById('vendor-logistics-map');
  if (!outer) return null;
  if (typeof L === 'undefined') {
    outer.innerHTML =
      '<div style="padding:2rem;text-align:center;color:#9ca3af;border-radius:12px;background:#f8fafc">Map library unavailable. Check your connection and reload.</div>';
    return false;
  }

  const vendorId = State.currentUser?.id;
  await safeLoadData();
  const orders = (STN.DB.get('orders') || []).map(function (o) {
    if (o.vendorId == null && o.vendor_id != null) o.vendorId = o.vendor_id;
    return o;
  });
  const products = State.products || [];
  const vendorOrders = orders.filter(function (o) {
    return String(o.vendorId) === String(vendorId);
  });
  const vendorProducts = products.filter(function (p) {
    return String(p.vendorId) === String(vendorId);
  });

  if (!outer.querySelector('#vendor-logistics-leaflet-root')) {
    outer.innerHTML =
      '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06)">' +
      '<div style="background:#f8f9fa;border-bottom:1px solid #e5e7eb;padding:0.85rem 1rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem">' +
      '<div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;font-size:0.8rem;font-weight:600;color:#374151">' +
      '<span>On map: <span id="vendor-logistics-order-count" style="background:#7c3aed;color:white;padding:0.2rem 0.65rem;border-radius:20px;font-size:0.72rem">0</span></span>' +
      '<span>Live vehicles: <span id="vendor-logistics-active-count" style="background:#059669;color:white;padding:0.2rem 0.65rem;border-radius:20px;font-size:0.72rem">0</span></span>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap">' +
      '<button type="button" onclick="vendorLogisticsRefresh()" style="background:#7c3aed;color:white;border:none;padding:0.45rem 0.9rem;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer">🔄 Refresh</button>' +
      '<button type="button" onclick="vendorLogisticsCenterActiveVehicle()" style="background:#059669;color:white;border:none;padding:0.45rem 0.9rem;border-radius:8px;font-size:0.75rem;font-weight:600;cursor:pointer">🚚 Follow vehicle</button>' +
      '</div></div>' +
      '<div id="vendor-logistics-leaflet-root" style="height:420px;width:100%;background:#e8eef4"></div>' +
      '<div style="background:#f8f9fa;border-top:1px solid #e5e7eb;padding:0.75rem 1rem;max-height:240px;overflow-y:auto">' +
      '<h4 style="font-size:0.82rem;font-weight:600;color:#111827;margin:0 0 0.65rem">Your deliveries</h4>' +
      '<div id="vendor-logistics-order-list"></div></div></div>';
  }

  let st = window.__vendorLogistics;
  const root = document.getElementById('vendor-logistics-leaflet-root');
  if (!root) return false;

  var mapDomStale = false;
  if (st && st.map) {
    try {
      var mc = st.map.getContainer();
      mapDomStale = !mc || !document.body.contains(mc);
    } catch (e) {
      mapDomStale = true;
    }
  }

  if (!st || !st.map || st._containerId !== 'vendor-logistics-leaflet-root' || mapDomStale) {
    stopVendorLogisticsAnimation();
    if (st && st.map) {
      try {
        st.map.remove();
      } catch (e) {}
    }
    st = {
      map: L.map('vendor-logistics-leaflet-root').setView([33.8869, 9.5375], 7),
      _containerId: 'vendor-logistics-leaflet-root',
      routeLayer: L.featureGroup(),
      destLayer: L.featureGroup(),
      vehicleLayer: L.featureGroup(),
      hubLayer: L.featureGroup(),
      animTargets: [],
      orderDestinations: [],
      rafId: null,
    };
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(st.map);
    st.routeLayer.addTo(st.map);
    st.hubLayer.addTo(st.map);
    st.destLayer.addTo(st.map);
    st.vehicleLayer.addTo(st.map);
    window.__vendorLogistics = st;
    setTimeout(function () {
      try {
        st.map.invalidateSize();
      } catch (e) {}
    }, 250);
  }

  st.routeLayer.clearLayers();
  st.destLayer.clearLayers();
  st.vehicleLayer.clearLayers();
  st.hubLayer.clearLayers();
  st.animTargets = [];
  st.orderDestinations = [];

  const hub = resolveVendorHubLatLng(vendorId, vendorProducts);
  L.marker(hub, { icon: logisticsHubIcon() })
    .bindPopup(
      '<div style="min-width:170px;font-size:12px;line-height:1.45"><strong>Your dispatch hub</strong><br>Derived from your product regions. Vehicles depart from here toward customers.</div>'
    )
    .addTo(st.hubLayer);

  const mapOrders = vendorOrders.filter(function (o) {
    const s = String(o.status || '').toLowerCase();
    return s !== 'cancelled' && s !== 'canceled';
  });

  let enRouteCount = 0;
  mapOrders.forEach(function (order) {
    const dest = resolveOrderDestinationLatLng(order);
    const destMarker = L.marker(dest, { icon: logisticsEverestPackageIcon() }).bindPopup(
      '<div style="min-width:200px;font-size:12px;line-height:1.45">' +
        '<strong>#' +
        (order.tracking_number || order.id) +
        '</strong><br>' +
        'Customer: ' +
        (order.userName || order.phone || '—') +
        '<br>Area: ' +
        (order.wilaya || order.location || 'TN') +
        '<br>Status: <b>' +
        (order.status || '') +
        '</b><br>Total: ' +
        (order.total || 0).toLocaleString() +
        ' TND</div>'
    );
    destMarker.addTo(st.destLayer);
    st.orderDestinations.push({
      id: order.id,
      tracking_number: order.tracking_number,
      dest: dest,
      destMarker: destMarker,
      order: order,
    });

    const stt = String(order.status || '').toLowerCase();
    const live =
      stt === 'shipped' ||
      stt === 'transit' ||
      stt === 'processing' ||
      stt === 'out_for_delivery' ||
      stt === 'out-for-delivery';
    if (live) {
      enRouteCount++;
      L.polyline([hub, dest], {
        color: '#7c3aed',
        weight: 3,
        opacity: 0.55,
        dashArray: '10 8',
      }).addTo(st.routeLayer);
      const prog = computeVendorDeliveryProgress(order);
      const startPos =
        prog && prog.useGps
          ? [prog.lat, prog.lng]
          : interpolateLatLng(hub, dest, typeof prog.t === 'number' ? prog.t : 0.15);
      const vMarker = L.marker(startPos, { icon: logisticsVehicleIcon() }).bindPopup(
        '<div style="font-size:12px;line-height:1.45"><strong>Live vehicle</strong><br>Order #' +
          (order.tracking_number || order.id) +
          '<br><span style="color:#6b7280">Updates while order is en route. GPS from driver overrides simulated path when available.</span></div>'
      );
      vMarker.addTo(st.vehicleLayer);
      st.animTargets.push({ marker: vMarker, hub: hub, dest: dest, order: order });
    }
  });

  const countEl = document.getElementById('vendor-logistics-order-count');
  const activeEl = document.getElementById('vendor-logistics-active-count');
  if (countEl) countEl.textContent = String(mapOrders.length);
  if (activeEl) activeEl.textContent = String(enRouteCount);

  updateVendorLogisticsOrderList(mapOrders);

  const fitGroup = L.featureGroup();
  st.hubLayer.eachLayer(function (l) {
    fitGroup.addLayer(l);
  });
  st.destLayer.eachLayer(function (l) {
    fitGroup.addLayer(l);
  });
  if (fitGroup.getLayers().length) {
    try {
      st.map.fitBounds(fitGroup.getBounds().pad(0.14));
    } catch (e) {
      st.map.setView(hub, 9);
    }
  } else {
    st.map.setView(hub, 9);
  }

  startVendorLogisticsAnimation();
  if (fromUserRefresh) {
    setTimeout(function () {
      try {
        st.map.invalidateSize();
      } catch (e) {}
    }, 120);
  }
  return true;
}

window.vendorLogisticsRefresh = async function () {
  try {
    await safeLoadData();
    await renderVendorLogisticsMapCore(true);
    toast('🔄 Live map updated', 'success');
  } catch (e) {
    toast('⚠️ Could not refresh map', 'error');
  }
};

window.vendorLogisticsCenterActiveVehicle = function () {
  const st = window.__vendorLogistics;
  if (!st || !st.map || !st.animTargets || !st.animTargets.length) {
    toast('⚠️ No active delivery vehicle on map', 'error');
    return;
  }
  const first = st.animTargets[0];
  const m = first.marker;
  if (m && m.getLatLng) {
    st.map.setView(m.getLatLng(), 12, { animate: true });
    toast('📍 Following delivery vehicle', 'success');
  }
};

// REMOVED: Duplicate loadVendorLogisticsMap function - using safeLoadLogistics instead

// NOTE: This file historically had two `switchVendorSection` implementations.
// The earlier one (near the top vendor page) is the canonical one.
// Keep this legacy version callable without overriding the canonical function.
function switchVendorSection_legacy(section) {
  console.log('🔄 switchVendorSection called with:', section);
  
  document.querySelectorAll('[id^="vnd-nav-"]').forEach(function(el) {
    el.style.borderBottomColor = 'transparent';
    el.style.color = '#6b7280';
    el.style.fontWeight = '500';
    el.classList.remove('vnd-active');
  });
  var vActive = document.getElementById('vnd-nav-' + section);
  if (vActive) {
    vActive.style.borderBottomColor = '#7c3aed';
    vActive.style.color = '#7c3aed';
    vActive.style.fontWeight = '700';
    vActive.classList.add('vnd-active');
  }

  const content = document.getElementById('vendor-content');
  if (!content) return;
  const u = State.currentUser;
  const myProds = State.products.filter(p => p.vendorId === u.id || p.brand === (u.shopName||u.shop_name));
  const orders = STN.DB.get('orders') || [];
  const myRevenue = myProds.reduce((s,p) => s + p.price, 0);

  // Handle dashboard case first - redirect to standalone dashboard
  if (section === 'dashboard') {
    console.log('🔄 Dashboard section clicked, redirecting to vendor-dashboard page...');
    showPage('vendor-dashboard');
    return;
  }

  if (section === 'overview') {
    var pendingOrds = orders.filter(function(o){ return o.status==='pending'; }).length;
    var totalRev = orders.reduce(function(s,o){ return s+(o.total||0); }, 0);
    var recentOrds = [...orders].reverse().slice(0,5);
    var today = new Date().toLocaleDateString('en-GB', {weekday:'long',day:'numeric',month:'long'});
    var statusColor = u.verified ? '#059669' : '#d97706';
    var statusBg = u.verified ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#d97706,#b45309)';
    var statusText = u.verified ? '&#9989; Live' : '&#9203; Pending';
    var statusDesc = u.verified ? 'Products visible to customers' : 'Waiting for admin approval';
    
    var recentHTML = recentOrds.length === 0
      ? '<p style="text-align:center;color:#9ca3af;padding:2rem">No orders yet</p>'
      : recentOrds.map(function(o){
          var sc = o.status==='delivered'?'#dcfce7':o.status==='ready'?'#dbeafe':'#fef9c3';
          var st = o.status==='delivered'?'#166534':o.status==='ready'?'#1d4ed8':'#92400e';
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid #f3f4f6">'
            +'<div><div style="font-size:0.82rem;font-weight:600;color:#111827">'+(o.tracking_number||o.id)+'</div><div style="font-size:0.72rem;color:#9ca3af">'+(o.notes||o.phone||'Guest')+'</div></div>'
            +'<div style="text-align:right"><div style="font-size:0.82rem;font-weight:700">'+(o.total||0).toLocaleString()+' TND</div>'
            +'<span style="font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:20px;background:'+sc+';color:'+st+'">'+(o.status||'pending')+'</span></div>'
            +'</div>';
        }).join('');

    var html = '<div>'
      +'<div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;font-weight:700;color:#111827">Welcome back, '+(u.first_name||u.firstName||'Vendor')+'! &#128075;</h1>'
      +'<p style="color:#6b7280;font-size:0.875rem">'+today+'</p></div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:2rem">'
        +'<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem"><div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem"><div style="width:40px;height:40px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">📦</div><div><div style="font-size:0.75rem;color:#6b7280">Pending Orders</div><div style="font-size:1.5rem;font-weight:700;color:#111827">'+pendingOrds+'</div></div></div></div>'
        +'<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem"><div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem"><div style="width:40px;height:40px;background:#dbeafe;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">💰</div><div><div style="font-size:0.75rem;color:#6b7280">Total Revenue</div><div style="font-size:1.5rem;font-weight:700;color:#111827">'+totalRev.toLocaleString()+' TND</div></div></div></div>'
        +'<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem"><div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem"><div style="width:40px;height:40px;background:#fef3c7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">📊</div><div><div style="font-size:0.75rem;color:#6b7280">My Products</div><div style="font-size:1.5rem;font-weight:700;color:#111827">'+myProds.length+'</div></div></div></div>'
      +'</div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f8f9ff;display:flex;align-items:center;justify-content:space-between"><h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📦 Recent Orders</h3><span style="color:#6b7280;font-size:0.9rem">Total: '+orders.length+' orders</span></div><div style="padding:1.5rem">'+recentHTML+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-top:2rem"><div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f0fdf4;display:flex;align-items:center;justify-content:space-between"><h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📈 Shop Status</h3><div style="background:'+statusBg+';color:white;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600">'+statusText+'</div></div><div style="padding:1.5rem"><div style="display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#ecfdf5;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">🏪</div><div><div style="font-size:0.9rem;font-weight:600;color:#111827">'+(u.shop_name||u.shopName||'My Shop')+'</div><div style="font-size:0.8rem;color:#6b7280">'+statusDesc+'</div></div></div></div></div>'
    +'</div>';
    content.innerHTML = html;
  } else if (section === 'upload') {
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#1e0a4e">Upload New Product</h3>
        <p style="color:#6b7280;font-size:0.9rem">Add a new product to your shop inventory</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">
        <form onsubmit="uploadVendorProduct(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div>
              <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500;color:#374151">Product Name</label>
              <input type="text" name="name" required style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.875rem;">
            </div>
            <div>
              <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500;color:#374151">Price (TND)</label>
              <input type="number" name="price" required min="0" step="0.01" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.875rem;">
            </div>
            <div>
              <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500;color:#374151">Category</label>
              <select name="category" required style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.875rem;">
                <option value="">Select category</option>
                <option value="furniture">Furniture</option>
                <option value="lighting">Lighting</option>
                <option value="decor">Decor</option>
                <option value="ceramics">Ceramics</option>
                <option value="outdoor">Outdoor</option>
                <option value="fragrance">Fragrance</option>
              </select>
            </div>
            <div>
              <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500;color:#374151">Stock</label>
              <input type="number" name="stock" required min="0" style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.875rem;">
            </div>
          </div>
          <div style="margin-bottom:1rem">
            <label style="display:block;margin-bottom:0.5rem;font-size:0.875rem;font-weight:500;color:#374151">Description</label>
            <textarea name="description" rows="4" required style="width:100%;padding:0.5rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.875rem;resize:vertical;"></textarea>
          </div>
          <div style="display:flex;gap:1rem;justify-content:flex-end">
            <button type="button" onclick="switchVendorSection('overview')" style="background:transparent;border:1px solid #d1d5db;color:#6b7280;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer;">Cancel</button>
            <button type="submit" style="background:#7c3aed;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer;">Upload Product</button>
          </div>
        </form>
      </div>
    `;
  } else if (section === 'inventory') {
    const prods = myProds.map(function(p){
      const stockColor = (p.stock||0) < 10 ? '#dc2626' : '#059669';
      const stockText = (p.stock||0) < 10 ? 'Low Stock' : 'In Stock';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-bottom:1px solid #f3f4f6">'
        +'<div style="display:flex;align-items:center;gap:1rem">'
          +'<div style="width:50px;height:50px;background:#f5f2ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">'+(p.emoji||'📦')+'</div>'
          +'<div><div style="font-weight:600;color:#111827">'+p.name+'</div><div style="font-size:0.8rem;color:#6b7280">'+p.brand+'</div></div>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:1rem">'
          +'<div style="text-align:right"><div style="font-weight:600">'+p.price+' TND</div><div style="font-size:0.8rem;color:#6b7280">Stock: '+p.stock+'</div></div>'
          +'<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600;background:'+stockColor+';color:white">'+stockText+'</span>'
          +'<button onclick="deleteVendorProduct('+p.id+')" style="background:#dc2626;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">Delete</button>'
        +'</div>'
      +'</div>';
    }).join('');
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#1e0a4e">My Products</h3>
        <p style="color:#6b7280;font-size:0.9rem">Manage your shop inventory</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f0fdf4;display:flex;align-items:center;justify-content:space-between">
          <span style="color:#6b7280;font-size:0.9rem">${myProds.length} products</span>
          <button onclick="switchVendorSection('upload')" style="background:#059669;color:white;border:none;padding:0.5rem 1rem;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer">+ Add Product</button>
        </div>
        <div>${prods}</div>
      </div>
    `;
  } else if (section === 'orders') {
    const myOrders = orders.filter(o => o.vendorId === u.id);
    const ordersHTML = myOrders.length === 0
      ? '<p style="text-align:center;color:#9ca3af;padding:2rem">No orders yet</p>'
      : myOrders.map(o => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;border-bottom:1px solid #f3f4f6">
          <div>
            <div style="font-weight:600;color:#111827">#${o.tracking_number || o.id}</div>
            <div style="font-size:0.8rem;color:#6b7280">${o.phone || 'Guest'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:600">${(o.total || 0).toLocaleString()} TND</div>
            <div style="font-size:0.8rem;">
              <span style="padding:0.25rem 0.5rem;border-radius:12px;font-size:0.7rem;font-weight:600;
                     background:${o.status === 'delivered' ? '#dcfce7' : o.status === 'shipped' ? '#dbeafe' : '#fef9c3'};
                     color:${o.status === 'delivered' ? '#166534' : o.status === 'shipped' ? '#1d4ed8' : '#92400e'}">
                ${o.status || 'pending'}
              </span>
            </div>
          </div>
        </div>
      `).join('');
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#1e0a4e">My Orders</h3>
        <p style="color:#6b7280;font-size:0.9rem">View and manage customer orders</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f8f9ff;display:flex;align-items:center;justify-content:space-between">
          <span style="color:#6b7280;font-size:0.9rem">${myOrders.length} orders</span>
        </div>
        <div>${ordersHTML}</div>
      </div>
    `;
  } else if (section === 'analytics') {
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#1e0a4e">Sales Analytics</h3>
        <p style="color:#6b7280;font-size:0.9rem">Track your business performance</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;text-align:center;color:#9ca3af">
        <div style="font-size:2rem;margin-bottom:1rem">📊</div>
        <h4 style="margin-bottom:0.5rem">Analytics Coming Soon</h4>
        <p>Detailed sales analytics and insights will be available here.</p>
      </div>
    `;
  } else if (section === 'logistics') {
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#1e0a4e">Logistics & Delivery</h3>
        <p style="color:#6b7280;font-size:0.9rem">Track your deliveries and manage shipping</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;text-align:center;color:#9ca3af">
        <div style="font-size:2rem;margin-bottom:1rem">🚚</div>
        <h4 style="margin-bottom:0.5rem">Logistics Coming Soon</h4>
        <p>Delivery tracking and logistics management will be available here.</p>
      </div>
    `;
  } else if (section === 'settings') {
    content.innerHTML = `
      <div style="margin-bottom:1rem">
        <h3 style="font-size:1rem;font-weight:600;color:#1e0a4e">Shop Settings</h3>
        <p style="color:#6b7280;font-size:0.9rem">Manage your shop preferences and configuration</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;text-align:center;color:#9ca3af">
        <div style="font-size:2rem;margin-bottom:1rem">⚙️</div>
        <h4 style="margin-bottom:0.5rem">Settings Coming Soon</h4>
        <p>Shop settings and preferences will be available here.</p>
      </div>
    `;
  }
}

async function refreshVendorData() {
  try {
    console.log('🔄 Refreshing vendor dashboard data...');
    
    // Reload data from Supabase first
    await ensureVendorDataLoaded();
    
    // Reload all dashboard components using safe functions
    await Promise.allSettled([
      safeLoadKPIs(),
      safeLoadOrders(),
      safeLoadInventory(),
      safeLoadAnalytics(),
      safeLoadLogistics()
    ]);
    
    toast('🔄 Dashboard refreshed with latest data', 'success');
    console.log('✅ Vendor dashboard refreshed successfully');
  } catch (error) {
    console.error('❌ Error refreshing vendor dashboard:', error);
    toast('⚠️ Failed to refresh dashboard. Please try again.', 'error');
  }
}
let logisticsMap = null;
let orderMarkers = [];
let driverMarker = null;

function computeLogisticsKpis(orders) {
  var list = Array.isArray(orders) ? orders : [];
  var total = list.length;
  var delivered = 0;
  var active = 0;
  var assigned = 0;
  var sumPickupMins = 0;
  var pickupN = 0;
  var sumDistance = 0;
  var distanceN = 0;
  list.forEach(function (o) {
    var st = normalizeOrderStatus(o.status);
    if (st === 'delivered') delivered++;
    if (DELIVERY_ACTIVE_STATUSES.has(st)) active++;
    if (o.driver_id != null || o.driverId != null) assigned++;
    if (o.driver_accepted_at && o.created_at) {
      var mins = (new Date(o.driver_accepted_at).getTime() - new Date(o.created_at).getTime()) / 60000;
      if (Number.isFinite(mins) && mins >= 0) {
        sumPickupMins += mins;
        pickupN++;
      }
    }
    var a = _orderVendorCoord(o);
    var b = _orderCustomerCoord(o);
    if (a && b) {
      sumDistance += haversineKm(a[0], a[1], b[0], b[1]);
      distanceN++;
    }
  });
  return {
    total: total,
    delivered: delivered,
    active: active,
    assigned: assigned,
    onTimeRate: total > 0 ? Math.round((delivered / total) * 1000) / 10 : 0,
    avgPickupMins: pickupN > 0 ? Math.round(sumPickupMins / pickupN) : 0,
    avgRouteKm: distanceN > 0 ? Math.round((sumDistance / distanceN) * 10) / 10 : 0,
  };
}

function renderAdminLogisticsKpis() {
  var orders = STN.DB.get('orders') || [];
  var k = computeLogisticsKpis(orders);
  var root = document.getElementById('logistics-kpi-row');
  if (!root) return;
  root.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:0.75rem;margin-bottom:1rem">' +
    '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:0.8rem"><div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Assigned</div><div style="font-size:1.2rem;font-weight:700;color:#0f172a">' + k.assigned + '/' + k.total + '</div></div>' +
    '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:0.8rem"><div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Active</div><div style="font-size:1.2rem;font-weight:700;color:#1d4ed8">' + k.active + '</div></div>' +
    '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:0.8rem"><div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Avg pickup</div><div style="font-size:1.2rem;font-weight:700;color:#6d28d9">' + k.avgPickupMins + ' min</div></div>' +
    '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:0.8rem"><div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Avg route</div><div style="font-size:1.2rem;font-weight:700;color:#047857">' + k.avgRouteKm + ' km</div></div>' +
    '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:0.8rem"><div style="font-size:0.68rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em">Delivered</div><div style="font-size:1.2rem;font-weight:700;color:#166534">' + k.delivered + ' (' + k.onTimeRate + '%)</div></div>' +
    '</div>';
}

// Initialize logistics map
function initializeLogisticsMap() {
  const mapContainer = document.getElementById('logistics-map');
  if (!mapContainer) return;
  
  // Initialize Leaflet map with real Tunisia map data
  try {
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      throw new Error('Leaflet library not loaded. Please check internet connection.');
    }
    
    logisticsMap = L.map('logistics-map').setView([33.8869, 9.5375], 7); // Center on Tunisia with better zoom
    
    // Add OpenStreetMap tiles (free alternative to Google Maps)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(logisticsMap);
    
    // Add custom styling for better Tunisia visibility
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
      maxZoom: 18,
    }).addTo(logisticsMap);
    
    // Load order markers
    loadOrderMarkers();
    
    // Update markers every 30 seconds
    setInterval(loadOrderMarkers, 30000);
    
  } catch (error) {
    console.error('Error initializing map:', error);
    mapContainer.innerHTML = `
      <div style="padding:2rem;text-align:center;color:#9ca3af">
        <div style="font-size:2rem;margin-bottom:1rem">⚠️</div>
        <h3 style="margin-bottom:0.5rem">Map Loading Error</h3>
        <p>Unable to load interactive map. Please check your internet connection.</p>
        <button onclick="location.reload()" style="background:#7c3aed;color:white;border:none;padding:0.5rem 1rem;border-radius:8px;margin-top:1rem;cursor:pointer">Retry</button>
      </div>
    `;
  }
}

// Load order markers on map
function loadOrderMarkers() {
  if (!logisticsMap) return;
  
  // Clear existing markers
  orderMarkers.forEach(marker => logisticsMap.removeLayer(marker));
  orderMarkers = [];
  
  const orders = STN.DB.get('orders') || [];
  const ordersWithCoords = orders.filter(function (order) {
    const st = String(order.status || '').toLowerCase();
    return (
      st === 'shipped' ||
      st === 'processing' ||
      st === 'transit' ||
      st === 'out_for_delivery' ||
      st === 'out-for-delivery'
    );
  });

  document.getElementById('logistics-order-count').textContent = ordersWithCoords.length;
  document.getElementById('logistics-active-count').textContent = ordersWithCoords.filter(function (o) {
    return String(o.status || '').toLowerCase() === 'shipped';
  }).length;

  ordersWithCoords.forEach(function (order) {
    const pt = resolveOrderDestinationLatLng(order);
    if (!pt || pt.length < 2) return;
    const marker = L.marker([pt[0], pt[1]], {
      icon: logisticsEverestPackageIcon(),
    }).addTo(logisticsMap);
      
      // Add popup with order details
      const popupContent = `
        <div style="min-width: 200px; font-family: Outfit, sans-serif;">
          <h4 style="margin: 0 0 8px 0; color: #1e0a4e; font-size: 14px;">
            Order #${order.tracking_number || order.id}
          </h4>
          <div style="font-size: 12px; color: #374151; line-height: 1.4;">
            <div><strong>Customer:</strong> ${order.phone || 'Guest'}</div>
            <div><strong>Location:</strong> ${order.wilaya || 'Tunisia'}</div>
            <div><strong>Status:</strong> <span style="
              background: ${order.status === 'delivered' ? '#dcfce7' : order.status === 'shipped' ? '#dbeafe' : '#fef9c3'};
              color: ${order.status === 'delivered' ? '#166534' : order.status === 'shipped' ? '#1d4ed8' : '#92400e'};
              padding: 2px 6px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            ">${order.status || 'pending'}</span></div>
            <div><strong>Total:</strong> ${(order.total || 0).toLocaleString()} TND</div>
          </div>
        </div>
      `;
      
    marker.bindPopup(popupContent);
    orderMarkers.push(marker);
  });

  updateOrderList(ordersWithCoords);
}

// Show order popup
function showOrderPopup(order, marker) {
  // Remove existing popups
  document.querySelectorAll('.order-popup').forEach(p => p.remove());
  
  const popup = document.createElement('div');
  popup.className = 'order-popup';
  popup.innerHTML = `
    <div style="font-family:Outfit,sans-serif">
      <h4 style="margin:0 0 8px 0;color:#1e0a4e;font-size:14px">
        Order #${order.tracking_number || order.id}
      </h4>
      <div style="font-size:12px;color:#374151;line-height:1.4">
        <div><strong>Customer:</strong> ${order.phone || 'Guest'}</div>
        <div><strong>Location:</strong> ${order.wilaya || 'Tunisia'}</div>
        <div><strong>Status:</strong> <span style="
          background:${order.status === 'delivered' ? '#dcfce7' : order.status === 'shipped' ? '#dbeafe' : '#fef9c3'};
          color:${order.status === 'delivered' ? '#166534' : order.status === 'shipped' ? '#1d4ed8' : '#92400e'};
          padding:2px 6px;
          border-radius:12px;
          font-size:11px;
          font-weight:600;
        ">${order.status || 'pending'}</span></div>
        <div><strong>Total:</strong> ${(order.total || 0).toLocaleString()} TND</div>
      </div>
    </div>
  `;
  
  // Position popup above marker
  const markerRect = marker.getBoundingClientRect();
  const containerRect = marker.parentElement.getBoundingClientRect();
  popup.style.left = (markerRect.left - containerRect.left + markerRect.width/2) + 'px';
  popup.style.top = (markerRect.top - containerRect.top - 10) + 'px';
  
  marker.parentElement.appendChild(popup);
  
  // Remove popup when clicking elsewhere
  setTimeout(() => {
    document.addEventListener('click', function removePopup() {
      popup.remove();
      document.removeEventListener('click', removePopup);
    });
  }, 100);
}

// Update order list in logistics panel
function updateOrderList(orders) {
  const listContainer = document.getElementById('logistics-order-list');
  if (!listContainer) return;
  
  if (orders.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align:center;padding:2rem;color:#9ca3af">
        <div style="font-size:2rem;margin-bottom:0.5rem">📦</div>
        <p style="font-weight:500;margin-bottom:0.5rem">No active deliveries</p>
        <p style="font-size:0.875rem;">Orders with delivery coordinates will appear here</p>
      </div>
    `;
    return;
  }
  
  listContainer.innerHTML = orders.map(order => {
    const statusColor = order.status === 'delivered' ? '#dcfce7' : order.status === 'shipped' ? '#dbeafe' : '#fef9c3';
    const statusTextColor = order.status === 'delivered' ? '#166534' : order.status === 'shipped' ? '#1d4ed8' : '#92400e';
    
    return `
      <div style="
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      " onmouseover="this.style.borderColor='#7c3aed';this.style.boxShadow='0 2px 8px rgba(124,58,237,0.1)'" 
         onmouseout="this.style.borderColor='#e5e7eb';this.style.boxShadow=''">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div>
            <div style="font-weight: 600; color: #1e0a4e; font-size: 14px;">
              #${order.tracking_number || order.id}
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              ${order.phone || 'Guest'} · ${order.wilaya || 'Tunisia'}
            </div>
          </div>
          <div style="
            background: ${statusColor};
            color: ${statusTextColor};
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
          ">
            ${orderStatusBadge(order.status).label}
          </div>
        </div>
        <div style="font-size: 12px; color: #374151;">
          <div><strong>Total:</strong> ${(order.total || 0).toLocaleString()} TND</div>
          ${order.address ? `<div><strong>Address:</strong> ${order.address}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Refresh logistics map
function refreshLogisticsMap() {
  if (logisticsMap) {
    loadOrderMarkers();
    renderAdminLogisticsKpis();
    toast('🔄 Map refreshed with latest order data', 'success');
  } else {
    toast('⚠️ Map not loaded yet', 'error');
  }
}

// Center on driver (mock implementation)
function centerOnDriver() {
  if (!logisticsMap) {
    toast('⚠️ Map not loaded yet', 'error');
    return;
  }
  
  // Mock driver location - in real app, this would come from GPS tracking
  const driverLocation = [36.8065, 10.1815]; // Tunis coordinates
  
  // Add/update driver marker
  if (driverMarker) {
    logisticsMap.removeLayer(driverMarker);
  }
  
  const driverIcon = L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 3px 10px rgba(5, 150, 105, 0.4);
        border: 3px solid white;
        animation: pulse 2s infinite;
      ">
        🚚
      </div>
    `,
    className: 'driver-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
  
  driverMarker = L.marker(driverLocation, { icon: driverIcon }).addTo(logisticsMap);
  
  // Center map on driver
  logisticsMap.setView(driverLocation, 10);
  
  toast('📍 Centered on driver location', 'success');
}

