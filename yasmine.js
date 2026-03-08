// ═══════════════════════════════════════════════
// YASMINE — REAL AI powered by Google Gemini
// ═══════════════════════════════════════════════

// 🔑 PASTE YOUR GEMINI KEY HERE:
const GEMINI_KEY = "gen-lang-client-0424037557";

const AI = {
  lang: 'fr',
  open: false,
  typing: false,

  SYSTEM: "You are Yasmine, AI assistant for Shopping.TN — Tunisia's #1 artisan marketplace. Reply in the SAME language the user writes (Arabic, French, English). Be warm and concise — max 3 sentences. You know: products (furniture, lighting, ceramics, rugs), artisans (Ahmed Maalej Ksar Hellal, Mohamed Trabelsi Monastir, Fatma Ben Nasr Nabeul), promo codes (SAHEL20=20%, WELCOME50=50TND, VIP100=100TND, MONASTIR15=15%), delivery (free over 500TND, 48h Sahel), Sur Mesure custom furniture 4-6 weeks, loyalty program 1TND=1point up to 18% cashback. Use emojis. Never invent prices.",

  callGemini(msg, callback) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY;
    const body = JSON.stringify({
      system_instruction: { parts: [{ text: AI.SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: msg }] }],
      generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            const text = data.candidates[0].content.parts[0].text;
            callback(text);
          } catch(e) {
            callback(AI.offline(msg));
          }
        } else {
          console.log("Gemini error:", xhr.status, xhr.responseText);
          callback(AI.offline(msg));
        }
      }
    };
    xhr.send(body);
  },

  offline(msg) {
    const m = msg.toLowerCase();
    const isAr = /[\u0600-\u06FF]/.test(msg);
    const isEn = ['hello','hi','what','how','product','order','track','delivery','price','buy','help','artisan','about'].some(w => m.includes(w));
    const lang = isAr ? 'ar' : isEn ? 'en' : 'fr';
    this.lang = lang;
    const R = {
      fr: {
        p: "Nous avons 12,000+ produits tunisiens! Meubles, luminaires, céramiques, tapis Kilim 🛋",
        o: "Entrez SHP-2026-XXXX sur la page Suivi pour un tracking GPS en temps réel 📦",
        l: "Livraison gratuite au-dessus de 500 TND! Maximum 48h dans le Sahel 🛵",
        pr: "Codes promo: SAHEL20 (20%), WELCOME50 (50 TND), MONASTIR15 (15%), VIP100 (100 TND) 🎁",
        a: "Ahmed Maalej (Ksar Hellal ⭐⭐⭐⭐⭐), Mohamed Trabelsi (Monastir ⭐⭐⭐⭐⭐), Fatma Ben Nasr (Nabeul ⭐⭐⭐⭐⭐) 🧑‍🎨",
        m: "Sur Mesure: dimensions exactes, rendu 3D gratuit, garantie 10 ans, 4-6 semaines 🪵",
        d: "Bonjour! Je suis Yasmine 🤖 Posez-moi n'importe quelle question sur Shopping.TN!"
      },
      ar: {
        p: "لدينا أكثر من 12,000 منتج تونسي! أثاث، إضاءة، فخار، سجاد 🛋",
        o: "أدخل SHP-2026-XXXX في صفحة التتبع لمتابعة طلبك بـ GPS 📦",
        l: "شحن مجاني فوق 500 دينار! أقصى مدة 48 ساعة في الساحل 🛵",
        pr: "رموز الخصم: SAHEL20 (20%)، WELCOME50 (50 دينار)، VIP100 (100 دينار) 🎁",
        a: "أحمد معالج (قصر هلال ⭐⭐⭐⭐⭐)، محمد الطرابلسي (المنستير ⭐⭐⭐⭐⭐)، فاطمة بن نصر (نابل ⭐⭐⭐⭐⭐) 🧑‍🎨",
        m: "Sur Mesure: أبعاد دقيقة، نموذج 3D مجاني، ضمان 10 سنوات 🪵",
        d: "أهلاً! أنا ياسمين 🤖 كيف يمكنني مساعدتك في Shopping.TN؟"
      },
      en: {
        p: "We have 12,000+ Tunisian products! Furniture, lighting, ceramics, Kilim rugs 🛋",
        o: "Enter SHP-2026-XXXX on the Track page for live GPS tracking 📦",
        l: "Free delivery over 500 TND! Max 48h in Sahel region 🛵",
        pr: "Promo codes: SAHEL20 (20%), WELCOME50 (50 TND), MONASTIR15 (15%), VIP100 (100 TND) 🎁",
        a: "Ahmed Maalej (Ksar Hellal ⭐⭐⭐⭐⭐), Mohamed Trabelsi (Monastir ⭐⭐⭐⭐⭐), Fatma Ben Nasr (Nabeul ⭐⭐⭐⭐⭐) 🧑‍🎨",
        m: "Sur Mesure: custom dimensions, free 3D rendering, 10yr warranty, 4-6 weeks 🪵",
        d: "Hello! I'm Yasmine 🤖 Ask me anything about Shopping.TN!"
      }
    };
    const r = R[lang];
    if (m.includes('produit')||m.includes('product')||m.includes('collection')||m.includes('منتج')||m.includes('shop')) return r.p;
    if (m.includes('commande')||m.includes('order')||m.includes('track')||m.includes('suivre')||m.includes('طلب')) return r.o;
    if (m.includes('livraison')||m.includes('delivery')||m.includes('ship')||m.includes('توصيل')) return r.l;
    if (m.includes('promo')||m.includes('code')||m.includes('discount')||m.includes('خصم')) return r.pr;
    if (m.includes('artisan')||m.includes('monastir')||m.includes('ksar')||m.includes('حرفي')) return r.a;
    if (m.includes('mesure')||m.includes('custom')||m.includes('meuble')||m.includes('مقاس')) return r.m;
    return r.d;
  },

  init() {
    // Bubble button
    const b = document.createElement('div');
    b.id = 'ai-bubble';
    b.innerHTML = '<span style="font-size:1.3rem">🤖</span>';
    b.onclick = function() { AI.toggle(); };
    document.body.appendChild(b);

    // Chat widget
    const w = document.createElement('div');
    w.id = 'ai-widget';
    w.innerHTML = '<div id="ai-head">'
      + '<div style="display:flex;align-items:center;gap:.7rem">'
      + '<div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:2px solid rgba(255,255,255,.3)">🤖</div>'
      + '<div><div style="font-weight:700;font-size:.88rem;color:white">Yasmine IA</div>'
      + '<div style="font-size:.62rem;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:.3rem">'
      + '<span style="width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block"></span> Gemini AI · Online</div></div></div>'
      + '<div style="display:flex;gap:.25rem;align-items:center">'
      + '<button onclick="AI.setLang(\'ar\')" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:.58rem;padding:.18rem .45rem;border-radius:4px;cursor:none;font-family:inherit">AR</button>'
      + '<button onclick="AI.setLang(\'fr\')" style="background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.5);color:white;font-size:.58rem;padding:.18rem .45rem;border-radius:4px;font-weight:700;cursor:none;font-family:inherit">FR</button>'
      + '<button onclick="AI.setLang(\'en\')" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:.58rem;padding:.18rem .45rem;border-radius:4px;cursor:none;font-family:inherit">EN</button>'
      + '<button onclick="AI.toggle()" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:white;width:24px;height:24px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.8rem;margin-left:.15rem;cursor:none">✕</button>'
      + '</div></div>'
      + '<div id="ai-msgs">'
      + '<div class="ai-b"><div class="ai-bubble-msg">Bonjour! Je suis <strong>Yasmine</strong> 🤖 Assistante IA Shopping.TN!<br><br>'
      + '<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem">'
      + '<span class="ai-q" onclick="AI.quickSend(\'produits\')">🛋 Produits</span>'
      + '<span class="ai-q" onclick="AI.quickSend(\'commande\')">📦 Suivi</span>'
      + '<span class="ai-q" onclick="AI.quickSend(\'promo\')">🎁 Promos</span>'
      + '<span class="ai-q" onclick="AI.quickSend(\'livraison\')">🛵 Livraison</span>'
      + '<span class="ai-q" onclick="AI.quickSend(\'artisans\')">🧑‍🎨 Artisans</span>'
      + '<span class="ai-q" onclick="AI.quickSend(\'مرحبا\')">🇹🇳 عربي</span>'
      + '<span class="ai-q" onclick="AI.quickSend(\'hello\')">🌍 English</span>'
      + '</div></div></div></div>'
      + '<div id="ai-inp-area">'
      + '<input type="text" id="ai-inp" placeholder="Écrivez votre message..." onkeydown="if(event.key===\'Enter\')AI.send()"/>'
      + '<button onclick="AI.send()" id="ai-send">➤</button>'
      + '</div>';
    document.body.appendChild(w);

    // Styles
    const s = document.createElement('style');
    s.textContent = '#ai-bubble{position:fixed;bottom:5.5rem;right:2rem;z-index:6100;width:52px;height:52px;background:linear-gradient(135deg,#4a1fa8,#6b3fd4);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(74,31,168,.4);border:2px solid white;cursor:none;transition:transform .2s}'
      + '#ai-bubble:hover{transform:scale(1.1)}'
      + '#ai-widget{display:none;position:fixed;bottom:5.5rem;right:2rem;z-index:6200;width:340px;background:white;border:1px solid #e8e4ff;border-radius:22px;box-shadow:0 24px 60px rgba(74,31,168,.2);overflow:hidden;flex-direction:column}'
      + '#ai-head{background:linear-gradient(135deg,#4a1fa8,#6b3fd4);padding:.9rem 1.1rem;display:flex;align-items:center;justify-content:space-between}'
      + '#ai-msgs{height:255px;overflow-y:auto;padding:.9rem;display:flex;flex-direction:column;gap:.6rem;background:#f8f7ff}'
      + '#ai-msgs::-webkit-scrollbar{width:3px}'
      + '#ai-msgs::-webkit-scrollbar-thumb{background:#9b72f0;border-radius:2px}'
      + '.ai-b{max-width:88%;align-self:flex-start}'
      + '.ai-u{max-width:88%;align-self:flex-end}'
      + '.ai-bubble-msg{padding:.65rem .9rem;border-radius:4px 12px 12px 12px;font-size:.8rem;line-height:1.6;background:white;border:1px solid #e8e4ff;color:#1a1035;box-shadow:0 2px 8px rgba(74,31,168,.07)}'
      + '.ai-user-msg{padding:.65rem .9rem;border-radius:12px 4px 12px 12px;font-size:.8rem;line-height:1.6;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white}'
      + '.ai-q{display:inline-block;background:#ede8ff;border:1px solid rgba(124,58,237,.2);color:#7c3aed;font-size:.65rem;padding:.2rem .55rem;border-radius:20px;cursor:none;transition:background .15s}'
      + '.ai-q:hover{background:#e0d8ff}'
      + '#ai-inp-area{display:flex;border-top:1px solid #e8e4ff;background:white}'
      + '#ai-inp{flex:1;background:none;border:none;padding:.85rem 1rem;font-size:.82rem;color:#1a1035;outline:none;font-family:inherit}'
      + '#ai-inp::placeholder{color:#b0a8d4}'
      + '#ai-send{background:#7c3aed;color:white;border:none;padding:0 1rem;font-size:.95rem;cursor:none}'
      + '#ai-send:hover{background:#6d28d9}';
    document.head.appendChild(s);

    // Tip bubble
    setTimeout(function() {
      if (!AI.open) {
        const tip = document.createElement('div');
        tip.style.cssText = 'position:fixed;bottom:7rem;right:5.5rem;z-index:6100;background:white;border:1px solid #e8e4ff;border-radius:12px;padding:.75rem 1rem;font-size:.76rem;color:#1a1035;box-shadow:0 4px 20px rgba(74,31,168,.15);max-width:190px;cursor:none';
        tip.innerHTML = '<strong>Yasmine IA</strong> 👋<br><small>Arabe · Français · English</small>';
        tip.onclick = function() { AI.toggle(); };
        document.body.appendChild(tip);
        setTimeout(function() { if(tip.parentNode) tip.parentNode.removeChild(tip); }, 5000);
      }
    }, 4000);
  },

  toggle() {
    this.open = !this.open;
    const w = document.getElementById('ai-widget');
    if (w) w.style.display = this.open ? 'flex' : 'none';
    if (this.open) {
      setTimeout(function() {
        const i = document.getElementById('ai-inp');
        if (i) i.focus();
      }, 150);
    }
  },

  setLang(lang) {
    this.lang = lang;
    const ph = { ar: '...اكتب رسالتك', fr: 'Écrivez votre message...', en: 'Type your message...' };
    const inp = document.getElementById('ai-inp');
    if (inp) { inp.placeholder = ph[lang]; inp.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
    const greet = {
      ar: 'أهلاً! أنا ياسمين 🤖 كيف يمكنني مساعدتك؟',
      fr: 'Bonjour! Je suis Yasmine 🤖 Comment puis-je vous aider?',
      en: "Hello! I'm Yasmine 🤖 How can I help you today?"
    };
    AI.addMsg(greet[lang], 'bot');
  },

  quickSend(t) {
    const i = document.getElementById('ai-inp');
    if (i) i.value = t;
    AI.send();
  },

  send() {
    const inp = document.getElementById('ai-inp');
    const txt = inp ? inp.value.trim() : '';
    if (!txt || AI.typing) return;
    inp.value = '';
    AI.addMsg(txt, 'user');
    AI.typing = true;

    // Typing dots
    const msgs = document.getElementById('ai-msgs');
    const dots = document.createElement('div');
    dots.id = 'ai-dots-el';
    dots.className = 'ai-b';
    dots.innerHTML = '<div class="ai-bubble-msg" style="color:#9b72f0;letter-spacing:.3em">● ● ●</div>';
    if (msgs) { msgs.appendChild(dots); msgs.scrollTop = msgs.scrollHeight; }

    // Use Gemini if key set, else offline
    if (GEMINI_KEY && GEMINI_KEY !== "PUT_YOUR_KEY_HERE") {
      AI.callGemini(txt, function(reply) {
        const d = document.getElementById('ai-dots-el');
        if (d) d.parentNode.removeChild(d);
        AI.typing = false;
        AI.addMsg(reply, 'bot');
        AI.navigate(txt);
      });
    } else {
      setTimeout(function() {
        const d = document.getElementById('ai-dots-el');
        if (d) d.parentNode.removeChild(d);
        AI.typing = false;
        AI.addMsg(AI.offline(txt), 'bot');
        AI.navigate(txt);
      }, 600);
    }
  },

  navigate(txt) {
    const m = txt.toLowerCase();
    if (m.includes('produit')||m.includes('product')||m.includes('collection')||m.includes('منتج')) setTimeout(function(){showPage('products');}, 900);
    if (m.includes('track')||m.includes('suivre')||m.includes('commande')||m.includes('تتبع')) setTimeout(function(){showPage('track');}, 900);
    if (m.includes('mesure')||m.includes('custom')||m.includes('مقاس')) setTimeout(function(){showPage('carpenter');}, 900);
    if (m.includes('reward')||m.includes('fidél')||m.includes('point')||m.includes('نقاط')) setTimeout(function(){showPage('loyalty');}, 900);
  },

  addMsg(text, type) {
    const msgs = document.getElementById('ai-msgs');
    if (!msgs) return;
    const d = document.createElement('div');
    d.className = type === 'bot' ? 'ai-b' : 'ai-u';
    const b = document.createElement('div');
    b.className = type === 'bot' ? 'ai-bubble-msg' : 'ai-user-msg';
    b.innerHTML = text;
    d.appendChild(b);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
};

document.addEventListener('DOMContentLoaded', function() { AI.init(); });

function homeSearchTag(tag) {
  const el = document.getElementById('home-search');
  if (el) el.value = tag;
  showPage('products');
  setTimeout(function() {
    const input = document.getElementById('prod-search');
    if (input) { input.value = tag; searchProducts(); }
  }, 200);
}

function filterAndGo(cat) {
  showPage('products');
  setTimeout(function() {
    document.querySelectorAll('#page-products .filter-btn').forEach(function(b) { b.classList.remove('active'); });
    const btn = document.querySelector('#page-products .filter-btn[onclick*="' + cat + '"]');
    if (btn) { btn.classList.add('active'); filterProducts(cat, btn); }
    else filterProducts(cat, null);
  }, 100);
}

// ═══════════════════════════════════════════════
// LANGUAGE SWITCHER — AR / FR / EN
// ═══════════════════════════════════════════════
const TRANSLATIONS = {
  fr: {
    // NAV
    'nav-home': 'Accueil',
    'nav-products': 'Collections',
    'nav-carpenter': 'Sur Mesure',
    'nav-track': 'Suivi',
    'nav-loyalty': 'Récompenses',
    'nav-about': 'À Propos',
    // HERO
    'hero-badge': "Marketplace Artisanale #1 de Tunisie",
    'hero-sub': "Des maîtres artisans de Monastir aux tisserands de Ksar Hellal — découvrez l'artisanat tunisien exceptionnel livré à votre porte.",
    'hero-search-placeholder': 'Rechercher produits, artisans, régions…',
    'hero-search-btn': 'Rechercher',
    'hero-stat-1': 'Produits',
    'hero-stat-2': 'Régions',
    'hero-stat-3': 'Satisfaction',
    'hero-stat-4': 'Livraison Max',
    // SECTIONS
    'cat-title': 'Nos Collections',
    'featured-title': 'Produits Tendance',
    'signin-btn': 'Connexion',
    // SEARCH
    'prod-search-placeholder': 'Rechercher produits, marques, régions…',
    // TRACK
    'track-placeholder': 'Entrez votre numéro de commande ex: SHP-2026-0042',
    'track-btn': 'Suivre',
    // FLASH
    'flash-title': "Jusqu'à 40% de RÉDUCTION — Aujourd'hui Seulement!",
    'flash-btn': 'Acheter Maintenant →',
    // PROMO
    'promo-text': 'Codes Promo Exclusifs — Utilisez lors du paiement!',
    'promo-btn': 'Appliquer',
    // FOOTER
    'footer-copy': '© 2025–2026 Shopping.TN — Tous droits réservés.'
  },
  ar: {
    'nav-home': 'الرئيسية',
    'nav-products': 'المجموعات',
    'nav-carpenter': 'حسب الطلب',
    'nav-track': 'تتبع',
    'nav-loyalty': 'المكافآت',
    'nav-about': 'من نحن',
    'hero-badge': 'أول سوق حرفي ذكي في تونس',
    'hero-sub': 'من حرفيي المنستير إلى نساجي قصر هلال — اكتشف الحرف التونسية الاستثنائية تُوصَّل إلى بابك.',
    'hero-search-placeholder': 'ابحث عن منتجات، حرفيين، مناطق…',
    'hero-search-btn': 'بحث',
    'hero-stat-1': 'منتج',
    'hero-stat-2': 'مناطق',
    'hero-stat-3': 'رضا العملاء',
    'hero-stat-4': 'أقصى توصيل',
    'cat-title': 'مجموعاتنا',
    'featured-title': 'منتجات رائجة',
    'signin-btn': 'تسجيل الدخول',
    'prod-search-placeholder': 'ابحث عن منتجات، علامات، مناطق…',
    'track-placeholder': 'أدخل رقم طلبك مثال: SHP-2026-0042',
    'track-btn': 'تتبع',
    'flash-title': 'خصم يصل إلى 40% — اليوم فقط!',
    'flash-btn': 'تسوق الآن ←',
    'promo-text': 'رموز خصم حصرية — استخدمها عند الدفع!',
    'promo-btn': 'تطبيق',
    'footer-copy': '© 2025–2026 Shopping.TN — جميع الحقوق محفوظة.'
  },
  en: {
    'nav-home': 'Home',
    'nav-products': 'Collections',
    'nav-carpenter': 'Sur Mesure',
    'nav-track': 'Track',
    'nav-loyalty': 'Rewards',
    'nav-about': 'About',
    'hero-badge': "Tunisia's #1 Artisan Marketplace",
    'hero-sub': "From Monastir's master craftsmen to Ksar Hellal's finest weavers — discover exceptional Tunisian artisanship delivered to your door.",
    'hero-search-placeholder': 'Search products, artisans, regions…',
    'hero-search-btn': 'Search',
    'hero-stat-1': 'Products',
    'hero-stat-2': 'Regions',
    'hero-stat-3': 'Satisfaction',
    'hero-stat-4': 'Max Delivery',
    'cat-title': 'Our Collections',
    'featured-title': 'Trending Products',
    'signin-btn': 'Sign In',
    'prod-search-placeholder': 'Search products, brands, regions…',
    'track-placeholder': 'Enter order ID e.g. SHP-2026-0042',
    'track-btn': 'Track',
    'flash-title': 'Up to 40% OFF — Today Only!',
    'flash-btn': 'Shop Now →',
    'promo-text': 'Exclusive Promo Codes — Use at Checkout!',
    'promo-btn': 'Apply in Cart',
    'footer-copy': '© 2025–2026 Shopping.TN — All rights reserved.'
  }
};

function setLang(lang) {
  // Update button styles
  ['ar','fr','en'].forEach(function(l) {
    const btn = document.getElementById('lang-' + l);
    if (btn) {
      btn.classList.toggle('active', l === lang);
    }
  });

  // RTL for Arabic
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  const T = TRANSLATIONS[lang];
  if (!T) return;

  // Nav buttons
  const navMap = {
    'navbtn-home': T['nav-home'],
    'navbtn-products': T['nav-products'],
    'navbtn-carpenter': T['nav-carpenter'],
    'navbtn-track': T['nav-track'],
    'navbtn-loyalty': T['nav-loyalty'],
    'navbtn-about': T['nav-about']
  };
  Object.keys(navMap).forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = navMap[id];
  });

  // Search inputs placeholders
  const homeSearch = document.getElementById('home-search');
  if (homeSearch) homeSearch.placeholder = T['hero-search-placeholder'];
  const prodSearch = document.getElementById('prod-search');
  if (prodSearch) prodSearch.placeholder = T['prod-search-placeholder'];
  const trackNum = document.getElementById('track-num');
  if (trackNum) trackNum.placeholder = T['track-placeholder'];

  // All elements with data-lang attribute
  document.querySelectorAll('[data-lang]').forEach(function(el) {
    const key = el.getAttribute('data-lang');
    if (T[key]) el.textContent = T[key];
  });

  // Also update Yasmine AI language
  if (typeof AI !== 'undefined') AI.setLang(lang);

  // Show toast
  const flags = { ar: '🇹🇳 عربي', fr: '🇫🇷 Français', en: '🌍 English' };
  if (typeof toast === 'function') toast(flags[lang], 'default');
}
