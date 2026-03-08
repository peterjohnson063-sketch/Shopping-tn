// ═══════════════════════════════════════════════
// YASMINE — Super Smart AI for Shopping.TN
// ═══════════════════════════════════════════════

const GEMINI_KEY = "PUT_YOUR_KEY_HERE";

const AI = {
  open: false,
  typing: false,
  history: [],

  SYSTEM: `You are Yasmine, a super smart and warm AI shopping assistant for Shopping.TN — Tunisia's #1 artisan marketplace. 

Your job is to HELP customers make the best decisions — recommend products, compare options, give interior design advice, answer any question they have!

ALWAYS reply in the SAME language the user writes (Arabic/French/English).
Be conversational, warm, helpful like a best friend who knows everything about home decor and furniture.
Use emojis naturally. Keep answers under 4 sentences but make them USEFUL and SPECIFIC.

Shopping.TN knowledge:
- Products: oak furniture (Sur Mesure), Moroccan lighting, Nabeul ceramics, Kilim rugs, chandeliers, mirrors, sofas, beds
- Artisans: Ahmed Maalej (Ksar Hellal, oak furniture ⭐⭐⭐⭐⭐), Mohamed Trabelsi (Monastir, bedroom sets), Fatma Ben Nasr (Nabeul, ceramics), Karim Sfaxsi (Sfax, metal+wood)
- Promo codes: SAHEL20=20% off, WELCOME50=50TND off, VIP100=100TND off, MONASTIR15=15% off
- Delivery: FREE over 500TND, 48h in Sahel region, 3-5 days elsewhere
- Sur Mesure: custom oak furniture, customer picks dimensions+color, carpenter builds in 4-6 weeks, 10yr warranty
- Loyalty: 1TND spent = 1 point, Bronze 5% cashback → Platinum 18% cashback
- Prices: chairs from 850TND, dining tables 2800-5000TND, sofas 3200TND+, wardrobes 4500TND+

When someone asks about lighting, furniture, decor — give REAL specific advice and recommend actual products from Shopping.TN!`,

  callGemini: function(msg, callback) {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY;
    
    // Build conversation history
    var contents = [];
    AI.history.forEach(function(h) {
      contents.push({ role: h.role, parts: [{ text: h.text }] });
    });
    contents.push({ role: "user", parts: [{ text: msg }] });

    var body = JSON.stringify({
      system_instruction: { parts: [{ text: AI.SYSTEM }] },
      contents: contents,
      generationConfig: { maxOutputTokens: 250, temperature: 0.8 }
    });

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.timeout = 12000;
    xhr.ontimeout = function() { callback(AI.offline(msg)); };
    xhr.onerror = function() { callback(AI.offline(msg)); };
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            var data = JSON.parse(xhr.responseText);
            var text = data.candidates[0].content.parts[0].text;
            // Save to history
            AI.history.push({ role: "user", text: msg });
            AI.history.push({ role: "model", text: text });
            if (AI.history.length > 10) AI.history = AI.history.slice(-10);
            callback(text);
          } catch(e) { callback(AI.offline(msg)); }
        } else {
          console.log("Gemini status:", xhr.status);
          callback(AI.offline(msg));
        }
      }
    };
    try { xhr.send(body); } catch(e) { callback(AI.offline(msg)); }
  },

  offline: function(msg) {
    var m = msg.toLowerCase();
    var isAr = /[\u0600-\u06FF]/.test(msg);
    var isEn = ['hello','hi','what','how','product','order','track','delivery','price','buy','help','light','chair','table','sofa','room','decor','furniture','recommend','good','best'].some(function(w){return m.includes(w);});
    var lang = isAr ? 'ar' : isEn ? 'en' : 'fr';

    var R = {
      fr: {
        light: "Pour l'éclairage, je recommande notre Lanterne Marocaine en Laiton (849 TND) 🪔 Elle crée une ambiance chaleureuse parfaite pour un salon tunisien authentique! Aussi notre Lustre en Cristal (3,800 TND) pour les grandes pièces ✨",
        chair: "Notre Chaise en Chêne Sur Mesure commence à 850 TND 🪑 Vous pouvez choisir vos dimensions exactes et la teinte du bois! Ahmed Maalej de Ksar Hellal la fabrique à la main avec 10 ans de garantie 💪",
        table: "Pour une table à manger, notre modèle en chêne massif commence à 2,800 TND 🍽 Pour 6-8 personnes, plateau 4cm d'épaisseur. Utilisez SAHEL20 pour -20%!",
        sofa: "Notre Canapé Cadre Chêne commence à 3,200 TND 🛋 Structure en chêne massif avec accoudoirs sculptés. Durable et élégant — un investissement pour 20 ans!",
        rug: "Nos tapis Kilim Berbère commencent à 1,200 TND 🟤 Faits à la main dans le Sahel, chaque tapis est unique. Parfait pour réchauffer votre salon!",
        promo: "Codes promo actifs: SAHEL20 (-20%), WELCOME50 (-50 TND), VIP100 (-100 TND), MONASTIR15 (-15%) 🎁 Utilisez-les au panier!",
        d: "Bonjour! Je suis Yasmine 🤖 Je peux vous aider à choisir les meilleurs meubles et décorations pour votre maison! Dites-moi ce que vous cherchez 😊"
      },
      ar: {
        light: "للإضاءة، أنصحك بالفانوس المغربي النحاسي (849 دينار) 🪔 يعطي جو دافئ ورائع! أو الثريا الكريستالية (3800 دينار) للغرف الكبيرة ✨",
        chair: "كرسينا من خشب البلوط يبدأ من 850 دينار 🪑 تختار الأبعاد واللون بنفسك! أحمد معالج من قصر هلال يصنعه يدوياً بضمان 10 سنوات 💪",
        table: "طاولة السفرة من البلوط تبدأ من 2800 دينار 🍽 لـ 6-8 أشخاص، سطح سمكه 4 سم. استخدم SAHEL20 للحصول على 20% خصم!",
        sofa: "إطار كنبة البلوط يبدأ من 3200 دينار 🛋 هيكل من خشب البلوط المصمت مع مساند منحوتة. متين وأنيق!",
        rug: "سجاد كيليم البربري يبدأ من 1200 دينار 🟤 مصنوع يدوياً في الساحل، كل سجادة فريدة!",
        promo: "رموز الخصم: SAHEL20 (20-)، WELCOME50 (50 دينار-)، VIP100 (100 دينار-)، MONASTIR15 (15-) 🎁",
        d: "أهلاً! أنا ياسمين 🤖 أساعدك تختار أحسن الأثاث والديكور لبيتك! قولي شنو تحتاج 😊"
      },
      en: {
        light: "For lighting I recommend our Brass Moroccan Lantern (849 TND) 🪔 It creates a warm cozy atmosphere perfect for a living room! Or our Crystal Chandelier (3,800 TND) for larger spaces ✨",
        chair: "Our custom oak chair starts at 850 TND 🪑 You choose exact dimensions and wood color! Ahmed Maalej from Ksar Hellal handcrafts it with a 10-year warranty 💪",
        table: "Our solid oak dining table starts at 2,800 TND 🍽 Seats 6-8 people with a 4cm thick top. Use SAHEL20 for 20% off!",
        sofa: "Our Oak Sofa Frame starts at 3,200 TND 🛋 Solid oak structure with sculpted armrests. Built to last 20+ years!",
        rug: "Our Kilim Berber Rugs start at 1,200 TND 🟤 Handmade in the Sahel region, every rug is unique. Perfect to warm up your living room!",
        promo: "Active promo codes: SAHEL20 (20% off), WELCOME50 (50 TND off), VIP100 (100 TND off), MONASTIR15 (15% off) 🎁",
        d: "Hello! I'm Yasmine 🤖 I can help you pick the best furniture and decor for your home! Tell me what you're looking for 😊"
      }
    };

    var r = R[lang] || R.fr;
    if (m.includes('light')||m.includes('lamp')||m.includes('lumi')||m.includes('lantern')||m.includes('إضاء')||m.includes('lustre')) return r.light;
    if (m.includes('chair')||m.includes('chaise')||m.includes('كرسي')||m.includes('siège')) return r.chair;
    if (m.includes('table')||m.includes('طاولة')||m.includes('dining')) return r.table;
    if (m.includes('sofa')||m.includes('canapé')||m.includes('كنبة')||m.includes('couch')) return r.sofa;
    if (m.includes('rug')||m.includes('tapis')||m.includes('سجاد')||m.includes('kilim')) return r.rug;
    if (m.includes('promo')||m.includes('code')||m.includes('discount')||m.includes('خصم')) return r.promo;
    if (m.includes('produit')||m.includes('product')||m.includes('منتج')||m.includes('collection')) return lang==='en'?'We have 12,000+ Tunisian products! Oak furniture, lighting, ceramics, Kilim rugs 🛋 Browse our Collections!':lang==='ar'?'لدينا أكثر من 12,000 منتج تونسي! أثاث، إضاءة، فخار، سجاد 🛋':'Nous avons 12,000+ produits tunisiens! Meubles, luminaires, céramiques, tapis 🛋';
    if (m.includes('livraison')||m.includes('delivery')||m.includes('توصيل')) return lang==='en'?'Free delivery over 500 TND! Max 48h in Sahel region 🛵':lang==='ar'?'توصيل مجاني فوق 500 دينار! 48 ساعة في الساحل 🛵':'Livraison gratuite au-dessus de 500 TND! 48h dans le Sahel 🛵';
    return r.d;
  },

  init: function() {
    if (document.getElementById('ai-bubble')) return;

    var b = document.createElement('div');
    b.id = 'ai-bubble';
    b.innerHTML = '<span style="font-size:1.3rem">🤖</span>';
    b.onclick = function() { AI.toggle(); };
    document.body.appendChild(b);

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
        '<div class="ai-b"><div class="ai-bubble-msg">Bonjour! Je suis <strong>Yasmine</strong> 🤖 Je suis là pour vous aider à trouver les meilleurs meubles et décorations!<br><br>' +
          '<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem">' +
            '<span class="ai-q" onclick="AI.quickSend(\'Best lighting for my room?\')">💡 Éclairage</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'Recommend a dining table\')">🍽 Table</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'promo codes\')">🎁 Promos</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'livraison\')">🛵 Livraison</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'Sur Mesure furniture\')">🪵 Sur Mesure</span>' +
            '<span class="ai-q" onclick="AI.quickSend(\'مرحبا ياسمين\')">🇹🇳 عربي</span>' +
          '</div>' +
        '</div></div>' +
      '</div>' +
      '<div id="ai-inp-area">' +
        '<input type="text" id="ai-inp" placeholder="Ask me anything about furniture..." onkeydown="if(event.key===\'Enter\')AI.send()"/>' +
        '<button onclick="AI.send()" id="ai-send">➤</button>' +
      '</div>';
    document.body.appendChild(w);

    var s = document.createElement('style');
    s.textContent =
      '#ai-bubble{position:fixed;bottom:5.5rem;right:2rem;z-index:6100;width:52px;height:52px;background:linear-gradient(135deg,#4a1fa8,#6b3fd4);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(74,31,168,.4);border:2px solid white;cursor:pointer;transition:transform .2s}' +
      '#ai-bubble:hover{transform:scale(1.1)}' +
      '#ai-widget{display:none;position:fixed;bottom:5.5rem;right:2rem;z-index:6200;width:340px;background:white;border:1px solid #e8e4ff;border-radius:22px;box-shadow:0 24px 60px rgba(74,31,168,.2);overflow:hidden;flex-direction:column}' +
      '#ai-head{background:linear-gradient(135deg,#4a1fa8,#6b3fd4);padding:.9rem 1.1rem;display:flex;align-items:center;justify-content:space-between}' +
      '#ai-msgs{height:280px;overflow-y:auto;padding:.9rem;display:flex;flex-direction:column;gap:.6rem;background:#f8f7ff}' +
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

    setTimeout(function() {
      if (!AI.open) {
        var tip = document.createElement('div');
        tip.style.cssText = 'position:fixed;bottom:7rem;right:5.5rem;z-index:6100;background:white;border:1px solid #e8e4ff;border-radius:12px;padding:.75rem 1rem;font-size:.76rem;color:#1a1035;box-shadow:0 4px 20px rgba(74,31,168,.15);max-width:200px;cursor:pointer';
        tip.innerHTML = '<strong>Yasmine IA</strong> 👋<br><small>Ask me anything about furniture & decor!</small>';
        tip.onclick = function() { AI.toggle(); };
        document.body.appendChild(tip);
        setTimeout(function() { if(tip.parentNode) tip.parentNode.removeChild(tip); }, 6000);
      }
    }, 3000);
  },

  toggle: function() {
    this.open = !this.open;
    var w = document.getElementById('ai-widget');
    if (w) w.style.display = this.open ? 'flex' : 'none';
    if (this.open) setTimeout(function() { var i=document.getElementById('ai-inp'); if(i)i.focus(); }, 150);
  },

  setLang: function(lang) {
    var ph = { ar:'...اكتب سؤالك', fr:'Posez votre question...', en:'Ask me anything...' };
    var inp = document.getElementById('ai-inp');
    if (inp) { inp.placeholder = ph[lang]||ph.fr; inp.dir = lang==='ar'?'rtl':'ltr'; }
    var greet = {
      ar: 'أهلاً! أنا ياسمين 🤖 اسألني عن أي أثاث أو ديكور وسأنصحك بأحسن خيار!',
      fr: 'Bonjour! Je suis Yasmine 🤖 Posez-moi n\'importe quelle question sur les meubles et la déco!',
      en: "Hello! I'm Yasmine 🤖 Ask me anything about furniture and home decor!"
    };
    AI.addMsg(greet[lang]||greet.fr, 'bot');
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

    var removeDots = function() { var d=document.getElementById('ai-dots-el'); if(d&&d.parentNode)d.parentNode.removeChild(d); };

    if (GEMINI_KEY && GEMINI_KEY !== "PUT_YOUR_KEY_HERE") {
      AI.callGemini(txt, function(reply) {
        removeDots(); AI.typing = false; AI.addMsg(reply, 'bot'); AI.navigate(txt);
      });
    } else {
      setTimeout(function() {
        removeDots(); AI.typing = false; AI.addMsg(AI.offline(txt), 'bot'); AI.navigate(txt);
      }, 600);
    }
  },

  navigate: function(txt) {
    var m = txt.toLowerCase();
    if (m.includes('produit')||m.includes('product')||m.includes('collection')||m.includes('منتج')) setTimeout(function(){if(typeof showPage==='function')showPage('products');},1200);
    if (m.includes('track')||m.includes('suivre')||m.includes('commande')||m.includes('تتبع')) setTimeout(function(){if(typeof showPage==='function')showPage('track');},1200);
    if (m.includes('mesure')||m.includes('custom')||m.includes('مقاس')||m.includes('chêne')||m.includes('oak')) setTimeout(function(){if(typeof showPage==='function')showPage('carpenter');},1200);
  },

  addMsg: function(text, type) {
    var msgs = document.getElementById('ai-msgs');
    if (!msgs) return;
    var d = document.createElement('div');
    d.className = type==='bot'?'ai-b':'ai-u';
    var b = document.createElement('div');
    b.className = type==='bot'?'ai-bubble-msg':'ai-user-msg';
    b.innerHTML = text;
    d.appendChild(b);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }
};

