// ── YASMINE AI ASSISTANT ──

var TRANSLATIONS={
  en:{
    'nav-home':'Home','nav-products':'Collections','nav-carpenter':'Custom Furniture',
    'nav-track':'Track','nav-loyalty':'Rewards','nav-about':'About','signin-btn':'Sign In',
    'hero-badge':"Tunisia's #1 Artisan Marketplace",
    'hero-search':'Search products, artisans, regions...','hero-search-btn':'Search',
    'stat-products':'Products','stat-regions':'Regions','stat-satisfaction':'Satisfaction','stat-delivery':'Max Delivery',
    'browse-label':'Browse by Category','browse-title':'Our Collections',
    'featured-label':'Handpicked for You','featured-title':'Featured Products',
    'artisans-label':'The Makers','artisans-title':'Our Artisans',
    'flash-label':'Flash Sale',
    'cart-title':'Your Cart','checkout-btn':'Checkout','cart-empty':'Your cart is empty',
    'cart-subtotal':'Subtotal','cart-shipping':'Shipping','cart-total':'Total','cart-free':'Free',
    'track-label':'Track Order','track-title':'Track Your Order',
    'track-sub':'Real-time updates from our artisans workshops all the way to your door.',
    'track-placeholder':'Enter tracking number...','track-btn':'Track',
    'rewards-label':'Loyalty Program','rewards-title':'Loyalty Rewards',
    'rewards-sub':'Earn points on every purchase and unlock exclusive perks!',
    'about-label':'Our Story','about-title':'About Shopping',
    'add-cart':'Add to Cart','view-all':'View All','shop-now':'Shop Now',
    'sign-in':'Sign In','create-account':'Create Account','logout':'Sign Out'
  },
  fr:{
    'nav-home':'Accueil','nav-products':'Collections','nav-carpenter':'Sur Mesure',
    'nav-track':'Suivi','nav-loyalty':'Recompenses','nav-about':'A Propos','signin-btn':'Connexion',
    'hero-badge':'Marketplace Artisanal N1 en Tunisie',
    'hero-search':'Rechercher produits, artisans...','hero-search-btn':'Rechercher',
    'stat-products':'Produits','stat-regions':'Regions','stat-satisfaction':'Satisfaction','stat-delivery':'Livraison Max',
    'browse-label':'Parcourir par Categorie','browse-title':'Nos Collections',
    'featured-label':'Selection pour Vous','featured-title':'Produits Vedettes',
    'artisans-label':'Les Artisans','artisans-title':'Nos Artisans',
    'flash-label':'Vente Flash',
    'cart-title':'Votre Panier','checkout-btn':'Commander','cart-empty':'Panier vide',
    'cart-subtotal':'Sous-total','cart-shipping':'Livraison','cart-total':'Total','cart-free':'Gratuit',
    'track-label':'Suivi Commande','track-title':'Suivre Votre Commande',
    'track-sub':'Mises a jour en temps reel jusqu a votre porte.',
    'track-placeholder':'Entrez le numero de suivi...','track-btn':'Suivre',
    'rewards-label':'Programme Fidelite','rewards-title':'Recompenses',
    'rewards-sub':'Gagnez des points a chaque achat!',
    'about-label':'Notre Histoire','about-title':'A Propos de Shopping',
    'add-cart':'Ajouter au Panier','view-all':'Voir Tout','shop-now':'Acheter',
    'sign-in':'Connexion','create-account':'Creer un Compte','logout':'Deconnexion'
  },
  ar:{
    'nav-home':'\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    'nav-products':'\u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a',
    'nav-carpenter':'\u062d\u0633\u0628 \u0627\u0644\u0637\u0644\u0628',
    'nav-track':'\u062a\u062a\u0628\u0639',
    'nav-loyalty':'\u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062a',
    'nav-about':'\u0645\u0646 \u0646\u062d\u0646',
    'signin-btn':'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644',
    'hero-badge':'\u0645\u0646\u0635\u0629 \u0627\u0644\u062d\u0631\u0641 \u0627\u0644\u0623\u0648\u0644\u0649 \u0641\u064a \u062a\u0648\u0646\u0633',
    'hero-search':'\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0646\u062a\u062c\u0627\u062a...',
    'hero-search-btn':'\u0628\u062d\u062b',
    'stat-products':'\u0645\u0646\u062a\u062c',
    'stat-regions':'\u0645\u0646\u0627\u0637\u0642',
    'stat-satisfaction':'\u0631\u0636\u0627',
    'stat-delivery':'\u062a\u0648\u0635\u064a\u0644',
    'browse-label':'\u062a\u0635\u0641\u062d \u062d\u0633\u0628 \u0627\u0644\u0641\u0626\u0629',
    'browse-title':'\u0645\u062c\u0645\u0648\u0639\u0627\u062a\u0646\u0627',
    'featured-label':'\u0645\u062e\u062a\u0627\u0631\u0629 \u0644\u0643',
    'featured-title':'\u0645\u0646\u062a\u062c\u0627\u062a \u0645\u0645\u064a\u0632\u0629',
    'artisans-label':'\u0627\u0644\u0635\u0646\u0627\u0639',
    'artisans-title':'\u062d\u0631\u0641\u064a\u0648\u0646\u0627',
    'flash-label':'\u062a\u062e\u0641\u064a\u0636\u0627\u062a',
    'cart-title':'\u0633\u0644\u0629 \u0627\u0644\u062a\u0633\u0648\u0642',
    'checkout-btn':'\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
    'cart-empty':'\u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063a\u0629',
    'cart-subtotal':'\u0627\u0644\u0645\u062c\u0645\u0648\u0639',
    'cart-shipping':'\u0627\u0644\u0634\u062d\u0646',
    'cart-total':'\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a',
    'cart-free':'\u0645\u062c\u0627\u0646\u064a',
    'track-label':'\u062a\u062a\u0628\u0639 \u0627\u0644\u0637\u0644\u0628',
    'track-title':'\u062a\u062a\u0628\u0639 \u0637\u0644\u0628\u0643',
    'track-sub':'\u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0641\u0648\u0631\u064a\u0629 \u062d\u062a\u0649 \u0628\u0627\u0628\u0643.',
    'track-placeholder':'\u0623\u062f\u062e\u0644 \u0631\u0642\u0645 \u0627\u0644\u062a\u062a\u0628\u0639...',
    'track-btn':'\u062a\u062a\u0628\u0639',
    'rewards-label':'\u0628\u0631\u0646\u0627\u0645\u062c \u0627\u0644\u0648\u0644\u0627\u0621',
    'rewards-title':'\u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062a',
    'rewards-sub':'\u0627\u0643\u0633\u0628 \u0646\u0642\u0627\u0637\u0627\u064b \u0645\u0639 \u0643\u0644 \u0634\u0631\u0627\u0621!',
    'about-label':'\u0642\u0635\u062a\u0646\u0627',
    'about-title':'\u0645\u0646 \u0646\u062d\u0646',
    'add-cart':'\u0623\u0636\u0641 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629',
    'view-all':'\u0639\u0631\u0636 \u0627\u0644\u0643\u0644',
    'shop-now':'\u062a\u0633\u0648\u0642 \u0627\u0644\u0622\u0646',
    'sign-in':'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644',
    'create-account':'\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628',
    'logout':'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c'
  }
};

