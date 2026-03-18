#!/usr/bin/env python3
"""
generate_recipe.py
Génère une recette SEO complète via Claude API et la publie sur GitHub Pages.
"""

import anthropic
import json
import os
import re
from datetime import datetime
from pathlib import Path

SITE_URL = os.environ.get("SITE_URL", "https://TON-USERNAME.github.io/recettes-maison")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# 60 recettes en rotation — toutes des requêtes à fort volume SEO en français
RECIPES = [
    ("poulet rôti herbes de provence facile", "Volaille", "🍗", "45 min", "15 min", 4),
    ("carbonara authentique recette romaine", "Pâtes", "🍝", "20 min", "10 min", 2),
    ("tarte tatin pommes caramel facile", "Desserts", "🍰", "25 min", "35 min", 6),
    ("boeuf bourguignon recette traditionnelle", "Viande", "🥩", "4h", "30 min", 6),
    ("risotto champignons crémeux facile", "Végétarien", "🍄", "25 min", "10 min", 4),
    ("soupe à l'oignon gratinée parisienne", "Soupes", "🧅", "45 min", "15 min", 4),
    ("salade niçoise traditionnelle recette", "Salades", "🥗", "0 min", "20 min", 4),
    ("blanquette de veau classique", "Viande", "🥩", "1h30", "30 min", 6),
    ("crème brûlée recette facile maison", "Desserts", "🍮", "30 min", "15 min", 4),
    ("quiche lorraine recette authentique", "Tartes", "🥧", "35 min", "20 min", 6),
    ("ratatouille provençale recette simple", "Végétarien", "🍆", "1h", "20 min", 6),
    ("mousse au chocolat légère rapide", "Desserts", "🍫", "2h frigo", "15 min", 6),
    ("gratin dauphinois crémeux facile", "Accompagnement", "🥔", "1h", "15 min", 6),
    ("bouillabaisse marseillaise recette", "Poisson", "🐟", "1h30", "30 min", 6),
    ("tarte au citron meringuée facile", "Desserts", "🍋", "25 min", "30 min", 8),
    ("pot-au-feu recette traditionnelle", "Viande", "🥩", "3h", "30 min", 8),
    ("omelette parfaite technique française", "Oeufs", "🍳", "5 min", "3 min", 2),
    ("financiers amandes moelleux recette", "Gâteaux", "🧁", "15 min", "12 min", 12),
    ("soupe de tomates fraîches basilic", "Soupes", "🍅", "20 min", "10 min", 4),
    ("pâte à crêpes recette de base", "Crêpes", "🥞", "1h repos", "15 min", 4),
    ("magret de canard sauce miel soja", "Volaille", "🦆", "15 min", "10 min", 2),
    ("clafoutis cerises recette classique", "Desserts", "🍒", "35 min", "10 min", 6),
    ("vichyssoise froide poireaux pommes de terre", "Soupes", "🥣", "2h frigo", "20 min", 6),
    ("croque-monsieur béchamel maison", "Sandwichs", "🥪", "15 min", "10 min", 2),
    ("taboulé maison menthe citron", "Salades", "🫙", "1h frigo", "20 min", 4),
    ("tiramisu recette italienne originale", "Desserts", "☕", "4h frigo", "20 min", 6),
    ("moules marinières vin blanc facile", "Poisson", "🦪", "20 min", "10 min", 4),
    ("tarte flambée alsacienne recette", "Tartes", "🧅", "20 min", "15 min", 4),
    ("fondant chocolat coulant moelleux", "Desserts", "🍫", "12 min", "10 min", 4),
    ("osso buco milanaise recette italienne", "Viande", "🍖", "1h30", "20 min", 4),
    ("velouté butternut courge gingembre", "Soupes", "🎃", "30 min", "10 min", 4),
    ("cake citron moelleux facile rapide", "Gâteaux", "🍋", "40 min", "10 min", 8),
    ("rillettes de saumon fumé maison", "Entrées", "🐟", "1h frigo", "10 min", 6),
    ("pissaladière niçoise oignons anchois", "Tartes", "🧅", "45 min", "20 min", 6),
    ("far breton pruneaux recette bretonne", "Desserts", "🍮", "45 min", "10 min", 8),
    ("gnocchis pommes de terre maison", "Pâtes", "🥔", "30 min", "30 min", 4),
    ("pavlova fruits rouges meringue", "Desserts", "🍓", "1h30", "20 min", 8),
    ("tajine poulet citron confit olives", "Plats du monde", "🫙", "1h30", "20 min", 4),
    ("gaspacho andalou recette fraîche", "Soupes", "🍅", "2h frigo", "15 min", 6),
    ("choux à la crème pâte choux facile", "Desserts", "🌪", "40 min", "20 min", 12),
    ("saumon gravlax maison aneth citron", "Poisson", "🐟", "48h", "20 min", 8),
    ("tartiflette reblochon pommes de terre", "Plats", "🥔", "50 min", "15 min", 4),
    ("panna cotta vanille coulis fruits", "Desserts", "🍮", "3h frigo", "10 min", 4),
    ("poulet basquaise tomates poivrons", "Volaille", "🍗", "1h", "20 min", 4),
    ("salade de lentilles vinaigrette moutarde", "Salades", "🫘", "30 min", "10 min", 4),
    ("madeleine recette classique bosse", "Gâteaux", "🧁", "1h repos", "12 min", 16),
    ("tortilla espagnole pommes de terre oignon", "Oeufs", "🍳", "30 min", "15 min", 4),
    ("baba au rhum recette traditionnelle", "Desserts", "🍰", "45 min", "20 min", 6),
    ("brandade de morue maison recette", "Poisson", "🐟", "30 min", "20 min", 6),
    ("œufs cocotte crème fraîche facile", "Oeufs", "🥚", "15 min", "5 min", 2),
    ("sorbet mangue citron vert recette", "Desserts", "🥭", "4h congélateur", "10 min", 6),
    ("rôti de porc moutarde miel recette", "Viande", "🥩", "1h", "10 min", 6),
    ("crème caramel renversée classique", "Desserts", "🍮", "45 min", "15 min", 6),
    ("fraisier recette pâtisserie maison", "Desserts", "🍓", "3h", "45 min", 8),
    ("daurade royale four citron fenouil", "Poisson", "🐟", "25 min", "10 min", 2),
    ("île flottante œufs neige crème anglaise", "Desserts", "🍮", "30 min", "20 min", 4),
    ("salade caesar poulet grillé maison", "Salades", "🥗", "0 min", "20 min", 2),
    ("pain perdu brioche recette facile", "Petit-déjeuner", "🍞", "10 min", "5 min", 2),
    ("coq au vin rouge champignons lardons", "Volaille", "🍗", "2h", "30 min", 6),
    ("terrine de campagne recette maison", "Entrées", "🫙", "24h", "30 min", 10),
]


