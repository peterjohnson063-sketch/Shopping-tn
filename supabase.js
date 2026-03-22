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
    var v = product[k];
    if (v !== undefined) body[k] = v;
  });

  if (Object.prototype.hasOwnProperty.call(product, 'vendorId') && product.vendorId !== undefined) {
    body.vendor_id = product.vendorId;
  } else if (Object.prototype.hasOwnProperty.call(product, 'vendor_id') && product.vendor_id !== undefined) {
    body.vendor_id = product.vendor_id;
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

// Initialize Supabase client - fetch API only (no library dependency)
const SB = {
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
          'Prefer': method === 'POST' ? 'return=representation' : '',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        let msg = 'Supabase error';
        try {
          const err = await res.json();
          msg = err.message || err.error_description || err.hint || msg;
        } catch (e) {}
        const err = new Error(msg);
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
  async createUser(user) {
    const data = await this.req('POST', 'users', user);
    return data[0];
  },
  async updateUser(id, updates) {
    const data = await this.req('PATCH', 'users', updates, `?id=eq.${_sbEq(id)}`);
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
