import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://latablemijote.fr';

const pilots = {
  'saumon-gravlax-maison-aneth-citron': {
    prep: '20 min', secondaryLabel: 'Marinade', secondary: '24 à 48 h',
    related: ['rillettes-de-saumon-fume-maison', 'moules-marinieres-vin-blanc-facile', 'daurade-royale-four-citron-fenouil'],
  },
  'carbonara-authentique-recette-romaine': {
    prep: '10 min', secondaryLabel: 'Cuisson', secondary: '20 min',
    related: ['gnocchis-pommes-de-terre-maison', 'osso-buco-milanaise-recette-italienne', 'tiramisu-recette-italienne-originale'],
  },
  'gaspacho-andalou-recette-fraiche': {
    prep: '15 min', secondaryLabel: 'Repos au frais', secondary: '2 h',
    related: ['soupe-de-tomates-fraiches-basilic', 'salade-nicoise-traditionnelle-recette', 'taboul-maison-menthe-citron'],
  },
  'tarte-tatin-pommes-caramel-facile': {
    prep: '35 min', secondaryLabel: 'Cuisson', secondary: '25 min',
    related: ['tarte-au-citron-meringuee-facile', 'clafoutis-cerises-recette-classique', 'creme-brulee-recette-facile-maison'],
  },
  'poulet-roti-herbes-de-provence-facile': {
    prep: '15 min', secondaryLabel: 'Cuisson', secondary: '45 min',
    related: ['poulet-basquaise-tomates-poivrons', 'tajine-de-poulet-citron-confit-olives', 'ratatouille-provencale-recette-simple'],
  },
  'boeuf-bourguignon-recette-traditionnelle': {
    prep: '30 min', secondaryLabel: 'Cuisson', secondary: '4 h',
    related: ['blanquette-de-veau-classique', 'pot-au-feu-recette-traditionnelle', 'osso-buco-milanaise-recette-italienne'],
  },
};

const decode = (value) => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ').trim();

const iso = (value) => {
  const h = value.match(/(\d+)\s*h/i)?.[1];
  const m = value.match(/(\d+)\s*min/i)?.[1];
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}` || 'PT0M';
};

const titleFor = (slug) => {
  const file = path.join('recettes', `${slug}.html`);
  if (!fs.existsSync(file)) return slug.replaceAll('-', ' ');
  const html = fs.readFileSync(file, 'utf8');
  return decode(html.match(/<h1>([\s\S]*?)<\/h1>/i)?.[1] || slug.replaceAll('-', ' '));
};

for (const [slug, config] of Object.entries(pilots)) {
  const file = path.join('recettes', `${slug}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const canonical = `${SITE}/recettes/${slug}.html`;
  const image = `${SITE}/assets/images/recettes/${slug}.jpg`;
  const title = decode(html.match(/<h1>([\s\S]*?)<\/h1>/i)?.[1] || 'Recette maison');
  const description = decode(html.match(/<meta name=['"]description['"] content=['"]([^'"]*)['"]/i)?.[1] || 'Recette maison détaillée pas à pas.');
  const category = decode(html.match(/<span class=['"]cat-tag['"]>(.*?)<\/span>/i)?.[1] || 'Cuisine maison');
  const servings = html.match(/Portions\s*:\s*<strong>(\d+)/i)?.[1] || '4';
  const ingredients = [...html.matchAll(/<li><span class=['"]ing-amount['"]>([\s\S]*?)<\/span>\s*([\s\S]*?)<\/li>/gi)]
    .map((match) => decode(`${match[1]} ${match[2]}`));
  const steps = [...html.matchAll(/<div class=['"]step['"]>[\s\S]*?<div class=['"]step-num['"]>(.*?)<\/div>[\s\S]*?<div class=['"]step-body['"]><strong>([\s\S]*?)<\/strong><p>([\s\S]*?)<\/p>/gi)]
    .map((match, index) => ({'@type': 'HowToStep', position: index + 1, name: decode(match[2]), text: decode(match[3])}));
  const recipe = {
    '@type': 'Recipe', '@id': `${canonical}#recipe`, mainEntityOfPage: {'@type': 'WebPage', '@id': canonical},
    name: title, description, image: [image], author: {'@type': 'Organization', name: 'La Table Mijote', url: `${SITE}/`},
    publisher: {'@type': 'Organization', name: 'La Table Mijote', url: `${SITE}/`}, prepTime: iso(config.prep),
    recipeYield: `${servings} portions`, recipeCategory: category, recipeCuisine: 'Cuisine maison',
    recipeIngredient: ingredients, recipeInstructions: steps, url: canonical, inLanguage: 'fr-FR',
  };
  if (config.secondaryLabel === 'Cuisson') recipe.cookTime = iso(config.secondary);
  const schema = JSON.stringify({'@context': 'https://schema.org', '@graph': [recipe]});
  const schemaTag = `<script type='application/ld+json'>${schema}</script>`;
  if (/<script type=['"]application\/ld\+json['"]>[\s\S]*?<\/script>/i.test(html)) {
    html = html.replace(/<script type=['"]application\/ld\+json['"]>[\s\S]*?<\/script>/i, schemaTag);
  } else {
    html = html.replace(/(<link rel=['"]canonical['"][^>]*>)/i, `$1\n${schemaTag}`);
  }
  if (!html.includes("property='og:image'")) {
    html = html.replace(schemaTag, `<meta property='og:type' content='article'>\n<meta property='og:image' content='${image}'>\n<meta name='twitter:card' content='summary_large_image'>\n${schemaTag}`);
  }
  const hero = `<figure class='recipe-hero'><img src='${image}' alt='Illustration de ${title.replaceAll("'", '&#39;')}' width='1672' height='941'><figcaption>Illustration culinaire générée pour cette recette.</figcaption></figure>`;
  if (!html.includes("class='recipe-hero'")) html = html.replace(/(<div class=['"]recipe-bar['"]>[\s\S]*?<\/div>)/i, `$1\n${hero}`);
  html = html.replace(/<div class=['"]recipe-bar['"]>[\s\S]*?<\/div>/i, (bar) => {
    let updated = bar.replace(/(?:Prep|Préparation)\s*:\s*<strong>.*?<\/strong>/i, `Préparation : <strong>${config.prep}</strong>`);
    updated = updated.replace(/Cuisson\s*:\s*<strong>.*?<\/strong>/i, `${config.secondaryLabel} : <strong>${config.secondary}</strong>`);
    return updated;
  });
  const links = config.related.map((related) => `<li><a href='${SITE}/recettes/${related}.html'>${titleFor(related)}</a></li>`).join('');
  const related = `<section class='related-recipes'><h2>À découvrir aussi</h2><ul>${links}</ul></section>`;
  if (!html.includes("class='related-recipes'")) html = html.replace(/(<div class=['"]faq-section['"]>)/i, `${related}\n$1`);
  if (!html.includes('.recipe-hero{')) {
    html = html.replace('</style>', `.recipe-hero{margin:0 0 24px}.recipe-hero img{display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border:1px solid var(--rule)}.recipe-hero figcaption{font-size:11px;color:var(--mid);margin-top:7px}.related-recipes ul{display:grid;gap:10px;list-style:none}.related-recipes a{color:var(--terracotta);font-weight:500;text-decoration:none}.related-recipes a:hover{text-decoration:underline}\n</style>`);
  }
  fs.writeFileSync(file, html);
}

console.log(`Recettes pilotes enrichies : ${Object.keys(pilots).length}`);
