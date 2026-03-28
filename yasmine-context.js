// Everest — Yasmine live context + vendor listing policy (loaded after app.js)
(function () {
  'use strict';

  function getState() {
    return typeof window !== 'undefined' && window.__EVEREST_STATE__ ? window.__EVEREST_STATE__ : null;
  }

  function normalizeStatus(st) {
    var s = String(st == null ? '' : st).trim().toLowerCase();
    if (!s) return 'pending';
    if (s === 'out-for-delivery' || s === 'out_for_delivery') return 'out_for_delivery';
    if (s === 'cancelled') return 'canceled';
    return s;
  }

  function statusHint(st) {
    var n = normalizeStatus(st);
    var map = {
      pending: 'waiting for seller confirmation',
      confirmed: 'confirmed — being prepared',
      processing: 'being prepared at the shop',
      ready: 'ready for driver pickup',
      out_for_delivery: 'on the way to the customer',
      shipped: 'on the way',
      transit: 'in transit',
      delivered: 'delivered',
      canceled: 'canceled',
      cancelled: 'canceled',
    };
    return map[n] || n;
  }

  function orderKey(o) {
    return String(o.id != null ? o.id : o.tracking_number || '');
  }

  /**
   * Text block appended to Yasmine's system prompt — real data from this browser session only.
   */
  function buildYasmineContext(userMsg) {
    var lines = [];
    var st = getState();
    if (!st) {
      lines.push('(Everest app state not linked — order lookup unavailable.)');
      return lines.join('\n');
    }

    var u = st.currentUser;
    if (u) {
      lines.push(
        'Signed-in: role=' +
          (u.role || 'customer') +
          ', user_id=' +
          (u.id != null ? u.id : '?') +
          ', display_name=' +
          (u.first_name || u.firstName || u.shop_name || u.shopName || '') +
          ', email=' +
          (u.email || 'n/a')
      );
    } else {
      lines.push('Not signed in. For personal order status, ask the user to sign in or paste their tracking number (STN-…).');
    }

    var orders = Array.isArray(st.orders) && st.orders.length ? st.orders : [];
    if (orders.length === 0 && typeof STN !== 'undefined' && STN.DB && typeof STN.DB.get === 'function') {
      var dbOrders = STN.DB.get('orders');
      if (Array.isArray(dbOrders) && dbOrders.length) orders = dbOrders;
    }
    var msg = String(userMsg || '');
    var trackMatch = msg.match(/STN-[A-Z0-9_-]+/i);
    var needle = trackMatch ? trackMatch[0].toUpperCase().replace(/_/g, '-') : null;

    var relevant = [];
    var seen = {};

    function pushUnique(o) {
      var k = orderKey(o);
      if (!k || seen[k]) return;
      seen[k] = true;
      relevant.push(o);
    }

    if (needle) {
      orders.forEach(function (o) {
        var t = String(o.tracking_number || '').toUpperCase().replace(/_/g, '-');
        if (t && (t === needle || t.indexOf(needle) >= 0)) pushUnique(o);
      });
    }

    if (u && u.id != null) {
      orders.forEach(function (o) {
        if (o.user_id != null && String(o.user_id) === String(u.id)) pushUnique(o);
      });
    }

    if (relevant.length === 0) {
      lines.push(
        'No orders matched in local session (user id or STN- code). Orders created on another device may not appear until the user opens Track or signs in here.'
      );
    } else {
      lines.push('Relevant orders (use ONLY these facts; do not invent dates):');
      relevant.slice(0, 10).forEach(function (o) {
        var tr = o.tracking_number || o.id;
        var stLabel = statusHint(o.status);
        lines.push(
          '- ' +
            tr +
            ' | status: ' +
            stLabel +
            ' | total: ' +
            (o.total != null ? o.total : o.amount || 0) +
            ' TND | wilaya: ' +
            (o.wilaya || '—') +
            ' | created: ' +
            (o.created_at || o.date || '—')
        );
        if (o.delivery_deadline_at) {
          lines.push('  internal_target_time: ' + o.delivery_deadline_at + ' (reference only — not a customer promise)');
        }
      });
    }

    var prods = Array.isArray(st.products) && st.products.length ? st.products : [];
    if (prods.length === 0 && typeof STN !== 'undefined' && STN.DB && typeof STN.DB.get === 'function') {
      var dbP = STN.DB.get('products');
      if (Array.isArray(dbP) && dbP.length) prods = dbP;
    }
    if (prods.length) {
      var sample = prods
        .slice(0, 15)
        .map(function (p) {
          return (p.name || 'Product') + ' ~' + (p.price != null ? p.price : '?') + ' TND';
        })
        .join(' · ');
      lines.push('Sample catalog on this device: ' + sample);
    }

    if (u && u.role === 'vendor') {
      lines.push(
        'Vendor reminder: blind shipping — you never receive customer name/phone/address; only order id + line items. Listings must be brand-new items only; images must match the product (WYSIWYG).'
      );
    }

    return lines.join('\n');
  }

  /**
   * Deterministic policy gate before Supabase product insert. Blocks obvious violations; does not replace human/admin review.
   */
  function checkVendorListingPolicy(title, desc) {
    var text = (String(title || '') + ' ' + String(desc || '')).toLowerCase();
    var reasons = [];

    function add(code, severity, message) {
      reasons.push({ code: code, severity: severity, message: message });
    }

    // Medical / pharmacy (multi-language hints)
    if (
      /\b(pharmaceutical|prescription|rx\b|antibiotic|insulin|viagra|tramadol|xanax|steroid|injectable|cbd\s*oil|melatonin\s*pill|doxycycline)\b/i.test(text) ||
      /\b(medicine|medication|pills?\s+for|tablets?\s+for\s+(pain|sleep|weight)|health\s+supplement|diet\s+pill)\b/i.test(text) ||
      /(دواء|أدوية|صيدلية|حبوب\s+دواء|مكمل\s+غذائي|فيتامين\s+علاجي|هرمون)/.test(text) ||
      /\b(m[ée]dicament|pharmacie|ordonnance|comprim[ée]s?\s+(pour|de)|gélules?\s+médic)/i.test(text)
    ) {
      add('medical', 'block', 'Medical/pharmacy-style listings are not allowed on Everest.');
    }

    // Used / refurbished (new only)
    if (
      /\b(used|second[-\s]?hand|pre[-\s]?loved|refurbished|reconditioned|occasion\b|d['’]occasion|état\s+occasion)\b/i.test(text) ||
      /(مستعمل|مستعملة|بالة|second\s*main)/.test(text)
    ) {
      add('used', 'block', 'Only brand-new items may be listed; used or refurbished goods are prohibited.');
    }

    // Weapons / dangerous (high-confidence phrases)
    if (
      /\b(firearm|handgun|rifle|ammunition|ammo\b|taser|stun\s*gun|grenade|explosive\s+material)\b/i.test(text) ||
      /\b(arme\s+à\s+feu|pistolet|fusil|munitions|bombe)\b/i.test(text) ||
      /(سلاح\s+ناري|مسدس|رصاص|ذخيرة)/.test(text)
    ) {
      add('weapons', 'block', 'Weapons and dangerous items are prohibited under Everest rules and Tunisian law.');
    }

    // Illegal substances (obvious)
    if (/\b(cocaine|heroin|methamphetamine|lsd\b|ecstasy\s*pills)\b/i.test(text)) {
      add('drugs', 'block', 'Illegal substances cannot be listed.');
    }

    var blocked = reasons.some(function (r) {
      return r.severity === 'block';
    });

    return {
      ok: !blocked,
      blocked: blocked,
      reasons: reasons,
    };
  }

  window.EverestYasmineContext = {
    build: buildYasmineContext,
    getState: getState,
  };

  window.EverestListingPolicy = {
    check: checkVendorListingPolicy,
  };
})();
