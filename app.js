
// ═══════════════════════════════════════════════
// SHOPPING — MAIN APPLICATION ENGINE
// ═══════════════════════════════════════════════

'use strict';

// ── STATE ──
const State = {
  currentPage: 'home',
  currentUser: null,
  cart: [],
  wishlist: [],
  products: [],
  orders: [],
  reviews: [],
  filterCat: 'all',
  searchQuery: '',
  cartOpen: false,
  promoApplied: null,
  dashSection: 'overview',
  vendorSection: 'dashboard',
  selectedProduct: null,
  flashInterval: null,
  countdownInterval: null,
};

// ── INIT ──
function init() {
  State.currentUser = STN.DB.get('currentUser');
  State.cart = STN.DB.get('cart') || [];
  State.wishlist = STN.DB.get('wishlist') || [];
  State.products = STN.DB.get('products') || STN.PRODUCTS_DATA;
  State.orders = STN.DB.get('orders') || [];
  State.reviews = STN.DB.get('reviews') || [];

  initCursor();
  initNav();
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
  renderHome();
  setTimeout(initReveal, 80);
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
}

function updateNavUser() {
  const btn = document.getElementById('nav-user-area');
  if (!btn) return;
  if (State.currentUser) {
    const role = State.currentUser.role;
    const page = role === 'admin' ? 'admin' : role === 'vendor' ? 'vendor' : 'account';
    const label = role === 'admin' ? '⚙️ Admin' : role === 'vendor' ? '🏪 Dashboard' : State.currentUser.firstName;
    btn.innerHTML = `<button class="nav-user-btn btn" onclick="showPage('${page}')"><span>${State.currentUser.avatar || '👤'}</span><span>${label}</span></button>`;
  } else {
    btn.innerHTML = `<button class="btn btn-gold btn-sm" onclick="showPage('auth')">Sign In</button>`;
  }
}

// ── PAGE NAVIGATION ──
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (!page) return;
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
    loyalty: renderLoyalty,
    about: renderAbout,
  };
  if (renderers[id]) renderers[id]();

  setTimeout(initReveal, 80);
  // Re-apply current language after page render
  const activeLangBtn = document.querySelector('.lang-btn.active');
  if (activeLangBtn) {
    const lang = activeLangBtn.id.replace('lang-','');
    setTimeout(() => { if(typeof setLang === 'function') setLang(lang); }, 100);
  }
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

// ── CART ──
function updateCartBadge() {
  const total = State.cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = total);
  const fc = document.getElementById('float-cart-count');
  if (fc) { fc.textContent = total; fc.style.display = total > 0 ? 'flex' : 'none'; }
}

function addToCart(productId) {
  const product = State.products.find(p => p.id === productId);
  if (!product) return;
  const existing = State.cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    State.cart.push({ id: productId, name: product.name, price: product.price, emoji: product.emoji, qty: 1 });
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
      ${!State.currentUser ? `<p style="font-size:0.75rem;color:#7b72a8;margin-bottom:1rem;text-align:center">💡 <a onclick="document.getElementById('checkout-modal').remove();showPage('auth')" style="color:#7c3aed;cursor:pointer">Sign in</a> to track your order easily</p>` : ''}
      <button onclick="submitOrder()" style="width:100%;padding:1rem;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;border-radius:12px;font-size:0.9rem;font-weight:600;cursor:pointer;letter-spacing:0.05em">Place Order ✦</button>
    </div>`;
  document.body.appendChild(modal);
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
  
  if (!fname || !phone || !wilaya || !address) { toast('⚠️ Please fill all fields', 'error'); return; }
  
  const btn = document.querySelector('#checkout-modal button:last-child');
  btn.textContent = 'Processing...';
  btn.disabled = true;

  try {
    // Get shop names from cart items
    const shopNames = [...new Set(State.cart.map(i => i.brand || i.shopName || 'Shopping').filter(Boolean))].join(', ');
    
    const order = await SB.createOrder({
      user_id: State.currentUser?.id || null,
      client_name: fname + ' ' + lname,
      items: State.cart,
      total: getCartTotal(),
      status: 'pending',
      wilaya,
      address,
      phone,
      shop_names: shopNames,
      notes: ''
    });

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

  } catch(e) {
    toast('⚠️ Order failed. Try again.', 'error');
    const btn = document.querySelector('#checkout-modal button:last-child');
    if (btn) { btn.textContent = 'Place Order ✦'; btn.disabled = false; }
  }
}

// ── WISHLIST ──
function updateWishlistBadge() {
  document.querySelectorAll('.wishlist-badge').forEach(b => b.textContent = State.wishlist.length);
}

function toggleWishlist(productId) {
  const idx = State.wishlist.indexOf(productId);
  const product = State.products.find(p => p.id === productId);
  if (idx === -1) {
    State.wishlist.push(productId);
    toast(`♥ Added to wishlist: ${product?.name}`, 'success');
  } else {
    State.wishlist.splice(idx, 1);
    toast(`Removed from wishlist`, 'default');
  }
  STN.DB.set('wishlist', State.wishlist);
  updateWishlistBadge();
  // Update button states
  document.querySelectorAll(`[data-wish="${productId}"]`).forEach(btn => {
    btn.classList.toggle('active', State.wishlist.includes(productId));
    btn.textContent = State.wishlist.includes(productId) ? '♥' : '♡';
  });
}

// ── STAR RENDERING ──
function renderStars(rating) {
  return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
}

function renderStarsInput(id) {
  return `<div class="star-input" id="stars-${id}">
    ${[1,2,3,4,5].map(n => `<span onclick="setRating(${id},${n})" data-val="${n}">☆</span>`).join('')}
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
function productCardHTML(p) {
  const isWished = State.wishlist.includes(p.id);
  return `
  <div class="product-card reveal" data-cat="${p.cat}">
    <div class="product-img-wrap">
      <div class="product-emoji" style="background:linear-gradient(135deg,${p.bgFrom||'#2d1554'},${p.bgTo||'#4a2080'})">${p.emoji}</div>
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      ${p.verified ? `<span class="product-verified">✓ Verified</span>` : ''}
      <div class="product-overlay">
        <button class="btn btn-gold btn-sm" onclick="openProductDetail(${p.id})">View Details</button>
        <button class="wishlist-btn ${isWished ? 'active' : ''}" data-wish="${p.id}" onclick="toggleWishlist(${p.id})">${isWished ? '♥' : '♡'}</button>
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
        <button class="btn btn-gold btn-sm" style="margin-left:auto;padding:0.45rem 1rem;font-size:0.65rem" onclick="addToCart(${p.id})">+ Cart</button>
      </div>
    </div>
  </div>`;
}

// ── PRODUCT DETAIL MODAL ──
function openProductDetail(productId) {
  const p = State.products.find(pr => pr.id === productId);
  if (!p) return;
  State.selectedProduct = p;

  const productReviews = State.reviews.filter(r => r.productId === productId);
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('product-modal-body');

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5rem">
      <div>
        <div class="gallery-main" id="gallery-main">${p.emoji}</div>
        <div class="gallery-thumbs" style="margin-top:0.8rem">
          ${[p.emoji,'🔍','📐','🎨'].map((e,i) => `<div class="gallery-thumb ${i===0?'active':''}" onclick="setGalleryMain('${e}',this)">${e}</div>`).join('')}
        </div>
      </div>
      <div>
        ${p.badge ? `<span class="product-badge" style="position:relative;top:auto;left:auto;display:inline-block;margin-bottom:0.8rem">${p.badge}</span>` : ''}
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
          <button class="btn btn-gold" style="flex:1" onclick="addToCart(${p.id});closeModal('product-modal')">Add to Cart</button>
          <button class="wishlist-btn ${State.wishlist.includes(p.id)?'active':''}" data-wish="${p.id}" onclick="toggleWishlist(${p.id})">${State.wishlist.includes(p.id)?'♥':'♡'}</button>
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
        <button class="btn btn-gold btn-sm" onclick="submitReview(${p.id})">Submit Review</button>
      </div>` : `<p style="font-size:0.8rem;color:var(--text-muted);margin-top:1rem"><a href="#" onclick="showPage('auth')" style="color:var(--gold)">Sign in</a> to leave a review</p>`}
    </div>`;

  openModal('product-modal');
}

let detailQty = 1;
function changeDetailQty(d) {
  detailQty = Math.max(1, detailQty + d);
  const el = document.getElementById('detail-qty');
  if (el) el.textContent = detailQty;
}

function setGalleryMain(emoji, thumb) {
  document.getElementById('gallery-main').textContent = emoji;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function submitReview(productId) {
  if (!State.currentUser) return;
  if (currentRating === 0) { toast('⚠️ Please select a rating', 'error'); return; }
  const text = document.getElementById('review-text')?.value?.trim();
  if (!text) { toast('⚠️ Please write a review', 'error'); return; }

  const newReview = {
    id: Date.now(),
    productId,
    userId: State.currentUser.id,
    userName: State.currentUser.firstName + ' ' + State.currentUser.lastName[0] + '.',
    rating: currentRating,
    comment: text,
    date: new Date().toISOString().split('T')[0],
    verified: true
  };
  State.reviews.push(newReview);
  STN.DB.set('reviews', State.reviews);
  toast('✦ Review submitted! Thank you.', 'success');
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
      <span class="eyebrow">Welcome to Shopping</span>
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
        <span style="font-size:0.75rem;color:var(--gold);cursor:none">Forgot password?</span>
      </div>
      <button class="btn btn-gold btn-full btn-lg" onclick="doLogin()">Sign In →</button>
      <div style="margin-top:1.2rem;text-align:center;font-size:0.75rem;color:var(--text-muted)">Demo: admin@shopping / admin123</div>
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
            <input type="checkbox" id="reg-is-vendor" onchange="document.getElementById('reg-vendor-fields').style.display=this.checked?'block':'none'" style="width:18px;height:18px;accent-color:#7c3aed"/>
            <span style="font-size:0.85rem;color:#1e0a4e;font-weight:500">🏪 I am an artisan/vendor — I want to sell on Shopping</span>
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
    if (cb && fields) cb.onchange = () => fields.style.display = cb.checked ? 'block' : 'none';
  }, 100);
}

