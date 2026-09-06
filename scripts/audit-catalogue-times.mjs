// Corrections éditoriales du 6 septembre 2026, fondées sur les étapes publiées.
// Les durées restent des estimations : ce script ne simule pas un test en cuisine.
// Exécuter depuis la racine du dépôt. Réexécution sans changement de résultat.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseMinutes } = require('../assets/recipe-time.js');
const catalogue = JSON.parse(fs.readFileSync('recettes.json', 'utf8'));
// slug, cuisson, repos, précision visible, durée totale non déterminable
const corrections = [
  ['pain-perdu-brioche-recette-facile', '10 min', '8 min', 'Prévoir 6 à 8 min de trempage. La cuisson indiquée dépend du nombre de fournées et de la taille de la poêle.', true],
  ['salade-caesar-poulet-grille-maison', '15 min', '5 min', 'Laisser reposer le poulet 5 min avant de le couper. Préparer la sauce et les croûtons pendant les autres étapes.'],
  ['ile-flottante-oeufs-neige-creme-anglaise', '30 min', 'À prévoir', 'Ajouter le refroidissement de la crème anglaise avant le service froid ; sa durée dépend du récipient et du mode de refroidissement.', true],
  ['daurade-royale-four-citron-fenouil', '40 min', '5 min', 'Compter environ 10 min pour le fenouil et la réduction, puis 25 à 30 min au four et 5 min de repos.'],
  ['fraisier-recette-patisserie-maison', '20 min + crème', '3h', 'La génoise cuit 20 min ; la crème nécessite une cuisson supplémentaire. Ajouter leur refroidissement complet avant le montage, puis au moins 3 h au réfrigérateur.', true],
  ['creme-caramel-renversee-classique', '45 à 55 min + caramel', '4h15', 'Le bain-marie dure 45 à 55 min, en plus du caramel. Prévoir 15 min d’infusion et au moins 4 h au réfrigérateur, ainsi que le refroidissement préalable.', true],
  ['roti-de-porc-moutarde-miel-recette', '1h10', '15 min', 'Le four est utilisé 15 min puis 45 à 55 min : compter jusqu’à 1 h 10. Ajouter 10 à 15 min de repos ; la marinade facultative de 30 min vient en supplément.'],
  ['sorbet-mangue-citron-vert-recette', 'Variable (sirop)', 'Selon méthode', 'Prévoir le refroidissement du sirop (30 min), puis 2 h au frais. Avec une sorbetière : 20 à 30 min de turbinage puis 2 h de raffermissement au congélateur. Sans machine : environ 4 h de congélation avec brassages, puis 2 h de raffermissement. Selon la machine, préparer sa cuve la veille.', true],
  ['brandade-de-morue-maison-recette', '30 min', 'Dessalage préalable', 'Ces durées commencent avec une morue déjà dessalée. Prévoir le dessalage selon les indications du fournisseur, au réfrigérateur ; le gratinage facultatif s’ajoute à la préparation.', true],
  ['baba-au-rhum-recette-traditionnelle', '45 min', '2h40', 'Prévoir deux levées (1 h 30 puis 45 à 60 min) et 10 min d’infusion du sirop. Une partie du sirop peut être préparée pendant la levée ; ajouter le refroidissement et l’imbibage.', true],
  ['tortilla-espagnole-pommes-de-terre-oignon', '35 min', '30 min', 'Prévoir 20 à 25 min pour les pommes de terre, puis 7 à 9 min à la poêle. Les attentes sont de 10 min pour égoutter, 10 min avec les œufs et 10 min avant le service.'],
  ['madeleine-recette-classique-bosse', '12 min', '2h', 'La pâte repose au moins 2 h au réfrigérateur. La cuisson dure 5 min puis 6 à 7 min ; ajouter le refroidissement sur grille et les fournées supplémentaires.', true],
  ['salade-de-lentilles-vinaigrette-moutarde', '30 min', '40 min', 'Après la cuisson, prévoir 10 min pour tiédir les lentilles puis 30 min de repos de la salade.'],
  ['panna-cotta-vanille-coulis-fruits', 'Chauffage de la crème', '4h35', 'Le chauffage de la crème est à surveiller, sans durée fixe. Ajouter 15 min d’infusion, environ 20 min de refroidissement et au moins 4 h au réfrigérateur. Faire tremper la gélatine pendant les autres préparatifs.', true],
  ['tartiflette-reblochon-pommes-de-terre', '50 min', '5 min', 'Préparer les oignons et les lardons pendant la cuisson des pommes de terre. Compter ensuite 20 à 25 min au four et environ 5 min avant de servir.'],
  ['saumon-gravlax-maison-aneth-citron', '0 min', '24 à 48 h', 'Il n’y a pas de cuisson : le poisson marine 24 à 48 h au réfrigérateur. Les éventuels traitements préalables et la décongélation selon le fournisseur sont à anticiper ; voir les précautions pour le poisson cru.', true],
  ['profiteroles-choux-creme-glacee-chocolat', '40 min', 'À prévoir', 'Ajouter 5 min pour tiédir la pâte puis le refroidissement complet des choux avant de les garnir de glace.', true],
  ['gaspacho-andalou-recette-fraiche', '0 min', '3h', 'Faire tremper le pain environ 10 min pendant la préparation des légumes. Le gaspacho mixé repose ensuite au moins 3 h au réfrigérateur.'],
  ['tajine-de-poulet-citron-confit-olives', '1h30', '30 min', 'Prévoir au moins 30 min de marinade au réfrigérateur avant la cuisson.'],
  ['pavlova-fruits-rouges-meringue', '1h30', '2h', 'La meringue cuit environ 1 h 25, puis refroidit au moins 2 h dans le four éteint. Ne garnir qu’une fois froide.'],
  ['gnocchis-pommes-de-terre-maison', '45 min', '5 min', 'Les pommes de terre cuisent 35 à 40 min. Ajouter le pochage des gnocchis par petites quantités et leur finition ; le nombre de fournées peut prolonger la cuisson.', true],
  ['far-breton-pruneaux-recette-bretonne', '50 min', '2h30', 'Prévoir au moins 2 h de macération des pruneaux, en parallèle du repos de la pâte (au moins 1 h au frais), puis 45 à 50 min au four et 30 min pour tiédir. Les temps parallèles ne s’additionnent pas.'],
  ['pissaladiere-nicoise-oignons-anchois', '1h40', '1h50', 'Les oignons cuisent 65 à 75 min et la tarte 20 à 25 min. Prévoir 10 min pour la levure, 1 h 30 de levée puis 5 à 10 min avant service. Cuire les oignons pendant la levée : le temps écoulé est inférieur à la somme de ces durées.'],
  ['rillettes-de-saumon-fume-maison', '8 min', '3h', 'Le saumon frais poche 6 à 8 min. Ajouter son refroidissement puis au moins 3 h de repos des rillettes au réfrigérateur.', true],
  ['cake-citron-moelleux-facile-rapide', '40 min', 'À prévoir', 'Prévoir 10 min avant démoulage, le refroidissement complet sur grille, puis 15 min de prise du glaçage.', true],
  ['veloute-butternut-courge-gingembre', '35 min', '', 'Les étapes chaudes s’enchaînent : environ 5 min, puis 3 à 4 min et 20 à 25 min de mijotage.'],
  ['osso-buco-milanaise-recette-italienne', '2h20', '', 'Prévoir 6 à 8 min pour saisir la viande, 8 min pour les légumes puis environ 2 h au four. Prolonger par tranches de 20 min si la viande n’est pas encore tendre.'],
  ['tarte-flambee-alsacienne-recette', '20 min', '30 min', 'La pâte repose 30 min. Compter 8 à 10 min au four par fournée ; la durée affichée prévoit environ deux fournées.', true],
  ['tiramisu-recette-italienne-originale', '0 min', '6h', 'Prévoir au moins 6 h au réfrigérateur après le montage et du café refroidi pour les biscuits. Le repos ne remplace pas la limite de conservation de 24 h indiquée pour les œufs crus.', true],
  ['taboul-maison-menthe-citron', '0 min', '1h20', 'La semoule s’hydrate 15 à 20 min avec de l’eau chaude, pendant la découpe des légumes, puis le taboulé repose au moins 1 h au frais.'],
  ['croque-monsieur-bechamel-maison', '20 min', '2 min', 'Compter environ 6 à 8 min pour la béchamel puis 10 à 12 min au four et 2 min avant de servir.'],
  ['vichyssoise-froide-poireaux-pommes-de-terre', '40 min', '4h', 'La cuisson comprend 10 min pour faire suer les légumes puis 25 à 30 min de mijotage. Refroidir rapidement et ajouter au moins 4 h au réfrigérateur.', true],
  ['clafoutis-cerises-recette-classique', '40 min', '50 min', 'Prévoir 30 min de repos de la pâte, 35 à 40 min de cuisson puis environ 20 min avant de servir.'],
  ['magret-de-canard-sauce-miel-soja', '15 min', '8 min', 'Après la cuisson, laisser reposer le magret 5 à 8 min. Réduire la sauce pendant ce repos.'],
  ['pate-a-crepes-recette-de-base', '2 min par crêpe', '1h', 'La pâte repose au moins 1 h au réfrigérateur. Compter environ 1 min de chaque côté ; la cuisson totale dépend du nombre de crêpes et de poêles utilisées.', true],
  ['soupe-de-tomates-fraiches-basilic', '45 min', '', 'Prévoir environ 5 min pour l’oignon, 1 min pour l’ail, puis deux étapes successives de 15 et 20 min de mijotage.'],
  ['financiers-amandes-moelleux-recette', '15 min', '1h05', 'La pâte repose au moins 1 h au réfrigérateur. Ajouter 5 min avant démoulage puis le refroidissement sur grille.', true],
  ['pot-au-feu-recette-traditionnelle', '4h05', '', 'Les étapes principales s’additionnent : environ 20 min au démarrage, 2 h 30 de mijotage, puis 45 et 30 min après les ajouts de légumes. Cuire les pommes de terre pendant la dernière phase.'],
  ['tarte-au-citron-meringuee-facile', '35 à 40 min + crème', '2h45', 'Le fond de tarte cuit 25 min et la meringue 10 à 15 min, en plus de la cuisson de la crème. Prévoir 30 min de repos de pâte, au moins 2 h au réfrigérateur et 15 min après la dernière cuisson ; ajouter les refroidissements intermédiaires.', true],
  ['gratin-dauphinois-cremeux-facile', '1h05', '10 min', 'Le four est utilisé 45 min puis environ 20 min pour gratiner. Laisser reposer 10 min avant de servir.'],
  ['mousse-au-chocolat-legere-rapide', '0 min', '2h', 'La fonte du chocolat fait partie de la préparation ; les œufs ne sont pas cuits. Prévoir au moins 2 h au réfrigérateur pour la prise et respecter la limite de conservation de 24 h.'],
  ['creme-brulee-recette-facile-maison', '45 min + caramel', '4h15', 'Prévoir 15 min d’infusion, environ 45 min au bain-marie puis le refroidissement et au moins 4 h au réfrigérateur. La caramélisation finale s’ajoute à la cuisson.', true],
  ['blanquette-de-veau-classique', '1h45', '', 'Compter environ 3 min pour blanchir, 15 min de montée en température puis 1 h 15 de mijotage, auxquels s’ajoute la finition de la sauce.'],
  ['salade-nicoise-traditionnelle-recette', '10 min', '', 'Les œufs durs nécessitent 10 min de cuisson. Préparer les légumes et faire dégorger les tomates pendant cette étape.'],
  ['soupe-a-loignon-gratinee-parisienne', '1h30', '', 'Prévoir environ 45 min pour les oignons, 3 min de réduction, 25 min de bouillon et 8 à 10 min pour gratiner. Faire griller le pain pendant le mijotage.'],
  ['risotto-champignons-cremeux-facile', '30 min', '', 'Compter environ 2 min pour l’oignon, 3 min de nacrage, 2 min pour le vin puis 18 à 20 min pour le riz. Cuire les champignons en parallèle.'],
  ['tarte-tatin-pommes-caramel-facile', '35 min + caramel', '35 min', 'Prévoir 30 min de macération des pommes, la réalisation du caramel, 35 min au four puis 5 min avant de retourner la tarte.', true],
  ['poulet-roti-herbes-de-provence-facile', '1h35', '40 min', 'Prévoir 30 min pour la marinade aux herbes, environ 20 min pour saisir le poulet sur ses faces, 1 h 15 au four puis 10 min de repos. La durée varie avec le poids : vérifier la cuisson à cœur.'],
  ['terrine-de-campagne-recette-maison', '1h15', '51h', 'La farce repose 3 h au réfrigérateur avant cuisson. Après 1 h 15 au bain-marie, refroidir rapidement puis conserver au frais 48 h avant dégustation ; ce refroidissement s’ajoute aux 51 h de repos.', true],
  ['coq-au-vin-rouge-champignons-lardons', '2h', '24h', 'Prévoir 24 h de marinade au réfrigérateur avant les étapes de cuisson.']
];
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const iso = value => { const n = parseMinutes(value); return n === 99999 ? null : `PT${n}M`; };
let changed = 0;
for (const [slug, cook, rest, note, uncertain = false] of corrections) {
  const r = catalogue.recettes.find(r => r.slug === slug);
  assert.ok(r, slug);
  r.cook_time = cook;
  if (rest) r.rest_time = rest; else delete r.rest_time;
  r.time_note = note;
  r.time_uncertain = uncertain;
  const file = `recettes/${slug}.html`;
  const before = fs.readFileSync(file, 'utf8');
  let html = before;
  const barRE = /<div class=['"]recipe-bar['"]>[\s\S]*?<\/div>/;
  assert.ok(barRE.test(html), `${slug}: bandeau absent`);
  html = html.replace(barRE, bar => {
    const spans = [...bar.matchAll(/<span>[\s\S]*?<\/span>/g)].map(m => m[0]);
    const retained = spans.filter(s => !/Préparation|Prep\s*:|Cuisson|Repos|Marinade/i.test(s));
    return `<div class='recipe-bar'><span>Préparation : <strong>${escape(r.prep_time)}</strong></span><span>Cuisson : <strong>${escape(cook)}</strong></span>${rest ? `<span>Repos / attente : <strong>${escape(rest)}</strong></span>` : ''}${retained.join('')}</div>`;
  });
  html = html.replace(/\n?<aside class="tips" id="reperes-durees">[\s\S]*?<\/aside>/g, '');
  html = html.replace(barRE, bar => `${bar}\n<aside class="tips" id="reperes-durees"><h3>Bien prévoir son temps</h3><p>${escape(note)}</p><p><small>Durées indicatives : selon le matériel et les quantités. Les étapes réalisées en parallèle ne s’additionnent pas ; prévoir également le préchauffage si nécessaire.</small></p></aside>`);
  if (slug === 'mousse-au-chocolat-legere-rapide') {
    html = html.replaceAll('Dressage et prise rapide', 'Dressage et repos au frais');
    html = html.replaceAll('Placez 10 minutes au congélateur puis 15 minutes au réfrigérateur. Cette technique de choc thermique accélère considérablement la prise de la mousse.', 'Placez au réfrigérateur pendant au moins 2 heures et vérifiez que la mousse est prise avant de servir. Ne remplacez pas ce repos par un passage express au congélateur.');
  }
  if (slug === 'gaspacho-andalou-recette-fraiche') html = html.replaceAll('au moins deux heures', 'au moins trois heures').replaceAll('après les deux heures de froid', 'après les trois heures de froid');
  if (slug === 'vichyssoise-froide-poireaux-pommes-de-terre') {
    html = html.replaceAll('Laissez refroidir completement le veloute a temperature ambiante avant de le placer au refrigerateur pendant au moins 4 heures, idealement une nuit entiere.', 'Refroidissez rapidement le velouté en le répartissant dans des récipients peu profonds, puis placez-le au réfrigérateur au plus tard deux heures après la préparation. Laissez-le ensuite au froid pendant au moins 4 heures.');
    if (!html.includes('https://agriculture.gouv.fr/cuisine-domicile-les-bons-gestes-dhygiene')) html = html.replace('</aside>', '<p><small>Repère sanitaire : <a href="https://agriculture.gouv.fr/cuisine-domicile-les-bons-gestes-dhygiene">bons gestes d’hygiène du ministère de l’Agriculture</a>.</small></p></aside>');
  }
  // Les instructions structurées restent alignées sur le texte effectivement visible.
  const decode = s => s.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  const steps = [...html.matchAll(/<div class=['"]step-body['"]>\s*<strong>([\s\S]*?)<\/strong>\s*<p>([\s\S]*?)<\/p>/g)].map(m => ({name:decode(m[1]), text:decode(m[2])}));
  let found = 0;
  html = html.replace(/(<script[^>]*type=['"]application\/ld\+json['"][^>]*>)([\s\S]*?)(<\/script>)/g, (_, start, json, end) => {
    const data = JSON.parse(json);
    let edited = false;
    function walk(value) {
      if (!value || typeof value !== 'object') return;
      if ([].concat(value['@type'] || []).includes('Recipe')) {
        found++; edited = true;
        value.prepTime = iso(r.prep_time);
        const cookISO = iso(cook);
        if (cookISO) value.cookTime = cookISO; else delete value.cookTime;
        // Une somme mécanique ignore refroidissements, fournées et étapes parallèles.
        delete value.totalTime;
        value.dateModified = '2026-09-06';
        if (Array.isArray(value.recipeInstructions) && value.recipeInstructions.length === steps.length) {
          value.recipeInstructions = value.recipeInstructions.map((step, i) => typeof step === 'object' ? {...step, ...steps[i]} : steps[i].text);
        }
      }
      for (const child of Object.values(value)) if (typeof child === 'object') walk(child);
    }
    walk(data);
    return edited ? start + JSON.stringify(data, null, 2) + end : start + json + end;
  });
  assert.equal(found, 1, `${slug}: nombre d’entités Recipe inattendu`);
  if (html !== before) { fs.writeFileSync(file, html); changed++; }
}
fs.writeFileSync('recettes.json', JSON.stringify(catalogue, null, 2) + '\n');
let sitemap = fs.readFileSync('sitemap.xml', 'utf8');
for (const [slug] of corrections) {
  sitemap = sitemap.replace(/<url>[\s\S]*?<\/url>/g, block => block.includes(`/recettes/${slug}.html</loc>`) ? block.replace(/<lastmod>[^<]+<\/lastmod>/, '<lastmod>2026-09-06</lastmod>') : block);
}
fs.writeFileSync('sitemap.xml', sitemap);
await import('./update-recipe-time-ui.mjs');
console.log(`${catalogue.recettes.length} recettes examinées ; ${corrections.length} fiches avec repères de durée ; ${changed} pages modifiées à cette exécution.`);
