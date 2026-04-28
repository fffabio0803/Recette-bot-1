#!/usr/bin/env python3
import anthropic
import json
import os
import re
from datetime import datetime
from pathlib import Path

SITE_URL = os.environ.get("SITE_URL", "https://fffabio0803.github.io/Recette-bot-1")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

RECIPES = [
    ("poulet roti herbes de provence facile", "Volaille", "Volaille", "45 min", "15 min", 4),
    ("carbonara authentique recette romaine", "Pates", "Pates", "20 min", "10 min", 2),
    ("tarte tatin pommes caramel facile", "Desserts", "Desserts", "25 min", "35 min", 6),
    ("boeuf bourguignon recette traditionnelle", "Viande", "Viande", "4h", "30 min", 6),
    ("risotto champignons cremeux facile", "Vegetarien", "Vegetarien", "25 min", "10 min", 4),
    ("soupe a loignon gratinee parisienne", "Soupes", "Soupes", "45 min", "15 min", 4),
    ("salade nicoise traditionnelle recette", "Salades", "Salades", "0 min", "20 min", 4),
    ("blanquette de veau classique", "Viande", "Viande", "1h30", "30 min", 6),
    ("creme brulee recette facile maison", "Desserts", "Desserts", "30 min", "15 min", 4),
    ("quiche lorraine recette authentique", "Tartes", "Tartes", "35 min", "20 min", 6),
    ("ratatouille provencale recette simple", "Vegetarien", "Vegetarien", "1h", "20 min", 6),
    ("mousse au chocolat legere rapide", "Desserts", "Desserts", "2h frigo", "15 min", 6),
    ("gratin dauphinois cremeux facile", "Accompagnement", "Accompagnement", "1h", "15 min", 6),
    ("bouillabaisse marseillaise recette", "Poisson", "Poisson", "1h30", "30 min", 6),
    ("tarte au citron meringuee facile", "Desserts", "Desserts", "25 min", "30 min", 8),
    ("pot-au-feu recette traditionnelle", "Viande", "Viande", "3h", "30 min", 8),
    ("omelette parfaite technique francaise", "Oeufs", "Oeufs", "5 min", "3 min", 2),
    ("financiers amandes moelleux recette", "Gateaux", "Gateaux", "15 min", "12 min", 12),
    ("soupe de tomates fraiches basilic", "Soupes", "Soupes", "20 min", "10 min", 4),
    ("pate a crepes recette de base", "Crepes", "Crepes", "1h repos", "15 min", 4),
    ("magret de canard sauce miel soja", "Volaille", "Volaille", "15 min", "10 min", 2),
    ("clafoutis cerises recette classique", "Desserts", "Desserts", "35 min", "10 min", 6),
    ("vichyssoise froide poireaux pommes de terre", "Soupes", "Soupes", "2h frigo", "20 min", 6),
    ("croque-monsieur bechamel maison", "Sandwichs", "Sandwichs", "15 min", "10 min", 2),
    ("taboul maison menthe citron", "Salades", "Salades", "1h frigo", "20 min", 4),
    ("tiramisu recette italienne originale", "Desserts", "Desserts", "4h frigo", "20 min", 6),
    ("moules marinieres vin blanc facile", "Poisson", "Poisson", "20 min", "10 min", 4),
    ("tarte flambee alsacienne recette", "Tartes", "Tartes", "20 min", "15 min", 4),
    ("fondant chocolat coulant moelleux", "Desserts", "Desserts", "12 min", "10 min", 4),
    ("osso buco milanaise recette italienne", "Viande", "Viande", "1h30", "20 min", 4),
    ("veloute butternut courge gingembre", "Soupes", "Soupes", "30 min", "10 min", 4),
    ("cake citron moelleux facile rapide", "Gateaux", "Gateaux", "40 min", "10 min", 8),
    ("rillettes de saumon fume maison", "Entrees", "Entrees", "1h frigo", "10 min", 6),
    ("pissaladiere nicoise oignons anchois", "Tartes", "Tartes", "45 min", "20 min", 6),
    ("far breton pruneaux recette bretonne", "Desserts", "Desserts", "45 min", "10 min", 8),
    ("gnocchis pommes de terre maison", "Pates", "Pates", "30 min", "30 min", 4),
    ("pavlova fruits rouges meringue", "Desserts", "Desserts", "1h30", "20 min", 8),
    ("tajine de poulet citron confit olives", "Plats du monde", "Plats du monde", "1h30", "20 min", 4),
    ("gaspacho andalou recette fraiche", "Soupes", "Soupes", "2h frigo", "15 min", 6),
    ("profiteroles choux creme glacee chocolat", "Desserts", "Desserts", "40 min", "20 min", 8),
    ("saumon gravlax maison aneth citron", "Poisson", "Poisson", "48h", "20 min", 8),
    ("tartiflette reblochon pommes de terre", "Plats", "Plats", "50 min", "15 min", 4),
    ("panna cotta vanille coulis fruits", "Desserts", "Desserts", "3h frigo", "10 min", 4),
    ("poulet basquaise tomates poivrons", "Volaille", "Volaille", "1h", "20 min", 4),
    ("salade de lentilles vinaigrette moutarde", "Salades", "Salades", "30 min", "10 min", 4),
    ("madeleine recette classique bosse", "Gateaux", "Gateaux", "1h repos", "12 min", 16),
    ("tortilla espagnole pommes de terre oignon", "Oeufs", "Oeufs", "30 min", "15 min", 4),
    ("baba au rhum recette traditionnelle", "Desserts", "Desserts", "45 min", "20 min", 6),
    ("brandade de morue maison recette", "Poisson", "Poisson", "30 min", "20 min", 6),
    ("oeufs cocotte creme fraiche facile", "Oeufs", "Oeufs", "15 min", "5 min", 2),
    ("sorbet mangue citron vert recette", "Desserts", "Desserts", "4h congelateur", "10 min", 6),
    ("roti de porc moutarde miel recette", "Viande", "Viande", "1h", "10 min", 6),
    ("creme caramel renversee classique", "Desserts", "Desserts", "45 min", "15 min", 6),
    ("fraisier recette patisserie maison", "Desserts", "Desserts", "3h", "45 min", 8),
    ("daurade royale four citron fenouil", "Poisson", "Poisson", "25 min", "10 min", 2),
    ("ile flottante oeufs neige creme anglaise", "Desserts", "Desserts", "30 min", "20 min", 4),
    ("salade caesar poulet grille maison", "Salades", "Salades", "0 min", "20 min", 2),
    ("pain perdu brioche recette facile", "Petit-dejeuner", "Petit-dejeuner", "10 min", "5 min", 2),
    ("coq au vin rouge champignons lardons", "Volaille", "Volaille", "2h", "30 min", 6),
    ("terrine de campagne recette maison", "Entrees", "Entrees", "24h", "30 min", 10),
]


