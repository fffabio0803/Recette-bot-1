import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync('recettes.json', 'utf8')).recettes;
let listing = fs.readFileSync('toutes-les-recettes.html', 'utf8');
listing = listing.replace(/function parseMinutes\(value\)\{[\s\S]*?(?=function isNewRecipe)/, 'function parseMinutes(value){return RecipeTime.parseMinutes(value)}function isQuickRecipe(recipe){return RecipeTime.isQuickRecipe(recipe)}');
if (!listing.includes('src="/assets/recipe-time.js"')) listing = listing.replace('</head>', '<script src="/assets/recipe-time.js"></script>\n</head>');
const oldMeta = '${escapeHtml(recipe.cook_time||"—")}</span>';
if (!listing.includes('recipe.rest_time')) listing = listing.replace(oldMeta, oldMeta + '${recipe.rest_time?`<span>Repos : ${escapeHtml(recipe.rest_time)}</span>`:""}');
// Mettre les cartes HTML de secours au même niveau que le catalogue dynamique.
listing = listing.replace(/<article class="recipe-card">[\s\S]*?<\/article>/g, card => {
  const r = data.find(r => card.includes('href="' + r.url + '"'));
  if (!r) return card;
  return card.replace(/<div class="recipe-meta">[\s\S]*?<\/div>/, `<div class="recipe-meta"><span>Préparation : ${r.prep_time}</span><span>Temps principal : ${r.cook_time}</span>${r.rest_time ? '<span>Repos : ' + r.rest_time + '</span>' : ''}<span>${r.servings} pers.</span></div>`);
});
fs.writeFileSync('toutes-les-recettes.html', listing);
let index = fs.readFileSync('index.html', 'utf8');
// Afficher le repos dans les cartes, sans changer leurs images ni leur sélection.
if (!index.includes('recipe.rest_time')) index = index.replaceAll('${escapeHtml(recipe.cook_time || "—")}', '${escapeHtml(recipe.cook_time || "—")}${recipe.rest_time ? " + repos " + escapeHtml(recipe.rest_time) : ""}');
index = index.replace('${escapeHtml(recipe.cook_time || "—")}${recipe.rest_time ? " + repos " + escapeHtml(recipe.rest_time) : ""} de cuisson', '${escapeHtml(recipe.cook_time || "—")} de cuisson${recipe.rest_time ? " + repos " + escapeHtml(recipe.rest_time) : ""}');
fs.writeFileSync('index.html', index);
