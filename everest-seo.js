/**
 * Everest — default SEO: canonical, Open Graph, JSON-LD (Organization + WebSite),
 * and optional Product schema when a PDP modal is open.
 * Override base URL: <script>window.__EVEREST_SITE_ORIGIN__='https://your.domain';</script> before this file.
 */
(function (global) {
  'use strict';

  var DEFAULT_TITLE = 'Everest — Hit Your Dreams | Tunisia';

  function origin() {
    if (global.__EVEREST_SITE_ORIGIN__) {
      return String(global.__EVEREST_SITE_ORIGIN__).replace(/\/$/, '');
    }
    try {
      return String(global.location.origin || '').replace(/\/$/, '');
    } catch (e) {
      return '';
    }
  }

  function abs(path) {
    var o = origin();
    if (!path) return o || '';
    if (/^https?:\/\//i.test(path)) return path;
    if (!o) return path;
    return o + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function removeEl(id) {
    var el = global.document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function setMeta(key, content, isProperty) {
    if (content == null || content === '') return;
    var sel = isProperty ? 'meta[property="' + key + '"]' : 'meta[name="' + key + '"]';
    var m = global.document.querySelector(sel);
    if (!m) {
      m = global.document.createElement('meta');
      if (isProperty) m.setAttribute('property', key);
      else m.setAttribute('name', key);
      global.document.head.appendChild(m);
    }
    m.setAttribute('content', content);
  }

  function injectDefaults() {
    var doc = global.document;
    if (!doc || !doc.head) return;
    var o = origin();
    var pageUrl = '';
    try {
      pageUrl = global.location.href.split('#')[0];
    } catch (e2) {
      pageUrl = o ? o + '/' : '';
    }
    if (pageUrl) {
      var link = doc.querySelector('link[rel="canonical"]');
      if (!link) {
        link = doc.createElement('link');
        link.setAttribute('rel', 'canonical');
        doc.head.appendChild(link);
      }
      link.setAttribute('href', pageUrl);
    }
    setMeta('og:url', pageUrl, true);
    setMeta('og:type', 'website', true);
    setMeta('og:site_name', 'Everest', true);
    setMeta('og:locale', 'en_US', true);
    setMeta('twitter:card', 'summary_large_image', false);
    setMeta('twitter:title', doc.title || DEFAULT_TITLE, false);
    var descEl = doc.querySelector('meta[name="description"]');
    var desc = descEl ? descEl.getAttribute('content') || '' : '';
    setMeta('og:description', desc, true);
    setMeta('twitter:description', desc, false);
    var logo = abs('/assets/everest-logo.png');
    setMeta('og:image', logo, true);
    setMeta('twitter:image', logo, false);

    removeEl('jsonld-org');
    var s = doc.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'jsonld-org';
    var org = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Everest',
      url: (o || pageUrl || '') + (o ? '/' : ''),
      logo: logo,
      description: desc,
    };
    var site = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Everest',
      url: (o || pageUrl || '') + (o ? '/' : ''),
    };
    s.textContent = JSON.stringify([org, site]);
    doc.head.appendChild(s);
  }

  function stripHtml(html, d) {
    var s = String(html || '');
    var tmp = d && d.createElement ? d.createElement('div') : null;
    if (tmp) {
      tmp.innerHTML = s;
      s = tmp.textContent || tmp.innerText || '';
    } else {
      s = s.replace(/<[^>]+>/g, ' ');
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  function setProduct(p) {
    var doc = global.document;
    if (!doc || !doc.head || !p) return;
    removeEl('jsonld-product');
    var img = p.image || p.image_url || (Array.isArray(p.images) && p.images[0]) || '';
    var imgAbs = img ? abs(img) : '';
    var name = String(p.name != null ? p.name : 'Product');
    var rawDesc = p.desc != null ? p.desc : p.description != null ? p.description : '';
    var desc = stripHtml(rawDesc, doc).slice(0, 500);
    var pid = String(p.id != null ? p.id : '');
    var price = Number(p.price);
    var pageUrl = '';
    try {
      pageUrl = global.location.href.split('#')[0];
    } catch (e3) {
      pageUrl = '';
    }
    var s = doc.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'jsonld-product';
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      description: desc,
      sku: pid,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TND',
        price: Number.isFinite(price) ? String(price) : '0',
        availability: 'https://schema.org/InStock',
        url: pageUrl,
      },
    };
    if (imgAbs) schema.image = [imgAbs];
    s.textContent = JSON.stringify(schema);
    doc.head.appendChild(s);

    var t = name + ' | Everest';
    doc.title = t;
    setMeta('og:title', t, true);
    setMeta('twitter:title', t, false);
    setMeta('og:description', desc.slice(0, 200), true);
    setMeta('twitter:description', desc.slice(0, 200), false);
    if (imgAbs) {
      setMeta('og:image', imgAbs, true);
      setMeta('twitter:image', imgAbs, false);
    }
  }

  function clearProduct() {
    var doc = global.document;
    if (!doc) return;
    removeEl('jsonld-product');
    doc.title = DEFAULT_TITLE;
    setMeta('og:title', DEFAULT_TITLE, true);
    setMeta('twitter:title', DEFAULT_TITLE, false);
    var descEl = doc.querySelector('meta[name="description"]');
    var desc = descEl ? descEl.getAttribute('content') || '' : '';
    setMeta('og:description', desc, true);
    setMeta('twitter:description', desc, false);
    var logo = abs('/assets/everest-logo.png');
    setMeta('og:image', logo, true);
    setMeta('twitter:image', logo, false);
  }

  global.EverestSEO = {
    origin: origin,
    injectDefaults: injectDefaults,
    setProduct: setProduct,
    clearProduct: clearProduct,
  };
})(typeof window !== 'undefined' ? window : this);
