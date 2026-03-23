// Kept for backwards-compat with older HTML files.
// This file intentionally mirrors `supabase-fixed.js` and provides a fetch-based `SB` client.

// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://kmwqffaphhcbzboiwosj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3FmZmFwaGhjYnpib2l3b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDEwNDgsImV4cCI6MjA4ODkxNzA0OH0.aaMK_w3SH8vHBOjjbcH5yO04Bxjgfn4azeePUzAUYjM';

function _sbSafeTable(table) {
  if (!table || typeof table !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error('Invalid REST resource name');
  }
  return table;
}

function _sbEq(value) {
  return encodeURIComponent(value == null ? '' : String(value));
}

function _sbIsUuid(v) {
  if (v == null || v === '') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v).trim());
}

const _ORDER_STATUSES = new Set([
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'ready', 'cancelled', 'canceled', 'transit',
]);

function _sbProductCategoryColumn() {
  if (typeof window !== 'undefined' && window.STN_PRODUCT_CATEGORY_COLUMN) {
    var c = String(window.STN_PRODUCT_CATEGORY_COLUMN).trim();
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c)) return c;
  }
  return 'category';
}

function _sbProductOldPriceColumn() {
  if (typeof window !== 'undefined' && window.STN_PRODUCT_OLD_PRICE_COLUMN) {
    var c = String(window.STN_PRODUCT_OLD_PRICE_COLUMN).trim();
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c)) return c;
  }
  return 'old_price';
}

function _sbNormalizeOldPriceForApi(oldPrice, currentPrice) {
  if (oldPrice === undefined || oldPrice === null || oldPrice === '') return null;
  var n = typeof oldPrice === 'number' ? oldPrice : parseFloat(String(oldPrice).replace(',', '.').trim());
  if (!Number.isFinite(n)) return null;
  var p = currentPrice != null && Number.isFinite(Number(currentPrice)) ? Number(currentPrice) : null;
  if (p != null && n === p) return null;
  if (p != null && n <= p) return null;
  return n;
}

function _sbNormalizeProductRow(row) {
  if (!row || typeof row !== 'object') return row;
  var out = Object.assign({}, row);
  if (out.desc == null && out.description != null) out.desc = out.description;
  if ((out.image == null || out.image === '') && out.image_url != null && out.image_url !== '') {
    out.image = out.image_url;
  }
  if (!Array.isArray(out.product_images)) {
    if (typeof out.product_images === 'string' && out.product_images.trim()) {
      try {
        var parsedImgs = JSON.parse(out.product_images);
        if (Array.isArray(parsedImgs)) out.product_images = parsedImgs;
      } catch (e) {}
    }
  }
  if (!Array.isArray(out.product_images) || out.product_images.length === 0) {
    if (out.image) out.product_images = [out.image];
  }
  if (Array.isArray(out.product_images) && out.product_images.length && (out.image == null || out.image === '')) {
    out.image = out.product_images[0];
  }
  var opc = _sbProductOldPriceColumn();
  if (out.oldPrice == null || out.oldPrice === '') {
    var rawOldRow = out[opc] != null && out[opc] !== '' ? out[opc] : out.oldprice;
    if (rawOldRow != null && rawOldRow !== '') {
      var on = Number(rawOldRow);
      out.oldPrice = Number.isFinite(on) ? on : null;
    }
  }
  if (out.vendorId == null && out.vendor_id != null) out.vendorId = out.vendor_id;

  if (out.cat != null) return out;
  if (out.category != null) {
    out.cat = out.category;
    return out;
  }
  var col = _sbProductCategoryColumn();
  if (col !== 'category' && out[col] != null) out.cat = out[col];
  return out;
}