function populateDelegations() {
  const wilaya = document.getElementById('reg-wilaya')?.value;
  const delSel = document.getElementById('reg-delegation');
  if (!wilaya || !delSel) return;
  const delegations = STN.WILAYAS[wilaya] || [];
  delSel.innerHTML = `<option value="">Select Delegation…</option>` + delegations.map(d => `<option value="${d}">${d}</option>`).join('');
}

async function doLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const pass = document.getElementById('login-pass')?.value;
  if (!email || !pass) { toast('⚠️ Please fill all fields', 'error'); return; }
  
  // Check hardcoded admin/vendor first
  const local = (STN.DB.get('users') || []).find(u => u.email === email && u.password === pass);
  if (local) {
    State.currentUser = local;
    STN.DB.set('currentUser', local);
    updateNavUser();
    toast(`✦ Welcome back, ${local.firstName}!`, 'success');
    if (local.role === 'admin') showPage('admin');
    else if (local.role === 'vendor') showPage('vendor');
    else showPage('home');
    return;
  }

  // Check Supabase
  try {
    const user = await SB.getUser(email);
    if (!user || user.password !== pass) { toast('⚠️ Invalid email or password', 'error'); return; }
    State.currentUser = { ...user, firstName: user.first_name, lastName: user.last_name };
    STN.DB.set('currentUser', State.currentUser);
    updateNavUser();
    toast(`✦ Welcome back, ${user.first_name}!`, 'success');
    if (user.role === 'admin') showPage('admin');
    else if (user.role === 'vendor') showPage('vendor');
    else showPage('home');
  } catch(e) {
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

  if (!fname || !lname || !email || !phone || !wilaya || !delegation || !pass) { toast('⚠️ Please fill all required fields', 'error'); return; }
  if (pass !== pass2) { toast('⚠️ Passwords do not match', 'error'); return; }
  if (pass.length < 8) { toast('⚠️ Password must be at least 8 characters', 'error'); return; }

  const users = STN.DB.get('users') || [];
  if (users.find(u => u.email === email)) { toast('⚠️ Email already registered', 'error'); return; }

  const isVendor = document.getElementById('reg-is-vendor')?.checked;
  const shopName = document.getElementById('reg-shop')?.value?.trim();
  const specialty = document.getElementById('reg-specialty')?.value;
  if (isVendor && !shopName) { toast('⚠️ Please enter your shop name', 'error'); return; }

  try {
    const newUser = await SB.createUser({
      email, password: pass,
      first_name: fname, last_name: lname,
      phone, wilaya, delegation,
      role: isVendor ? 'vendor' : 'customer',
      points: 100, verified: false,
      avatar: isVendor ? '🏪' : '👤',
      shop_name: shopName || null,
      specialty: specialty || null
    });
    State.currentUser = { ...newUser, firstName: newUser.first_name, lastName: newUser.last_name };
    STN.DB.set('currentUser', State.currentUser);
    updateNavUser();
    if (isVendor) {
      toast(`✦ Welcome ${shopName}! Your vendor account is pending verification.`, 'success');
      showPage('vendor');
    } else {
      toast(`✦ Welcome to Shopping, ${fname}! You earned 100 bonus points!`, 'success');
      showPage('home');
    }
  } catch(e) {
    if (e.message.includes('duplicate') || e.message.includes('unique')) {
      toast('⚠️ Email already registered!', 'error');
    } else {
      toast('⚠️ Registration failed. Try again.', 'error');
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

// ── HOME ──
function renderHome() {
  const products = State.products;
  
  // Featured - first 8
  const grid = document.getElementById('home-featured-grid');
  if (grid) grid.innerHTML = products.slice(0, 8).map(productCardHTML).join('');
  
  // Best sellers - sort by reviews
  const bsGrid = document.getElementById('home-bestsellers-grid');
  if (bsGrid) {
    const bs = [...products].sort((a,b) => b.reviews - a.reviews).slice(0, 8);
    bsGrid.innerHTML = bs.map(productCardHTML).join('');
  }
  
  // New arrivals - last 6
  const newGrid = document.getElementById('home-new-grid');
  if (newGrid) newGrid.innerHTML = products.slice(-6).map(productCardHTML).join('');
  
  startFlashTimer();
  initReveal();
}

// ── PRODUCTS ──
function renderProducts() {
  filterProducts(State.filterCat);
}

function filterProducts(cat, btn) {
  State.filterCat = cat;
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const filtered = cat === 'all' ? State.products : State.products.filter(p => p.cat === cat);
  grid.innerHTML = filtered.length > 0
    ? filtered.map(productCardHTML).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:1rem">🔍</div><p>No products found in this category</p></div>`;
  initReveal();
}

function searchProducts() {
  const q = document.getElementById('prod-search')?.value?.trim()?.toLowerCase();
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  const filtered = q ? State.products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.region.toLowerCase().includes(q)) : State.products;
  grid.innerHTML = filtered.map(productCardHTML).join('');
  if (q) toast(`🔍 ${filtered.length} result(s) for "${q}"`);
  initReveal();
}

// ── TRACK ──
async function renderTrack() {
  initReveal();
  // If user is logged in, show their orders automatically
  if (State.currentUser && State.currentUser.id) {
    const trackInput = document.getElementById('track-num');
    const emptyDiv = document.getElementById('track-empty');
    const resultDiv = document.getElementById('track-result');

    try {
      const orders = await SB.getUserOrders(State.currentUser.id);
      if (orders && orders.length > 0) {
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

async function trackOrder() {
  const num = document.getElementById('track-num')?.value?.trim().toUpperCase();
  if (!num) { toast('⚠️ Please enter a tracking number', 'error'); return; }

  const resultDiv = document.getElementById('track-result');
  const emptyDiv = document.getElementById('track-empty');

  // Show loading
  emptyDiv.style.display = 'none';
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = '<div style="text-align:center;padding:3rem"><div style="font-size:2rem;animation:spin 1s linear infinite;display:inline-block">⏳</div><p style="color:#7b72a8;margin-top:1rem">Looking up your order...</p></div>';

  try {
    const order = await SB.getOrder(num);
    if (!order) {
      resultDiv.style.display = 'none';
      emptyDiv.style.display = 'block';
      toast('⚠️ Order not found. Check your tracking number!', 'error');
      return;
    }

    const tracking = await SB.getTracking(order.id);
    const steps = [
      { key: 'pending', label: '🕐 Order Received', desc: 'Your order has been received' },
      { key: 'confirmed', label: '✅ Confirmed', desc: 'Artisan is preparing your order' },
      { key: 'processing', label: '🔨 Crafting', desc: 'Being handcrafted with care' },
      { key: 'shipped', label: '🚚 Shipped', desc: 'On the way to you' },
      { key: 'delivered', label: '🎉 Delivered', desc: 'Enjoy your purchase!' }
    ];
    const currentStepIndex = steps.findIndex(s => s.key === order.status);
    const statusColors = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#06b6d4', delivered: '#10b981' };
    const statusColor = statusColors[order.status] || '#7c3aed';

    resultDiv.innerHTML = `
      <div style="padding:2rem;background:white;border-radius:20px;border:1px solid rgba(107,63,212,0.15);box-shadow:0 4px 24px rgba(74,31,168,0.08);margin-bottom:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid rgba(107,63,212,0.1)">
          <div>
            <p style="font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:#7b72a8;margin-bottom:0.3rem">Tracking Number</p>
            <p style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:#1e0a4e;font-weight:600">${order.tracking_number}</p>
          </div>
          <span style="background:${statusColor}20;color:${statusColor};padding:0.4rem 1rem;border-radius:20px;font-size:0.75rem;font-weight:600;text-transform:uppercase">● ${order.status}</span>
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

        <!-- Timeline -->
        <div style="position:relative;padding-left:2rem">
          <div style="position:absolute;left:0.45rem;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#7c3aed,#e8e4ff)"></div>
          ${steps.map((step, i) => {
            const done = i <= currentStepIndex;
            const active = i === currentStepIndex;
            const trackEvent = tracking.find(t => t.status === step.key);
            return `<div style="position:relative;margin-bottom:1.5rem;opacity:${done ? '1' : '0.4'}">
              <div style="position:absolute;left:-1.6rem;top:0.2rem;width:14px;height:14px;border-radius:50%;background:${active ? '#7c3aed' : done ? '#9b72f0' : '#e8e4ff'};border:2px solid ${done ? '#7c3aed' : '#d4d0f0'};${active ? 'box-shadow:0 0 0 4px rgba(124,58,237,0.15)' : ''}"></div>
              <p style="font-size:0.85rem;font-weight:600;color:#1e0a4e;margin-bottom:0.2rem">${step.label}</p>
              <p style="font-size:0.75rem;color:#7b72a8">${trackEvent ? trackEvent.message : step.desc}</p>
              ${trackEvent ? `<p style="font-size:0.68rem;color:#b0a8d4;margin-top:0.2rem">${new Date(trackEvent.created_at).toLocaleString('fr-TN')}${trackEvent.location ? ' · ' + trackEvent.location : ''}</p>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch(e) {
    resultDiv.style.display = 'none';
    emptyDiv.style.display = 'block';
    toast('⚠️ Error fetching order. Try again.', 'error');
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
  }
  initReveal();
}

// ── ACCOUNT ──
function renderAccount() {
  if (!State.currentUser) { showPage('auth'); return; }
  const u = State.currentUser;
  const tier = STN.LOYALTY_TIERS.find(t => u.points >= t.min && u.points <= t.max) || STN.LOYALTY_TIERS[0];
  const nextTier = STN.LOYALTY_TIERS[STN.LOYALTY_TIERS.indexOf(tier) + 1];
  const progress = nextTier ? ((u.points - tier.min) / (nextTier.min - tier.min)) * 100 : 100;
  const page = document.getElementById('page-account');
  if (!page) return;
  page.innerHTML = `
  <div class="s">
    <div class="s-header reveal">
      <span class="eyebrow">My Account</span>
      <h1 class="display" style="font-size:3rem">Hello, <em class="gold-text">${u.firstName}!</em></h1>
      <div class="divider center"></div>
    </div>
    <div class="grid-2" style="gap:2rem;margin-bottom:3rem">
      <div class="glass-lg reveal" style="padding:2rem">
        <div style="display:flex;align-items:center;gap:1.2rem;margin-bottom:1.5rem">
          <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--purple-mid),var(--purple-glow));border:2px solid rgba(124,58,237,0.3);display:flex;align-items:center;justify-content:center;font-size:1.8rem">${u.avatar || '👤'}</div>
          <div>
            <div style="font-size:1.1rem;color:var(--champagne);font-weight:500">${u.firstName} ${u.lastName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${u.email}</div>
            <div style="font-size:0.7rem;color:var(--gold);margin-top:0.2rem">${u.wilaya} · ${u.delegation}</div>
          </div>
        </div>
        <div style="display:flex;gap:0.8rem;flex-wrap:wrap">
          <button class="btn btn-ghost btn-sm" onclick="showPage('track')">My Orders</button>
          <button class="btn btn-ghost btn-sm" onclick="showPage('wishlist')">Wishlist (${State.wishlist.length})</button>
          <button class="btn btn-danger btn-sm" onclick="logout()">Sign Out</button>
        </div>
      </div>
      <div class="glass-lg reveal" style="padding:2rem;border-color:rgba(${tier.color},0.3)">
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
          <div style="font-size:2rem">🏆</div>
          <div>
            <div style="font-size:0.65rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-muted)">Loyalty Status</div>
            <div style="font-size:1.4rem;font-family:var(--font-display);color:var(--champagne)">${tier.name} <em class="gold-text">Member</em></div>
          </div>
        </div>
        <div style="font-size:1.8rem;font-family:var(--font-display);color:var(--champagne);margin-bottom:0.3rem">${u.points.toLocaleString()} <span style="font-size:1rem;color:var(--text-muted)">points</span></div>
        ${nextTier ? `
        <div style="background:var(--bg-1,#f8f7ff);border-radius:4px;height:6px;margin:0.8rem 0;overflow:hidden">
          <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--gold),var(--champagne));border-radius:4px;transition:width 1s"></div>
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${(nextTier.min - u.points).toLocaleString()} points to ${nextTier.name}</div>` : '<div style="font-size:0.72rem;color:var(--success)">✦ Maximum tier reached!</div>'}
      </div>
    </div>
  </div>`;
}

// ── ADMIN ──
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
  return `<div style="display:flex;min-height:100vh;background:#f9fafb;font-family:'Outfit',sans-serif">
    <!-- SIDEBAR -->
    <div style="width:240px;flex-shrink:0;background:white;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto">
      <div style="padding:1.5rem 1rem 1rem">
        <div style="font-size:0.65rem;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;padding:0 0.5rem;margin-bottom:0.5rem">Main Menu</div>
        ${['overview:📊:Overview','orders:🧾:Orders','products:📦:Products','users:👥:Customers','vendors:🏪:Vendors'].map(s => {
          const [id,icon,label] = s.split(':');
          return `<div id="adm-nav-${id}" onclick="switchAdmin('${id}')" style="display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0.8rem;border-radius:8px;cursor:pointer;margin-bottom:0.2rem;color:#374151;font-size:0.875rem;transition:all 0.15s" onmouseover="if(!this.classList.contains('adm-active'))this.style.background='#f3f4f6'" onmouseout="if(!this.classList.contains('adm-active'))this.style.background=''">${icon} ${label}</div>`;
        }).join('')}
      </div>
      <div style="margin-top:auto;padding:1rem;border-top:1px solid #e5e7eb">
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.7rem;background:#f9fafb;border-radius:8px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#9b72f0);display:flex;align-items:center;justify-content:center;color:white;font-size:0.8rem;font-weight:700">A</div>
          <div><div style="font-size:0.8rem;font-weight:600;color:#111827">Admin</div><div style="font-size:0.7rem;color:#6b7280">Super Admin</div></div>
        </div>
      </div>
    </div>
    <!-- CONTENT -->
    <div style="flex:1;padding:2rem;min-width:0" id="admin-content"></div>
  </div>`;
}

function switchAdmin(section) {
  // Update nav
  document.querySelectorAll('[id^="adm-nav-"]').forEach(el => {
    el.style.background = '';
    el.style.color = '#374151';
    el.style.fontWeight = '';
    el.classList.remove('adm-active');
  });
  const active = document.getElementById('adm-nav-' + section);
  if (active) {
    active.style.background = '#f5f3ff';
    active.style.color = '#7c3aed';
    active.style.fontWeight = '600';
    active.classList.add('adm-active');
  }

  const content = document.getElementById('admin-content');
  if (!content) return;

  const users = STN.DB.get('users') || [];
  const orders = STN.DB.get('orders') || [];
  const vendors = users.filter(u => u.role === 'vendor');
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => o.status !== 'delivered').length;

  if (section === 'overview') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:2rem">
          <h1 style="font-size:1.5rem;font-weight:700;color:#111827;margin-bottom:0.25rem">Dashboard Overview</h1>
          <p style="color:#6b7280;font-size:0.875rem">Welcome back, Admin! Here's what's happening today.</p>
        </div>
        <!-- KPI CARDS -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;margin-bottom:2rem">
          ${[
            {label:'Total Revenue',value:revenue.toLocaleString()+' TND',icon:'💰',change:'+18%',color:'#7c3aed',bg:'#f5f3ff'},
            {label:'Total Orders',value:orders.length,icon:'🧾',change:'+12 this week',color:'#2563eb',bg:'#eff6ff'},
            {label:'Customers',value:users.length,icon:'👥',change:'+5 today',color:'#059669',bg:'#f0fdf4'},
            {label:'Products',value:State.products.length,icon:'📦',change:'+3 new',color:'#d97706',bg:'#fffbeb'}
          ].map(k => `
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow=''">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
                <div style="width:40px;height:40px;background:${k.bg};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">${k.icon}</div>
                <span style="background:#f0fdf4;color:#166534;font-size:0.7rem;padding:0.2rem 0.6rem;border-radius:20px;font-weight:600">↑ ${k.change}</span>
              </div>
              <div style="font-size:1.75rem;font-weight:700;color:#111827;margin-bottom:0.25rem">${k.value}</div>
              <div style="font-size:0.8rem;color:#6b7280">${k.label}</div>
            </div>
          `).join('')}
        </div>
        <!-- RECENT ORDERS + TOP PRODUCTS -->
        <div style="display:grid;grid-template-columns:1fr 340px;gap:1.5rem">
          <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
              <h3 style="font-size:0.95rem;font-weight:600;color:#111827">Recent Orders</h3>
              <button onclick="switchAdmin('orders')" style="color:#7c3aed;background:none;border:none;font-size:0.8rem;cursor:pointer;font-weight:600">View All →</button>
            </div>
            <div style="overflow-x:auto">
              <table style="width:100%;border-collapse:collapse">
                <thead><tr style="background:#f9fafb">${['Order ID','Customer','Total','Status','Date'].map(h=>`<th style="text-align:left;padding:0.75rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${h}</th>`).join('')}</tr></thead>
                <tbody>${orders.slice(-6).reverse().map(o => `
                  <tr style="border-top:1px solid #f3f4f6" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                    <td style="padding:0.875rem 1rem;font-size:0.8rem;font-weight:600;color:#7c3aed">${o.tracking_number || o.id}</td>
                    <td style="padding:0.875rem 1rem;font-size:0.8rem;color:#374151">${o.phone || 'Guest'}</td>
                    <td style="padding:0.875rem 1rem;font-size:0.8rem;font-weight:600;color:#111827">${(o.total||0).toLocaleString()} TND</td>
                    <td style="padding:0.875rem 1rem"><span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:${o.status==='delivered'?'#dcfce7':o.status==='shipped'?'#dbeafe':'#fef9c3'};color:${o.status==='delivered'?'#166534':o.status==='shipped'?'#1d4ed8':'#92400e'}">${o.status||'pending'}</span></td>
                    <td style="padding:0.875rem 1rem;font-size:0.78rem;color:#9ca3af">${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Today'}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <!-- Quick stats panel -->
          <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">
              <h3 style="font-size:0.95rem;font-weight:600;color:#111827;margin-bottom:1.2rem">Order Status</h3>
              ${[
                {label:'Pending',count:orders.filter(o=>!o.status||o.status==='pending').length,color:'#f59e0b',bg:'#fffbeb'},
                {label:'Processing',count:orders.filter(o=>o.status==='processing').length,color:'#3b82f6',bg:'#eff6ff'},
                {label:'Shipped',count:orders.filter(o=>o.status==='shipped').length,color:'#8b5cf6',bg:'#f5f3ff'},
                {label:'Delivered',count:orders.filter(o=>o.status==='delivered').length,color:'#10b981',bg:'#ecfdf5'},
              ].map(s=>`
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid #f3f4f6">
                  <div style="display:flex;align-items:center;gap:0.6rem">
                    <div style="width:8px;height:8px;border-radius:50%;background:${s.color}"></div>
                    <span style="font-size:0.82rem;color:#374151">${s.label}</span>
                  </div>
                  <span style="background:${s.bg};color:${s.color};padding:0.15rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:700">${s.count}</span>
                </div>`).join('')}
            </div>
            <div style="background:linear-gradient(135deg,#7c3aed,#4a1fa8);border-radius:12px;padding:1.5rem;color:white">
              <div style="font-size:0.75rem;opacity:0.8;margin-bottom:0.5rem">Pending Vendors</div>
              <div style="font-size:2rem;font-weight:700;margin-bottom:0.5rem">${vendors.filter(v=>!v.verified).length}</div>
              <div style="font-size:0.78rem;opacity:0.75;margin-bottom:1rem">waiting for approval</div>
              <button onclick="switchAdmin('vendors')" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);padding:0.4rem 1rem;border-radius:6px;font-size:0.78rem;cursor:pointer;font-family:inherit">Review Now →</button>
            </div>
          </div>
        </div>
      </div>`;

  } else if (section === 'orders') {
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
              <thead><tr style="background:#f9fafb">${['Tracking #','Client','Shop','Wilaya / Address','Items','Total','Status','Date','Action'].map(h=>`<th style="text-align:left;padding:0.75rem 0.875rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;white-space:nowrap">${h}</th>`).join('')}</tr></thead>
              <tbody>${orders.length===0?'<tr><td colspan="9" style="text-align:center;padding:3rem;color:#9ca3af">No orders yet</td></tr>':[...orders].reverse().map(o=>`
                <tr style="border-top:1px solid #f3f4f6" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;font-weight:600;color:#7c3aed;white-space:nowrap">${o.tracking_number||o.id||'-'}</td>
                  <td style="padding:0.75rem 0.875rem">
                    <div style="font-size:0.78rem;font-weight:600;color:#111827">${o.client_name||o.phone||'Guest'}</div>
                    <div style="font-size:0.7rem;color:#9ca3af">${o.phone||''}</div>
                  </td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;color:#374151">${o.shop_names||'Shopping'}</td>
                  <td style="padding:0.75rem 0.875rem">
                    <div style="font-size:0.78rem;font-weight:600;color:#374151">${o.wilaya||'-'}</div>
                    <div style="font-size:0.7rem;color:#9ca3af;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.address||''}</div>
                  </td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;color:#374151">${Array.isArray(o.items)?o.items.map(i=>i.name||'Item').join(', ').substring(0,30)+(o.items.length>1?'...':''):'1 item'}</td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.78rem;font-weight:700;color:#111827;white-space:nowrap">${(o.total||0).toLocaleString()} TND</td>
                  <td style="padding:0.75rem 0.875rem">
                    <span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.7rem;font-weight:600;white-space:nowrap;background:${o.status==='delivered'?'#dcfce7':o.status==='shipped'?'#dbeafe':o.status==='processing'?'#ede9fe':'#fef9c3'};color:${o.status==='delivered'?'#166534':o.status==='shipped'?'#1d4ed8':o.status==='processing'?'#6d28d9':'#92400e'}">
                      ${o.status==='delivered'?'✓ Delivered':o.status==='shipped'?'🚚 Shipped':o.status==='processing'?'⚙️ Processing':'⏳ Pending'}
                    </span>
                  </td>
                  <td style="padding:0.75rem 0.875rem;font-size:0.72rem;color:#9ca3af;white-space:nowrap">${o.created_at?new Date(o.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Today'}</td>
                  <td style="padding:0.75rem 0.875rem">
                    <button onclick="advanceOrder('${o.id||o.tracking_number}')" style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.72rem;cursor:pointer;font-weight:600;white-space:nowrap">Advance →</button>
                  </td>
                </tr>`).join('')}
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
                  <td style="padding:0.875rem 1rem"><button onclick="openProductDetail(${p.id})" style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.3rem 0.8rem;border-radius:6px;font-size:0.75rem;cursor:pointer">View</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;

  } else if (section === 'users') {
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
          var roleColor = u.role==='admin'?'#92400e':u.role==='vendor'?'#6d28d9':'#374151';
          var roleBg = u.role==='admin'?'#fef3c7':u.role==='vendor'?'#ede9fe':'#f3f4f6';
          var actions = u.role === 'admin' ? '<span style="color:#9ca3af;font-size:0.72rem">Admin</span>' : (
            isBanned
              ? '<button data-action="unban" data-id="'+u.id+'" style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;font-weight:600">Unban</button>'
              : '<button data-action="timeout" data-id="'+u.id+'" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;font-weight:600;margin-right:0.3rem">&#9203; Timeout</button><button data-action="ban" data-id="'+u.id+'" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;font-weight:600">&#128683; Ban</button>'
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
    content.innerHTML = '<div><div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;font-weight:700;color:#111827">Customers</h1><p style="color:#6b7280;font-size:0.875rem">'+users.length+' users &middot; '+users.filter(function(u){return u.banned;}).length+' banned</p></div><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb"><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Customer</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Email</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Wilaya</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Role</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Points</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Actions</th></tr></thead><tbody>'+userRows+'</tbody></table></div></div></div>';
    var tbl = content.querySelector('table');
    if (tbl) tbl.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var id = btn.dataset.id;
      if (btn.dataset.action === 'ban') banUser(id);
      else if (btn.dataset.action === 'timeout') timeoutUser(id);
      else if (btn.dataset.action === 'unban') unbanUser(id);
    });
    } else if (section === 'vendors') {
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
            : '<button data-action="timeout" data-id="'+v.id+'" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer;margin-right:0.3rem">Timeout</button><button data-action="ban" data-id="'+v.id+'" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.25rem 0.6rem;border-radius:6px;font-size:0.7rem;cursor:pointer">Ban</button>';
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
    content.innerHTML = '<div><div style="margin-bottom:1.5rem"><h1 style="font-size:1.5rem;font-weight:700;color:#111827">Vendors</h1><p style="color:#6b7280;font-size:0.875rem">'+vendors.length+' vendors</p></div><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f9fafb"><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Vendor</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Email</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Shop</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Wilaya</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Products</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Actions</th></tr></thead><tbody>'+vendorRows+'</tbody></table></div></div></div>';
    var vtbl = content.querySelector('table');
    if (vtbl) vtbl.addEventListener('click', function(e) {
      var b = e.target.closest('[data-action]');
      if (!b) return;
      var id = b.dataset.id, action = b.dataset.action;
      if (action==='approve') verifyVendor(id);
      else if (action==='ban') banUser(id);
      else if (action==='timeout') timeoutUser(id);
      else if (action==='unban') unbanUser(id);
    });
  
  }
}

function advanceOrder(orderId) {
  const orders = STN.DB.get('orders') || [];
  const order = orders.find(o => o.id === orderId || o.tracking_number === orderId);
  if (!order) { toast('Order not found', 'error'); return; }
  const steps = ['pending','processing','shipped','delivered'];
  const curr = steps.indexOf(order.status||'pending');
  if (curr >= steps.length - 1) { toast('Order already delivered!', 'default'); return; }
  order.status = steps[curr + 1];
  STN.DB.set('orders', orders);
  toast('Order advanced to: ' + order.status, 'success');
  switchAdmin('orders');
}

function verifyVendor(userId) {
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => u.id == userId);
  if (idx !== -1) { users[idx].verified = true; STN.DB.set('users', users); }
  toast('Vendor approved!', 'success');
  switchAdmin('vendors');
}

function banUser(userId) {
  if (!confirm('Are you sure you want to BAN this user permanently?')) return;
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => u.id == userId);
  if (idx !== -1) {
    users[idx].banned = true;
    users[idx].ban_reason = 'Banned by admin';
    users[idx].banned_at = new Date().toISOString();
    STN.DB.set('users', users);
    // If this is the current logged in user, log them out
    if (State.currentUser && State.currentUser.id == userId) {
      State.currentUser = null;
      STN.DB.set('currentUser', null);
      updateNavUser();
      showPage('home');
    }
    toast('User banned!', 'success');
  }
  const activeSection = document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

function timeoutUser(userId) {
  const hours = prompt('Timeout duration in hours? (e.g. 24, 48, 72)', '24');
  if (!hours) return;
  const h = parseInt(hours);
  if (isNaN(h) || h <= 0) { toast('Invalid duration', 'error'); return; }
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => u.id == userId);
  if (idx !== -1) {
    const until = new Date(Date.now() + h * 3600000).toISOString();
    users[idx].timeout_until = until;
    users[idx].timeout_hours = h;
    STN.DB.set('users', users);
    toast('User timed out for ' + h + ' hours!', 'success');
  }
  const activeSection = document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

function unbanUser(userId) {
  const users = STN.DB.get('users') || [];
  const idx = users.findIndex(u => u.id == userId);
  if (idx !== -1) {
    users[idx].banned = false;
    users[idx].timeout_until = null;
    STN.DB.set('users', users);
    toast('User unbanned!', 'success');
  }
  const activeSection = document.querySelector('[id^="adm-nav-"].adm-active')?.id?.replace('adm-nav-', '') || 'users';
  switchAdmin(activeSection);
}

// ── VENDOR DASHBOARD ──
function renderVendor() {
  if (!State.currentUser) { showPage('auth'); return; }
  const page = document.getElementById('page-vendor');
  if (!page) return;
  page.innerHTML = buildVendorHTML();
  switchVendorSection('overview');
}

function buildVendorHTML() {
  const u = State.currentUser;
  return `<div style="display:flex;min-height:100vh;background:#f9fafb;font-family:'Outfit',sans-serif">
    <!-- SIDEBAR -->
    <div style="width:240px;flex-shrink:0;background:white;border-right:1px solid #e5e7eb;display:flex;flex-direction:column;position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto">
      <div style="padding:1.25rem 1rem;border-bottom:1px solid #e5e7eb">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#9b72f0);display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem">🏪</div>
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:#111827">${u.shop_name||u.shopName||'My Shop'}</div>
            <div style="font-size:0.7rem;color:${u.verified?'#059669':'#d97706'};font-weight:600">${u.verified?'✓ Verified':'⏳ Pending Approval'}</div>
          </div>
        </div>
      </div>
      <div style="padding:1rem">
        <div style="font-size:0.65rem;font-weight:700;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;padding:0 0.5rem;margin-bottom:0.5rem">Menu</div>
        ${['overview:📊:Overview','upload:📤:Upload Product','inventory:📦:My Products','orders:🧾:My Orders'].map(s => {
          const [id,icon,label] = s.split(':');
          return `<div id="vnd-nav-${id}" onclick="switchVendorSection('${id}')" style="display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0.8rem;border-radius:8px;cursor:pointer;margin-bottom:0.2rem;color:#374151;font-size:0.875rem;transition:all 0.15s" onmouseover="if(!this.classList.contains('vnd-active'))this.style.background='#f3f4f6'" onmouseout="if(!this.classList.contains('vnd-active'))this.style.background=''">${icon} ${label}</div>`;
        }).join('')}
      </div>
      <div style="margin-top:auto;padding:1rem;border-top:1px solid #e5e7eb">
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.7rem;background:#f9fafb;border-radius:8px">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#9b72f0);display:flex;align-items:center;justify-content:center;color:white;font-size:0.8rem;font-weight:700">${(u.first_name||u.firstName||'V')[0].toUpperCase()}</div>
          <div><div style="font-size:0.8rem;font-weight:600;color:#111827">${u.first_name||u.firstName||'Vendor'}</div><div style="font-size:0.7rem;color:#6b7280">Vendor</div></div>
        </div>
      </div>
    </div>
    <!-- CONTENT -->
    <div style="flex:1;padding:2rem;min-width:0" id="vendor-content"></div>
  </div>`;
}

function switchVendorSection(section) {
  document.querySelectorAll('[id^="vnd-nav-"]').forEach(el => {
    el.style.background = '';
    el.style.color = '#374151';
    el.style.fontWeight = '';
    el.classList.remove('vnd-active');
  });
  const active = document.getElementById('vnd-nav-' + section);
  if (active) {
    active.style.background = '#f5f3ff';
    active.style.color = '#7c3aed';
    active.style.fontWeight = '600';
    active.classList.add('vnd-active');
  }

  const content = document.getElementById('vendor-content');
  if (!content) return;
  const u = State.currentUser;
  const myProds = State.products.filter(p => p.vendorId === u.id || p.brand === (u.shopName||u.shop_name));
  const orders = STN.DB.get('orders') || [];
  const myRevenue = myProds.reduce((s,p) => s + p.price, 0);

  if (section === 'overview') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:2rem">
          <h1 style="font-size:1.5rem;font-weight:700;color:#111827">Welcome back, ${u.first_name||u.firstName||'Vendor'}! 👋</h1>
          <p style="color:#6b7280;font-size:0.875rem">Here's your shop overview</p>
        </div>
        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-bottom:2rem">
          ${[
            {label:'My Products',value:myProds.length,icon:'📦',color:'#7c3aed',bg:'#f5f3ff'},
            {label:'Total Orders',value:orders.length,icon:'🧾',color:'#2563eb',bg:'#eff6ff'},
            {label:'Shop Status',value:u.verified?'✓ Live':'Pending',icon:'🏪',color:u.verified?'#059669':'#d97706',bg:u.verified?'#f0fdf4':'#fffbeb'}
          ].map(k=>`
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
                <div style="width:40px;height:40px;background:${k.bg};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">${k.icon}</div>
              </div>
              <div style="font-size:1.75rem;font-weight:700;color:${k.color};margin-bottom:0.25rem">${k.value}</div>
              <div style="font-size:0.8rem;color:#6b7280">${k.label}</div>
            </div>`).join('')}
        </div>
        <!-- Quick actions -->
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem">
          <h3 style="font-size:0.95rem;font-weight:600;color:#111827;margin-bottom:1.2rem">Quick Actions</h3>
          <div style="display:flex;gap:1rem;flex-wrap:wrap">
            <button onclick="switchVendorSection('upload')" style="background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.7rem 1.5rem;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:inherit">+ Upload Product</button>
            <button onclick="switchVendorSection('inventory')" style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.7rem 1.5rem;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:inherit">📦 My Products</button>
            <button onclick="showPage('products')" style="background:#f9fafb;color:#374151;border:1px solid #e5e7eb;padding:0.7rem 1.5rem;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:inherit">🛍️ View Store</button>
          </div>
        </div>
        ${!u.verified?`<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><span style="font-size:1.5rem">⏳</span><div><div style="font-weight:600;color:#92400e;font-size:0.875rem">Awaiting Approval</div><div style="color:#a16207;font-size:0.8rem">Your shop is under review. Products will go live once approved by admin.</div></div></div>`:''}
      </div>`;

  } else if (section === 'upload') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem">
          <h1 style="font-size:1.5rem;font-weight:700;color:#111827">Upload Product</h1>
          <p style="color:#6b7280;font-size:0.875rem">Add a new product to your shop</p>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:2rem;max-width:700px">
          <!-- Image upload -->
          <div style="margin-bottom:1.5rem">
            <label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.5rem">Product Image *</label>
            <div id="upload-zone" onclick="document.getElementById('vp-image-file').click()" style="border:2px dashed #e9d5ff;border-radius:10px;padding:2rem;text-align:center;cursor:pointer;background:#fafafa;transition:all 0.2s" onmouseover="this.style.borderColor='#7c3aed';this.style.background='#f5f3ff'" onmouseout="this.style.borderColor='#e9d5ff';this.style.background='#fafafa'">
              <div id="upload-preview" style="display:none;margin-bottom:1rem"><img id="upload-img-preview" style="max-height:150px;border-radius:8px;object-fit:cover" src=""/></div>
              <div id="upload-placeholder"><div style="font-size:2rem;margin-bottom:0.5rem">📸</div><p style="color:#6b7280;margin-bottom:0.25rem;font-size:0.875rem;font-weight:500">Click to upload image</p><p style="font-size:0.75rem;color:#9ca3af">PNG, JPG up to 10MB</p></div>
              <div id="upload-loading" style="display:none"><div style="font-size:1.5rem">⏳</div><p style="color:#7c3aed;font-size:0.85rem">Uploading...</p></div>
            </div>
            <input type="file" id="vp-image-file" accept="image/*" style="display:none" onchange="uploadToCloudinary(this)"/>
            <input type="hidden" id="vp-image-url"/>
          </div>
          <!-- Fields -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Product Name *</label><input type="text" id="vp-title" placeholder="e.g. Velvet Sultan Sofa" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Brand Name *</label><input type="text" id="vp-brand" placeholder="Your brand" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
          </div>
          <div style="margin-bottom:1rem"><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Description *</label><textarea id="vp-desc" placeholder="Describe your product..." style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;min-height:100px;resize:vertical;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Price (TND) *</label><input type="number" id="vp-price" placeholder="1299" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Old Price</label><input type="number" id="vp-old-price" placeholder="1599" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Stock *</label><input type="number" id="vp-stock" placeholder="10" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Category *</label>
              <select id="vp-cat" style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;background:white;box-sizing:border-box">
                <option value="sofa">Sofa / Furniture</option><option value="rug">Rugs / Kilim</option><option value="lighting">Lighting</option><option value="ceramic">Ceramics</option><option value="bedroom">Bedroom</option><option value="outdoor">Outdoor</option><option value="fragrance">Fragrance</option><option value="decor">Decor</option>
              </select>
            </div>
            <div><label style="display:block;font-size:0.82rem;font-weight:600;color:#374151;margin-bottom:0.4rem">Badge (optional)</label><input type="text" id="vp-badge" placeholder="New, Bestseller..." style="width:100%;border:1px solid #e5e7eb;border-radius:8px;padding:0.65rem 0.875rem;font-size:0.875rem;color:#111827;font-family:inherit;outline:none;box-sizing:border-box" onfocus="this.style.borderColor='#7c3aed'" onblur="this.style.borderColor='#e5e7eb'"/></div>
          </div>
          <button onclick="uploadProduct()" style="background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:inherit;width:100%">Upload Product →</button>
        </div>
      </div>`;

  } else if (section === 'inventory') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h1 style="font-size:1.5rem;font-weight:700;color:#111827">My Products</h1>
            <p style="color:#6b7280;font-size:0.875rem">${myProds.length} products in your shop</p>
          </div>
          <button onclick="switchVendorSection('upload')" style="background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.7rem 1.25rem;border-radius:8px;font-size:0.875rem;font-weight:600;cursor:pointer;font-family:inherit">+ Add Product</button>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          ${myProds.length===0?'<div style="text-align:center;padding:4rem;color:#9ca3af"><div style="font-size:3rem;margin-bottom:1rem">📦</div><p style="font-weight:500;margin-bottom:0.5rem">No products yet</p><p style="font-size:0.875rem">Upload your first product to start selling!</p></div>':`
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="background:#f9fafb">${['Product','Price','Stock','Status','Action'].map(h=>`<th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${h}</th>`).join('')}</tr></thead>
              <tbody>${myProds.map(p=>`
                <tr style="border-top:1px solid #f3f4f6" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                  <td style="padding:0.875rem 1rem">
                    <div style="display:flex;align-items:center;gap:0.75rem">
                      <div style="width:40px;height:40px;background:#f5f3ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">${p.emoji}</div>
                      <div><div style="font-size:0.82rem;font-weight:600;color:#111827">${p.name}</div><div style="font-size:0.72rem;color:#9ca3af">${p.cat}</div></div>
                    </div>
                  </td>
                  <td style="padding:0.875rem 1rem;font-size:0.875rem;font-weight:600;color:#111827">${p.price.toLocaleString()} TND</td>
                  <td style="padding:0.875rem 1rem;font-size:0.875rem"><span style="color:${p.stock>5?'#059669':'#dc2626'};font-weight:600">${p.stock} units</span></td>
                  <td style="padding:0.875rem 1rem"><span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:${p.verified?'#dcfce7':'#fef9c3'};color:${p.verified?'#166534':'#92400e'}">${p.verified?'✓ Live':'⏳ Pending'}</span></td>
                  <td style="padding:0.875rem 1rem"><button onclick="deleteVendorProduct(${p.id})" style="background:#fee2e2;color:#dc2626;border:1px solid #fecaca;padding:0.3rem 0.8rem;border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:600">Delete</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>`;

  } else if (section === 'orders') {
    content.innerHTML = `
      <div>
        <div style="margin-bottom:1.5rem">
          <h1 style="font-size:1.5rem;font-weight:700;color:#111827">My Orders</h1>
          <p style="color:#6b7280;font-size:0.875rem">${orders.length} orders received</p>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
          ${orders.length===0?'<div style="text-align:center;padding:4rem;color:#9ca3af"><div style="font-size:3rem;margin-bottom:1rem">🧾</div><p>No orders yet</p></div>':`
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="background:#f9fafb">${['Order #','Phone','Total','Status','Date'].map(h=>`<th style="text-align:left;padding:0.875rem 1rem;font-size:0.75rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${h}</th>`).join('')}</tr></thead>
              <tbody>${orders.reverse().map(o=>`
                <tr style="border-top:1px solid #f3f4f6" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                  <td style="padding:0.875rem 1rem;font-size:0.8rem;font-weight:600;color:#7c3aed">${o.tracking_number||o.id}</td>
                  <td style="padding:0.875rem 1rem;font-size:0.8rem;color:#374151">${o.phone||'-'}</td>
                  <td style="padding:0.875rem 1rem;font-size:0.875rem;font-weight:600;color:#111827">${(o.total||0).toLocaleString()} TND</td>
                  <td style="padding:0.875rem 1rem"><span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:${o.status==='delivered'?'#dcfce7':o.status==='shipped'?'#dbeafe':'#fef9c3'};color:${o.status==='delivered'?'#166534':o.status==='shipped'?'#1d4ed8':'#92400e'}">${o.status||'pending'}</span></td>
                  <td style="padding:0.875rem 1rem;font-size:0.78rem;color:#9ca3af">${o.created_at?new Date(o.created_at).toLocaleDateString():'Today'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
      </div>`;
  }
}


function uploadToCloudinary(input) {
  const file = input.files[0];
  if (!file) return;
  const zone = document.getElementById('upload-zone');
  const placeholder = document.getElementById('upload-placeholder');
  const loading = document.getElementById('upload-loading');
  const preview = document.getElementById('upload-preview');
  const previewImg = document.getElementById('upload-img-preview');

  placeholder.style.display = 'none';
  loading.style.display = 'block';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Shopping');
  formData.append('cloud_name', 'dzhnza3dn');

  fetch('https://api.cloudinary.com/v1_1/dzhnza3dn/image/upload', {
    method: 'POST',
    body: formData
  })
  .then(r => r.json())
  .then(data => {
    if (data.secure_url) {
      document.getElementById('vp-image-url').value = data.secure_url;
      previewImg.src = data.secure_url;
      preview.style.display = 'block';
      loading.style.display = 'none';
      placeholder.style.display = 'none';
      toast('✦ Image uploaded successfully!', 'success');
    } else {
      throw new Error('Upload failed');
    }
  })
  .catch(() => {
    loading.style.display = 'none';
    placeholder.style.display = 'block';
    toast('⚠️ Upload failed. Check your internet connection.', 'error');
  });
}

function deleteVendorProduct(productId) {
  State.products = State.products.filter(p => p.id !== productId);
  STN.DB.set('products', State.products);
  toast('Product deleted!', 'success');
  switchVendorSection('inventory');
}

function uploadProduct() {
  const title = document.getElementById('vp-title')?.value?.trim();
  const brand = document.getElementById('vp-brand')?.value?.trim();
  const desc = document.getElementById('vp-desc')?.value?.trim();
  const price = parseFloat(document.getElementById('vp-price')?.value);
  const stock = parseInt(document.getElementById('vp-stock')?.value);
  const cat = document.getElementById('vp-cat')?.value;
  const badge = document.getElementById('vp-badge')?.value?.trim();

  if (!title || !brand || !desc || !price || !stock) { toast('⚠️ Please fill all required fields', 'error'); return; }

  const emojis = {furniture:'🪑',lighting:'🔦',decor:'🎭',ceramics:'🏺',bedroom:'🛌',outdoor:'🌳'};
  const newProduct = {
    id: Date.now(),
    name: title,
    brand: State.currentUser?.shopName || brand,
    vendorId: State.currentUser?.id,
    region: State.currentUser?.wilaya || 'Tunisia',
    cat,
    price,
    oldPrice: parseFloat(document.getElementById('vp-old-price')?.value) || null,
    rating: 0,
    reviews: 0,
    badge: badge || null,
    emoji: emojis[cat] || '🎁',
    image: document.getElementById('vp-image-url')?.value || null,
    verified: false,
    stock,
    desc
  };

  State.products.push(newProduct);
  STN.DB.set('products', State.products);
  toast(`✦ Product "${title}" uploaded! Pending admin verification.`, 'success');
  switchVendorSection('inventory');
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
  toast(`✦ Subscribed! Welcome to Shopping family 🇹🇳`, 'success');
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

// ── START ──
document.addEventListener('DOMContentLoaded', init);

