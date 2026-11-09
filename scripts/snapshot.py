"""Generate the static catalogue from downloaded public PrestaShop pages.

Inputs are a cached homepage and one saved HTML file per audited URL.
Run: python scripts/snapshot.py /tmp/temple-home.html /tmp/temple-cache
"""
from collections import defaultdict
from pathlib import Path
from urllib.parse import urljoin, urlparse
import json
import re
import sys
from lxml import html

BASE = 'https://www.librairiedutemple.fr/'
ROOT = Path(__file__).resolve().parents[1]
HOME = html.parse(sys.argv[1])
CACHE = Path(sys.argv[2])

def plain(element):
    return ' '.join(element.text_content().split())

def first(doc, xpath):
    return next(iter(doc.xpath(xpath)), None)

def read(path):
    key = re.sub(r'[^\w-]', '_', path.removeprefix(BASE).lstrip('/'))
    file = CACHE / (key + '.html')
    return html.parse(str(file)) if file.exists() else None

def blocks(node):
    if node is None:
        return []
    entries = []
    for element in node.xpath('.//h2|.//h3|.//h4|.//p|.//li'):
        if element.xpath('ancestor::script|ancestor::style'):
            continue
        value = plain(element)
        if value and not any(previous[1] == value for previous in entries):
            entries.append([element.tag, value])
    return entries or [['p', plain(node)]] if plain(node) else []

products = {}
memberships = defaultdict(set)

def ingest(doc, nodes, category=None):
    ids = []
    for el in doc.xpath(nodes):
        pid = el.get('data-id-product')
        link = first(el, './/a[contains(@class,"product_img_link") or contains(@class,"thumbnail")]')
        pic = first(el, './/img[@src]')
        if not (pid and link is not None and pic is not None):
            continue
        name = first(el, './/*[contains(@class,"product-title")]//a|.//a[contains(@class,"product-name")]')
        title = pic.get('alt') or (plain(name) if name is not None else plain(link))
        title = title.strip()
        if not title or not pic.get('src'):
            continue
        href = urljoin(BASE, link.get('href'))
        if urlparse(href).hostname != urlparse(BASE).hostname:
            continue
        price = first(el, './/*[@itemprop="price"]|.//span[contains(concat(" ",normalize-space(@class)," ")," price ")]')
        price_text = plain(price) if price is not None else ''
        amount = re.search(r'[\d\s]+,\d{2}(?=\s*€)', price_text)
        flags = [plain(x) for x in el.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," product-flag ")]')]
        available = bool(el.xpath('.//*[@data-button-action="add-to-cart" and not(@disabled) and not(contains(@class,"btn-disable")) and not(contains(@class,"disabled"))]'))
        products.setdefault(pid, {'id': pid, 'title': title, 'url': href,
                                  'image': urljoin(BASE, pic.get('src')),
                                  'price': float(amount[0].replace(' ', '').replace(',', '.')) if amount else None,
                                  'available': available, 'flags': flags})
        product = products[pid]
        stock = first(el, './/*[contains(@class,"btn-disable") and @data-button-action="add-to-cart"]')
        if stock is not None and plain(stock):
            product['stock'] = plain(stock)
        if available and not product.get('stock'):
            product['available'] = True
        if flags:
            product['flags'] = flags
        if category:
            memberships[pid].add(category)
        if pid not in ids:
            ids.append(pid)
    return ids

home_new = ingest(HOME, '//*[@id="carousel_new_product"]//*[@data-id-product]')
home_favorites = ingest(HOME, '//*[@id="wt_special_product"]//*[@data-id-product]')
categories = {}
parents = {}
links = {}
for link in HOME.xpath('//*[@id="wt-menu-horizontal"]//a[@href]'):
    path = urlparse(urljoin(BASE, link.get('href'))).path
    match = re.match(r'^/(\d+)-[^/]+$', path)
    if match:
        links[match[1]] = path

audit_index = CACHE / 'categories.json'
if audit_index.exists():
    for row in json.loads(audit_index.read_text()):
        if row[0] == 200:
            path = urlparse(row[1]).path
            match = re.match(r'^/(\d+)-[^/]+$', path)
            if match:
                links.setdefault(match[1], path)

