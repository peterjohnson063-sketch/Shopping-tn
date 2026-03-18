// ── SUPABASE CONFIG ──
const SUPABASE_URL = 'https://kmwqffaphhcbzboiwosj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttd3FmZmFwaGhjYnpib2l3b3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDEwNDgsImV4cCI6MjA4ODkxNzA0OH0.aaMK_w3SH8vHBOjjbcH5yO04Bxjgfn4azeePUzAUYjM';

// Initialize Supabase client - FIXED: Wait for script to load
let supabase;
let SB;

// Initialize when script loads
function initSupabase() {
  try {
    if (typeof supabase_js !== 'undefined') {
      const { createClient } = supabase_js;
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      SB = {
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
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
          if (error) throw error;
          return data;
        },
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
  },

  // ── REALTIME SUBSCRIPTIONS ──
  subscriptions: new Map(),
  
  subscribeToOrders(callback) {
    const channelName = 'orders_changes';
    
    // Clean up existing subscription
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
    }
    
    // Create new subscription
    const channel = this.realtime.channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        (payload) => {
          console.log('📦 Real-time order update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Orders subscription status:', status);
      });
    
    this.subscriptions.set(channelName, channel);
    return channel;
  },
  
  subscribeToTracking(orderId, callback) {
    const channelName = `tracking_${orderId}`;
    
    // Clean up existing subscription
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
    }
    
    // Create new subscription
    const channel = this.realtime.channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'order_tracking', filter: `order_id=eq.${orderId}` }, 
        (payload) => {
          console.log('📍 Real-time tracking update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Tracking subscription status:', status);
      });
    
    this.subscriptions.set(channelName, channel);
    return channel;
  },
  
  unsubscribe(channelName) {
    if (this.subscriptions.has(channelName)) {
      this.subscriptions.get(channelName).unsubscribe();
      this.subscriptions.delete(channelName);
    }
  },
  
  unsubscribeAll() {
    this.subscriptions.forEach(channel => channel.unsubscribe());
    this.subscriptions.clear();
  }
};

// Initialize Supabase Realtime client
SB.realtime = supabase.realtime;

console.log('✅ Supabase connected with Realtime support!');
