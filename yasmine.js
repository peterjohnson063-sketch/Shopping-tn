// ═══════════════════════════════════════════════
// YASMINE — AI Assistant for Shopping.TN
// ═══════════════════════════════════════════════

const GEMINI_KEY = "gen-lang-client-0424037557";

const AI = {
  open: false,
  typing: false,
  retries: 0,

  SYSTEM: "You are Yasmine, a smart and friendly AI assistant for Shopping.TN — Tunisia's #1 artisan marketplace. You can answer ANY question the user asks — general knowledge, advice, recommendations, anything! BUT always bring the conversation back to Shopping.TN naturally when relevant. Reply in the SAME language as the user (Arabic, French, or English). Be warm, helpful and conversational. You know everything about Shopping.TN: products (furniture, lighting, ceramics, rugs), artisans (Ahmed Maalej Ksar Hellal, Mohamed Trabelsi Monastir, Fatma Ben Nasr Nabeul), promo codes (SAHEL20=20%, WELCOME50=50TND, VIP100=100TND, MONASTIR15=15%), delivery (free over 500TND, 48h Sahel), Sur Mesure custom furniture 4-6 weeks, loyalty program 1TND=1point up to 18% cashback. Use emojis. Be natural and human!",

  callGemini: function(msg, callback) {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY;
    var body = JSON.stringify({
      system_instruction: { parts: [{ text: AI.SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: msg }] }],
      generationConfig: { maxOutputTokens: 150, temperature: 0.7 }
    });
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 10000;
    xhr.ontimeout = function() { callback(AI.offline(msg)); };
    xhr.onerror = function() { callback(AI.offline(msg)); };
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            var text = data.candidates[0].content.parts[0].text;
            callback(text);
          } catch(e) { callback(AI.offline(msg)); }
        } else { callback(AI.offline(msg)); }
      }
    };
    try { xhr.send(body); } catch(e) { callback(AI.offline(msg)); }
  },

  offline: function(msg) {
    var m = msg.toLowerCase();
    var isAr = /[\u0600-\u06FF]/.test(msg);
    var isEn = ['hello','hi','what','how','product','order','track','delivery','price','buy','help','chair','table','sofa','furniture'].some(function(w){return m.includes(w);});
    var lang = isAr ? 'ar' : isEn ? 'en' : 'fr';
    var R = {
      fr: {
        p: "Nous avons 12,000+ produits tunisiens! Meubles en chêne, luminaires, céramiques, tapis Kilim 🛋",
        o: "Entrez SHP-2026-XXXX sur la page Suivi pour un tracking GPS en temps réel 📦",
        l: "Livraison gratuite au-dessus de 500 TND! Maximum 48h dans le Sahel 🛵",
        pr: "Codes promo: SAHEL20 (20%), WELCOME50 (50 TND), MONASTIR15 (15%), VIP100 (100 TND) 🎁",
        a: "Ahmed Maalej (Ksar Hellal ⭐⭐⭐⭐⭐), Mohamed Trabelsi (Monastir ⭐⭐⭐⭐⭐), Fatma Ben Nasr (Nabeul ⭐⭐⭐⭐⭐) 🧑‍🎨",
        sm: "Sur Mesure: dimensions exactes, rendu 3D gratuit, garantie 10 ans, 4-6 semaines 🪵",
        d: "Bonjour! Je suis Yasmine 🤖 Comment puis-je vous aider avec Shopping.TN?"
      },
      ar: {
        p: "لدينا أكثر من 12,000 منتج تونسي! أثاث، إضاءة، فخار، سجاد 🛋",
        o: "أدخل SHP-2026-XXXX في صفحة التتبع لمتابعة طلبك بـ GPS 📦",
        l: "شحن مجاني فوق 500 دينار! أقصى مدة 48 ساعة في الساحل 🛵",
        pr: "رموز الخصم: SAHEL20 (20%)، WELCOME50 (50 دينار)، VIP100 (100 دينار) 🎁",
        a: "أحمد معالج (قصر هلال ⭐⭐⭐⭐⭐)، محمد الطرابلسي (المنستير ⭐⭐⭐⭐⭐) 🧑‍🎨",
        sm: "حسب الطلب: أبعاد دقيقة، نموذج 3D مجاني، ضمان 10 سنوات 🪵",
        d: "أهلاً! أنا ياسمين 🤖 كيف يمكنني مساعدتك في Shopping.TN؟"
      },
      en: {
        p: "We have 12,000+ Tunisian products! Oak furniture, lighting, ceramics, Kilim rugs 🛋",
        o: "Enter SHP-2026-XXXX on the Track page for live GPS tracking 📦",
        l: "Free delivery over 500 TND! Max 48h in Sahel region 🛵",
        pr: "Promo codes: SAHEL20 (20%), WELCOME50 (50 TND), MONASTIR15 (15%), VIP100 (100 TND) 🎁",
        a: "Ahmed Maalej (Ksar Hellal ⭐⭐⭐⭐⭐), Mohamed Trabelsi (Monastir ⭐⭐⭐⭐⭐) 🧑‍🎨",
        sm: "Sur Mesure: custom dimensions, free 3D render, 10yr warranty, 4-6 weeks 🪵",
        d: "Hello! I'm Yasmine 🤖 How can I help you with Shopping.TN?"
      }
    };
    var r = R[lang] || R.fr;
    if (m.includes('produit')||m.includes('product')||m.includes('collection')||m.includes('منتج')||m.includes('meuble')||m.includes('furniture')) return r.p;
    if (m.includes('commande')||m.includes('order')||m.includes('track')||m.includes('suivre')||m.includes('طلب')) return r.o;
    if (m.includes('livraison')||m.includes('delivery')||m.includes('ship')||m.includes('توصيل')) return r.l;
    if (m.includes('promo')||m.includes('code')||m.includes('discount')||m.includes('خصم')||m.includes('réduction')) return r.pr;
    if (m.includes('artisan')||m.includes('monastir')||m.includes('ksar')||m.includes('حرفي')||m.includes('ahmed')) return r.a;
    if (m.includes('mesure')||m.includes('custom')||m.includes('مقاس')||m.includes('bois')||m.includes('chêne')) return r.sm;
    return r.d;
  },

  init: function() {
    if (document.getElementById('ai-bubble')) return; // already init

    // Bubble
    var b = document.createElement('div');
    b.id = 'ai-bubble';
    b.innerHTML = '<span style="font-size:1.3rem">🤖</span>';
    b.onclick = function() { AI.toggle(); };
    document.body.appendChild(b);

    // Widget
    var w = document.createElement('div');
    w.id = 'ai-widget';
    w.innerHTML =
      '<div id="ai-head">' +
        '<div style="display:flex;align-items:center;gap:.7rem">' +
          '<div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:2px solid rgba(255,255,255,.3)">🤖</div>' +
          '<div>' +
            '<div style="font-weight:700;font-size:.88rem;color:white">Yasmine IA</div>' +
            '<div style="font-size:.62rem;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:.3rem">' +
              '<span style="width:6px;height:6px;background:#4ade80;border-radius:50%;display:inline-block"></span> Shopping.TN · Online' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:.25rem;align-items:center">' +
          '<button onclick="AI.setLang(\'ar\')" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:.58rem;padding:.18rem .45rem;border-radius:4px;cursor:pointer;font-family:inherit">AR</button>' +
          '<button onclick="AI.setLang(\'fr\')" style="background:rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.5);color:white;font-size:.58rem;padding:.18rem .45rem;border-radius:4px;font-weight:700;cursor:pointer;font-family:inherit">FR</button>' +
          '<button onclick="AI.setLang(\'en\')" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:.58rem;padding:.18rem .45rem;border-radius:4px;cursor:pointer;font-family:inherit">EN</button>' +
          '<button onclick="AI.toggle()" style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);color:white;width:24px;height:24px;border-radius:4px;font-size:.8rem;margin-left:.15rem;cursor:pointer">✕</button>' +
        '</div>' +
      '</div>' +
      '<div id="ai-msgs">' +
        '<div class="ai-b"><div class="ai-bubble-msg">Bonjour! Je suis <strong>Yasmine</strong> 🤖 Assistante IA Shopping.TN!<br><br>' +
          '<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem">' +
            '<span class="ai-q" onclick="AI.quickSend(\'produits\')">🛋 Produits</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'commande\')">📦 Suivi</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'promo\')">🎁 Promos</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'livraison\')">🛵 Livraison</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'artisans\')">🧑‍🎨 Artisans</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'مرحبا\')">🇹🇳 عربي</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'hello\')">🌍 English</span>' +
          '</div>' +
        '</div></div>' +
      '</div>' +
      '<div id="ai-inp-area">' +
        '<input type="text" id="ai-inp" placeholder="Écrivez votre message..." onkeydown="if(event.key===\'Enter\')AI.send()"/>' +
        '<button onclick="AI.send()" id="ai-send">➤</button>' +
      '</div>';
    document.body.appendChild(w);

    // Styles
    var s = document.createElement('style');
    s.textContent =
      '#ai-bubble{position:fixed;bottom:5.5rem;right:2rem;z-index:6100;width:52px;height:52px;background:linear-gradient(135deg,#4a1fa8,#6b3fd4);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(74,31,168,.4);border:2px solid white;cursor:pointer;transition:transform .2s}' +
      '#ai-bubble:hover{transform:scale(1.1)}' +
      '#ai-widget{display:none;position:fixed;bottom:5.5rem;right:2rem;z-index:6200;width:340px;background:white;border:1px solid #e8e4ff;border-radius:22px;box-shadow:0 24px 60px rgba(74,31,168,.2);overflow:hidden;flex-direction:column}' +
      '#ai-head{background:linear-gradient(135deg,#4a1fa8,#6b3fd4);padding:.9rem 1.1rem;display:flex;align-items:center;justify-content:space-between}' +
      '#ai-msgs{height:255px;overflow-y:auto;padding:.9rem;display:flex;flex-direction:column;gap:.6rem;background:#f8f7ff}' +
      '#ai-msgs::-webkit-scrollbar{width:3px}' +
      '#ai-msgs::-webkit-scrollbar-thumb{background:#9b72f0;border-radius:2px}' +
      '.ai-b{max-width:88%;align-self:flex-start}' +
      '.ai-u{max-width:88%;align-self:flex-end}' +
      '.ai-bubble-msg{padding:.65rem .9rem;border-radius:4px 12px 12px 12px;font-size:.8rem;line-height:1.6;background:white;border:1px solid #e8e4ff;color:#1a1035;box-shadow:0 2px 8px rgba(74,31,168,.07)}' +
      '.ai-user-msg{padding:.65rem .9rem;border-radius:12px 4px 12px 12px;font-size:.8rem;line-height:1.6;background:linear-gradient(135deg,#7c3aed,#6b3fd4);color:white}' +
      '.ai-q{display:inline-block;background:#ede8ff;border:1px solid rgba(124,58,237,.2);color:#7c3aed;font-size:.65rem;padding:.2rem .55rem;border-radius:20px;cursor:pointer;transition:background .15s}' +
      '.ai-q:hover{background:#e0d8ff}' +
      '#ai-inp-area{display:flex;border-top:1px solid #e8e4ff;background:white}' +
      '#ai-inp{flex:1;background:none;border:none;padding:.85rem 1rem;font-size:.82rem;color:#1a1035;outline:none;font-family:inherit}' +
      '#ai-inp::placeholder{color:#b0a8d4}' +
      '#ai-send{background:#7c3aed;color:white;border:none;padding:0 1rem;font-size:.95rem;cursor:pointer}' +
      '#ai-send:hover{background:#6d28d9}';
    document.head.appendChild(s);

    // Tip bubble after 4s
    setTimeout(function() {
      if (!AI.open) {
        var tip = document.createElement('div');
        tip.style.cssText = 'position:fixed;bottom:7rem;right:5.5rem;z-index:6100;background:white;border:1px solid #e8e4ff;border-radius:12px;padding:.75rem 1rem;font-size:.76rem;color:#1a1035;box-shadow:0 4px 20px rgba(74,31,168,.15);max-width:190px;cursor:pointer';
        tip.innerHTML = '<strong>Yasmine IA</strong> 👋<br><small>Arabe · Français · English</small>';
        tip.onclick = function() { AI.toggle(); };
        document.body.appendChild(tip);
        setTimeout(function() { if(tip.parentNode) tip.parentNode.removeChild(tip); }, 5000);
      }
    }, 4000);
  },

  toggle: function() {
    this.open = !this.open;
    var w = document.getElementById('ai-widget');
    if (w) w.style.display = this.open ? 'flex' : 'none';
    if (this.open) {
      setTimeout(function() {
        var i = document.getElementById('ai-inp');
        if (i) i.focus();
      }, 150);
    }
  },

  setLang: function(lang) {
    var ph = { ar: '...اكتب رسالتك', fr: 'Écrivez votre message...', en: 'Type your message...' };
    var inp = document.getElementById('ai-inp');
    if (inp) { inp.placeholder = ph[lang]; inp.dir = lang === 'ar' ? 'rtl' : 'ltr'; }
    var greet = {
      ar: 'أهلاً! أنا ياسمين 🤖 كيف يمكنني مساعدتك في Shopping.TN؟',
      fr: 'Bonjour! Je suis Yasmine 🤖 Comment puis-je vous aider?',
      en: "Hello! I'm Yasmine 🤖 How can I help you with Shopping.TN?"
    };
    AI.addMsg(greet[lang] || greet.fr, 'bot');
  },

  quickSend: function(t) {
    var i = document.getElementById('ai-inp');
    if (i) i.value = t;
    AI.send();
  },

  send: function() {
    var inp = document.getElementById('ai-inp');
    var txt = inp ? inp.value.trim() : '';
    if (!txt || AI.typing) return;
    inp.value = '';
    AI.addMsg(txt, 'user');
    AI.typing = true;

    var msgs = document.getElementById('ai-msgs');
    var dots = document.createElement('div');
    dots.id = 'ai-dots-el';
    dots.className = 'ai-b';
    dots.innerHTML = '<div class="ai-bubble-msg" style="color:#9b72f0;letter-spacing:.3em">● ● ●</div>';
    if (msgs) { msgs.appendChild(dots); msgs.scrollTop = msgs.scrollHeight; }

    var removeDots = function() {
      var d = document.getElementById('ai-dots-el');
      if (d && d.parentNode) d.parentNode.removeChild(d);
    };

    if (GEMINI_KEY && GEMINI_KEY !== "PUT_YOUR_KEY_HERE") {
      AI.callGemini(txt, function(reply) {
        removeDots();
        AI.typing = false;
        AI.addMsg(reply, 'bot');
        AI.navigate(txt);
      });
    } else {
      setTimeout(function() {
        removeDots();
        AI.typing = false;
        AI.addMsg(AI.offline(txt), 'bot');
        AI.navigate(txt);
      }, 600);
    }
  },

  navigate: function(txt) {
    var m = txt.toLowerCase();
    if (m.includes('produit')||m.includes('product')||m.includes('collection')||m.includes('منتج')) setTimeout(function(){if(typeof showPage==='function')showPage('products');}, 900);
    if (m.includes('track')||m.includes('suivre')||m.includes('commande')||m.includes('تتبع')) setTimeout(function(){if(typeof showPage==='function')showPage('track');}, 900);
    if (m.includes('mesure')||m.includes('custom')||m.includes('مقاس')||m.includes('chêne')) setTimeout(function(){if(typeof showPage==='function')showPage('carpenter');}, 900);
    if (m.includes('reward')||m.includes('fidél')||m.includes('point')||m.includes('نقاط')) setTimeout(function(){if(typeof showPage==='function')showPage('loyalty');}, 900);
  },

  addMsg: function(text, type) {
    var msgs = document.getElementById('ai-msgs');
    if (!msgs) return;
    var d = document.createElement('div');
    d.className = type === 'bot' ? 'ai-b' : 'ai-u';
    var b = document.createElement('div');
    b.className = type === 'bot' ? 'ai-bubble-msg' : 'ai-user-msg';
    b.innerHTML = text;
    d.appendChild(b);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
};

