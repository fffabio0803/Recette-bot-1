import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const html = fs.readFileSync('toutes-les-recettes.html', 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const data = JSON.parse(fs.readFileSync('recettes.json', 'utf8'));
const staticGrid = html.match(/<!-- STATIC_RECIPE_LINKS_START -->([\s\S]*?)<!-- STATIC_RECIPE_LINKS_END -->/);
// The fallback must exist in HTML before JavaScript or the catalogue request runs.
const fallback = staticGrid ? staticGrid[1] : html.match(/<section class="recipes-grid"[^>]*>([\s\S]*?)<\/section>/)[1];
assert.equal((fallback.match(/class="recipe-card"/g) || []).length, 16);
function node(initial = '') {
  return { innerHTML: initial, textContent: '', value: '', disabled: false, handlers: {}, attrs: {},
    addEventListener(type, callback) { this.handlers[type] = callback; },
    setAttribute(key, value) { this.attrs[key] = value; },
    querySelectorAll() { return []; },
    classList: {toggle() {}, remove() {}} };
}
async function browser(response) {
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, node(id === 'recipes-grid' ? fallback : '')); return nodes.get(id); };
  get('total-number').textContent = '16';
  const controls = ['search-input','sort-select','reset-button','quick-button','new-button'].map(get);
  const context = vm.createContext({document: {getElementById:get, querySelectorAll:()=>controls},
    RecipeTime: require('../assets/recipe-time.js'), RecipeYield: require('../assets/recipe-yield.js'),
    fetch: response, console: {error() {}}, Date});
  vm.runInContext(source, context);
  // Observe initial loading before the fetch continuation has resolved.
  assert.ok(controls.every(control => control.disabled));
  assert.equal(get('recipes-grid').innerHTML, fallback);
  await new Promise(resolve => setImmediate(resolve));
  return {nodes, get, controls, run: code => vm.runInContext(code, context)};
}
for (const response of [
  async()=>{throw new Error('offline');},
  async()=>({ok:false,status:503}),
  async()=>({ok:true,json:async()=>{throw new Error('invalid JSON');}}),
  async()=>({ok:true,json:async()=>({recettes:[]})}),
  async()=>({ok:true,json:async()=>({recettes:[null,{}]})})
]) {
  const b = await browser(response);
  assert.equal(b.get('recipes-grid').innerHTML, fallback, 'failure must preserve all links');
  assert.equal(b.get('total-number').textContent, '16', 'failure is not zero recipes');
  assert.ok(b.controls.every(control => control.disabled));
  assert.match(b.get('results-text').textContent, /restent accessibles/);
}
const slow = await browser(()=>new Promise(()=>{}));
assert.equal(slow.get('recipes-grid').innerHTML, fallback);
const b = await browser(async()=>({ok:true,json:async()=>data}));
assert.ok(b.controls.every(control => !control.disabled));
assert.equal(b.run('getFilteredRecipes().length'),16);
for (const query of ['oeufs','ŒUFS','œufs']) {
  b.get('search-input').handlers.input({target:{value:query}});
  assert.ok(b.run('getFilteredRecipes().some(r=>r.slug==="oeufs-cocotte-creme-fraiche-facile")'));
}
for (const query of ['cannelle roulés','ROULES cannelle','  roulés   cannelle ']) {
  b.get('search-input').handlers.input({target:{value:query}});
  assert.ok(b.run('getFilteredRecipes().some(r=>r.slug==="roules-cannelle-moelleux")'));
}
b.get('search-input').handlers.input({target:{value:'zzzz introuvable'}});
assert.match(b.get('recipes-grid').innerHTML,/Aucune recette trouvée/);
b.get('reset-button').handlers.click();
assert.equal(b.run('getFilteredRecipes().length'),16);
for (const sort of ['prep-asc','prep-desc','cook-asc','cook-desc']) {
  b.get('sort-select').handlers.change({target:{value:sort}});
  const times = Array.from(b.run(`getFilteredRecipes().map(r=>parseMinutes(r.${sort.startsWith('prep')?'prep_time':'cook_time'}))`));
  const unknown = times.indexOf(99999);
  if (unknown >= 0) assert.ok(times.slice(unknown).every(t=>t===99999),sort+' unknown last');
  const known = times.filter(t=>t!==99999);
  assert.deepEqual(known,[...known].sort((a,c)=>sort.endsWith('desc')?c-a:a-c));
}
b.get('reset-button').handlers.click(); b.get('quick-button').handlers.click();
assert.equal(b.run('getFilteredRecipes().length'),1);
assert.equal(b.run('getFilteredRecipes()[0].slug'),'oeufs-cocotte-creme-fraiche-facile');
console.log('Catalogue : 16 liens de secours, chargement/pannes, ligatures, recherche multi-mots, tris et filtres testés.');