function _sbMapProductBodyForApi(product, options) {
  var omitSlug = options && options.omitCategorySlug;
  var remoteCol = _sbProductCategoryColumn();
  var body = {};
  var catVal;
  var hasCat = false;
  if (Object.prototype.hasOwnProperty.call(product, 'cat')) {
    catVal = product.cat;
    hasCat = true;
  } else if (Object.prototype.hasOwnProperty.call(product, 'category')) {
    catVal = product.category;
    hasCat = true;
  }

  Object.keys(product).forEach(function (k) {
    if (k === 'cat' || k === 'category') return;
    if (k === 'desc') return;
    if (k === 'image') return;
    if (k === 'oldPrice' || k === 'old_price') return;
    if (k === 'vendorId' || k === 'vendor_id') return;
    if (k === 'product_images') return;
    var v = product[k];
    if (v !== undefined) body[k] = v;
  });

  var rawVid =
    Object.prototype.hasOwnProperty.call(product, 'vendorId') && product.vendorId !== undefined
      ? product.vendorId
      : Object.prototype.hasOwnProperty.call(product, 'vendor_id') && product.vendor_id !== undefined
      ? product.vendor_id
      : undefined;
  if (rawVid !== undefined && rawVid !== null && String(rawVid).trim() !== '') {
    body.vendor_id = String(rawVid).trim();
  }

  var oldCol = _sbProductOldPriceColumn();
  var rawOld = Object.prototype.hasOwnProperty.call(product, 'oldPrice') ? product.oldPrice : product.old_price;
  var normOld = _sbNormalizeOldPriceForApi(rawOld, product.price);
  var hasOldKey = Object.prototype.hasOwnProperty.call(product, 'oldPrice') || Object.prototype.hasOwnProperty.call(product, 'old_price');
  if (normOld !== null) {
    body[oldCol] = normOld;
  } else if (hasOldKey) {
    body[oldCol] = null;
  }

  if (Object.prototype.hasOwnProperty.call(product, 'desc') && product.desc !== undefined) {
    body.description = product.desc;
  }
  if (Object.prototype.hasOwnProperty.call(product, 'description') && product.description !== undefined && body.description === undefined) {
    body.description = product.description;
  }

  if (Object.prototype.hasOwnProperty.call(product, 'image') && product.image != null && product.image !== '') {
    body.image_url = product.image;
  }
  if (Object.prototype.hasOwnProperty.call(product, 'image_url') && product.image_url != null && product.image_url !== '' && body.image_url === undefined) {
    body.image_url = product.image_url;
  }
  if (Object.prototype.hasOwnProperty.call(product, 'product_images')) {
    var imgs = product.product_images;
    if (Array.isArray(imgs)) {
      body.product_images = imgs.filter(function (u) { return u != null && String(u).trim() !== ''; }).slice(0, 4);
    } else if (imgs == null || imgs === '') {
      body.product_images = [];
    }
  }

  if (hasCat && catVal !== undefined && !omitSlug) {
    body[remoteCol] = catVal;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'price') && body.price != null && body.price !== '') {
    var pr = Number(body.price);
    if (Number.isFinite(pr)) body.price = pr;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'stock') && body.stock != null && body.stock !== '') {
    var st = parseInt(String(body.stock), 10);
    if (Number.isFinite(st)) body.stock = st;
  }

  return body;
}

function _sbUserBodyFromInput(user) {
  var body = {};
  if (!user || typeof user !== 'object') return body;
  Object.keys(user).forEach(function (k) {
    if (user[k] !== undefined) body[k] = user[k];
  });
  return body;
}

function _sbUserInsertShouldRetrySchema(errMsg) {
  var m = String(errMsg || '').toLowerCase();
  if (m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0) return false;
  if (m.indexOf('permission denied') >= 0) return false;
  if (m.indexOf('row-level security') >= 0 || m.indexOf('rls') >= 0) return false;
  if (m.indexOf('jwt') >= 0) return false;
  if (m.indexOf('not-null') >= 0 || m.indexOf('not null') >= 0) return false;
  return (
    m.indexOf('column') >= 0 ||
    m.indexOf('schema cache') >= 0 ||
    m.indexOf('could not find') >= 0 ||
    m.indexOf('42703') >= 0 ||
    m.indexOf('pgrst204') >= 0
  );
}

function _sbDriverUserInsertAttempts(body) {
  var list = [];
  function add(b) {
    var json = JSON.stringify(b);
    for (var i = 0; i < list.length; i++) {
      if (JSON.stringify(list[i]) === json) return;
    }
    list.push(b);
  }
  add(body);
  var a1 = Object.assign({}, body);
  delete a1.is_verified;
  add(a1);
  var a2 = Object.assign({}, body);
  delete a2.is_verified;
  delete a2.cin_document_url;
  delete a2.license_document_url;
  add(a2);
  return list;
}

