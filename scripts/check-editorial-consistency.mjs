import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');
const plain = text => text.replace(/<[^>]+>/g, '').replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&nbsp;', ' ').trim();
const slugs = ['gratin-dauphinois-cremeux-facile', 'daurade-royale-four-citron-fenouil', 'cake-citron-moelleux-facile-rapide', 'tiramisu-recette-italienne-originale', 'quiche-lorraine-recette-authentique'];
const catalogue = JSON.parse(read('recettes.json')).recettes;
for (const slug of slugs) {
  const file = `recettes/${slug}.html`;
  const html = read(file);
  const nodes = [...html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => { const data = JSON.parse(m[1]); return data['@graph'] || [data]; });
  const recipe = nodes.find(n => n['@type'] === 'Recipe');
  assert.equal(recipe.name, plain(html.match(/<h1>([\s\S]*?)<\/h1>/)[1]), slug + ': titre');
  assert.equal(recipe.name, catalogue.find(r => r.slug === slug).title, slug + ': titre du catalogue');
  const ingredients = [...html.match(/<ul class='ingredients-list'>([\s\S]*?)<\/ul>/)[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => plain(m[1]));
  assert.deepEqual(recipe.recipeIngredient, ingredients, slug + ': ingrédients affichés / Google');
  const steps = [...html.matchAll(/<div class='step-body'><strong>([\s\S]*?)<\/strong><p>([\s\S]*?)<\/p>/g)];
  assert.equal(steps.length, recipe.recipeInstructions.length, slug + ': nombre d’étapes');
  steps.forEach((m, i) => {
    assert.equal(recipe.recipeInstructions[i].name, plain(m[1]), slug + ': titre étape');
    assert.equal(recipe.recipeInstructions[i].text, plain(m[2]), slug + ': texte étape');
    assert.ok(html.includes(`id='etape-${i + 1}'`), slug + ': ancre étape');
  });
}
const gratin = read('recettes/gratin-dauphinois-cremeux-facile.html');
assert.ok(gratin.includes('1 heure au réfrigérateur'));
assert.ok(gratin.includes('<strong>1h10</strong>'));
assert.ok(gratin.includes('comté'));
assert.ok(!gratin.includes('1 heure à température ambiante') && !gratin.includes('crème infusée tiède'));
const daurade = read('recettes/daurade-royale-four-citron-fenouil.html');
assert.ok(daurade.includes('200 °C chaleur tournante'));
assert.ok(!/190\s*°|Citron Confit|citron confit<\/h1>/.test(daurade));
const cake = read('recettes/cake-citron-moelleux-facile-rapide.html');
for (const marker of ['60 g', '15 à 20 g', '24 × 10 cm', '8 g']) assert.ok(cake.includes(marker), marker);
assert.ok(!cake.includes('huile essentielle') && !cake.includes('1 sachet'));
const tiramisu = read('recettes/tiramisu-recette-italienne-originale.html');
for (const marker of ['400 ml', '500 g', '100 g', '24 heures', 'variante-sans-oeufs-crus']) assert.ok(tiramisu.includes(marker), marker);
assert.ok(!/sans risque sanitaire|remplacez les jaunes par une creme anglaise/i.test(tiramisu));
const guide = read('guides/pate-brisee-maison-pour-quiche.html');
for (const marker of ['1 heure', '30 minutes', '15 minutes', '5 minutes', '20 minutes de précuisson', '180 °C']) assert.ok(guide.includes(marker), marker);
assert.ok(!guide.includes('cuisson à blanc de 10 minutes'));
console.log('Révision éditoriale : 5 recettes synchronisées, proportions et contradictions contrôlées.');