def generate_recipe(recipe_data):
    topic, category, emoji, cook_time, prep_time, servings = recipe_data
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    slug = re.sub(r'[^a-z0-9]+', '-', topic.lower()).strip('-')[:60]

    prompt = f"""Génère une recette complète pour : "{topic}"

Réponds UNIQUEMENT avec ce JSON valide :
{{
  "title": "Titre recette SEO 55-65 caractères avec le mot-clé",
  "meta_description": "Description meta 145-155 caractères naturelle et appétissante",
  "intro": "Introduction 100 mots qui donne envie de cuisiner, histoire du plat ou conseil",
  "ingredients": [
    {{"amount": "200", "unit": "g", "name": "ingrédient principal"}},
    {{"amount": "2", "unit": "", "name": "oeufs"}},
    {{"amount": "1", "unit": "c.à.s", "name": "huile d'olive"}}
  ],
  "steps": [
    {{"num": 1, "title": "Titre de l'étape", "text": "Instruction détaillée et précise de 40-60 mots"}},
    {{"num": 2, "title": "Titre étape 2", "text": "Instruction 40-60 mots"}}
  ],
  "tips": ["Conseil pratique 1", "Conseil pratique 2", "Conseil variation ou substitution"],
  "faq": [
    {{"q": "Peut-on préparer ce plat à l'avance ?", "a": "Réponse pratique 40 mots"}},
    {{"q": "Comment conserver les restes ?", "a": "Réponse pratique 40 mots"}},
    {{"q": "Quelle variante peut-on faire ?", "a": "Réponse créative 40 mots"}}
  ]
}}

Exigences : 8-10 ingrédients, 5-7 étapes, instructions très précises et reproductibles, français naturel."""

    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
        system="Tu es chef cuisinier expert. Réponds UNIQUEMENT en JSON valide, aucun autre texte."
    )

    raw = msg.content[0].text.strip()
    raw = re.sub(r'^```json\s*|\s*```$', '', raw).strip()
    data = json.loads(raw)

    data.update({
        "slug": slug,
        "category": category,
        "emoji": emoji,
        "cook_time": cook_time,
        "prep_time": prep_time,
        "servings": servings,
        "topic": topic,
        "date_iso": datetime.now().strftime("%Y-%m-%d"),
        "date_display": datetime.now().strftime("%-d %B %Y"),
    })
    return data


