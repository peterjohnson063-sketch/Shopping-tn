// ── YASMINE AI ASSISTANT ──

var TRANSLATIONS={
  en:{
    'nav-home':'Home','nav-products':'Shop','nav-carpenter':'Custom Furniture',
    'nav-track':'Track','nav-loyalty':'Rewards','nav-about':'About','nav-about-vendor':'Rules for Vendors','signin-btn':'Sign In',
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
    'about-label':'Our Story','about-title':'About Everest',
    'add-cart':'Add to Cart','view-all':'View All','shop-now':'Shop Now',
    'sign-in':'Sign In','create-account':'Create Account','logout':'Sign Out',
    'nav-cart':'Cart','nav-me':'Me',
    'nav-deliver-to':'Deliver to','nav-returns':'Returns',
    'vr-badge':'📜 Everest','vr-title':'Official Rules & Regulations',
    'vr-intro':'These rules apply to all vendors and factories selling on Everest. Violations may result in warnings, suspension, or a permanent ban.',
    'vr-s1-h':'Section 1: Strict Prohibitions (Zero Tolerance)',
    'vr-s1-1-l':'Anti-Zionist Policy:','vr-s1-1-t':'Strictly prohibited to list any products, books, symbols, or materials supporting the Zionist entity. Violation results in an immediate and permanent ban.',
    'vr-s1-2-l':'Ethical Standards:','vr-s1-2-t':'Prohibited to sell items promoting deviance, immoral behavior, or content that contradicts local cultural and ethical values.',
    'vr-s1-3-l':'No Medical Products:','vr-s1-3-t':'Selling pharmaceuticals, medicines, hormones, or health supplements is strictly forbidden. Everest is not a pharmacy.',
    'vr-s1-4-l':'No Used Items (New Only):','vr-s1-4-t':'Everest is a marketplace for Brand New items only. Selling used or refurbished goods is strictly prohibited and will lead to account termination after investigation.',
    'vr-s1-5-l':'Legal Compliance:','vr-s1-5-t':'Strictly prohibited to sell weapons, dangerous chemicals, illegal substances, or any item restricted by Tunisian Law.',
    'vr-s2-h':'Section 2: Real-Time Logistics (Everest Speed)',
    'vr-s2-1-l':'Instant Dispatch Readiness:','vr-s2-1-t':'Once a vendor receives the "Driver is Approaching" notification, the order must be packed and ready for immediate pickup. Zero waiting time for the driver is expected.',
    'vr-s2-2-l':'Professional Packaging:','vr-s2-2-t':'Vendors/Factories are responsible for secure packaging. Everest is not liable for damages caused by poor or fragile packaging from the source.',
    'vr-s2-3-l':'Visual Accuracy (WYSIWYG):','vr-s2-3-t':'The product image must be a 100% match with the actual item. Any discrepancy in color, model, or quality is considered a violation of trust.',
    'vr-s3-h':'Section 3: Data Privacy & Security (The "Blind" Flow)',
    'vr-s3-1-l':'Customer Privacy (Blind Shipping):','vr-s3-1-t':'Vendors/Factories have ZERO access to customer personal data (No name, No phone, No address). They only receive the "Order ID" and "Product Details" for preparation.',
    'vr-s3-2-l':'Driver Access Control:','vr-s3-2-t':'Drivers only receive the necessary delivery info (Name, Phone Number, and GPS Location). All other customer data remains encrypted and hidden within the Everest system.',
    'vr-s3-3-l':'Verified Reviews Only:','vr-s3-3-t':'Rating or reviewing a product is only possible after a successful purchase and delivery. This prevents fraud and fake ratings.',
    'prod-eyebrow':'All products','prod-h1':'Our Collections','prod-amz-shop-by':'Shop by department','prod-amz-department':'Department','prod-filters':'Filters','prod-clear':'Clear','prod-categories':'Categories',
    'prod-cat-all':'All Products','prod-cat-furniture':'Furniture','prod-cat-lighting':'Lighting','prod-cat-decor':'Decor','prod-cat-ceramics':'Ceramics','prod-cat-bedroom':'Bedroom','prod-cat-outdoor':'Outdoor','prod-cat-fragrance':'Fragrance',
    'prod-price':'Price Range','prod-min':'Min','prod-max':'Max','prod-search-ph':'Search by name, material, artisan, or region…','prod-search-btn':'Search',
    'sm-hero-badge':'Custom configurator · Made to order','sm-hero-h1a':'Your furniture,','sm-hero-h1b':'Your vision','sm-hero-desc':'Configure like IKEA: clean lines, live preview, custom dimensions and finishes — Everest.',
    'sm-st-weeks':'Weeks','sm-st-oak':'Solid oak','sm-st-warranty':'Year warranty','sm-st-reply':'Reply',
    'sm-eyebrow-piece':'Choose a piece','sm-h2-oak':'Our oak designs','sm-studio-desc':'Everest Studio: minimal style, premium materials, precise personalization.',
    'sm-cat-lbl':'Everest catalog','sm-cat-h3':'Browse rows IKEA-style','sm-request-custom':'Request custom project','sm-coll-eyebrow':'Everest collection','sm-coll-h2':'Click a product to open the configurator',
    'sm-back':'← Back to catalog','sm-toolbar-hint':'Customize · Everest Sur Mesure','sm-cfg-eyebrow':'Customize','sm-cfg-h2':'Change dimensions, colors and details','sm-delivery-step':'Delivered in 2 weeks','sm-view':'View','sm-customize':'Customize','sm-from':'From','sm-personalize-short':'Personalize',
    'prod-mobile-filters':'Filters','prod-rating-h':'Customer Rating','prod-rating-up':'& Up','prod-avail-h':'Availability','prod-in-stock':'✅ In Stock','prod-out-stock':'⏳ Out of Stock','prod-offers-h':'Special Offers','prod-free-ship':'🚚 Free Shipping','prod-on-sale':'🏷️ On Sale','prod-sort-by':'Sort by:','prod-sort-featured':'Featured','prod-sort-price-low':'Price: Low to High','prod-sort-price-high':'Price: High to Low','prod-sort-rating':'Customer Rating',    'prod-sort-newest':'Newest Arrivals','prod-results':'results',
    'prod-idle-eyebrow':'Everest atelier','prod-idle-title':'Search the collection','prod-idle-sub':'Type a name, material, region, or maker. Filters appear when your search or category is active — we do not show random inventory.','prod-no-match':'No pieces match. Try another phrase or clear filters.',
    'sm-label-min':'min','sm-label-max':'max','sm-units-cm':'cm','sm-dim-width':'Width','sm-dim-depth':'Depth','sm-dim-height':'Height','sm-teinte-hdr':'🎨 Oak finish tone','sm-selected-prefix':'Selected:','sm-estimated-badge':'Est. price','sm-dim-hdr':'📐 Dimensions','sm-dim-sub':'(limits set by Everest)','sm-locked-hdr':'🔒 Fixed by Everest quality standard','sm-summary-hdr':'Configuration summary','sm-base-price-lbl':'Base price','sm-dim-extra-lbl':'Dimension adjustment','sm-total-est-lbl':'Estimated total','sm-price-footnote':'* Final price confirmed by the Everest team within 24h','sm-add-cart':'🛒 Add to cart','sm-blender-btn':'✨ Customize (Blender)','sm-save-cfg':'💾 Save','sm-save-toast':'Configuration saved','sm-success-title':'Added to cart!','sm-success-sub':'The Everest team will confirm within 24h','sm-cf-close':'Close ✕','sm-cf-h3':'Customize your special furniture','sm-cf-intro':'Send your own model (Blender/3D file), color palette, dimensions and details. Our Everest team will prepare your quote.','sm-cf-name':'Full name *','sm-cf-phone':'Phone *','sm-cf-email':'Email *','sm-cf-type':'Furniture type *','sm-cf-type-ph':'Chair, table, wardrobe...','sm-cf-width':'Width (cm) *','sm-cf-depth':'Depth (cm) *','sm-cf-height':'Height (cm) *','sm-cf-color':'Preferred color / finish *','sm-cf-color-ph':'Oak dark, matte black...','sm-cf-notes':'Material / style notes *','sm-cf-notes-ph':'Any details: wood type, drawers, legs, handle style...','sm-cf-upload':'Upload your model / references *','sm-cf-nofile':'No file selected','sm-cf-selected-prefix':'Selected:','sm-cf-submit-note':'By submitting, your request is sent to Everest team for manual quote review.','sm-cf-submit':'Accept & request quote','sm-cf-sending':'Sending request...','sm-cf-ok-msg':'✅ Request received. Please wait for the devis to be ready so you can know the final price.','sm-cf-toast':'Request sent. Please wait for the quote.','sm-thumb-title':'Image',
    'sm-hiw-eyebrow':'How it works','sm-hiw-h2':'Simple as it gets','sm-hiw-s1t':'Choose','sm-hiw-s1d':'Pick a model from our catalog','sm-hiw-s2t':'Configure','sm-hiw-s2d':'Adjust dimensions and finish','sm-hiw-s3t':'Order','sm-hiw-s3d':'Quote confirmed within 24h','sm-hiw-s4t':'Delivery',
    'track-h1':'Track your order','track-empty-msg':'Enter your order ID above to track your shipment in real time.','track-try':'Try:',
    'wish-eyebrow':'Wishlist','wish-h1':'Your wishlist',
    'gift-back':'← Back to shopping','gift-eyebrow':'Gift','gift-h1':'Send a gift','gift-desc':'Tell us who receives the delivery. You will pay on the next step.',
    'loy-h1':'Loyalty Rewards','loy-how':'How it works:','loy-pt1':'1 TND spent = 1 point','loy-pt2':'100 points = 1 TND off','loy-cta':'Start earning points →',
    'ab-eyebrow':'Our story','ab-h1':'About Everest','ab-lead':'Born in the heart of Tunisia\'s Sahel region, Everest was created to connect the world with the extraordinary craftsmanship of Monastir, Ksar Hellal, and beyond.',
    'ab-miss-k':'Our mission','ab-miss-h':'Sahel to the world',
    'home-hero-h1a':'Authentic','home-hero-h1b':'Tunisian','home-hero-h1c':'Craftsmanship','home-hero-lead':'From Monastir\'s master craftsmen to your door — handcrafted with tradition','home-hero-shop':'Shop Now →','home-hero-custom':'Custom Furniture','home-cat-all':'All','home-cat-sofa':'Sofas','home-cat-rug':'Rugs','home-cat-lighting':'Lighting','home-cat-ceramic':'Ceramics','home-cat-bedroom':'Bedroom','home-cat-outdoor':'Outdoor','home-cat-fragrance':'Fragrance','home-cat-custom':'Custom','home-flash-badge':'⚡ FLASH SALE','home-flash-offer':'Up to 40% OFF — Today Only!','home-flash-ends':'Ends in:','home-trust-freeship':'500+ TND · free delivery','home-trust-checkout':'Secure checkout','home-trust-logistics':'Tracked logistics nationwide','home-dept-head':'Shop by department','home-dept-sub':'Full-scale catalog — furniture, décor, lighting, bedroom & more.','home-dept-all':'Full catalog','home-dept-furniture':'Furniture & seating','home-dept-decor':'Rugs & décor','home-dept-ceramics':'Dining & ceramics','home-dept-lighting':'Lighting','home-dept-outdoor':'Garden & outdoor','home-dept-fragrance':'Fragrance','home-dept-custom':'Made to order','home-room-head':'Shop by space','home-room-living':'Living room','home-room-dining':'Dining','home-room-office':'Office · décor','home-room-garden':'Garden','home-deals-head':'Trending picks','home-deals-sub':'Spotlight from the live catalog — tap a tile for full specs.','home-picks-head':'Editor’s picks','home-best-head':'Customer favourites','home-new-head':'Just landed','home-see-all-cats':'Browse all categories →','home-trendy-title':'Trendy products','home-trendy-sub':'Hot right now on Everest — tap a tile for details.','home-trendy-see':'See all →','home-trendy-empty':'No listings yet — check back soon.','home-new-products-title':'New products','home-new-products-see':'See all →','home-new-products-empty':'No new arrivals yet.','home-chips-hint':'Quick category chips','home-promo-sofa-eyebrow':'Living room','home-promo-sofa-title':'Sofas & solid wood','home-promo-sofa-cta':'Shop the line →','home-promo-rug-eyebrow':'Handwoven','home-promo-rug-title':'Rugs & textiles','home-promo-rug-cta':'See collection →','home-promo-custom-eyebrow':'Sur Mesure','home-promo-custom-title':'Your dimensions & finish','home-promo-custom-cta':'Open configurator →','home-artisan-eyebrow':'The makers','home-artisan-title':'Sahel workshops on Everest','home-artisan-body':'Verified artisans · privacy-first logistics.','home-artisan-cta':'Our story →','home-trust-delivery-title':'Free delivery','home-trust-delivery-sub':'500 TND+ orders','home-trust-returns-title':'30-day returns','home-trust-returns-sub':'Policy at checkout','home-trust-artisan-title':'Verified sellers','home-trust-artisan-sub':'Authentic TN supply','home-trust-pay-title':'Flexible checkout','home-trust-pay-sub':'COD + online','sm-badge-signature':'Everest Signature Collection','sm-badge-quality':'✓ Everest Quality','sm-card-studio':'Everest Design Studio','sm-card-team':'Everest Studio Team','sm-card-curated':'Curated by Everest','sm-card-blurb':'Premium finish · Secure logistics · Verified quality','sm-tag-quality':'✓ Quality checked','sm-tag-precision':'📐 Precision fit','sm-tag-delivery':'🚚 Delivery included'
  },
  fr:{
    'nav-home':'Accueil','nav-products':'Boutique','nav-carpenter':'Sur Mesure',
    'nav-track':'Suivi','nav-loyalty':'Recompenses','nav-about':'A Propos','nav-about-vendor':'Règles vendeurs','signin-btn':'Connexion',
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
    'nav-cart':'Panier','nav-me':'Compte',
    'nav-deliver-to':'Livrer à','nav-returns':'Retours',
    'vr-badge':'📜 Everest','vr-title':'Règlement officiel — règles et directives',
    'vr-intro':'Ces règles s\'appliquent à tous les vendeurs et usines sur Everest. Tout manquement peut entraîner un avertissement, une suspension ou une exclusion définitive.',
    'vr-s1-h':'Section 1 : Interdictions strictes (tolérance zéro)',
    'vr-s1-1-l':'Politique anti-sioniste :','vr-s1-1-t':'Il est strictement interdit de référencer des produits, livres, symboles ou contenus soutenant l\'entité sioniste. Toute violation entraîne une exclusion immédiate et définitive.',
    'vr-s1-2-l':'Normes d\'éthique :','vr-s1-2-t':'Il est interdit de vendre des articles favorisant la déviance, des comportements immoraux ou tout contenu contraire aux valeurs culturelles et éthiques locales.',
    'vr-s1-3-l':'Pas de produits médicaux :','vr-s1-3-t':'La vente de médicaments, hormones, compléments alimentaires ou produits de santé est strictement interdite. Everest n\'est pas une pharmacie.',
    'vr-s1-4-l':'Pas d\'occasion (neuf uniquement) :','vr-s1-4-t':'Everest est une marketplace réservée aux articles neufs uniquement. La vente d\'articles d\'occasion ou reconditionnés est interdite et peut entraîner la clôture du compte après enquête.',
    'vr-s1-5-l':'Conformité légale :','vr-s1-5-t':'Il est strictement interdit de vendre des armes, produits chimiques dangereux, substances illégales ou tout article interdit par le droit tunisien.',
    'vr-s2-h':'Section 2 : Logistique temps réel (vitesse Everest)',
    'vr-s2-1-l':'Préparation immédiate :','vr-s2-1-t':'Dès la notification « Le livreur approche », la commande doit être emballée et prête à être récupérée sans délai. Aucune attente du livreur n\'est acceptée.',
    'vr-s2-2-l':'Emballage professionnel :','vr-s2-2-t':'Les vendeurs et usines sont responsables d\'un emballage sécurisé. Everest décline toute responsabilité en cas de dommages liés à un emballage insuffisant à l\'expédition.',
    'vr-s2-3-l':'Conformité visuelle (WYSIWYG) :','vr-s2-3-t':'L\'image du produit doit correspondre à 100 % à l\'article réel. Toute divergence de couleur, modèle ou qualité est une rupture de confiance.',
    'vr-s3-h':'Section 3 : Confidentialité et sécurité des données (flux « aveugle »)',
    'vr-s3-1-l':'Vie privée des clients (expédition aveugle) :','vr-s3-1-t':'Les vendeurs et usines n\'ont AUCUN accès aux données personnelles des clients (pas de nom, téléphone ni adresse). Ils ne reçoivent que l\'identifiant de commande et le détail des produits à préparer.',
    'vr-s3-2-l':'Accès contrôlé pour les livreurs :','vr-s3-2-t':'Les livreurs ne reçoivent que les informations nécessaires à la livraison (nom, téléphone, position GPS). Les autres données restent chiffrées et invisibles dans le système Everest.',
    'vr-s3-3-l':'Avis vérifiés uniquement :','vr-s3-3-t':'Noter ou commenter un produit n\'est possible qu\'après un achat et une livraison réussis, afin d\'éviter la fraude et les faux avis.',
    'prod-eyebrow':'Tous les produits','prod-h1':'Nos collections','prod-amz-shop-by':'Rayons','prod-amz-department':'Rayon','prod-filters':'Filtres','prod-clear':'Effacer','prod-categories':'Catégories',
    'prod-cat-all':'Tous les produits','prod-cat-furniture':'Meubles','prod-cat-lighting':'Luminaires','prod-cat-decor':'Décoration','prod-cat-ceramics':'Céramiques','prod-cat-bedroom':'Chambre','prod-cat-outdoor':'Extérieur','prod-cat-fragrance':'Parfums',
    'prod-price':'Fourchette de prix','prod-min':'Min','prod-max':'Max','prod-search-ph':'Rechercher par nom, matière, artisan ou région…','prod-search-btn':'Rechercher',
    'sm-hero-badge':'Configurateur sur mesure','sm-hero-h1a':'Votre meuble,','sm-hero-h1b':'votre vision','sm-hero-desc':'Comme chez IKEA : lignes épurées, aperçu en direct, dimensions et finitions sur mesure — Everest.',
    'sm-st-weeks':'Semaines','sm-st-oak':'Chêne massif','sm-st-warranty':'Garantie','sm-st-reply':'Réponse',
    'sm-eyebrow-piece':'Choisir une pièce','sm-h2-oak':'Nos pièces en chêne','sm-studio-desc':'Studio Everest : style minimal, matériaux premium, personnalisation précise.',
    'sm-cat-lbl':'Catalogue Everest','sm-cat-h3':'Parcourir en lignes, style IKEA','sm-request-custom':'Demander un projet sur mesure','sm-coll-eyebrow':'Collection Everest','sm-coll-h2':'Cliquez sur un produit pour ouvrir le configurateur',
    'sm-back':'← Retour au catalogue','sm-toolbar-hint':'Personnaliser · Everest Sur Mesure','sm-cfg-eyebrow':'Personnaliser','sm-cfg-h2':'Modifiez dimensions, couleurs et détails','sm-delivery-step':'Livré en 2 semaines','sm-view':'Voir','sm-customize':'Personnaliser','sm-from':'À partir de','sm-personalize-short':'Personnaliser',
    'prod-mobile-filters':'Filtres','prod-rating-h':'Avis clients','prod-rating-up':'et +','prod-avail-h':'Disponibilité','prod-in-stock':'✅ En stock','prod-out-stock':'⏳ Rupture','prod-offers-h':'Offres spéciales','prod-free-ship':'🚚 Livraison gratuite','prod-on-sale':'🏷️ Promo','prod-sort-by':'Trier par :','prod-sort-featured':'En vedette','prod-sort-price-low':'Prix croissant','prod-sort-price-high':'Prix décroissant','prod-sort-rating':'Avis clients',    'prod-sort-newest':'Nouveautés','prod-results':'résultats',
    'prod-idle-eyebrow':'Atelier Everest','prod-idle-title':'Parcourir la collection','prod-idle-sub':'Saisissez un nom, matière, région ou artisan. Les filtres s\'affichent dès qu\'une recherche ou un rayon est actif — pas de catalogue au hasard.','prod-no-match':'Aucun article ne correspond. Essayez un autre terme ou réinitialisez.',
    'sm-label-min':'min','sm-label-max':'max','sm-units-cm':'cm','sm-dim-width':'Largeur','sm-dim-depth':'Profondeur','sm-dim-height':'Hauteur','sm-teinte-hdr':'🎨 Teinte du chêne','sm-selected-prefix':'Sélectionné :','sm-estimated-badge':'Prix estimé','sm-dim-hdr':'📐 Dimensions','sm-dim-sub':'(limites fixées par Everest)','sm-locked-hdr':'🔒 Fixé par le standard qualité Everest','sm-summary-hdr':'Résumé de configuration','sm-base-price-lbl':'Prix de base','sm-dim-extra-lbl':'Ajustement dimensions','sm-total-est-lbl':'Total estimé','sm-price-footnote':'* Prix final confirmé par l’équipe Everest sous 24h','sm-add-cart':'🛒 Ajouter au panier','sm-blender-btn':'✨ Personnaliser (Blender)','sm-save-cfg':'💾 Sauvegarder','sm-save-toast':'Configuration enregistrée','sm-success-title':'Ajouté au panier !','sm-success-sub':'L’équipe Everest confirmera sous 24h','sm-cf-close':'Fermer ✕','sm-cf-h3':'Personnalisez votre meuble sur mesure','sm-cf-intro':'Envoyez votre modèle (Blender/3D), palette de couleurs, dimensions et détails. Notre équipe prépare votre devis.','sm-cf-name':'Nom complet *','sm-cf-phone':'Téléphone *','sm-cf-email':'E-mail *','sm-cf-type':'Type de meuble *','sm-cf-type-ph':'Chaise, table, armoire...','sm-cf-width':'Largeur (cm) *','sm-cf-depth':'Profondeur (cm) *','sm-cf-height':'Hauteur (cm) *','sm-cf-color':'Couleur / finition *','sm-cf-color-ph':'Chêne foncé, noir mat...','sm-cf-notes':'Notes matériau / style *','sm-cf-notes-ph':'Détails : bois, tiroirs, pieds, poignées...','sm-cf-upload':'Modèle / références *','sm-cf-nofile':'Aucun fichier','sm-cf-selected-prefix':'Sélection :','sm-cf-submit-note':'En envoyant, votre demande part à l’équipe Everest pour un devis manuel.','sm-cf-submit':'Accepter et demander le devis','sm-cf-sending':'Envoi...','sm-cf-ok-msg':'✅ Demande reçue. Merci d’attendre le devis pour connaître le prix final.','sm-cf-toast':'Demande envoyée. Merci d’attendre le devis.','sm-thumb-title':'Image',
    'sm-hiw-eyebrow':'Comment ça marche','sm-hiw-h2':'Simple comme bonjour','sm-hiw-s1t':'Choisir','sm-hiw-s1d':'Sélectionnez votre meuble parmi nos modèles','sm-hiw-s2t':'Configurer','sm-hiw-s2d':'Ajustez dimensions et teinte','sm-hiw-s3t':'Commander','sm-hiw-s3d':'Devis confirmé sous 24h','sm-hiw-s4t':'Livraison',
    'track-h1':'Suivez votre commande','track-empty-msg':'Entrez votre numéro de commande ci-dessus pour suivre votre envoi en temps réel.','track-try':'Essai :',
    'wish-eyebrow':'Liste d\'envies','wish-h1':'Votre liste d\'envies',
    'gift-back':'← Retour aux achats','gift-eyebrow':'Cadeau','gift-h1':'Offrir un cadeau','gift-desc':'Indiquez qui reçoit la livraison. Vous paierez à l\'étape suivante.',
    'loy-h1':'Récompenses fidélité','loy-how':'Comment ça marche :','loy-pt1':'1 TND dépensé = 1 point','loy-pt2':'100 points = 1 TND de remise','loy-cta':'Commencer à cumuler →',
    'ab-eyebrow':'Notre histoire','ab-h1':'À propos d\'Everest','ab-lead':'Née au cœur du Sahel tunisien, Everest relie le monde à l\'artisanat exceptionnel de Monastir, Ksar Hellal et au-delà.',
    'ab-miss-k':'Notre mission','ab-miss-h':'Du Sahel au monde',
    'home-hero-h1a':'Authentique','home-hero-h1b':'tunisien','home-hero-h1c':'artisanat','home-hero-lead':'Des maîtres artisans de Monastir jusqu\'à vous — fait main dans la tradition.','home-hero-shop':'Acheter →','home-hero-custom':'Meuble sur mesure','home-cat-all':'Tout','home-cat-sofa':'Canapés','home-cat-rug':'Tapis','home-cat-lighting':'Luminaires','home-cat-ceramic':'Céramiques','home-cat-bedroom':'Chambre','home-cat-outdoor':'Extérieur','home-cat-fragrance':'Parfums','home-cat-custom':'Sur mesure','home-flash-badge':'⚡ VENTE FLASH','home-flash-offer':'Jusqu\'à 40 % de remise — aujourd\'hui seulement !','home-flash-ends':'Se termine dans :','home-trust-freeship':'Livraison offerte dès 500 TND','home-trust-checkout':'Paiement sécurisé','home-trust-logistics':'Suivi national','home-dept-head':'Rayons principaux','home-dept-sub':'Grand catalogue — mobilier, déco, luminaires, chambre et plus.','home-dept-all':'Tout le catalogue','home-dept-furniture':'Meubles & assises','home-dept-decor':'Tapis & déco','home-dept-ceramics':'Table & céramiques','home-dept-lighting':'Luminaires','home-dept-outdoor':'Jardin & extérieur','home-dept-fragrance':'Parfums','home-dept-custom':'Sur mesure','home-room-head':'Par pièce','home-room-living':'Salon','home-room-dining':'Salle à manger','home-room-office':'Bureau · déco','home-room-garden':'Jardin','home-deals-head':'Sélection du moment','home-deals-sub':'Photos réelles du catalogue — touchez pour fiches détaillées.','home-picks-head':'Choix Everest','home-best-head':'Coup de cœur clients','home-new-head':'Nouveautés','home-see-all-cats':'Voir toutes les catégories →','home-trendy-title':'Produits tendance','home-trendy-sub':'Les plus consultés sur Everest — touchez une vignette pour les détails.','home-trendy-see':'Voir tout →','home-trendy-empty':'Pas encore d’annonces — revenez bientôt.','home-new-products-title':'Nouveaux produits','home-new-products-see':'Voir tout →','home-new-products-empty':'Pas de nouveautés pour le moment.','home-chips-hint':'Raccourcis catégories','home-promo-sofa-eyebrow':'Salon','home-promo-sofa-title':'Canapés & bois massif','home-promo-sofa-cta':'Voir la ligne →','home-promo-rug-eyebrow':'Tissage main','home-promo-rug-title':'Tapis & textiles','home-promo-rug-cta':'Voir la collection →','home-promo-custom-eyebrow':'Sur mesure','home-promo-custom-title':'Vos dimensions & finitions','home-promo-custom-cta':'Ouvrir le studio →','home-artisan-eyebrow':'Les artisans','home-artisan-title':'Ateliers du Sahel sur Everest','home-artisan-body':'Vendeurs vérifiés · logistique respectueuse de la vie privée.','home-artisan-cta':'Notre histoire →','home-trust-delivery-title':'Livraison gratuite','home-trust-delivery-sub':'Panier 500 TND+','home-trust-returns-title':'Retours 30 jours','home-trust-returns-sub':'Voir conditions au paiement','home-trust-artisan-title':'Vendeurs vérifiés','home-trust-artisan-sub':'Offre TN authentique','home-trust-pay-title':'Paiement flexible','home-trust-pay-sub':'Comptant + en ligne','sm-badge-signature':'Collection Signature Everest','sm-badge-quality':'✓ Qualité Everest','sm-card-studio':'Everest Design Studio','sm-card-team':'Équipe Studio Everest','sm-card-curated':'Sélection Everest','sm-card-blurb':'Finition premium · Logistique sécurisée · Qualité vérifiée','sm-tag-quality':'✓ Contrôle qualité','sm-tag-precision':'📐 Ajustement précis','sm-tag-delivery':'🚚 Livraison incluse'
  },
  ar:{
    'nav-home':'\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    'nav-products':'\u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0627\u062a',
    'nav-carpenter':'\u062d\u0633\u0628 \u0627\u0644\u0637\u0644\u0628',
    'nav-track':'\u062a\u062a\u0628\u0639',
    'nav-loyalty':'\u0627\u0644\u0645\u0643\u0627\u0641\u0622\u062a',
    'nav-about':'\u0645\u0646 \u0646\u062d\u0646',
    'nav-about-vendor':'\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0628\u0627\u0626\u0639\u064a\u0646',
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
    'nav-me':'\u062d\u0633\u0627\u0628\u064a',
    'nav-deliver-to':'\u062a\u0648\u0635\u064a\u0644 \u0625\u0644\u0649',
    'nav-returns':'\u0627\u0644\u0645\u0631\u062a\u062c\u0639\u0627\u062a',
    'vr-badge':'\ud83d\udcdc \u0625\u064a\u0641\u0631\u0633\u062a','vr-title':'\u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0648\u0627\u0644\u0644\u0648\u0627\u0626\u062d \u0627\u0644\u0631\u0633\u0645\u064a\u0629',
    'vr-intro':'\u062a\u0646\u0637\u0628\u0642 \u0647\u0630\u0647 \u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0639\u0644\u0649 \u062c\u0645\u064a\u0639 \u0627\u0644\u0628\u0627\u0626\u0639\u064a\u0646 \u0648\u0627\u0644\u0645\u0635\u0627\u0646\u0639 \u0639\u0644\u0649 \u0645\u0646\u0635\u0629 \u0625\u064a\u0641\u0631\u0633\u062a. \u0642\u062f \u064a\u0624\u062f\u064a \u0623\u064a \u0645\u062e\u0627\u0644\u0641\u0629 \u0625\u0644\u0649 \u062a\u062d\u0630\u064a\u0631 \u0623\u0648 \u062a\u0639\u0644\u064a\u0642 \u0623\u0648 \u062d\u0638\u0631 \u062f\u0627\u0626\u0645.',
    'vr-s1-h':'\u0627\u0644\u0642\u0633\u0645 1: \u0645\u062d\u0638\u0648\u0631\u0627\u062a \u0635\u0627\u0631\u0645\u0629 (\u0644\u0627 \u062a\u0633\u0627\u0645\u062d)',
    'vr-s1-1-l':'\u0633\u064a\u0627\u0633\u0629 \u0645\u0639\u0627\u062f\u0627\u0629 \u0627\u0644\u0635\u0647\u064a\u0648\u0646\u064a\u0629:','vr-s1-1-t':'\u064a\u062d\u0638\u0631 \u062a\u0645\u0627\u0645\u064b\u0627 \u0639\u0631\u0636 \u0645\u0646\u062a\u062c\u0627\u062a \u0623\u0648 \u0643\u062a\u0628 \u0623\u0648 \u0631\u0645\u0648\u0632 \u0623\u0648 \u0645\u0648\u0627\u062f \u062a\u062f\u0639\u0645 \u0627\u0644\u0643\u064a\u0627\u0646 \u0627\u0644\u0635\u0647\u064a\u0648\u0646\u064a. \u0627\u0644\u0645\u062e\u0627\u0644\u0641\u0629 \u062a\u0624\u062f\u064a \u0625\u0644\u0649 \u062d\u0638\u0631 \u0641\u0648\u0631\u064a \u0648\u062f\u0627\u0626\u0645.',
    'vr-s1-2-l':'\u0627\u0644\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0623\u062e\u0644\u0627\u0642\u064a\u0629:','vr-s1-2-t':'\u064a\u062d\u0638\u0631 \u0628\u064a\u0639 \u0633\u0644\u0639 \u062a\u0631\u0648\u062c \u0644\u0644\u0634\u0630\u0648\u0630 \u0623\u0648 \u0627\u0644\u0633\u0644\u0648\u0643 \u063a\u064a\u0631 \u0627\u0644\u0623\u062e\u0644\u0627\u0642\u064a \u0623\u0648 \u0623\u064a \u0645\u062d\u062a\u0648\u0649 \u064a\u062a\u0639\u0627\u0631\u0636 \u0645\u0639 \u0627\u0644\u0642\u064a\u0645 \u0627\u0644\u062b\u0642\u0627\u0641\u064a\u0629 \u0648\u0627\u0644\u0623\u062e\u0644\u0627\u0642\u064a\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629.',
    'vr-s1-3-l':'\u0644\u0627 \u0645\u0646\u062a\u062c\u0627\u062a \u0637\u0628\u064a\u0629:','vr-s1-3-t':'\u064a\u062d\u0638\u0631 \u0628\u064a\u0639 \u0627\u0644\u0623\u062f\u0648\u064a\u0629 \u0648\u0627\u0644\u0647\u0631\u0645\u0648\u0646\u0627\u062a \u0648\u0627\u0644\u0645\u0643\u0645\u0644\u0627\u062a \u0627\u0644\u063a\u0630\u0627\u0626\u064a\u0629 \u0623\u0648 \u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0635\u062d\u0629. \u0625\u064a\u0641\u0631\u0633\u062a \u0644\u064a\u0633\u062a \u0635\u064a\u062f\u0644\u064a\u0629.',
    'vr-s1-4-l':'\u0644\u0627 \u0645\u0633\u062a\u0639\u0645\u0644 (\u062c\u062f\u064a\u062f \u0641\u0642\u0637):','vr-s1-4-t':'\u0625\u064a\u0641\u0631\u0633\u062a \u0633\u0648\u0642 \u0644\u0644\u0633\u0644\u0639 \u0627\u0644\u062c\u062f\u064a\u062f\u0629 \u0641\u0642\u0637. \u064a\u062d\u0638\u0631 \u0628\u064a\u0639 \u0627\u0644\u0645\u0633\u062a\u0639\u0645\u0644 \u0623\u0648 \u0627\u0644\u0645\u0639\u0627\u062f \u062a\u062c\u062f\u064a\u062f\u0647 \u0648\u0642\u062f \u064a\u0624\u062f\u064a \u0625\u0644\u0649 \u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062d\u0633\u0627\u0628 \u0628\u0639\u062f \u0627\u0644\u062a\u062d\u0642\u064a\u0642.',
    'vr-s1-5-l':'\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a:','vr-s1-5-t':'\u064a\u062d\u0638\u0631 \u0628\u064a\u0639 \u0627\u0644\u0623\u0633\u0644\u062d\u0629 \u0623\u0648 \u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u0643\u064a\u0645\u064a\u0627\u0626\u064a\u0629 \u0627\u0644\u062e\u0637\u0631\u0629 \u0623\u0648 \u0627\u0644\u0645\u0648\u0627\u062f \u063a\u064a\u0631 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0629 \u0623\u0648 \u0623\u064a \u0633\u0644\u0639\u0629 \u0645\u062d\u0638\u0648\u0631\u0629 \u0628\u0645\u0648\u062c\u0628 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u062a\u0648\u0646\u0633\u064a.',
    'vr-s2-h':'\u0627\u0644\u0642\u0633\u0645 2: \u0627\u0644\u0644\u0648\u062c\u0633\u062a\u064a\u0643\u064a\u0627\u062a \u0627\u0644\u0641\u0648\u0631\u064a\u0629 (\u0633\u0631\u0639\u0629 \u0625\u064a\u0641\u0631\u0633\u062a)',
    'vr-s2-1-l':'\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629 \u0627\u0644\u0641\u0648\u0631\u064a\u0629 \u0644\u0644\u062a\u0633\u0644\u064a\u0645:','vr-s2-1-t':'\u0639\u0646\u062f \u0627\u0633\u062a\u0644\u0627\u0645 \u0625\u0634\u0639\u0627\u0631 \u00ab\u0627\u0644\u0633\u0627\u0626\u0642 \u064a\u0642\u062a\u0631\u0628\u00bb \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0627\u0644\u0637\u0644\u0628 \u0645\u0639\u0628\u0623\u064b \u0648\u062c\u0627\u0647\u0632\u064b\u0627 \u0644\u0644\u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0641\u0648\u0631\u064a. \u0644\u0627 \u064a\u064f\u062a\u0648\u0642\u0651\u0639 \u0645\u0646 \u0627\u0644\u0633\u0627\u0626\u0642 \u0623\u064a \u0627\u0646\u062a\u0638\u0627\u0631.',
    'vr-s2-2-l':'\u0627\u0644\u062a\u0639\u0628\u0626\u0629 \u0627\u0644\u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629:','vr-s2-2-t':'\u0627\u0644\u0628\u0627\u0626\u0639\u0648\u0646 \u0648\u0627\u0644\u0645\u0635\u0627\u0646\u0639 \u0645\u0633\u0624\u0648\u0644\u0648\u0646 \u0639\u0646 \u062a\u0639\u0628\u0626\u0629 \u0622\u0645\u0646\u0629. \u0644\u0627 \u062a\u062a\u062d\u0645\u0644 \u0625\u064a\u0641\u0631\u0633\u062a \u0627\u0644\u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0639\u0646 \u0627\u0644\u0623\u0636\u0631\u0627\u0631 \u0627\u0644\u0646\u0627\u062c\u0645\u0629 \u0639\u0646 \u062a\u0639\u0628\u0626\u0629 \u0636\u0639\u064a\u0641\u0629 \u0623\u0648 \u0647\u0634\u0629 \u0645\u0646 \u0627\u0644\u0645\u0635\u062f\u0631.',
    'vr-s2-3-l':'\u0627\u0644\u062f\u0642\u0629 \u0627\u0644\u0628\u0635\u0631\u064a\u0629 (WYSIWYG):','vr-s2-3-t':'\u064a\u062c\u0628 \u0623\u0646 \u062a\u0637\u0627\u0628\u0642 \u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c \u0627\u0644\u0633\u0644\u0639\u0629 \u0627\u0644\u0641\u0639\u0644\u064a\u0629 \u0628\u0646\u0633\u0628\u0629 100\u066a. \u0623\u064a \u0627\u062e\u062a\u0644\u0627\u0641 \u0641\u064a \u0627\u0644\u0644\u0648\u0646 \u0623\u0648 \u0627\u0644\u0637\u0631\u0627\u0632 \u0623\u0648 \u0627\u0644\u062c\u0648\u062f\u0629 \u064a\u064f\u0639\u062f \u062e\u0631\u0642\u0627\u064b \u0644\u0644\u062b\u0642\u0629.',
    'vr-s3-h':'\u0627\u0644\u0642\u0633\u0645 3: \u062e\u0635\u0648\u0635\u064a\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0648\u0627\u0644\u0623\u0645\u0627\u0646 (\u00ab\u0627\u0644\u062a\u062f\u0641\u0642 \u0627\u0644\u0623\u0639\u0645\u0649\u00bb)',
    'vr-s3-1-l':'\u062e\u0635\u0648\u0635\u064a\u0629 \u0627\u0644\u0639\u0645\u064a\u0644 (\u0634\u062d\u0646 \u0623\u0639\u0645\u0649):','vr-s3-1-t':'\u0644\u064a\u0633 \u0644\u062f\u0649 \u0627\u0644\u0628\u0627\u0626\u0639\u064a\u0646 \u0648\u0627\u0644\u0645\u0635\u0627\u0646\u0639 \u0623\u064a \u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0644\u0644\u0639\u0645\u064a\u0644 (\u0644\u0627 \u0627\u0633\u0645 \u0648\u0644\u0627 \u0647\u0627\u062a\u0641 \u0648\u0644\u0627 \u0639\u0646\u0648\u0627\u0646). \u064a\u062a\u0644\u0642\u0648\u0646 \u0641\u0642\u0637 \u00ab\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628\u00bb \u0648\u00ab\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u00bb \u0644\u0644\u062a\u062c\u0647\u064a\u0632.',
    'vr-s3-2-l':'\u062a\u062d\u0643\u0645 \u0648\u0635\u0648\u0644 \u0627\u0644\u0633\u0627\u0626\u0642\u064a\u0646:','vr-s3-2-t':'\u064a\u062a\u0644\u0642\u0649 \u0627\u0644\u0633\u0627\u0626\u0642\u0648\u0646 \u0641\u0642\u0637 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0644\u0627\u0632\u0645\u0629 \u0644\u0644\u062a\u0633\u0644\u064a\u0645 (\u0627\u0644\u0627\u0633\u0645 \u0648\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 \u0648\u0645\u0648\u0642\u0639 GPS). \u062a\u0628\u0642\u0649 \u0628\u0642\u064a\u0629 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u064a\u0644 \u0645\u0634\u0641\u0631\u0629 \u0648\u0645\u062e\u0641\u064a\u0629 \u062f\u0627\u062e\u0644 \u0646\u0638\u0627\u0645 \u0625\u064a\u0641\u0631\u0633\u062a.',
    'vr-s3-3-l':'\u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0645\u0648\u062b\u0642\u0629 \u0641\u0642\u0637:','vr-s3-3-t':'\u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0623\u0648 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0645\u0645\u0643\u0646\u0629 \u0641\u0642\u0637 \u0628\u0639\u062f \u0634\u0631\u0627\u0621 \u0648\u062a\u0633\u0644\u064a\u0645 \u0646\u0627\u062c\u062d\u064a\u0646. \u064a\u0645\u0646\u0639 \u0627\u0644\u0627\u062d\u062a\u064a\u0627\u0644 \u0648\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0627\u0644\u0648\u0647\u0645\u064a\u0629.',
    'prod-eyebrow':'\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a','prod-h1':'\u0645\u062c\u0645\u0648\u0639\u0627\u062a\u0646\u0627','prod-amz-shop-by':'\u062a\u0633\u0648\u0642 \u062d\u0633\u0628 \u0627\u0644\u0642\u0633\u0645','prod-amz-department':'\u0627\u0644\u0642\u0633\u0645','prod-filters':'\u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062a\u0635\u0641\u064a\u0629','prod-clear':'\u0645\u0633\u062d','prod-categories':'\u0627\u0644\u0641\u0626\u0627\u062a',
    'prod-cat-all':'\u0643\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a','prod-cat-furniture':'\u0623\u062b\u0627\u062b','prod-cat-lighting':'\u0625\u0636\u0627\u0621\u0629','prod-cat-decor':'\u062f\u064a\u0643\u0648\u0631','prod-cat-ceramics':'\u062e\u0632\u0641','prod-cat-bedroom':'\u063a\u0631\u0641\u0629 \u0646\u0648\u0645','prod-cat-outdoor':'\u062e\u0627\u0631\u062c\u064a','prod-cat-fragrance':'\u0639\u0637\u0648\u0631',
    'prod-price':'\u0633\u0639\u0631','prod-min':'\u0623\u0642\u0644','prod-max':'\u0623\u0642\u0635\u0649','prod-search-ph':'\u0627\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0645\u0627\u062f\u0629 \u0623\u0648 \u0627\u0644\u0635\u0627\u0646\u0639 \u0623\u0648 \u0627\u0644\u0645\u0646\u0637\u0642\u0629\u2026','prod-search-btn':'\u0628\u062d\u062b',
    'sm-hero-badge':'\u0645\u0643\u0648\u0646 \u062d\u0633\u0628 \u0627\u0644\u0637\u0644\u0628','sm-hero-h1a':'\u0623\u062b\u0627\u062b\u062a\u0643\u060c','sm-hero-h1b':'\u0631\u0624\u064a\u062a\u0643','sm-hero-desc':'\u0643\u0645\u0627 \u0641\u064a IKEA: \u062e\u0637\u0648\u0637 \u0646\u0638\u064a\u0641\u0629\u060c \u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u0642\u064a\u0627\u0633\u0627\u062a \u0648\u0623\u0644\u0648\u0627\u0646 \u0645\u062e\u0635\u0635\u0629 \u2014 Everest.',
    'sm-st-weeks':'\u0623\u0633\u0628\u0648\u0639','sm-st-oak':'\u0628\u0644\u0648\u0637 \u0635\u0644\u0628','sm-st-warranty':'\u0633\u0646\u0648\u0627\u062a \u0636\u0645\u0627\u0646','sm-st-reply':'\u0631\u062f',
    'sm-eyebrow-piece':'\u0627\u062e\u062a\u0631 \u0642\u0637\u0639\u0629','sm-h2-oak':'\u062a\u0635\u0627\u0645\u064a\u0645\u0646\u0627 \u0628\u0627\u0644\u0628\u0644\u0648\u0637','sm-studio-desc':'\u0633\u062a\u0648\u062f\u064a\u0648 Everest: \u0623\u0633\u0644\u0648\u0628 \u0628\u0633\u064a\u0637\u060c \u0645\u0648\u0627\u062f \u0641\u0627\u062e\u0631\u0629\u060c \u062a\u062e\u0635\u064a\u0635 \u062f\u0642\u064a\u0642.',
    'sm-cat-lbl':'\u0643\u062a\u0627\u0644\u0648\u062c Everest','sm-cat-h3':'\u062a\u0635\u0641\u062d \u0628\u0635\u0641 \u0623\u0633\u0637\u0631\u060c \u0623\u0633\u0644\u0648\u0628 IKEA','sm-request-custom':'\u0637\u0644\u0628 \u0645\u0634\u0631\u0648\u0639 \u062e\u0627\u0635','sm-coll-eyebrow':'\u0645\u062c\u0645\u0648\u0639\u0629 Everest','sm-coll-h2':'\u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0645\u0646\u062a\u062c \u0644\u0641\u062a\u062d \u0623\u062f\u0627\u0629 \u0627\u0644\u062a\u062e\u0635\u064a\u0635',
    'sm-back':'\u2190 \u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c','sm-toolbar-hint':'\u062a\u062e\u0635\u064a\u0635 \u00b7 Everest \u062d\u0633\u0628 \u0627\u0644\u0637\u0644\u0628','sm-cfg-eyebrow':'\u062a\u062e\u0635\u064a\u0635','sm-cfg-h2':'\u063a\u064a\u0651\u0631 \u0627\u0644\u0642\u064a\u0627\u0633\u0627\u062a \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644',    'sm-delivery-step':'\u0627\u0644\u062a\u0633\u0644\u064a\u0645 \u062e\u0644\u0627\u0644 \u0623\u0633\u0628\u0648\u0639\u064a\u0646','sm-view':'\u0639\u0631\u0636','sm-customize':'\u062a\u062e\u0635\u064a\u0635','sm-from':'\u0645\u0646','sm-personalize-short':'\u062a\u062e\u0635\u064a\u0635',
    'prod-mobile-filters':'\ud83c\udfaf \u0645\u0644\u0641\u0627\u062a','prod-rating-h':'\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621','prod-rating-up':'\u0641\u0623\u0643\u062b\u0631','prod-avail-h':'\u0627\u0644\u062a\u0648\u0641\u0631','prod-in-stock':'\u2705 \u0645\u062a\u0648\u0641\u0631','prod-out-stock':'\u23f3 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631','prod-offers-h':'\u0639\u0631\u0648\u0636 \u062e\u0627\u0635\u0629','prod-free-ship':'\ud83d\ude9a \u0634\u062d\u0646 \u0645\u062c\u0627\u0646\u064a','prod-on-sale':'\ud83c\udff7\ufe0f \u062a\u062e\u0641\u064a\u0636\u0627\u062a','prod-sort-by':'\u062a\u0631\u062a\u064a\u0628:','prod-sort-featured':'\u0645\u0645\u064a\u0632','prod-sort-price-low':'\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0642\u0644 \u0644\u0644\u0623\u0639\u0644\u0649','prod-sort-price-high':'\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0623\u0642\u0644','prod-sort-rating':'\u0627\u0644\u062a\u0642\u064a\u064a\u0645',    'prod-sort-newest':'\u0627\u0644\u0623\u062d\u062f\u062b','prod-results':'\u0646\u062a\u0627\u0626\u062c',
    'prod-idle-eyebrow':'\u0627\u062a\u064a\u0644\u064a\u0647 Everest','prod-idle-title':'\u0627\u0628\u062d\u062b \u0627\u0644\u0645\u062c\u0645\u0648\u0639\u0629','prod-idle-sub':'\u0627\u0643\u062a\u0628 \u0627\u0633\u0645\u0627\u064b \u0623\u0648 \u0645\u0627\u062f\u0629 \u0623\u0648 \u0645\u0646\u0637\u0642\u0629 \u0623\u0648 \u0635\u0627\u0646\u0639\u0627\u064b. \u062a\u0638\u0647\u0631 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u0639\u0646\u062f \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u062d\u062b \u0623\u0648 \u0627\u0644\u0642\u0633\u0645.','prod-no-match':'\u0644\u0627 \u064a\u0648\u062c\u062f \u062a\u0637\u0627\u0628\u0642. \u062c\u0631\u0628 \u0635\u064a\u063a\u0629 \u0623\u062e\u0631\u0649 \u0623\u0648 \u0627\u0644\u063a\u0640 \u0627\u0644\u0645\u0644\u0641\u0627\u062a.',
    'sm-label-min':'\u0623\u062f\u0646\u0649','sm-label-max':'\u0623\u0642\u0635\u0649','sm-units-cm':'\u0633\u0645','sm-dim-width':'\u0627\u0644\u0639\u0631\u0636','sm-dim-depth':'\u0627\u0644\u0639\u0645\u0642','sm-dim-height':'\u0627\u0644\u0627\u0631\u062a\u0641\u0627\u0639','sm-teinte-hdr':'\ud83c\udfa8 \u0644\u0648\u0646 \u0627\u0644\u0625\u0646\u0627\u0621\u0629','sm-selected-prefix':'\u0627\u0644\u0645\u062d\u062f\u062f:','sm-estimated-badge':'\u0633\u0639\u0631 \u062a\u0642\u062f\u064a\u0631\u064a','sm-dim-hdr':'\ud83d\udccf \u0627\u0644\u0642\u064a\u0627\u0633\u0627\u062a','sm-dim-sub':'(\u062d\u062f\u0648\u062f \u0645\u0646 Everest)','sm-locked-hdr':'\ud83d\udd12 \u062b\u0627\u0628\u062a \u062c\u0648\u062f\u0629 Everest','sm-summary-hdr':'\u0645\u0644\u062e\u0635 \u0627\u0644\u0625\u0639\u062f\u0627\u062f','sm-base-price-lbl':'\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064a','sm-dim-extra-lbl':'\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0642\u064a\u0627\u0633\u0627\u062a','sm-total-est-lbl':'\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a','sm-price-footnote':'* \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a \u064a\u0624\u0643\u062f\u0647 \u0641\u0631\u064a\u0642 Everest \u062e\u0644\u0627\u0644 24\u0633','sm-add-cart':'\ud83d\uded2 \u0623\u0636\u0641 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629','sm-blender-btn':'\u2728 \u062a\u062e\u0635\u064a\u0635 (Blender)','sm-save-cfg':'\ud83d\udcbe \u062d\u0641\u0638','sm-save-toast':'\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f','sm-success-title':'\u062a\u0645 \u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629!','sm-success-sub':'\u064a\u0624\u0643\u062f \u0641\u0631\u064a\u0642 Everest \u062e\u0644\u0627\u0644 24\u0633','sm-cf-close':'\u0625\u063a\u0644\u0627\u0642 \u2715','sm-cf-h3':'\u062e\u0635\u0635 \u0623\u062b\u0627\u062b\u062a\u0643 \u0627\u0644\u062e\u0627\u0635','sm-cf-intro':'\u0623\u0631\u0633\u0644 \u0646\u0645\u0648\u0630\u062c\u0643 (Blender/3D)\u060c \u0627\u0644\u0623\u0644\u0648\u0627\u0646\u060c \u0627\u0644\u0642\u064a\u0627\u0633\u0627\u062a \u0648\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644. \u064a\u062d\u0636\u0631 \u0627\u0644\u0641\u0631\u064a\u0642 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631.','sm-cf-name':'\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644 *','sm-cf-phone':'\u0647\u0627\u062a\u0641 *','sm-cf-email':'\u0628\u0631\u064a\u062f *','sm-cf-type':'\u0646\u0648\u0639 \u0627\u0644\u0623\u062b\u0627\u062b *','sm-cf-type-ph':'\u0643\u0631\u0633\u064a\u060c \u0637\u0627\u0648\u0644\u0629\u2026','sm-cf-width':'\u0627\u0644\u0639\u0631\u0636 (\u0633\u0645) *','sm-cf-depth':'\u0627\u0644\u0639\u0645\u0642 (\u0633\u0645) *','sm-cf-height':'\u0627\u0644\u0627\u0631\u062a\u0641\u0627\u0639 (\u0633\u0645) *','sm-cf-color':'\u0627\u0644\u0644\u0648\u0646 / \u0627\u0644\u0644\u0645\u0639\u0629 *','sm-cf-color-ph':'\u0628\u0644\u0648\u0637 \u063a\u0627\u0645\u0642\u060c \u0623\u0633\u0648\u062f \u0645\u0627\u062a\u2026','sm-cf-notes':'\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0645\u0648\u0627\u062f / \u0627\u0644\u0633\u0644\u0648\u0643 *','sm-cf-notes-ph':'\u062a\u0641\u0627\u0635\u064a\u0644: \u0646\u0648\u0639 \u0627\u0644\u062e\u0634\u0628\u060c \u0623\u062f\u0631\u0627\u062c\u2026','sm-cf-upload':'\u0627\u0631\u0641\u0639 \u0627\u0644\u0646\u0645\u0648\u0630\u062c / \u0645\u0631\u0627\u062c\u0639 *','sm-cf-nofile':'\u0644\u0627 \u0645\u0644\u0641','sm-cf-selected-prefix':'\u0627\u0644\u0645\u062d\u062f\u062f:','sm-cf-submit-note':'\u0628\u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u062a\u0635\u0644 \u0637\u0644\u0628\u0643 \u0644\u0641\u0631\u064a\u0642 Everest \u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u064a\u062f\u0648\u064a\u0629.','sm-cf-submit':'\u0642\u0628\u0648\u0644 \u0637\u0644\u0628 \u0627\u0644\u0639\u0631\u0636','sm-cf-sending':'\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644\u2026','sm-cf-ok-msg':'\u2705 \u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628. \u064a\u0631\u062c\u0649 \u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0639\u0631\u0636.','sm-cf-toast':'\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628. \u064a\u0631\u062c\u0649 \u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0639\u0631\u0636.','sm-thumb-title':'\u0635\u0648\u0631\u0629',
    'sm-hiw-eyebrow':'\u0643\u064a\u0641 \u064a\u0639\u0645\u0644','sm-hiw-h2':'\u0628\u0633\u064a\u0637 \u0648\u0648\u0636\u062d','sm-hiw-s1t':'\u0627\u062e\u062a\u0631','sm-hiw-s1d':'\u0627\u062e\u062a\u0631 \u0645\u0648\u062f\u064a\u0644\u0627\u064b \u0645\u0646 \u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c','sm-hiw-s2t':'\u0625\u0639\u062f\u0627\u062f','sm-hiw-s2d':'\u0636\u0628\u0637 \u0627\u0644\u0642\u064a\u0627\u0633\u0627\u062a \u0648\u0627\u0644\u0644\u0645\u0639\u0629','sm-hiw-s3t':'\u0637\u0644\u0628','sm-hiw-s3d':'\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0639\u0631\u0636 \u062e\u0644\u0627\u0644 24\u0633','sm-hiw-s4t':'\u0627\u0644\u062a\u0648\u0635\u064a\u0644',
    'track-h1':'\u062a\u062a\u0628\u0639 \u0637\u0644\u0628\u0643','track-empty-msg':'\u0623\u062f\u062e\u0644 \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628 \u0623\u0639\u0644\u0627\u0647 \u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0634\u062d\u0646 \u0644\u062d\u0638\u0629.','track-try':'\u062c\u0631\u0628:',
    'wish-eyebrow':'\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u0645\u0646\u064a\u0627\u062a','wish-h1':'\u0642\u0627\u0626\u0645\u0629 \u0623\u0645\u0646\u064a\u0627\u062a\u0643',
    'gift-back':'\u2190 \u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u062a\u0633\u0648\u0642','gift-eyebrow':'\u0647\u062f\u064a\u0629','gift-h1':'\u0623\u0631\u0633\u0644 \u0647\u062f\u064a\u0629','gift-desc':'\u0623\u062e\u0628\u0631\u0646\u0627 \u0645\u0646 \u064a\u0633\u062a\u0644\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644. \u0627\u0644\u062f\u0641\u0639 \u0641\u064a \u0627\u0644\u062e\u0637\u0648\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629.',
    'loy-h1':'\u0645\u0643\u0627\u0641\u0622\u062a \u0627\u0644\u0648\u0641\u0627\u0621','loy-how':'\u0643\u064a\u0641 \u064a\u0639\u0645\u0644:','loy-pt1':'1 \u062f\u064a\u0646\u0627\u0631 \u0645\u0635\u0631\u0648\u0641 = 1 \u0646\u0642\u0637\u0629','loy-pt2':'100 \u0646\u0642\u0637\u0629 = 1 \u062f\u064a\u0646\u0627\u0631 \u062e\u0635\u0645','loy-cta':'\u0627\u0628\u062f\u0623 \u062c\u0645\u0639 \u0627\u0644\u0646\u0642\u0627\u0637 \u2192',
    'ab-eyebrow':'\u0642\u0635\u062a\u0646\u0627','ab-h1':'\u0645\u0646 \u0646\u062d\u0646 Everest','ab-lead':'\u0648\u0644\u062f\u062a \u0641\u064a \u0642\u0644\u0628 \u0627\u0644\u0633\u0627\u062d\u0644 \u0627\u0644\u062a\u0648\u0646\u0633\u064a\u060c \u0644\u062a\u0631\u0628\u0637 \u0627\u0644\u0639\u0627\u0644\u0645 \u0628\u062d\u0631\u0641\u064a\u0629 \u0645\u0648\u0646\u0627\u0633\u062a\u064a\u0631 \u0648\u0642\u0635\u0631 \u0647\u0644\u0627\u0644 \u0648\u0623\u0628\u0639\u062f.',
    'home-trendy-title':'\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0631\u0627\u0626\u062c\u0629','home-trendy-sub':'\u0627\u0644\u0623\u0643\u062b\u0631 \u0632\u064a\u0627\u0631\u0629 \u0639\u0644\u0649 \u0625\u064a\u0641\u0631\u0633\u062a \u0627\u0644\u0622\u0646 — \u0627\u0636\u063a\u0637 \u0644\u0644\u062a\u0641\u0627\u0635\u064a\u0644.','home-trendy-see':'\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2192','home-trendy-empty':'\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0646\u062a\u062c\u0627\u062a \u0628\u0639\u062f — \u062d\u0627\u0648\u0644 \u0644\u0627\u062d\u0642\u064b\u0627.','home-new-products-title':'\u062c\u062f\u064a\u062f \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a','home-new-products-see':'\u0639\u0631\u0636 \u0627\u0644\u0643\u0644 \u2192','home-new-products-empty':'\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0648\u0632\u0639\u0627\u062a \u062d\u0627\u0644\u064a\u064b\u0627.',
    'ab-miss-k':'\u0645\u0647\u0645\u062a\u0646\u0627','ab-miss-h':'\u0645\u0646 \u0627\u0644\u0633\u0627\u062d\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0627\u0644\u0645'
  }
};

