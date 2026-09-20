import fs from 'node:fs';

const DATE = '2026-09-20';
const selected = [
  'quiche-lorraine-recette-authentique',
  'baba-au-rhum-recette-traditionnelle',
  'gratin-dauphinois-cremeux-facile',
  'oeufs-cocotte-creme-fraiche-facile',
  'saumon-gravlax-maison-aneth-citron',
  'pavlova-fruits-rouges-meringue',
  'boeuf-bourguignon-recette-traditionnelle',
  'tiramisu-recette-italienne-originale',
  'salade-caesar-poulet-grille-maison',
  'pate-a-crepes-recette-de-base',
  'cake-citron-moelleux-facile-rapide',
  'daurade-royale-four-citron-fenouil'
];
const active = new Set(selected);

const editorialUpdates = {
  'cake-citron-moelleux-facile-rapide': {
    data: {
      title: 'Cake au citron moelleux et glaçage léger',
      meta_description: 'Un cake au citron moelleux avec un glaçage léger, des repères de cuisson et des conseils pour éviter une mie compacte ou un centre humide.'
    },
    replacements: [
      ['Cake au Citron Moelleux Facile et Rapide - Recette Express', 'Cake au citron moelleux et glaçage léger'],
      ['Un cake citron ultra moelleux prêt en 15 min de préparation. Recette simple, glaçage brillant, astuces de chef pour un résultat parfait à tous les coups.', 'Un cake au citron moelleux avec un glaçage léger, des repères de cuisson et des conseils pour éviter une mie compacte ou un centre humide.']
    ]
  },
  'salade-caesar-poulet-grille-maison': {
    data: {
      title: 'Salade César au poulet grillé et croûtons',
      meta_description: 'Une salade César au poulet grillé avec sauce maison, croûtons et parmesan, accompagnée de repères de cuisson et de conseils pour garder le croquant.'
    },
    replacements: [
      ['Salade Caesar au poulet grille maison et croutons dores', 'Salade César au poulet grillé et croûtons'],
      ['Salade Caesar authentique : poulet grille juteux, sauce onctueuse maison, croutons croustillants et parmesan. Recette facile et gourmande a realiser chez vous.', 'Une salade César au poulet grillé avec sauce maison, croûtons et parmesan, accompagnée de repères de cuisson et de conseils pour garder le croquant.']
    ]
  },
  'oeufs-cocotte-creme-fraiche-facile': {
    data: {
      title: 'Œufs cocotte à la crème fraîche',
      meta_description: 'Des œufs cocotte à la crème fraîche avec des repères précis pour obtenir un blanc pris et un jaune coulant au bain-marie.'
    },
    replacements: [
      ['Oeufs Cocotte à la Crème Fraîche : Recette Facile et Onctueuse', 'Œufs cocotte à la crème fraîche'],
      ['Découvrez la recette des oeufs cocotte à la crème fraîche, un plat simple et réconfortant, prêt en 20 minutes, parfait pour un brunch ou dîner léger.', 'Des œufs cocotte à la crème fraîche avec des repères précis pour obtenir un blanc pris et un jaune coulant au bain-marie.'],
      ['Voici comment réussir cette préparation à tous les coups, avec les gestes techniques essentiels.', 'Voici les gestes techniques et les repères visuels à observer pendant la cuisson.']
    ]
  },
  'saumon-gravlax-maison-aneth-citron': {
    data: {
      title: 'Saumon gravlax maison à l’aneth et au citron',
      meta_description: 'Un saumon gravlax maison à l’aneth et au citron, avec des repères de salage, de durée, de texture et de sécurité pour le poisson cru.'
    },
    replacements: [
      ["Saumon Gravlax Maison à l'Aneth et Citron Facile", 'Saumon gravlax maison à l’aneth et au citron'],
      ["Recette du saumon gravlax maison mariné à l'aneth et citron. Technique traditionnelle scandinave expliquée pas à pas pour un résultat digne d'un chef.", 'Un saumon gravlax maison à l’aneth et au citron, avec des repères de salage, de durée, de texture et de sécurité pour le poisson cru.']
    ]
  },
  'quiche-lorraine-recette-authentique': {
    replacements: [
      ['Quiche lorraine authentique', 'Quiche lorraine aux lardons'],
      ['Confectionner la migaine traditionnelle', 'Préparer la migaine'],
      ['Garnir et cuire la quiche authentique', 'Garnir et cuire la quiche'],
      ['Finaliser et servir comme en Lorraine', 'Finaliser et servir'],
      ["Servez accompagnée d'une salade de mâche aux noix, selon la tradition lorraine authentique.", "Servez tiède, éventuellement accompagnée d'une salade de mâche aux noix."]
    ]
  },
  'boeuf-bourguignon-recette-traditionnelle': {
    replacements: [
      ['Service authentique bourguignon', 'Repos et service'],
      ['Bœuf bourguignon traditionnel', 'Bœuf bourguignon mijoté']
    ]
  }
};

