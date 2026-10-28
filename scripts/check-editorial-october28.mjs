import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const decode = value => value.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const slugs = ['pate-a-crepes-recette-de-base', 'baba-au-rhum-recette-traditionnelle', 'oeufs-cocotte-creme-fraiche-facile', 'salade-caesar-poulet-grille-maison', 'saumon-gravlax-maison-aneth-citron', 'pavlova-fruits-rouges-meringue'];
const catalogue = JSON.parse(read('recettes.json')).recettes;
const sitemap = read('sitemap.xml');
const pages = {};

for (const slug of slugs) {
  const html = pages[slug] = read(`recettes/${slug}.html`);
  const nodes = [...html.matchAll(/<script\b[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(match => { const json = JSON.parse(match[1]); return json['@graph'] || [json]; });
  const recipe = nodes.find(node => node['@type'] === 'Recipe');
  const faq = nodes.find(node => node['@type'] === 'FAQPage');
  const visibleSteps = [...html.matchAll(/<div class='step' id='(etape-\d+)'><div class='step-num'>(\d+)<\/div><div class='step-body'><strong>(.*?)<\/strong><p>(.*?)<\/p><\/div><\/div>/g)];
  assert.equal(visibleSteps.length, 7, `${slug}: sept étapes visibles`);
  assert.equal(recipe.recipeInstructions.length, visibleSteps.length, `${slug}: nombre d'étapes structurées`);
  visibleSteps.forEach((match, i) => {
    const step = recipe.recipeInstructions[i];
    assert.equal(step.name, decode(match[3]), `${slug}: titre étape ${i + 1}`);
    assert.equal(step.text, decode(match[4]), `${slug}: texte étape ${i + 1}`);
    assert.equal(step.position, Number(match[2]));
    assert.equal(step.url, `https://latablemijote.fr/recettes/${slug}.html#${match[1]}`);
  });
  const visibleFAQ = [...html.matchAll(/<div class='faq-item'><h3>(.*?)<\/h3><p>(.*?)<\/p><\/div>/g)];
  assert.equal(visibleFAQ.length, 3);
  assert.equal(faq.mainEntity.length, visibleFAQ.length);
  visibleFAQ.forEach((match, i) => {
    assert.equal(faq.mainEntity[i].name, decode(match[1]));
    assert.equal(faq.mainEntity[i].acceptedAnswer.text, decode(match[2]));
  });
  const ingredients = [...html.matchAll(/<li><span class='ing-amount'>(.*?)<\/span> (.*?)<\/li>/g)].map(match => decode(`${match[1]} ${match[2]}`));
  assert.deepEqual(recipe.recipeIngredient, ingredients, `${slug}: ingrédients synchronisés`);
  assert.equal(recipe.dateModified, '2026-10-28');
  assert.equal(catalogue.find(item => item.slug === slug).date_reviewed, recipe.dateModified);
  assert.ok(sitemap.includes(`<loc>https://latablemijote.fr/recettes/${slug}.html</loc><lastmod>${recipe.dateModified}</lastmod>`));
  assert.ok(html.includes('révisée le 28 octobre 2026'));
  assert.ok(html.includes('ne constitue pas un essai en cuisine documenté'));
}

const crepes = pages[slugs[0]];
assert.ok(crepes.includes('au moins 1 h au réfrigérateur'));
assert.ok(!/grumeaux irremediables|minimum 20 minutes a temperature ambiante|courte attente peut suffire/.test(crepes));
assert.ok(crepes.includes('sans verser nécessairement les 100 ml'));
const baba = pages[slugs[1]];
assert.ok(!/encore tiede|mi-cuisson|pate arrive au bord|laissez tiedir/.test(baba));
assert.ok(baba.includes('sans attendre que la pâte atteigne le bord'));
assert.ok(baba.includes('babas refroidis'));
assert.ok(baba.includes('les 500 ml de la liste sont destinés au sirop'));
const oeufs = pages[slugs[2]];
assert.ok(!/complique le démoulage|Service sans risque/.test(oeufs));
assert.ok(oeufs.includes('sans démoulage'));
assert.ok(oeufs.includes('2 ramequins par personne'));
assert.ok(oeufs.includes('sans zone de blanc translucide'));
const home = read('index.html');
assert.ok(home.includes('À la une'));
assert.ok(home.includes('D’autres idées à cuisiner'));
assert.ok(!/Recette du jour|Dernières recettes|recettes les plus récemment ajoutées|Dernière recette ajoutée/.test(home));
assert.ok(home.includes('Dernière mise à jour du catalogue'));
assert.ok(home.includes('id="latest-list"'), 'conserver le branchement du contenu progressif');
assert.ok(sitemap.includes('<loc>https://latablemijote.fr/</loc><lastmod>2026-10-28</lastmod>'));
console.log('Corrections éditoriales octobre : étapes, FAQ, ingrédients, dates et accueil cohérents.');

const caesar = pages[slugs[3]];
assert.ok(caesar.includes('150 ml') && caesar.includes('huile d’olive pour les croûtons'));
assert.ok(caesar.includes('40 g à râper') && caesar.includes('40 g en copeaux'));
assert.ok(caesar.includes('Remplacez toute la sauce maison'));
assert.ok(!/utilisez 2 cuillères à soupe de mayonnaise|Evitez le four/.test(caesar));
const gravlax = pages[slugs[4]];
assert.ok(gravlax.includes('7 jours') && gravlax.includes('−18 °C'));
assert.ok(gravlax.includes('4 °C maximum') && gravlax.includes('délai de conservation'));
assert.ok(!/18 heures|36 heures|au moins 1 kg|Ne rincez jamais|Goûtez une fine tranche/.test(gravlax));
assert.ok(gravlax.includes('ne désinfecte pas'));
const pavlova = pages[slugs[5]];
assert.ok(pavlova.includes('"cookTime":"PT85M"') && pavlova.includes('<strong>1h25</strong>'));
assert.ok(pavlova.includes('chaleur statique') && pavlova.includes('Préchauffez'));
assert.ok(!/s’effondrer instantanément|48h avant|version régionale française|vieillis de 24h|PT90M/.test(pavlova));
assert.ok(pavlova.includes('coque complètement froide'));
console.log('César, gravlax, pavlova : répartition, précautions et durée vérifiées.');

for (const slug of slugs.slice(3)) {
  assert.ok(pages[slug].includes('.recipe-hero img{display:block;width:100%;max-width:100%;height:auto;'));
  const item = catalogue.find(r => r.slug === slug);
  const card = [...read('toutes-les-recettes.html').matchAll(/<article class="recipe-card">[\s\S]*?<\/article>/g)].find(m => m[0].includes(slug + '.html'))?.[0];
  assert.ok(card?.includes(item.meta_description), slug + ': résumé de carte synchronisé');
}
assert.ok(!pavlova.includes("<img class='recipe-photo'"), 'pavlova : pas de seconde image de tête');
