// Kept for backwards-compat with older HTML files.
// This file intentionally mirrors `supabase-fixed.js` and provides a fetch-based `SB` client.

// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://kmwqffaphhcbzboiwosj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3FmZmFwaGhjYnpib2l3b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDEwNDgsImV4cCI6MjA4ODkxNzA0OH0.aaMK_w3SH8vHBOjjbcH5yO04Bxjgfn4azeePUzAUYjM';

// Initialize Supabase client - fetch API only (no library dependency)
const SB = {
  // ── GENERIC REQUEST ──
  async req(method, table, body, query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : ''
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      let msg = 'Supabase error';
      try {
        const err = await res.json();
        msg = err.message || err.error_description || err.hint || msg;
      } catch (e) {}
      throw new Error(msg);
    }
    return method === 'DELETE' ? null : res.json();
  },

  // ── USERS ──
  async getUser(email) {
    const data = await this.req('GET', 'users', null, `?email=eq.${encodeURIComponent(email)}&limit=1`);
    return data[0] || null;
  },
  async createUser(user) {
    const data = await this.req('POST', 'users', user);
    return data[0];
  },
  async updateUser(id, updates) {
    const data = await this.req('PATCH', 'users', updates, `?id=eq.${id}`);
    return data[0];
  },

  // ── PRODUCTS ──
  async getProducts() {
    return this.req('GET', 'products', null, '?order=created_at.desc');
  },
  async getProduct(id) {
    const data = await this.req('GET', 'products', null, `?id=eq.${id}&limit=1`);
    return data[0] || null;
  },
  async createProduct(product) {
    const data = await this.req('POST', 'products', product);
    return data[0];
  },
  async updateProduct(id, updates) {
    const data = await this.req('PATCH', 'products', updates, `?id=eq.${id}`);
    return data[0];
  },
  async deleteProduct(id) {
    return this.req('DELETE', 'products', null, `?id=eq.${id}`);
  },

  // ── ORDERS ──
  async getOrders() {
    return this.req('GET', 'orders', null, '?order=created_at.desc');
  },
  async getOrder(id) {
    const data = await this.req('GET', 'orders', null, `?id=eq.${id}&limit=1`);
    return data[0] || null;
  },
  async createOrder(order) {
    const data = await this.req('POST', 'orders', order);
    return data[0];
  },
  async updateOrder(id, updates) {
    const data = await this.req('PATCH', 'orders', updates, `?id=eq.${id}`);
    return data[0];
  },
  async getUserOrders(userId) {
    return this.req('GET', 'orders', null, `?user_id=eq.${userId}&order=created_at.desc`);
  },
  async getVendorOrders(vendorId) {
    // Accept either `vendor_id` (snake_case) or `vendorId` (camelCase) schemas.
    try {
      const bySnake = await this.req('GET', 'orders', null, `?vendor_id=eq.${vendorId}&order=created_at.desc`);
      if (Array.isArray(bySnake) && bySnake.length) return bySnake;
    } catch (e) {}
    return this.req('GET', 'orders', null, `?vendorId=eq.${vendorId}&order=created_at.desc`);
  },

  // ── ORDER TRACKING ──
  async getTracking(orderId) {
    return this.req('GET', 'order_tracking', null, `?order_id=eq.${orderId}&order=created_at.desc`);
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
  }
};

console.log('✅ Supabase client initialized (fetch-based)');
