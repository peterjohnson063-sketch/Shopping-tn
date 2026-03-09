// ═══════════════════════════════════════════════
// SHOPPING.TN — MAIN APPLICATION ENGINE
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
  State.cart = State.cart.filter(i => i.id !== productId);
  STN.DB.set('cart', State.cart);
  updateCartBadge();
  renderCartDrawer();
}

function updateQty(productId, delta) {
  const item = State.cart.find(i => i.id === productId);
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
        <button class="wishlist-btn" onclick="removeFromCart(${item.id})" style="width:28px;height:28px;font-size:0.8rem;color:var(--danger);border-color:rgba(255,71,87,0.2)">✕</button>
        <div class="qty-control">
          <button class="qty-btn" onclick="updateQty(${item.id},-1)">−</button>
          <span style="font-size:0.85rem;min-width:20px;text-align:center">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id},1)">+</button>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = State.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = getCartTotal();
  const saved = subtotal - total;

  document.getElementById('cart-footer').innerHTML = `
    <div style="padding:1.2rem 1.6rem;border-top:1px solid rgba(107,63,212,0.12)">
      <div style="display:flex;gap:0.6rem;margin-bottom:1rem">
        <input type="text" class="form-input" id="promo-input" placeholder="Promo code…" style="flex:1;padding:0.65rem 0.9rem;font-size:0.82rem"/>
        <button class="btn btn-ghost btn-sm" onclick="applyPromo()">Apply</button>
      </div>
      ${State.promoApplied ? `<div style="font-size:0.75rem;color:var(--success);margin-bottom:0.8rem">✓ ${STN.PROMO_CODES[State.promoApplied].desc}</div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-muted);margin-bottom:0.4rem"><span>Subtotal</span><span>${subtotal.toLocaleString()} TND</span></div>
      ${saved > 0 ? `<div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--success);margin-bottom:0.4rem"><span>Saved</span><span>−${saved.toLocaleString()} TND</span></div>` : ''}
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

function checkout() {
  if (!State.currentUser) {
    closeCart();
    toast('Please sign in to checkout', 'error');
    showPage('auth');
    return;
  }
  // Create order
  const orderId = 'SHP-2026-' + String(Math.floor(Math.random() * 9000) + 1000);
  const order = {
    id: orderId,
    userId: State.currentUser.id,
    items: [...State.cart],
    total: getCartTotal(),
    status: 'confirmed',
    date: new Date().toISOString().split('T')[0],
    tracking: [{ status: 'Confirmed', time: new Date().toLocaleString() }]
  };
  const orders = STN.DB.get('orders') || [];
  orders.push(order);
  STN.DB.set('orders', orders);

  // Award points
  const users = STN.DB.get('users') || [];
  const userIdx = users.findIndex(u => u.id === State.currentUser.id);
  if (userIdx !== -1) {
    users[userIdx].points = (users[userIdx].points || 0) + Math.floor(order.total * 0.1);
    STN.DB.set('users', users);
    State.currentUser = users[userIdx];
    STN.DB.set('currentUser', State.currentUser);
  }

  State.cart = [];
  State.promoApplied = null;
  STN.DB.set('cart', []);
  updateCartBadge();
  closeCart();
  toast(`✦ Order ${orderId} confirmed! Check your tracker.`, 'success');
  showPage('track');
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
      <span class="eyebrow">Welcome to Shopping.TN</span>
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
      <div style="margin-top:1.2rem;text-align:center;font-size:0.75rem;color:var(--text-muted)">Demo: admin@shopping.tn / admin123</div>
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
            <span style="font-size:0.85rem;color:#1e0a4e;font-weight:500">🏪 I am an artisan/vendor — I want to sell on Shopping.TN</span>
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

function doLogin() {
  const email = document.getElementById('login-email')?.value?.trim();
  const pass = document.getElementById('login-pass')?.value;
  const users = STN.DB.get('users') || [];
  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) { toast('⚠️ Invalid email or password', 'error'); return; }
  State.currentUser = user;
  STN.DB.set('currentUser', user);
  updateNavUser();
  toast(`✦ Welcome back, ${user.firstName}!`, 'success');
  if (user.role === 'admin') showPage('admin');
  else if (user.role === 'vendor') showPage('vendor');
  else showPage('home');
}