function _sbUniqueUserInsertAttempts(body) {
  if (body && body.role === 'driver') {
    return _sbDriverUserInsertAttempts(body);
  }
  var list = [];
  function add(b) {
    var json = JSON.stringify(b);
    for (var i = 0; i < list.length; i++) {
      if (JSON.stringify(list[i]) === json) return;
    }
    list.push(b);
  }
  add(body);
  var a1 = Object.assign({}, body);
  delete a1.is_verified;
  add(a1);
  var a2 = Object.assign({}, body);
  delete a2.is_verified;
  delete a2.cin_document_url;
  delete a2.license_document_url;
  add(a2);
  var a3 = Object.assign({}, body);
  delete a3.is_verified;
  delete a3.cin_document_url;
  delete a3.license_document_url;
  delete a3.id_card_number;
  delete a3.vehicle_plate_number;
  delete a3.vehicle_model;
  delete a3.vehicle_color;
  add(a3);
  var baseKeys = [
    'email',
    'password',
    'first_name',
    'last_name',
    'phone',
    'wilaya',
    'delegation',
    'role',
    'points',
    'verified',
    'avatar',
    'shop_name',
    'specialty',
  ];
  var minimal = {};
  baseKeys.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) minimal[k] = body[k];
  });
  add(minimal);
  return list;
}