for option in HOME.xpath('//select[@id="search_category"]/option[@value!="all"]'):
    cid = option.get('value')
    label = plain(option)
    depth = (len(label) - len(label.lstrip('-'))) // 2
    parent = parents.get(depth - 1)
    parents[depth] = cid
    path = links.get(cid)
    if not path:
        continue
    doc = read(path)
    heading = re.sub(r'^-+', '', label).strip()
    title = heading.capitalize() if heading.isupper() else heading
    items, intro, count = [], [], None
    if doc is not None:
        items = ingest(doc, '//article[@data-id-product]', cid)
        area = first(doc, '//*[@id="category-description"]')
        intro = blocks(area)
        listing = first(doc, '//*[@id="products"]')
        found = re.search(r'Il y a\s+([\d\s]+)\s+produit', plain(listing)) if listing is not None else None
        count = int(re.sub(r'\s', '', found[1])) if found else (0 if not items else None)
    categories[cid] = {'id': cid, 'title': title, 'parent': parent, 'url': urljoin(BASE,path),
                       'products': items, 'intro': intro, 'count': count,
                       'captured': doc is not None, 'position': len(categories)}

special = {}
for key, path in [('new','nouveaux-produits'),('favorites','promotions')]:
    doc = read(path)
    special[key] = ingest(doc, '//article[@data-id-product]') if doc is not None else []

curated = {'8276': ('Les Fêtes illustrées · Pourim','fetes.jpg'), '8269': ('Les Voix de l’Alliance','voix.jpg'),
           '8074': ('La Plus Précieuse des marchandises','precieux.jpg'), '8150': ('Registres de ketubbot','kettubot.jpg'),
           '8271': ('Esther · Tanakh de Koren','esther.jpg')}
for pid, product in products.items():
    product['categories'] = sorted(memberships[pid])
    if pid in curated:
        product['display'], image = curated[pid]
        product['image'] = 'assets/' + image
    doc = read(product['url'])
    if doc is None or doc.xpath('string(//body/@id)') != 'product':
        continue
    title = doc.xpath('normalize-space((//h1)[1])')
    if title:
        product['title'] = title
    product['summary'] = blocks(first(doc, '//*[@itemprop="description" and contains(@class,"product-description-short")]'))
    product['description'] = blocks(first(doc, '//*[@id="description"]'))
    product['features'] = [[plain(dt), plain(dd)] for dt, dd in zip(doc.xpath('//dl[contains(@class,"data-sheet")]/dt'),doc.xpath('//dl[contains(@class,"data-sheet")]/dd'))]
    if not product['features']:
        for line in doc.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," data-sheet-line ")]'):
            label = first(line, './*[contains(concat(" ",normalize-space(@class)," ")," name ")]')
            value = first(line, './*[contains(concat(" ",normalize-space(@class)," ")," value ")]')
            if label is not None and value is not None:
                product['features'].append([plain(label), plain(value)])
    product['gallery'] = list(dict.fromkeys(doc.xpath('//*[@id="content"]//img/@data-image-large-src|//*[@id="content"]//img[contains(@class,"js-qv-product-cover")]/@src')))
    buy = first(doc, '//*[@id="add-to-cart-or-refresh"]//button[@data-button-action="add-to-cart"]')
    if buy is not None:
        product['available'] = buy.get('disabled') is None and 'btn-disable' not in buy.get('class', '')
    product['detailed'] = True

pages = {}
for key, path in [('legal','content/2-mentions-legales'),('privacy','content/8-politique-de-confidentialite')]:
    doc = read(path)
    if doc is not None:
        pages[key] = {'title': doc.xpath('normalize-space((//h1)[1])'), 'url': urljoin(BASE,path),
                      'content': blocks(first(doc, '//*[@id="content" and contains(@class,"page-cms")]'))}

data = {'categories': categories, 'products': products, 'new': list(dict.fromkeys(['8276','8269','8074','8150',*home_new,*special['new']])),
        'favorites': list(dict.fromkeys([*home_favorites,*special['favorites']])), 'pages': pages}
data['new'] = [pid for pid in data['new'] if pid in products]
(ROOT / 'catalogue.json').write_text(json.dumps(data, ensure_ascii=False,separators=(',',':'))+'\n')
print(f"{len(categories)} catégories, {sum(c['captured'] for c in categories.values())} capturées, {len(products)} produits, {sum('description' in p for p in products.values())} fiches détaillées")
