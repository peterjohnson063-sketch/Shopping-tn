
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
  products: STN.PRODUCTS_DATA, // Initialize products from data.js immediately
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
  
  // Initialize products from Supabase or fallback to local data
  initializeProducts();
  
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

// Initialize products from Supabase
async function initializeProducts() {
  try {
    // Try to fetch from Supabase first
    const supabaseProducts = await SB.getProducts();
    if (supabaseProducts && supabaseProducts.length > 0) {
      State.products = supabaseProducts;
      STN.DB.set('products', State.products);
      console.log('✅ Products loaded from Supabase:', supabaseProducts.length);
    } else {
      // Fallback to local data
      State.products = STN.DB.get('products') || STN.PRODUCTS_DATA;
      console.log('⚠️ Using fallback local products data');
    }
  } catch (error) {
    console.error('Error fetching products from Supabase:', error);
    // Fallback to local data
    State.products = STN.DB.get('products') || STN.PRODUCTS_DATA;
    console.log('⚠️ Using fallback local products data due to error');
  }
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
  var btn = document.getElementById('nav-user-area');
  if (!btn) return;
  if (State.currentUser) {
    var role = State.currentUser.role;
    var name = State.currentUser.first_name || State.currentUser.firstName || '';
    var el = document.createElement('button');
    el.style.cssText = 'border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;display:flex;align-items:center;gap:0.5rem;';
    if (role === 'admin') {
      el.style.background = 'linear-gradient(135deg,#7c3aed,#4a1fa8)';
      el.style.color = 'white';
      el.textContent = 'Admin Dashboard';
      el.onclick = function(){ showPage('admin'); };
    } else if (role === 'vendor') {
      el.style.background = 'linear-gradient(135deg,#059669,#047857)';
      el.style.color = 'white';
      el.textContent = 'My Dashboard';
      el.onclick = function(){ showPage('vendor'); };
    } else {
      el.style.background = 'white';
      el.style.color = '#374151';
      el.style.border = '1px solid #e5e7eb';
      el.textContent = name || 'My Account';
      el.onclick = function(){ showPage('account'); };
    }
    btn.innerHTML = '';
    btn.appendChild(el);
  } else {
    var el2 = document.createElement('button');
    el2.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.5rem 1.2rem;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:Outfit,sans-serif;';
    el2.textContent = 'Sign In';
    el2.onclick = function(){ showPage('auth'); };
    btn.innerHTML = '';
    btn.appendChild(el2);
  }
}