function setLang(lang){
  window._currentLang = lang;
  ['ar','fr','en'].forEach(function(l){
    var btn=document.getElementById('lang-'+l);
    if(btn) btn.classList.toggle('active', l===lang);
  });
  document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr';
  var T = TRANSLATIONS[lang];
  if(!T) return;
  document.querySelectorAll('[data-lang]').forEach(function(el){
    var key = el.getAttribute('data-lang');
    if(T[key]) el.textContent = T[key];
  });
  var hs = document.getElementById('home-search');
  if(hs && T['hero-search']) hs.placeholder = T['hero-search'];
  var cartTitle = document.querySelector('.cart-header h2');
  if(cartTitle && T['cart-title']) cartTitle.textContent = T['cart-title'];
  var checkoutBtn = document.querySelector('[onclick="checkout()"]');
  if(checkoutBtn && T['checkout-btn']) checkoutBtn.textContent = T['checkout-btn'] + ' \u2192';
  var trackInput = document.getElementById('track-num');
  if(trackInput && T['track-placeholder']) trackInput.placeholder = T['track-placeholder'];
  if(typeof AI !== 'undefined') AI.setLang(lang);
  if(typeof toast === 'function'){
    var f = {ar:'AR - \u0639\u0631\u0628\u064a', fr:'FR - Fran\u00e7ais', en:'EN - English'};
    toast(f[lang], 'default');
  }
}


