import fs from 'node:fs';
const changes = {
  'tiramisu-recette-italienne-originale.html': [
    ['Le tiramisu se conserve 3 jours maximum au refrigerateur, filme hermetiquement, mais ne se congele pas sans alteration de texture', 'Ce tiramisu contient des œufs crus : refroidissez-le rapidement, gardez-le à 4 °C maximum et consommez-le dans les 24 heures suivant sa préparation, repos compris.'],
    ['Utilisez toujours des oeufs extra frais et de qualite car ils sont consommes crus, privilegiez le label bio ou fermier', 'Utilisez des œufs intacts et frais. Les labels bio ou fermier ne suppriment pas les risques liés aux œufs crus ; pour les personnes fragiles, choisissez une variante sans œufs crus.']
  ],
  'mousse-au-chocolat-legere-rapide.html': [
    ['Conservation optimale : maximum 48h au réfrigérateur sous film alimentaire', 'Conservation : refroidir rapidement, garder à 4 °C maximum et consommer dans les 24 heures suivant la préparation, temps de repos compris.'],
    ["Absolument, remplacez les œufs par 200ml de crème liquide montée très ferme et 2 cuillères d'agar-agar dissous dans le chocolat chaud. La texture sera différente mais délicieuse, plus proche d'une chantilly chocolatée.", 'Une mousse chocolat-chantilly permet d’éviter les œufs crus, mais demande des proportions et une technique spécifiques. Utilisez une recette dédiée à cette variante plutôt qu’un remplacement improvisé des œufs.']
  ]
};
for (const [name, replacements] of Object.entries(changes)) {
  const file = 'recettes/' + name;
  let html = fs.readFileSync(file, 'utf8');
  for (const [before, after] of replacements) html = html.replaceAll(before, after);
  html = html.replace(/"dateModified":"[^"]+"/, '"dateModified":"2026-09-06"');
  if (!html.includes('id="securite-oeufs"')) html = html.replace('<section class="related-recipes">', '<section id="securite-oeufs"><h2>Conservation et œufs crus</h2><p>Le repos au réfrigérateur fait partie de la limite de 24 heures après préparation. Gardez le dessert au froid jusqu’au service. Une recette contenant des œufs crus ne convient pas aux personnes auxquelles leur consommation est déconseillée. <a href="https://www.anses.fr/fr/system/files/Conso_oeufs-vraioufaux.pdf">Repères de conservation de l’Anses</a>, vérifiés le 6 septembre 2026.</p></section><section class="related-recipes">');
  fs.writeFileSync(file, html);
}
