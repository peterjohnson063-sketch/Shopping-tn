// ═══════════════════════════════════════════════
// VENDOR DASHBOARD PATCH - Add AFTER app.js
// Fixes: blank vendor page, frozen dashboard
// ═══════════════════════════════════════════════
(function() {
  'use strict';

  function applyPatch() {
    if (typeof State === 'undefined' || typeof STN === 'undefined') {
      setTimeout(applyPatch, 50);
      return;
    }

    // ── PATCH 1: Safe products getter ──────────────────
    function getProducts() {
      if (!State.products || !Array.isArray(State.products) || State.products.length === 0) {
        State.products = STN.DB.get('products') || STN.PRODUCTS_DATA || [];
      }
      return State.products;
    }

    // ── PATCH 2: initializeProducts ────────────────────
    window.initializeProducts = async function() {
      try {
        const sp = await SB.getProducts();
        if (Array.isArray(sp) && sp.length > 0) {
          State.products = sp;
          STN.DB.set('products', sp);
        }
        // Never wipe products on empty/error
      } catch(e) {}
    };

    // ── PATCH 3: initializeVendorDashboard ─────────────
    window.initializeVendorDashboard = async function(rootEl) {
      const root = rootEl || document.getElementById('page-vendor-dashboard');
      if (!root) return;

      const u = State.currentUser || {};
      const vendorId = u.id;
      const shopName = u.shop_name || u.shopName || u.name || '';
      const allOrders = STN.DB.get('orders') || [];
      const prods = getProducts();
      const myProds = prods.filter(p => p.vendorId === vendorId || (shopName && p.brand === shopName));
      const myOrders = allOrders.filter(o => o.vendorId === vendorId || o.userId === vendorId);
      const orders = myOrders.length > 0 ? myOrders : allOrders;

      const totalRev = orders.reduce((s,o) => s+(o.total||0), 0);
      const delivered = orders.filter(o => o.status==='delivered');
      const pending = orders.filter(o => o.status==='pending');
      const shipped = orders.filter(o => o.status==='shipped'||o.status==='transit');
      const lowStock = myProds.filter(p => (p.stock||0) < 5);
      const now = new Date();
      const weekAgo = new Date(now - 7*24*60*60*1000);
      const weekly = orders.filter(o => new Date(o.date||o.created_at||0) >= weekAgo);

      // KPI Cards
      const kpiEl = root.querySelector('#vendor-kpi-cards');
      if (kpiEl) {
        const kpis = [
          {t:'Total Revenue', v:totalRev.toLocaleString()+' TND', i:'💵', c:'#7c3aed', bg:'#f5f3ff'},
          {t:'Weekly Orders', v:weekly.length, i:'📦', c:'#059669', bg:'#ecfdf5'},
          {t:'Total Orders', v:orders.length, i:'🛒', c:'#2563eb', bg:'#eff6ff'},
          {t:'Delivered', v:delivered.length, i:'✅', c:'#059669', bg:'#ecfdf5'},
          {t:'My Products', v:myProds.length, i:'🏪', c:'#7c3aed', bg:'#f5f3ff'},
          {t:'Low Stock', v:lowStock.length, i:'⚠️', c:lowStock.length>0?'#dc2626':'#059669', bg:lowStock.length>0?'#fee2e2':'#ecfdf5'},
        ];
        kpiEl.innerHTML = kpis.map(k =>
          '<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">'
          +'<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem">'
          +'<div style="width:42px;height:42px;background:'+k.bg+';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.3rem">'+k.i+'</div>'
          +'<span style="font-size:0.78rem;color:#6b7280;font-weight:500">'+k.t+'</span></div>'
          +'<div style="font-size:1.8rem;font-weight:700;color:#1e0a4e">'+k.v+'</div>'
          +'</div>'
        ).join('');
      }

      // Orders Summary
      const ordEl = root.querySelector('#vendor-orders-summary');
      if (ordEl) {
        const recent = orders.slice().reverse().slice(0,5);
        ordEl.innerHTML = recent.length === 0
          ? '<div style="text-align:center;padding:2rem;color:#9ca3af">No orders yet</div>'
          : recent.map(o => {
              const sc = o.status==='delivered'?'#dcfce7':o.status==='shipped'?'#dbeafe':'#fef9c3';
              const tc = o.status==='delivered'?'#166534':o.status==='shipped'?'#1d4ed8':'#92400e';
              return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid #f3f4f6">'
                +'<div><div style="font-size:0.82rem;font-weight:600;color:#111827">'+(o.tracking_number||o.id||'—')+'</div>'
                +'<div style="font-size:0.72rem;color:#9ca3af">'+(o.notes||o.phone||'Guest')+'</div></div>'
                +'<div style="text-align:right"><div style="font-size:0.82rem;font-weight:700">'+(o.total||0).toLocaleString()+' TND</div>'
                +'<span style="font-size:0.7rem;padding:2px 8px;border-radius:20px;background:'+sc+';color:'+tc+'">'+(o.status||'pending')+'</span></div>'
                +'</div>';
            }).join('');
      }

      // Inventory Summary
      const invEl = root.querySelector('#vendor-inventory-summary');
      if (invEl) {
        invEl.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">'
          +'<div style="background:#f0f9ff;border-radius:8px;padding:1rem;text-align:center">'
          +'<div style="font-size:1.6rem;font-weight:700;color:#1e0a4e">'+myProds.length+'</div>'
          +'<div style="font-size:0.78rem;color:#6b7280">Total Products</div></div>'
          +'<div style="background:#fffbeb;border-radius:8px;padding:1rem;text-align:center">'
          +'<div style="font-size:1.6rem;font-weight:700;color:#d97706">'+lowStock.length+'</div>'
          +'<div style="font-size:0.78rem;color:#6b7280">Low Stock</div></div></div>'
          + myProds.slice(0,4).map(p =>
              '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid #f3f4f6">'
              +'<span style="font-size:1.3rem">'+(p.emoji||'📦')+'</span>'
              +'<span style="flex:1;font-size:0.82rem;font-weight:600;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+p.name+'</span>'
              +'<span style="font-size:0.78rem;font-weight:700;color:'+((p.stock||0)<5?'#dc2626':'#059669')+'">'+( p.stock||0)+'</span>'
              +'</div>'
            ).join('');
      }

      // Analytics
      const anaEl = root.querySelector('#vendor-analytics-chart');
      if (anaEl) {
        anaEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">'
          +'<div style="background:#fffbeb;border-radius:8px;padding:1rem;text-align:center"><div style="font-size:1.5rem;font-weight:700;color:#d97706">'+pending.length+'</div><div style="font-size:0.75rem;color:#6b7280">Pending</div></div>'
          +'<div style="background:#eff6ff;border-radius:8px;padding:1rem;text-align:center"><div style="font-size:1.5rem;font-weight:700;color:#2563eb">'+shipped.length+'</div><div style="font-size:0.75rem;color:#6b7280">In Transit</div></div>'
          +'<div style="background:#ecfdf5;border-radius:8px;padding:1rem;text-align:center"><div style="font-size:1.5rem;font-weight:700;color:#059669">'+delivered.length+'</div><div style="font-size:0.75rem;color:#6b7280">Delivered</div></div>'
          +'</div>'
          +'<div style="background:#f9fafb;border-radius:8px;padding:1rem;text-align:center">'
          +'<div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Total Revenue</div>'
          +'<div style="font-size:2rem;font-weight:700;color:#7c3aed">'+totalRev.toLocaleString()+' TND</div>'
          +'</div>';
      }

      // Logistics — real Leaflet map from app.js (do not overwrite with static card)
      const logEl = root.querySelector('#vendor-logistics-map');
      if (logEl && typeof safeLoadLogistics === 'function') {
        setTimeout(function () {
          safeLoadLogistics().catch(function (e) {
            console.warn('safeLoadLogistics', e);
            logEl.innerHTML =
              '<div style="padding:2rem;text-align:center;color:#6b7280;background:#f0f4f8;border-radius:8px">'
              + '<div style="font-size:2rem;margin-bottom:0.5rem">🗺️</div>'
              + '<p style="margin:0 0 1rem;font-size:0.9rem">Map could not load.</p>'
              + '<button type="button" onclick="typeof vendorLogisticsRefresh===\'function\'&&vendorLogisticsRefresh()" style="background:#7c3aed;color:white;border:none;padding:0.5rem 1rem;border-radius:8px;font-weight:600;cursor:pointer">Retry</button>'
              + '</div>';
          });
        }, 50);
      } else if (logEl) {
        logEl.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:1.5rem;text-align:center;background:#f0f4f8;border-radius:8px">'
          +'<div style="font-size:3rem">🚚</div>'
          +'<h4 style="color:#1e0a4e;margin:0">Logistics Overview</h4>'
          +'<div style="background:#dbeafe;color:#1d4ed8;border-radius:8px;padding:0.75rem 1.5rem;font-weight:600">'+shipped.length+' Active Deliveries</div>'
          +'</div>';
      }

      console.log('✅ Vendor dashboard patch: loaded');
    };

    // ── PATCH 4: renderVendorDashboard ─────────────────
    window.renderVendorDashboard = function() {
      const page = document.getElementById('page-vendor-dashboard');
      if (!page) return;
      if (!State.currentUser || State.currentUser.role !== 'vendor') {
        page.innerHTML = '<div style="text-align:center;padding:4rem">'
          +'<div style="font-size:3rem;margin-bottom:1rem">🔒</div>'
          +'<h2 style="color:#1e0a4e">Vendor Access Required</h2>'
          +'<button onclick="showPage(\'auth\')" style="margin-top:1.5rem;background:#7c3aed;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">Sign In</button>'
          +'</div>';
        return;
      }
      page.innerHTML = buildVendorDashboardHTML ? buildVendorDashboardHTML() : '<div style="padding:2rem"><div id="vendor-kpi-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin-bottom:2rem"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem"><div style="display:flex;flex-direction:column;gap:2rem"><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f8f9ff"><h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📦 Orders</h3></div><div id="vendor-orders-summary" style="padding:1.5rem"></div></div><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f0fdf4"><h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📊 Inventory</h3></div><div id="vendor-inventory-summary" style="padding:1.5rem"></div></div></div><div style="display:flex;flex-direction:column;gap:2rem"><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#fef3c7"><h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">📈 Analytics</h3></div><div id="vendor-analytics-chart" style="padding:1.5rem;min-height:200px"></div></div><div style="background:white;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e5e7eb;background:#f0f9ff"><h3 style="font-size:1.1rem;font-weight:600;color:#1e0a4e">🚚 Logistics</h3></div><div id="vendor-logistics-map" style="height:200px;position:relative"></div></div></div></div></div>';
      window.initializeVendorDashboard(page);
    };

    // ── PATCH 5: switchVendorSection overview ──────────
    const _origSwitch = window.switchVendorSection;
    window.switchVendorSection = function(section) {
      // Ensure products are always an array
      if (!State.products || !Array.isArray(State.products)) {
        State.products = STN.DB.get('products') || STN.PRODUCTS_DATA || [];
      }
      try {
        _origSwitch.call(this, section);
      } catch(err) {
        console.error('switchVendorSection crashed:', err);
        // If it crashed, render minimal fallback content
        const content = document.getElementById('vendor-content');
        if (content && section === 'overview') {
          const u = State.currentUser || {};
          const orders = STN.DB.get('orders') || [];
          const prods = getProducts();
          const shopName = u.shop_name || u.shopName || '';
          const myProds = prods.filter(p => p.vendorId === u.id || (shopName && p.brand === shopName));
          const totalRev = orders.reduce((s,o) => s+(o.total||0), 0);
          content.innerHTML = '<div style="padding:1rem">'
            +'<h1 style="font-size:1.5rem;font-weight:700;color:#111827;margin-bottom:1.5rem">Welcome back, '+(u.first_name||u.firstName||u.name||'Vendor')+'! 👋</h1>'
            +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">'
            +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">My Products</div><div style="font-size:1.8rem;font-weight:700;color:#7c3aed">'+myProds.length+'</div></div>'
            +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Total Orders</div><div style="font-size:1.8rem;font-weight:700;color:#2563eb">'+orders.length+'</div></div>'
            +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Revenue</div><div style="font-size:1.5rem;font-weight:700;color:#059669">'+totalRev.toLocaleString()+' TND</div></div>'
            +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem"><div style="font-size:0.78rem;color:#6b7280;margin-bottom:0.5rem">Status</div><div style="font-size:1rem;font-weight:700;color:'+(u.verified?'#059669':'#d97706')+'">'+(u.verified?'✅ Live':'⏳ Pending')+'</div></div>'
            +'</div>'
            +'<div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:1.5rem">'
            +'<h3 style="font-size:0.95rem;font-weight:600;color:#111827;margin-bottom:1rem">Quick Actions</h3>'
            +'<div style="display:flex;gap:1rem;flex-wrap:wrap">'
            +'<button onclick="switchVendorSection(\'upload\')" style="background:#7c3aed;color:white;border:none;padding:0.65rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">+ Upload Product</button>'
            +'<button onclick="switchVendorSection(\'orders\')" style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff;padding:0.65rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">View Orders</button>'
            +'<button onclick="showPage(\'vendor-dashboard\')" style="background:#059669;color:white;border:none;padding:0.65rem 1.5rem;border-radius:8px;font-weight:600;cursor:pointer">📊 Dashboard</button>'
            +'</div></div></div>';
        }
      }
    };

    console.log('✅ Vendor dashboard patch applied');
  }

  // Wait for DOM + scripts to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(applyPatch, 100); });
  } else {
    setTimeout(applyPatch, 100);
  }
})();
