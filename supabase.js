// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://kmwqffaphhcbzboiwosj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3FmZmFwaGhjYnpib2l3b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMDE3NjIsImV4cCI6MjA1NjY3Nzc2Mn0.eyJpc3MiOiJzdXBhYmFzZSJ9';

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
      const err = await res.json();
      throw new Error(err.message || 'Supabase error');
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
  async createProduct(product) {
    const data = await this.req('POST', 'products', product);
    return data[0];
  },
  async deleteProduct(id) {
    return this.req('DELETE', 'products', null, `?id=eq.${id}`);
  },

  // ── ORDERS ──
  async createOrder(order) {
    const tracking = 'STN-' + Date.now().toString(36).toUpperCase();
    const data = await this.req('POST', 'orders', { ...order, tracking_number: tracking });
    const newOrder = data[0];
    // Add initial tracking event
    await this.addTracking(newOrder.id, 'pending', '🕐 Order received — being prepared by artisan', 'Ksar Hellal Workshop');
    return newOrder;
  },
  async getOrder(trackingNum) {
    const data = await this.req('GET', 'orders', null, `?tracking_number=eq.${trackingNum}&limit=1`);
    return data[0] || null;
  },
  async getUserOrders(userId) {
    return this.req('GET', 'orders', null, `?user_id=eq.${userId}&order=created_at.desc`);
  },
  async updateOrderStatus(id, status) {
    return this.req('PATCH', 'orders', { status }, `?id=eq.${id}`);
  },

  // ── ORDER TRACKING ──
  async addTracking(orderId, status, message, location) {
    return this.req('POST', 'order_tracking', { order_id: orderId, status, message, location });
  },
  async getTracking(orderId) {
    return this.req('GET', 'order_tracking', null, `?order_id=eq.${orderId}&order=created_at.asc`);
  }
};

console.log('✅ Supabase connected!');
