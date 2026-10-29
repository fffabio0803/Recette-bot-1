import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
const read = name => fs.readFileSync(name, 'utf8');
for (const file of ['guides/pate-brisee-maison-pour-quiche.html','guides/sirop-baba-au-rhum-dosage.html']) {
  const html=read(file);
  assert.match(html, /"dateModified":"2026-10-29"/);
  assert.match(html, /29 octobre 2026/);
  const entry=read('sitemap.xml').split('\n').find(line=>line.includes('/'+file));
  assert.ok(entry.includes('<lastmod>2026-10-29</lastmod>'));
  for (const match of html.matchAll(/href="([^"#]*)#([^" ]+)"/g)) {
    const target = match[1] ? path.resolve(path.dirname(file),match[1]) : file;
    if (/^https?:/.test(match[1])) continue;
    assert.ok(new RegExp('id=["\\\x27]'+match[2]+'["\\\x27]').test(read(target)), match[0]);
  }
}
const pate=read('guides/pate-brisee-maison-pour-quiche.html');
for (const text of ['Camille','sans photo','sans vérification indépendante','38 min','28 cm','#retour-camille']) assert.ok(pate.includes(text));
const sirop=read('guides/sirop-baba-au-rhum-dosage.html');
assert.ok(!sirop.includes('<td>1 grand baba de 22 cm</td>'));
assert.ok(sirop.includes('n’a pas encore été mesurée'));
assert.ok(sirop.includes('Aucun essai mesuré ne valide'));
assert.match(read('assets/analytics-consent.css'), /@media print\s*\{[\s\S]*#ltm-advertising-settings[\s\S]*display: none !important/);
assert.match(read('assets/reviews.css'), /@media print\{\.ltm-reviews,\.ltm-review-jump\{display:none\}\}/);
console.log('Guides du 29 octobre : retour attribué, limite des moules baba, dates et ancres, exclusion des formulaires à l’impression contrôlés.');
