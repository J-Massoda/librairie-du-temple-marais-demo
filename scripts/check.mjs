import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const data = JSON.parse(read('catalogue.json'));

test('all original catalogue categories are represented with valid hierarchy', () => {
  const { categories, products } = data;
  assert.equal(Object.keys(categories).length, 109);
  for (const [id, category] of Object.entries(categories)) {
    assert.equal(id, category.id);
    assert.ok(category.captured, category.title);
    const visited = new Set([id]);
    let parent = category.parent;
    while (parent) {
      assert.ok(categories[parent] && !visited.has(parent), category.title);
      visited.add(parent);
      parent = categories[parent].parent;
    }
    for (const pid of category.products) assert.ok(products[pid], pid);
  }
});

test('product records use real shop URLs and safe, available cover sources', () => {
  for (const [id, product] of Object.entries(data.products)) {
    assert.equal(product.id, id);
    assert.ok(product.title.trim(), id);
    assert.equal(new URL(product.url).origin, 'https://www.librairiedutemple.fr');
    assert.ok(product.price === null || Number.isFinite(product.price) && product.price >= 0);
    if (product.image.startsWith('assets/')) assert.ok(existsSync(new URL(product.image, root)));
    else assert.equal(new URL(product.image).origin, 'https://www.librairiedutemple.fr');
    for (const category of product.categories) assert.ok(data.categories[category].products.includes(id));
  }
});

test('both book carousels and all five campaign images are present', () => {
  assert.deepEqual(data.new.slice(0, 4), ['8276', '8269', '8074', '8150']);
  for (const shelf of [data.new, data.favorites]) {
    assert.ok(shelf.length > 4);
    assert.equal(new Set(shelf).size, shelf.length);
    for (const id of shelf) assert.ok(data.products[id].detailed, id);
  }
  for (let i = 1; i <= 5; i++) assert.ok(existsSync(new URL('assets/slide' + i + '.webp', root)));
});

test('the Pages entry point uses project-relative assets and marks the preview noindex', () => {
  const markup = read('index.html');
  assert.match(markup, /content="noindex, nofollow"/);
  assert.match(markup, /src="\.\/app\.js"/);
  assert.match(markup, /href="\.\/styles\.css"/);
  assert.ok(existsSync(new URL('.nojekyll', root)));
  assert.ok(readdirSync(new URL('assets/', root)).length >= 15);
});
