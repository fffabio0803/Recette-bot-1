import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const decode = s => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const slugs = ["quiche-lorraine-recette-authentique","boeuf-bourguignon-recette-traditionnelle","gratin-dauphinois-cremeux-facile","pate-a-crepes-recette-de-base","tiramisu-recette-italienne-originale","cake-citron-moelleux-facile-rapide","daurade-royale-four-citron-fenouil","roules-cannelle-moelleux"];
const catalogue = JSON.parse(read('recettes.json')).recettes;
const sitemap = read('sitemap.xml');
for (const slug of slugs) {
  const html = read('recettes/' + slug + '.html');
  const nodes = [...html.matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(m => { const data = JSON.parse(m[1]); return data['@graph'] || [data]; });
  const recipe = nodes.find(n => n['@type'] === 'Recipe');
  const steps = [...html.matchAll(/<div class='step' id='(etape-\d+)'><div class='step-num'>(\d+)<\/div><div class='step-body'><strong>(.*?)<\/strong><p>(.*?)<\/p><\/div><\/div>/g)];
  assert.ok(steps.length > 0, slug + ': étapes présentes');
  assert.equal(steps.length, recipe.recipeInstructions.length);
  steps.forEach((m, i) => {
    assert.equal(recipe.recipeInstructions[i].name, decode(m[3]), slug + ': titre');
    assert.equal(recipe.recipeInstructions[i].text, decode(m[4]), slug + ': texte');
  });
  const faq = nodes.find(n => n['@type'] === 'FAQPage');
  const visibleFAQ = [...html.matchAll(/<div class='faq-item'><h3>(.*?)<\/h3><p>(.*?)<\/p><\/div>/g)];
  if (faq) {
    assert.equal(faq.mainEntity.length, visibleFAQ.length);
    visibleFAQ.forEach((m,i) => {
      assert.equal(faq.mainEntity[i].name, decode(m[1]));
      assert.equal(faq.mainEntity[i].acceptedAnswer.text, decode(m[2]));
    });
  }
  assert.equal(recipe.dateModified, '2026-10-28');
  assert.equal(catalogue.find(r => r.slug === slug).date_reviewed, recipe.dateModified);
  assert.ok(sitemap.includes('<loc>https://latablemijote.fr/recettes/' + slug + '.html</loc><lastmod>2026-10-28</lastmod>'));
}
const home = read('index.html');
const section = home.match(/<section class="kitchen-reports"[\s\S]*?<\/section>/)?.[0];
assert.ok(section);
assert.equal((section.match(/<article /g) || []).length, 4);
for (const target of ["/recettes/quiche-lorraine-recette-authentique.html#retour-camille","/recettes/boeuf-bourguignon-recette-traditionnelle.html#retour-camille","/recettes/roules-cannelle-moelleux.html#essai-cuisine","/recettes/banana-bread-quatre-epices.html#retour-cuisine"]) {
  assert.ok(section.includes('href="' + target + '"'));
  assert.ok(read('a-propos.html').includes('href="' + target + '"'));
  const [file, id] = target.slice(1).split('#');
  assert.ok(read(file).includes('id="' + id + '"'), 'Ancre du retour : ' + id);
}
assert.ok(section.includes('pas une validation de toutes les variantes'));
assert.ok(section.includes('sans photo'));
const quiche = read('recettes/' + slugs[0] + '.html');
assert.ok(!quiche.includes('Fouettez énergiquement'));
assert.ok(quiche.includes('sans chercher à la faire mousser'));
assert.ok(quiche.includes('170 °C pendant 38 minutes'));
const boeuf = read('recettes/' + slugs[1] + '.html');
assert.ok(boeuf.includes('Remettez toutes les fournées'));
assert.ok(boeuf.includes('Remettez la viande dans la sauce'));
assert.ok(boeuf.includes('22 heures au réfrigérateur'));
const roule = read('recettes/roules-cannelle-moelleux.html');
assert.ok(roule.includes('Le format de base et l’essai ne sont pas identiques'));
assert.ok(roule.includes('dimensions précises restent inconnues'));
console.log('Suite éditoriale : 8 fiches synchronisées et 4 retours de cuisine reliés, sans validation inventée.');
