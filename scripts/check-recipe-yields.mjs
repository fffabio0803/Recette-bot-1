import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const yieldUI = require('../assets/recipe-yield.js');
const recipes = JSON.parse(fs.readFileSync('recettes.json', 'utf8')).recettes;
const listing = fs.readFileSync('toutes-les-recettes.html', 'utf8');
const read = slug => fs.readFileSync(`recettes/${slug}.html`, 'utf8');
for (const r of recipes.filter(r => r.yield_label)) {
  const html = read(r.slug);
  assert.ok(html.includes(`<strong>${r.yield_label}</strong>`), r.slug);
  assert.ok(html.includes(`"recipeYield": "${r.yield_label}"`), r.slug);
  assert.equal((html.match(/id="reperes-portions"/g) || []).length, 1);
  const card = [...listing.matchAll(/<article class="recipe-card">[\s\S]*?<\/article>/g)].find(m => m[0].includes('href="' + r.url + '"'))[0];
  assert.ok(card.includes(r.yield_label));
  assert.equal(yieldUI.label(r), r.yield_label);
}
for (const slug of ['madeleine-recette-classique-bosse', 'financiers-amandes-moelleux-recette']) {
  const r = recipes.find(r => r.slug === slug);
  assert.equal(r.servings, null);
  assert.ok(r.yield_label.startsWith('Environ'));
  assert.equal(yieldUI.compareServings(r, {servings:2}, false), 1);
  assert.equal(yieldUI.compareServings(r, {servings:2}, true), 1);
  assert.ok(!read(slug).includes(`<strong>${slug.startsWith('madeleine') ? 16 : 12} pers.</strong>`));
}
assert.equal(yieldUI.label({servings:4}), '4 pers.');
assert.equal(yieldUI.compareServings({servings:2}, {servings:4}, false), -2);
assert.equal(yieldUI.compareServings({servings:2}, {servings:4}, true), 2);
const carbonara = read('carbonara-authentique-recette-romaine');
assert.ok(carbonara.includes("100 ml</span> eau de cuisson des pâtes réservée"));
assert.ok(carbonara.includes('"100 ml eau de cuisson des pâtes réservée"'));
assert.ok(!carbonara.includes('50 ml eau de cuisson des pâtes réservée'));
const gravlax = read('saumon-gravlax-maison-aneth-citron');
assert.ok(gravlax.includes('Selon besoin</span> pain de seigle ou blinis pour servir'));
assert.ok(!gravlax.includes('1 botte pain'));
const tart = read('tartiflette-reblochon-pommes-de-terre');
const ingredients = tart.match(/<ul class=['"]ingredients-list['"]>[\s\S]*?<\/ul>/)[0];
assert.equal((ingredients.match(/muscade/g) || []).length, 1);
for (const file of ['index.html','toutes-les-recettes.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(html.includes('src="/assets/recipe-yield.js'));
  assert.ok(html.includes('RecipeYield.label(recipe)'));
}
console.log('Rendements : unités, affichages, tri et six corrections contrôlés.');
