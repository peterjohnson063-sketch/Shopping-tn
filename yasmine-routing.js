/**
 * Yasmine Order Routing Engine — vendor availability, SKU_DNA matching, pre-orders, SOS acceptance.
 * Depends on SB (supabase-fixed.js) and optional State (app.js).
 */
var EverestYasmineRouting = (function () {
  var ACCEPT_MS = 15 * 60 * 1000;
  var PROCESSING_MS = 24 * 60 * 60 * 1000;

  function _slug(s) {
    return String(s || '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80);
  }

  function ensureProductSku(p) {
    if (!p || typeof p !== 'object') return p;
    var out = p;
    var parent = (out.parent_sku || out.parentSku || '').toString().trim();
    if (!parent) {
      var base = (out.name || 'item').toString().split(/\s+/).slice(0, 3).join('-');
      parent = _slug(base) || 'SKU-' + String(out.id || 'x').replace(/[^a-zA-Z0-9_-]/g, '');
    }
    var color = (out.color_id || out.colorId || 'default').toString().trim() || 'default';
    var size = (out.size_id || out.sizeId || 'one').toString().trim() || 'one';
    var variant = (out.variant_id || out.variantId || '').toString().trim();
    if (!variant) variant = color + '-' + size;
    out.parent_sku = parent;
    out.color_id = color;
    out.size_id = size;
    out.variant_id = variant;
    out.sku_dna = parent + '|' + color + '|' + size;
    return out;
  }

  function computeSkuDna(p) {
    return ensureProductSku(Object.assign({}, p)).sku_dna;
  }

  function vendorIsActive(row) {
    return !!(row && row.service_status === 'active');
  }

  function dayKeys() {
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  }

  /** Next calendar moment when vendor is "open" per weekly_schedule + 24h processing buffer. */
  function estimatedReadyFromSchedule(weeklySchedule, fromDate) {
    var sched = weeklySchedule && typeof weeklySchedule === 'object' ? weeklySchedule : {};
    var start = fromDate ? new Date(fromDate) : new Date();
    if (isNaN(start.getTime())) start = new Date();
    var keys = dayKeys();
    for (var d = 0; d < 14; d++) {
      var probe = new Date(start.getTime() + d * 86400000);
      var dk = keys[probe.getDay()];
      var day = sched[dk] || sched[dk.toUpperCase()] || sched[dk.charAt(0).toUpperCase() + dk.slice(1)];
      if (day && day.closed) continue;
      if (day && (day.open || day.start)) {
        var ready = new Date(probe.getFullYear(), probe.getMonth(), probe.getDate(), 12, 0, 0, 0);
        ready.setTime(ready.getTime() + PROCESSING_MS);
        return ready;
      }
    }
    var fallback = new Date(start.getTime() + 48 * 3600000 + PROCESSING_MS);
    return fallback;
  }

  function preorderMessage(readyDate) {
    var ds = readyDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return 'Pre-order now. Ready by ' + ds;
  }

  async function getVendorRow(vendorId) {
    if (vendorId == null || vendorId === '' || typeof SB === 'undefined' || !SB.getVendor) return null;
    try {
      return await SB.getVendor(String(vendorId));
    } catch (e) {
      return null;
    }
  }

  async function ensureVendorRow(vendorId, defaults) {
    var row = await getVendorRow(vendorId);
    if (row) return row;
    var base = { id: String(vendorId), service_status: 'away', weekly_schedule: {}, consecutive_timeout_orders: 0 };
    if (defaults && typeof defaults === 'object') Object.assign(base, defaults);
    try {
      if (SB.upsertVendor) await SB.upsertVendor(base);
    } catch (e) {}
    return base;
  }

  function collectSkuDnasFromCartItems(cartItems, products) {
    var list = [];
    var pmap = products || (typeof State !== 'undefined' && State.products) || [];
    (cartItems || []).forEach(function (c) {
      var p = pmap.find(function (pr) {
        return String(pr.id) === String(c.id);
      });
      if (p) list.push(ensureProductSku(p).sku_dna);
    });
    return list.filter(function (x, i, a) {
      return x && a.indexOf(x) === i;
    });
  }

  /** Vendors (other than excludeId) that list products with every sku_dna and are active. */
  function findAlternateVendorIds(allProducts, skuDnas, excludeId) {
    if (!skuDnas.length || !Array.isArray(allProducts)) return [];
    var ex = excludeId != null ? String(excludeId) : '';
    var vendorsPerSku = skuDnas.map(function (dna) {
      var set = {};
      allProducts.forEach(function (p) {
        var ep = ensureProductSku(p);
        if (ep.sku_dna !== dna) return;
        var vid = p.vendor_id != null ? p.vendor_id : p.vendorId;
        if (vid == null || String(vid) === ex) return;
        set[String(vid)] = true;
      });
      return set;
    });
    if (!vendorsPerSku.length) return [];
    var first = Object.keys(vendorsPerSku[0]);
    return first.filter(function (vid) {
      return vendorsPerSku.every(function (set) {
        return set[vid];
      });
    });
  }

  async function pickActiveAlternate(allProducts, skuDnas, excludeId) {
    var candidates = findAlternateVendorIds(allProducts, skuDnas, excludeId);
    for (var i = 0; i < candidates.length; i++) {
      var vr = await getVendorRow(candidates[i]);
      if (vendorIsActive(vr)) return candidates[i];
    }
    return null;
  }

  /**
   * Build extra order fields for one vendor-group of cart lines.
   */
  async function buildOrderExtraForGroup(cartItems, products, allProducts) {
    var items = cartItems || [];
    var pmap = products || [];
    var catalog = allProducts || pmap;
    var first = items[0];
    var p0 = pmap.find(function (pr) {
      return String(pr.id) === String(first && first.id);
    });
    var primaryVid = p0 ? (p0.vendor_id != null ? p0.vendor_id : p0.vendorId) : null;
    if (primaryVid == null || primaryVid === '') {
      return {
        vendor_id: null,
        yasmine_routing_status: null,
        acceptance_deadline_at: null,
        original_vendor_id: null,
        estimated_ready_at: null,
        yasmine_meta: { note: 'no_vendor_on_product' },
        customerNote: null,
      };
    }

    var skuDnas = collectSkuDnasFromCartItems(items, pmap);
    var vrow = await ensureVendorRow(primaryVid);
    var meta = { sku_dnas: skuDnas, primary_vendor: String(primaryVid) };

    if (vendorIsActive(vrow)) {
      var dl = new Date(Date.now() + ACCEPT_MS).toISOString();
      return {
        vendor_id: String(primaryVid),
        yasmine_routing_status: 'pending_acceptance',
        acceptance_deadline_at: dl,
        original_vendor_id: null,
        estimated_ready_at: null,
        yasmine_meta: Object.assign({}, meta, { step: 'direct_match_sos' }),
        customerNote: 'Your seller has been alerted — please allow up to 15 minutes for acceptance.',
      };
    }

    var alt = await pickActiveAlternate(catalog, skuDnas, primaryVid);
    if (alt) {
      var dl2 = new Date(Date.now() + ACCEPT_MS).toISOString();
      return {
        vendor_id: String(alt),
        yasmine_routing_status: 'pending_acceptance',
        acceptance_deadline_at: dl2,
        original_vendor_id: String(primaryVid),
        estimated_ready_at: null,
        yasmine_meta: Object.assign({}, meta, { step: 'smart_switch', routed_from: String(primaryVid) }),
        customerNote: 'Your order was routed to another in-stock partner (same product match).',
      };
    }

    var ready = estimatedReadyFromSchedule(vrow.weekly_schedule, new Date());
    var estIso = ready.toISOString();
    return {
      vendor_id: String(primaryVid),
      yasmine_routing_status: 'preorder',
      acceptance_deadline_at: null,
      original_vendor_id: null,
      estimated_ready_at: estIso,
      yasmine_meta: Object.assign({}, meta, { step: 'preorder' }),
      customerNote: preorderMessage(ready),
    };
  }

  async function incrementVendorTimeoutAndMaybeAway(vendorId) {
    if (!vendorId || typeof SB === 'undefined') return;
    var row = await ensureVendorRow(vendorId);
    var n = (row.consecutive_timeout_orders || 0) + 1;
    var nextStatus = row.service_status;
    if (n >= 2) nextStatus = 'away';
    try {
      await SB.upsertVendor({
        id: String(vendorId),
        service_status: nextStatus,
        consecutive_timeout_orders: n,
        weekly_schedule: row.weekly_schedule || {},
        last_active_at: row.last_active_at || null,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}
    if (n >= 2 && SB.createAdminAlert) {
      try {
        await SB.createAdminAlert({
          kind: 'vendor_auto_away',
          message: 'Vendor ' + String(vendorId) + ' was set to Away after 2 consecutive order acceptance timeouts (Yasmine).',
          meta: { vendor_id: String(vendorId), consecutive_timeout_orders: n },
        });
      } catch (e2) {}
    }
  }

  async function resetVendorTimeouts(vendorId) {
    if (!vendorId || typeof SB === 'undefined') return;
    var row = await getVendorRow(vendorId);
    if (!row) return;
    try {
      await SB.upsertVendor({
        id: String(vendorId),
        service_status: row.service_status,
        consecutive_timeout_orders: 0,
        weekly_schedule: row.weekly_schedule || {},
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}
  }

  async function handleStaleOrder(order) {
    if (!order || !order.id) return;
    var primaryVid = order.vendor_id != null ? order.vendor_id : order.vendorId;
    var items = Array.isArray(order.items) ? order.items : [];
    var skuDnas = [];
    var pmap = typeof State !== 'undefined' && State.products ? State.products : [];
    items.forEach(function (it) {
      var sku = it.sku_dna ? String(it.sku_dna) : '';
      if (!sku && it.id) {
        var pr = pmap.find(function (x) {
          return String(x.id) === String(it.id);
        });
        if (pr) sku = ensureProductSku(pr).sku_dna;
      }
      if (sku) skuDnas.push(sku);
    });
    skuDnas = skuDnas.filter(function (x, i, a) {
      return a.indexOf(x) === i;
    });

    var allProducts = typeof State !== 'undefined' && State.products ? State.products : [];
    await incrementVendorTimeoutAndMaybeAway(primaryVid);

    var alt = skuDnas.length ? await pickActiveAlternate(allProducts, skuDnas, primaryVid) : null;
    if (alt && String(alt) !== String(primaryVid)) {
      var dl = new Date(Date.now() + ACCEPT_MS).toISOString();
      try {
        await SB.updateOrder(order.id, {
          vendor_id: String(alt),
          original_vendor_id: String(primaryVid),
          yasmine_routing_status: 'pending_acceptance',
          acceptance_deadline_at: dl,
          yasmine_meta: Object.assign({}, order.yasmine_meta || {}, {
            rerouted_at: new Date().toISOString(),
            reason: 'acceptance_timeout',
          }),
        });
      } catch (e) {}
      return;
    }

    var vrow = await getVendorRow(primaryVid);
    var ready = estimatedReadyFromSchedule(vrow && vrow.weekly_schedule, new Date());
    try {
      await SB.updateOrder(order.id, {
        yasmine_routing_status: 'preorder',
        acceptance_deadline_at: null,
        estimated_ready_at: ready.toISOString(),
        yasmine_meta: Object.assign({}, order.yasmine_meta || {}, { fallback: 'preorder_after_timeout' }),
      });
    } catch (e2) {}
  }

  async function processStaleAcceptanceOrders() {
    if (typeof SB === 'undefined' || !SB.getOrders) return 0;
    var all;
    try {
      all = await SB.getOrders();
    } catch (e) {
      return 0;
    }
    var now = Date.now();
    var n = 0;
    for (var i = 0; i < (all || []).length; i++) {
      var o = all[i];
      if (String(o.status || '').toLowerCase() !== 'pending') continue;
      if (o.yasmine_routing_status !== 'pending_acceptance') continue;
      var dl = o.acceptance_deadline_at;
      if (!dl) continue;
      if (new Date(dl).getTime() >= now) continue;
      await handleStaleOrder(o);
      n++;
    }
    return n;
  }

  async function vendorAcceptOrder(orderId) {
    if (!orderId || typeof SB === 'undefined') return { ok: false };
    var uid = typeof State !== 'undefined' && State.currentUser && State.currentUser.id != null ? String(State.currentUser.id) : '';
    try {
      await SB.updateOrder(orderId, {
        status: 'confirmed',
        yasmine_routing_status: 'accepted',
        acceptance_deadline_at: null,
        yasmine_meta: { accepted_at: new Date().toISOString() },
      });
      if (uid) await resetVendorTimeouts(uid);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  function productDeliveryHint(product, vendorRow) {
    ensureProductSku(product);
    if (!vendorRow) {
      return { text: 'Fast Delivery (24h)', tone: 'ok' };
    }
    if (vendorIsActive(vendorRow)) {
      return { text: 'Fast Delivery (24h)', tone: 'ok' };
    }
    var sched = vendorRow.weekly_schedule;
    var hasSched = sched && typeof sched === 'object' && Object.keys(sched).length > 0;
    if (hasSched) {
      var r = estimatedReadyFromSchedule(sched, new Date());
      return {
        text: 'Delayed Delivery — Ready on ' + r.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        tone: 'warn',
      };
    }
    return { text: 'Processing starts in 48h — ask for availability', tone: 'muted' };
  }

  var _heartbeat = null;
  function startVendorStaleChecker() {
    if (_heartbeat) return;
    _heartbeat = setInterval(function () {
      processStaleAcceptanceOrders().catch(function () {});
    }, 60000);
    processStaleAcceptanceOrders().catch(function () {});
  }

  return {
    ensureProductSku: ensureProductSku,
    computeSkuDna: computeSkuDna,
    vendorIsActive: vendorIsActive,
    estimatedReadyFromSchedule: estimatedReadyFromSchedule,
    preorderMessage: preorderMessage,
    getVendorRow: getVendorRow,
    ensureVendorRow: ensureVendorRow,
    buildOrderExtraForGroup: buildOrderExtraForGroup,
    processStaleAcceptanceOrders: processStaleAcceptanceOrders,
    vendorAcceptOrder: vendorAcceptOrder,
    productDeliveryHint: productDeliveryHint,
    startVendorStaleChecker: startVendorStaleChecker,
    incrementVendorTimeoutAndMaybeAway: incrementVendorTimeoutAndMaybeAway,
  };
})();
