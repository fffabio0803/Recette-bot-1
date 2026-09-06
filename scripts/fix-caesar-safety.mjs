// Correction ciblée et idempotente : contenu visible, données structurées et catalogue.
import fs from 'node:fs';
const file = 'recettes/salade-caesar-poulet-grille-maison.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replaceAll('Ne depassez jamais 6 minutes par face pour des blancs de 180g, utilisez un thermometre de cuisson visant 65 degres a coeur, et respectez impérativement le temps de repos de 5 minutes avant de trancher.', 'Le temps varie selon l’épaisseur des blancs et la chaleur de la poêle. Vérifiez 74 °C au centre de la partie la plus épaisse avec un thermomètre alimentaire, puis laissez reposer 5 minutes avant de trancher. La coloration seule ne permet pas de vérifier la cuisson.');
html = html.replaceAll('Pour une sauce sans risque avec des oeufs crus, remplacez les jaunes par 2 cuilleres a soupe de mayonnaise de qualite deja emulsionnee', 'Pour éviter les œufs crus, utilisez 2 cuillères à soupe de mayonnaise du commerce à base d’œufs pasteurisés et respectez ses conditions de conservation. Les personnes fragiles doivent éviter les préparations aux œufs crus.');
html = html.replaceAll('La sauce Caesar se conserve 48 heures maximum au refrigerateur dans un contenant hermetique, jamais plus en raison des oeufs crus', 'Consommez la sauce aux œufs crus immédiatement, ou placez-la rapidement au réfrigérateur à 4 °C maximum et consommez-la dans les 24 heures. Gardez les ingrédients séparés jusqu’au service.');
// Ajouter le contrôle de cuisson dans l’étape elle-même et son équivalent JSON-LD.
for (const ending of html.includes('Vérifiez que le centre du poulet atteint 74') ? [] : ["attendez que la face se detache naturellement de la poele."]) {
  html = html.replaceAll(ending, ending + ' Vérifiez que le centre du poulet atteint 74 °C ; prolongez la cuisson à feu modéré si nécessaire.');
}
html = html.replace('Cuisson : <strong>0 min</strong>', 'Cuisson : <strong>15 min environ</strong>');
html = html.replace('"cookTime":"PT0M"', '"cookTime":"PT15M"');
html = html.replace('"dateModified":"2026-08-24"', '"dateModified":"2026-09-06"');
if (!html.includes('id="sources-securite"')) html = html.replace("<div class='faq-section'>", '<section id="sources-securite"><h2>Repères de sécurité alimentaire</h2><p>Conseils vérifiés le 6 septembre 2026 : <a href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures">température de cuisson des volailles (FoodSafety.gov)</a> et <a href="https://www.anses.fr/fr/system/files/Conso_oeufs-vraioufaux.pdf">conservation des préparations aux œufs crus (Anses)</a>. Nettoyez la planche et les ustensiles après le poulet cru et utilisez une planche propre pour le poulet cuit.</p></section><div class=\'faq-section\'>');
fs.writeFileSync(file, html);
const data = JSON.parse(fs.readFileSync('recettes.json', 'utf8'));
data.recettes.find(r => r.slug === 'salade-caesar-poulet-grille-maison').cook_time = '15 min';
fs.writeFileSync('recettes.json', JSON.stringify(data, null, 2) + '\n');