def call_api(client, prompt):
    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
        system="Tu es chef cuisinier expert francais. Reponds UNIQUEMENT en JSON valide sans backticks ni texte supplementaire."
    )
    raw = msg.content[0].text.strip()
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'\s*```$', '', raw)
    return raw.strip()


def generate_recipe(recipe_data):
    topic, category, emoji, cook_time, prep_time, servings = recipe_data
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    slug = re.sub(r'[^a-z0-9]+', '-', topic.lower()).strip('-')[:60]

    prompt = (
        "Genere une recette complete et UNIQUE pour : " + topic + "\n\n"
        "Redige comme un vrai chef cuisinier francais passionne.\n"
        "IMPORTANT : Reponds UNIQUEMENT avec du JSON valide. Pas de backticks. Pas de texte avant ou apres.\n"
        "Utilise uniquement des guillemets doubles dans le JSON.\n\n"
        "Format exact :\n"
        '{"title": "Titre SEO 55-65 caracteres", '
        '"meta_description": "Description 145-155 caracteres appetissante", '
        '"intro": "Introduction 150 mots avec histoire ou anecdote du plat, ton chaleureux", '
        '"ingredients": [{"amount": "200", "unit": "g", "name": "ingredient precis avec qualite ou origine"}], '
        '"steps": [{"num": 1, "title": "Titre etape", "text": "Instruction detaillee 60-80 mots avec technique et erreurs a eviter"}], '
        '"tips": ["Astuce de chef", "Variante regionale", "Conservation", "Accord mets-vins"], '
        '"faq": [{"q": "Question specifique ?", "a": "Reponse experte 60 mots"}, '
        '{"q": "Adaptation possible ?", "a": "Reponse pratique 60 mots"}, '
        '{"q": "Erreur la plus commune ?", "a": "Reponse honnete avec solution"}]}\n\n'
        "Exigences : 10-12 ingredients, 6-7 etapes, intro unique avec histoire reelle, zero phrase generique."
    )

    for attempt in range(3):
        try:
            raw = call_api(client, prompt)
            data = json.loads(raw)
            break
        except json.JSONDecodeError as e:
            print("JSON invalide tentative " + str(attempt + 1) + "/3 : " + str(e))
            if attempt == 2:
                raise Exception("Echec apres 3 tentatives")

    data["slug"] = slug
    data["category"] = category
    data["emoji"] = emoji
    data["cook_time"] = cook_time
    data["prep_time"] = prep_time
    data["servings"] = servings
    data["topic"] = topic
    data["date_iso"] = datetime.now().strftime("%Y-%m-%d")
    data["date_display"] = datetime.now().strftime("%d %B %Y")
    return data