function doRegister() {
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
  
  const newUser = { 
    id: Date.now(), firstName: fname, lastName: lname, email, phone, wilaya, delegation, 
    password: pass, role: isVendor ? 'vendor' : 'customer', 
    points: 100, verified: false, avatar: isVendor ? '🏪' : '👤',
    shopName: shopName || null, specialty: specialty || null
  };
  users.push(newUser);
  STN.DB.set('users', users);
  State.currentUser = newUser;
  STN.DB.set('currentUser', newUser);
  updateNavUser();
  if (isVendor) {
    toast(`✦ Welcome ${shopName}! Your vendor account is pending verification.`, 'success');
    showPage('vendor');
  } else {
    toast(`✦ Welcome to Shopping.TN, ${fname}! You earned 100 bonus points!`, 'success');
    showPage('home');
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
  const featured = State.products.slice(0, 6);
  const grid = document.getElementById('home-featured-grid');
  if (grid) grid.innerHTML = featured.map(productCardHTML).join('');
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
function renderTrack() {
  const empty = document.getElementById('track-empty');
  const result = document.getElementById('track-result');
  if (empty) empty.style.display = 'block';
  if (result) result.style.display = 'none';
  initReveal();
}

function trackOrder() {
  const num = document.getElementById('track-num')?.value?.trim();
  if (!num) { toast('⚠️ Please enter a tracking number', 'error'); return; }

  const allOrders = STN.DB.get('orders') || [];
  const order = allOrders.find(o => o.id === num);
  const resultDiv = document.getElementById('track-result');
  const emptyDiv = document.getElementById('track-empty');

  if (!order) {
    toast('⚠️ Order not found. Try: SHP-2026-0042', 'error');
    return;
  }

  emptyDiv.style.display = 'none';
  const steps = ['Confirmed','Processing','Shipped','Out for Delivery','Delivered'];
  const currentStep = steps.indexOf(order.tracking[order.tracking.length-1]?.status);

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <div class="glass" style="padding:2rem;margin-bottom:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
        <div>
          <div class="section-label">Order ID</div>
          <div style="font-family:var(--font-display);font-size:1.2rem;color:var(--champagne)">${order.id}</div>
        </div>
        <span class="status status-transit">● In Transit</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem">
        <div class="glass" style="padding:1rem;text-align:center;border-radius:var(--radius-sm)"><div class="section-label">Date</div><div style="font-size:0.85rem;color:var(--champagne)">${order.date}</div></div>
        <div class="glass" style="padding:1rem;text-align:center;border-radius:var(--radius-sm)"><div class="section-label">Items</div><div style="font-size:0.85rem;color:var(--champagne)">${order.items.length}</div></div>
        <div class="glass" style="padding:1rem;text-align:center;border-radius:var(--radius-sm)"><div class="section-label">Total</div><div style="font-size:0.85rem;color:var(--champagne)">${order.total.toLocaleString()} TND</div></div>
      </div>
      <div class="timeline">
        ${steps.map((step, i) => {
          const done = i < order.tracking.length;
          const active = i === order.tracking.length - 1;
          const trackEntry = order.tracking[i];
          return `<div class="timeline-step ${!done ? 'pending' : ''}">
            <div class="timeline-dot ${active ? 'active' : done ? 'done' : 'pending'}"></div>
            <div>
              <div class="timeline-label">${step}</div>
              <div class="timeline-time">${trackEntry ? trackEntry.time : 'Pending'}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    toast('⚠️ Admin access required', 'error'); showPage('auth'); return;
  }
  const users = STN.DB.get('users') || [];
  const orders = STN.DB.get('orders') || [];
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const page = document.getElementById('page-admin');
  if (!page) return;

  page.innerHTML = `
  <div class="s">
    <div style="margin-bottom:3rem">
      <span class="eyebrow reveal">Admin Panel</span>
      <h1 class="display reveal" style="font-size:3rem">Command <em class="gold-text">Center</em></h1>
      <div class="divider reveal"></div>
    </div>
    <div style="display:flex;gap:1.5rem">
      <!-- Sidebar -->
      <div style="width:220px;flex-shrink:0">
        <div class="dash-sidebar">
          <div class="dash-nav-item active" id="admin-nav-overview" onclick="switchAdmin('overview')"><span class="dash-nav-icon">📊</span>Overview</div>
          <div class="dash-nav-item" id="admin-nav-products" onclick="switchAdmin('products')"><span class="dash-nav-icon">📦</span>Products</div>
          <div class="dash-nav-item" id="admin-nav-orders" onclick="switchAdmin('orders')"><span class="dash-nav-icon">🧾</span>Orders</div>
          <div class="dash-nav-item" id="admin-nav-users" onclick="switchAdmin('users')"><span class="dash-nav-icon">👥</span>Users</div>
          <div class="dash-nav-item" id="admin-nav-vendors" onclick="switchAdmin('vendors')"><span class="dash-nav-icon">🏪</span>Vendors</div>
        </div>
      </div>
      <!-- Content -->
      <div style="flex:1" id="admin-content">
        <!-- OVERVIEW -->
        <div id="admin-overview">
          <div class="grid-4 reveal" style="margin-bottom:2rem">
            <div class="kpi-card"><div class="kpi-val">${revenue.toLocaleString()}</div><div class="kpi-label">Revenue (TND)</div><div class="kpi-trend up">↑ +18% this month</div></div>
            <div class="kpi-card"><div class="kpi-val">${orders.length}</div><div class="kpi-label">Total Orders</div><div class="kpi-trend up">↑ +12 this week</div></div>
            <div class="kpi-card"><div class="kpi-val">${users.length}</div><div class="kpi-label">Registered Users</div><div class="kpi-trend up">↑ +5 today</div></div>
            <div class="kpi-card"><div class="kpi-val">${State.products.length}</div><div class="kpi-label">Products</div><div class="kpi-trend up">↑ +3 new</div></div>
          </div>
          <div class="glass reveal" style="padding:1.5rem;margin-bottom:1.5rem">
            <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem">Recent Orders</h3>
            <table class="data-table">
              <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>${orders.slice(-5).reverse().map(o => `
                <tr>
                  <td style="font-family:var(--font-display);font-size:0.9rem">${o.id}</td>
                  <td>${o.items.length} item(s)</td>
                  <td>${o.total?.toLocaleString()} TND</td>
                  <td><span class="status status-${o.status === 'delivered' ? 'delivered' : 'transit'}">${o.status}</span></td>
                  <td style="color:var(--text-muted)">${o.date}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  initReveal();
}

function switchAdmin(section) {
  document.querySelectorAll('[id^="admin-nav-"]').forEach(el => el.classList.remove('active'));
  document.getElementById('admin-nav-' + section)?.classList.add('active');
  const content = document.getElementById('admin-content');
  if (!content) return;

  const users = STN.DB.get('users') || [];
  const orders = STN.DB.get('orders') || [];
  const vendors = users.filter(u => u.role === 'vendor');

  if (section === 'products') {
    content.innerHTML = `
      <div class="glass reveal" style="padding:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
          <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold)">All Products (${State.products.length})</h3>
          <button class="btn btn-gold btn-sm" onclick="toast('Add product feature coming soon!','success')">+ Add Product</button>
        </div>
        <table class="data-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price (TND)</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead>
          <tbody>${State.products.map(p => `
            <tr>
              <td><div style="display:flex;align-items:center;gap:0.8rem"><span style="font-size:1.4rem">${p.emoji}</span><div><div style="color:var(--champagne)">${p.name}</div><div style="font-size:0.7rem;color:var(--text-muted)">${p.brand}</div></div></div></td>
              <td style="text-transform:capitalize">${p.cat}</td>
              <td>${p.price.toLocaleString()}</td>
              <td>${p.stock}</td>
              <td><span style="color:var(--gold)">★</span> ${p.rating}</td>
              <td><button class="btn btn-glass btn-sm" onclick="openProductDetail(${p.id})">View</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } else if (section === 'orders') {
    content.innerHTML = `
      <div class="glass reveal" style="padding:1.5rem">
        <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem">All Orders (${orders.length})</h3>
        <table class="data-table">
          <thead><tr><th>Order ID</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>${orders.map(o => `
            <tr>
              <td style="font-family:var(--font-display)">${o.id}</td>
              <td>${o.items.map(i=>i.name).join(', ').substring(0,30)}…</td>
              <td>${o.total?.toLocaleString()} TND</td>
              <td><span class="status status-${o.status === 'delivered' ? 'delivered' : 'transit'}">${o.status}</span></td>
              <td style="color:var(--text-muted)">${o.date}</td>
              <td><button class="btn btn-glass btn-sm" onclick="advanceOrder('${o.id}')">Advance</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } else if (section === 'users') {
    content.innerHTML = `
      <div class="glass reveal" style="padding:1.5rem">
        <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem">All Users (${users.length})</h3>
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Wilaya</th><th>Role</th><th>Points</th><th>Status</th></tr></thead>
          <tbody>${users.map(u => `
            <tr>
              <td><div style="display:flex;align-items:center;gap:0.6rem"><span>${u.avatar||'👤'}</span><span>${u.firstName} ${u.lastName}</span></div></td>
              <td style="color:var(--text-muted)">${u.email}</td>
              <td>${u.wilaya}</td>
              <td style="text-transform:capitalize">${u.role}</td>
              <td style="color:var(--gold)">${(u.points||0).toLocaleString()}</td>
              <td><span class="status ${u.verified ? 'status-active' : 'status-pending'}">${u.verified ? 'Verified' : 'Pending'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } else if (section === 'vendors') {
    content.innerHTML = `
      <div class="glass reveal" style="padding:1.5rem">
        <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem">Vendors (${vendors.length})</h3>
        ${vendors.length > 0 ? `<table class="data-table">
          <thead><tr><th>Vendor</th><th>Email</th><th>Region</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${vendors.map(v => `
            <tr>
              <td>${v.firstName} ${v.lastName}</td>
              <td style="color:var(--text-muted)">${v.email}</td>
              <td>${v.wilaya}</td>
              <td><span class="status ${v.verified ? 'status-active' : 'status-pending'}">${v.verified ? 'Verified' : 'Pending'}</span></td>
              <td><button class="btn btn-success btn-sm" onclick="verifyVendor(${v.id})">Verify</button></td>
            </tr>`).join('')}
          </tbody>
        </table>` : '<p style="color:var(--text-muted);font-size:0.85rem">No vendors yet.</p>'}
      </div>`;
  }
  initReveal();
}

function advanceOrder(orderId) {
  const orders = STN.DB.get('orders') || [];
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const steps = ['Confirmed','Processing','Shipped','Out for Delivery','Delivered'];
  const nextStep = steps[order.tracking.length];
  if (!nextStep) { toast('Order already delivered', 'default'); return; }
  order.tracking.push({ status: nextStep, time: new Date().toLocaleString() });
  order.status = nextStep === 'Delivered' ? 'delivered' : 'transit';
  STN.DB.set('orders', orders);
  toast(`✦ Order advanced to: ${nextStep}`, 'success');
  switchAdmin('orders');
}

function verifyVendor(userId) {
  const users = STN.DB.get('users') || [];
  const userIdx = users.findIndex(u => u.id === userId);
  if (userIdx !== -1) { users[userIdx].verified = true; STN.DB.set('users', users); }
  toast('✦ Vendor verified!', 'success');
  switchAdmin('vendors');
}

// ── VENDOR DASHBOARD ──
function renderVendor() {
  if (!State.currentUser) { showPage('auth'); return; }
  const page = document.getElementById('page-vendor');
  if (!page) return;

  const myProducts = State.products.filter(p => p.brand.includes(State.currentUser.firstName));
  const orders = STN.DB.get('orders') || [];
  const revenue = myProducts.reduce((s,p) => s + p.price, 0);

  page.innerHTML = `
  <div class="s">
    <div style="margin-bottom:2.5rem">
      <span class="eyebrow reveal">Vendor Portal</span>
      <h1 class="display reveal" style="font-size:3rem">Your <em class="gold-text">Dashboard</em></h1>
      <div class="divider reveal"></div>
    </div>
    <div style="display:flex;gap:1.5rem">
      <div style="width:220px;flex-shrink:0">
        <div class="dash-sidebar">
          <div class="dash-nav-item active" onclick="this.parentElement.querySelectorAll('.dash-nav-item').forEach(e=>e.classList.remove('active'));this.classList.add('active');switchVendorSection('overview')"><span class="dash-nav-icon">📊</span>Overview</div>
          <div class="dash-nav-item" onclick="this.parentElement.querySelectorAll('.dash-nav-item').forEach(e=>e.classList.remove('active'));this.classList.add('active');switchVendorSection('upload')"><span class="dash-nav-icon">📤</span>Upload Product</div>
          <div class="dash-nav-item" onclick="this.parentElement.querySelectorAll('.dash-nav-item').forEach(e=>e.classList.remove('active'));this.classList.add('active');switchVendorSection('inventory')"><span class="dash-nav-icon">📦</span>Inventory</div>
          <div class="dash-nav-item" onclick="this.parentElement.querySelectorAll('.dash-nav-item').forEach(e=>e.classList.remove('active'));this.classList.add('active');switchVendorSection('orders')"><span class="dash-nav-icon">🧾</span>Orders</div>
        </div>
      </div>
      <div style="flex:1" id="vendor-content">
        <div class="grid-3 reveal" style="margin-bottom:1.5rem">
          <div class="kpi-card"><div class="kpi-val">${myProducts.length}</div><div class="kpi-label">My Products</div></div>
          <div class="kpi-card"><div class="kpi-val">${orders.length}</div><div class="kpi-label">Total Orders</div></div>
          <div class="kpi-card"><div class="kpi-val">${(State.currentUser.verified ? '✓' : '⏳')}</div><div class="kpi-label">Verified Status</div></div>
        </div>
        <div class="glass reveal" style="padding:1.5rem">
          <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem">Quick Actions</h3>
          <div style="display:flex;gap:0.8rem;flex-wrap:wrap">
            <button class="btn btn-gold btn-sm" onclick="switchVendorSection('upload')">+ Upload Product</button>
            <button class="btn btn-ghost btn-sm" onclick="switchVendorSection('inventory')">View Inventory</button>
            <button class="btn btn-ghost btn-sm" onclick="showPage('products')">View Store</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  initReveal();
}

function switchVendorSection(section) {
  const content = document.getElementById('vendor-content');
  if (!content) return;

  if (section === 'upload') {
    content.innerHTML = `
      <div class="glass-lg reveal" style="padding:2.5rem">
        <h3 style="font-family:var(--font-display);font-size:1.5rem;color:var(--champagne);margin-bottom:2rem">Upload New Product</h3>
        <div class="upload-zone reveal" style="margin-bottom:2rem" onclick="toast('File upload simulation — in production this connects to storage','default')">
          <div class="upload-icon">📸</div>
          <p class="body" style="margin-bottom:0.5rem">Click to upload product images</p>
          <p style="font-size:0.72rem;color:var(--text-dim)">PNG, JPG, WEBP up to 10MB each</p>
        </div>
        <div class="form-row" style="margin-bottom:1rem">
          <div class="form-group"><label class="form-label">Product Title *</label><input type="text" class="form-input" id="vp-title" placeholder="Artisan Velvet Sofa"/></div>
          <div class="form-group"><label class="form-label">Brand Name *</label><input type="text" class="form-input" id="vp-brand" placeholder="Your Brand Name"/></div>
        </div>
        <div class="form-group" style="margin-bottom:1rem"><label class="form-label">Description *</label><textarea class="form-textarea" id="vp-desc" placeholder="Describe your product in detail…"></textarea></div>
        <div class="form-row three" style="margin-bottom:1rem">
          <div class="form-group"><label class="form-label">Price (TND) *</label><input type="number" class="form-input" id="vp-price" placeholder="1299"/></div>
          <div class="form-group"><label class="form-label">Original Price</label><input type="number" class="form-input" id="vp-old-price" placeholder="1599"/></div>
          <div class="form-group"><label class="form-label">Stock Quantity *</label><input type="number" class="form-input" id="vp-stock" placeholder="10"/></div>
        </div>
        <div class="form-row" style="margin-bottom:1.5rem">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-select" id="vp-cat">
              <option value="furniture">Furniture</option><option value="lighting">Lighting</option>
              <option value="decor">Decor</option><option value="ceramics">Ceramics</option>
              <option value="bedroom">Bedroom</option><option value="outdoor">Outdoor</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Badge (optional)</label><input type="text" class="form-input" id="vp-badge" placeholder="New, Bestseller…"/></div>
        </div>
        <button class="btn btn-gold btn-lg" onclick="uploadProduct()">Upload Product ✦</button>
      </div>`;
  } else if (section === 'inventory') {
    const myProds = State.products.filter(p => p.vendorId === State.currentUser.id || p.brand === State.currentUser.shopName);
    content.innerHTML = `
      <div class="glass reveal" style="padding:1.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
          <h3 style="font-size:0.8rem;letter-spacing:0.12em;text-transform:uppercase;color:#7c3aed">My Products (${myProds.length})</h3>
          <button class="btn btn-gold btn-sm" onclick="switchVendorSection('upload')">+ Add Product</button>
        </div>
        ${myProds.length === 0 ? '<p style="color:#7b72a8;text-align:center;padding:2rem">No products yet. Upload your first product!</p>' : `
        <table class="data-table">
          <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${myProds.map(p => `
            <tr>
              <td><div style="display:flex;align-items:center;gap:0.8rem"><span style="font-size:1.4rem">${p.emoji}</span><span style="color:#1e0a4e">${p.name}</span></div></td>
              <td style="color:#1e0a4e">${p.price.toLocaleString()} TND</td>
              <td style="color:#1e0a4e">${p.stock > 5 ? p.stock : '<span style="color:orange">' + p.stock + ' ⚠️</span>'}</td>
              <td><span style="background:${p.verified ? '#dcfce7' : '#fef9c3'};color:${p.verified ? '#166534' : '#854d0e'};padding:0.2rem 0.6rem;border-radius:20px;font-size:0.72rem">${p.verified ? '✓ Live' : '⏳ Pending'}</span></td>
              <td><button onclick="deleteVendorProduct(${p.id})" style="background:#fee2e2;color:#dc2626;border:none;padding:0.2rem 0.6rem;border-radius:6px;font-size:0.72rem;cursor:pointer">Delete</button></td>
            </tr>`).join('')}
          </tbody>
        </table>`}
      </div>`;
  }
  initReveal();
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
  if (!grid) return;
  const u = State.currentUser;

  // Render promo codes
  if (promoSection) {
    promoSection.innerHTML = `
      <div class="glass reveal" style="padding:2rem;text-align:left;border-color:rgba(124,58,237,0.2)">
        <h3 style="font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem;text-align:center">🎁 Active Promo Codes</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:0.8rem">
          ${Object.entries(STN.PROMO_CODES).map(([code, info]) => `
            <div style="background:#f8f7ff;border:1px solid rgba(124,58,237,0.2);border-radius:var(--radius-sm);padding:1rem;display:flex;justify-content:space-between;align-items:center;gap:0.8rem">
              <div>
                <div style="font-size:0.88rem;color:var(--gold);font-weight:600;font-family:monospace;letter-spacing:0.05em">${code}</div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem">${info.desc}</div>
              </div>
              <button class="btn btn-ghost btn-sm" style="font-size:0.62rem;padding:0.3rem 0.7rem;flex-shrink:0"
                onclick="if(navigator.clipboard){navigator.clipboard.writeText('${code}');toast('✦ Copied: ${code}','success')}else{toast('Code: ${code}','success')}">Copy</button>
            </div>`).join('')}
        </div>
      </div>`;
  }

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
  toast(`✦ Subscribed! Welcome to Shopping.TN family 🇹🇳`, 'success');
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
