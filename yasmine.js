// ── YASMINE AI ASSISTANT ──

var TRANSLATIONS={
  en:{
    'nav-home':'Home','nav-products':'Collections','nav-carpenter':'Custom Furniture',
    'nav-track':'Track','nav-loyalty':'Rewards','nav-about':'About','signin-btn':'Sign In',
    'hero-badge':"Tunisias #1 Artisan Marketplace",
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
    'about-label':'Our Story','about-title':'About Everest',
    'add-cart':'Add to Cart','view-all':'View All','shop-now':'Shop Now',
    'sign-in':'Sign In','create-account':'Create Account','logout':'Sign Out',
    'nav-cart':'Cart','nav-me':'Me'
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
    'about-label':'Notre Histoire','about-title':'À propos d\'Everest',
    'add-cart':'Ajouter au Panier','view-all':'Voir Tout','shop-now':'Acheter',
    'sign-in':'Connexion','create-account':'Creer un Compte','logout':'Deconnexion',
    'nav-cart':'Panier','nav-me':'Compte'
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
    'logout':'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c',
    'nav-cart':'\u0627\u0644\u0633\u0644\u0629',
    'nav-me':'\u062d\u0633\u0627\u0628\u064a'
  }
};

function setLang(lang){
  window._currentLang = lang;
  ['ar','fr','en'].forEach(function(l){
    var btn=document.getElementById('lang-'+l);
    if(btn) btn.classList.toggle('active', l===lang);
  });
  document.querySelectorAll('[data-nav-lang]').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-nav-lang')===lang);
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

  var SYSTEM = `You are Yasmine, the AI assistant for Everest — Hit Your Dreams — Tunisia's premium artisan marketplace. You help customers find products, answer questions about delivery, artisans, and orders. You speak Arabic, French, and English — auto-detect the language. Always be warm, helpful, and bring conversations back to Everest naturally. Key facts: artisans from Monastir, Ksar Hellal, Sfax, Nabeul. Delivery 24-48h in Tunisia. Free shipping over 500 TND. Promo codes: EVEREST10 (10% off), SAHEL20 (20% off), WELCOME50 (50 TND off). Products include furniture, ceramics, lighting, rugs, bedroom sets.`;

  function sendMessage(userMsg){
    if(!userMsg || !userMsg.trim()) return;
    history.push({role:'user', content: userMsg});
    appendMsg('user', userMsg);
    appendMsg('bot', '...', true);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://yasmine-proxy.bensalemyassine063.workers.dev', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 12000;

    var messages = [{role:'user', parts:[{text: SYSTEM}]}, {role:'model', parts:[{text:'Bonjour! Je suis Yasmine.'}]}];
    history.slice(-10).forEach(function(m){
      messages.push({role: m.role === 'user' ? 'user' : 'model', parts:[{text: m.content}]});
    });

    xhr.onload = function(){
      removeTyping();
      console.log('Status:', xhr.status, 'Response:', xhr.responseText.slice(0,300));
      if(xhr.status === 200){
        try{
          var data = JSON.parse(xhr.responseText);
          var reply = data.candidates[0].content.parts[0].text;
          history.push({role:'assistant', content: reply});
          appendMsg('bot', reply);
        } catch(e){ 
          console.log('Parse error:', e);
          appendMsg('bot', getOfflineReply(userMsg)); 
        }
      } else {
        appendMsg('bot', getOfflineReply(userMsg));
      }
    };
    xhr.onerror = function(){ removeTyping(); console.log('XHR error'); appendMsg('bot', getOfflineReply(userMsg)); };
    xhr.ontimeout = function(){ removeTyping(); console.log('XHR timeout'); appendMsg('bot', getOfflineReply(userMsg)); };
    xhr.timeout = 30000;
    xhr.send(JSON.stringify({ contents: messages }));
  }

  function getOfflineReply(msg){
    var m = msg.toLowerCase();
    var ar = currentLang==='ar', en = currentLang==='en';

    // Greetings
    if(m.match(/^(hi|hello|hey|salut|bonjour|bonsoir|مرحبا|السلام|هلا|coucou|slt)/))
      return ar ? 'مرحبا! أنا ياسمين، مساعدتك في Everest 🛍️ كيف يمكنني مساعدتك اليوم؟' : en ? 'Hi! I am Yasmine, your Everest assistant 🛍️ How can I help you today?' : 'Bonjour! Je suis Yasmine, votre assistante Everest 🛍️ Comment puis-je vous aider?';

    // How are you
    if(m.includes('how are') || m.includes('comment tu') || m.includes('comment vas') || m.includes('كيف حالك'))
      return ar ? 'أنا بخير شكراً! مستعدة لمساعدتك في إيجاد أفضل المنتجات التونسية 😊' : en ? 'I am great, thank you! Ready to help you find the best Tunisian crafts 😊' : 'Je vais très bien merci! Prête à vous aider trouver les meilleurs produits tunisiens 😊';

    // Delivery
    if(m.includes('livr') || m.includes('delivery') || m.includes('shipping') || m.includes('توصيل') || m.includes('شحن'))
      return ar ? '🚚 التوصيل خلال 24-48 ساعة في كامل تونس. مجاني للطلبات فوق 500 دينار! نصل لكل الولايات.' : en ? '🚚 Delivery in 24-48h across all of Tunisia. FREE for orders over 500 TND! We deliver to all regions.' : '🚚 Livraison en 24-48h partout en Tunisie. GRATUITE pour les commandes au-dessus de 500 TND!';

    // Price / cost
    if(m.includes('prix') || m.includes('price') || m.includes('cost') || m.includes('combien') || m.includes('سعر') || m.includes('ثمن') || m.includes('how much'))
      return ar ? '💰 أسعارنا تبدأ من 29 دينار للإكسسوارات وتصل لـ 4500 دينار للأثاث الفاخر. جميع الأسعار بالدينار التونسي.' : en ? '💰 Our prices start from 29 TND for accessories up to 4,500 TND for premium furniture. All prices in Tunisian Dinar.' : '💰 Nos prix commencent à 29 TND pour les accessoires jusqu a 4 500 TND pour les meubles premium.';

    // Sofa / furniture / canape
    if(m.includes('sofa') || m.includes('canap') || m.includes('fauteuil') || m.includes('أريكة') || m.includes('كنبة') || m.includes('meuble') || m.includes('furniture'))
      return ar ? '🛋️ لدينا أثاث فاخر من حرفيي المنستير وقصر هلال! الأريكة السلطانية المخملية 3,299 دينار، وأريكة نجمة الصحراء 2,800 دينار. كلها مصنوعة يدوياً!' : en ? '🛋️ We have luxury furniture from Monastir & Ksar Hellal artisans! The Velvet Sultan Sofa 3,299 TND, Desert Star Sofa 2,800 TND. All handcrafted!' : '🛋️ Nous avons des meubles de luxe des artisans de Monastir & Ksar Hellal! Canapé Sultan Velours 3 299 TND, tout fait à la main!';

    // Rug / carpet / kilim / tapis
    if(m.includes('rug') || m.includes('carpet') || m.includes('kilim') || m.includes('tapis') || m.includes('سجادة') || m.includes('زربية'))
      return ar ? '🏺 سجادنا الكيليم مصنوع يدوياً من كيروان! أسعار تبدأ من 450 دينار. ألوان وأنماط تقليدية أصيلة.' : en ? '🏺 Our Kilim rugs are handwoven in Kairouan! Prices from 450 TND. Authentic traditional patterns and colors.' : '🏺 Nos tapis Kilim sont tissés à la main à Kairouan! Prix à partir de 450 TND. Motifs traditionnels authentiques.';

    // Lighting / lantern / lampe / lustre
    if(m.includes('light') || m.includes('lamp') || m.includes('lantern') || m.includes('lustre') || m.includes('lampe') || m.includes('إنارة') || m.includes('فانوس') || m.includes('مصباح'))
      return ar ? '💡 لدينا فوانيس وإنارة نحاسية مذهلة من صفاقس! الفانوس النحاسي السلطاني 185 دينار. يضفي جمالاً رائعاً لأي منزل.' : en ? '💡 We have stunning brass lanterns & lighting from Sfax! The Sultan Brass Lantern 185 TND. Adds a magical touch to any home.' : '💡 Nous avons de superbes lanternes et luminaires en laiton de Sfax! La Lanterne Sultan en Laiton 185 TND.';

    // Ceramics / pottery / ceramique
    if(m.includes('ceramic') || m.includes('ceramique') || m.includes('pottery') || m.includes('poterie') || m.includes('سيراميك') || m.includes('فخار'))
      return ar ? '🏺 سيراميكنا مصنوع يدوياً من نابل وقابس! أسعار تبدأ من 45 دينار. ألوان زرقاء وبيضاء تقليدية رائعة.' : en ? '🏺 Our ceramics are handmade in Nabeul & Gabes! Prices from 45 TND. Beautiful traditional blue and white designs.' : '🏺 Notre céramique est faite à la main à Nabeul & Gabes! Prix à partir de 45 TND.';

    // Sur mesure / custom / custom furniture
    if(m.includes('sur mesure') || m.includes('custom') || m.includes('personaliz') || m.includes('حسب الطلب') || m.includes('مخصص'))
      return ar ? '🪑 نعم! لدينا خدمة الأثاث حسب الطلب. يمكنك تخصيص اللون والحجم والتصميم. تواصل مع حرفيينا عبر صفحة "حسب الطلب"!' : en ? '🪑 Yes! We offer custom furniture service. You can customize color, size and design. Visit our "Custom Furniture" page to get started!' : '🪑 Oui! Nous proposons un service de meubles sur mesure. Personnalisez couleur, taille et design via la page "Sur Mesure"!';

    // Artisans / who makes / qui fabrique
    if(m.includes('artisan') || m.includes('who make') || m.includes('qui fabrique') || m.includes('حرفي') || m.includes('صانع'))
      return ar ? '👨‍🎨 حرفيونا من أفضل المناطق التونسية: المنستير، قصر هلال، صفاقس، نابل، القيروان! كل منتج مصنوع يدوياً بحرفية تونسية أصيلة.' : en ? '👨‍🎨 Our artisans are from Tunisias finest regions: Monastir, Ksar Hellal, Sfax, Nabeul, Kairouan! Every product is handcrafted with authentic Tunisian expertise.' : '👨‍🎨 Nos artisans viennent des meilleures régions de Tunisie: Monastir, Ksar Hellal, Sfax, Nabeul, Kairouan!';

    // Track order / suivi
    if(m.includes('track') || m.includes('suivi') || m.includes('order') || m.includes('commande') || m.includes('تتبع') || m.includes('طلب'))
      return ar ? '📦 يمكنك تتبع طلبك من صفحة "تتبع"! أدخل رقم التتبع الذي تلقيته بعد الطلب. رقم التتبع يبدأ بـ STN-' : en ? '📦 You can track your order on the "Track" page! Enter the tracking number you received after ordering. Tracking numbers start with STN-' : '📦 Vous pouvez suivre votre commande sur la page "Suivi"! Entrez le numéro de suivi reçu après votre commande. Les numéros commencent par STN-';

    // Return / retour / refund
    if(m.includes('return') || m.includes('retour') || m.includes('refund') || m.includes('رجوع') || m.includes('استرجاع'))
      return ar ? '↩️ سياسة الإرجاع: 30 يوماً لإرجاع أي منتج. المنتج يجب أن يكون بحالته الأصلية. تواصل معنا وسنرتب الاستلام.' : en ? '↩️ Return policy: 30 days to return any product. Item must be in original condition. Contact us and we will arrange pickup.' : '↩️ Politique de retour: 30 jours pour retourner tout produit. L article doit être en état original.';

    // Payment / paiement
    if(m.includes('pay') || m.includes('paiement') || m.includes('payment') || m.includes('دفع') || m.includes('كيف ندفع'))
      return ar ? '💳 ندفع عند الاستلام (Cash on delivery) في كامل تونس! قريباً سنضيف الدفع الإلكتروني عبر Konnect.' : en ? '💳 We offer Cash on Delivery across all of Tunisia! Online payment via Konnect coming soon.' : '💳 Nous proposons le paiement à la livraison partout en Tunisie! Paiement en ligne via Konnect bientôt disponible.';

    // Contact / help
    if(m.includes('contact') || m.includes('help') || m.includes('aide') || m.includes('مساعدة') || m.includes('تواصل'))
      return ar ? '📞 للتواصل معنا: راسلنا عبر الموقع أو تفضل بزيارة صفحة "من نحن". فريقنا متاح 9 صباحاً - 9 مساءً!' : en ? '📞 Contact us via the website or visit our "About" page. Our team is available 9AM - 9PM!' : '📞 Contactez-nous via le site ou visitez notre page "À Propos". Notre équipe est disponible de 9h à 21h!';

    // Products / what do you have
    if(m.includes('product') || m.includes('produit') || m.includes('what do you') || m.includes('what you') || m.includes('منتج') || m.includes('ماذا عندك') || m.includes('collection'))
      return ar ? '🛍️ لدينا تشكيلة واسعة: أثاث فاخر، سجاد كيليم، إنارة نحاسية، سيراميك، عطور، ديكور، وأثاث حسب الطلب! كلها من حرفيين تونسيين.' : en ? '🛍️ We have: luxury furniture, kilim rugs, brass lighting, ceramics, fragrances, decor, and custom furniture! All from Tunisian artisans.' : '🛍️ Nous avons: meubles de luxe, tapis kilim, luminaires en laiton, céramiques, parfums, déco, et meubles sur mesure!';

    // About Everest / what is
    if(m.includes('what is everest') || m.includes('what is shopping') || m.includes('about') || m.includes('qui etes') || m.includes('ما هو') || m.includes('من انتم'))
      return ar ? '🇹🇳 Everest هي منصة التسوق الأولى للحرف اليدوية التونسية! نربط حرفيي الصحل من المنستير وقصر هلال بالعالم. كل منتج قصة وإرث!' : en ? '🇹🇳 Everest is Tunisia\'s #1 artisan marketplace! We connect Sahel craftsmen from Monastir & Ksar Hellal with the world. Every product tells a story!' : '🇹🇳 Everest est la 1ère marketplace artisanale de Tunisie! Nous connectons les artisans du Sahel avec le monde entier.';

    // Default
    return ar ? 'مرحبا! 😊 أنا ياسمين. يمكنني مساعدتك في: المنتجات، التوصيل، الطلبات، الأسعار، الحرفيين. ماذا تريد أن تعرف؟' : en ? 'Hi! 😊 I am Yasmine. I can help with: products, delivery, orders, prices, artisans. What would you like to know?' : 'Bonjour! 😊 Je suis Yasmine. Je peux vous aider avec: produits, livraison, commandes, prix, artisans. Que souhaitez-vous savoir?';
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

console.log('Everest assistant layer ready');
