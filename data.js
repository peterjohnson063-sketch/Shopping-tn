
// ═══════════════════════════════════════════════
// SHOPPING — MOCK DATABASE & STATE MANAGER
// ═══════════════════════════════════════════════
const WILAYAS = {
  'Monastir': ['Monastir','Moknine','Ksar Hellal','Jemmal','Sayada','Bembla','Beni Hassen','Sahline','Zeramdine','Ouardanine','Téboulba'],
  'Sousse': ['Sousse Ville','Hammam Sousse','Akouda','Kalaa Kebira','Kalaa Seghira','Msaken','Sidi Bou Ali','Enfida'],
  'Sfax': ['Sfax Ville','Sakiet Ezzit','Sakiet Eddaïer','Chihia','Gremda','El Ain','Thyna','Bir Ali Ben Khalifa'],
  'Tunis': ['Tunis','La Marsa','Carthage','Sidi Bou Said','La Goulette','Le Bardo','Ariana','Manouba'],
  'Nabeul': ['Nabeul','Hammamet','Kelibia','Korba','Menzel Temime','El Haouaria','Soliman'],
  'Kairouan': ['Kairouan','Sbikha','Chebika','El Alaa','Haffouz','Nasrallah'],
  'Bizerte': ['Bizerte','Menzel Bourguiba','Mateur','Tinja','Ras Jebel'],
  'Béja': ['Béja','Medjez El Bab','Testour','Nefza','Thibar'],
  'Jendouba': ['Jendouba','Tabarka','Aïn Draham','Fernana','Bou Salem'],
  'Kef': ['Le Kef','Dahmani','Sakiet Sidi Youssef','Tajerouine'],
  'Siliana': ['Siliana','Makthar','Rouhia','Kesra'],
  'Zaghouan': ['Zaghouan','Fahs','Nadhour','Bir Mcherga'],
  'Ben Arous': ['Ben Arous','Rades','Ezzahra','Hammam Lif','Megrine'],
  'Mahdia': ['Mahdia','Ksour Essef','Chebba','Bou Merdes','El Jem'],
  'Kasserine': ['Kasserine','Sbeitla','Feriana','Thala','Hassi El Ferid'],
  'Sidi Bouzid': ['Sidi Bouzid','Jelma','Cebbala','Meknassy'],
  'Gabès': ['Gabès','El Hamma','Mareth','Matmata'],
  'Médenine': ['Médenine','Djerba','Zarzis','Ben Guerdane','Houmt Souk'],
  'Tataouine': ['Tataouine','Remada','Ghomrassen','Beni Médhour'],
  'Tozeur': ['Tozeur','Nefta','Degache','Hazoua'],
  'Kebili': ['Kebili','Douz','Souk Lahad','El Faouar'],
  'Gafsa': ['Gafsa','Metlaoui','Moularès','El Ksar','Redeyef'],
  'Manouba': ['Manouba','Oued Ellil','Tébourba','El Batan']
};

