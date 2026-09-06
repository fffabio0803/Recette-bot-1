// Révision ciblée : préserver les visuels, les URL et les améliorations précédentes.
import fs from 'node:fs';
const date = '2026-09-06';
const encode = s => s.replaceAll('&', '&amp;').replaceAll("'", '&#x27;').replaceAll('"', '&quot;');
function replaceText(html, before, after) {
  return html.replaceAll(before, after).replaceAll(encode(before), encode(after));
}
function revise(slug, replacements, transform) {
  const file = `recettes/${slug}.html`;
  let html = fs.readFileSync(file, 'utf8');
  for (const [before, after] of replacements) html = replaceText(html, before, after);
  html = transform(html);
  // Garder la photo en tête et placer les explications avant les ingrédients.
  const planning = html.match(/<section id="organisation-[^"]+">[\s\S]*?<\/section>/);
  if (planning) html = html.replace(planning[0], '').replace(/<h2>Ingr[eé]dients<\/h2>/, planning[0] + '$&');
  let stepNumber = 0;
  html = html.replace(/<div class='step'(?: id='etape-\d+')?>/g, () => `<div class='step' id='etape-${++stepNumber}'>`);
  html = html.replace(/(<script[^>]*application\/ld\+json[^>]*>)([\s\S]*?)(<\/script>)/, (_, start, raw, end) => {
    const data = JSON.parse(raw), recipe = data['@graph'].find(n => n['@type'] === 'Recipe');
    recipe.dateModified = date;
    if (slug.startsWith('quiche')) { recipe.cookTime = 'PT1H'; recipe.totalTime = 'PT3H'; }
    if (slug.startsWith('boeuf')) recipe.totalTime = 'P1DT4H40M';
    return start + JSON.stringify(data) + end;
  });
  fs.writeFileSync(file, html);
}
revise('quiche-lorraine-recette-authentique', [
  ['Ce pré-cuisson évite une pâte détrempée sous l’appareil liquide.', 'Cette précuisson aide à éviter un fond détrempé.'],
  ["Les œufs étaient trop froids ou le mélange insuffisant. Sortez les œufs 1 heure avant et fouettez énergiquement. Passez au chinois fin si nécessaire pour éliminer tout grumeau.", "Avant cuisson, mélangez la crème avec les œufs puis ajoutez le lait progressivement. Si la préparation reste irrégulière, passez-la au tamis. Après cuisson, une texture granuleuse peut signaler une surcuisson : réduisez la chaleur et surveillez la prise de l’appareil."],
  ["Utilisez exclusivement des lardons fumés, jamais de bacon qui rendrait trop de graisse et dénaturer le goût authentique", "Les lardons fumés donnent une saveur marquée ; égouttez-les après cuisson et ajustez le sel selon leur salaison."],
  ["En Moselle, on ajoute parfois une pointe d'ail écrasé dans la migaine pour une variante subtile mais traditionnelle", "Pour varier, une pointe de muscade suffit à parfumer la migaine sans masquer les lardons."]
], html => {
  html = html.replace('Cuisson : <strong>35 min</strong>', 'Cuisson au four : <strong>55 à 60 min</strong>');
  if (!html.includes('id="organisation-quiche"')) html = html.replace("<figure class='recipe-hero'>", '<section id="organisation-quiche"><h2>Quel temps prévoir ?</h2><p>Avec la pâte maison, prévoyez environ <strong>3 heures au total</strong> : 20 minutes de préparation active, 1 heure de repos de la pâte, puis 30 minutes après le fonçage, 20 minutes de précuisson, 35 à 40 minutes de cuisson garnie et 10 minutes avant de servir. Préparez les lardons et la migaine pendant les repos. Les durées restent indicatives selon votre four.</p></section><figure class=\'recipe-hero\'>');
  return html;
});
revise('boeuf-bourguignon-recette-traditionnelle', [
  ['vin rouge de Bourgogne Côtes-du-Rhône', 'vin rouge sec de Bourgogne ou des Côtes-du-Rhône'],
  ['paleron de bœuf AOC Charolais en cubes de 5 cm', 'paleron de bœuf en cubes de 5 cm'],
  ['carottes carottes de Créances en rondelles', 'carottes en rondelles'],
  ['Marinade essentielle 24 heures', 'Marinade la veille : 24 heures'],
  ['Cette étape cruciale attendrit les fibres et développe les saveurs.', 'Cette marinade parfume la viande ; la cuisson lente reste déterminante pour sa tendreté.'],
  ['Couvrez, enfournez à 160°C pendant 2h30.', 'Couvrez et enfournez à 160°C pendant environ 3 à 3 h 30, en contrôlant la tendreté à partir de 2 h 30.'],
  ['Ajoutez oignons grelots et champignons 45 minutes avant la fin.', 'Faites revenir les oignons grelots et les champignons dans 20 g de beurre à la poêle, puis ajoutez-les à la cocotte 45 minutes avant la fin. Réservez 10 g de beurre pour une éventuelle liaison.'],
  ['Flambez au cognac hors du feu.', 'Le cognac est facultatif : ajoutez-le sans flamber, puis laissez frémir avant de mouiller.'],
  ['Saupoudrez la viande de farine, mélangez délicatement 2 minutes.', 'Saupoudrez la viande avec 20 g de farine, mélangez délicatement 2 minutes. Réservez les 10 g restants pour une éventuelle liaison finale.'],
  ['Si la sauce manque de liaison, mélangez beurre et farine (beurre manié) et incorporez hors du feu.', 'Si la sauce reste trop liquide, retirez la viande et faites-la réduire à découvert. Si nécessaire, mélangez les 10 g de farine réservés avec 10 g de beurre prélevés sur les 30 g prévus ; incorporez par petites portions et laissez frémir 5 minutes en remuant.'],
  ["La marinade est indispensable pour l'authenticité et la tendreté. Sans elle, vous obtiendrez un simple ragoût de bœuf au vin. Minimum 12 heures, idéalement 24 heures pour un résultat optimal et traditionnel.", "Oui. Vous pouvez supprimer le repos en marinade et utiliser le vin avec le bouillon au moment du mouillage. La cuisson lente et le choix du morceau sont essentiels à la tendreté. La version décrite ici prévoit une marinade de 24 heures pour développer les arômes."],
  ['Cuisson insuffisante ou température trop élevée. Prolongez la cuisson à feu doux ou utilisez un beurre manié. La gélatine naturelle des os et cartilages épaissit naturellement avec le temps.', 'La quantité de liquide et son évaporation comptent davantage que la durée seule. Retirez la viande devenue tendre, réduisez la sauce à découvert, puis remettez la viande. Si besoin, utilisez la petite quantité de beurre manié prévue dans la recette et faites-la cuire quelques minutes.']
], html => {
  if (!html.includes('id="organisation-bourguignon"')) html = html.replace("<figure class='recipe-hero'>", '<section id="organisation-bourguignon"><h2>À préparer la veille</h2><p>Prévoyez 24 heures de marinade au réfrigérateur, environ 30 minutes de préparation, jusqu’à 4 heures de cuisson au total (coloration, mijotage et liaison), puis 10 minutes de repos. Soit environ <strong>28 h 40 avec la marinade</strong>, dont l’essentiel sans intervention. Le temps de cuisson varie selon la viande : elle doit céder facilement à la fourchette.</p></section><figure class=\'recipe-hero\'>');
  // Deux sections anciennes répétaient les mêmes liens ; conserver une seule sélection.
  let seen = false;
  return html.replace(/<section class=["']related-recipes["']>[\s\S]*?<\/section>/g, section => {
    if (seen) return ''; seen = true; return section;
  });
});
revise('saumon-gravlax-maison-aneth-citron', [
  ['filet de saumon frais avec peau, qualité sashimi', 'filet de saumon avec peau, adapté à une consommation crue selon le fournisseur'],
  ['Respectez les proportions indiquées pour un équilibre parfait entre conservation et saveur.', 'Respectez les proportions pour la saveur et la texture. Cette marinade ne remplace pas les précautions sanitaires applicables au poisson cru.'],
  ['Laissez reposer 15 minutes à température ambiante avant de trancher pour faciliter la découpe.', 'Gardez le poisson au réfrigérateur jusqu’au tranchage et servez-le sur une assiette froide.'],
  ["Oui, c'est même recommandé pour la sécurité alimentaire. Décongelez-le lentement au réfrigérateur pendant 24 heures avant de commencer la marinade, en épongeant bien l'excès d'humidité.", "Oui, si le fournisseur confirme que ce poisson et son traitement sont adaptés à une consommation crue. Suivez ses instructions de décongélation au réfrigérateur et de conservation. Une simple mention « surgelé » ou « sashimi » ne renseigne pas à elle seule sur tout le protocole suivi."]
], html => {
  if (!html.includes('id="securite-gravlax"')) html = html.replace('<h2>Ingrédients</h2>', '<section id="securite-gravlax"><h2>Avant de commencer : le gravlax reste du poisson cru</h2><p>Le sel, le citron et l’alcool ne constituent pas une cuisson et ne garantissent pas l’élimination des parasites. Faites confirmer par votre fournisseur l’adaptation à une consommation crue et le traitement antiparasitaire nécessaire. Respectez la chaîne du froid pendant la décongélation, la marinade et le service.</p><p>Les femmes enceintes, les jeunes enfants, les personnes âgées ou immunodéprimées doivent éviter le poisson cru ou insuffisamment cuit. Une odeur normale ne garantit pas son innocuité. En cas de doute, choisissez une <a href="daurade-royale-four-citron-fenouil.html">préparation de poisson cuite</a>.</p><p>Sources : <a href="https://www.anses.fr/fr/system/files/BIORISK2016SA0071Fi.pdf">Anses : parasites Anisakis</a> et <a href="https://www.anses.fr/system/files/ANSES-Ft-RecosPoissons.pdf">recommandations pour les populations sensibles</a>. Relecture documentaire du 6 septembre 2026.</p></section><h2>Ingrédients</h2>');
  return html;
});
const data = JSON.parse(fs.readFileSync('recettes.json', 'utf8'));
for (const r of data.recettes) {
  if (r.slug.startsWith('quiche-lorraine')) { r.cook_time = '60 min'; r.rest_time = '1h40'; }
  if (r.slug.startsWith('boeuf-bourguignon')) r.rest_time = '24h10';
}
fs.writeFileSync('recettes.json', JSON.stringify(data, null, 2) + '\n');
let map = fs.readFileSync('sitemap.xml', 'utf8');
for (const slug of ['quiche-lorraine-recette-authentique', 'boeuf-bourguignon-recette-traditionnelle', 'saumon-gravlax-maison-aneth-citron']) {
  const re = new RegExp('(<loc>https://latablemijote.fr/recettes/' + slug + '\\.html</loc>\\s*<lastmod>)[^<]+');
  map = map.replace(re, '$1' + date);
}
fs.writeFileSync('sitemap.xml', map);
