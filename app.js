const live = 'https://www.librairiedutemple.fr/';
const params = new URLSearchParams(location.search);
const root = document.querySelector('#contenu');
const route = params.get('page') || 'home';
const price = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const cartKey = 'temple-marais-demo-cart';
const by = (selector, context = document) => context.querySelector(selector);
const all = (selector, context = document) => [...context.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const href = (page, values = {}) => './?' + new URLSearchParams({ page, ...values });
const categoryHref = id => href('rayon', { id });
const productHref = id => href('produit', { id });
const announce = message => { by('#annonce').textContent = message; };

const icons = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  account: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/>',
  bag: '<path d="M4 7h16l1 14H3L4 7Z"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  play: '<path d="m8 5 12 7-12 7V5Z"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const iconButton = (glyph, label, attributes = '') => `<button type="button" class="icon-btn" aria-label="${esc(label)}" ${attributes}>${icon(glyph)}</button>`;
const logo = `<a class="logo" href="./" aria-label="Librairie du Temple, accueil"><img src="./assets/logo.jpg" alt="Librairie du Temple" width="280" height="135"></a>`;
const shopAddress = '1 rue des Hospitalières Saint-Gervais, Paris 4e';
const address = `<address>1 rue des Hospitalières Saint-Gervais<br>Angle du 52 rue des Rosiers<br>75004 Paris</address><a href="tel:+33142723800">01 42 72 38 00</a>`;
const directions = 'https://www.google.com/maps/search/?api=1&query=Librairie+du+Temple+1+rue+des+Hospitali%C3%A8res+Saint-Gervais+Paris';
const official = (url, label = 'Voir sur le site de la librairie', style = 'text-link') => `<a class="${style}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;

let catalogue;
let categories;
let products;
let cart = readCart();

function readCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(cartKey) || '{}');
    return Object.fromEntries(Object.entries(raw).filter(([id, qty]) => /^\d+$/.test(id) && Number.isInteger(qty) && qty > 0 && qty <= 99));
  } catch { return {}; }
}

function updateCart() {
  try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch { /* Session cart remains usable. */ }
  const total = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  by('.cart-count').hidden = total === 0;
  by('.cart-count').textContent = total;
}

function textBlocks(entries = []) {
  let html = '';
  let listOpen = false;
  for (const [tag, value] of entries) {
    if (tag === 'li' && !listOpen) { html += '<ul>'; listOpen = true; }
    if (tag !== 'li' && listOpen) { html += '</ul>'; listOpen = false; }
    const safeTag = ['h2', 'h3', 'h4', 'li'].includes(tag) ? tag : 'p';
    html += `<${safeTag}>${esc(value)}</${safeTag}>`;
  }
  return html + (listOpen ? '</ul>' : '');
}

const branch = (id = null) => Object.values(categories).filter(item => item.parent === id).sort((a, b) => a.position - b.position);
const labelFor = id => ({ 13: 'Textes et traditions', 10: 'Objets de culte', 118: 'Langues', 8: 'Littérature', 4: 'Jeunesse', 9: 'Musique et vidéo', 11: 'Art', 117: 'Nouveautés' })[id] || categories[id]?.title;
const isCatalog = ['catalogue', 'rayon', 'nouveautes', 'coups', 'recherche'].includes(route);

function navGroup(id) {
  const item = categories[id];
  if (!item) return '';
  const sub = branch(id);
  if (!sub.length) return `<li><a href="${categoryHref(id)}">${esc(labelFor(id))}</a></li>`;
  return `<li><details><summary>${esc(labelFor(id))}${icon('down')}</summary><div class="menu-panel">
    <a class="text-link" href="${categoryHref(id)}">Tout le rayon ${esc(labelFor(id))} →</a>
    <div class="menu-links">${sub.map(child => `<a href="${categoryHref(child.id)}">${esc(labelFor(child.id))}</a>`).join('')}</div>
  </div></details></li>`;
}

function header() {
  by('#site-header').innerHTML = `
    <div class="paypal"><div class="wrap"><strong>Pay<span>Pal</span></strong><span>Paiement en plusieurs fois selon éligibilité</span><button type="button" data-paypal>En savoir plus</button></div></div>
    <div class="brand-row wrap">${logo}
      <form class="search" role="search" action="./">
        <input type="hidden" name="page" value="recherche">
        <button type="submit" aria-label="Rechercher">${icon('search')}</button>
        <label class="sr-only" for="search">Rechercher un titre, un auteur, un ISBN</label>
        <input type="search" id="search" name="q" value="${esc(params.get('q') || '')}" placeholder="Rechercher un titre, un auteur, un ISBN" required>
      </form>
      <div class="tools">
        <a href="${href('compte')}">${icon('account')}<span class="tool-text">Mon compte</span></a>
        <a href="${href('panier')}">${icon('bag')}<span class="tool-text">Panier</span><span class="cart-count" hidden></span></a>
        <button class="mobile-toggle" type="button" aria-controls="navigation" aria-expanded="false">${icon('menu')}<span class="sr-only">Menu</span></button>
      </div>
    </div>
    <nav class="nav" id="navigation" aria-label="Navigation principale"><ul class="nav-list wrap">
      <li><a href="${href('catalogue')}" ${isCatalog ? 'aria-current="true"' : ''}>Catalogue</a></li>
      ${['13','10','118','8','4','9','11'].map(navGroup).join('')}
      <li><a href="${href('librairie')}">La librairie</a></li>
      <li><a href="${href('contact')}">Contact</a></li>
    </ul></nav>`;
  const nav = by('.nav');
  const toggle = by('.mobile-toggle');
  const menus = all('.nav details');
  const close = (menu, restoreFocus = false) => {
    menu.open = false;
    if (restoreFocus) by('summary', menu).focus();
  };
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    if (!open) menus.forEach(menu => close(menu));
  });
  menus.forEach(menu => menu.addEventListener('toggle', () => {
    if (menu.open) menus.filter(other => other !== menu && other.open).forEach(other => close(other));
  }));
  document.addEventListener('click', event => {
    if (!event.target.closest('.nav')) menus.filter(menu => menu.open).forEach(menu => close(menu));
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const menu = menus.find(item => item.open);
    if (menu) close(menu, true);
    else if (nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
  by('[data-paypal]').addEventListener('click', () => openDialog('Payer avec PayPal', `<div class="flow"><p>Le site de la librairie affiche les options PayPal disponibles, selon l’éligibilité et les conditions PayPal.</p><p>Cette version est une démonstration. Elle ne traite aucun paiement.</p>${official(live, 'Consulter le site de la librairie', 'btn')}</div>`));
  updateCart();
}

function footer() {
  by('#site-footer').className = 'site-footer';
  by('#site-footer').innerHTML = `<div class="wrap"><div class="footer-grid">
    <div>${logo}${address}<a href="https://www.facebook.com/Librairie-du-Temple-1655504608000642/" target="_blank" rel="noopener">Nous suivre sur Facebook ↗</a></div>
    <div><h2>Explorer</h2><a href="${href('catalogue')}">Catalogue</a><a href="${href('nouveautes')}">Nouveautés</a><a href="${href('coups')}">Coups de cœur</a><a href="${href('plan')}">Plan du site</a></div>
    <div><h2>La librairie</h2><a href="${href('librairie')}">Nous trouver</a><a href="${href('personnalisation')}">Personnalisation</a><a href="${href('contact')}">Contact</a><a href="${href('compte')}">Mon compte</a></div>
    <div><h2>Restez au courant</h2><p>Vous souhaitez rester au courant de nos dernières nouveautés ?</p>${official(live + '#footer', 'S’abonner sur le site de la librairie')}</div>
  </div><div class="footer-line"><span>Prototype de modernisation · Les Rayons du Marais · Deux Rives Web</span><span><a href="${href('legal')}">Mentions légales</a> · <a href="${href('privacy')}">Politique de confidentialité</a> · <a href="${live}">Site officiel</a></span></div></div>`;
}

const slides = [
  { image: 'slide2.webp', alt: 'Œuvres de Myriam Cittanova', to: '189', label: 'Myriam Cittanova', detail: 'Le judaïsme à travers les yeux d’une artiste authentique.' },
  { image: 'slide5.webp', alt: 'Évadez-vous le temps d’une lecture, livres et plage', to: '86', label: 'Romans' },
  { image: 'slide1.webp', alt: 'Objets et décorations pour Hanoucca', to: '177', label: 'Hanoucca' },
  { image: 'slide3.webp', alt: 'Lexiques, dictionnaires et manuels pour votre voyage en Israël', to: '119', label: 'Dictionnaires' },
  { image: 'slide4.webp', alt: 'À Paris en ce moment ? Venez nous rendre visite !', to: null, label: 'Visiter la librairie' },
];

function bookCard(item, eager = false) {
  const title = item.display || item.title;
  return `<article class="book-card"><a href="${productHref(item.id)}">
    <div class="book-art"><img src="${esc(item.image)}" alt="" ${eager ? '' : 'loading="lazy"'} decoding="async"></div>
    <h3>${esc(title)}</h3>
  </a>${item.price != null ? `<p class="price">${price.format(item.price)}</p>` : ''}</article>`;
}

function shelf(title, id, items, page) {
  const books = items.map(pid => products[pid]).filter(Boolean);
  return `<section class="wrap section" aria-labelledby="${id}-title">
    <div class="section-head"><h2 id="${id}-title">${title}</h2><div class="section-actions">
      <div class="shelf-controls">${iconButton('left', title + ' précédents', `data-shelf-prev="${id}"`)}${iconButton('right', title + ' suivants', `data-shelf-next="${id}"`)}</div>
    </div></div>
    <div class="shelf" id="${id}" tabindex="0" aria-label="Carrousel ${title}">${books.map((item, index) => bookCard(item, id === 'new-shelf' && index < 4)).join('')}</div>
    <div class="shelf-end"><a class="text-link" href="${href(page)}">${page === 'nouveautes' ? 'Voir toutes les nouveautés' : 'Voir les coups de cœur'} →</a></div>
  </section>`;
}

const videos = {
  louise: { title: 'Rue des Rosiers · Louise de la Librairie du Temple', id: '71gzxucvxMQ', img: 'video-louise.jpg' },
  shop: { title: 'Présentation de la Librairie du Temple', id: 'g86rJCPfkOg', img: 'video-librairie.jpg' },
};

function videoPoster(key) {
  const video = videos[key];
  return `<button type="button" class="video-poster" data-video="${key}" aria-label="Regarder : ${video.title}"><img src="./assets/${video.img}" alt="" loading="lazy"><span class="play">${icon('play')}</span></button>`;
}

function campaignHref(slide) {
  return slide.to ? categoryHref(slide.to) : href('librairie');
}

function campaign() {
  const first = slides[0];
  return `<section class="wrap section campaign" aria-labelledby="campaign-title" aria-roledescription="carrousel">
    <div class="flow campaign-copy"><h2 id="campaign-title">En ce moment à la librairie</h2>
      <p data-campaign-copy>${first.detail}</p>
      <a class="btn" data-campaign-link href="${campaignHref(first)}">Découvrir la sélection</a>
    </div>
    <div class="campaign-media">
      <a class="campaign-panel" href="${campaignHref(first)}"><img src="./assets/${first.image}" alt="${first.alt}" width="1440" height="522" loading="lazy"></a>
      <div class="campaign-controls">${iconButton('left', 'Sélection précédente', 'data-campaign-prev')}
        <span data-campaign-index>01 / 05</span>${iconButton('right', 'Sélection suivante', 'data-campaign-next')}
      </div>
    </div>
  </section>`;
}

function home() {
  const themes = [
    ['40', 'Hébreu', 'rayon-40.jpg'], ['132', 'Torah, textes du Houmach', 'rayon-132.jpg'],
    ['6', 'Kabbale, livres en français', 'rayon-6.jpg'], ['177', 'Hanoucca', 'hanoucca.png'],
  ];
  return `
    <section class="entrance" aria-labelledby="home-title"><div class="wrap hero">
      <div class="entrance-copy"><p class="kicker">Librairie juive · Paris 4e</p><h1 id="home-title">Poussez la porte de la Librairie du Temple</h1>
        <p class="entrance-intro">Livres, traditions et culture juive au cœur du Marais.</p>
        <div class="entrance-actions"><a class="btn" href="${href('catalogue')}">Explorer les rayons</a>
          <a class="btn outline" href="${href('librairie')}">Préparer ma visite</a></div>
      </div>
      <figure class="entrance-photo"><div><img src="./assets/librairie.jpg" alt="Les rayonnages et la table de présentation de la Librairie du Temple" width="590" height="696" fetchpriority="high" decoding="async"></div></figure>
    </div></section>
    <section class="rayon-band" aria-labelledby="rayons-title"><div class="wrap rayons">
      <h2 id="rayons-title">Parcourir les rayons</h2><div class="rayon-links">
        ${[['132','Torah'],['40','Hébreu'],['6','Kabbale'],['4','Jeunesse'],['114','Fêtes juives']].map(([id,label]) => `<a href="${categoryHref(id)}">${label}<span aria-hidden="true">→</span></a>`).join('')}
      </div>
    </div></section>
    ${shelf('Nouveautés','new-shelf',catalogue.new,'nouveautes')}
    ${campaign()}
    <section class="feature-band" aria-labelledby="visit-title"><div class="wrap section feature">
      <div class="flow"><h2 id="visit-title">Au cœur du Marais</h2>
        <p>Découvrez le quartier, son histoire et ses visages avec notre vidéo Rue des Rosiers · Louise.</p>
        <p class="address-line">${icon('pin')}${shopAddress}</p><a class="text-link" href="${href('librairie')}">Adresse, horaires et itinéraire →</a>
      </div>
      ${videoPoster('louise')}
    </div></section>
    ${shelf('Coups de cœur','favorite-shelf',catalogue.favorites,'coups')}
    <section class="wrap section"><div class="section-head"><h2>À découvrir</h2></div><div class="category-tiles">
      ${themes.map(([id,label,image]) => `<a href="${categoryHref(id)}"><img src="./assets/${image}" alt="" loading="lazy"><span>${label} →</span></a>`).join('')}
    </div></section>
    <section class="visit-strip"><div class="wrap section shop-pair">
      <div class="flow"><p class="kicker">En librairie</p><h2>La personnalisation</h2><p>Un prénom ou un message en marquage à chaud sur un livre, une kippa ou une Haggada.</p><a class="text-link" href="${href('personnalisation')}">Découvrir le service →</a></div>
      <img class="shop-thumb" src="./assets/librairie.jpg" alt="Rayonnages de la Librairie du Temple" loading="lazy">
    </div></section>`;
}

function breadcrumb(current, previous = []) {
  return `<nav class="wrap breadcrumb" aria-label="Fil d’Ariane"><ol><li><a href="./">Accueil</a></li>
    ${previous.map(([title, url]) => `<li><a href="${esc(url)}">${esc(title)}</a></li>`).join('')}
    <li aria-current="page">${esc(current)}</li></ol></nav>`;
}

function pageHead(title, { kicker = '', intro = '', previous = [] } = {}) {
  document.title = title + ' · Librairie du Temple';
  return breadcrumb(title, previous) + `<header class="wrap page-head">${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}<h1>${esc(title)}</h1>${intro ? `<p>${esc(intro)}</p>` : ''}</header>`;
}

function ancestors(id) {
  const chain = [];
  let item = categories[id];
  while (item?.parent && categories[item.parent] && !chain.some(parent => parent.id === item.parent)) {
    item = categories[item.parent];
    chain.unshift(item);
  }
  return chain;
}

const normalized = input => String(input).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const searchWords = input => normalized(input).match(/[\p{L}\p{N}]+/gu) || [];
const sorters = {
  az: (a, b) => a.title.localeCompare(b.title, 'fr'),
  za: (a, b) => b.title.localeCompare(a.title, 'fr'),
  low: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  high: (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity),
};

function catalogPage() {
  const id = params.get('id');
  const category = route === 'rayon' ? categories[id] : null;
  if (route === 'rayon' && !category) return notFound('Rayon introuvable');
  const term = (params.get('q') || '').trim();
  const title = category ? labelFor(id) : { catalogue: 'Catalogue', nouveautes: 'Nouveautés', coups: 'Coups de cœur', recherche: 'Résultats de recherche' }[route];
  const previous = route === 'catalogue' ? [] : [['Catalogue', href('catalogue')], ...ancestors(id).map(parent => [labelFor(parent.id), categoryHref(parent.id)])];
  const sub = category ? branch(id) : route === 'catalogue' ? branch() : [];
  const officialUrl = category?.url || {
    catalogue: live + '1-home', nouveautes: live + '117-nouveautes', coups: live + 'promotions',
    recherche: live + 'search?' + new URLSearchParams({ controller: 'search', search_category: 'all', s: term }),
  }[route];
  return pageHead(title, {
    kicker: 'Librairie du Temple',
    intro: route === 'recherche' ? (term ? 'Recherche pour « ' + term + ' »' : 'Saisissez un titre, un auteur ou un ISBN.') : '',
    previous,
  }) + `<div class="wrap catalog">
    <aside class="side" aria-label="Rayons du catalogue"><h2>Les rayons</h2>
      ${branch().map(item => `<a ${item.id === id ? 'aria-current="page"' : ''} href="${categoryHref(item.id)}">${esc(labelFor(item.id))}</a>`).join('')}
      <a href="${href('coups')}">Coups de cœur</a>
    </aside>
    <section aria-label="${esc(title)}">
      ${category?.intro.length ? `<div class="copy">${textBlocks(category.intro)}</div>` : ''}
      ${sub.length ? `<div class="catalog-sub">${sub.map(item => `<a class="chip" href="${categoryHref(item.id)}">${esc(labelFor(item.id))}${icon('right')}</a>`).join('')}</div>` : ''}
      <div class="catalog-toolbar"><p class="subtle"><span data-count></span> dans l’aperçu</p>
        <label>Trier par <select data-sort><option value="">Sélection de la librairie</option><option value="az">Nom, A à Z</option><option value="za">Nom, Z à A</option><option value="low">Prix croissant</option><option value="high">Prix décroissant</option></select></label>
      </div>
      <div class="catalog-grid" data-products></div>
      <div class="catalog-more flow"><button class="btn outline" type="button" data-more>Voir plus dans l’aperçu</button>
        <p>${official(officialUrl, route === 'recherche' ? 'Rechercher dans le catalogue complet' : 'Voir la sélection complète sur le site officiel')}</p>
      </div>
    </section>
  </div>`;
}

function bindCatalog() {
  const grid = by('[data-products]');
  if (!grid) return;
  const id = params.get('id');
  const category = route === 'rayon' ? categories[id] : null;
  const words = searchWords(params.get('q') || '');
  const filter = item => {
    const fields = normalized([item.title, item.display, item.url, ...(item.features || []).map(([, value]) => value)].filter(Boolean).join(' '));
    return words.length && words.every(word => fields.includes(word));
  };
  const ids = category?.products || (route === 'nouveautes' ? catalogue.new : route === 'coups' ? catalogue.favorites : null);
  const items = route === 'recherche' ? Object.values(products).filter(filter) : ids ? ids.map(pid => products[pid]).filter(Boolean) : Object.values(products);
  const sort = by('[data-sort]');
  const more = by('[data-more]');
  let limit = 24;
  function render() {
    const sorter = sorters[sort.value];
    const ordered = sorter ? [...items].sort(sorter) : items;
    by('[data-count]').textContent = items.length + (items.length > 1 ? ' articles' : ' article');
    sort.disabled = items.length < 2;
    more.hidden = items.length <= limit;
    grid.innerHTML = ordered.slice(0, limit).map(item => bookCard(item)).join('') ||
      `<p class="empty">${route === 'recherche' ? 'Aucun article dans l’aperçu. Essayez un autre terme ou consultez le catalogue complet.' : 'Consultez ce rayon sur le site officiel de la librairie.'}</p>`;
  }
  sort.addEventListener('change', () => { limit = 24; render(); });
  more.addEventListener('click', () => {
    const firstNew = limit;
    limit += 24;
    render();
    all('.book-card a', grid)[firstNew]?.focus();
  });
  render();
}

function productPage() {
  const item = products[params.get('id')];
  if (!item) return notFound('Article introuvable');
  const title = item.display || item.title;
  document.title = title + ' · Librairie du Temple';
  const c = item.categories[0];
  const gallery = [...new Set([item.image, ...(item.gallery || [])])];
  const details = item.description?.length || item.features?.length;
  return breadcrumb(title, [['Catalogue', href('catalogue')], ...(c ? [[labelFor(c), categoryHref(c)]] : [])]) + `
    <section class="wrap product-page">
      <div><div class="book-art product-main-art"><img data-product-image src="${esc(gallery[0])}" alt="${esc(title)}" fetchpriority="high"></div>
        ${gallery.length > 1 ? `<div class="product-thumbs" aria-label="Images de l’article">${gallery.map((image,index) => `<button type="button" data-gallery="${esc(image)}" aria-label="Image ${index + 1}" aria-pressed="${index === 0}"><img src="${esc(image)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      </div>
      <div class="flow"><p class="kicker">${esc(c ? labelFor(c) : 'Librairie du Temple')}</p><h1>${esc(title)}</h1>
        ${item.price != null ? `<p class="product-price">${price.format(item.price)}</p>` : ''}
        ${item.summary?.length ? `<div class="copy">${textBlocks(item.summary)}</div>` : ''}
        ${item.stock && !item.available ? `<p class="subtle">${esc(item.stock)}</p>` : ''}
        ${item.flags?.length ? `<p class="subtle">${item.flags.map(esc).join(' · ')}</p>` : ''}
        ${item.available && item.price != null ? `<form class="product-buy" data-buy="${item.id}"><label class="qty">Quantité<input name="qty" type="number" min="1" max="99" value="1" required></label><button class="btn" type="submit">${icon('bag')}Ajouter au panier</button></form>
          <p><small class="subtle">Panier de démonstration. Les prix et disponibilités sont à confirmer sur le site officiel.</small></p><div class="status" data-added role="status"></div>` : ''}
        ${official(item.url, 'Voir la fiche sur le site officiel')}
      </div>
    </section>
    ${details ? `<section class="wrap product-details flow"><h2>Détails de l’article</h2>
      <div class="copy">${textBlocks(item.description)}</div>
      ${item.features?.length ? `<dl class="features">${item.features.map(([label,value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>` : ''}
    </section>` : ''}`;
}

function visitPage() {
  return pageHead('La librairie', { kicker: 'Paris · Le Marais', intro: 'Retrouvez la Librairie du Temple à l’angle de la rue des Rosiers et de la rue des Hospitalières Saint-Gervais.' }) +
    `<div class="wrap split">
      <section class="card flow"><h2>Nous trouver</h2>${address}
        <h3>Horaires</h3><dl class="features"><dt>Du dimanche au jeudi</dt><dd>10 h – 19 h 30</dd><dt>Vendredi</dt><dd>10 h – 13 h 30</dd></dl>
        ${official(directions, 'Ouvrir l’itinéraire', 'btn')} <a class="text-link" href="${href('contact')}">Nous contacter →</a>
      </section>
      <img class="shop-thumb" src="./assets/librairie.jpg" alt="Intérieur de la Librairie du Temple">
    </div>
    <section class="feature-band"><div class="wrap section feature"><div class="flow"><h2>En direct de la librairie</h2><p>Présentation de la Librairie du Temple.</p><a class="text-link" href="${href('personnalisation')}">Découvrir la personnalisation →</a></div>${videoPoster('shop')}</div></section>`;
}

function contactPage() {
  const subject = params.get('sujet') === 'personnalisation';
  return pageHead('Contactez-nous', { kicker: 'La librairie', intro: 'Infos pour personnalisation, service client ou site internet.' }) + `
    <div class="wrap split">
      <section class="card flow"><h2>Librairie du Temple</h2>${address}<a class="text-link" href="${href('librairie')}">Adresse et horaires →</a></section>
      <section class="card flow"><h2>Votre message</h2><p class="subtle">Formulaire de démonstration. Pour envoyer un message à la librairie, utilisez le formulaire officiel.</p>
        <form class="form-grid" data-preview-form>
          <label>Sujet<select name="subject"><option ${subject ? 'selected' : ''}>Infos pour personnalisation</option><option ${subject ? '' : 'selected'}>Service client</option><option>Site internet</option></select></label>
          <label>Adresse e-mail<input type="email" autocomplete="email" required></label>
          <label>Document joint (facultatif)<input type="file"></label>
          <label>Message<textarea rows="5" required></textarea></label>
          <label class="check"><input type="checkbox" required>Je comprends que ce formulaire est un aperçu et que les données saisies ne seront pas envoyées.</label>
          <button class="btn" type="submit">Tester le formulaire</button><p class="status" role="status"></p>
        </form>
        ${official(live + 'contact', 'Ouvrir le formulaire officiel')}
      </section>
    </div>`;
}

function accountPage() {
  const mode = params.get('mode');
  const recover = mode === 'mot-de-passe';
  const register = mode === 'creer';
  const title = recover ? 'Mot de passe oublié' : register ? 'Créer un compte' : 'Connectez-vous à votre compte';
  const link = live + (recover ? 'mot-de-passe-oublie' : register ? 'authentification?create_account=1' : 'mon-compte');
  return pageHead(title, { kicker: 'Espace client' }) + `<div class="wrap narrow"><section class="card flow">
    <p class="subtle">Aperçu de l’espace client. Pour utiliser votre compte, rendez-vous sur le site officiel.</p>
    <form class="form-grid" data-preview-form autocomplete="off">
      ${register ? '<label>Prénom<input type="text" required></label><label>Nom<input type="text" required></label>' : ''}
      <label>Adresse e-mail<input type="email" placeholder="exemple@exemple.fr" required></label>
      ${recover ? '' : '<label>Mot de passe<input type="password" autocomplete="off" required></label>'}
      <button class="btn" type="submit">Tester le formulaire</button><p class="status" role="status"></p>
    </form>
    <p>${official(link, recover ? 'Réinitialiser sur le site officiel' : register ? 'Créer un compte sur le site officiel' : 'Me connecter sur le site officiel')}</p>
    <p><a href="${href('compte', { mode: 'mot-de-passe' })}">Mot de passe oublié</a> · <a href="${href('compte', { mode: 'creer' })}">Créer un compte</a></p>
  </section></div>`;
}

function cartPage() {
  const rows = Object.entries(cart).filter(([id]) => products[id]?.price != null);
  const total = rows.reduce((sum, [id, qty]) => sum + Math.round(products[id].price * 100) * qty, 0) / 100;
  return pageHead('Panier', { kicker: 'Votre sélection', intro: 'Ce panier de démonstration est conservé dans votre navigateur.' }) + `
    <div class="wrap split cart-layout">
      <section class="card flow"><h2>Vos articles</h2>
        ${rows.length ? rows.map(([id, qty]) => {
          const item = products[id];
          const title = item.display || item.title;
          return `<div class="cart-row"><img src="${esc(item.image)}" alt=""><div><a href="${productHref(id)}">${esc(title)}</a><p class="subtle">${price.format(item.price)}</p>
            <div class="cart-actions"><label class="sr-only" for="qty-${id}">Quantité de ${esc(title)}</label><input id="qty-${id}" data-qty="${id}" type="number" min="1" max="99" value="${qty}"><button type="button" data-remove="${id}">Retirer</button></div></div><strong>${price.format(item.price * qty)}</strong></div>`;
        }).join('') : '<p>Votre panier est vide.</p>'}
        <a class="text-link" href="${href('catalogue')}">Continuer mes achats →</a>
      </section>
      <section class="card flow"><h2>Récapitulatif</h2><p>Sous-total : <strong>${price.format(total)}</strong></p><p class="subtle">Pour passer une vraie commande et voir les frais de livraison, ouvrez le site de la librairie.</p>${official(live, 'Commander sur le site officiel', 'btn')}</section>
    </div>`;
}

function servicePage() {
  return pageHead('La personnalisation', { kicker: 'En librairie', previous: [['La librairie', href('librairie')]] }) + `
    <div class="wrap split"><section class="card flow"><h2>Le marquage à chaud</h2><p>La Librairie du Temple propose de personnaliser des livres, des kippas et des Haggadot par marquage à chaud.</p>
      <p>Pour préciser votre demande, choisissez le sujet « Infos pour personnalisation » dans le formulaire de contact.</p>
      <a class="btn" href="${href('contact', { sujet: 'personnalisation' })}">Demander des informations</a>
    </section><img class="shop-thumb" src="./assets/librairie.jpg" alt="Rayonnages de la Librairie du Temple"></div>`;
}

function mapPage() {
  const list = id => {
    const nodes = branch(id);
    return nodes.length ? `<ul>${nodes.map(item => `<li><a href="${categoryHref(item.id)}">${esc(labelFor(item.id))}</a>${list(item.id)}</li>`).join('')}</ul>` : '';
  };
  return pageHead('Plan du site') + `<div class="wrap section map-links">
    ${branch().map(item => `<section class="card"><h2><a href="${categoryHref(item.id)}">${esc(labelFor(item.id))}</a></h2>${list(item.id)}</section>`).join('')}
    <section class="card flow"><h2>La librairie</h2><p><a href="${href('librairie')}">Nous trouver</a></p><p><a href="${href('personnalisation')}">Personnalisation</a></p><p><a href="${href('contact')}">Contact</a></p><p><a href="${href('legal')}">Mentions légales</a></p><p><a href="${href('privacy')}">Politique de confidentialité</a></p></section>
  </div>`;
}

function cmsPage() {
  const item = catalogue.pages[route];
  if (!item) return notFound();
  return pageHead(item.title) + `<article class="wrap narrow copy"><p class="subtle">Informations publiées par la Librairie du Temple sur son site officiel.</p>${textBlocks(item.content)}<p>${official(item.url, 'Lire le document d’origine')}</p></article>`;
}

function notFound(title = 'Page introuvable') {
  return pageHead(title) + `<div class="wrap narrow"><a class="btn" href="./">Retour à l’accueil</a></div>`;
}

function openDialog(title, content) {
  const dialog = by('#video-dialog');
  dialog.innerHTML = `<div class="dialog-head"><h2 id="video-title">${esc(title)}</h2><form method="dialog">${iconButton('close','Fermer','data-dialog-close')}</form></div>${content}`;
  by('[data-dialog-close]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { dialog.innerHTML = ''; }, { once: true });
  dialog.showModal();
}

function bindCampaign() {
  const section = by('.campaign');
  if (!section) return;
  const panel = by('.campaign-panel', section);
  const image = by('img', panel);
  const copy = by('[data-campaign-copy]', section);
  const link = by('[data-campaign-link]', section);
  const counter = by('[data-campaign-index]', section);
  let index = 0;

  function advance(direction) {
    index = (index + direction + slides.length) % slides.length;
    const slide = slides[index];
    image.src = './assets/' + slide.image;
    image.alt = slide.alt;
    panel.href = link.href = campaignHref(slide);
    copy.textContent = slide.detail || slide.label;
    counter.textContent = [index + 1, slides.length].map(value => String(value).padStart(2, '0')).join(' / ');
    panel.classList.remove('is-changing');
    requestAnimationFrame(() => panel.classList.add('is-changing'));
    announce('Sélection : ' + slide.label);
  }

  by('[data-campaign-prev]', section).addEventListener('click', () => advance(-1));
  by('[data-campaign-next]', section).addEventListener('click', () => advance(1));
  section.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    advance(event.key === 'ArrowLeft' ? -1 : 1);
  });

  let start = null;
  panel.addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    start = [touch.clientX, touch.clientY];
  }, { passive: true });
  panel.addEventListener('touchcancel', () => { start = null; });
  panel.addEventListener('touchend', event => {
    if (!start) return;
    const touch = event.changedTouches[0];
    const x = touch.clientX - start[0];
    const y = touch.clientY - start[1];
    start = null;
    if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y)) {
      if (event.cancelable) event.preventDefault();
      advance(x < 0 ? 1 : -1);
    }
  }, { passive: false });
}

function bindShelves() {
  all('.shelf').forEach(list => {
    const prev = by(`[data-shelf-prev="${list.id}"]`);
    const next = by(`[data-shelf-next="${list.id}"]`);
    const update = () => {
      prev.disabled = list.scrollLeft < 2;
      next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 3;
    };
    const advance = direction => {
      const width = by('.book-card', list)?.getBoundingClientRect().width || list.clientWidth;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      list.scrollBy({ left: direction * (width + gap), behavior: motion.matches ? 'instant' : 'smooth' });
    };
    list.addEventListener('scroll', update, { passive: true });
    list.addEventListener('keydown', event => {
      if (event.target !== list || !['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      event.preventDefault();
      advance(event.key === 'ArrowLeft' ? -1 : 1);
    });
    prev.addEventListener('click', () => advance(-1));
    next.addEventListener('click', () => advance(1));
    new ResizeObserver(update).observe(list);
    update();
  });
}

function bindPage() {
  bindCampaign();
  bindShelves();
  if (isCatalog) bindCatalog();
  all('[data-video]').forEach(button => button.addEventListener('click', () => {
    const video = videos[button.dataset.video];
    openDialog(video.title, `<iframe title="${video.title}" src="https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>${official('https://www.youtube.com/watch?v=' + video.id, 'Regarder sur YouTube')}`);
  }));
  all('[data-gallery]').forEach(button => button.addEventListener('click', () => {
    by('[data-product-image]').src = button.dataset.gallery;
    all('[data-gallery]').forEach(thumb => thumb.setAttribute('aria-pressed', thumb === button));
  }));
  all('[data-preview-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    form.reset();
    by('[role="status"]', form).textContent = 'Formulaire validé pour la démonstration. Aucune donnée envoyée.';
  }));
  const buy = by('[data-buy]');
  buy?.addEventListener('submit', event => {
    event.preventDefault();
    const id = buy.dataset.buy;
    const qty = Number(new FormData(buy).get('qty'));
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return;
    cart[id] = Math.min(99, (cart[id] || 0) + qty);
    updateCart();
    by('[data-added]').innerHTML = `Article ajouté. <a href="${href('panier')}">Voir le panier →</a>`;
  });
  all('[data-remove]').forEach(button => button.addEventListener('click', () => {
    delete cart[button.dataset.remove];
    updateCart();
    root.innerHTML = cartPage();
    bindPage();
    by('h1', root).setAttribute('tabindex', '-1');
    by('h1', root).focus();
    announce('Article retiré du panier');
  }));
  all('[data-qty]').forEach(input => input.addEventListener('change', () => {
    const id = input.dataset.qty;
    const qty = Number(input.value);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) { input.value = cart[id]; return; }
    cart[id] = qty;
    updateCart();
    root.innerHTML = cartPage();
    bindPage();
    by(`[data-qty="${id}"]`).focus();
    announce('Quantité mise à jour');
  }));
}

try {
  const response = await fetch('./catalogue.json');
  if (!response.ok) throw new Error('Catalogue indisponible');
  catalogue = await response.json();
  ({ categories, products } = catalogue);
  header();
  footer();
  const pages = {
    home, catalogue: catalogPage, rayon: catalogPage, nouveautes: catalogPage, coups: catalogPage,
    recherche: catalogPage, produit: productPage, librairie: visitPage, contact: contactPage,
    compte: accountPage, panier: cartPage, personnalisation: servicePage, plan: mapPage,
    legal: cmsPage, privacy: cmsPage,
  };
  root.innerHTML = (Object.hasOwn(pages, route) ? pages[route] : notFound)();
  bindPage();
} catch (error) {
  console.error(error);
  root.innerHTML = pageHead('Catalogue indisponible') + `<div class="wrap narrow"><p>Le catalogue de démonstration n’a pas pu se charger.</p>${official(live)}</div>`;
}