def render_recipe_html(r):
    site = SITE_URL
    ing_html = ""
    for i in r["ingredients"]:
        ing_html += "<li><span class='ing-amount'>" + str(i["amount"]) + " " + str(i["unit"]) + "</span> " + str(i["name"]) + "</li>"
    steps_html = ""
    for s in r["steps"]:
        steps_html += "<div class='step'><div class='step-num'>" + str(s["num"]) + "</div><div class='step-body'><strong>" + str(s["title"]) + "</strong><p>" + str(s["text"]) + "</p></div></div>"
    tips_html = ""
    for t in r["tips"]:
        tips_html += "<li>" + str(t) + "</li>"
    faq_html = ""
    for f in r.get("faq", []):
        faq_html += "<div class='faq-item'><h3>" + str(f["q"]) + "</h3><p>" + str(f["a"]) + "</p></div>"

    page = "<!DOCTYPE html>\n<html lang='fr'>\n<head>\n"
    page += "<meta charset='UTF-8'>\n<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n"
    page += "<meta name='description' content='" + r["meta_description"].replace("'", "") + "'>\n"
    page += "<title>" + r["title"] + " - Recettes Maison</title>\n"
    page += "<link rel='canonical' href='" + site + "/recettes/" + r["slug"] + ".html'>\n"
    page += "<link href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Jost:wght@300;400;500;600&display=swap' rel='stylesheet'>\n"
    page += "<style>\n:root{--cream:#faf6f0;--warm:#f2ebe0;--ink:#1c1812;--terracotta:#c4622d;--sage:#7a8c6e;--rule:#e0d8cc;--mid:#9a8f82;}\n"
    page += "*{margin:0;padding:0;box-sizing:border-box;}body{background:var(--cream);color:var(--ink);font-family:'Jost',sans-serif;font-weight:300;line-height:1.6;}\n"
    page += ".masthead{border-bottom:2px solid var(--ink);text-align:center;padding:20px;}.site-name{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:700;text-decoration:none;color:var(--ink);}.site-name em{color:var(--terracotta);}\n"
    page += "nav{display:flex;justify-content:center;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-top:12px;flex-wrap:wrap;}nav a{padding:10px 20px;font-size:11px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:var(--ink);text-decoration:none;border-right:1px solid var(--rule);}nav a:first-child{border-left:1px solid var(--rule);}nav a:hover{background:var(--ink);color:var(--cream);}\n"
    page += ".container{max-width:860px;margin:0 auto;padding:32px 24px;}.breadcrumb{font-size:11px;color:var(--mid);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;}.breadcrumb a{color:var(--mid);text-decoration:none;}\n"
    page += ".cat-tag{display:inline-block;background:var(--terracotta);color:#fff;font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;padding:3px 10px;margin-bottom:12px;}\n"
    page += "h1{font-family:'Cormorant Garamond',serif;font-size:clamp(28px,4vw,46px);font-weight:700;line-height:1.1;margin-bottom:16px;}\n"
    page += ".recipe-bar{display:flex;gap:20px;flex-wrap:wrap;background:var(--warm);border:1px solid var(--rule);padding:16px 20px;margin:16px 0 24px;}.recipe-bar span{font-size:12px;color:var(--mid);}.recipe-bar strong{color:var(--ink);font-weight:600;}\n"
    page += ".intro{font-size:15px;line-height:1.8;color:#4a3f35;margin-bottom:28px;font-style:italic;border-left:3px solid var(--terracotta);padding-left:16px;}\n"
    page += ".ad-box{background:var(--warm);border:1px dashed var(--rule);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--mid);letter-spacing:2px;text-transform:uppercase;margin:20px 0;height:90px;}\n"
    page += "h2{font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:700;font-style:italic;margin:28px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--rule);}\n"
    page += ".ingredients-list{list-style:none;}.ingredients-list li{padding:10px 0;border-bottom:1px solid var(--rule);font-size:14px;display:flex;gap:8px;align-items:center;}.ingredients-list li::before{content:'·';color:var(--terracotta);font-size:20px;}.ing-amount{font-weight:600;min-width:80px;color:var(--terracotta);}\n"
    page += ".step{display:grid;grid-template-columns:48px 1fr;gap:16px;margin-bottom:20px;}.step-num{width:48px;height:48px;background:var(--terracotta);color:#fff;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:700;flex-shrink:0;}.step-body strong{display:block;font-size:15px;font-weight:600;margin-bottom:6px;}.step-body p{font-size:14px;line-height:1.7;color:#4a3f35;}\n"
    page += ".tips{background:var(--warm);border-left:4px solid var(--sage);padding:20px 24px;margin:24px 0;}.tips h3{font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:700;margin-bottom:12px;}.tips ul{list-style:none;}.tips li{padding:6px 0;font-size:14px;color:#4a3f35;padding-left:16px;}\n"
    page += ".faq-section{border-top:2px solid var(--ink);padding-top:24px;margin-top:28px;}.faq-item{border-bottom:1px solid var(--rule);padding:16px 0;}.faq-item h3{font-size:16px;font-weight:600;margin-bottom:8px;}.faq-item p{font-size:14px;color:#6a5f55;line-height:1.7;}\n"
    page += "footer{background:var(--ink);color:#888;padding:32px;text-align:center;font-size:12px;margin-top:48px;}footer a{color:#888;text-decoration:none;}\n"
    page += "@media(max-width:768px){.recipe-bar{gap:12px;}}\n</style>\n</head>\n<body>\n"
    page += "<header class='masthead'><a href='" + site + "' class='site-name'>Recettes <em>Maison</em></a>\n"
    page += "<nav><a href='" + site + "'>Accueil</a><a href='" + site + "/toutes-les-recettes.html'>Toutes les recettes</a></nav></header>\n"
    page += "<div class='container'>\n"
    page += "<div class='breadcrumb'><a href='" + site + "'>Accueil</a> - " + r["category"] + "</div>\n"
    page += "<span class='cat-tag'>" + r["category"] + "</span>\n"
    page += "<h1>" + r["title"] + "</h1>\n"
    page += "<div class='recipe-bar'><span>Prep : <strong>" + r["prep_time"] + "</strong></span><span>Cuisson : <strong>" + r["cook_time"] + "</strong></span><span>Portions : <strong>" + str(r["servings"]) + " pers.</strong></span><span>" + r["date_display"] + "</span></div>\n"
    page += "<p class='intro'>" + r["intro"] + "</p>\n"
    page += "<div class='ad-box'>[ Google AdSense 728x90 ]</div>\n"
    page += "<h2>Ingredients</h2><ul class='ingredients-list'>" + ing_html + "</ul>\n"
    page += "<h2>Preparation</h2>" + steps_html + "\n"
    page += "<div class='ad-box'>[ Google AdSense 728x90 ]</div>\n"
    page += "<div class='tips'><h3>Conseils et astuces</h3><ul>" + tips_html + "</ul></div>\n"
    page += "<div class='faq-section'><h2>Questions frequentes</h2>" + faq_html + "</div>\n"
    page += "</div>\n<footer><div style='font-family:Cormorant Garamond,serif;font-size:28px;font-weight:700;color:#fff;margin-bottom:8px;'>Recettes Maison</div><p>2025 Recettes Maison</p></footer>\n</body>\n</html>"
    return page