const PRODUCTS_DATA = [
  { id:1, name:'Velvet Sultan Sofa', brand:'Maalej Artisan', region:'Ksar Hellal', cat:'furniture', price:3299, oldPrice:3900, rating:4.8, reviews:127, badge:'Bestseller', emoji:'🛋', verified:true, stock:5, desc:'Handcrafted in Ksar Hellal using premium Italian velvet over a solid walnut frame. This sofa blends traditional Tunisian craftsmanship with contemporary luxury design. Available in 8 colors.', specs:{width:'240cm', depth:'95cm', height:'85cm', material:'Solid Walnut + Italian Velvet', warranty:'5 years'} },
  { id:2, name:'Brass Moroccan Lantern', brand:'Sfax Lumières', region:'Sfax', cat:'lighting', price:849, oldPrice:null, rating:4.9, reviews:89, badge:'New', emoji:'💡', verified:true, stock:12, desc:'Hand-hammered brass lantern with intricate geometric cutwork. Each piece is unique, crafted by master artisans with over 30 years of experience in metalwork.', specs:{height:'45cm', diameter:'30cm', material:'Hand-hammered Brass', warranty:'2 years'} },
  { id:3, name:'Antique Gold Mirror', brand:'Nabeul Glass', region:'Nabeul', cat:'decor', price:1599, oldPrice:null, rating:4.7, reviews:56, badge:null, emoji:'🪞', verified:true, stock:3, desc:'Ornate full-length mirror with hand-gilded frame featuring traditional Tunisian geometric patterns. Made from recycled glass and sustainably sourced wood.', specs:{height:'180cm', width:'80cm', material:'Recycled Glass + Gilded Frame', warranty:'3 years'} },
  { id:4, name:'Champagne Bedroom Suite', brand:'Royal Sleep', region:'Tunis', cat:'bedroom', price:6800, oldPrice:null, rating:4.9, reviews:34, badge:'Premium', emoji:'🛏', verified:true, stock:2, desc:'Complete 5-piece bedroom suite in champagne satin finish. Includes king bed, two nightstands, dresser, and wardrobe. Soft-close mechanisms throughout.', specs:{bedSize:'200x200cm', material:'MDF + Champagne Lacquer', warranty:'10 years'} },
  { id:5, name:'Hand-Painted Dinner Set', brand:'Nabeul Ceramics', region:'Nabeul', cat:'ceramics', price:420, oldPrice:500, rating:4.6, reviews:203, badge:'Popular', emoji:'🍽', verified:true, stock:20, desc:'24-piece hand-painted ceramic dinner set. Each piece painted by artisans trained in traditional Nabeul pottery techniques. Dishwasher safe.', specs:{pieces:'24', material:'Nabeul Clay', dishwasherSafe:'Yes', warranty:'1 year'} },
  { id:6, name:'Custom Walnut Dining Set', brand:'Monastir Wood', region:'Monastir', cat:'furniture', price:4500, oldPrice:null, rating:5.0, reviews:18, badge:'Sur Mesure', emoji:'🪵', verified:true, stock:1, desc:'Fully customizable dining table and chair set crafted from locally sourced Tunisian walnut. Quote includes consultation, 3D rendering, and delivery.', specs:{customizable:true, material:'Tunisian Walnut', leadTime:'4-6 weeks', warranty:'10 years'} },
  { id:7, name:'Rattan Garden Set', brand:'Djerba Outdoors', region:'Médenine', cat:'outdoor', price:2100, oldPrice:2800, rating:4.5, reviews:67, badge:'Sale', emoji:'🪑', verified:true, stock:8, desc:'Weather-resistant rattan outdoor seating set. Includes 4-seater sofa, coffee table, and 2 lounge chairs. UV and rain resistant cushions included.', specs:{pieces:'7', material:'Synthetic Rattan + Aluminium', weatherproof:'Yes', warranty:'3 years'} },
  { id:8, name:'Abstract Canvas Art', brand:'Tunis Art Gallery', region:'Tunis', cat:'decor', price:680, oldPrice:null, rating:4.4, reviews:45, badge:null, emoji:'🖼', verified:false, stock:6, desc:'Original abstract canvas painting by renowned Tunisian artist. Each piece is one-of-a-kind, signed and comes with certificate of authenticity.', specs:{size:'120x80cm', material:'Acrylic on Canvas', framed:'Yes', warranty:'N/A'} },
  { id:9, name:'Crystal Chandelier', brand:'Carthage Crystal', region:'Tunis', cat:'lighting', price:3800, oldPrice:4500, rating:4.8, reviews:29, badge:'Luxury', emoji:'🕯', verified:true, stock:4, desc:'Handcrafted crystal chandelier with 48 premium Swarovski-inspired crystals. Suitable for rooms up to 50m². Includes professional installation guide.', specs:{diameter:'80cm', height:'100cm', bulbs:'12xE14', material:'Steel + Crystal', warranty:'5 years'} },
  { id:10, name:'Marble Coffee Table', brand:'Bizerte Stone', region:'Bizerte', cat:'furniture', price:1850, oldPrice:2200, rating:4.7, reviews:88, badge:'Trending', emoji:'🪨', verified:true, stock:7, desc:'Solid Tunisian white marble coffee table with brushed gold steel base. Each table is unique — the natural veining pattern differs on every piece.', specs:{diameter:'100cm', height:'42cm', material:'Tunisian Marble + Gold Steel', warranty:'5 years'} },
  { id:11, name:'Jasmine Fragrance Set', brand:'Nabeul Blooms', region:'Nabeul', cat:'fragrance', price:185, oldPrice:null, rating:4.9, reviews:312, badge:'Bestseller', emoji:'🧴', verified:true, stock:50, desc:'Artisanal jasmine fragrance collection made from hand-picked Cap Bon jasmine. Set includes 3 candles, diffuser, and 50ml eau de parfum.', specs:{pieces:'5', scent:'Jasmine + Amber', duration:'40h candles', warranty:'N/A'} },
  { id:12, name:'Kilim Berber Rug', brand:'Kairouan Weave', region:'Kairouan', cat:'decor', price:1200, oldPrice:1500, rating:4.8, reviews:156, badge:'Artisan', emoji:'🪡', verified:true, stock:9, desc:'Authentic hand-woven Berber kilim rug from Kairouan masters. Natural wool dyed with traditional plant pigments. No two rugs are identical.', specs:{size:'200x300cm', material:'Natural Wool', handmade:'Yes', warranty:'Lifetime'} }
];

