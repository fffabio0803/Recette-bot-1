import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import './check-recipe-times.mjs';
import './check-recipe-yields.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const timing = require('../assets/recipe-time.js');
for (const [input, expected] of [['0 min',0], ['1h30',90], ['1 h 40 min',100], ['24h10',1450], ['24 à 48 h',2880], ['1,5h',90], ['15 min',15], ['1h repos',60], ['4h congelateur',240], ['2h frigo',120], ['inconnu',99999]]) {
  assert.equal(timing.parseMinutes(input), expected, input);
}
assert.equal(timing.isQuickRecipe({prep_time:'10 min',cook_time:'0 min'}), true);
assert.equal(timing.isQuickRecipe({prep_time:'10 min',cook_time:'10 min',rest_time:'1h'}), false);
const root = process.cwd();
const pages = ['index.html', ...fs.readdirSync(root).filter(f => f.endsWith('.html') && f !== 'index.html'), ...['recettes', 'guides'].flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.html')).map(f => `${d}/${f}`))];
const errors = [];
let schemaCount = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const script of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/type=|src=/.test(script[1])) new vm.Script(script[2], {filename:file});
  }
  for (const m of html.matchAll(/(?:href|src)\s*=\s*['"]([^'"<>]+)['"]/g)) {
    if (/^(?:#|mailto:|tel:|data:|javascript:)/.test(m[1]) || m[1].includes('${')) continue;
    let url;
    try { url = new URL(m[1], `https://latablemijote.fr/${file}`); } catch { continue; }
    if (url.hostname !== 'latablemijote.fr') continue;
    const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
    if (!fs.existsSync(path.join(root, target))) errors.push(`${file}: lien introuvable ${target}`);
  }
  for (const m of html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); schemaCount++; } catch { errors.push(`${file}: JSON-LD invalide`); }
  }
}
const recipes = JSON.parse(fs.readFileSync('recettes.json', 'utf8')).recettes;
for (const [slug, marker] of [['quiche-lorraine-recette-authentique','organisation-quiche'], ['boeuf-bourguignon-recette-traditionnelle','organisation-bourguignon'], ['saumon-gravlax-maison-aneth-citron','securite-gravlax']]) {
  const html = fs.readFileSync('recettes/' + slug + '.html', 'utf8');
  assert.ok(html.includes(marker), 'Section éditoriale manquante : ' + slug);
}
const quiche = recipes.find(r => r.slug === 'quiche-lorraine-recette-authentique');
assert.equal(timing.parseMinutes(quiche.prep_time) + timing.parseMinutes(quiche.cook_time) + timing.parseMinutes(quiche.rest_time), 180);
assert.equal(new Set(recipes.map(r => r.slug)).size, recipes.length, 'Slugs dupliqués');
for (const r of recipes) assert.ok(fs.existsSync(r.url), r.url);
const caesar = fs.readFileSync('recettes/salade-caesar-poulet-grille-maison.html', 'utf8');
assert.ok(!caesar.includes('65 degres') && !caesar.includes('48 heures'));
assert.ok(caesar.includes('74 °C') && caesar.includes('24 heures'));
for (const name of ['tiramisu-recette-italienne-originale', 'mousse-au-chocolat-legere-rapide']) {
  const html = fs.readFileSync('recettes/' + name + '.html', 'utf8');
  assert.ok(html.includes('24 heures'), 'Conservation manquante : ' + name);
  assert.ok(!/maximum 48h|conserve 3 jours maximum|2 cuillères d.agar/.test(html), 'Ancien conseil : ' + name);
}
// Simuler le navigateur : vérifier que refuser ne charge rien et que retirer
// le consentement désactive GA avant le rechargement de la page.
const source = fs.readFileSync('assets/analytics-consent.js', 'utf8');
function browser(choice) {
  const nodes = new Map(); let script = null, reloads = 0;
  const saved = new Map(choice ? [['ltm_analytics_consent_v1', choice]] : []);
  const document = {
    readyState: 'complete', cookie: '_ga=sample; _ga_ABC=sample; other=keep',
    getElementById: id => nodes.get(id), querySelector: () => script,
    head: { appendChild: s => { script = s; } },
    body: { appendChild: el => nodes.set(el.id, el) },
    createElement() { const children = new Map(); return {dataset: {}, handlers: {}, setAttribute() {}, addEventListener(k, fn) { this.handlers[k] = fn; }, remove() { nodes.delete(this.id); }, querySelector(key) { if (!children.has(key)) children.set(key, this.owner.createElement()); return children.get(key); }, owner: document}; }
  };
  const window = { handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; }, location: { hostname: 'latablemijote.fr', reload: () => reloads++ } };
  vm.runInNewContext(source, {window, document, localStorage: {getItem:k=>saved.get(k), setItem:(k,v)=>saved.set(k,v)}});
  return {window, nodes, saved, get script() {return script;}, get reloads() {return reloads;}};
}
let b = browser(); assert.equal(b.script, null); assert.ok(b.nodes.has('ltm-cookie-banner'));
b.nodes.get('ltm-cookie-banner').querySelector('[data-ltm-consent="refused"]').handlers.click();
assert.equal(b.script, null); assert.equal(b.window['ga-disable-G-RD4N5W9HP7'], true);
b = browser('accepted'); assert.ok(b.script); assert.equal(b.window['ga-disable-G-RD4N5W9HP7'], false);
b.nodes.get('ltm-cookie-settings').handlers.click();
b.nodes.get('ltm-cookie-banner').querySelector('[data-ltm-consent="refused"]').handlers.click();
assert.equal(b.window['ga-disable-G-RD4N5W9HP7'], true); assert.equal(b.reloads, 1); assert.equal(b.saved.get('ltm_analytics_consent_v1'), 'refused');
assert.equal(browser('refused').script, null);
b = browser('accepted');
b.window.handlers.storage({key: 'ltm_analytics_consent_v1', newValue: 'refused'});
assert.equal(b.window['ga-disable-G-RD4N5W9HP7'], true); assert.equal(b.reloads, 1);
if (errors.length) { console.error([...new Set(errors)].join('\n')); process.exitCode = 1; }
console.log(`${pages.length} pages, ${recipes.length} recettes, ${schemaCount} blocs structurés ; consentement et corrections César testés.`);