def render_recipe_html(r):
    ingredients_html = "".join(
        f'<li><span class="ing-amount">{i["amount"]} {i["unit"]}</span> {i["name"]}</li>'
        for i in r["ingredients"]
    )
    steps_html = "".join(
        f'''<div class="step">
          <div class="step-num">{s["num"]}</div>
          <div class="step-body"><strong>{s["title"]}</strong><p>{s["text"]}</p></div>
        </div>'''
        for s in r["steps"]
    )
    tips_html = "".join(f"<li>{t}</li>" for t in r["tips"])
    faq_html = "".join(
        f'''<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <h3 itemprop="name">{f["q"]}</h3>
          <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <p itemprop="text">{f["a"]}</p>
          </div>
        </div>'''
        for f in r.get("faq", [])
    )

    schema = json.dumps({
        "@context": "https://schema.org/",
        "@type": "Recipe",
        "name": r["title"],
        "description": r["meta_description"],
        "datePublished": r["date_iso"],
        "recipeCategory": r["category"],
        "recipeCuisine": "Française",
        "recipeYield": f"{r['servings']} personnes",
        "prepTime": f"PT{r['prep_time'].replace(' min','M')}",
        "cookTime": f"PT{r['cook_time'].replace(' min','M').replace('h','H')}",
        "recipeIngredient": [f"{i['amount']} {i['unit']} {i['name']}" for i in r["ingredients"]],
        "recipeInstructions": [{"@type": "HowToStep", "text": s["text"]} for s in r["steps"]],
        "author": {"@type": "Organization", "name": "Recettes Maison"},
        "publisher": {"@type": "Organization", "name": "Recettes Maison"}
    }, ensure_ascii=False)

    faq_schema = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": f["q"],
             "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
            for f in r.get("faq", [])
        ]
    }, ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{r['meta_description']}">