// Init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { AI.init(); });
} else {
  AI.init();
}

// Language switcher
var TRANSLATIONS = {
  fr: { 'nav-home':'Accueil','nav-products':'Collections','nav-carpenter':'Sur Mesure','nav-track':'Suivi','nav-loyalty':'Récompenses','nav-about':'À Propos','signin-btn':'Connexion' },
  ar: { 'nav-home':'الرئيسية','nav-products':'المجموعات','nav-carpenter':'حسب الطلب','nav-track':'تتبع','nav-loyalty':'المكافآت','nav-about':'من نحن','signin-btn':'تسجيل الدخول' },
  en: { 'nav-home':'Home','nav-products':'Collections','nav-carpenter':'Sur Mesure','nav-track':'Track','nav-loyalty':'Rewards','nav-about':'About','signin-btn':'Sign In' }
};

function setLang(lang) {
  ['ar','fr','en'].forEach(function(l) {
    var btn = document.getElementById('lang-'+l);
    if (btn) btn.classList.toggle('active', l===lang);
  });
  document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  var T = TRANSLATIONS[lang];
  if (!T) return;
  document.querySelectorAll('[data-lang]').forEach(function(el) {
    var key = el.getAttribute('data-lang');
    if (T[key]) el.textContent = T[key];
  });
  var homeSearch = document.getElementById('home-search');
  if (homeSearch) homeSearch.placeholder = lang==='ar'?'ابحث عن منتجات...':lang==='en'?'Search products...':'Rechercher produits...';
  if (typeof AI !== 'undefined') AI.setLang(lang);
  if (typeof toast === 'function') { var flags={ar:'🇹🇳 عربي',fr:'🇫🇷 Français',en:'🌍 English'}; toast(flags[lang],'default'); }
}

// AUTO-RECONNECT when user comes back to page
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && typeof AI !== 'undefined') {
    var dot = document.querySelector('#ai-head .ai-status-dot');
    if (dot) dot.style.background = '#4ade80';
  }
});

// Keep Yasmine alive - reinit if bubble disappears
setInterval(function() {
  if (!document.getElementById('ai-bubble') && typeof AI !== 'undefined') {
    AI.init();
  }
}, 3000);
