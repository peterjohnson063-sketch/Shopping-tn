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
      pending: 'waiting for seller confirmation',
      confirmed: 'confirmed — being prepared',
      processing: 'being prepared at the shop',
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
      pending: 'waiting for seller confirmation',
      confirmed: 'confirmed — being prepared',
      processing: 'being prepared at the shop',
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
      processing: 'en préparation chez le vendeur',
      ready: 'prête pour le livreur',
      out_for_delivery: 'en cours de livraison',
      shipped: 'en route',
      transit: 'en transit',
      delivered: 'livrée',
      canceled: 'annulée',
    };
    var ar = {
      pending: 'بانتظار تأكيد البائع',
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

    // Smartphones / electronics (Everest is crafts marketplace)
    if (
      /\biphone\b|\bipad\b|smartphone|smart\s*phone|android\s*phone|google\s*pixel|galaxy\s*s\d|\bphones\b|mobile\s*phone|cell\s*phone|هاتف\s*ذكي|آيفون|أندرويد|تبيعو\s*ف\s*تيليفونات/i.test(
        lower
      )
    ) {
      if (safeLang === 'ar')
        return '📱 Everest متخصصة في الحرف والديكور التونسي (أثاث، سيراميك، إنارة…). لا نبيع الهواتف أو الإلكترونيات الاستهلاكية. تصفح «المجموعات» لرؤية منتجاتنا الحرفية!';
      if (safeLang === 'en')
        return '📱 Everest focuses on Tunisian crafts & home (furniture, ceramics, lighting…). We don’t sell smartphones or consumer electronics. Open **Collections** to browse real artisan products!';
      return '📱 Everest, c’est l’artisanat & la maison tunisienne (meubles, céramique, luminaires…). Pas de smartphones / électronique grand public. Ouvrez **Collections** pour voir le catalogue !';
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
        '\n🚚 Delivery in Tunisia is often **24–48h** once the seller has prepared the package. Use **Track** for step-by-step updates.'
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
  function buildYasmineContext(userMsg) {
    var lines = [];
    var st = getState();
    if (!st) {
      lines.push('(Everest app state not linked — order lookup unavailable.)');
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
          (u.first_name || u.firstName || u.shop_name || u.shopName || '') +
          ', email=' +
          (u.email || 'n/a')
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

    var prods = Array.isArray(st.products) && st.products.length ? st.products : [];
    if (prods.length === 0 && typeof STN !== 'undefined' && STN.DB && typeof STN.DB.get === 'function') {
      var dbP2 = STN.DB.get('products');
      if (Array.isArray(dbP2) && dbP2.length) prods = dbP2;
    }
    if (prods.length) {
      var sample = prods
        .slice(0, 15)
        .map(function (p) {
          return (p.name || 'Product') + ' ~' + (p.price != null ? p.price : '?') + ' TND';
        })
        .join(' · ');
      lines.push('Sample catalog on this device: ' + sample);
    }

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
