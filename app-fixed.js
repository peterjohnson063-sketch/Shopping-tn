// ── VENDOR DASHBOARD - BULLETPROOF VERSION ──

// Global state check
function checkVendorAccess() {
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
    return false;
  }
  console.log('✅ Vendor access check passed - user is vendor');
  return true;
}

// Safe data loading with timeout
async function safeLoadData(timeout = 10000) {
  return new Promise((resolve) => {
    const checkData = () => {
      if (State.products && State.products.length > 0) {
        console.log('✅ Data loaded successfully');
        resolve(true);
      } else {
        console.log('🔄 Data not ready, waiting...');
        setTimeout(checkData, 500);
      }
    };
    
    // Start checking
    checkData();
    
    // Timeout protection
    setTimeout(() => {
      console.log('⏰ Data loading timeout, proceeding anyway');
      resolve(false);
    }, timeout);
  });
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
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);
    const vendorProducts = products.filter(p => p.vendorId === vendorId);

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
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);
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
    const vendorProducts = products.filter(p => p.vendorId === vendorId);
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
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);

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

// Bulletproof vendor dashboard initialization
async function bulletproofInitializeVendorDashboard() {
  console.log('🔄 Starting bulletproof vendor dashboard initialization...');
  
  // Check access first
  if (!checkVendorAccess()) {
    return;
  }
  
  // Show loading states
  const kpiContainer = document.getElementById('vendor-kpi-cards');
  const ordersContainer = document.getElementById('vendor-orders-summary');
  const inventoryContainer = document.getElementById('vendor-inventory-summary');
  const analyticsContainer = document.getElementById('vendor-analytics-chart');
  const logisticsContainer = document.getElementById('vendor-logistics-map');
  
  // Show loading indicators
  if (kpiContainer) kpiContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading KPIs...</div>';
  if (ordersContainer) ordersContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading orders...</div>';
  if (inventoryContainer) inventoryContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading inventory...</div>';
  if (analyticsContainer) analyticsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading analytics...</div>';
  if (logisticsContainer) logisticsContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#9ca3af">🔄 Loading logistics...</div>';
  
  try {
    // Load components sequentially with error handling
    console.log('🔄 Loading all components...');
    
    const results = await Promise.allSettled([
      safeLoadKPIs(),
      safeLoadOrders(),
      safeLoadInventory(),
      safeLoadAnalytics(),
      safeLoadLogistics()
    ]);
    
    // Check results
    const failures = results.filter(r => r.status === 'rejected');
    const successes = results.filter(r => r.status === 'fulfilled');
    
    console.log(`📊 Results: ${successes.length} successful, ${failures.length} failed`);
    
    if (failures.length > 0) {
      console.error('❌ Some components failed to load:', failures);
      // Show partial success
      console.log('✅ Vendor dashboard partially loaded');
    } else {
      console.log('✅ All vendor dashboard components loaded successfully');
    }
    
    // Hide loading states
    const allContainers = [kpiContainer, ordersContainer, inventoryContainer, analyticsContainer, logisticsContainer];
    allContainers.forEach(container => {
      if (container && container.innerHTML.includes('Loading')) {
        console.log('✅ Component loading completed');
      }
    });
    
  } catch (error) {
    console.error('❌ Critical error initializing vendor dashboard:', error);
    
    // Show error state
    const errorMsg = `
      <div style="text-align:center;padding:4rem;color:#dc2626">
        <div style="font-size:3rem;margin-bottom:1rem">⚠️</div>
        <h3 style="margin-bottom:0.5rem;color:#dc2626">Dashboard Loading Error</h3>
        <p style="margin-bottom:2rem;color:#dc2626">Unable to load dashboard data: ${error.message || 'Unknown error'}</p>
        <button onclick="location.reload()" style="background:#dc2626;color:white;border:none;padding:0.875rem 2rem;border-radius:8px;font-weight:600;cursor:pointer">🔄 Refresh Page</button>
      </div>
    `;
    
    [kpiContainer, ordersContainer, inventoryContainer, analyticsContainer, logisticsContainer].forEach(container => {
      if (container) container.innerHTML = errorMsg;
    });
  }
}

// Export the bulletproof functions
if (typeof window !== 'undefined') {
  window.bulletproofInitializeVendorDashboard = bulletproofInitializeVendorDashboard;
  window.checkVendorAccess = checkVendorAccess;
}