def main():
    print("Generateur Recettes Maison - " + datetime.now().strftime("%Y-%m-%d %H:%M"))
    day = datetime.now().timetuple().tm_yday
    recipe_data = RECIPES[day % len(RECIPES)]
    print("Recette : " + recipe_data[0])
    recipe = generate_recipe(recipe_data)
    print("Generee : " + recipe["title"])
    Path("recettes").mkdir(exist_ok=True)
    html = render_recipe_html(recipe)
    out = Path("recettes") / (recipe["slug"] + ".html")
    out.write_text(html, encoding="utf-8")
    print("Fichier cree : " + str(out))
    idx_path = Path("recettes.json")
    idx = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() else {"recettes": []}
    entry = {"slug": recipe["slug"], "title": recipe["title"], "meta_description": recipe["meta_description"], "category": recipe["category"], "emoji": recipe["emoji"], "cook_time": recipe["cook_time"], "prep_time": recipe["prep_time"], "servings": recipe["servings"], "date_iso": recipe["date_iso"], "date_display": recipe["date_display"], "url": "recettes/" + recipe["slug"] + ".html"}
    idx["recettes"] = [r for r in idx["recettes"] if r["slug"] != recipe["slug"]]
    idx["recettes"].insert(0, entry)
    idx["recettes"] = idx["recettes"][:300]
    idx["last_updated"] = recipe["date_iso"]
    idx_path.write_text(json.dumps(idx, ensure_ascii=False, indent=2), encoding="utf-8")
    with open("last_recipe.txt", "w", encoding="utf-8") as f:
        f.write("slug=" + recipe["slug"] + "\ntitle=" + recipe["title"] + "\ndate=" + recipe["date_iso"] + "\n")
    print("Publie : " + recipe["title"])


if __name__ == "__main__":
    main()