// ── AI ASSISTANT ──
var AI = (function(){
  var history = [];
  var currentLang = 'fr';
  var isOpen = false;

  var SYSTEM = `You are Yasmine, the AI assistant for Shopping — Tunisia's premium artisan marketplace. You help customers find products, answer questions about delivery, artisans, and orders. You speak Arabic, French, and English — auto-detect the language. Always be warm, helpful, and bring conversations back to Shopping naturally. Key facts: artisans from Monastir, Ksar Hellal, Sfax, Nabeul. Delivery 24-48h in Tunisia. Free shipping over 500 TND. Promo codes: SHOPPING10 (10% off), SAHEL20 (20% off), WELCOME50 (50 TND off). Products include furniture, ceramics, lighting, rugs, bedroom sets.`;

  function sendMessage(userMsg){
    if(!userMsg || !userMsg.trim()) return;
    history.push({role:'user', content: userMsg});
    appendMsg('user', userMsg);
    appendMsg('bot', '...', true);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://yasmine-proxy.bensalemyassine063.workers.dev', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 12000;

    var messages = [{role:'user', parts:[{text: SYSTEM}]}, {role:'model', parts:[{text:'Bonjour! Je suis Yasmine. Comment puis-je vous aider?'}]}];
    history.slice(-10).forEach(function(m){
      messages.push({role: m.role === 'user' ? 'user' : 'model', parts:[{text: m.content}]});
    });

    xhr.onreadystatechange = function(){
      if(xhr.readyState !== 4) return;
      removeTyping();
      if(xhr.status === 200){
        try{
          var data = JSON.parse(xhr.responseText);
          var reply = data.choices[0].message.content;
          history.push({role:'assistant', content: reply});
          appendMsg('bot', reply);
        } catch(e){ appendMsg('bot', getOfflineReply(userMsg)); }
      } else {
        appendMsg('bot', getOfflineReply(userMsg));
      }
    };
    xhr.ontimeout = function(){ removeTyping(); appendMsg('bot', getOfflineReply(userMsg)); };
    xhr.send(JSON.stringify({ messages: messages }));
  }

  function getOfflineReply(msg){
    var m = msg.toLowerCase();
    if(m.includes('livr') || m.includes('توصيل') || m.includes('delivery')) return currentLang==='ar' ? 'التوصيل خلال 24-48 ساعة في تونس. مجاني فوق 500 دينار!' : currentLang==='en' ? 'Delivery in 24-48h across Tunisia. Free over 500 TND!' : 'Livraison en 24-48h partout en Tunisie. Gratuite au-dessus de 500 TND!';
    if(m.includes('promo') || m.includes('remise') || m.includes('code')) return currentLang==='ar' ? 'كود SAHEL20 للخصم 20%، WELCOME50 لخصم 50 دينار!' : currentLang==='en' ? 'Use SAHEL20 for 20% off or WELCOME50 for 50 TND off!' : 'Utilisez SAHEL20 (-20%) ou WELCOME50 (-50 TND)!';
    if(m.includes('sofa') || m.includes('canap') || m.includes('meuble') || m.includes('furniture')) return currentLang==='ar' ? 'لدينا أثاث رائع من منستير وقصر هلال! الأريكة السلطانية 3299 دينار.' : currentLang==='en' ? 'We have amazing furniture from Monastir artisans! The Velvet Sultan Sofa is 3,299 TND.' : 'Nous avons des meubles magnifiques des artisans de Monastir! Le Canape Sultan Velours est a 3 299 TND.';
    return currentLang==='ar' ? 'مرحبا! كيف يمكنني مساعدتك في Shopping اليوم؟' : currentLang==='en' ? 'Hello! How can I help you with Shopping today?' : 'Bonjour! Comment puis-je vous aider avec Shopping aujourd\'hui?';
  }

  function appendMsg(role, text, typing){
    var body = document.getElementById('yasmine-body');
    if(!body) return;
    removeTyping();
    var div = document.createElement('div');
    div.className = 'ym-msg ym-' + role + (typing ? ' ym-typing' : '');
    div.style.cssText = 'margin-bottom:0.8rem;display:flex;gap:0.5rem;align-items:flex-start;' + (role==='user'?'flex-direction:row-reverse':'');
    div.innerHTML = (role==='bot'?'<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#9b72f0);display:flex;align-items:center;justify-content:center;font-size:0.7rem;flex-shrink:0">✨</div>':'') +
      '<div style="max-width:75%;padding:0.7rem 0.9rem;border-radius:' + (role==='user'?'16px 4px 16px 16px':'4px 16px 16px 16px') + ';background:' + (role==='user'?'linear-gradient(135deg,#7c3aed,#6b3fd4);color:white':'white;border:1px solid rgba(107,63,212,0.15);color:#1e0a4e') + ';font-size:0.82rem;line-height:1.5">' + (typing?'<span style="opacity:0.6">...</span>':text) + '</div>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function removeTyping(){
    var t = document.querySelector('.ym-typing');
    if(t) t.remove();
  }

  function toggle(){
    isOpen = !isOpen;
    var panel = document.getElementById('yasmine-panel');
    if(panel) panel.style.display = isOpen ? 'flex' : 'none';
    if(isOpen && !document.querySelector('.ym-msg')) {
      appendMsg('bot', currentLang==='ar' ? 'مرحبا! \u0623\u0646\u0627 \u064a\u0627\u0633\u0645\u064a\u0646\u060c \u0643\u064a\u0641 \u064a\u0645\u0643\u0646\u0646\u064a \u0645\u0633\u0627\u0639\u062f\u062a\u0643?' : currentLang==='en' ? 'Hi! I\'m Yasmine. How can I help you today?' : 'Bonjour! Je suis Yasmine. Comment puis-je vous aider?');
    }
  }

  function handleKey(e){ if(e.key==='Enter') { var inp=document.getElementById('yasmine-input'); if(inp && inp.value.trim()){sendMessage(inp.value.trim());inp.value='';}} }

  function quickBtn(text){ sendMessage(text); }

  return {
    toggle: toggle,
    send: function(){ var inp=document.getElementById('yasmine-input'); if(inp && inp.value.trim()){sendMessage(inp.value.trim());inp.value='';} },
    key: handleKey,
    quick: quickBtn,
    setLang: function(l){ currentLang=l; }
  };
})();

console.log('Shopping Data Layer Ready');
