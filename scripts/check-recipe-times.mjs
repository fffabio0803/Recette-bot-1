import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const timing = require('../assets/recipe-time.js');
const recipes = JSON.parse(fs.readFileSync('recettes.json', 'utf8')).recettes;
const listing = fs.readFileSync('toutes-les-recettes.html', 'utf8');
let audited = 0;
for (const r of recipes) {
  assert.ok(!/frigo|repos|congelateur/.test(r.cook_time), r.slug + ': attente présentée comme cuisson');
  if (!r.time_note) continue;
  audited++;
  const html = fs.readFileSync(r.url, 'utf8');
  assert.equal((html.match(/id="reperes-durees"/g) || []).length, 1, r.slug + ': repère unique');
  const bar = html.match(/<div class=['"]recipe-bar['"]>[\s\S]*?<\/div>/)[0];
  assert.ok(bar.includes(`<strong>${r.cook_time}</strong>`), r.slug + ': cuisson affichée');
  if (r.rest_time) assert.ok(bar.includes(`<strong>${r.rest_time}</strong>`), r.slug + ': repos affiché');
  const card = [...listing.matchAll(/<article class="recipe-card">[\s\S]*?<\/article>/g)].find(m => m[0].includes('href="' + r.url + '"'))?.[0];
  assert.ok(card?.includes('Cuisson : ' + r.cook_time), r.slug + ': carte statique');
  if (r.rest_time) assert.ok(card.includes('Repos : ' + r.rest_time), r.slug + ': repos carte statique');
  const entities = [];
  function walk(o) {
    if (!o || typeof o !== 'object') return;
    if ([].concat(o['@type'] || []).includes('Recipe')) entities.push(o);
    Object.values(o).forEach(walk);
  }
  for (const m of html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)) walk(JSON.parse(m[1]));
  assert.equal(entities.length, 1, r.slug);
  const cook = timing.parseMinutes(r.cook_time);
  assert.equal(entities[0].cookTime, cook === 99999 ? undefined : `PT${cook}M`, r.slug + ': données Google');
  assert.equal(entities[0].totalTime, undefined, r.slug + ': pas de faux total');
  if (r.time_uncertain) assert.equal(timing.isQuickRecipe(r), false, r.slug + ': attente variable exclue du filtre rapide');
}
assert.equal(audited, 50);
const mousse = fs.readFileSync('recettes/mousse-au-chocolat-legere-rapide.html', 'utf8');
assert.ok(!mousse.includes('Placez 10 minutes au congélateur'));
assert.ok(mousse.includes('au moins 2 heures'));
const vichy = fs.readFileSync('recettes/vichyssoise-froide-poireaux-pommes-de-terre.html', 'utf8');
assert.ok(!vichy.includes('Laissez refroidir completement le veloute a temperature ambiante'));
assert.ok(vichy.includes('au plus tard deux heures'));
const quick = recipes.filter(timing.isQuickRecipe);
assert.equal(quick.length, 6);
assert.ok(!quick.some(r => /mousse|madeleine|gravlax|croque|tiramisu/.test(r.slug)));
assert.equal(timing.parseMinutes('2 min par crêpe'), 99999);
console.log(`${audited} fiches : bandeaux, cartes et données Google cohérents ; ${quick.length} recettes dans le filtre rapide.`);
