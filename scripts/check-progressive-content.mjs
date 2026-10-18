import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const home = fs.readFileSync('index.html', 'utf8');
const staticHome = home.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const catalogueHtml = fs.readFileSync('toutes-les-recettes.html', 'utf8');
const quicheCard = catalogueHtml.match(/<article\b[^>]*>[\s\S]*?<\/article>/g)
  .find(card => card.includes('href="recettes/quiche-lorraine-recette-authentique.html"'));
assert.ok(quicheCard?.includes('Préparation : 35 min'), 'Carte statique quiche : préparation synchronisée');
assert.ok(!staticHome.includes('Chargement'), 'Accueil sans attente JavaScript');
assert.ok(staticHome.includes('hero-visual has-photo'));
assert.ok(/id="hero-photo"\s+src="[^"]+"\s+alt="[^"]+"/.test(staticHome));
for (const id of ['featured-grid', 'latest-list']) {
  const section = staticHome.slice(staticHome.indexOf('id="' + id + '"')).split('</section>')[0];
  assert.ok((section.match(/<article/g) || []).length >= 3, id + ': cartes statiques');
}
const errorHandler = home.match(/function showLoadError\(error\) \{[\s\S]*?\n    \}/)[0];
vm.runInNewContext(errorHandler + '; showLoadError(new Error("offline"));', { console: { error() {} } });
for (const slug of ['quiche-lorraine-recette-authentique', 'boeuf-bourguignon-recette-traditionnelle']) {
  const html = fs.readFileSync('recettes/' + slug + '.html', 'utf8');
  for (const id of ['ingredients', 'preparation']) {
    assert.ok(html.includes('href="#' + id + '"'));
    assert.equal((html.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1);
  }
  assert.ok(html.indexOf('href="#ingredients"') < html.indexOf("<figure"));
  assert.ok(html.includes('chaleur statique'));
  const reviewed = '2026-10-18';
  assert.ok(html.includes('"dateModified":"' + reviewed + '"'));
  if (slug.startsWith('boeuf-')) {
    assert.ok(html.includes('id="retour-camille"'));
    assert.ok(html.includes('"prepTime":"PT50M"'));
    assert.ok(html.includes('"cookTime":"PT4H15M"'));
    assert.ok(html.includes('"totalTime":"P1DT5H15M"'));
    assert.ok(html.includes('mode de chaleur du four n’a pas été précisé'));
    assert.ok(html.includes('22 heures au réfrigérateur'));
  }
  if (slug.startsWith('quiche-')) {
    assert.ok(html.includes('id="retour-camille"'));
    assert.ok(html.includes('"prepTime":"PT35M"'));
    assert.ok(html.includes('"totalTime":"PT3H15M"'));
    assert.ok(html.includes('sans photo de cet essai'));
    assert.ok(html.includes('170 °C pendant 38 minutes'));
  }
}
console.log('Accueil statique, repli sans réseau et raccourcis des deux recettes contrôlés.');
