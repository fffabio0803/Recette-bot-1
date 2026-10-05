import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');
const catalogue = JSON.parse(read('recettes.json')).recettes;
const slugs = ['carottes-roties-cannelle-miel', 'poulet-epices-douces-legumes-automne', 'roules-cannelle-moelleux'];
const plain = text => text.replace(/<[^>]+>/g, '').replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&').trim();
const images = new Set();
for (const slug of slugs) {
  const r = catalogue.find(item => item.slug === slug);
  assert.ok(r, slug + ': entrée du catalogue');
  const html = read(r.url);
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const recipe = data['@graph'].find(node => node['@type'] === 'Recipe');
  assert.equal(recipe.name, r.title);
  assert.equal(recipe.name, plain(html.match(/<h1>(.*?)<\/h1>/)[1]));
  assert.equal(recipe.prepTime, `PT${parseInt(r.prep_time)}M`);
  assert.equal(recipe.cookTime, `PT${parseInt(r.cook_time)}M`);
  assert.equal(recipe.dateModified, r.date_reviewed);
  assert.equal(recipe.totalTime, undefined, 'Les temps de levée variables ne deviennent pas une durée garantie');
  const ingredients = [...html.match(/<ul class='ingredients-list'>([\s\S]*?)<\/ul>/)[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => plain(m[1]));
  assert.deepEqual(recipe.recipeIngredient, ingredients);
  const steps = [...html.matchAll(/<div class='step-body'><strong>(.*?)<\/strong><p>(.*?)<\/p>/g)];
  assert.equal(recipe.recipeInstructions.length, steps.length);
  steps.forEach((m, i) => {
    assert.equal(recipe.recipeInstructions[i].name, plain(m[1]));
    assert.equal(recipe.recipeInstructions[i].text, plain(m[2]));
    assert.ok(html.includes(`id='etape-${i + 1}'`));
  });
  const image = recipe.image[0].replace('https://latablemijote.fr/', '');
  assert.ok(fs.existsSync(image));
  assert.ok(fs.statSync(image).size < 500000, 'Image trop lourde : ' + image);
  images.add(image);
  assert.ok(html.includes('Aucun essai en cuisine documenté'));
  assert.ok(html.includes('Illustration générée'));
  assert.ok(read('sitemap.xml').includes('https://latablemijote.fr/' + r.url));
  for (const file of ['index.html', 'toutes-les-recettes.html']) {
    const page = read(file);
    assert.ok(page.includes(`"${slug}":"${image}"`), file + ': image spécifique');
    assert.ok(page.includes('href="' + r.url + '"'), file + ': lien accessible sans JavaScript');
  }
}
assert.equal(images.size, 3, 'Une illustration distincte par plat');
const chicken = read('recettes/poulet-epices-douces-legumes-automne.html');
assert.ok(chicken.includes('74 °C') && chicken.includes('sans toucher l’os'));
const rolls = catalogue.find(r => r.slug === 'roules-cannelle-moelleux');
assert.equal(rolls.servings, null);
assert.equal(rolls.yield_label, '9 roulés');
assert.equal(rolls.rest_time, '2h45');
const listing = read('toutes-les-recettes.html');
const itemList = JSON.parse(listing.match(/<script id="recipe-itemlist" type="application\/ld\+json">(.*?)<\/script>/)[1]);
assert.equal(itemList.numberOfItems, catalogue.length);
assert.equal(itemList.itemListElement.length, catalogue.length);
assert.equal((listing.match(/<article class="recipe-card">/g) || []).length, catalogue.length);
console.log('Automne : 3 recettes, images distinctes, textes structurés et liens contrôlés.');
