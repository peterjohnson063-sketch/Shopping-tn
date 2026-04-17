// Everest — Yasmine live context + vendor listing policy (loaded after app.js)
(function () {
  'use strict';

  function getState() {
    return typeof window !== 'undefined' && window.__EVEREST_STATE__ ? window.__EVEREST_STATE__ : null;
  }

  function normalizeStatus(st) {
    var s = String(st == null ? '' : st).trim().toLowerCase();
    if (!s) return 'pending';
    if (s === 'out-for-delivery' || s === 'out_for_delivery') return 'out_for_delivery';
    if (s === 'cancelled') return 'canceled';
    return s;
  }

  function statusHint(st) {
    var n = normalizeStatus(st);
    var map = {
      pending: 'waiting for Everest confirmation',
      confirmed: 'confirmed — being prepared',
      processing: 'being prepared',
      ready: 'ready for driver pickup',
      out_for_delivery: 'on the way to the customer',
      shipped: 'on the way',
      transit: 'in transit',
      delivered: 'delivered',
      canceled: 'canceled',
      cancelled: 'canceled',
    };
    return map[n] || n;
  }

  function orderKey(o) {
    return String(o.id != null ? o.id : o.tracking_number || '');
  }

  function loadOrdersArray(st) {
    var orders = st && Array.isArray(st.orders) && st.orders.length ? st.orders : [];
    if (orders.length === 0 && typeof STN !== 'undefined' && STN.DB && typeof STN.DB.get === 'function') {
      var dbOrders = STN.DB.get('orders');
      if (Array.isArray(dbOrders) && dbOrders.length) orders = dbOrders;
    }
    return orders;
  }

  function loadProductsArray(st) {
    var prods = st && Array.isArray(st.products) && st.products.length ? st.products : [];
    if (prods.length === 0 && typeof STN !== 'undefined' && STN.DB && typeof STN.DB.get === 'function') {
      var dbP = STN.DB.get('products');
      if (Array.isArray(dbP) && dbP.length) prods = dbP;
    }
    return prods;
  }

  function normalizeForProductMatch(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function queryTokensForProducts(userMsg) {
    var n = normalizeForProductMatch(userMsg);
    var parts = n.split(/\s+/).filter(function (t) {
      return t.length >= 2;
    });
    var stop = {
      le: 1,
      la: 1,
      les: 1,
      un: 1,
      une: 1,
      des: 1,
      de: 1,
      du: 1,
      et: 1,
      ou: 1,
      est: 1,
      vous: 1,
      nous: 1,
      pour: 1,
      sur: 1,
      pas: 1,
      the: 1,
      a: 1,
      an: 1,
      is: 1,
      are: 1,
      do: 1,
      you: 1,
      have: 1,
      does: 1,
      we: 1,
      everest: 1,
      yasmine: 1,
      can: 1,
      what: 1,
      how: 1,
      about: 1,
      tell: 1,
      me: 1,
      there: 1,
      any: 1,
      some: 1,
      this: 1,
      that: 1,
      with: 1,
      from: 1,
      vendez: 1,
      vend: 1,
      sell: 1,
      selling: 1,
      product: 1,
      produit: 1,
    };
    return parts.filter(function (t) {
      return !stop[t];
    });
  }

  function scoreProductAgainstQuery(p, tokens, rawNorm) {
    var blob = normalizeForProductMatch(
      (p.name || '') +
        ' ' +
        (p.description || '') +
        ' ' +
        (p.category || '') +
        ' ' +
        (p.shop_name || p.shopName || p.vendor || '')
    );
    var score = 0;
    var i;
    if (rawNorm.length >= 4 && blob.indexOf(rawNorm) !== -1) score += 12;
    for (i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (t.length >= 4 && blob.indexOf(t) !== -1) score += 3;
      else if (t.length >= 3 && blob.indexOf(t) !== -1) score += 2;
      else if (t.length >= 2 && blob.indexOf(t) !== -1) score += 1;
    }
    return score;
  }

  /** Products whose name/description/category overlap the user message (best first). */
  function collectRelevantProducts(userMsg, prods) {
    if (!prods || !prods.length) return [];
    var rawNorm = normalizeForProductMatch(userMsg);
    var tokens = queryTokensForProducts(userMsg);
    var scored = prods.map(function (p) {
      return { p: p, s: scoreProductAgainstQuery(p, tokens, rawNorm) };
    });
    scored.sort(function (a, b) {
      return b.s - a.s;
    });
    return scored
      .filter(function (x) {
        return x.s > 0;
      })
      .map(function (x) {
        return x.p;
      });
  }

  /** @returns {{ relevant: object[], user: object|null, needle: string|null }} */
  function collectRelevantOrders(userMsg) {
    var st = getState();
    var u = st ? st.currentUser : null;
    var orders = st ? loadOrdersArray(st) : [];
    var msg = String(userMsg || '');
    var trackMatch = msg.match(/STN-[A-Z0-9_-]+/i);
    var needle = trackMatch ? trackMatch[0].toUpperCase().replace(/_/g, '-') : null;
    var relevant = [];
    var seen = {};

    function pushUnique(o) {
      var k = orderKey(o);
      if (!k || seen[k]) return;
      seen[k] = true;
      relevant.push(o);
    }

    if (needle) {
      orders.forEach(function (o) {
        var t = String(o.tracking_number || '').toUpperCase().replace(/_/g, '-');
        if (t && (t === needle || t.indexOf(needle) >= 0)) pushUnique(o);
      });
    }
    if (u && u.id != null) {
      orders.forEach(function (o) {
        if (o.user_id != null && String(o.user_id) === String(u.id)) pushUnique(o);
      });
    }
    return { relevant: relevant, user: u, needle: needle };
  }

  function statusHintLocalized(st, lang) {
    var n = normalizeStatus(st);
    var en = {
      pending: 'waiting for Everest confirmation',
      confirmed: 'confirmed — being prepared',
      processing: 'being prepared',
      ready: 'ready for driver pickup',
      out_for_delivery: 'on the way to you',
      shipped: 'on the way',
      transit: 'in transit',
      delivered: 'delivered',
      canceled: 'canceled',
    };
    var fr = {
      pending: 'en attente de confirmation',
      confirmed: 'confirmée — en préparation',
      processing: 'en préparation',
      ready: 'prête pour le livreur',
      out_for_delivery: 'en cours de livraison',
      shipped: 'en route',
      transit: 'en transit',
      delivered: 'livrée',
      canceled: 'annulée',
    };
    var ar = {
      pending: 'بانتظار تأكيد إيفرست',
      confirmed: 'مؤكدة — قيد التجهيز',
      processing: 'قيد التجهيز',
      ready: 'جاهزة للسائق',
      out_for_delivery: 'في الطريق إليك',
      shipped: 'في الطريق',
      transit: 'قيد النقل',
      delivered: 'تم التسليم',
      canceled: 'ملغاة',
    };
    var M = lang === 'ar' ? ar : lang === 'en' ? en : fr;
    return M[n] || statusHint(st);
  }

  /**
   * Instant answers without calling the cloud AI (orders, contact, smartphones). Returns null to defer to API / offline.
   */
  function tryLocalAnswer(userMsg, lang) {
    var safeLang = lang === 'ar' || lang === 'en' ? lang : 'fr';
    var msg = String(userMsg || '');
    var lower = msg.toLowerCase();

    // Gift button / gift checkout guidance (fast deterministic answer).
    if (
      /\bgift\b|cadeau|هدية|send as a gift|gift button|bouton cadeau|زر الهدية|gift checkout|recipient/i.test(
        lower
      )
    ) {
      if (safeLang === 'ar')
        return '🎁 لإرسال الطلب كهدية: افتح صفحة المنتج، أضِفه للسلة، ثم افتح **السلة** واضغط **Send as a gift**. بعدها املأ اسم المستلم والهاتف والولاية والعنوان، واختر إظهار اسم المُرسل أو مفاجأة، ثم تابع للدفع.';
      if (safeLang === 'en')
        return '🎁 To send a gift: open the product, add it to cart, then open **Cart** and click **Send as a gift**. Fill recipient name, phone, wilaya, and address, choose whether to reveal sender name, then continue to checkout/payment.';
      return '🎁 Pour envoyer un cadeau : ouvrez le produit, ajoutez-le au panier, puis dans le **Panier** cliquez **Send as a gift**. Renseignez nom, téléphone, gouvernorat et adresse du destinataire, choisissez afficher ou non le nom de l’expéditeur, puis continuez vers le paiement.';
    }

    // Strict privacy/legal guardrail for sensitive asks.
    if (
      /\bpassword|mot\s*de\s*passe|otp|code\s*secret|secret|token|api\s*key|key\b|seller\s*internal|vendor\s*internal|internal\s*order|where\s+is\s+the\s+order\s+from|who\s+is\s+the\s+seller|from\s+seller|كلمة\s*السر|رمز\s*سري|باسورد|البائع|مصدر\s*الطلب|معلومات\s*داخلية/i.test(
        lower
      )
    ) {
      if (safeLang === 'ar')
        return '🔒 لا أستطيع مشاركة كلمات المرور أو الرموز السرية أو أي بيانات داخلية/حساسة عن الطلبات والبائعين. يمكنني مساعدتك بالمعلومات المسموح بها فقط مثل حالة الطلب عبر **Track** أو خطوات الحساب الآمنة.';
      if (safeLang === 'en')
        return '🔒 I cannot share passwords, secret codes, or internal/protected order-seller details. I can help with safe customer-facing info only (for example order status in **Track** and secure account steps).';
      return '🔒 Je ne peux pas partager des mots de passe, codes secrets ni des détails internes/protégés sur les commandes ou vendeurs. Je peux aider avec les informations autorisées côté client (ex: statut via **Suivi** et étapes de compte sécurisées).';
    }

    // Contact / phone number (not "do you sell phones")
    if (
      /numéro|numero|phone\s*number|whatsapp|واتساب|اتصل|call\s*us|how\s+can\s+i\s+call|your\s+phone|téléphone|telephone|tel\s*:|reach\s*you|contact\s*(us|you)|مساعدة\s*تواصل|رقم\s*الهاتف|كيف\s*اتصل/i.test(
        msg
      ) &&
      !/iphone|smartphone|galaxy\s*s|pixel\s*\d|sell\s+phones|vendez.*téléphone/i.test(lower)
    ) {
      if (safeLang === 'ar')
        return '📞 للتواصل: استخدم الموقع (صفحة «من نحن» أو نموذج الطلب). فريق Everest متاح عادة 9:00–21:00. لا نعرض رقمًا عامًا في الدردشة — يُرجى المتابعة عبر الموقع لحماية خصوصيتك.';
      if (safeLang === 'en')
        return '📞 To reach us: use the website (About page or order flow). Our team is generally available 9AM–9PM. We don’t publish a public phone number in chat — please use the site so we can help you safely.';
      return '📞 Pour nous joindre : passez par le site (page « À propos » ou votre commande). Équipe généralement disponible 9h–21h. Pas de numéro public affiché ici — le site protège votre demande.';
    }

    // Public leadership (About page) — accurate when cloud AI is down
    if (
      /\bowner\b|owns everest|who owns|founder|co-?founder|\bceo\b|\bcto\b|who (runs|founded|started) everest|patron|propriétaire|proprietaire|pdg|fondateur|dirigeant|leadership|the team|yassine ben salem|yassine|ben salem|amina trabelsi|khaled sfaxsi|sarra nabeuli|المؤسس|المالك|صاحب|من يملك|رئيس|مؤسس|ياسين/i.test(
        lower
      )
    ) {
      if (safeLang === 'ar')
        return '👤 حسب صفحة «من نحن» العامة على الموقع: **ياسين بن سالم** — المدير العام والمؤسس (من المنستير). **أمينة الطرابلسي** — CTO، مهندسة full-stack من قصر هلال، صممت منصة Everest. أيضاً: **خالد الصفاقسي** رئيس التصميم، **سارة النابلي** مسؤولة الحرفيين. للسيرة الكاملة افتح **من نحن** في الموقع.';
      if (safeLang === 'en')
        return '👤 From Everest’s public **About** page: **Yassine Ben Salem** — CEO & Founder (from Monastir). **Amina Trabelsi** — CTO, full-stack engineer from Ksar Hellal who architected the platform. Also **Khaled Sfaxsi** (Head of Design) and **Sarra Nabeuli** (Head of Artisans). Open **About** on the site for full bios.';
      return '👤 D’après la page publique **À propos** : **Yassine Ben Salem** — PDG & fondateur (Monastir). **Amina Trabelsi** — CTO, ingénieure full-stack de Ksar Hellal, architecte de la plateforme. Aussi **Khaled Sfaxsi** (design) et **Sarra Nabeuli** (artisans). Voir **À propos** pour les bios complètes.';
    }

    // Phones, PCs, laptops — not Everest’s catalog (crafts & home)
    if (
      /\biphone\b|\bipad\b|smartphone|smart\s*phone|android\s*phone|google\s*pixel|galaxy\s*s\d|\bphones\b|mobile\s*phone|cell\s*phone|هاتف\s*ذكي|آيفون|أندرويد|تبيعو\s*ف\s*تيليفونات|\bpc\b|\blaptops?\b|\bmacbooks?\b|gaming\s*pc|\bdesktop\s*pc\b|workstation|mac\s*mini|imac|ordinateur(\s*portable)?|حاسوب|كمبيوتر|لابتوب/i.test(
        lower
      ) &&
      !/meuble|furniture|canap|sofa|desk\s*chair|bureau\s*en|kitchen|decor|étagère|etagere/i.test(lower)
    ) {
      if (safeLang === 'ar')
        return '📱 Everest سوق للحرف التونسية والمنزل (أثاث، سيراميك، إنارة، سجاد…). **لا نبيع** هواتف، أجهزة كمبيوتر، لابتوب، أو إلكترونيات استهلاكية كمتجر تقني. تصفح **المجموعات** لكتالوجنا الحقيقي.';
      if (safeLang === 'en')
        return '📱 Everest is a **Tunisian crafts & home** marketplace (furniture, ceramics, lighting, rugs…). We **do not** sell phones, PCs, laptops, or consumer electronics as a tech store. Browse **Collections** for what we actually offer.';
      return '📱 Everest, c’est l’**artisanat & la maison** tunisienne (meubles, céramique, luminaires…). Nous ne vendons pas smartphones, **PC**, portables ou électronique grand public comme un magasin tech. Ouvrez **Collections** pour le catalogue réel.';
    }

    var orderIntent =
      /STN-|track|tracking|suivi|my\s+order|where\s*(is|'s)\s*my\s+order|order\s+status|when\s+will\s+i\s+receive|when\s+does\s+my|delivery\s+status|commande|statut.*commande|livraison|colis|تتبع|طلبي|رقم\s*الطلب|وين\s*طلبي|متى\s*يوصل|شحن/i.test(
        msg
      );
    if (!orderIntent) return null;

    var st = getState();
    if (!st) {
      if (safeLang === 'ar')
        return '📦 افتح صفحة «تتبع» وأدخل رقم STN- من رسالة التأكيد. إن لم يظهر الطلب، سجّل الدخول بنفس الحساب الذي طلبت به.';
      if (safeLang === 'en')
        return '📦 Open **Track** and enter your **STN-…** code from your confirmation. If nothing shows, sign in with the same account you used to order.';
      return '📦 Ouvrez **Suivi** et entrez votre code **STN-…** reçu après commande. Si rien n’apparaît, connectez-vous avec le même compte.';
    }

    var pack = collectRelevantOrders(userMsg);
    var rel = pack.relevant;
    var u = pack.user;

    if (rel.length === 0) {
      if (safeLang === 'ar')
        return (
          '📦 لا أرى طلبًا مرتبطًا بهذا الجهاز بعد. جرّب: 1) تسجيل الدخول 2) لصق رقم **STN-** هنا أو في صفحة التتبع 3) إكمال الطلب من نفس المتصفح ليُحفظ محليًا.' +
          (u ? '' : ' **سجّل الدخول** لربط طلباتك.')
        );
      if (safeLang === 'en')
        return (
          '📦 I don’t see any order on **this device** yet. Try: 1) **Sign in** 2) Paste your **STN-…** here or on **Track** 3) After checkout, orders are saved on this browser.' +
          (u ? '' : ' Please **sign in** to link your orders.')
        );
      return (
        '📦 Je ne vois pas encore de commande sur **cet appareil**. Essayez : 1) **Connexion** 2) Collez **STN-…** ici ou dans **Suivi** 3) Après paiement, la commande est enregistrée sur ce navigateur.' +
        (u ? '' : ' **Connectez-vous** pour lier vos commandes.')
      );
    }

    var lines = [];
    if (safeLang === 'ar') lines.push('📦 **طلباتك** (من بيانات هذا الجهاز) :');
    else if (safeLang === 'en') lines.push('📦 **Your orders** (from this device’s data):');
    else lines.push('📦 **Vos commandes** (données de cet appareil) :');

    rel.slice(0, 8).forEach(function (o) {
      var tr = String(o.tracking_number || o.id || '—');
      var lab = statusHintLocalized(o.status, safeLang);
      var tot = o.total != null ? o.total : o.amount || 0;
      var wil = o.wilaya || '—';
      lines.push('• **' + tr + '** — ' + lab + ' — ' + tot + ' TND — ' + wil);
    });
    if (safeLang === 'ar')
      lines.push(
        '\n🚚 عادةً التوصيل في تونس خلال **24–48 ساعة** بعد تجهيز الطلب. للتفاصيل الدقيقة استخدم صفحة **تتبع**.'
      );
    else if (safeLang === 'en')
      lines.push(
        '\n🚚 Delivery in Tunisia is often **24–48h** once Everest has prepared your package. Use **Track** for step-by-step updates.'
      );
    else
      lines.push(
        '\n🚚 En Tunisie, la livraison suit souvent un délai de **24–48h** une fois la commande préparée. Utilisez **Suivi** pour le détail.'
      );

    return lines.join('\n');
  }

  /**
   * Text block appended to Yasmine's system prompt — real data from this browser session only.
   */
  function appendCatalogLines(lines, userMsg, st) {
    var prods = loadProductsArray(st);
    var cats = typeof STN !== 'undefined' && STN.PRODUCT_CATEGORIES ? STN.PRODUCT_CATEGORIES : [];
    if (cats.length) {
      lines.push(
        'Shop categories (slugs): ' +
          cats
            .map(function (c) {
              return (c.slug || '') + '=' + (c.label || c.name || '');
            })
            .join('; ')
      );
    }
    if (!prods.length) {
      lines.push(
        'CATALOG_ON_DEVICE: empty (not loaded in this browser). Do NOT claim an item is unavailable — say you cannot see live inventory here; ask user to open Collections or refresh the page.'
      );
      return;
    }
    lines.push('CATALOG_ON_DEVICE: ' + prods.length + ' product(s) visible here — treat listed names as proof Everest shows them on this device.');
    var matched = collectRelevantProducts(userMsg, prods);
    if (matched.length) {
      lines.push('MATCHED_PRODUCTS_FOR_THIS_QUESTION (use these first; user likely asked about one of these):');
      matched.slice(0, 18).forEach(function (p) {
        lines.push(
          '- ' +
            (p.name || 'Item') +
            ' | id:' +
            (p.id != null ? p.id : '—') +
            ' | ~' +
            (p.price != null ? p.price : '?') +
            ' TND | cat:' +
            (p.category || '—')
        );
      });
    }
    var maxNames = 100;
    var nameBits = prods.slice(0, maxNames).map(function (p) {
      var nm = p.name || 'Item';
      return p.price != null ? nm + ' (' + p.price + ' TND)' : nm;
    });
    lines.push('ALL_VISIBLE_NAMES: ' + nameBits.join(' | '));
    if (prods.length > maxNames) {
      lines.push('(... +' + (prods.length - maxNames) + ' more products on site — Collections has the full list)');
    }
  }

  function buildYasmineContext(userMsg) {
    var lines = [];
    var st = getState();
    if (!st) {
      lines.push('(Everest app state not linked — order lookup unavailable.)');
      appendCatalogLines(lines, userMsg, null);
      return lines.join('\n');
    }

    var u = st.currentUser;
    if (u) {
      lines.push(
        'Signed-in: role=' +
          (u.role || 'customer') +
          ', user_id=' +
          (u.id != null ? u.id : '?') +
          ', display_name=' +
          (u.first_name || u.firstName || u.shop_name || u.shopName || '')
      );
    } else {
      lines.push('Not signed in. For personal order status, ask the user to sign in or paste their tracking number (STN-…).');
    }

    var pack = collectRelevantOrders(userMsg);
    var relevant = pack.relevant;

    if (relevant.length === 0) {
      lines.push(
        'No orders matched in local session (user id or STN- code). Orders created on another device may not appear until the user opens Track or signs in here.'
      );
    } else {
      lines.push('Relevant orders (use ONLY these facts; do not invent dates):');
      relevant.slice(0, 10).forEach(function (o) {
        var tr = o.tracking_number || o.id;
        var stLabel = statusHint(o.status);
        lines.push(
          '- ' +
            tr +
            ' | status: ' +
            stLabel +
            ' | total: ' +
            (o.total != null ? o.total : o.amount || 0) +
            ' TND | wilaya: ' +
            (o.wilaya || '—') +
            ' | created: ' +
            (o.created_at || o.date || '—')
        );
        if (o.delivery_deadline_at) {
          lines.push('  internal_target_time: ' + o.delivery_deadline_at + ' (reference only — not a customer promise)');
        }
      });
    }

    appendCatalogLines(lines, userMsg, st);

    if (u && u.role === 'vendor') {
      lines.push(
        'Vendor reminder: blind shipping — you never receive customer name/phone/address; only order id + line items. Listings must be brand-new items only; images must match the product (WYSIWYG).'
      );
    }

    return lines.join('\n');
  }

  /**
   * Deterministic policy gate before Supabase product insert. Blocks obvious violations; does not replace human/admin review.
   */
  function checkVendorListingPolicy(title, desc) {
    var text = (String(title || '') + ' ' + String(desc || '')).toLowerCase();
    var reasons = [];

    function add(code, severity, message) {
      reasons.push({ code: code, severity: severity, message: message });
    }

    // Medical / pharmacy (multi-language hints)
    if (
      /\b(pharmaceutical|prescription|rx\b|antibiotic|insulin|viagra|tramadol|xanax|steroid|injectable|cbd\s*oil|melatonin\s*pill|doxycycline)\b/i.test(text) ||
      /\b(medicine|medication|pills?\s+for|tablets?\s+for\s+(pain|sleep|weight)|health\s+supplement|diet\s+pill)\b/i.test(text) ||
      /(دواء|أدوية|صيدلية|حبوب\s+دواء|مكمل\s+غذائي|فيتامين\s+علاجي|هرمون)/.test(text) ||
      /\b(m[ée]dicament|pharmacie|ordonnance|comprim[ée]s?\s+(pour|de)|gélules?\s+médic)/i.test(text)
    ) {
      add('medical', 'block', 'Medical/pharmacy-style listings are not allowed on Everest.');
    }

    // Used / refurbished (new only)
    if (
      /\b(used|second[-\s]?hand|pre[-\s]?loved|refurbished|reconditioned|occasion\b|d['’]occasion|état\s+occasion)\b/i.test(text) ||
      /(مستعمل|مستعملة|بالة|second\s*main)/.test(text)
    ) {
      add('used', 'block', 'Only brand-new items may be listed; used or refurbished goods are prohibited.');
    }

    // Weapons / dangerous (high-confidence phrases)
    if (
      /\b(firearm|handgun|rifle|ammunition|ammo\b|taser|stun\s*gun|grenade|explosive\s+material)\b/i.test(text) ||
      /\b(arme\s+à\s+feu|pistolet|fusil|munitions|bombe)\b/i.test(text) ||
      /(سلاح\s+ناري|مسدس|رصاص|ذخيرة)/.test(text)
    ) {
      add('weapons', 'block', 'Weapons and dangerous items are prohibited under Everest rules and Tunisian law.');
    }

    // Illegal substances (obvious)
    if (/\b(cocaine|heroin|methamphetamine|lsd\b|ecstasy\s*pills)\b/i.test(text)) {
      add('drugs', 'block', 'Illegal substances cannot be listed.');
    }

    var blocked = reasons.some(function (r) {
      return r.severity === 'block';
    });

    return {
      ok: !blocked,
      blocked: blocked,
      reasons: reasons,
    };
  }

  window.EverestYasmineContext = {
    build: buildYasmineContext,
    getState: getState,
    tryLocalAnswer: tryLocalAnswer,
    collectRelevantOrders: collectRelevantOrders,
  };

  window.EverestListingPolicy = {
    check: checkVendorListingPolicy,
  };
})();