// ── PAGE NAVIGATION ──
function showPage(id) {
  console.log('🔄 showPage called with:', id);
  
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
  
  if (!fname || !phone || !wilaya || !address) { toast('⚠️ Please fill all fields', 'error'); return; }
  
  const btn = document.querySelector('#checkout-modal button:last-child');
  btn.textContent = 'Processing...';
  btn.disabled = true;

  try {
    // Get shop names from cart items
    const shopNames = [...new Set(State.cart.map(i => i.brand || i.shopName || 'Shopping').filter(Boolean))].join(', ');
    
    const order = await SB.createOrder({
      user_id: State.currentUser?.id || null,
      items: State.cart,
      total: getCartTotal(),
      status: 'pending',
      wilaya,
      address,
      phone,
      notes: fname + ' ' + lname
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
        <span style="font-size:0.75rem;color:var(--accent);cursor:pointer;text-decoration:underline" onclick="showForgotPassword()">Forgot password?</span>
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
  // 6. Rate limit - max 3 accounts per session
  const regCount = parseInt(sessionStorage.getItem('reg_count') || '0');
  if (regCount >= 3) {
    toast('Too many registration attempts. Please try again later.', 'error'); return;
  }
  sessionStorage.setItem('reg_count', String(regCount + 1));

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
  const q = document.getElementById('prod-search')?.value?.trim()?.toLowerCase();
  
  // Add search query to filter state (we'll use this in filtering)
  if (q) {
    State.searchQuery = q;
    toast(`🔍 Searching for "${q}"...`);
  } else {
    State.searchQuery = '';
  }
  
  // Apply all filters including search
  filterAndRenderProducts();
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
  var tabs = [
    {id:'overview', label:'&#128202; Overview'},
    {id:'orders', label:'&#129534; Orders'},
    {id:'logistics', label:'🗺️ Logistics Map'},
    {id:'users', label:'&#128101; Customers'},
    {id:'vendors', label:'&#127978; Vendors'},
    {id:'vendor-dashboard', label:'&#128179; Vendor Dashboard'}
  ];
  var tabsHTML = tabs.map(function(t) {
    return '<button id="adm-nav-'+t.id+'" onclick="switchAdmin(\'' + t.id + '\')" style="background:none;border:none;border-bottom:2px solid transparent;padding:0.875rem 1.25rem;cursor:pointer;font-size:0.875rem;font-weight:500;color:#6b7280;font-family:Outfit,sans-serif;white-space:nowrap;transition:all 0.15s">'+t.label+'</button>';
  }).join('');
  return '<div style="background:#f9fafb;min-height:100vh">'
    + '<div style="background:white;border-bottom:2px solid #e5e7eb;padding:0 2rem;display:flex;align-items:center;gap:1rem;overflow-x:auto">'
    + '<span style="font-size:0.9rem;font-weight:700;color:#7c3aed;padding:0.875rem 0;margin-right:0.5rem;white-space:nowrap;flex-shrink:0">&#9881; Admin Panel</span>'
    + '<div style="display:flex;flex:1">' + tabsHTML + '</div>'
    + '</div>'
    + '<div style="padding:2rem" id="admin-content"></div>'
    + '</div>';
}

function switchAdmin(section) {
  // Update tabs
  document.querySelectorAll('[id^="adm-nav-"]').forEach(function(el) {
    el.style.borderBottomColor = 'transparent';
    el.style.color = '#6b7280';
    el.style.fontWeight = '500';
    el.classList.remove('adm-active');
  });
  var active = document.getElementById('adm-nav-' + section);
  if (active) {
    active.style.borderBottomColor = '#7c3aed';
    active.style.color = '#7c3aed';
    active.style.fontWeight = '700';
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
    
    // Build comprehensive vendor dashboard
    content.innerHTML = buildVendorDashboardHTML();
    
    // Initialize dashboard asynchronously
    initializeVendorDashboard().catch(error => {
      console.error('Failed to initialize vendor dashboard:', error);
      content.innerHTML = `
        <div style="text-align:center;padding:4rem;color:#dc2626">
          <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
          <h2 style="margin-bottom:0.5rem;color:#dc2626">Dashboard Initialization Failed</h2>
          <p style="margin-bottom:2rem;color:#dc2626">Unable to load vendor dashboard. Please try refreshing the page.</p>
          <button onclick="location.reload()" style="background:#dc2626;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Refresh Page</button>
        </div>
      `;
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

// ── VENDOR DASHBOARD (STANDALONE) ──
function renderVendorDashboard() {
  console.log('🔄 renderVendorDashboard called');
  
  if (!State.currentUser || State.currentUser.role !== 'vendor') {
    console.log('❌ Vendor access check failed - current user:', State.currentUser);
    document.getElementById('page-vendor-dashboard').innerHTML = `
      <div style="text-align:center;padding:4rem;color:#9ca3af">
        <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
        <h2 style="margin-bottom:0.5rem;color:#1e0a4e">Vendor Access Required</h2>
        <p style="margin-bottom:2rem;color:#6b7280">You need to be logged in as a vendor to access this dashboard.</p>
        <button onclick="showPage('auth')" style="background:#7c3aed;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">Sign In as Vendor</button>
      </div>
    `;
    return;
  }
  
  console.log('✅ Vendor access check passed - user is vendor');
  
  // Build comprehensive vendor dashboard
  console.log('🔄 Building vendor dashboard HTML...');
  document.getElementById('page-vendor-dashboard').innerHTML = buildVendorDashboardHTML();
  console.log('✅ Vendor dashboard HTML built');
  
  // Initialize dashboard asynchronously
  console.log('🔄 Initializing vendor dashboard...');
  initializeVendorDashboard().catch(error => {
    console.error('Failed to initialize vendor dashboard:', error);
    document.getElementById('page-vendor-dashboard').innerHTML = `
      <div style="text-align:center;padding:4rem;color:#dc2626">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h2 style="margin-bottom:0.5rem;color:#dc2626">Dashboard Initialization Failed</h2>
        <p style="margin-bottom:2rem;color:#dc2626">Unable to load vendor dashboard. Please try refreshing the page.</p>
        <button onclick="location.reload()" style="background:#dc2626;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Refresh Page</button>
      </div>
    `;
  });
}

// ── VENDOR DASHBOARD ──
function renderVendor() {
  console.log('🔄 renderVendor called');
  
  if (!State.currentUser) { 
    console.log('❌ No current user, redirecting to auth');
    showPage('auth'); 
    return; 
  }
  
  console.log('✅ User found:', State.currentUser);
  
  const page = document.getElementById('page-vendor');
  if (!page) {
    console.log('❌ Vendor page element not found');
    return;
  }
  
  console.log('🔄 Building vendor HTML...');
  page.innerHTML = buildVendorHTML();
  console.log('✅ Vendor HTML built');
  
  console.log('🔄 Switching to overview section...');
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
    + '<div style="background:white;border-bottom:2px solid #e5e7eb;padding:0 2rem;display:flex;align-items:center;gap:1rem;overflow-x:auto">'
    + '<span style="font-size:0.9rem;font-weight:700;color:#7c3aed;padding:0.875rem 0;margin-right:0.5rem;white-space:nowrap;flex-shrink:0">&#127978; '+shopName+'</span>'
    + '<span style="font-size:0.7rem;font-weight:600;color:'+(isVerified?'#059669':'#d97706')+';padding:0.2rem 0.6rem;background:'+(isVerified?'#f0fdf4':'#fffbeb')+';border-radius:20px;flex-shrink:0">'+(isVerified?'Verified':'Pending')+'</span>'
    + '<div style="display:flex;flex:1">' + tabsHTML + '</div>'
    + '</div>'
    + '<div style="padding:2rem" id="vendor-content"></div>'
    + '</div>';
}

function switchVendorSection(section) {
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
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Products</div><div style="font-size:1.8rem;font-weight:700;color:#7c3aed">'+myProds.length+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Total Orders</div><div style="font-size:1.8rem;font-weight:700;color:#2563eb">'+orders.length+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Pending</div><div style="font-size:1.8rem;font-weight:700;color:#d97706">'+pendingOrds+'</div></div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Revenue</div><div style="font-size:1.4rem;font-weight:700;color:#059669">'+totalRev.toLocaleString()+' TND</div></div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 280px;gap:1.5rem">'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem"><h3 style="font-size:0.95rem;font-weight:600;color:#111827">Recent Orders</h3>'
      +'<button data-action="view-orders" style="color:#7c3aed;background:none;border:none;font-size:0.8rem;cursor:pointer;font-weight:600">View All</button></div>'
      +recentHTML+'</div>'
      +'<div style="display:flex;flex-direction:column;gap:1rem">'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem">'
      +'<h3 style="font-size:0.9rem;font-weight:600;color:#111827;margin-bottom:0.875rem">Quick Actions</h3>'
      +'<button data-action="upload" style="width:100%;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white;border:none;padding:0.65rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;margin-bottom:0.5rem;display:block">+ Upload Product</button>'
      +'<button data-action="view-orders" style="width:100%;background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.65rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;margin-bottom:0.5rem;display:block">View Orders</button>'
      +'<button data-action="view-store" style="width:100%;background:#f9fafb;color:#374151;border:1px solid #e5e7eb;padding:0.65rem;border-radius:8px;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif;display:block">View Store</button>'
      +'</div>'
      +'<div style="background:'+statusBg+';border-radius:12px;padding:1.25rem;color:white">'
      +'<div style="font-size:0.72rem;opacity:0.8;margin-bottom:0.3rem">Shop Status</div>'
      +'<div style="font-size:1.2rem;font-weight:700;margin-bottom:0.4rem">'+statusText+'</div>'
      +'<div style="font-size:0.75rem;opacity:0.8">'+statusDesc+'</div>'
      +'</div>'
      +'</div></div></div>';
    
    content.innerHTML = html;
    content.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var a = btn.dataset.action;
      if (a === 'upload') switchVendorSection('upload');
      else if (a === 'view-orders') switchVendorSection('orders');
      else if (a === 'view-store') showPage('products');
    });

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
    var pendingOrders = orders.filter(function(o){ return o.status === 'pending'; });
    var processingOrders = orders.filter(function(o){ return o.status === 'processing' || o.status === 'ready'; });
    var doneOrders = orders.filter(function(o){ return o.status === 'shipped' || o.status === 'delivered'; });

    var orderRows = orders.length === 0
      ? '<tr><td colspan="7" style="text-align:center;padding:3rem;color:#9ca3af"><div style="font-size:3rem;margin-bottom:1rem">📭</div><p>No orders yet</p></td></tr>'
      : [...orders].reverse().map(function(o) {
          var isPending = o.status === 'pending';
          var isReady = o.status === 'ready';
          var isProcessing = o.status === 'processing';
          var isShipped = o.status === 'shipped' || o.status === 'delivered';
          var statusBadge = isShipped
            ? '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#dcfce7;color:#166534">✓ '+o.status+'</span>'
            : isReady
            ? '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#dbeafe;color:#1d4ed8">📦 Ready</span>'
            : isProcessing
            ? '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#ede9fe;color:#6d28d9">⚙️ Processing</span>'
            : '<span style="padding:0.25rem 0.75rem;border-radius:20px;font-size:0.72rem;font-weight:600;background:#fef9c3;color:#92400e">⏳ New Order</span>';

          var actionBtn = isShipped
            ? '<span style="color:#9ca3af;font-size:0.75rem">Completed</span>'
            : isReady
            ? '<span style="color:#1d4ed8;font-size:0.75rem;font-weight:600">Waiting pickup...</span>'
            : '<button data-oid="'+o.id+'" data-otrack="'+(o.tracking_number||'')+'" class="vendor-confirm-btn" style="background:linear-gradient(135deg,#059669,#047857);color:white;border:none;padding:0.4rem 1rem;border-radius:8px;font-size:0.78rem;cursor:pointer;font-weight:600">✓ Confirm &amp; Ready</button>';

          var items = Array.isArray(o.items) ? o.items.map(function(i){ return i.name||'Item'; }).join(', ').substring(0,40) : '1 item';

          return '<tr style="border-top:1px solid #f3f4f6;'+(isPending?'background:#fffbeb':'')+'">'
            +'<td style="padding:0.75rem 1rem;font-size:0.8rem;font-weight:600;color:#7c3aed">'+(o.tracking_number||o.id||'-')+'</td>'
            +'<td style="padding:0.75rem 1rem"><div style="font-size:0.8rem;font-weight:600;color:#111827">'+(o.notes||o.phone||'Guest')+'</div><div style="font-size:0.72rem;color:#9ca3af">'+(o.phone||'')+'</div></td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#374151">'+(o.wilaya||'-')+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.78rem;color:#374151;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+items+'</td>'
            +'<td style="padding:0.75rem 1rem;font-size:0.8rem;font-weight:700;color:#111827">'+(o.total||0).toLocaleString()+' TND</td>'
            +'<td style="padding:0.75rem 1rem">'+statusBadge+'</td>'
            +'<td style="padding:0.75rem 1rem">'+actionBtn+'</td>'
            +'</tr>';
        }).join('');

    content.innerHTML = '<div>'
      +'<div style="margin-bottom:1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap">'
      +'<div><h1 style="font-size:1.5rem;font-weight:700;color:#111827">My Orders</h1><p style="color:#6b7280;font-size:0.875rem">'+orders.length+' orders · <span style="color:#f59e0b;font-weight:600">'+pendingOrders.length+' new</span></p></div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">'
      +'<div style="background:white;border:1px solid #fde68a;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#fffbeb;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">⏳</div><div><div style="font-size:1.5rem;font-weight:700;color:#92400e">'+pendingOrders.length+'</div><div style="font-size:0.78rem;color:#6b7280">New Orders</div></div></div>'
      +'<div style="background:white;border:1px solid #c7d2fe;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#ede9fe;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">📦</div><div><div style="font-size:1.5rem;font-weight:700;color:#6d28d9">'+processingOrders.length+'</div><div style="font-size:0.78rem;color:#6b7280">Processing</div></div></div>'
      +'<div style="background:white;border:1px solid #bbf7d0;border-radius:12px;padding:1.25rem;display:flex;align-items:center;gap:1rem"><div style="width:40px;height:40px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">✓</div><div><div style="font-size:1.5rem;font-weight:700;color:#166534">'+doneOrders.length+'</div><div style="font-size:0.78rem;color:#6b7280">Completed</div></div></div>'
      +'</div>'
      +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">'
      +'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">'
      +'<thead><tr style="background:#f9fafb"><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Tracking</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Client</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Wilaya</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Items</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Total</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th><th style="text-align:left;padding:0.75rem 1rem;font-size:0.72rem;font-weight:600;color:#6b7280;text-transform:uppercase">Action</th></tr></thead>'
      +'<tbody>'+orderRows+'</tbody></table></div></div></div>';

    // Event delegation for confirm buttons
    var tbl = content.querySelector('table');
    if (tbl) tbl.addEventListener('click', function(e) {
      var btn = e.target.closest('.vendor-confirm-btn');
      if (!btn) return;
      vendorConfirmOrder(btn.dataset.oid, btn.dataset.otrack);
    });
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
  var msg = '*New Order Ready - Shopping*\n\n'
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

async function deleteVendorProduct(productId) {
  try {
    // Delete from Supabase first
    await SB.deleteProduct(productId);
    
    // Update local state
    State.products = State.products.filter(p => p.id !== productId);
    STN.DB.set('products', State.products);
    
    toast('Product deleted successfully!', 'success');
    switchVendorSection('inventory');
    
    // Refresh products display if on products page
    if (State.currentPage === 'products') {
      filterAndRenderProducts();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    toast('⚠️ Failed to delete product. Please try again.', 'error');
  }
}

async function uploadProduct() {
  const title = document.getElementById('vp-title')?.value?.trim();
  const brand = document.getElementById('vp-brand')?.value?.trim();
  const desc = document.getElementById('vp-desc')?.value?.trim();
  const price = parseFloat(document.getElementById('vp-price')?.value);
  const stock = parseInt(document.getElementById('vp-stock')?.value);
  const cat = document.getElementById('vp-cat')?.value;
  const badge = document.getElementById('vp-badge')?.value?.trim();

  if (!title || !brand || !desc || !price || !stock) { toast('⚠️ Please fill all required fields', 'error'); return; }

  const emojis = {sofa:'🛋️',rug:'🏺',lighting:'💡',ceramic:'🏺',bedroom:'🛏️',outdoor:'🌿',fragrance:'🧴',decor:'🎨',furniture:'🪑'};
  
  const newProduct = {
    name: title,
    brand: State.currentUser?.shop_name || State.currentUser?.shopName || brand,
    vendorId: State.currentUser?.id,
    region: State.currentUser?.wilaya || 'Tunisia',
    category: cat,
    price,
    oldPrice: parseFloat(document.getElementById('vp-old-price')?.value) || null,
    rating: 0,
    reviews: 0,
    badge: badge || null,
    emoji: emojis[cat] || '📦',
    image: document.getElementById('vp-image-url')?.value || null,
    verified: false, // Will be verified by admin
    stock,
    description: desc,
    created_at: new Date().toISOString()
  };

  try {
    // Save to Supabase first
    const savedProduct = await SB.createProduct(newProduct);
    
    // Update local state with the returned product (includes Supabase ID)
    State.products.push(savedProduct);
    STN.DB.set('products', State.products);
    
    // Clear form
    document.getElementById('vp-title').value = '';
    document.getElementById('vp-brand').value = '';
    document.getElementById('vp-desc').value = '';
    document.getElementById('vp-price').value = '';
    document.getElementById('vp-old-price').value = '';
    document.getElementById('vp-stock').value = '';
    document.getElementById('vp-badge').value = '';
    document.getElementById('vp-image-url').value = '';
    document.getElementById('vp-cat').selectedIndex = 0;
    
    toast('✦ Product uploaded successfully! Pending admin verification.', 'success');
    switchVendorSection('inventory');
    
    // Refresh products display if on products page
    if (State.currentPage === 'products') {
      filterAndRenderProducts();
    }
    
  } catch (error) {
    console.error('Error uploading product:', error);
    toast('⚠️ Failed to upload product. Please try again.', 'error');
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
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(State.searchQuery) || 
      product.brand.toLowerCase().includes(State.searchQuery) || 
      (product.region && product.region.toLowerCase().includes(State.searchQuery)) ||
      (product.category && product.category.toLowerCase().includes(State.searchQuery))
    );
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
  
  // Add reveal animations
  setTimeout(() => {
    grid.querySelectorAll('.product-card').forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('reveal', 'visible');
      }, index * 50);
    });
  }, 100);
}

// Create product card HTML
function createProductCard(product) {
  const isInWishlist = State.wishlist.some(item => item.id === product.id);
  const rating = product.rating || 0;
  const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  
  return `
    <div class="product-card" onclick="showProductDetail(${product.id})">
      <div class="product-img-wrap">
        ${product.emoji ? `<div class="product-emoji">${product.emoji}</div>` : `<img src="${product.image || ''}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover">`}
        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
        ${product.verified ? `<div class="product-verified">✓ Verified</div>` : ''}
        <div class="product-overlay">
          <button class="btn btn-white btn-sm" onclick="event.stopPropagation(); quickView(${product.id})">👁️ Quick View</button>
          <button class="btn btn-gold btn-sm" onclick="event.stopPropagation(); addToCart(${product.id})">🛒 Add to Cart</button>
        </div>
      </div>
      <div class="product-body">
        <div class="product-brand">${product.brand || 'Shopping'}</div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">(${product.reviews || 0})</span>
        </div>
        <div class="product-price-row">
          <span class="price">${product.price} <span class="price-currency">TND</span></span>
          ${product.oldPrice ? `<span class="price-old">${product.oldPrice} TND</span>` : ''}
          <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist(${product.id})">
            ${isInWishlist ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── VENDOR DASHBOARD FUNCTIONS ──

function buildVendorDashboardHTML() {
  console.log('🔄 buildVendorDashboardHTML called');
  console.log('Current user:', State.currentUser);
  
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
              <div id="vendor-logistics-map" style="height:300px;position:relative">
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
      await loadProducts();
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
  return true;
}

async function initializeVendorDashboard() {
  console.log('🔄 Starting vendor dashboard initialization...');
  
  // Load all components in parallel - fast and safe
  console.log('🔄 Loading all components...');
  
  const results = await Promise.allSettled([
    safeLoadKPIs(),
    safeLoadOrders(),
    safeLoadInventory(),
    safeLoadAnalytics(),
    safeLoadLogistics()
  ]);
  
  const failures = results.filter(r => r.status === 'rejected');
  const successes = results.filter(r => r.status === 'fulfilled');
  
  console.log(`📊 Results: ${successes.length} successful, ${failures.length} failed`);
  if (failures.length === 0) {
    console.log('✅ All vendor dashboard components loaded successfully');
  } else {
    console.warn('⚠️ Some components had issues:', failures.map(f => f.reason));
  }
}

// Safe data loading - non-blocking, just ensure local data is available
async function safeLoadData() {
  // Products are always initialized from STN.PRODUCTS_DATA at startup
  // If somehow empty, restore from local data immediately
  if (!State.products || State.products.length === 0) {
    State.products = STN.DB.get('products') || STN.PRODUCTS_DATA;
    console.log('⚠️ Products restored from local data');
  }
  console.log('✅ Data ready:', State.products.length, 'products');
  return true;
}

// Safe KPI loading
async function safeLoadKPIs() {
  try {
    console.log('🔄 Loading KPIs...');
    const vendorId = State.currentUser?.id;
    if (!vendorId) {
      console.warn('No vendor ID found');
      return null;
    }

    // Wait for data
    await safeLoadData();
    
    const orders = STN.DB.get('orders') || [];
    const products = State.products || [];
    const vendorShopName = State.currentUser?.shop_name || State.currentUser?.shopName || '';
    const vendorOrders = orders.filter(o => o.vendorId === vendorId || o.userId === vendorId);
    const vendorProducts = products.filter(p => p.vendorId === vendorId || p.brand === vendorShopName);

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

    // Generate KPI cards
    const kpiCards = [
      {
        title: 'Daily Sales',
        value: dailySales.length,
        change: '+12%',
        icon: '💰',
        color: '#7c3aed',
        bg: '#f5f3ff'
      },
      {
        title: 'Weekly Sales',
        value: weeklySales.length,
        change: '+8%',
        icon: '📊',
        color: '#059669',
        bg: '#ecfdf5'
      },
      {
        title: 'Total Revenue',
        value: totalRevenue.toLocaleString() + ' TND',
        change: '+23%',
        icon: '💵',
        color: '#2563eb',
        bg: '#eff6ff'
      },
      {
        title: 'Conversion Rate',
        value: conversionRate.toFixed(1) + '%',
        change: '+5%',
        icon: '🎯',
        color: '#d97706',
        bg: '#fffbeb'
      },
      {
        title: 'Avg Order Value',
        value: averageOrderValue.toFixed(0) + ' TND',
        change: '+2%',
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
        <div style="background:${kpi.change.startsWith('+') ? '#dcfce7' : '#fee2e2'};color:${kpi.change.startsWith('+') ? '#166534' : '#dc2626'};padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600">
          ${kpi.change}
        </div>
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
    if (!vendorId) {
      console.warn('No vendor ID found for orders');
      return null;
    }

    // Wait for data
    await safeLoadData();

    const orders = STN.DB.get('orders') || [];
    // Show all orders to vendor (in real app, filter by vendor's products)
    const vendorOrders = orders.filter(o => o.vendorId === vendorId || o.userId === vendorId || orders.length <= 10);
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
                <span style="font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:20px;background:#dcfce7;color:#166534">${(order.status || 'pending')}</span>
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
    if (!vendorId) {
      console.warn('No vendor ID found for inventory');
      return null;
    }

    // Wait for data
    await safeLoadData();

    const products = State.products || [];
    const vendorShopName2 = State.currentUser?.shop_name || State.currentUser?.shopName || '';
    const vendorProducts = products.filter(p => p.vendorId === vendorId || p.brand === vendorShopName2);
    const lowStockProducts = vendorProducts.filter(p => (p.stock || 0) < 10);

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
    // Show all orders for vendor dashboard analytics
    const vendorOrders = orders;

    // Simple chart visualization
    const chartHTML = `
      <div style="height:100%;display:flex;flex-direction:column">
        <div style="flex:1;display:flex;align-items:end;justify-content:space-around;position:relative">
          <div style="text-align:center">
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:1rem">Last 7 Days</div>
            <div style="font-size:2rem;font-weight:700;color:#1e0a4e">${vendorOrders.length}</div>
            <div style="font-size:0.8rem;color:#9ca3af">Orders</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:0.8rem;color:#6b7280;margin-bottom:1rem">Total Revenue</div>
            <div style="font-size:2rem;font-weight:700;color:#059669">${vendorOrders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()} TND</div>
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

// Safe logistics loading
async function safeLoadLogistics() {
  try {
    console.log('🔄 Loading logistics...');
    const mapContainer = document.getElementById('vendor-logistics-map');
    if (!mapContainer) {
      console.warn('Logistics map container not found');
      return null;
    }

    // Simple logistics visualization
    const logisticsHTML = `
      <div style="height:100%;background:#f0f4f8;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative">
        <div style="text-align:center;color:#6b7280">
          <div style="font-size:2rem;margin-bottom:1rem">🚚</div>
          <h4 style="margin-bottom:0.5rem;color:#1e0a4e">Live Logistics Tracking</h4>
          <p style="margin-bottom:1.5rem">Track your deliveries in real-time</p>
          <div style="background:#e0f2fe;border:1px solid #0ea5e9;border-radius:8px;padding:1rem;margin-bottom:1rem">
            <div style="font-size:0.9rem;color:#1e0a4e">📍 Active Deliveries: 0</div>
          </div>
          <button onclick="switchVendorSection('logistics')" style="background:#2563eb;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">View Map</button>
        </div>
      </div>
    `;

    mapContainer.innerHTML = logisticsHTML;
    console.log('✅ Logistics loaded successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error loading logistics:', error);
    return false;
  }
}

async function loadVendorKPIs() {
  const vendorId = State.currentUser?.id;
  if (!vendorId) {
    console.warn('No vendor ID found');
    return;
  }

  // Ensure data is available
  if (!State.products || State.products.length === 0) {
    console.warn('Products not loaded, waiting...');
    // Don't recurse - just wait for data to be loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    return; // Exit instead of recursing
  }

  // Get vendor's orders and products
  const orders = STN.DB.get('orders') || [];
  const products = State.products || [];
  const vendorOrders = orders.filter(o => o.vendorId === vendorId);
  const vendorProducts = products.filter(p => p.vendorId === vendorId);

  // Calculate KPIs
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

  // Generate KPI cards HTML
  const kpiCards = [
    {
      title: 'Daily Sales',
      value: dailySales.length,
      change: '+12%',
      icon: '💰',
      color: '#7c3aed',
      bg: '#f5f3ff'
    },
    {
      title: 'Weekly Sales',
      value: weeklySales.length,
      change: '+8%',
      icon: '📈',
      color: '#059669',
      bg: '#ecfdf5'
    },
    {
      title: 'Total Revenue',
      value: totalRevenue.toLocaleString() + ' TND',
      change: '+23%',
      icon: '💵',
      color: '#2563eb',
      bg: '#eff6ff'
    },
    {
      title: 'Conversion Rate',
      value: conversionRate.toFixed(1) + '%',
      change: '+5%',
      icon: '🎯',
      color: '#d97706',
      bg: '#fffbeb'
    },
    {
      title: 'Avg Order Value',
      value: averageOrderValue.toFixed(0) + ' TND',
      change: '+2%',
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
        <div style="background:${kpi.change.startsWith('+') ? '#dcfce7' : '#fee2e2'};color:${kpi.change.startsWith('+') ? '#166534' : '#dc2626'};padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600">
          ${kpi.change}
        </div>
      </div>
    </div>
  `).join('');

  const kpiContainer = document.getElementById('vendor-kpi-cards');
  if (kpiContainer) {
    kpiContainer.innerHTML = kpiHTML;
    console.log('✅ KPIs loaded:', vendorOrders.length, 'orders,', vendorProducts.length, 'products');
  }
}

async function loadVendorOrdersSummary() {
  const vendorId = State.currentUser?.id;
  if (!vendorId) {
    console.warn('No vendor ID found for orders');
    return;
  }

  // Ensure data is available
  if (!State.products || State.products.length === 0) {
    console.warn('Products not loaded for orders, waiting...');
    // Don't recurse - just wait for data to be loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    return; // Exit instead of recursing
  }

  const orders = STN.DB.get('orders') || [];
  const vendorOrders = orders.filter(o => o.vendorId === vendorId);
  const recentOrders = vendorOrders.slice(-5).reverse();

  const ordersHTML = recentOrders.length === 0 
    ? '<div style="text-align:center;padding:2rem;color:#9ca3af">No recent orders</div>'
    : `
        <div style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h4 style="font-size:1rem;font-weight:600;color:#1e0a4e">Recent Orders</h4>
            <span style="color:#6b7280;font-size:0.9rem">Total: ${vendorOrders.length} orders</span>
          </div>
          ${recentOrders.map(order => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;border-bottom:1px solid #f3f4f6;transition:background 0.2s"
                 onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
              <div style="display:flex;align-items:center;gap:1rem">
                <div style="width:40px;height:40px;background:#f5f2ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem">
                  📦
                </div>
                <div>
                  <div style="font-weight:600;color:#1e0a4e">#${order.tracking_number || order.id}</div>
                  <div style="font-size:0.8rem;color:#6b7280">${order.phone || 'Guest'}</div>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:600;color:#1e0a4e">${(order.total || 0).toLocaleString()} TND</div>
                <div style="font-size:0.8rem;">
                  <span style="padding:0.25rem 0.5rem;border-radius:12px;font-size:0.7rem;font-weight:600;
                         background:${order.status === 'delivered' ? '#dcfce7' : order.status === 'shipped' ? '#dbeafe' : '#fef9c3'};
                         color:${order.status === 'delivered' ? '#166534' : order.status === 'shipped' ? '#1d4ed8' : '#92400e'}">
                    ${order.status || 'pending'}
                  </span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

  const ordersContainer = document.getElementById('vendor-orders-summary');
  if (ordersContainer) {
    ordersContainer.innerHTML = ordersHTML;
    console.log('✅ Orders summary loaded:', vendorOrders.length, 'orders');
  }
}

async function loadVendorInventorySummary() {
  const vendorId = State.currentUser?.id;
  if (!vendorId) {
    console.warn('No vendor ID found for inventory');
    return;
  }

  // Ensure data is available
  if (!State.products || State.products.length === 0) {
    console.warn('Products not loaded for inventory, waiting...');
    // Don't recurse - just wait for data to be loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    return; // Exit instead of recursing
  }

  const products = State.products || [];
  const vendorProducts = products.filter(p => p.vendorId === vendorId);
  const lowStockProducts = vendorProducts.filter(p => (p.stock || 0) < 10);

  const inventoryHTML = `
    <div style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h4 style="font-size:1rem;font-weight:600;color:#1e0a4e">Inventory Overview</h4>
        <span style="color:#6b7280;font-size:0.9rem">${vendorProducts.length} products</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:8px;padding:1rem;text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#059669">${vendorProducts.length}</div>
          <div style="font-size:0.8rem;color:#059669">Total Products</div>
        </div>
        <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:1rem;text-align:center">
          <div style="font-size:2rem;font-weight:700;color:#d97706">${lowStockProducts.length}</div>
          <div style="font-size:0.8rem;color:#d97706">Low Stock Items</div>
        </div>
      </div>
      ${lowStockProducts.length > 0 ? `
        <div style="margin-top:1rem">
          <h5 style="color:#d97706;font-weight:600;margin-bottom:0.5rem">⚠️ Low Stock Alerts</h5>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
            ${lowStockProducts.slice(0, 3).map(product => `
              <span style="background:#fee2e2;color:#dc2626;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.7rem;font-weight:600">
                ${product.name} (${product.stock} left)
              </span>
            `).join('')}
            ${lowStockProducts.length > 3 ? `<span style="color:#6b7280">+${lowStockProducts.length - 3} more...</span>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const inventoryContainer = document.getElementById('vendor-inventory-summary');
  if (inventoryContainer) {
    inventoryContainer.innerHTML = inventoryHTML;
    console.log('✅ Inventory summary loaded:', vendorProducts.length, 'products,', lowStockProducts.length, 'low stock');
  }
}

async function loadVendorAnalytics() {
  const vendorId = State.currentUser?.id;
  if (!vendorId) {
    console.warn('No vendor ID found for analytics');
    return;
  }

  // Ensure data is available
  if (!State.products || State.products.length === 0) {
    console.warn('Products not loaded for analytics, waiting...');
    // Don't recurse - just wait for data to be loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    return; // Exit instead of recursing
  }

  const orders = STN.DB.get('orders') || [];
  const vendorOrders = orders.filter(o => o.vendorId === vendorId);
  
  // Simple chart visualization using CSS
  const chartHTML = `
    <div style="height:100%;display:flex;flex-direction:column">
      <div style="flex:1;display:flex;align-items:end;justify-content:space-around;position:relative">
        ${generateSimpleChart(vendorOrders)}
      </div>
      <div style="display:flex;justify-content:space-around;padding:1rem 0;border-top:1px solid #e5e7eb">
        <div style="text-align:center">
          <div style="font-size:0.8rem;color:#6b7280">Best Seller</div>
          <div style="font-weight:600;color:#1e0a4e">${getBestSellingProduct(vendorOrders)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:0.8rem;color:#6b7280">Avg Daily</div>
          <div style="font-weight:600;color:#1e0a4e">${calculateDailyAverage(vendorOrders)}</div>
        </div>
      </div>
    </div>
  `;

  const analyticsContainer = document.getElementById('vendor-analytics-chart');
  if (analyticsContainer) {
    analyticsContainer.innerHTML = chartHTML;
    console.log('✅ Analytics loaded:', vendorOrders.length, 'orders analyzed');
  }
}

function generateSimpleChart(orders) {
  // Generate last 7 days of data
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const chartData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.toDateString() === date.toDateString();
    });
    chartData.push({
      day: days[date.getDay()],
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    });
  }

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  
  return chartData.map((data, index) => `
    <div style="display:flex;flex-direction:column;align-items:center;flex:1">
      <div style="font-size:0.7rem;color:#6b7280;margin-bottom:0.5rem">${data.day}</div>
      <div style="width:100%;height:150px;display:flex;align-items:end;position:relative">
        <div style="position:absolute;bottom:0;width:100%;height:1px;background:#e5e7eb"></div>
        <div style="width:100%;background:linear-gradient(to top,#7c3aed,#9b72f0);border-radius:4px 4px 0 0;position:relative;transition:height 0.3s"
             style="height:${maxRevenue > 0 ? (data.revenue / maxRevenue * 100) : 0}%;min-height:2px"
             title="${data.orders} orders, ${data.revenue.toLocaleString()} TND">
        </div>
      </div>
      <div style="font-size:0.7rem;color:#6b7280;margin-top:0.5rem">${data.orders}</div>
    </div>
  `).join('');
}

function getBestSellingProduct(orders) {
  // Simple implementation - in real app, this would analyze order items
  return 'Premium Chair';
}

function calculateDailyAverage(orders) {
  if (orders.length === 0) return '0';
  const days = 7; // Last week
  return (orders.length / days).toFixed(1);
}

async function loadVendorLogisticsMap() {
  const mapContainer = document.getElementById('vendor-logistics-map');
  if (!mapContainer) {
    console.warn('Logistics map container not found');
    return;
  }

  // Ensure data is available
  if (!State.products || State.products.length === 0) {
    console.warn('Products not loaded for logistics, waiting...');
    // Don't recurse - just wait for data to be loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    return; // Exit instead of recursing
  }

  // Simple logistics visualization
  const logisticsHTML = `
    <div style="height:100%;background:#f0f4f8;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative">
      <div style="text-align:center;color:#6b7280">
        <div style="font-size:2rem;margin-bottom:1rem">🚚</div>
        <h4 style="margin-bottom:0.5rem;color:#1e0a4e">Live Logistics Tracking</h4>
        <p style="margin-bottom:1.5rem">Track your deliveries in real-time</p>
        <button onclick="switchVendorSection('logistics')" style="background:#2563eb;color:white;border:none;padding:0.75rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">
          View Full Map →
        </button>
      </div>
    </div>
  `;

  mapContainer.innerHTML = logisticsHTML;
  console.log('✅ Logistics map loaded');
}

function switchVendorSection(section) {
  // This would expand to show detailed sections
  console.log('Switching to vendor section:', section);
  toast(`🔄 Loading ${section} section...`, 'success');
}

async function refreshVendorData() {
  try {
    console.log('🔄 Refreshing vendor dashboard data...');
    
    // Reload data from Supabase first
    await ensureVendorDataLoaded();
    
    // Reload all dashboard components
    await Promise.all([
      loadVendorKPIs(),
      loadVendorOrdersSummary(),
      loadVendorInventorySummary(),
      loadVendorAnalytics(),
      loadVendorLogisticsMap()
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
  
  // Get orders with coordinates
  const orders = STN.DB.get('orders') || [];
  const ordersWithCoords = orders.filter(order => {
    // Mock coordinates for demo - in real app, these would come from delivery tracking
    if (order.status === 'shipped' || order.status === 'processing') {
      // Assign real coordinates based on wilaya for demo
      const wilayaCoords = {
        'Tunis': [36.8065, 10.1815],
        'Ariana': [36.8625, 10.1956],
        'Bizerte': [37.2744, 9.8739],
        'Nabeul': [36.4514, 10.7358],
        'Sousse': [35.8256, 10.6369],
        'Monastir': [35.7643, 10.8113],
        'Mahdia': [35.5047, 11.0621],
        'Sfax': [34.7406, 10.7603],
        'Kairouan': [35.6781, 10.0963],
        'Gabès': [33.8815, 10.0982],
        'Jendouba': [36.5039, 8.7806],
        'Béja': [36.7276, 9.1818],
        'Le Kef': [36.1667, 8.7000],
        'Siliana': [36.0833, 9.3667],
        'Kasserine': [35.1667, 8.8333],
        'Sidi Bouzid': [35.0380, 9.4939],
        'Gafsa': [34.4250, 8.7842],
        'Tozeur': [33.9250, 8.1333],
        'Kebili': [33.7042, 8.9667],
        'Tataouine': [32.9298, 10.4523],
        'Médenine': [33.3549, 10.5086],
        'Zarzis': [33.7892, 11.0812],
        'Djerba': [33.8144, 10.8593]
      };
      const coords = wilayaCoords[order.wilaya] || [35.8256, 10.6369]; // Default to Sousse
      order.lat = coords[0];
      order.lng = coords[1];
      return true;
    }
    return false;
  });
  
  // Update counts
  document.getElementById('logistics-order-count').textContent = ordersWithCoords.length;
  document.getElementById('logistics-active-count').textContent = ordersWithCoords.filter(o => o.status === 'shipped').length;
  
  // Create custom purple marker for Everest branding
  const createEverestMarker = (order) => {
    return L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #7c3aed, #4a1fa8);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
          border: 2px solid white;
          transform: rotate(-45deg);
        ">
          <span style="transform: rotate(45deg);">📦</span>
        </div>
      `,
      className: 'everest-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
  };
  
  // Add markers for orders
  ordersWithCoords.forEach(order => {
    if (order.lat && order.lng) {
      const marker = L.marker([order.lat, order.lng], {
        icon: createEverestMarker(order)
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
    }
  });
  
  // Update order list
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
            ${order.status === 'delivered' ? '✓ Delivered' : order.status === 'shipped' ? '🚚 Shipped' : '⏳ Processing'}
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

