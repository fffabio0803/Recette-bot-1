import fs from 'node:fs';
import assert from 'node:assert/strict';
const catalogue = JSON.parse(fs.readFileSync('recettes.json', 'utf8'));
const changes = [
  ['madeleine-recette-classique-bosse', 'Environ 16 madeleines', null, 'Le rendement annoncé est indicatif et dépend de la taille des empreintes et de leur remplissage. Il désigne des madeleines, pas un nombre de personnes.'],
  ['financiers-amandes-moelleux-recette', 'Environ 12 financiers', null, 'Le rendement annoncé est indicatif et dépend de la taille des moules. Il désigne des financiers, pas un nombre de personnes.'],
  ['croque-monsieur-bechamel-maison', '4 croques pour 2 personnes', 2, 'Les huit tranches de pain permettent de préparer quatre croque-monsieur, soit deux par personne avec les portions annoncées. Pour quatre convives, compter un croque chacun, avec un accompagnement.'],
  ['carbonara-authentique-recette-romaine', '2 grandes portions', 2, 'Les 400 g de pâtes sèches correspondent à 200 g par personne : les deux portions annoncées sont généreuses. Réserver 100 ml d’eau de cuisson et l’incorporer progressivement, seulement selon la consistance souhaitée.'],
  ['saumon-gravlax-maison-aneth-citron'],
  ['tartiflette-reblochon-pommes-de-terre']
];
for (const [slug, label, servings, note] of changes) {
  const r = catalogue.recettes.find(r => r.slug === slug);
  assert.ok(r, slug);
  let html = fs.readFileSync(r.url, 'utf8');
  if (label) {
    r.servings = servings;
    r.yield_label = label;
    html = html.replace(/<div class=['"]recipe-bar['"]>[\s\S]*?<\/div>/, bar => {
      assert.ok(/<span>(?:Portions|Rendement) :/.test(bar), slug + ': portions absentes');
      return bar.replace(/<span>(?:Portions|Rendement) :[\s\S]*?<\/span>/, `<span>Rendement : <strong>${label}</strong></span>`);
    });
    html = html.replace(/\n?<aside class="tips" id="reperes-portions">[\s\S]*?<\/aside>/g, '');
    html = html.replace(/(<div class=['"]recipe-bar['"]>[\s\S]*?<\/div>)/, `$1\n<aside class="tips" id="reperes-portions"><h3>Quantités et portions</h3><p>${note}</p></aside>`);
  }
  if (slug === 'carbonara-authentique-recette-romaine') {
    html = html.replace(/(<span class=['"]ing-amount['"]>)50 ml(<\/span> eau de cuisson des pâtes réservée)/g, '$1100 ml$2');
  }
  if (slug === 'saumon-gravlax-maison-aneth-citron') {
    html = html.replace(/(<span class=['"]ing-amount['"]>)1 botte(<\/span> pain de seigle ou blinis pour servir)/g, '$1Selon besoin$2');
  }
  if (slug === 'tartiflette-reblochon-pommes-de-terre') {
    html = html.replace(/<li><span class=['"]ing-amount['"]>1 quantité<\/span> muscade fraîchement râpée<\/li>/g, '');
  }
  const decode = text => text.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&quot;', '"');
  const list = html.match(/<ul class=['"]ingredients-list['"]>([\s\S]*?)<\/ul>/);
  assert.ok(list, slug + ': ingrédients absents');
  const ingredients = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => decode(m[1]).trim());
  let count = 0;
  html = html.replace(/(<script[^>]*type=['"]application\/ld\+json['"][^>]*>)([\s\S]*?)(<\/script>)/g, (_, open, source, close) => {
    const data = JSON.parse(source);
    let touched = false;
    function walk(o) {
      if (!o || typeof o !== 'object') return;
      if ([].concat(o['@type'] || []).includes('Recipe')) {
        count++; touched = true;
        if (label) o.recipeYield = label;
        o.recipeIngredient = ingredients;
        o.dateModified = '2026-09-06';
      }
      Object.values(o).forEach(walk);
    }
    walk(data);
    return open + (touched ? JSON.stringify(data, null, 2) : source) + close;
  });
  assert.equal(count, 1, slug);
  fs.writeFileSync(r.url, html);
}
fs.writeFileSync('recettes.json', JSON.stringify(catalogue, null, 2) + '\n');
for (const file of ['index.html', 'toutes-les-recettes.html']) {
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('src="/assets/recipe-yield.js')) html = html.replace('</head>', '<script src="/assets/recipe-yield.js?v=20260906"></script>\n</head>');
  html = html.replaceAll('${escapeHtml(recipe.servings || "—")} personnes', '${escapeHtml(RecipeYield.label(recipe))}')
    .replaceAll('${escapeHtml(recipe.servings || "—")} pers.', '${escapeHtml(RecipeYield.label(recipe))}')
    .replaceAll('${escapeHtml(recipe.servings||"—")} pers.', '${escapeHtml(RecipeYield.label(recipe))}')
    .replaceAll('return Number(a.servings||0)-Number(b.servings||0)', 'return RecipeYield.compareServings(a,b,false)')
    .replaceAll('return Number(b.servings||0)-Number(a.servings||0)', 'return RecipeYield.compareServings(a,b,true)');
  fs.writeFileSync(file, html);
}
await import('./update-recipe-time-ui.mjs');
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
for (const [slug] of changes) {
  sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, block => block.includes(`/recettes/${slug}.html</loc>`) ? block.replace(/<lastmod>[^<]+<\/lastmod>/, '<lastmod>2026-09-06</lastmod>') : block);
}
fs.writeFileSync('sitemap.xml', sitemap);
console.log('Six recettes corrigées ; rendements synchronisés avec les cartes et les données structurées.');
