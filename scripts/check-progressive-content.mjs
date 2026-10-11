import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const home = fs.readFileSync('index.html', 'utf8');
const staticHome = home.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
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
  assert.ok(html.includes('"dateModified":"2026-10-11"'));
}
console.log('Accueil statique, repli sans réseau et raccourcis des deux recettes contrôlés.');
