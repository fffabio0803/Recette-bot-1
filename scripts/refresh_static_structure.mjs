import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataPath = path.join(root, "recettes.json");
const listingPath = path.join(root, "toutes-les-recettes.html");
const sitemapPath = path.join(root, "sitemap.xml");

const aliases = new Map([
  ["Gateaux", "Gâteaux"],
  ["Pates", "Pâtes"],
  ["Entrees", "Entrées"],
  ["Oeufs", "Œufs"],
  ["Crepes", "Crêpes"],
  ["Vegetarien", "Végétarien"],
  ["Petit-dejeuner", "Petit-déjeuner"],
  ["Accompagnement", "Accompagnements"],
]);

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
for (const recipe of data.recettes) {
  recipe.category = aliases.get(recipe.category) ?? recipe.category;
}
fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);

const cards = data.recettes.map((recipe) => `
<article class="recipe-card">
  <a class="recipe-link" href="${escapeHtml(recipe.url)}">
    <div class="recipe-content">
      <div class="recipe-category">${escapeHtml(recipe.category)}</div>
      <h2 class="recipe-title">${escapeHtml(recipe.title)}</h2>
      <p class="recipe-description">${escapeHtml(recipe.meta_description)}</p>
      <div class="recipe-meta"><span>Préparation : ${escapeHtml(recipe.prep_time)}</span><span>Temps principal : ${escapeHtml(recipe.cook_time)}</span><span>${escapeHtml(recipe.servings)} pers.</span></div>
    </div>
  </a>
</article>`).join("");

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Recettes de La Table Mijote",
  url: "https://latablemijote.fr/toutes-les-recettes.html",
  numberOfItems: data.recettes.length,
  itemListElement: data.recettes.map((recipe, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: recipe.title,
    url: `https://latablemijote.fr/${recipe.url}`,
  })),
};
const itemListTag = `<script id="recipe-itemlist" type="application/ld+json">${JSON.stringify(itemListSchema)}</script>`;

let listing = fs.readFileSync(listingPath, "utf8");
listing = listing.replace(
  /<!-- STATIC_RECIPE_LINKS_START -->[\s\S]*?<!-- STATIC_RECIPE_LINKS_END -->/,
  `<!-- STATIC_RECIPE_LINKS_START -->${cards}\n<!-- STATIC_RECIPE_LINKS_END -->`,
);
listing = listing.replace(
  /<span class="total-number" id="total-number">[^<]*<\/span>/,
  `<span class="total-number" id="total-number">${data.recettes.length}</span>`,
);
if (/<script id=["']recipe-itemlist["'][\s\S]*?<\/script>/i.test(listing)) {
  listing = listing.replace(/<script id=["']recipe-itemlist["'][\s\S]*?<\/script>/i, itemListTag);
} else {
  listing = listing.replace("</head>", `${itemListTag}\n</head>`);
}
fs.writeFileSync(listingPath, listing);

const recipesBySlug = new Map(data.recettes.map((recipe) => [
  path.basename(recipe.url, ".html"),
  recipe,
]));

const relatedSection = (slug) => {
  const current = recipesBySlug.get(slug);
  if (!current) return "";
  const related = data.recettes
    .filter((recipe) => recipe.category === current.category && path.basename(recipe.url, ".html") !== slug)
    .slice(0, 3);
  if (!related.length) return "";
  const links = related.map((recipe) =>
    `<li><a href="https://latablemijote.fr/${escapeHtml(recipe.url)}">${escapeHtml(recipe.title)}</a></li>`
  ).join("");
  return `<section class="related-recipes"><h2>À découvrir aussi</h2><ul>${links}</ul></section>`;
};

for (const filename of fs.readdirSync(path.join(root, "recettes"))) {
  if (!filename.endsWith(".html")) continue;
  const recipePath = path.join(root, "recettes", filename);
  let html = fs.readFileSync(recipePath, "utf8");
  html = html.replaceAll(
    "https://fffabio0803.github.io/recettes-maison",
    "https://latablemijote.fr",
  );
  html = html.replaceAll(
    "https://fffabio0803.github.io/Recette-bot-1",
    "https://latablemijote.fr",
  );
  html = html.replaceAll("Recettes Maison", "La Table Mijote");
  html = html.replace(/<div class=['"]ad-box['"]>\s*\[ Google AdSense 728x90 \]\s*<\/div>/g, "");
  const slug = path.basename(filename, ".html");
  const related = relatedSection(slug);
  if (related) {
    if (/<section class=['"]related-recipes['"]>[\s\S]*?<\/section>/i.test(html)) {
      html = html.replace(/<section class=['"]related-recipes['"]>[\s\S]*?<\/section>/i, related);
    } else {
      html = html.replace(/(<div class=['"]faq-section['"]>)/i, `${related}\n$1`);
    }
    if (!html.includes(".related-recipes ul{")) {
      html = html.replace("</style>", ".related-recipes ul{display:grid;gap:10px;list-style:none}.related-recipes a{color:var(--terracotta);font-weight:500;text-decoration:none}.related-recipes a:hover{text-decoration:underline}\n</style>");
    }
  }
  if (!html.includes("/charte-editoriale.html")) {
    html = html.replace(
      /(<a href=["']https:\/\/latablemijote\.fr\/a-propos\.html["'][^>]*>À propos<\/a>)/i,
      `$1 · <a href="https://latablemijote.fr/charte-editoriale.html" style="color:#ccc">Charte éditoriale</a>`,
    );
  }
  if (!html.includes("/a-propos.html")) {
    html = html.replace(
      "</footer>",
      `<p><a href="https://latablemijote.fr/a-propos.html" style="color:#ccc">À propos</a> · <a href="https://latablemijote.fr/contact.html" style="color:#ccc">Contact</a> · <a href="https://latablemijote.fr/confidentialite.html" style="color:#ccc">Confidentialité</a> · <a href="https://latablemijote.fr/mentions-legales.html" style="color:#ccc">Mentions légales</a></p></footer>`,
    );
  }
  fs.writeFileSync(recipePath, html);
}

const trustPages = [
  "a-propos.html",
  "charte-editoriale.html",
  "contact.html",
  "confidentialite.html",
  "mentions-legales.html",
];
let sitemap = fs.readFileSync(sitemapPath, "utf8");
const additions = trustPages
  .filter((page) => !sitemap.includes(`/${page}</loc>`))
  .map((page) => `  <url>\n    <loc>https://latablemijote.fr/${page}</loc>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>\n`)
  .join("");
sitemap = sitemap.replace("</urlset>", `${additions}</urlset>`);
fs.writeFileSync(sitemapPath, sitemap);
