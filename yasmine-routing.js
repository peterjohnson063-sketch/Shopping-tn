/**
 * Yasmine Order Routing Engine — vendor availability, SKU_DNA matching, pre-orders, SOS acceptance.
 * Depends on SB (supabase-fixed.js) and optional State (app.js).
 */
var EverestYasmineRouting = (function () {
  var ACCEPT_MS = 15 * 60 * 1000;
  var PROCESSING_MS = 24 * 60 * 60 * 1000;

  /** All logistics / same-day cutoffs use Tunisia civil time (Africa/Tunis). */
  var EVEREST_TZ = 'Africa/Tunis';
  /** Hard cutoff: same-day handover to cave & drivers ends at 16:00 Tunis (inclusive — after this, next-day delivery messaging). */
  var LOGISTICS_CUTOFF_HOUR = 16;

  function tunisMinutesFromMidnight(d) {
    var dt = d ? new Date(d) : new Date();
    if (isNaN(dt.getTime())) dt = new Date();
    /** Wall clock in Tunisia (UTC+1, no DST) — not the visitor's local timezone. */
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: EVEREST_TZ,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    }).formatToParts(dt);
    var h = 0;
    var m = 0;
    parts.forEach(function (p) {
      if (p.type === 'hour') h = parseInt(p.value, 10) || 0;
      if (p.type === 'minute') m = parseInt(p.value, 10) || 0;
    });
    return h * 60 + m;
  }

  /** 0 = Sunday … 6 = Saturday (Tunis calendar). */
  function tunisWeekdayIndex(d) {
    var dt = d ? new Date(d) : new Date();
    if (isNaN(dt.getTime())) dt = new Date();
    var w = new Intl.DateTimeFormat('en-US', { timeZone: EVEREST_TZ, weekday: 'short' }).format(dt);
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return map[w] != null ? map[w] : 0;
  }

  /** True from 16:00:00 Africa/Tunis through 23:59 — before that, same-day messaging still applies. */
  function isPastLogisticsCutoff(atDate) {
    return tunisMinutesFromMidnight(atDate) >= LOGISTICS_CUTOFF_HOUR * 60;
  }

  function getProductListingDeliveryLine() {
    if (isPastLogisticsCutoff(new Date())) {
      return {
        text:
          'Next Day Delivery — same-day handover has closed (after 4:00 PM Tunisia time, Africa/Tunis). Your order follows the next logistics run; confirmation and updates appear in Track.',
        tone: 'cutoff',
      };
    }
    return {
      text:
        'Order before 4:00 PM Tunisia time (Africa/Tunis) to qualify for same-day logistics handover, subject to product availability and partner preparation. After checkout, Track shows live status.',
      tone: 'ok',
    };
  }

  /** Wilayas treated as Sahel for May launch routing (admin still confirms on verify). */
  var SAHEL_WILAYAS = [
    'Monastir',
    'Sousse',
    'Mahdia',
    'Nabeul',
    'Sfax',
    'Kairouan',
    'Ben Arous',
    'Manouba',
    'Zaghouan',
    'Ariana',
  ];

  function normalizeWilaya(w) {
    return String(w || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function isWilayaInSahel(wilaya) {
    var n = normalizeWilaya(wilaya);
    if (!n) return false;
    return SAHEL_WILAYAS.some(function (s) {
      return normalizeWilaya(s) === n;
    });
  }

  /** Partner must be admin-approved for Sahel + active onboarding to participate in live routing. */
  function vendorRoutingEligible(row) {
    if (!row) return false;
    var st = row.onboarding_status;
    if (st === 'inactive' || st === 'pending_verification') return false;
    if (row.sahel_verified === false) return false;
    return true;
  }

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
    var catKey = (
      out.category_id ||
      out.categoryId ||
      out.cat ||
      out.category ||
      'GEN'
    )
      .toString()
      .trim();
    var brandKey = (out.brand_id || out.brandId || out.brand || 'EVR').toString().trim() || 'EVR';
    var seq = String(out.id != null ? out.id : '')
      .replace(/[^0-9a-zA-Z]/g, '')
      .slice(-4);
    if (!seq) seq = '0001';
    if (out.category_id == null && out.categoryId == null) out.category_id = catKey;
    if (out.brand_id == null && out.brandId == null) out.brand_id = brandKey;
    var uCat = _slug(catKey).toUpperCase().slice(0, 12) || 'GEN';
    var uBrand = _slug(brandKey).toUpperCase().slice(0, 8) || 'EVR';
    var uCol = _slug(color).toUpperCase().slice(0, 10) || 'DEF';
    var uSz = _slug(size).toUpperCase().slice(0, 10) || 'ONE';
    out.universal_sku = 'SAHEL-' + uCat + '-' + uBrand + '-' + seq + '-' + uCol + '-' + uSz;
    return out;
  }

  function computeSkuDna(p) {
    return ensureProductSku(Object.assign({}, p)).sku_dna;
  }

  function vendorIsActive(row) {
    return !!(row && row.service_status === 'active');
  }

  /** True when the partner is In Service and current local time is inside their weekly open/close window. */
  function timeToMinutes(t) {
    var s = String(t || '08:00').trim();
    var parts = s.split(':');
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    return Math.min(24 * 60 - 1, Math.max(0, h * 60 + m));
  }

  function dayKeys() {
    return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  }

  function getDayScheduleFor(sched, dk) {
    if (!sched || typeof sched !== 'object') return null;
    return (
      sched[dk] ||
      sched[dk.toUpperCase()] ||
      sched[dk.charAt(0).toUpperCase() + dk.slice(1)] ||
      null
    );
  }

  function isVendorWithinWeeklyHours(weeklySchedule, atDate) {
    var sched = weeklySchedule && typeof weeklySchedule === 'object' ? weeklySchedule : {};
    var d = atDate ? new Date(atDate) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var dk = dayKeys()[tunisWeekdayIndex(d)];
    var day = getDayScheduleFor(sched, dk);
    if (!day || day.closed) return false;
    var oMin = timeToMinutes(day.open || day.start || '08:00');
    var cMin = timeToMinutes(day.close || day.end || '16:00');
    if (cMin <= oMin) return false;
    var nowMin = tunisMinutesFromMidnight(d);
    return nowMin >= oMin && nowMin <= cMin;
  }

  /** In Service + inside weekly hours (15‑min SOS). Away / break / closed day or after hours → pre-order path. */
  function vendorImmediateSosEligible(row) {
    if (!row) return false;
    if (isPastLogisticsCutoff(new Date())) return false;
    if (!vendorRoutingEligible(row)) return false;
    if (row.service_status === 'away' || row.service_status === 'scheduled_break') return false;
    if (row.service_status !== 'active') return false;
    return isVendorWithinWeeklyHours(row.weekly_schedule, new Date());
  }

  /** Default: Mon–Fri 08:00–16:00 open; Sat–Sun closed (vendors can change in the app). */
  function defaultWeeklySchedule() {
    var o = {};
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(function (d) {
      o[d] = { open: '08:00', close: '16:00' };
    });
    ['sat', 'sun'].forEach(function (d) {
      o[d] = { closed: true };
    });
    return o;
  }

  /** Short text for buyers (product page). */
  function formatWeeklyScheduleForBuyer(sched) {
    if (!sched || typeof sched !== 'object') return '';
    var order = [
      { k: 'mon', l: 'Mon' },
      { k: 'tue', l: 'Tue' },
      { k: 'wed', l: 'Wed' },
      { k: 'thu', l: 'Thu' },
      { k: 'fri', l: 'Fri' },
      { k: 'sat', l: 'Sat' },
      { k: 'sun', l: 'Sun' },
    ];
    var parts = [];
    order.forEach(function (x) {
      var day = sched[x.k];
      if (!day) return;
      if (day.closed) parts.push(x.l + ' closed');
      else {
        var a = (day.open || day.start || '08:00').toString().slice(0, 5);
        var b = (day.close || day.end || '16:00').toString().slice(0, 5);
        parts.push(x.l + ' ' + a + '–' + b);
      }
    });
    return parts.join(' · ');
  }

  /** Next estimated ready time: next time the partner can process + 24h buffer (pre-order). */
  function estimatedReadyFromSchedule(weeklySchedule, fromDate) {
    var sched = weeklySchedule && typeof weeklySchedule === 'object' ? weeklySchedule : {};
    var start = fromDate ? new Date(fromDate) : new Date();
    if (isNaN(start.getTime())) start = new Date();
    var keys = dayKeys();
    for (var d = 0; d < 14; d++) {
      var probe = new Date(start.getTime() + d * 86400000);
      var dk = keys[probe.getDay()];
      var day = getDayScheduleFor(sched, dk);
      if (!day || day.closed) continue;
      if (!(day.open || day.start || day.close || day.end)) continue;
      var oMin = timeToMinutes(day.open || day.start || '08:00');
      var cMin = timeToMinutes(day.close || day.end || '16:00');
      if (cMin <= oMin) continue;
      var y = probe.getFullYear();
      var mo = probe.getMonth();
      var dayNum = probe.getDate();
      var midnight = new Date(y, mo, dayNum, 0, 0, 0, 0).getTime();
      var dayStartMs = midnight + oMin * 60000;
      var dayEndMs = midnight + cMin * 60000;
      var t = start.getTime();
      if (d === 0) {
        if (t < dayStartMs) return new Date(dayStartMs + PROCESSING_MS);
        if (t >= dayStartMs && t <= dayEndMs) return new Date(t + PROCESSING_MS);
        continue;
      }
      return new Date(dayStartMs + PROCESSING_MS);
    }
    return new Date(start.getTime() + 48 * 3600000 + PROCESSING_MS);
  }

  function preorderMessage(readyDate) {
    var ds = readyDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return (
      'Pre-order: Processing in 24–48h. Estimated ready around ' +
      ds +
      '. Everest will confirm by email or in Track.'
    );
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
    var base = {
      id: String(vendorId),
      service_status: 'away',
      weekly_schedule: defaultWeeklySchedule(),
      consecutive_timeout_orders: 0,
      onboarding_status: 'inactive',
      sahel_verified: false,
    };
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

  /** Same SKU_DNA (parent_sku + color + size) across catalog = substitute when primary line is closed. */
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
      if (vendorImmediateSosEligible(vr)) return candidates[i];
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

    if (isPastLogisticsCutoff(new Date())) {
      var readyCut = estimatedReadyFromSchedule(vrow.weekly_schedule, new Date());
      return {
        vendor_id: String(primaryVid),
        yasmine_routing_status: 'preorder',
        acceptance_deadline_at: null,
        original_vendor_id: null,
        estimated_ready_at: readyCut.toISOString(),
        yasmine_meta: Object.assign({}, meta, { step: 'tunis_logistics_cutoff', logistics_cutoff_16h: true }),
        /** No toast / duplicate copy — checkout shows one logistics banner; not “seller not ready”. */
        customerNote: null,
      };
    }

    if (vendorImmediateSosEligible(vrow)) {
      var dl = new Date(Date.now() + ACCEPT_MS).toISOString();
      return {
        vendor_id: String(primaryVid),
        yasmine_routing_status: 'pending_acceptance',
        acceptance_deadline_at: dl,
        original_vendor_id: null,
        estimated_ready_at: null,
        yasmine_meta: Object.assign({}, meta, { step: 'direct_match_sos' }),
        customerNote: 'Everest is confirming your order — please allow up to 15 minutes.',
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
        customerNote: 'Everest assigned fulfillment from another partner with the same item in stock.',
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
    if (n >= 1) nextStatus = 'away';
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
    if (n >= 1 && SB.createAdminAlert) {
      try {
        await SB.createAdminAlert({
          kind: 'vendor_auto_away',
          message:
            'Partner ' +
            String(vendorId) +
            ' set to Away after no response within the 15-minute acceptance window (Yasmine Sahel).',
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
    if (isPastLogisticsCutoff(new Date())) {
      return {
        text: 'Next logistics day — same-day handover closed after 4:00 PM Tunisia time.',
        tone: 'warn',
        hoursLine: '',
        preorder: false,
        logisticsCutoff: true,
      };
    }
    if (!vendorRow) {
      return {
        text: 'Standard Everest dispatch — we will confirm timing after checkout.',
        tone: 'ok',
        hoursLine: '',
        preorder: false,
      };
    }
    if (vendorImmediateSosEligible(vendorRow)) {
      return {
        text: 'Quick confirmation window — Everest can usually confirm this line shortly after you order.',
        tone: 'ok',
        hoursLine: '',
        preorder: false,
      };
    }
    var sched = vendorRow.weekly_schedule;
    var hasSched = sched && typeof sched === 'object' && Object.keys(sched).length > 0;
    var r = hasSched ? estimatedReadyFromSchedule(sched, new Date()) : new Date(Date.now() + 48 * 3600000 + PROCESSING_MS);
    var ds = r.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    return {
      text: 'Preparation window — estimated ready around ' + ds + '. Final date in checkout & Track.',
      tone: 'warn',
      hoursLine: '',
      preorder: true,
    };
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
    vendorImmediateSosEligible: vendorImmediateSosEligible,
    isVendorWithinWeeklyHours: isVendorWithinWeeklyHours,
    defaultWeeklySchedule: defaultWeeklySchedule,
    formatWeeklyScheduleForBuyer: formatWeeklyScheduleForBuyer,
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
    SAHEL_WILAYAS: SAHEL_WILAYAS,
    normalizeWilaya: normalizeWilaya,
    isWilayaInSahel: isWilayaInSahel,
    vendorRoutingEligible: vendorRoutingEligible,
    EVEREST_TZ: EVEREST_TZ,
    LOGISTICS_CUTOFF_HOUR: LOGISTICS_CUTOFF_HOUR,
    tunisMinutesFromMidnight: tunisMinutesFromMidnight,
    isPastLogisticsCutoff: isPastLogisticsCutoff,
    getProductListingDeliveryLine: getProductListingDeliveryLine,
  };
})();