if (document.readyState==='loading') {
  document.addEventListener('DOMContentLoaded', function(){AI.init();});
} else { AI.init(); }

setInterval(function(){if(!document.getElementById('ai-bubble')&&typeof AI!=='undefined')AI.init();},3000);

var TRANSLATIONS={
  fr:{'nav-home':'Accueil','nav-products':'Collections','nav-carpenter':'Sur Mesure','nav-track':'Suivi','nav-loyalty':'Récompenses','nav-about':'À Propos','signin-btn':'Connexion'},
  ar:{'nav-home':'الرئيسية','nav-products':'المجموعات','nav-carpenter':'حسب الطلب','nav-track':'تتبع','nav-loyalty':'المكافآت','nav-about':'من نحن','signin-btn':'تسجيل الدخول'},
  en:{'nav-home':'Home','nav-products':'Collections','nav-carpenter':'Sur Mesure','nav-track':'Track','nav-loyalty':'Rewards','nav-about':'About','signin-btn':'Sign In'}
};

function setLang(lang){
  ['ar','fr','en'].forEach(function(l){var btn=document.getElementById('lang-'+l);if(btn)btn.classList.toggle('active',l===lang);});
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  var T=TRANSLATIONS[lang];
  if(!T)return;
  document.querySelectorAll('[data-lang]').forEach(function(el){var key=el.getAttribute('data-lang');if(T[key])el.textContent=T[key];});
  var hs=document.getElementById('home-search');
  if(hs)hs.placeholder=lang==='ar'?'ابحث عن منتجات...':lang==='en'?'Search products...':'Rechercher produits...';
  if(typeof AI!=='undefined')AI.setLang(lang);
  if(typeof toast==='function'){var f={ar:'🇹🇳 عربي',fr:'🇫🇷 Français',en:'🌍 English'};toast(f[lang],'default');}
}