const dossiers = {
  'quiche-lorraine-recette-authentique': `<section class="editorial-dossier" id="dossier-pratique"><h2>Repères pratiques pour adapter la quiche</h2><p>La quantité de migaine dépend surtout de la surface et de la profondeur du moule. Pour un moule rond classique de 28 cm, la base de cette recette remplit le fond sans noyer les lardons.</p><table><tr><th>Situation</th><th>Ajustement utile</th><th>Pourquoi</th></tr><tr><td>Moule de 24 cm</td><td>3 œufs, 20 cl de crème, 10 cl de lait</td><td>Évite une couche trop épaisse qui prend mal au centre.</td></tr><tr><td>Garniture de légumes</td><td>Précuire et égoutter avant de garnir</td><td>L'eau rendue détrempe la pâte et dilue l'appareil.</td></tr><tr><td>Centre déjà ferme à la sortie</td><td>Retirer 5 minutes plus tôt la prochaine fois</td><td>La chaleur résiduelle poursuit la coagulation.</td></tr></table><h3>Contrôle sans thermomètre</h3><p>Le bord doit être pris et légèrement gonflé ; le centre peut encore bouger comme une crème. Laissez reposer dix minutes avant de couper. Une texture granuleuse indique généralement une cuisson trop chaude ou trop longue.</p><p class="method-note"><strong>Outil associé :</strong> adaptez automatiquement œufs, crème et lait avec le <a href="/outils/calculateur-migaine.html">calculateur de migaine</a>.</p></section>`,
  'baba-au-rhum-recette-traditionnelle': `<section class="editorial-dossier" id="dossier-pratique"><h2>Comprendre l'imbibage du baba</h2><p>La mie doit être suffisamment cuite et sèche pour absorber le sirop sans se défaire. Un baba tout juste sorti du four est fragile : laissez-le refroidir, ou préparez-le la veille.</p><table><tr><th>Problème</th><th>Cause probable</th><th>Correction</th></tr><tr><td>Cœur encore sec</td><td>Sirop versé trop vite</td><td>Retourner le baba et procéder en trois ajouts espacés.</td></tr><tr><td>Mie qui s'effondre</td><td>Baba sous-cuit ou sirop bouillant</td><td>Colorer davantage la pâte et viser un sirop chaud, non bouillant.</td></tr><tr><td>Goût d'alcool dominant</td><td>Rhum trop concentré</td><td>Réduire le rhum et servir un complément à part.</td></tr></table><p class="method-note"><strong>Outil associé :</strong> calculez les quantités exactes avec le <a href="/outils/calculateur-sirop-baba.html">calculateur de sirop pour baba</a>.</p></section>`,
  'gratin-dauphinois-cremeux-facile': `<section class="editorial-dossier" id="dossier-pratique"><h2>Trois contrôles pour un gratin fondant</h2><p>Des rondelles régulières sont plus importantes qu'une épaisseur parfaite au millimètre. Visez environ 2 à 3 mm et ne rincez pas les pommes de terre : leur amidon aide à lier la crème.</p><table><tr><th>Signal</th><th>Interprétation</th><th>Action</th></tr><tr><td>Crème très liquide après 45 min</td><td>Plat profond ou pommes de terre humides</td><td>Poursuivre à découvert et vérifier toutes les 10 minutes.</td></tr><tr><td>Dessus coloré, cœur ferme</td><td>Chaleur trop forte</td><td>Couvrir légèrement et baisser à 160 °C.</td></tr><tr><td>Gratin gras</td><td>Crème trop riche ou cuisson vive</td><td>Mélanger crème et lait et cuire plus doucement.</td></tr></table><p class="method-note">Le gratin est prêt lorsqu'une lame traverse les couches sans résistance. Le repos de dix minutes stabilise la sauce avant le service.</p></section>`,
  'oeufs-cocotte-creme-fraiche-facile': `<section class="editorial-dossier" id="dossier-pratique"><h2>Maîtriser la cuisson des œufs cocotte</h2><p>Le blanc et le jaune ne prennent pas à la même vitesse. Le bain-marie limite l'écart de température et permet de conserver un jaune coulant pendant que le blanc devient opaque.</p><table><tr><th>Résultat recherché</th><th>Repère visuel</th><th>À éviter</th></tr><tr><td>Jaune coulant</td><td>Blanc opaque sur les bords, centre encore souple</td><td>Attendre que tout soit ferme dans le four.</td></tr><tr><td>Cuisson régulière</td><td>Eau chaude à mi-hauteur des ramequins</td><td>Eau bouillante qui fait coaguler brutalement.</td></tr><tr><td>Service sans risque</td><td>Servir immédiatement dans un ramequin stable</td><td>Laisser tiédir longtemps à température ambiante.</td></tr></table><p class="method-note">Pour les personnes vulnérables, privilégiez un œuf entièrement cuit. Les temps varient fortement selon la taille des œufs et l'épaisseur du ramequin.</p></section>`,
  'saumon-gravlax-maison-aneth-citron': `<section class="editorial-dossier" id="dossier-pratique"><h2>Sel, temps et sécurité du gravlax</h2><p>Le gravlax reste un poisson cru : le sel, le sucre et le citron modifient sa texture mais ne constituent pas une cuisson. Demandez au fournisseur si le poisson a reçu le traitement adapté à une consommation crue.</p><table><tr><th>Épaisseur du filet</th><th>Contrôle à partir de</th><th>Texture attendue</th></tr><tr><td>2 à 3 cm</td><td>18 heures</td><td>Surface ferme, cœur encore souple.</td></tr><tr><td>3 à 5 cm</td><td>24 heures</td><td>Tranche nette et légèrement translucide.</td></tr><tr><td>Plus de 5 cm</td><td>36 heures</td><td>Vérifier le centre avant de prolonger.</td></tr></table><p class="method-note">Conservez le poisson au réfrigérateur pendant toute la préparation. Les femmes enceintes, jeunes enfants, personnes âgées ou immunodéprimées doivent éviter le poisson cru.</p></section>`,
  'pavlova-fruits-rouges-meringue': `<section class="editorial-dossier" id="dossier-pratique"><h2>Diagnostiquer une pavlova</h2><p>La coque doit sécher tandis que le centre reste moelleux. L'humidité de l'air, la taille de la meringue et la précision du four influencent davantage le résultat que quelques minutes de différence.</p><table><tr><th>Problème</th><th>Cause fréquente</th><th>Solution</th></tr><tr><td>Perles de sirop</td><td>Sucre mal dissous</td><td>Ajouter le sucre progressivement et frotter un peu de meringue entre les doigts.</td></tr><tr><td>Coque très colorée</td><td>Four trop chaud</td><td>Réduire la température de 10 à 15 °C.</td></tr><tr><td>Fond détrempé</td><td>Montage trop anticipé</td><td>Ajouter crème et fruits au dernier moment.</td></tr></table><p class="method-note">Une pavlova peut se fissurer : ce n'est pas un échec si la coque est sèche et le cœur tendre. Conservez la meringue seule au sec, jamais au réfrigérateur.</p></section>`,
  'boeuf-bourguignon-recette-traditionnelle': `<section class="editorial-dossier" id="dossier-pratique"><h2>Décider avec la texture, pas seulement l'horloge</h2><p>Deux morceaux de paleron de même poids peuvent demander des durées différentes. Contrôlez à partir de 2 h 30 : une fourchette doit entrer facilement, sans que la viande se défasse complètement.</p><table><tr><th>Problème</th><th>Diagnostic</th><th>Correction</th></tr><tr><td>Viande ferme</td><td>Collagène pas encore transformé</td><td>Prolonger doucement par tranches de 20 minutes.</td></tr><tr><td>Sauce liquide, viande tendre</td><td>Évaporation insuffisante</td><td>Retirer la viande et réduire la sauce à découvert.</td></tr><tr><td>Sauce trop salée</td><td>Bouillon et lardons cumulés</td><td>Saler seulement après réduction finale.</td></tr></table><p class="method-note">La marinade parfume mais n'est pas indispensable à la tendreté. Celle-ci dépend surtout du morceau choisi et d'une cuisson lente suffisamment longue.</p></section>`,
  'tiramisu-recette-italienne-originale': `<section class="editorial-dossier" id="dossier-pratique"><h2>Texture et sécurité du tiramisu</h2><p>Le mascarpone doit être froid et incorporé sans être fouetté excessivement. Un appareil liquide vient souvent d'œufs trop longuement battus avec le mascarpone ou de biscuits trop imbibés.</p><table><tr><th>Étape</th><th>Repère utile</th><th>Erreur à éviter</th></tr><tr><td>Café</td><td>Complètement refroidi</td><td>Tremper les biscuits dans un café chaud.</td></tr><tr><td>Biscuits</td><td>Un aller-retour rapide</td><td>Les laisser absorber jusqu'à devenir mous.</td></tr><tr><td>Repos</td><td>Au moins 6 heures au froid</td><td>Servir immédiatement après montage.</td></tr></table><p class="method-note">Utilisez des œufs très frais et conservez le dessert à 4 °C maximum. Consommez-le dans les 24 heures ; les personnes vulnérables doivent privilégier une version aux œufs pasteurisés.</p></section>`,
  'salade-caesar-poulet-grille-maison': `<section class="editorial-dossier" id="dossier-pratique"><h2>Organiser une salade César sans perdre le croquant</h2><p>Préparez séparément la sauce, le poulet et les croûtons. Assemblez au dernier moment : une salade déjà assaisonnée s'affaisse rapidement et les croûtons absorbent l'humidité.</p><table><tr><th>Élément</th><th>Repère</th><th>Pourquoi</th></tr><tr><td>Poulet</td><td>74 °C à cœur puis 5 min de repos</td><td>Cuisson sûre sans découpe immédiate qui vide les jus.</td></tr><tr><td>Sauce</td><td>Nappante mais fluide</td><td>Elle doit enrober, pas masquer la salade.</td></tr><tr><td>Croûtons</td><td>Ajoutés après la sauce</td><td>Ils restent croustillants plus longtemps.</td></tr></table><p class="method-note">Conservez les éléments séparément et consommez le poulet cuit réfrigéré dans les 24 heures pour cette préparation froide.</p></section>`,
  'pate-a-crepes-recette-de-base': `<section class="editorial-dossier" id="dossier-pratique"><h2>Ajuster une pâte à crêpes</h2><p>La consistance dépend de la farine et de la taille des œufs. Après le repos, la pâte doit former un ruban fluide. Si elle nappe lourdement la louche, ajoutez le lait par petites quantités.</p><table><tr><th>Problème</th><th>Cause probable</th><th>Correction</th></tr><tr><td>Grumeaux</td><td>Liquide ajouté trop vite</td><td>Mixer brièvement puis laisser reposer.</td></tr><tr><td>Crêpe cassante</td><td>Pâte trop liquide ou poêle pas assez chaude</td><td>Ajouter un peu de farine délayée et préchauffer.</td></tr><tr><td>Crêpe épaisse</td><td>Pâte trop dense</td><td>Ajouter 1 à 2 cuillères de lait à la fois.</td></tr></table><p class="method-note">Pour changer le nombre de convives, utilisez le <a href="/outils/convertisseur-portions-moules.html">convertisseur de portions</a> puis ajustez la fluidité après le repos.</p></section>`,
  'cake-citron-moelleux-facile-rapide': `<section class="editorial-dossier" id="dossier-pratique"><h2>Préserver le moelleux du cake au citron</h2><p>Le zeste apporte l'arôme tandis que le jus apporte de l'acidité et de l'eau. Ajouter beaucoup de jus sans adapter la farine peut rendre le centre humide et fragile.</p><table><tr><th>Signal</th><th>Interprétation</th><th>Action</th></tr><tr><td>Fente centrale nette</td><td>Développement normal au four</td><td>Ne pas ouvrir le four pendant la première moitié.</td></tr><tr><td>Bords secs, centre cru</td><td>Moule sombre ou four trop chaud</td><td>Baisser de 10 °C et prolonger.</td></tr><tr><td>Cake compact</td><td>Pâte trop travaillée après la farine</td><td>Mélanger seulement jusqu'à disparition des traces sèches.</td></tr></table><p class="method-note">Pesez le jus plutôt que de compter les citrons, dont la taille varie. Laissez tiédir avant de démouler pour ne pas casser la mie.</p></section>`,
  'daurade-royale-four-citron-fenouil': `<section class="editorial-dossier" id="dossier-pratique"><h2>Adapter la cuisson à la taille de la daurade</h2><p>Le poids et l'épaisseur du poisson comptent plus que le nombre de portions. Commencez le contrôle tôt et observez la chair près de l'arête, dans la partie la plus épaisse.</p><table><tr><th>Poids entier</th><th>Premier contrôle à 190 °C</th><th>Repère</th></tr><tr><td>500 à 700 g</td><td>20 minutes</td><td>Chair opaque qui se détache avec une légère résistance.</td></tr><tr><td>800 g à 1 kg</td><td>25 minutes</td><td>Jus clair et arête centrale chaude.</td></tr><tr><td>Plus de 1 kg</td><td>30 minutes</td><td>Prolonger par tranches de 5 minutes.</td></tr></table><p class="method-note">Ces durées sont des points de contrôle, pas des garanties. La forme du poisson, sa température initiale et le four modifient la cuisson.</p></section>`
};