// Initialize Supabase client - fetch API only (no library dependency)
const SB = {
  isUuid: _sbIsUuid,

  // ── GENERIC REQUEST ──
  async req(method, table, body, query = '') {
    _sbSafeTable(table);
    const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer':
            method === 'POST' || method === 'PATCH' ? 'return=representation' : '',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        let msg = 'Supabase error';
        let detail = '';
        try {
          const errBody = await res.json();
          if (Array.isArray(errBody) && errBody[0]) {
            msg = errBody[0].message || errBody[0].error || msg;
            detail = errBody[0].details || errBody[0].hint || '';
          } else if (errBody && typeof errBody === 'object') {
            msg = errBody.message || errBody.error_description || errBody.error || msg;
            detail = errBody.details || errBody.hint || '';
            if (detail && String(msg).indexOf(String(detail).slice(0, 24)) < 0) {
              msg = msg + ' — ' + detail;
            }
          }
        } catch (e) {}
        const err = new Error(msg);
        err.status = res.status;
        err._stnLogged = true;
        if (typeof window !== 'undefined' && window.STNLog) {
          window.STNLog.error('SB.req.http', err, {
            method,
            table,
            status: res.status,
            querySnippet: String(query).slice(0, 120),
          });
        }
        throw err;
      }
      if (method === 'DELETE' || res.status === 204) return null;
      const text = await res.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (e) {
      if (typeof window !== 'undefined' && window.STNLog && !e._stnLogged) {
        window.STNLog.error('SB.req', e, {
          method,
          table,
          querySnippet: String(query).slice(0, 120),
        });
      }
      throw e;
    }
  },

  // ── USERS ──
  async getUser(email) {
    const data = await this.req('GET', 'users', null, `?email=eq.${encodeURIComponent(email)}&limit=1`);
    return data[0] || null;
  },
  async getUserById(id) {
    if (id == null || id === '') return null;
    const data = await this.req('GET', 'users', null, `?id=eq.${_sbEq(id)}&limit=1`);
    return data[0] || null;
  },
  async getUsers(limit) {
    var lim = parseInt(String(limit == null ? 300 : limit), 10);
    if (!Number.isFinite(lim) || lim < 1) lim = 300;
    lim = Math.min(lim, 1000);
    const data = await this.req('GET', 'users', null, `?order=created_at.desc&limit=${lim}`);
    return Array.isArray(data) ? data : [];
  },
  async createUser(user) {
    var body = _sbUserBodyFromInput(user);
    var attempts = _sbUniqueUserInsertAttempts(body);
    var lastErr = null;
    for (var i = 0; i < attempts.length; i++) {
      try {
        var data = await this.req('POST', 'users', attempts[i]);
        if (!Array.isArray(data) || !data[0]) {
          throw new Error(
            'Sign-up may have succeeded but the server did not return your profile. Ask an admin to allow SELECT on users for inserts, or check Row Level Security.'
          );
        }
        var row = data[0];
        if (i > 0 && typeof window !== 'undefined' && window.STNLog) {
          window.STNLog.warn('SB.createUser', 'fallback insert shape succeeded', { attempt: i });
        }
        if (i > 0) row._stnInsertFallbackLevel = i;
        return row;
      } catch (e) {
        lastErr = e;
        if (i === attempts.length - 1) break;
        if (!_sbUserInsertShouldRetrySchema(e.message)) break;
      }
    }
    throw lastErr;
  },
  async updateUser(id, updates) {
    const data = await this.req('PATCH', 'users', updates, `?id=eq.${_sbEq(id)}`);
    if (data !== null && Array.isArray(data) && data.length === 0) {
      const err = new Error(
        'No user row was updated (check id or RLS UPDATE on public.users — run migration 20260325110000_users_grant_and_rls_update.sql in Supabase).'
      );
      err._stnLogged = true;
      if (typeof window !== 'undefined' && window.STNLog) {
        window.STNLog.error('SB.updateUser', err, { id: String(id) });
      }
      throw err;
    }
    return Array.isArray(data) && data[0] != null ? data[0] : data;
  },
  async deleteUser(id) {
    if (id == null || id === '') throw new Error('Invalid user id');
    _sbSafeTable('users');
    const url = `${SUPABASE_URL}/rest/v1/users?id=eq.${_sbEq(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=representation',
      },
    });
    if (!res.ok) {
      let msg = 'Supabase error';
      let detail = '';
      try {
        const errBody = await res.json();
        if (Array.isArray(errBody) && errBody[0]) {
          msg = errBody[0].message || errBody[0].error || msg;
          detail = errBody[0].details || errBody[0].hint || '';
        } else if (errBody && typeof errBody === 'object') {
          msg = errBody.message || errBody.error_description || errBody.error || msg;
          detail = errBody.details || errBody.hint || '';
          if (detail && String(msg).indexOf(String(detail).slice(0, 24)) < 0) {
            msg = msg + ' — ' + detail;
          }
        }
      } catch (e) {}
      const err = new Error(msg);
      err.status = res.status;
      err._stnLogged = true;
      if (typeof window !== 'undefined' && window.STNLog) {
        window.STNLog.error('SB.deleteUser.http', err, { status: res.status, id: String(id) });
      }
      throw err;
    }
    const text = await res.text();
    if (res.status === 204 || !text || !String(text).trim()) {
      throw new Error('No user row was deleted (check RLS DELETE policy or user id)');
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid delete response from server');
    }
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No user row was deleted (check RLS DELETE policy or user id)');
    }
    return data[0];
  },

  // ── PRODUCTS ──
  async getProducts() {
    const data = await this.req('GET', 'products', null, '?order=created_at.desc&limit=2000');
    if (!Array.isArray(data)) return data;
    return data.map(_sbNormalizeProductRow);
  },
  async getProduct(id) {
    const data = await this.req('GET', 'products', null, `?id=eq.${_sbEq(id)}&limit=1`);
    return data[0] ? _sbNormalizeProductRow(data[0]) : null;
  },
  async createProduct(product, options) {
    const body = _sbMapProductBodyForApi(product, options);
    const data = await this.req('POST', 'products', body);
    if (!Array.isArray(data) || !data[0]) {
      const err = new Error('Product insert returned no row (check RLS and Prefer: return=representation)');
      if (typeof window !== 'undefined' && window.STNLog) window.STNLog.error('SB.createProduct', err, {});
      throw err;
    }
    return _sbNormalizeProductRow(data[0]);
  },

  async getCategoryBySlug(slug) {
    try {
      const data = await this.req('GET', 'categories', null, `?slug=eq.${encodeURIComponent(slug)}&limit=1`);
      return Array.isArray(data) && data[0] ? data[0] : null;
    } catch (e) {
      return null;
    }
  },

  async createCategoryRow(row) {
    const data = await this.req('POST', 'categories', row);
    return data && data[0] ? data[0] : null;
  },

  async ensureCategoryRecord(slug, labelHint) {
    if (!slug) return null;
    var existing = await this.getCategoryBySlug(slug);
    if (existing) return existing;
    try {
      return await this.createCategoryRow({
        slug: slug,
        label: labelHint || slug,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      if (typeof window !== 'undefined' && window.STNLog) {
        window.STNLog.warn('SB.ensureCategoryRecord', 'create failed', { slug: slug, message: e && e.message });
      }
      return null;
    }
  },
  async updateProduct(id, updates, options) {
    const body = _sbMapProductBodyForApi(updates, options);
    const data = await this.req('PATCH', 'products', body, `?id=eq.${_sbEq(id)}`);
    if (data !== null && Array.isArray(data) && data.length === 0) {
      const err = new Error(
        'No product row was updated (check product id and RLS UPDATE policy on public.products).'
      );
      err._stnLogged = true;
      if (typeof window !== 'undefined' && window.STNLog) {
        window.STNLog.error('SB.updateProduct', err, { id: String(id) });
      }
      throw err;
    }
    return data[0] ? _sbNormalizeProductRow(data[0]) : null;
  },
  async deleteProduct(id) {
    return this.req('DELETE', 'products', null, `?id=eq.${_sbEq(id)}`);
  },

  // ── ORDERS ──
  async getOrders() {
    return this.req('GET', 'orders', null, '?order=created_at.desc&limit=2000');
  },
  async getOrder(id) {
    const data = await this.req('GET', 'orders', null, `?id=eq.${_sbEq(id)}&limit=1`);
    return data[0] || null;
  },
  async findOrder(ref) {
    const r = String(ref == null ? '' : ref).trim();
    if (!r) return null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r)) {
      const byUuid = await this.getOrder(r);
      if (byUuid) return byUuid;
    }
    if (/^\d+$/.test(r)) {
      const byId = await this.getOrder(r);
      if (byId) return byId;
    }
    const data = await this.req('GET', 'orders', null, `?tracking_number=eq.${encodeURIComponent(r)}&limit=1`);
    return Array.isArray(data) && data[0] ? data[0] : null;
  },
  async createOrder(order) {
    const data = await this.req('POST', 'orders', order);
    return data[0];
  },
  async updateOrder(id, updates) {
    const data = await this.req('PATCH', 'orders', updates, `?id=eq.${_sbEq(id)}`);
    return data[0];
  },
  async updateOrderStatus(id, status) {
    const s = String(status);
    if (!_ORDER_STATUSES.has(s)) {
      const err = new Error('Invalid order status');
      if (typeof window !== 'undefined' && window.STNLog) window.STNLog.warn('SB.updateOrderStatus', 'rejected status', { status: s });
      throw err;
    }
    return this.updateOrder(id, { status: s });
  },
  async getUserOrders(userId) {
    return this.req('GET', 'orders', null, `?user_id=eq.${_sbEq(userId)}&order=created_at.desc&limit=500`);
  },
  async getVendorOrders(vendorId) {
    const v = _sbEq(vendorId);
    try {
      const bySnake = await this.req('GET', 'orders', null, `?vendor_id=eq.${v}&order=created_at.desc&limit=500`);
      if (Array.isArray(bySnake) && bySnake.length) return bySnake;
    } catch (e) {}
    return this.req('GET', 'orders', null, `?vendorId=eq.${v}&order=created_at.desc&limit=500`);
  },

  // ── ORDER TRACKING ──
  async getTracking(orderId) {
    return this.req('GET', 'order_tracking', null, `?order_id=eq.${_sbEq(orderId)}&order=created_at.desc&limit=200`);
  },
  async addTracking(orderId, status, message, location) {
    const tracking = {
      order_id: orderId,
      status,
      message,
      location,
      created_at: new Date().toISOString()
    };
    const data = await this.req('POST', 'order_tracking', tracking);
    return data[0];
  },
  _rtSeq: 0,
  subscribeToOrders() {
    return `rt_orders_${++this._rtSeq}`;
  },
  subscribeToTracking() {
    return `rt_track_${++this._rtSeq}`;
  },
  unsubscribe() {}
};

console.log('✅ Supabase client initialized (fetch-based)');