const PROMO_CODES = {
  'SHOPPING10': { type:'percent', value:10, desc:'10% off your order' },
  'SAHEL20': { type:'percent', value:20, desc:'20% off — Sahel Region Special' },
  'WELCOME50': { type:'fixed', value:50, desc:'50 TND off first order' },
  'VIP100': { type:'fixed', value:100, desc:'100 TND VIP discount' },
  'MONASTIR15': { type:'percent', value:15, desc:'15% — Monastir Pride discount' }
};

const LOYALTY_TIERS = [
  { name:'Bronze', min:0, max:999, color:'#cd7f32', perks:['5% cashback','Free standard shipping','Early access to sales'] },
  { name:'Silver', min:1000, max:4999, color:'#c0c0c0', perks:['8% cashback','Free express shipping','Priority support','Birthday bonus'] },
  { name:'Gold', min:5000, max:14999, color:'#7c3aed', perks:['12% cashback','Free white-glove delivery','VIP support line','Exclusive products','Monthly gift'] },
  { name:'Platinum', min:15000, max:Infinity, color:'#1e0a4e', perks:['18% cashback','Dedicated account manager','All Gold perks','Annual luxury gift','Private sale events'] }
];

// ── DB ──
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('stn_'+key)); } catch(e) { return null; } },
  set(key, val) { localStorage.setItem('stn_'+key, JSON.stringify(val)); },
  del(key) { localStorage.removeItem('stn_'+key); }
};

// ── INIT DEFAULT DATA ──
if (!DB.get('products')) DB.set('products', PRODUCTS_DATA);
if (!DB.get('users')) DB.set('users', [
  { id:1, firstName:'Admin', lastName:'Shopping', email:'admin@shopping', phone:'20000001', wilaya:'Monastir', delegation:'Monastir', password:'admin123', role:'admin', points:15000, verified:true, avatar:'👑' },
  { id:2, firstName:'Ahmed', lastName:'Maalej', email:'vendor@shopping', phone:'20000002', wilaya:'Monastir', delegation:'Ksar Hellal', password:'vendor123', role:'vendor', points:5000, verified:true, avatar:'🧑‍🎨' }
]);
if (!DB.get('orders')) DB.set('orders', [
  { id:'SHP-2026-0001', userId:1, items:[{name:'Velvet Sultan Sofa',price:3299,qty:1}], total:3299, status:'delivered', date:'2026-02-10', tracking:[{status:'Confirmed',time:'Feb 10, 10:00 AM'},{status:'Processing',time:'Feb 11, 02:00 PM'},{status:'Shipped',time:'Feb 12, 08:00 AM'},{status:'Out for Delivery',time:'Feb 14, 09:00 AM'},{status:'Delivered',time:'Feb 14, 03:30 PM'}] },
  { id:'SHP-2026-0042', userId:null, items:[{name:'Brass Moroccan Lantern',price:849,qty:2}], total:1698, status:'transit', date:'2026-03-05', tracking:[{status:'Confirmed',time:'Mar 5, 09:14 AM'},{status:'Processing',time:'Mar 6, 02:30 PM'},{status:'Shipped',time:'Mar 7, 08:00 AM'}] }
]);
if (!DB.get('reviews')) DB.set('reviews', [
  { id:1, productId:1, userId:1, userName:'Ahmed M.', rating:5, comment:'Absolutely stunning quality! Delivered in Ksar Hellal within 3 days. The velvet is premium and the craftsmanship is unmatched.', date:'2026-02-15', verified:true },
  { id:2, productId:1, userId:2, userName:'Fatma B.', rating:5, comment:'Best sofa I\'ve ever owned. Worth every dinar!', date:'2026-02-20', verified:true },
  { id:3, productId:2, userId:1, userName:'Mohamed T.', rating:5, comment:'Gorgeous lantern, exactly as pictured. Very fast shipping to Monastir.', date:'2026-03-01', verified:true }
]);
if (!DB.get('cart')) DB.set('cart', []);
if (!DB.get('wishlist')) DB.set('wishlist', []);
if (!DB.get('currentUser')) DB.set('currentUser', null);

window.STN = { DB, PRODUCTS_DATA, WILAYAS, PROMO_CODES, LOYALTY_TIERS };
console.log('🛒 Shopping Data Layer Ready');