<meta property="og:title" content="{r['title']} — Recettes Maison">
<meta property="og:description" content="{r['meta_description']}">
<meta property="og:type" content="article">
<title>{r['title']} — Recettes Maison</title>
<link rel="canonical" href="{SITE_URL}/recettes/{r['slug']}.html">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<script type="application/ld+json">{schema}</script>
<script type="application/ld+json">{faq_schema}</script>
<style>
:root{{--cream:#faf6f0;--warm:#f2ebe0;--ink:#1c1812;--terracotta:#c4622d;--sage:#7a8c6e;--rule:#e0d8cc;--mid:#9a8f82;}}
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:var(--cream);color:var(--ink);font-family:'Jost',sans-serif;font-weight:300;line-height:1.6;}}
.masthead{{border-bottom:2px solid var(--ink);text-align:center;padding:20px;}}
.site-name{{font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:700;text-decoration:none;color:var(--ink);}}
.site-name em{{color:var(--terracotta);}}
nav{{display:flex;justify-content:center;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-top:12px;flex-wrap:wrap;}}
nav a{{padding:8px 20px;font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:var(--ink);text-decoration:none;border-right:1px solid var(--rule);transition:all 0.2s;}}
nav a:first-child{{border-left:1px solid var(--rule);}}
nav a:hover{{background:var(--ink);color:var(--cream);}}
.container{{max-width:960px;margin:0 auto;padding:0 24px;}}
.layout{{display:grid;grid-template-columns:1fr 280px;gap:40px;padding:32px 0;}}
.breadcrumb{{font-size:11px;color:var(--mid);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;}}
.breadcrumb a{{color:var(--mid);text-decoration:none;}}
.cat-tag{{display:inline-block;background:var(--terracotta);color:#fff;font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;padding:3px 10px;margin-bottom:12px;}}
h1{{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,48px);font-weight:700;line-height:1.1;margin-bottom:16px;}}
.recipe-bar{{display:flex;gap:20px;flex-wrap:wrap;background:var(--warm);border:1px solid var(--rule);padding:16px 20px;margin:16px 0 24px;}}
.recipe-bar span{{font-size:12px;color:var(--mid);display:flex;align-items:center;gap:6px;}}
.recipe-bar strong{{color:var(--ink);font-weight:600;}}
.intro{{font-size:16px;line-height:1.8;color:#4a3f35;margin-bottom:28px;font-style:italic;border-left:3px solid var(--terracotta);padding-left:16px;}}
.ad-box{{background:var(--warm);border:1px dashed var(--rule);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--mid);letter-spacing:2px;text-transform:uppercase;margin:20px 0;}}
h2{{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;font-style:italic;margin:28px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--rule);}}
.ingredients-list{{list-style:none;}}
.ingredients-list li{{padding:10px 0;border-bottom:1px solid var(--rule);font-size:14px;display:flex;gap:8px;align-items:center;}}
.ingredients-list li::before{{content:'·';color:var(--terracotta);font-size:20px;}}
.ing-amount{{font-weight:600;min-width:80px;color:var(--terracotta);}}
.step{{display:grid;grid-template-columns:48px 1fr;gap:16px;margin-bottom:20px;}}
.step-num{{width:48px;height:48px;background:var(--terracotta);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:700;flex-shrink:0;}}
.step-body strong{{display:block;font-size:15px;font-weight:600;margin-bottom:6px;}}
.step-body p{{font-size:14px;line-height:1.7;color:#4a3f35;}}
.tips{{background:var(--warm);border-left:4px solid var(--sage);padding:20px 24px;margin:24px 0;}}
.tips h3{{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;margin-bottom:12px;}}
.tips ul{{list-style:none;}}
.tips li{{padding:6px 0;font-size:14px;color:#4a3f35;padding-left:16px;position:relative;}}
.tips li::before{{content:'✓';position:absolute;left:0;color:var(--sage);}}
.faq-section{{border-top:2px solid var(--ink);padding-top:24px;margin-top:28px;}}
.faq-item{{border-bottom:1px solid var(--rule);padding:16px 0;}}
.faq-item h3{{font-size:16px;font-weight:600;margin-bottom:8px;}}
.faq-item p{{font-size:14px;color:#6a5f55;line-height:1.7;}}
.widget{{background:var(--warm);padding:20px;margin-bottom:20px;border:1px solid var(--rule);}}
.widget h3{{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:700;font-style:italic;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--rule);}}
.widget ul{{list-style:none;}}
.widget li{{padding:7px 0;border-bottom:1px solid var(--rule);font-size:13px;}}
.widget li:last-child{{border-bottom:none;}}
.widget a{{text-decoration:none;color:var(--ink);}}
.widget a:hover{{color:var(--terracotta);}}
footer{{background:var(--ink);color:#888;padding:32px 48px;margin-top:48px;text-align:center;font-size:12px;}}
footer a{{color:#888;text-decoration:none;}}
@media(max-width:768px){{.layout{{grid-template-columns:1fr;}}.recipe-bar{{gap:12px;}}}}
</style>
</head>
<body>
<header class="masthead">
  <a href="{SITE_URL}" class="site-name">Recettes <em>Maison</em></a>
  <nav>
    <a href="{SITE_URL}/#rapides">Rapides</a>
    <a href="{SITE_URL}/#plats">Plats</a>
    <a href="{SITE_URL}/#desserts">Desserts</a>
    <a href="{SITE_URL}/#salades">Salades</a>
    <a href="{SITE_URL}/#soupes">Soupes</a>
  </nav>
</header>
<div class="container">
  <div class="layout">
    <main>
      <div class="breadcrumb">
        <a href="{SITE_URL}">Accueil</a> › <a href="#">{r['category']}</a> › {r['title'][:35]}...
      </div>
      <span class="cat-tag">{r['emoji']} {r['category']}</span>
      <h1>{r['title']}</h1>
      <div class="recipe-bar">
        <span>⏱ Préparation : <strong>{r['prep_time']}</strong></span>
        <span>🔥 Cuisson : <strong>{r['cook_time']}</strong></span>
        <span>👥 Portions : <strong>{r['servings']} personnes</strong></span>
        <span>📅 <strong>{r['date_display']}</strong></span>
      </div>
      <p class="intro">{r['intro']}</p>
      <div class="ad-box" style="height:90px;">[ Google AdSense 728×90 ]</div>
      <h2>Ingrédients</h2>
      <ul class="ingredients-list">{ingredients_html}</ul>
      <h2>Préparation</h2>
      {steps_html}
      <div class="ad-box" style="height:90px;">[ Google AdSense 728×90 ]</div>
      <div class="tips">
        <h3>💡 Conseils & astuces</h3>
        <ul>{tips_html}</ul>
      </div>
      <div class="faq-section" itemscope itemtype="https://schema.org/FAQPage">
        <h2>Questions fréquentes</h2>
        {faq_html}
      </div>
    </main>
    <aside>
      <div class="ad-box" style="height:250px;">[ AdSense 300×250 ]</div>
      <div class="widget">
        <h3>Catégories</h3>
        <ul>
          <li><a href="#">🥩 Viandes</a></li>
          <li><a href="#">🐟 Poissons</a></li>
          <li><a href="#">🥦 Végétarien</a></li>
          <li><a href="#">🍰 Desserts</a></li>
          <li><a href="#">🍝 Pâtes & Riz</a></li>
          <li><a href="#">🥗 Salades</a></li>
          <li><a href="#">🍲 Soupes</a></li>
        </ul>
      </div>
      <div class="ad-box" style="height:250px;">[ AdSense 300×250 ]</div>
    </aside>
  </div>
</div>
<footer>
  <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:700;color:#fff;margin-bottom:8px;">
    Recettes <em style="color:var(--terracotta)">Maison</em>
  </div>
  <p>© 2025 Recettes Maison · <a href="#">Mentions légales</a> · <a href="#">Confidentialité</a></p>
</footer>
</body>
</html>"""


def main():
    print("🍳 Générateur Recettes Maison")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    day = datetime.now().timetuple().tm_yday
    recipe_data = RECIPES[day % len(RECIPES)]
    print(f"📝 Recette : {recipe_data[0]}")

    recipe = generate_recipe(recipe_data)
    print(f"✅ Générée : {recipe['title']}")

    Path("recettes").mkdir(exist_ok=True)
    html = render_recipe_html(recipe)
    out = Path("recettes") / f"{recipe['slug']}.html"
    out.write_text(html, encoding="utf-8")
    print(f"💾 {out}")

    # Index JSON
    idx_path = Path("recettes.json")
    idx = json.loads(idx_path.read_text()) if idx_path.exists() else {"recettes": []}
    entry = {k: recipe[k] for k in ["slug","title","meta_description","category","emoji","cook_time","prep_time","servings","date_iso","date_display"]}
    entry["url"] = f"recettes/{recipe['slug']}.html"
    idx["recettes"] = [r for r in idx["recettes"] if r["slug"] != recipe["slug"]]
    idx["recettes"].insert(0, entry)
    idx["recettes"] = idx["recettes"][:300]
    idx["last_updated"] = recipe["date_iso"]
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2))

    with open("last_recipe.txt", "w") as f:
        f.write(f"slug={recipe['slug']}\ntitle={recipe['title']}\ndate={recipe['date_iso']}\n")

    print(f"\n🎉 Recette publiée : {recipe['title']}")
    print(f"🔗 {SITE_URL}/recettes/{recipe['slug']}.html")


if __name__ == "__main__":
    main()