const related = {
  'quiche-lorraine-recette-authentique': [['/guides/migaine-pour-quiche-proportions.html','Guide de la migaine'],['/guides/pate-brisee-maison-pour-quiche.html','Pâte brisée maison'],['/outils/calculateur-migaine.html','Calculateur de migaine']],
  'baba-au-rhum-recette-traditionnelle': [['/guides/sirop-baba-au-rhum-dosage.html','Dosage du sirop'],['/outils/calculateur-sirop-baba.html','Calculateur de sirop'],['/recettes/pavlova-fruits-rouges-meringue.html','Pavlova aux fruits rouges']],
  'gratin-dauphinois-cremeux-facile': [['/recettes/boeuf-bourguignon-recette-traditionnelle.html','Bœuf bourguignon'],['/recettes/daurade-royale-four-citron-fenouil.html','Daurade au four'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']],
  'oeufs-cocotte-creme-fraiche-facile': [['/recettes/quiche-lorraine-recette-authentique.html','Quiche lorraine'],['/recettes/salade-caesar-poulet-grille-maison.html','Salade César'],['/guides.html','Tous les guides']],
  'saumon-gravlax-maison-aneth-citron': [['/recettes/daurade-royale-four-citron-fenouil.html','Daurade au four'],['/recettes/salade-caesar-poulet-grille-maison.html','Salade César'],['/guides.html','Guides pratiques']],
  'pavlova-fruits-rouges-meringue': [['/recettes/tiramisu-recette-italienne-originale.html','Tiramisu'],['/recettes/cake-citron-moelleux-facile-rapide.html','Cake au citron'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']],
  'boeuf-bourguignon-recette-traditionnelle': [['/recettes/gratin-dauphinois-cremeux-facile.html','Gratin dauphinois'],['/recettes/quiche-lorraine-recette-authentique.html','Quiche lorraine'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']],
  'tiramisu-recette-italienne-originale': [['/recettes/pavlova-fruits-rouges-meringue.html','Pavlova'],['/recettes/cake-citron-moelleux-facile-rapide.html','Cake au citron'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']],
  'salade-caesar-poulet-grille-maison': [['/recettes/oeufs-cocotte-creme-fraiche-facile.html','Œufs cocotte'],['/recettes/saumon-gravlax-maison-aneth-citron.html','Saumon gravlax'],['/guides.html','Guides pratiques']],
  'pate-a-crepes-recette-de-base': [['/recettes/cake-citron-moelleux-facile-rapide.html','Cake au citron'],['/recettes/pavlova-fruits-rouges-meringue.html','Pavlova'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']],
  'cake-citron-moelleux-facile-rapide': [['/recettes/pavlova-fruits-rouges-meringue.html','Pavlova'],['/recettes/tiramisu-recette-italienne-originale.html','Tiramisu'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']],
  'daurade-royale-four-citron-fenouil': [['/recettes/saumon-gravlax-maison-aneth-citron.html','Saumon gravlax'],['/recettes/gratin-dauphinois-cremeux-facile.html','Gratin dauphinois'],['/outils/convertisseur-portions-moules.html','Convertisseur de portions']]
};

const data = JSON.parse(fs.readFileSync('recettes.json','utf8'));
if (!fs.existsSync('scripts/recettes-archive-2026-09-20.json')) fs.writeFileSync('scripts/recettes-archive-2026-09-20.json', JSON.stringify(data,null,2)+'\n');
const bySlug = new Map(data.recettes.map(r => [r.slug,r]));
const curated = selected.map(slug => bySlug.get(slug)).filter(Boolean).map(r => ({...r,...(editorialUpdates[r.slug]?.data||{}),editorial_status:'sélection éditoriale',date_reviewed:DATE}));
if (curated.length !== selected.length) throw new Error(`Recettes sélectionnées manquantes : ${selected.filter(s=>!bySlug.has(s)).join(', ')}`);
fs.writeFileSync('recettes.json', JSON.stringify({recettes:curated},null,2)+'\n');

for (const name of fs.readdirSync('recettes').filter(f=>f.endsWith('.html'))) {
  const slug=name.slice(0,-5), file=`recettes/${name}`;
  let html=fs.readFileSync(file,'utf8');
  if (!active.has(slug)) {
    if (/name=['"]robots['"]/.test(html)) {
      html=html.replace(/<meta name=['"]robots['"][^>]*>/i,'<meta name="robots" content="noindex, follow">');
    } else {
      html=html.replace(/(<meta name=['"]viewport['"][^>]*>)/i,'$1\n<meta name="robots" content="noindex, follow">');
    }
    fs.writeFileSync(file,html); continue;
  }
  html=html.replace(/\s*<meta name=['"]robots['"][^>]*>/i,'');
  for (const [from,to] of (editorialUpdates[slug]?.replacements||[])) html=html.split(from).join(to);
  if (!html.includes('/assets/quality-core.css')) html=html.replace(/<\/head>/i,'  <link rel="stylesheet" href="/assets/quality-core.css">\n</head>');
  html=html.replace(/<nav>[\s\S]*?<\/nav>/i,"<nav><a href='/'>Accueil</a><a href='/toutes-les-recettes.html'>Recettes sélectionnées</a><a href='/guides.html'>Guides</a><a href='/outils.html'>Outils</a></nav>");
  html=html.replace(/<p class=['"]editorial-byline['"][^>]*>[\s\S]*?<\/p>/i,'');
  html=html.replace(/(<h1>[\s\S]*?<\/h1>)/i,'$1\n<p class="editorial-byline">Sélection éditoriale · vérifiée et mise à jour le 20 septembre 2026</p>');
  html=html.replace(/<section class="editorial-dossier"[\s\S]*?<\/section>/i,'');
  html=html.replace(/<h2>Ingr[eé]dients<\/h2>/i,(dossiers[slug]||'')+'\n<h2>Ingrédients</h2>');
  html=html.replace(/<h2>Preparation<\/h2>/i,'<h2>Préparation</h2>').replace(/Questions frequentes/g,'Questions fréquentes');
  const links=(related[slug]||[]).map(([url,label])=>`<li><a href="${url}">${label}</a></li>`).join('');
  const section=`<section class="related-recipes"><h2>Pour aller plus loin</h2><ul>${links}</ul></section>`;
  if (/<section class=['"]related-recipes['"]>[\s\S]*?<\/section>/i.test(html)) html=html.replace(/<section class=['"]related-recipes['"]>[\s\S]*?<\/section>/gi,(m,offset)=>offset===html.search(/<section class=['"]related-recipes['"]/i)?section:'');
  else html=html.replace(/<div class=['"]faq-section['"]>/i,section+'\n<div class="faq-section">');
  html=html.replace(/<p>2025 La Table Mijote<\/p>/g,'<p>2026 La Table Mijote</p>');
  html=html.replace(/(<script[^>]*application\/ld\+json[^>]*>)([\s\S]*?)(<\/script>)/g,(_,a,raw,z)=>{try{const json=JSON.parse(raw),nodes=json['@graph']||[json],recipe=nodes.find(n=>n['@type']==='Recipe');if(recipe){recipe.dateModified=DATE;recipe.author={"@type":"Organization","name":"La Table Mijote","url":"https://latablemijote.fr/a-propos.html"};if(editorialUpdates[slug]?.data?.title)recipe.name=editorialUpdates[slug].data.title;if(editorialUpdates[slug]?.data?.meta_description)recipe.description=editorialUpdates[slug].data.meta_description;}return a+JSON.stringify(json)+z;}catch{return a+raw+z;}});
  fs.writeFileSync(file,html);
}

function card(r){return `<article class="recipe-card"><a class="recipe-link" href="${r.url}"><div class="recipe-content"><div class="recipe-category">${r.category}</div><h2 class="recipe-title">${r.title}</h2><p class="recipe-description">${r.meta_description}</p><div class="recipe-meta"><span>Préparation : ${r.prep_time}</span><span>Cuisson : ${r.cook_time}</span>${r.rest_time?`<span>Repos : ${r.rest_time}</span>`:''}<span>${r.servings} pers.</span></div></div></a></article>`}
let listing=fs.readFileSync('toutes-les-recettes.html','utf8');
const itemList={"@context":"https://schema.org","@type":"ItemList","name":"Recettes sélectionnées de La Table Mijote","url":"https://latablemijote.fr/toutes-les-recettes.html","numberOfItems":curated.length,"itemListElement":curated.map((r,i)=>({"@type":"ListItem","position":i+1,"name":r.title,"url":`https://latablemijote.fr/${r.url}`}))};
const hubs=`<section class="category-hubs" aria-label="Explorer la sélection de recettes">
      <article class="category-hub" id="desserts"><h2>Desserts et pâtisserie</h2><p>Quatre desserts approfondis avec des repères de texture et de conservation.</p><ul><li><a href="recettes/baba-au-rhum-recette-traditionnelle.html">Baba au rhum</a></li><li><a href="recettes/pavlova-fruits-rouges-meringue.html">Pavlova aux fruits rouges</a></li><li><a href="recettes/tiramisu-recette-italienne-originale.html">Tiramisu au café</a></li><li><a href="recettes/cake-citron-moelleux-facile-rapide.html">Cake au citron</a></li></ul></article>
      <article class="category-hub" id="plats-sales"><h2>Plats salés</h2><p>Des classiques expliqués avec les signes de cuisson à observer.</p><ul><li><a href="recettes/quiche-lorraine-recette-authentique.html">Quiche lorraine</a></li><li><a href="recettes/boeuf-bourguignon-recette-traditionnelle.html">Bœuf bourguignon</a></li><li><a href="recettes/gratin-dauphinois-cremeux-facile.html">Gratin dauphinois</a></li><li><a href="recettes/oeufs-cocotte-creme-fraiche-facile.html">Œufs cocotte</a></li></ul></article>
      <article class="category-hub" id="poisson"><h2>Poisson</h2><p>Deux méthodes avec des repères précis de sécurité et de cuisson.</p><ul><li><a href="recettes/daurade-royale-four-citron-fenouil.html">Daurade royale au four</a></li><li><a href="recettes/saumon-gravlax-maison-aneth-citron.html">Saumon gravlax</a></li></ul></article>
      <article class="category-hub" id="salades"><h2>Recettes rapides</h2><p>Deux bases polyvalentes pour les repas du quotidien.</p><ul><li><a href="recettes/salade-caesar-poulet-grille-maison.html">Salade César au poulet</a></li><li><a href="recettes/pate-a-crepes-recette-de-base.html">Pâte à crêpes</a></li></ul></article>
    </section>`;
listing=listing.replace(/<title>[\s\S]*?<\/title>/i,'<title>12 recettes sélectionnées et approfondies | La Table Mijote</title>')
  .replace(/<meta name="description"[^>]*>/i,'<meta name="description" content="Une sélection resserrée de recettes françaises enrichies avec proportions, erreurs fréquentes et repères pratiques.">')
  .replace(/<script id="recipe-itemlist"[^>]*>[\s\S]*?<\/script>/i,`<script id="recipe-itemlist" type="application/ld+json">${JSON.stringify(itemList)}</script>`)
  .replace(/<h1 class="page-title">[\s\S]*?<\/h1>/i,'<h1 class="page-title">12 recettes sélectionnées</h1>')
  .replace(/<p class="page-description">[\s\S]*?<\/p>/i,'<p class="page-description">Une sélection resserrée de recettes approfondies avec proportions, erreurs fréquentes et repères de cuisson. Utilisez la recherche et les filtres pour trouver la bonne préparation.</p>')
  .replace(/<span class="total-number" id="total-number">[^<]*<\/span>/i,`<span class="total-number" id="total-number">${curated.length}</span>`)
  .replace(/<section class="category-hubs"[\s\S]*?<\/section>/i,hubs)
  .replace(/60 recettes affichées/g,'12 recettes sélectionnées')
  .replace(/<!-- STATIC_RECIPE_LINKS_START -->[\s\S]*?<!-- STATIC_RECIPE_LINKS_END -->/,'<!-- STATIC_RECIPE_LINKS_START -->\n'+curated.map(card).join('\n')+'\n<!-- STATIC_RECIPE_LINKS_END -->');
listing=listing.replace(/<a href="index\.html#decouvrir">À découvrir<\/a><\/nav>/g,'<a href="index.html#decouvrir">À découvrir</a><a href="guides.html">Guides</a><a href="outils.html">Outils</a></nav>');
listing=listing.replace(/>Toutes les recettes</g,'>Recettes sélectionnées<');
listing=listing.replace(/<a href="guides\.html">Guides[^<]*<\/a>(?:<a href="outils\.html">Outils<\/a>)*/g,'<a href="guides.html">Guides</a><a href="outils.html">Outils</a>');
fs.writeFileSync('toutes-les-recettes.html',listing);

let home=fs.readFileSync('index.html','utf8');
home=home.replace(/<a href="guides\.html">\s*Guides[^<]*<\/a>(?:<a href="outils\.html">Outils<\/a>)*/g,'<a href="guides.html">Guides</a><a href="outils.html">Outils</a>');
home=home.replace(/La Table Mijote : des recettes simples, gourmandes et accessibles, avec une nouvelle idée à cuisiner chaque jour\./g,'La Table Mijote : une sélection de recettes approfondies, de guides culinaires et de calculateurs pratiques.');
home=home.replace(/Une nouvelle recette chaque jour/g,'Une sélection éditoriale approfondie').replace(/Une nouvelle recette publiée chaque jour/g,'Recettes, guides et outils pratiques');
home=home.replace(/>Toutes les recettes</g,'>Recettes sélectionnées<');
home=home.replace(/<a href="toutes-les-recettes\.html#soupes"[\s\S]*?<\/a>/i,'<a href="guides.html" class="category-feature-card"><span>Guides pratiques</span></a>');
home=home.replace(/<a href="toutes-les-recettes\.html#quotidien"[\s\S]*?<\/a>/i,'<a href="outils.html" class="category-feature-card"><span>Calculateurs culinaires</span></a>');
if (!home.includes('id="outils-pratiques-title"')) home=home.replace(/(<section class="category-shortcuts" aria-labelledby="guides-populaires-title">[\s\S]*?<\/section>)/,`$1\n<section class="category-shortcuts" aria-labelledby="outils-pratiques-title"><p class="category-shortcuts-title" id="outils-pratiques-title">Calculateurs pratiques</p><div class="category-shortcuts-links"><a href="outils/calculateur-migaine.html">Adapter une migaine</a><a href="outils/calculateur-sirop-baba.html">Calculer un sirop de baba</a><a href="outils/convertisseur-portions-moules.html">Convertir portions et moules</a></div></section>`);
fs.writeFileSync('index.html',home);

let guides=fs.readFileSync('guides.html','utf8');
guides=guides.replace(/<a href="guides\.html" aria-current="page">Guides & astuces<\/a>(?:<a href="outils\.html">Outils<\/a>)*/,'<a href="guides.html" aria-current="page">Guides & astuces</a><a href="outils.html">Outils</a>');
guides=guides.replace(/<a class="card" href="recettes\/creme-caramel-renversee-classique\.html">[\s\S]*?<\/a>/,'<a class="card" href="outils/calculateur-migaine.html"><small>Outil interactif</small><h3>Calculateur de migaine</h3><p>Adaptez automatiquement les œufs, la crème et le lait au diamètre du moule.</p></a>');
guides=guides.replace(/<a class="card" href="recettes\/pain-perdu-brioche-recette-facile\.html">[\s\S]*?<\/a>/,'<a class="card" href="outils/convertisseur-portions-moules.html"><small>Outil interactif</small><h3>Convertisseur de portions</h3><p>Calculez un coefficient fiable pour les quantités et les moules ronds.</p></a>');
if (!guides.includes('calculateur-sirop-baba.html')) guides=guides.replace('</div></section>','<a class="card" href="outils/calculateur-sirop-baba.html"><small>Outil interactif</small><h3>Calculateur de sirop pour baba</h3><p>Adaptez eau, sucre et rhum au nombre de babas.</p></a></div></section>');
fs.writeFileSync('guides.html',guides);

const urls=[
  ['/',1.0],['/toutes-les-recettes.html',.9],['/guides.html',.9],['/outils.html',.9],
  ['/a-propos.html',.5],['/charte-editoriale.html',.5],['/contact.html',.4],['/confidentialite.html',.3],['/mentions-legales.html',.3],
  ['/guides/migaine-pour-quiche-proportions.html',.9],['/guides/pate-brisee-maison-pour-quiche.html',.8],['/guides/sirop-baba-au-rhum-dosage.html',.9],
  ['/outils/calculateur-migaine.html',.9],['/outils/calculateur-sirop-baba.html',.9],['/outils/convertisseur-portions-moules.html',.9],
  ...selected.map(s=>[`/recettes/${s}.html`,.8])
];
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([path,p])=>`  <url><loc>https://latablemijote.fr${path}</loc><lastmod>${DATE}</lastmod><changefreq>monthly</changefreq><priority>${p.toFixed(1)}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync('sitemap.xml',sitemap);
console.log(`Noyau qualité construit : ${curated.length} recettes, 3 guides et 3 outils.`);
