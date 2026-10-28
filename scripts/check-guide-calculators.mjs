import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = file => fs.readFileSync(file, 'utf8');
const plain = text => text.replace(/<[^>]+>/g, '').trim();
function calculator(file, values) {
  const html = read(file);
  const nodes = new Map();
  for (const id of [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])) {
    nodes.set(id, {value: values[id] ?? '', textContent: '', hidden: false, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }});
  }
  const document = {getElementById: id => { assert.ok(nodes.has(id), 'ID absent du HTML : ' + id); return nodes.get(id); }};
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  vm.runInNewContext(code, {document});
  return {nodes, change(id, value) { nodes.get(id).value = value; nodes.get('form').handlers.input(); }, text(id) { return nodes.get(id).textContent; }};
}

const migaineGuide = read('guides/migaine-pour-quiche-proportions.html');
const siropGuide = read('guides/sirop-baba-au-rhum-dosage.html');
assert.ok(migaineGuide.includes('href="/outils/calculateur-migaine.html"'));
assert.ok(siropGuide.includes('href="/outils/calculateur-sirop-baba.html"'));
assert.ok(!migaineGuide.includes('préparez environ 20 %'));
const m = calculator('outils/calculateur-migaine.html', {diametre: '28'});
const rows = [...migaineGuide.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].matchAll(/<tr>(.*?)<\/tr>/g)].map(row => [...row[1].matchAll(/<td>(.*?)<\/td>/g)].map(cell => plain(cell[1])));
assert.equal(rows.length, 5);
for (const row of rows) {
  m.change('diametre', row[0].replace(' cm', ''));
  assert.deepEqual([m.text('oeufs'), m.text('creme'), m.text('lait')], row.slice(1, 4));
}
assert.ok(!read('outils/calculateur-migaine.html').includes('id="profondeur"'));

const s = calculator('outils/calculateur-sirop-baba.html', {nombre: '6', alcool: '1'});
for (const [q, water, sugar, rum] of [['4','330 ml','200 g','100 ml'],['6','500 ml','300 g','150 ml'],['8','670 ml','400 g','200 ml'],['1','80 ml','50 g','25 ml'],['30','2500 ml','1500 g','750 ml']]) {
  s.change('nombre', q);
  assert.deepEqual([s.text('eau'), s.text('sucre'), s.text('rhum')], [water,sugar,rum]);
  assert.equal(s.nodes.get('jus-ligne').hidden, true);
}
const syrupRows = [...siropGuide.match(/<tbody>([\s\S]*?)<\/tbody>/)[1].matchAll(/<tr>(.*?)<\/tr>/g)].map(row => [...row[1].matchAll(/<td>(.*?)<\/td>/g)].map(cell => plain(cell[1])));
for (const row of syrupRows.filter(row => row[0].includes('petits babas'))) {
  s.change('nombre', row[0].split(' ')[0]);
  assert.deepEqual([s.text('eau'), s.text('sucre'), s.text('rhum')], row.slice(1));
}
s.change('nombre', '6');
s.change('alcool', '0');
assert.deepEqual([s.text('eau'),s.text('sucre'),s.text('rhum'),s.text('jus')], ['550 ml','300 g','0 ml','100 ml']);
assert.equal(s.nodes.get('jus-ligne').hidden, false);
s.change('alcool', '0.67'); assert.equal(s.text('rhum'), '100 ml');
s.change('alcool', '1.2'); assert.equal(s.text('rhum'), '180 ml');
for (const invalid of ['', '0', '-1', '31', '1.5', 'abc']) {
  s.change('nombre', invalid);
  assert.equal(s.text('eau'), '—');
  assert.ok(s.text('info').includes('nombre entier de 1 à 30'));
}
s.change('nombre', '6'); assert.equal(s.text('eau'), '500 ml');
const guideGraph = JSON.parse(migaineGuide.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
const article = guideGraph.find(node => node['@type'] === 'Article');
assert.equal(article.dateModified, '2026-10-28');
assert.equal(article.headline, plain(migaineGuide.match(/<h1>(.*?)<\/h1>/)[1]));
assert.ok(read('sitemap.xml').includes('<loc>https://latablemijote.fr/guides/migaine-pour-quiche-proportions.html</loc><lastmod>2026-10-28</lastmod>'));
const guideFAQ = guideGraph.find(node => node['@type'] === 'FAQPage').mainEntity;
const visibleFAQ = [...migaineGuide.match(/<section class="faq">([\s\S]*?)<\/section>/)[1].matchAll(/<div><h3>(.*?)<\/h3><p>(.*?)<\/p><\/div>/g)];
assert.equal(visibleFAQ.length, 4);
assert.equal(guideFAQ.length, visibleFAQ.length);
visibleFAQ.forEach((match, index) => {
  assert.equal(guideFAQ[index].name, plain(match[1]));
  assert.equal(guideFAQ[index].acceptedAnswer.text, plain(match[2]));
});
for (const marker of ['10 octobre 2026', 'sans photo', '38 minutes à 170 °C', 'environ une cuillère à soupe', 'ni cinq formats testés']) {
  // The guide explicitly distinguishes a reported trial from rounded conversion entries.
  assert.ok(migaineGuide.includes(marker), marker);
}
for (const id of ['proportions-moule', 'comprendre-le-volume', 'cas-camille', 'controle-cuisson']) {
  assert.ok(migaineGuide.includes(`href="#${id}"`) && migaineGuide.includes(`id="${id}"`), 'Sommaire : ' + id);
}
assert.ok(migaineGuide.includes('/recettes/quiche-lorraine-recette-authentique.html#retour-camille'));
assert.ok(!guideGraph.some(node => node['@type'] === 'Review' || node.aggregateRating), 'Ne pas transformer le retour en avis étoilé');
console.log('Guides et calculateurs : 5 moules, retour Camille, FAQ/dates, dosages du sirop et entrées invalides contrôlés.');
