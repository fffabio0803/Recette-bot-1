import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=f=>fs.readFileSync(f,'utf8');
const disclosure='En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises.';
const map={'quiche-lorraine-recette-authentique':'B00F2GU4YE','cookies-moelleux-chocolat':'B06XFLT6YN','banana-bread-quatre-epices':'B00F2GUAT8'};
const hub=read('materiel.html');
assert.equal((hub.match(/rel="sponsored nofollow"/g)||[]).length,3);
for(const [slug,asin] of Object.entries(map)){
 const html=read(`recettes/${slug}.html`);
 for(const text of [html,hub]){assert.ok(text.includes(`/dp/${asin}/ref=nosim?tag=latablemijote-21`));assert.ok(text.includes(disclosure));assert.ok(text.includes('class="equipment-affiliate">Lien affilié'));}
 assert.equal((html.match(/class="equipment-inline"/g)||[]).length,1);
 assert.ok(html.includes('>Voir sur Amazon</a>'));
}
for(const p of JSON.parse(read('recettes.json')).recettes){assert.equal((read(p.url).match(/href="\/materiel.html"/g)||[]).length,2,'Navigation recette '+p.url);}
for(const file of ['index.html','outils.html','toutes-les-recettes.html','guides.html','materiel.html'])assert.equal((read(file).match(/href="\/materiel.html"/g)||[]).length,2,file);
assert.ok(read('confidentialite.html').includes('id="affiliation"'));
assert.ok(read('mentions-legales.html').includes(disclosure));
assert.ok(hub.includes('<h1>Boutique</h1>'));
assert.ok(!hub.includes('Comment choisir sans se tromper'));
assert.ok(hub.indexOf('equipment-grid')<hub.indexOf('equipment-disclosure'));
assert.ok(!/<iframe|amazon-adsystem|m\.media-amazon|aggregateRating/.test(hub));
console.log('Matériel : trois références, affiliation, transparence et navigation vérifiées.');