function _safeLang(lang) {
  if (lang === 'ar' || lang === 'fr' || lang === 'en') return lang;
  return 'fr';
}

var __stnRtI18n = {
  textNodes: [],
  attrNodes: [],
  cache: {},
  textNodeSet: null,
  attrSeenByEl: null,
};

function _stnCaptureOriginalDomTexts() {
  if (!__stnRtI18n.textNodeSet) __stnRtI18n.textNodeSet = new WeakSet();
  if (!__stnRtI18n.attrSeenByEl) __stnRtI18n.attrSeenByEl = new WeakMap();

  var skipTag = { SCRIPT:1, STYLE:1, NOSCRIPT:1, IFRAME:1, CODE:1, PRE:1 };
  var walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, null);
  var n;
  while ((n = walker.nextNode())) {
    var p = n.parentElement;
    if (!p) continue;
    if (skipTag[p.tagName]) continue;
    if (p.closest && (p.closest('[data-no-translate="1"]') || p.closest('.stn-notranslate') || p.closest('[translate="no"]'))) continue;
    var txt = String(n.nodeValue || '').replace(/\s+/g, ' ').trim();
    if (!txt) continue;
    if (/^[0-9\s.,:%+\-/*()]+$/.test(txt)) continue;
    if (__stnRtI18n.textNodeSet.has(n)) continue;
    __stnRtI18n.textNodeSet.add(n);
    __stnRtI18n.textNodes.push({ node: n, original: n.nodeValue });
  }

  var attrs = ['placeholder', 'title', 'aria-label'];
  document.querySelectorAll('input,textarea,button,a,[title],[aria-label]').forEach(function (el) {
    if (el.closest && (el.closest('[data-no-translate="1"]') || el.closest('.stn-notranslate') || el.closest('[translate="no"]'))) return;
    var seen = __stnRtI18n.attrSeenByEl.get(el);
    if (!seen) {
      seen = {};
      __stnRtI18n.attrSeenByEl.set(el, seen);
    }
    attrs.forEach(function (a) {
      var v = el.getAttribute(a);
      if (!v) return;
      var t = String(v).trim();
      if (!t) return;
      if (seen[a]) return;
      seen[a] = true;
      __stnRtI18n.attrNodes.push({ el: el, attr: a, original: v });
    });
  });
}

function _stnStabilizeLanguageButtons() {
  var langs = ['ar', 'fr', 'en'];
  langs.forEach(function (l) {
    var btn = document.getElementById('lang-' + l);
    if (!btn) return;
    btn.setAttribute('data-no-translate', '1');
    btn.setAttribute('translate', 'no');
    btn.style.direction = 'ltr';
    btn.style.unicodeBidi = 'isolate';
    btn.textContent = l.toUpperCase();
  });
  document.querySelectorAll('[data-nav-lang]').forEach(function (b) {
    var l = (b.getAttribute('data-nav-lang') || '').toLowerCase();
    if (!l) return;
    b.setAttribute('data-no-translate', '1');
    b.setAttribute('translate', 'no');
    b.style.direction = 'ltr';
    b.style.unicodeBidi = 'isolate';
    b.textContent = l.toUpperCase();
  });
}

async function _stnTranslateText(text, targetLang) {
  var raw = String(text || '');
  var key = targetLang + '::' + raw;
  if (__stnRtI18n.cache[key]) return __stnRtI18n.cache[key];
  try {
    var u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
      encodeURIComponent(targetLang) + '&dt=t&q=' + encodeURIComponent(raw);
    var res = await fetch(u, { method: 'GET' });
    var data = await res.json();
    var out = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      data[0].forEach(function (part) { if (Array.isArray(part) && part[0]) out += String(part[0]); });
    }
    if (!out) out = raw;
    __stnRtI18n.cache[key] = out;
    return out;
  } catch (e) {
    return raw;
  }
}

async function _stnTranslateWholeDom(targetLang) {
  _stnStabilizeLanguageButtons();
  _stnCaptureOriginalDomTexts();
  var lang = _safeLang(targetLang);

  // Restore original before translating to avoid compounded translations.
  __stnRtI18n.textNodes.forEach(function (x) {
    if (x && x.node) x.node.nodeValue = x.original;
  });
  __stnRtI18n.attrNodes.forEach(function (x) {
    if (x && x.el && x.el.isConnected) x.el.setAttribute(x.attr, x.original);
  });

  // Machine translate the live DOM (Google translate_a) for ar, fr, and en so copy matches
  // what users expect, not only the partial in-repo dictionary.
  if (lang !== 'ar' && lang !== 'fr' && lang !== 'en') return;

  var maxItems = 3000;
  var textItems = __stnRtI18n.textNodes.filter(function (x) { return x && x.node && x.node.isConnected; }).slice(0, maxItems);
  var attrItems = __stnRtI18n.attrNodes.filter(function (x) { return x && x.el && x.el.isConnected; }).slice(0, maxItems);

  var q = [];
  textItems.forEach(function (x) { q.push({ kind: 'text', ref: x, value: x.original }); });
  attrItems.forEach(function (x) { q.push({ kind: 'attr', ref: x, value: x.original }); });

  var i = 0;
  var workers = [];
  var concurrency = 8;
  for (var w = 0; w < concurrency; w++) {
    workers.push((async function () {
      while (true) {
        var idx = i++;
        if (idx >= q.length) break;
        var item = q[idx];
        var translated = await _stnTranslateText(item.value, lang);
        if (item.kind === 'text') {
          if (item.ref.node && item.ref.node.isConnected) item.ref.node.nodeValue = translated;
        } else if (item.kind === 'attr') {
          if (item.ref.el && item.ref.el.isConnected) item.ref.el.setAttribute(item.ref.attr, translated);
        }
      }
    })());
  }
  await Promise.all(workers);
}

function _tLookup(lang, key) {
  var T = TRANSLATIONS[lang] || {};
  return T[key] || TRANSLATIONS.en[key] || '';
}

function _applyLangToDom(lang) {
  var T = TRANSLATIONS[lang];
  if (!T) return;

  ['ar', 'fr', 'en'].forEach(function (l) {
    var btn = document.getElementById('lang-' + l);
    if (btn) btn.classList.toggle('active', l === lang);
  });
  document.querySelectorAll('[data-nav-lang]').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-nav-lang') === lang);
  });

  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-lang]').forEach(function (el) {
    var key = el.getAttribute('data-lang');
    var v = _tLookup(lang, key);
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-lang-placeholder]').forEach(function (el) {
    var key = el.getAttribute('data-lang-placeholder');
    var v = _tLookup(lang, key);
    if (v) el.setAttribute('placeholder', v);
  });
  document.querySelectorAll('[data-lang-title]').forEach(function (el) {
    var key = el.getAttribute('data-lang-title');
    var v = _tLookup(lang, key);
    if (v) el.setAttribute('title', v);
  });

  var hs = document.getElementById('home-search');
  if (hs) {
    var hp = _tLookup(lang, 'hero-search');
    if (hp) hs.placeholder = hp;
  }
  var cartTitle = document.querySelector('.cart-header h2');
  if (cartTitle) {
    var ct = _tLookup(lang, 'cart-title');
    if (ct) cartTitle.textContent = ct;
  }
  var checkoutBtn = document.getElementById('cart-checkout-btn');
  if (checkoutBtn) {
    var co = _tLookup(lang, 'checkout-btn');
    if (co) checkoutBtn.textContent = co + ' \u2192';
  }
  var trackInput = document.getElementById('track-num');
  if (trackInput) {
    var tp = _tLookup(lang, 'track-placeholder');
    if (tp) trackInput.placeholder = tp;
  }
}

function setLang(lang, opts){
  var options = opts || {};
  var safe = _safeLang(lang);
  var prev = window._currentLang || 'fr';
  window._currentLang = safe;
  try { localStorage.setItem('stn_lang', safe); } catch(e) {}

  // Record unseen text/attr nodes while they still match the HTML baseline (before dictionary
  // patches). Otherwise originals freeze to dictionary strings and machine translate degrades.
  _stnCaptureOriginalDomTexts();

  _applyLangToDom(safe);
  _stnTranslateWholeDom(safe).catch(function () {});

  if(typeof AI !== 'undefined') AI.setLang(safe);
  if(!options.silent && prev !== safe && typeof toast === 'function'){
    var f = {ar:'AR - \u0639\u0631\u0628\u064a', fr:'FR - Francais', en:'EN - English'};
    toast(f[safe], 'default');
  }

  setTimeout(function () {
    try {
      if (typeof window.renderSMIkeaGrid === 'function') window.renderSMIkeaGrid();
      if (typeof window.updateSM === 'function') window.updateSM();
      // Sur Mesure grid is injected after first pass; capture + translate new nodes.
      _stnCaptureOriginalDomTexts();
      _stnTranslateWholeDom(safe).catch(function () {});
    } catch (eSm) {}
  }, 90);
}

window.STNI18N = {
  getLang: function () { return _safeLang(window._currentLang || 'fr'); },
  setLang: setLang,
  t: function (key, fallback) {
    var lang = _safeLang(window._currentLang || 'fr');
    var T = TRANSLATIONS[lang] || {};
    return T[key] || TRANSLATIONS.en[key] || fallback || key;
  },
  /** Re-run machine translation after large innerHTML updates (e.g. product modal). */
  refreshMachineTranslate: function () {
    var lang = _safeLang(window._currentLang || 'fr');
    _stnCaptureOriginalDomTexts();
    return _stnTranslateWholeDom(lang);
  },
};

(function initLanguageSystem() {
  try {
    var stored = localStorage.getItem('stn_lang');
    if (stored) window._currentLang = _safeLang(stored);
  } catch (e) {}

  var applySaved = function () {
    setLang(window._currentLang || 'fr', { silent: true, internal: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySaved);
  } else {
    applySaved();
  }

})();


// ── AI ASSISTANT ──
var AI = (function(){
  var history = [];
  var currentLang = 'fr';
  var isOpen = false;
  var isSending = false;

  /**
   * Google AI Studio keys use the Generative Language API (free tier / rate limits per AI Studio).
   * Same REST as documented at https://ai.google.dev/gemini-api/docs — not Vertex AI billing.
   * Live key: repo secret GEMINI_API_KEY → Actions writes everest-env.js (window.EVEREST_GEMINI_API_KEY), or gemini-key.local.js locally.
   * Model order: 2.5 Lite/Flash first. 429/503 → try next model. Worker optional fallback if no browser key.
   */
  var YASMINE_WORKER_URL = 'https://yasmine-proxy.bensalemyassine063.workers.dev';

  /** Empty string = Worker disabled. If unset, default URL is used (non–github.io only unless you set this explicitly). */
  function getYasmineWorkerUrl() {
    try {
      if (typeof window !== 'undefined' && typeof window.EVEREST_YASMINE_WORKER_URL === 'string') {
        return window.EVEREST_YASMINE_WORKER_URL.trim();
      }
    } catch (eW) {}
    return YASMINE_WORKER_URL;
  }

  /**
   * github.io: do not use the default third-party Worker (often wrong/expired key). Use Actions-injected everest-env.js or set EVEREST_YASMINE_WORKER_URL to your own Worker.
   */
  function useWorkerFallback() {
    var url = getYasmineWorkerUrl();
    if (!url) return false;
    try {
      var host = location.hostname || '';
      if (host.indexOf('github.io') === -1) return true;
      return typeof window !== 'undefined' && typeof window.EVEREST_YASMINE_WORKER_URL === 'string';
    } catch (eG) {}
    return true;
  }
  var GEMINI_MODEL_DEFAULTS = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
  ];
  var MODEL_OK_STORAGE = 'everest_yasmine_ok_model';
  var GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
  /** Last Google/Worker error text (no secrets) — shown if chat falls back. Not related to Supabase. */
  var _yasmineLastAiError = '';

  function yLogWarn() {
    try {
      if (typeof console !== 'undefined' && typeof console.warn === 'function') {
        console.warn.apply(console, arguments);
      }
    } catch (eLw) {}
  }

  function getGeminiApiKey() {
    try {
      var env = typeof window !== 'undefined' && window.__EVEREST_ENV__;
      if (env && typeof env === 'object') {
        var ek = String(env.GEMINI_API_KEY || env.EVEREST_GEMINI_API_KEY || '').trim();
        if (ek) return ek;
      }
    } catch (eEnv) {}
    try {
      if (typeof window !== 'undefined' && window.EVEREST_GEMINI_API_KEY) {
        var wk = String(window.EVEREST_GEMINI_API_KEY).trim();
        if (wk) return wk;
      }
    } catch (e0) {}
    try {
      if (typeof localStorage !== 'undefined') {
        var ls = localStorage.getItem('everest_gemini_api_key');
        if (ls && String(ls).trim()) return String(ls).trim();
      }
    } catch (e1) {}
    return '';
  }

  function parseGeminiJson(data) {
    if (!data || data.error) return { text: null, err: data && data.error };
    var c0 = data.candidates && data.candidates[0];
    var part = c0 && c0.content && c0.content.parts && c0.content.parts[0];
    if (part && part.text) return { text: part.text, err: null };
    return { text: null, err: { message: 'no candidates' } };
  }

  function buildGeminiModelList() {
    var seen = {};
    var out = [];
    try {
      var ok = sessionStorage.getItem(MODEL_OK_STORAGE);
      if (ok && String(ok).indexOf('gemini-') === 0) {
        out.push(String(ok).trim());
        seen[out[0]] = true;
      }
    } catch (e0) {}
    for (var i = 0; i < GEMINI_MODEL_DEFAULTS.length; i++) {
      var m = GEMINI_MODEL_DEFAULTS[i];
      if (!seen[m]) {
        out.push(m);
        seen[m] = true;
      }
    }
    return out;
  }

  /** Stop retries only when another model cannot help (invalid key, blocked). 429 = try next model. */
  function isGeminiHardStopError(code, msg) {
    var s = String(msg || '');
    if (code === 403) return true;
    if (code === 400 && /API key|API_KEY|invalid.*key|PERMISSION_DENIED/i.test(s)) return true;
    return false;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var ctrl = new AbortController();
    var id = setTimeout(function () {
      ctrl.abort();
    }, timeoutMs);
    return fetch(url, Object.assign({}, options, { signal: ctrl.signal })).finally(function () {
      clearTimeout(id);
    });
  }

  /** POST :generateContent — AI Studio / Generative Language API (browser key in query per Google REST). */
  function requestGeminiDirect(contents, modelsArr, modelIndex, onDone) {
    var key = getGeminiApiKey();
    if (!key || !modelsArr || modelIndex >= modelsArr.length) {
      if (key && modelsArr && modelIndex >= modelsArr.length && modelIndex > 0) {
        try {
          sessionStorage.removeItem(MODEL_OK_STORAGE);
        } catch (eClr) {}
      }
      onDone(null);
      return;
    }
    var model = modelsArr[modelIndex];
    var url =
      GEMINI_API_BASE +
      '/models/' +
      encodeURIComponent(model) +
      ':generateContent?key=' +
      encodeURIComponent(key);
    fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: contents }),
      },
      45000
    )
      .then(function (r) {
        return r.text();
      })
      .then(function (text) {
        var data;
        try {
          data = JSON.parse(text);
        } catch (parseEx) {
          yLogWarn('[Yasmine] Gemini JSON parse', parseEx);
          requestGeminiDirect(contents, modelsArr, modelIndex + 1, onDone);
          return;
        }
        var parsed = parseGeminiJson(data);
        if (parsed.text) {
          try {
            sessionStorage.setItem(MODEL_OK_STORAGE, model);
          } catch (eS) {}
          onDone(parsed.text);
          return;
        }
        if (data.error) {
          var code = data.error.code;
          var em = (data.error.message || String(data.error.status || '')).slice(0, 220);
          _yasmineLastAiError = 'Gemini (' + model + '): ' + em;
          yLogWarn('[Yasmine]', _yasmineLastAiError);
          if (isGeminiHardStopError(code, em)) {
            onDone(null);
            return;
          }
        }
        requestGeminiDirect(contents, modelsArr, modelIndex + 1, onDone);
      })
      .catch(function () {
        requestGeminiDirect(contents, modelsArr, modelIndex + 1, onDone);
      });
  }

  function requestWorkerProxy(contents, userMsg, onDone) {
    var workerUrl = getYasmineWorkerUrl();
    if (!workerUrl) {
      onDone(null, userMsg);
      return;
    }
    var xhr = new XMLHttpRequest();
    xhr.open('POST', workerUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 30000;
    xhr.onload = function () {
      if (xhr.status !== 200) {
        _yasmineLastAiError = 'Worker HTTP ' + xhr.status;
        yLogWarn('[Yasmine]', _yasmineLastAiError);
        removeTyping();
        onDone(null, userMsg);
        return;
      }
      try {
        var data = JSON.parse(xhr.responseText);
        // Do not stop here: let the caller try browser Gemini (when a key exists) before offline fallback.
        if (data.error) {
          var wm = (data.error.message || String(data.error.code || '')).slice(0, 220);
          _yasmineLastAiError = 'Worker: ' + wm;
          yLogWarn('[Yasmine]', _yasmineLastAiError);
          onDone(null, userMsg);
          return;
        }
        removeTyping();
        var parsed = parseGeminiJson(data);
        if (parsed.text) {
          history.push({ role: 'assistant', content: parsed.text });
          appendMsg('bot', parsed.text);
          onDone('__handled__', userMsg);
          return;
        }
      } catch (e) {
        console.log('Worker parse error:', e);
      }
      removeTyping();
      onDone(null, userMsg);
    };
    xhr.onerror = function () {
      _yasmineLastAiError = 'Worker: network error (blocked, offline, or CORS)';
      yLogWarn('[Yasmine]', _yasmineLastAiError);
      removeTyping();
      onDone(null, userMsg);
    };
    xhr.ontimeout = function () {
      _yasmineLastAiError = 'Worker: request timed out';
      yLogWarn('[Yasmine]', _yasmineLastAiError);
      removeTyping();
      onDone(null, userMsg);
    };
    xhr.send(JSON.stringify({ contents: contents }));
  }

  function finishWithFallback(userMsg) {
    removeTyping();
    var fb = getOfflineReply(userMsg);
    history.push({ role: 'assistant', content: fb });
    appendMsg('bot', fb);
    isSending = false;
    syncComposerUi();
  }

  /** User-facing hint — avoids echoing raw Google strings like "API key expired" in the chat bubble. */
  function friendlyAiErrorSummary(raw) {
    if (!raw || typeof raw !== 'string') return '';
    var s = raw;
    if (/leaked|reported as leaked|use another API key/i.test(s)) {
      return currentLang === 'ar'
        ? 'حظر Google هذا المفتاح لأنه ظهر علناً. أنشئ مفتاحاً جديداً في AI Studio، احذف القديم، حدّث سر GitHub GEMINI_API_KEY وأعد النشر. لا تلصق المفتاح في الدردشة أو Git.'
        : currentLang === 'en'
          ? 'Google disabled this key (it was exposed publicly—e.g. chat, screenshot, or git). Create a new key at https://aistudio.google.com/apikey , revoke the old one, update GitHub secret GEMINI_API_KEY, run Actions deploy again. Never commit or paste keys.'
          : 'Google a bloqué cette clé (exposition publique). Créez une **nouvelle** clé dans AI Studio, révoquez l’ancienne, mettez à jour le secret **GEMINI_API_KEY** sur GitHub, relancez le déploiement.';
    }
    if (/API key expired|API_KEY_INVALID|invalid API key|API key not valid|Please renew|PERMISSION_DENIED/i.test(s)) {
      return currentLang === 'ar'
        ? 'تحقق من مفتاح Gemini: سر GitHub GEMINI_API_KEY أو gemini-key.local.js أو Worker — مفتاح AI Studio + مرجع HTTP للموقع.'
        : currentLang === 'en'
          ? 'Check your Gemini key: GitHub secret GEMINI_API_KEY (Pages deploy), gemini-key.local.js, or Worker GEMINI_API_KEY — must be an AI Studio key with your site URL in HTTP referrers.'
          : 'Vérifiez la clé Gemini : secret GitHub GEMINI_API_KEY (déploiement Pages), gemini-key.local.js, ou secret Worker — clé AI Studio + référents HTTP du site.';
    }
    if (/429|quota|RESOURCE_EXHAUSTED|rate limit|Too Many Requests|billing|exceeded your current quota/i.test(s)) {
      return currentLang === 'ar'
        ? 'حصّة Google Gemini ممتلئة أو محدودة. افتح aistudio.google.com → الاستخدام/الفوترة، أو انتظر قليلاً وأعد المحاولة.'
        : currentLang === 'en'
          ? 'Google Gemini quota or rate limit (free tier fills fast). Open aistudio.google.com → check usage / billing, or wait a few minutes.'
          : 'Quota ou limite Google Gemini. Ouvrez aistudio.google.com → usage / facturation, ou attendez quelques minutes.';
    }
    if (/503|UNAVAILABLE|high demand|overloaded|Service Unavailable|try again later|temporarily unavailable/i.test(s)) {
      return currentLang === 'ar'
        ? 'خوادم Google مشغولة مؤقتاً (503). انتظر دقيقة أو دقيقتين وأعد السؤال — ليس خطأ في إعدادات الموقع.'
        : currentLang === 'en'
          ? 'Google Gemini is temporarily overloaded (503). Wait 1–2 minutes and try again — this is not your site configuration.'
          : 'Google Gemini est temporairement saturé (503). Attendez 1–2 minutes et réessayez — ce n’est pas un problème de configuration du site.';
    }
    if (/404|is not found|not supported for generateContent/i.test(s)) {
      return currentLang === 'ar'
        ? 'نموذج Gemini غير متاح لهذا المفتاح — حدّث المشروع أو جرّب مفتاحاً من AI Studio.'
        : currentLang === 'en'
          ? 'Gemini model not available for this key — update the app or verify the key in AI Studio.'
          : 'Modèle Gemini indisponible pour cette clé — mettez à jour l’app ou vérifiez la clé AI Studio.';
    }
    return s.slice(0, 160);
  }

  function offlineCloudUnavailableMessage() {
    var hint =
      currentLang === 'ar'
        ? '\n\n**مهم:** ياسمين تستخدم **Google AI Studio**. للموقع المنشور: أضف سر **GEMINI_API_KEY** في GitHub وشغّل GitHub Actions، أو ارفع `gemini-key.local.js`، أو Worker. أضف رابط موقعك في قيود **HTTP referrers** للمفتاح.'
        : currentLang === 'en'
          ? '\n\n**Important:** Yasmine uses **Google AI Studio** (Generative Language API) — **not** Supabase/SQL. Live site: add repository secret **GEMINI_API_KEY** and deploy with **GitHub Actions** (see `.github/workflows/deploy-github-pages.yml`), **or** upload `gemini-key.local.js`, **or** use a Cloudflare Worker secret. Always allow your site URL under the key’s **HTTP referrer** restrictions.'
          : '\n\n**Important :** Yasmine utilise **Google AI Studio** (API Generative Language). En ligne : secret dépôt **GEMINI_API_KEY** + déploiement **GitHub Actions**, ou `gemini-key.local.js`, ou Worker Cloudflare. Autorisez l’URL du site dans les **référents HTTP** de la clé.';
    var tech = '';
    if (_yasmineLastAiError) {
      var fr = friendlyAiErrorSummary(_yasmineLastAiError);
      if (fr) tech = '\n\n_(' + fr + ')_';
    }
    if (currentLang === 'ar')
      return 'تعذّر الاتصال بـ Google Gemini. **من نحن** و**تتبع** + **STN-** يعملان دائمًا.' + hint + tech;
    if (currentLang === 'en')
      return 'Could not reach **Google Gemini** (AI for this chat). **About** and **Track** (STN-) still work.' + hint + tech;
    return 'Impossible de joindre **Google Gemini** (IA de ce chat). **À propos** et **Suivi** (STN-) fonctionnent.' + hint + tech;
  }

  var SYSTEM = `You are Yasmine, the AI assistant for Everest — Hit Your Dreams — Tunisia's premium artisan marketplace (also described as a digital mall for curated Tunisian crafts). You are a capable general assistant for anything about Everest, shopping on the site, artisans, logistics, and vendor rules. Speak Arabic, French, or English and match the user's language.

How to answer:
- Be natural and conversational — not a rigid FAQ bot. Use the knowledge below plus LIVE DATA when present.
- **Products / “do you have X?”**: If LIVE DATA includes **MATCHED_PRODUCTS_FOR_THIS_QUESTION** or **ALL_VISIBLE_NAMES** and the user’s item appears there (same or very close name), you **must** say Everest **does** list it on this device and point them to **Collections** for photos and checkout. **Never** say “we don’t have it” or “we don’t sell that” when the name appears in LIVE DATA. If **CATALOG_ON_DEVICE** is empty, say you cannot see live inventory on this browser yet and ask them to open **Collections** or refresh — do not invent stock.
- If the user asks something you truly cannot infer from this brief or LIVE DATA (private deals, unreleased features, legal advice, other companies), say clearly that you do not have verified public information and point them to the About page or site support — do not invent facts.
- For "who owns Everest" / founder / CEO: the public About page lists Yassine Ben Salem as CEO & Founder (from Monastir), Amina Trabelsi as CTO (from Ksar Hellal, platform architecture), Khaled Sfaxsi as Head of Design, Sarra Nabeuli as Head of Artisans. There is no single "owner" in a legal sense in your brief — describe the leadership team accurately and suggest About for full bios.
- Product scope: Everest focuses on handmade / artisan Tunisian goods — furniture, ceramics, lighting, rugs, decor, fragrances, custom furniture, bedroom sets, etc. It is NOT a consumer electronics or computer store: no laptops, gaming PCs, phones, tablets, or generic tech unless clearly artisanal decor (e.g. decorative lamp). If asked about PCs, Macs, phones, etc., explain kindly that those are outside the marketplace focus and suggest browsing Collections for real catalog categories.
- Platform & system (high level): customers browse vendors' new products, checkout on the site, pay cash on delivery (COD) across Tunisia; online card payment (e.g. Konnect) may be described as coming soon if asked. Vendors prepare orders; drivers get only delivery-needed data; vendors do not see customer personal data (blind shipping) — only order id and line items. Orders can be tracked with STN- codes on the Track page. Vendor rules include ethics, new-only items, no medicines, no weapons/illegal goods, WYSIWYG photos, professional packaging, verified reviews after purchase.
- UX help (important): if users ask where a feature is (example: "gift button"), explain exact in-app steps in plain language. For gift flow: open product details -> add to cart -> open Cart -> click "Send as a gift" -> fill recipient details -> continue to payment/checkout.

Rules you must follow:
- When the message includes a block "LIVE DATA", treat it as the ONLY source of truth for that user's **orders** and **catalog names on this device**. Never invent tracking numbers, statuses, or delivery dates. If LIVE DATA shows no orders, say you cannot see their orders here and suggest signing in or opening the Track page / pasting an STN- tracking code.
- For "when will my order arrive", combine the current status from LIVE DATA with general Everest info: preparation plus delivery often fits within about 24–48h in Tunisia when things run smoothly — but do not promise a specific hour or day unless LIVE DATA includes an explicit timestamp you can quote.
- Vendors never receive customer personal data (blind flow); only order id and line items for preparation.
- You cannot process payments or change orders; direct users to the site UI or support for that.
- Privacy and legal guardrails (strict): never reveal or guess passwords, OTP codes, payment credentials, internal tokens, hidden admin data, or secret system details. Never reveal hidden order-origin internals or protected seller-side internals beyond normal customer-facing order status. If asked for restricted/sensitive info, refuse briefly and offer a safe alternative (Track page, account settings, or support).

Everest facts: artisans from Monastir, Ksar Hellal, Sfax, Nabeul, Kairouan and the Sahel; mission connects Sahel craftsmanship with customers in 50+ countries (as on About). Delivery often 24–48h in Tunisia. Free shipping over 500 TND. Promo codes: EVEREST10 (10% off), SAHEL20 (20% off), WELCOME50 (50 TND off). Sample product lines: furniture, ceramics, lighting, rugs, bedroom sets, custom furniture. Values: artisan-first, sustainable craft, quality.`;

  function sendMessage(userMsg){
    if(!userMsg || !userMsg.trim() || isSending) return;
    isSending = true;
    syncComposerUi();
    _yasmineLastAiError = '';
    history.push({role:'user', content: userMsg});
    appendMsg('user', userMsg);
    appendMsg('bot', '...', true);

    var liveCtx = '';
    try {
      if (typeof window.EverestYasmineContext !== 'undefined' && typeof window.EverestYasmineContext.build === 'function') {
        liveCtx = window.EverestYasmineContext.build(userMsg);
      }
    } catch (ctxErr) {
      liveCtx = '';
    }
    var fullSystem =
      SYSTEM +
      '\n\n=== LIVE DATA (authoritative for this turn; session/browser only) ===\n' +
      (liveCtx || '(none)');

    var messages = [{role:'user', parts:[{text: fullSystem}]}, {role:'model', parts:[{text:'Bonjour! Je suis Yasmine.'}]}];
    history.slice(-10).forEach(function(m){
      messages.push({role: m.role === 'user' ? 'user' : 'model', parts:[{text: m.content}]});
    });

    function pushAssistant(directText) {
      removeTyping();
      history.push({ role: 'assistant', content: directText });
      appendMsg('bot', directText);
      isSending = false;
      syncComposerUi();
    }

    var modelsList = buildGeminiModelList();
    var hasKey = !!getGeminiApiKey();
    var isHttp = false;
    try {
      isHttp = location.protocol === 'http:' || location.protocol === 'https:';
    } catch (eP) {}

    if (hasKey && isHttp) {
      requestGeminiDirect(messages, modelsList, 0, function (directText) {
        if (directText) {
          pushAssistant(directText);
          return;
        }
        finishWithFallback(userMsg);
      });
      return;
    }

    if (!useWorkerFallback()) {
      finishWithFallback(userMsg);
      return;
    }

    requestWorkerProxy(messages, userMsg, function (workerResult) {
      if (workerResult === '__handled__') return;
      if (hasKey) {
        appendMsg('bot', '...', true);
        requestGeminiDirect(messages, modelsList, 0, function (directText) {
          if (directText) {
            pushAssistant(directText);
            return;
          }
          finishWithFallback(userMsg);
        });
        return;
      }
      finishWithFallback(userMsg);
    });
  }

  function getOfflineReply(msg){
    try {
      if (typeof window.EverestYasmineContext !== 'undefined' && typeof window.EverestYasmineContext.tryLocalAnswer === 'function') {
        var smart = window.EverestYasmineContext.tryLocalAnswer(msg, currentLang);
        if (smart) return smart;
      }
    } catch (eSmart) {}

    var m = msg.toLowerCase();
    var ar = currentLang==='ar', en = currentLang==='en';

    // Greetings
    if(m.match(/^(hi|hello|hey|salut|bonjour|bonsoir|مرحبا|السلام|هلا|coucou|slt)/))
      return ar ? 'مرحبا! أنا ياسمين، مساعدتك في Everest 🛍️ كيف يمكنني مساعدتك اليوم؟' : en ? 'Hi! I am Yasmine, your Everest assistant 🛍️ How can I help you today?' : 'Bonjour! Je suis Yasmine, votre assistante Everest 🛍️ Comment puis-je vous aider?';

    // How are you (casual English / typos: "how u doing", "how r u", etc.)
    if (
      m.includes('how are') ||
      /\bhow\s+are\s*u\b/.test(m) ||
      /\bhow\s*r\s*u\b/.test(m) ||
      /\bhow\s*(u|you)\s*(doing|doin|going)\b/.test(m) ||
      /\bhow\s*u\s*(doing|doin|going)\b/.test(m) ||
      /how[^a-z0-9]*u[^a-z0-9]*(?:doing|doin|going)\b/i.test(msg) ||
      /\bhow's\s*it\s*going\b/.test(m) ||
      /\bhow\s+is\s+it\s+going\b/.test(m) ||
      /\bwhat'?s\s+up\b/.test(m) ||
      /\bwhats\s+up\b/.test(m) ||
      /\bwassup\b/.test(m) ||
      m.trim() === 'sup' ||
      /^sup\s/.test(m) ||
      m.includes('comment tu') ||
      m.includes('comment vas') ||
      m.includes('ça va') ||
      m.includes('ca va') ||
      m.includes('tu vas bien') ||
      m.includes('كيف حالك') ||
      m.includes('كيفك') ||
      m.includes('شنوا أحوالك')
    )
      return ar ? 'أنا بخير شكراً! مستعدة لمساعدتك في إيجاد أفضل المنتجات التونسية 😊' : en ? 'I am doing great, thanks! 😊 I am here for Everest — crafts, orders, delivery, anything you need.' : 'Je vais tr\u00e8s bien merci! \ud83d\ude0a Je suis l\u00e0 pour Everest — produits, commandes, livraison, tout ce qu\u2019il vous faut.';

    // No keyword catalog here — open questions need cloud AI. Honest fallback:
    return offlineCloudUnavailableMessage();
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

  function composerLabels() {
    if (currentLang === 'ar') {
      return {
        placeholder: 'اسأل عن الطلبات، المنتجات، أو إرسال هدية...',
        sendTitle: 'إرسال',
      };
    }
    if (currentLang === 'en') {
      return {
        placeholder: 'Ask about products, orders, or gift checkout...',
        sendTitle: 'Send',
      };
    }
    return {
      placeholder: 'Posez une question sur produits, commandes, ou cadeau...',
      sendTitle: 'Envoyer',
    };
  }

  function syncComposerUi() {
    var inp = document.getElementById('yasmine-input');
    var sendBtn = null;
    if (inp && inp.parentElement) {
      sendBtn = inp.parentElement.querySelector('button');
    }
    var lb = composerLabels();
    if (inp) {
      inp.placeholder = lb.placeholder;
      inp.disabled = !!isSending;
      inp.style.opacity = isSending ? '0.75' : '1';
    }
    if (sendBtn) {
      sendBtn.disabled = !!isSending;
      sendBtn.title = lb.sendTitle;
      sendBtn.style.opacity = isSending ? '0.7' : '1';
      sendBtn.style.cursor = isSending ? 'not-allowed' : 'pointer';
    }
  }

  function toggle(){
    isOpen = !isOpen;
    var panel = document.getElementById('yasmine-panel');
    if(panel) panel.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) syncComposerUi();
    if(isOpen && !document.querySelector('.ym-msg')) {
      appendMsg('bot', currentLang==='ar' ? 'مرحبا! \u0623\u0646\u0627 \u064a\u0627\u0633\u0645\u064a\u0646\u060c \u0643\u064a\u0641 \u064a\u0645\u0643\u0646\u0646\u064a \u0645\u0633\u0627\u0639\u062f\u062a\u0643?' : currentLang==='en' ? 'Hi! I\'m Yasmine. How can I help you today?' : 'Bonjour! Je suis Yasmine. Comment puis-je vous aider?');
    }
  }

  function handleKey(e){ if(e.key==='Enter') { var inp=document.getElementById('yasmine-input'); if(inp && inp.value.trim()){sendMessage(inp.value.trim());inp.value='';}} }

  function quickBtn(text){ sendMessage(text); }

  try {
    if (typeof console !== 'undefined') {
      var k0 = getGeminiApiKey();
      var http0 = location.protocol === 'http:' || location.protocol === 'https:';
      if (k0 && http0 && console.info) {
        console.info('[Everest Yasmine] Browser Gemini (AI Studio key in page).');
      } else if (useWorkerFallback() && console.info) {
        console.info('[Everest Yasmine] No browser key — Worker fallback:', getYasmineWorkerUrl());
      } else {
        yLogWarn(
          '[Everest Yasmine] No browser API key on this origin. If GitHub Pages: repo → Settings → Secrets → GEMINI_API_KEY, Pages → Build with Actions, push main. ' +
            'Then open /everest-env.js — it must show window.EVEREST_GEMINI_API_KEY = \'AIza…\'. Clear site data if the PWA cached old JS. ' +
            'Optional: set window.EVEREST_YASMINE_WORKER_URL to your own Worker before yasmine.js.'
        );
      }
    }
  } catch (eLog) {}

  return {
    toggle: toggle,
    send: function(){ var inp=document.getElementById('yasmine-input'); if(inp && inp.value.trim()){sendMessage(inp.value.trim());inp.value='';} },
    key: handleKey,
    quick: quickBtn,
    setLang: function(l){ currentLang=l; syncComposerUi(); }
  };
})();

console.log('Everest assistant layer ready');
