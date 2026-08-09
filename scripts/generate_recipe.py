#!/usr/bin/env python3

import anthropic
import html
import json
import os
import re
from datetime import datetime
from pathlib import Path


SITE_URL = "https://fffabio0803.github.io/Recette-bot-1"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

PILOT_RECIPE_SLUGS = {
    "saumon-gravlax-maison-aneth-citron",
    "carbonara-authentique-recette-romaine",
    "gaspacho-andalou-recette-fraiche",
    "tarte-tatin-pommes-caramel-facile",
    "poulet-roti-herbes-de-provence-facile",
}


RECIPES = [
    ("poulet roti herbes de provence facile", "Volaille", "Volaille", "45 min", "15 min", 4),
    ("carbonara authentique recette romaine", "Pâtes", "Pâtes", "20 min", "10 min", 2),
    ("tarte tatin pommes caramel facile", "Desserts", "Desserts", "25 min", "35 min", 6),
    ("boeuf bourguignon recette traditionnelle", "Viande", "Viande", "4h", "30 min", 6),
    ("risotto champignons cremeux facile", "Végétarien", "Végétarien", "25 min", "10 min", 4),
    ("soupe a loignon gratinee parisienne", "Soupes", "Soupes", "45 min", "15 min", 4),
    ("salade nicoise traditionnelle recette", "Salades", "Salades", "0 min", "20 min", 4),
    ("blanquette de veau classique", "Viande", "Viande", "1h30", "30 min", 6),
    ("creme brulee recette facile maison", "Desserts", "Desserts", "30 min", "15 min", 4),
    ("quiche lorraine recette authentique", "Tartes", "Tartes", "35 min", "20 min", 6),
    ("ratatouille provencale recette simple", "Végétarien", "Végétarien", "1h", "20 min", 6),
    ("mousse au chocolat legere rapide", "Desserts", "Desserts", "2h frigo", "15 min", 6),
    ("gratin dauphinois cremeux facile", "Accompagnements", "Accompagnements", "1h", "15 min", 6),
    ("bouillabaisse marseillaise recette", "Poisson", "Poisson", "1h30", "30 min", 6),
    ("tarte au citron meringuee facile", "Desserts", "Desserts", "25 min", "30 min", 8),
    ("pot-au-feu recette traditionnelle", "Viande", "Viande", "3h", "30 min", 8),
    ("omelette parfaite technique francaise", "Œufs", "Œufs", "5 min", "3 min", 2),
    ("financiers amandes moelleux recette", "Gâteaux", "Gâteaux", "15 min", "12 min", 12),
    ("soupe de tomates fraiches basilic", "Soupes", "Soupes", "20 min", "10 min", 4),
    ("pate a crepes recette de base", "Crêpes", "Crêpes", "1h repos", "15 min", 4),
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
    ("cake citron moelleux facile rapide", "Gâteaux", "Gâteaux", "40 min", "10 min", 8),
    ("rillettes de saumon fume maison", "Entrées", "Entrées", "1h frigo", "10 min", 6),
    ("pissaladiere nicoise oignons anchois", "Tartes", "Tartes", "45 min", "20 min", 6),
    ("far breton pruneaux recette bretonne", "Desserts", "Desserts", "45 min", "10 min", 8),
    ("gnocchis pommes de terre maison", "Pâtes", "Pâtes", "30 min", "30 min", 4),
    ("pavlova fruits rouges meringue", "Desserts", "Desserts", "1h30", "20 min", 8),
    ("tajine de poulet citron confit olives", "Plats du monde", "Plats du monde", "1h30", "20 min", 4),
    ("gaspacho andalou recette fraiche", "Soupes", "Soupes", "2h frigo", "15 min", 6),
    ("profiteroles choux creme glacee chocolat", "Desserts", "Desserts", "40 min", "20 min", 8),
    ("saumon gravlax maison aneth citron", "Poisson", "Poisson", "48h", "20 min", 8),
    ("tartiflette reblochon pommes de terre", "Plats", "Plats", "50 min", "15 min", 4),
    ("panna cotta vanille coulis fruits", "Desserts", "Desserts", "3h frigo", "10 min", 4),
    ("poulet basquaise tomates poivrons", "Volaille", "Volaille", "1h", "20 min", 4),
    ("salade de lentilles vinaigrette moutarde", "Salades", "Salades", "30 min", "10 min", 4),
    ("madeleine recette classique bosse", "Gâteaux", "Gâteaux", "1h repos", "12 min", 16),
    ("tortilla espagnole pommes de terre oignon", "Œufs", "Œufs", "30 min", "15 min", 4),
    ("baba au rhum recette traditionnelle", "Desserts", "Desserts", "45 min", "20 min", 6),
    ("brandade de morue maison recette", "Poisson", "Poisson", "30 min", "20 min", 6),
    ("oeufs cocotte creme fraiche facile", "Œufs", "Œufs", "15 min", "5 min", 2),
    ("sorbet mangue citron vert recette", "Desserts", "Desserts", "4h congelateur", "10 min", 6),
    ("roti de porc moutarde miel recette", "Viande", "Viande", "1h", "10 min", 6),
    ("creme caramel renversee classique", "Desserts", "Desserts", "45 min", "15 min", 6),
    ("fraisier recette patisserie maison", "Desserts", "Desserts", "3h", "45 min", 8),
    ("daurade royale four citron fenouil", "Poisson", "Poisson", "25 min", "10 min", 2),
    ("ile flottante oeufs neige creme anglaise", "Desserts", "Desserts", "30 min", "20 min", 4),
    ("salade caesar poulet grille maison", "Salades", "Salades", "0 min", "20 min", 2),
    ("pain perdu brioche recette facile", "Petit-déjeuner", "Petit-déjeuner", "10 min", "5 min", 2),
    ("coq au vin rouge champignons lardons", "Volaille", "Volaille", "2h", "30 min", 6),
    ("terrine de campagne recette maison", "Entrées", "Entrées", "24h", "30 min", 10),
]


def escape(value):
    return html.escape(str(value), quote=True)


def duration_to_iso8601(value):
    """
    Transforme par exemple :
    45 min -> PT45M
    1h30 -> PT1H30M
    2h frigo -> PT2H
    0 min -> PT0M
    48h -> PT48H
    """
    text = str(value).lower().strip()

    hours_match = re.search(r"(\d+)\s*h", text)
    minutes_match = re.search(r"(\d+)\s*min", text)

    hours = int(hours_match.group(1)) if hours_match else 0
    minutes = int(minutes_match.group(1)) if minutes_match else 0

    if not hours and not minutes:
        compact_match = re.search(r"(\d+)h(\d+)", text)

        if compact_match:
            hours = int(compact_match.group(1))
            minutes = int(compact_match.group(2))

    duration = "PT"

    if hours:
        duration += str(hours) + "H"

    if minutes:
        duration += str(minutes) + "M"

    if duration == "PT":
        duration = "PT0M"

    return duration


def is_rest_time(value):
    text = str(value).lower()
    return any(
        marker in text
        for marker in ("frigo", "repos", "congelateur", "congélateur")
    ) or str(value).strip() == "48h"


def pilot_image_url(recipe):
    if recipe["slug"] not in PILOT_RECIPE_SLUGS:
        return ""

    return (
        SITE_URL
        + "/assets/images/recettes/"
        + recipe["slug"]
        + ".jpg"
    )


def call_api(client, prompt):
    message = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=4000,
        system=(
            "Tu es chef cuisinier expert francais. "
            "Reponds UNIQUEMENT en JSON valide, "
            "sans backticks ni texte supplementaire."
        ),
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    raw = ""

    for block in message.content:
        if hasattr(block, "text"):
            raw += block.text

    raw = raw.strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    if not raw:
        raise RuntimeError(
            "Claude n'a renvoye aucun bloc de texte."
        )

    return raw


def generate_recipe(recipe_data):
    topic, category, emoji, cook_time, prep_time, servings = recipe_data

    if not ANTHROPIC_API_KEY:
        raise RuntimeError(
            "Le secret ANTHROPIC_API_KEY est absent ou vide."
        )

    client = anthropic.Anthropic(
        api_key=ANTHROPIC_API_KEY
    )

    slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        topic.lower()
    ).strip("-")[:60]

    prompt = (
        "Genere une recette complete et UNIQUE pour : "
        + topic
        + "\n\n"
        "Redige comme un chef cuisinier francais competent et pedagogique.\n"
        "IMPORTANT : Reponds UNIQUEMENT avec du JSON valide. "
        "Pas de backticks. Pas de texte avant ou apres.\n"
        "Utilise uniquement des guillemets doubles dans le JSON.\n\n"
        "Format exact :\n"
        '{"title": "Titre SEO 55-65 caracteres", '
        '"meta_description": "Description 145-155 caracteres appetissante", '
        '"intro": "Introduction 130-170 mots avec origine prudente du plat et conseils utiles", '
        '"ingredients": ['
        '{"amount": "200", "unit": "g", '
        '"name": "ingredient precis avec qualite ou origine"}'
        "], "
        '"steps": ['
        '{"num": 1, "title": "Titre etape", '
        '"text": "Instruction detaillee 60-80 mots avec technique et erreurs a eviter"}'
        "], "
        '"tips": ['
        '"Astuce de chef", '
        '"Variante regionale", '
        '"Conservation", '
        '"Accord mets-vins"'
        "], "
        '"faq": ['
        '{"q": "Question specifique ?", '
        '"a": "Reponse experte et pratique"}, '
        '{"q": "Adaptation possible ?", '
        '"a": "Reponse pratique"}, '
        '{"q": "Erreur la plus commune ?", '
        '"a": "Reponse honnete avec solution"}'
        "]}\n\n"
        "Exigences : 10-12 ingredients, 6-7 etapes. "
        "N'invente pas de souvenir personnel, de mentor, "
        "de chef rencontre ou d'evenement historique precis. "
        "Ne presente jamais une information incertaine comme un fait. "
        "Zero phrase generique."
    )

    data = None

    for attempt in range(3):
        try:
            raw = call_api(client, prompt)
            data = json.loads(raw)
            break

        except json.JSONDecodeError as error:
            print(
                "JSON invalide tentative "
                + str(attempt + 1)
                + "/3 : "
                + str(error)
            )

            if attempt == 2:
                raise RuntimeError(
                    "Echec de la generation JSON apres 3 tentatives."
                ) from error

    if data is None:
        raise RuntimeError(
            "Aucune recette valide n'a ete generee."
        )

    required_fields = [
        "title",
        "meta_description",
        "intro",
        "ingredients",
        "steps",
        "tips",
        "faq",
    ]

    for field in required_fields:
        if field not in data:
            raise RuntimeError(
                "Champ manquant dans la reponse Claude : "
                + field
            )

    data["slug"] = slug
    data["category"] = category
    data["emoji"] = emoji
    data["cook_time"] = cook_time
    data["prep_time"] = prep_time
    data["servings"] = servings
    data["topic"] = topic
    data["date_iso"] = datetime.now().strftime("%Y-%m-%d")
    data["date_display"] = datetime.now().strftime("%d/%m/%Y")

    return data


def build_structured_data(recipe):
    canonical_url = (
        SITE_URL
        + "/recettes/"
        + recipe["slug"]
        + ".html"
    )

    ingredients = []

    for ingredient in recipe["ingredients"]:
        ingredient_text = " ".join(
            part
            for part in [
                str(ingredient.get("amount", "")).strip(),
                str(ingredient.get("unit", "")).strip(),
                str(ingredient.get("name", "")).strip(),
            ]
            if part
        )

        ingredients.append(ingredient_text)

    instructions = []

    for step in recipe["steps"]:
        instructions.append(
            {
                "@type": "HowToStep",
                "position": step.get("num"),
                "name": str(step.get("title", "")),
                "text": str(step.get("text", "")),
            }
        )

    recipe_schema = {
        "@type": "Recipe",
        "@id": canonical_url + "#recipe",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical_url,
        },
        "name": recipe["title"],
        "description": recipe["meta_description"],
        "author": {
            "@type": "Organization",
            "name": "Recettes Maison",
            "url": SITE_URL + "/",
        },
        "publisher": {
            "@type": "Organization",
            "name": "Recettes Maison",
            "url": SITE_URL + "/",
        },
        "datePublished": recipe["date_iso"],
        "dateModified": recipe["date_iso"],
        "prepTime": duration_to_iso8601(
            recipe["prep_time"]
        ),
        "recipeYield": (
            str(recipe["servings"])
            + " portions"
        ),
        "recipeCategory": recipe["category"],
        "recipeCuisine": "Cuisine maison",
        "keywords": [
            recipe["topic"],
            recipe["category"],
            "recette maison",
        ],
        "recipeIngredient": ingredients,
        "recipeInstructions": instructions,
        "url": canonical_url,
        "inLanguage": "fr-FR",
    }

    if not is_rest_time(recipe["cook_time"]):
        recipe_schema["cookTime"] = duration_to_iso8601(
            recipe["cook_time"]
        )

    image_url = pilot_image_url(recipe)

    if image_url:
        recipe_schema["image"] = [image_url]

    graph = [recipe_schema]

    faq_entities = []

    for faq in recipe.get("faq", []):
        question = str(faq.get("q", "")).strip()
        answer = str(faq.get("a", "")).strip()

        if not question or not answer:
            continue

        faq_entities.append(
            {
                "@type": "Question",
                "name": question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": answer,
                },
            }
        )

    if faq_entities:
        graph.append(
            {
                "@type": "FAQPage",
                "@id": canonical_url + "#faq",
                "mainEntity": faq_entities,
            }
        )

    structured_data = {
        "@context": "https://schema.org",
        "@graph": graph,
    }

    return json.dumps(
        structured_data,
        ensure_ascii=False,
        separators=(",", ":"),
    ).replace("</", "<\\/")


def render_recipe_html(recipe):
    ingredients_html = ""

    for ingredient in recipe["ingredients"]:
        ingredients_html += (
            "<li>"
            "<span class='ing-amount'>"
            + escape(ingredient.get("amount", ""))
            + " "
            + escape(ingredient.get("unit", ""))
            + "</span> "
            + escape(ingredient.get("name", ""))
            + "</li>"
        )

    steps_html = ""

    for step in recipe["steps"]:
        steps_html += (
            "<div class='step'>"
            "<div class='step-num'>"
            + escape(step.get("num", ""))
            + "</div>"
            "<div class='step-body'>"
            "<strong>"
            + escape(step.get("title", ""))
            + "</strong>"
            "<p>"
            + escape(step.get("text", ""))
            + "</p>"
            "</div>"
            "</div>"
        )

    tips_html = ""

    for tip in recipe["tips"]:
        tips_html += (
            "<li>"
            + escape(tip)
            + "</li>"
        )

    faq_html = ""

    for faq in recipe.get("faq", []):
        faq_html += (
            "<div class='faq-item'>"
            "<h3>"
            + escape(faq.get("q", ""))
            + "</h3>"
            "<p>"
            + escape(faq.get("a", ""))
            + "</p>"
            "</div>"
        )

    canonical_url = (
        SITE_URL
        + "/recettes/"
        + recipe["slug"]
        + ".html"
    )

    structured_data = build_structured_data(
        recipe
    )
    image_url = pilot_image_url(recipe)
    time_label = (
        "Repos"
        if is_rest_time(recipe["cook_time"])
        else "Cuisson"
    )

    page = "<!DOCTYPE html>\n"
    page += "<html lang='fr'>\n"
    page += "<head>\n"
    page += "<meta charset='UTF-8'>\n"
    page += (
        "<meta name='viewport' "
        "content='width=device-width, initial-scale=1.0'>\n"
    )
    page += (
        "<meta name='description' content='"
        + escape(recipe["meta_description"])
        + "'>\n"
    )
    page += (
        "<title>"
        + escape(recipe["title"])
        + " - Recettes Maison</title>\n"
    )
    page += (
        "<link rel='canonical' href='"
        + canonical_url
        + "'>\n"
    )
    if image_url:
        page += "<meta property='og:type' content='article'>\n"
        page += (
            "<meta property='og:image' content='"
            + image_url
            + "'>\n"
        )
        page += "<meta name='twitter:card' content='summary_large_image'>\n"
    page += (
        "<script type='application/ld+json'>"
        + structured_data
        + "</script>\n"
    )
    page += (
        "<link href='https://fonts.googleapis.com/css2?"
        "family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400"
        "&family=Jost:wght@300;400;500;600&display=swap' "
        "rel='stylesheet'>\n"
    )

    page += "<style>\n"
    page += (
        ":root{--cream:#faf6f0;--warm:#f2ebe0;"
        "--ink:#1c1812;--terracotta:#c4622d;"
        "--sage:#7a8c6e;--rule:#e0d8cc;--mid:#9a8f82;}\n"
    )
    page += (
        "*{margin:0;padding:0;box-sizing:border-box;}"
        "body{background:var(--cream);color:var(--ink);"
        "font-family:'Jost',sans-serif;font-weight:300;"
        "line-height:1.6;}\n"
    )
    page += (
        ".masthead{border-bottom:2px solid var(--ink);"
        "text-align:center;padding:20px;}"
        ".site-name{font-family:'Cormorant Garamond',serif;"
        "font-size:42px;font-weight:700;text-decoration:none;"
        "color:var(--ink);}"
        ".site-name em{color:var(--terracotta);}\n"
    )
    page += (
        "nav{display:flex;justify-content:center;"
        "border-top:1px solid var(--rule);"
        "border-bottom:1px solid var(--rule);"
        "margin-top:12px;flex-wrap:wrap;}"
        "nav a{padding:10px 20px;font-size:11px;"
        "font-weight:500;letter-spacing:2px;"
        "text-transform:uppercase;color:var(--ink);"
        "text-decoration:none;border-right:1px solid var(--rule);}"
        "nav a:first-child{border-left:1px solid var(--rule);}"
        "nav a:hover{background:var(--ink);color:var(--cream);}\n"
    )
    page += (
        ".container{max-width:860px;margin:0 auto;padding:32px 24px;}"
        ".breadcrumb{font-size:11px;color:var(--mid);"
        "letter-spacing:1px;text-transform:uppercase;"
        "margin-bottom:12px;}"
        ".breadcrumb a{color:var(--mid);text-decoration:none;}\n"
    )
    page += (
        ".cat-tag{display:inline-block;"
        "background:var(--terracotta);color:#fff;"
        "font-size:10px;font-weight:500;letter-spacing:2px;"
        "text-transform:uppercase;padding:3px 10px;"
        "margin-bottom:12px;}\n"
    )
    page += (
        "h1{font-family:'Cormorant Garamond',serif;"
        "font-size:clamp(28px,4vw,46px);font-weight:700;"
        "line-height:1.1;margin-bottom:16px;}\n"
    )
    page += (
        ".recipe-bar{display:flex;gap:20px;flex-wrap:wrap;"
        "background:var(--warm);border:1px solid var(--rule);"
        "padding:16px 20px;margin:16px 0 24px;}"
        ".recipe-bar span{font-size:12px;color:var(--mid);}"
        ".recipe-bar strong{color:var(--ink);font-weight:600;}\n"
    )
    page += (
        ".intro{font-size:15px;line-height:1.8;"
        "color:#4a3f35;margin-bottom:28px;font-style:italic;"
        "border-left:3px solid var(--terracotta);"
        "padding-left:16px;}\n"
    )
    page += (
        ".recipe-hero{margin:0 0 24px;}"
        ".recipe-hero img{display:block;width:100%;height:auto;"
        "aspect-ratio:16/9;object-fit:cover;border:1px solid var(--rule);}"
        ".recipe-hero figcaption{font-size:11px;color:var(--mid);"
        "margin-top:7px;}"
        ".editorial-note{font-size:13px;color:#5d5147;"
        "background:#fff;border:1px solid var(--rule);padding:14px 16px;"
        "margin:0 0 28px;}\n"
    )
    page += (
        "h2{font-family:'Cormorant Garamond',serif;"
        "font-size:26px;font-weight:700;font-style:italic;"
        "margin:28px 0 16px;padding-bottom:8px;"
        "border-bottom:1px solid var(--rule);}\n"
    )
    page += (
        ".ingredients-list{list-style:none;}"
        ".ingredients-list li{padding:10px 0;"
        "border-bottom:1px solid var(--rule);font-size:14px;"
        "display:flex;gap:8px;align-items:center;}"
        ".ingredients-list li::before{content:'·';"
        "color:var(--terracotta);font-size:20px;}"
        ".ing-amount{font-weight:600;min-width:80px;"
        "color:var(--terracotta);}\n"
    )
    page += (
        ".step{display:grid;grid-template-columns:48px 1fr;"
        "gap:16px;margin-bottom:20px;}"
        ".step-num{width:48px;height:48px;"
        "background:var(--terracotta);color:#fff;"
        "display:flex;align-items:center;justify-content:center;"
        "font-family:'Cormorant Garamond',serif;"
        "font-size:22px;font-weight:700;}"
        ".step-body strong{display:block;font-size:15px;"
        "font-weight:600;margin-bottom:6px;}"
        ".step-body p{font-size:14px;line-height:1.7;"
        "color:#4a3f35;}\n"
    )
    page += (
        ".tips{background:var(--warm);"
        "border-left:4px solid var(--sage);"
        "padding:20px 24px;margin:24px 0;}"
        ".tips h3{font-family:'Cormorant Garamond',serif;"
        "font-size:20px;font-weight:700;margin-bottom:12px;}"
        ".tips ul{list-style:none;}"
        ".tips li{padding:6px 0;font-size:14px;"
        "color:#4a3f35;padding-left:16px;}\n"
    )
    page += (
        ".faq-section{border-top:2px solid var(--ink);"
        "padding-top:24px;margin-top:28px;}"
        ".faq-item{border-bottom:1px solid var(--rule);"
        "padding:16px 0;}"
        ".faq-item h3{font-size:16px;font-weight:600;"
        "margin-bottom:8px;}"
        ".faq-item p{font-size:14px;color:#6a5f55;"
        "line-height:1.7;}\n"
    )
    page += (
        "footer{background:var(--ink);color:#888;"
        "padding:32px;text-align:center;font-size:12px;"
        "margin-top:48px;}\n"
    )
    page += (
        "@media(max-width:768px){"
        ".recipe-bar{gap:12px;}"
        ".site-name{font-size:34px;}"
        ".container{padding:24px 18px;}"
        "}\n"
    )
    page += "</style>\n"
    page += "</head>\n"
    page += "<body>\n"

    page += (
        "<header class='masthead'>"
        "<a href='"
        + SITE_URL
        + "/' class='site-name'>"
        "Recettes <em>Maison</em>"
        "</a>"
        "<nav>"
        "<a href='"
        + SITE_URL
        + "/'>Accueil</a>"
        "<a href='"
        + SITE_URL
        + "/toutes-les-recettes.html'>Toutes les recettes</a>"
        "</nav>"
        "</header>\n"
    )

    page += "<main class='container'>\n"

    page += (
        "<div class='breadcrumb'>"
        "<a href='"
        + SITE_URL
        + "/'>Accueil</a> - "
        + escape(recipe["category"])
        + "</div>\n"
    )

    page += (
        "<span class='cat-tag'>"
        + escape(recipe["category"])
        + "</span>\n"
    )

    page += (
        "<h1>"
        + escape(recipe["title"])
        + "</h1>\n"
    )

    page += (
        "<div class='recipe-bar'>"
        "<span>Préparation : <strong>"
        + escape(recipe["prep_time"])
        + "</strong></span>"
        "<span>"
        + time_label
        + " : <strong>"
        + escape(recipe["cook_time"])
        + "</strong></span>"
        "<span>Portions : <strong>"
        + escape(recipe["servings"])
        + " pers.</strong></span>"
        "<span>"
        + escape(recipe["date_display"])
        + "</span>"
        "</div>\n"
    )

    if image_url:
        page += (
            "<figure class='recipe-hero'>"
            "<img src='"
            + image_url
            + "' alt='Illustration de "
            + escape(recipe["title"])
            + "' width='1672' height='941'>"
            "<figcaption>Illustration culinaire générée pour cette recette.</figcaption>"
            "</figure>\n"
        )

    page += (
        "<p class='intro'>"
        + escape(recipe["intro"])
        + "</p>\n"
    )
    page += (
        "<aside class='editorial-note'><strong>Note éditoriale :</strong> "
        "cette recette a été préparée avec l’aide d’un outil d’intelligence "
        "artificielle puis structurée pour publication. Adaptez toujours les "
        "temps et les températures à vos ingrédients et à votre matériel."
        "</aside>\n"
    )

    page += (
        "<h2>Ingrédients</h2>"
        "<ul class='ingredients-list'>"
        + ingredients_html
        + "</ul>\n"
    )

    page += (
        "<h2>Préparation</h2>"
        + steps_html
        + "\n"
    )

    page += (
        "<div class='tips'>"
        "<h3>Conseils et astuces</h3>"
        "<ul>"
        + tips_html
        + "</ul>"
        "</div>\n"
    )

    page += (
        "<div class='faq-section'>"
        "<h2>Questions fréquentes</h2>"
        + faq_html
        + "</div>\n"
    )

    page += "</main>\n"

    page += (
        "<footer>"
        "<div style=\"font-family:'Cormorant Garamond',serif;"
        "font-size:28px;font-weight:700;color:#fff;"
        "margin-bottom:8px;\">"
        "Recettes Maison"
        "</div>"
        "<p>"
        + str(datetime.now().year)
        + " Recettes Maison</p>"
        "<p><a href='"
        + SITE_URL
        + "/a-propos.html' style='color:#ccc'>À propos</a> · "
        "<a href='"
        + SITE_URL
        + "/contact.html' style='color:#ccc'>Contact</a> · "
        "<a href='"
        + SITE_URL
        + "/confidentialite.html' style='color:#ccc'>Confidentialité</a> · "
        "<a href='"
        + SITE_URL
        + "/mentions-legales.html' style='color:#ccc'>Mentions légales</a></p>"
        "</footer>\n"
    )

    page += "</body>\n"
    page += "</html>\n"

    return page


def generate_sitemap(index_data):
    today = datetime.now().strftime("%Y-%m-%d")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "  <url>",
        "    <loc>" + SITE_URL + "/</loc>",
        "    <lastmod>" + today + "</lastmod>",
        "    <changefreq>daily</changefreq>",
        "    <priority>1.0</priority>",
        "  </url>",
        "  <url>",
        "    <loc>"
        + SITE_URL
        + "/toutes-les-recettes.html</loc>",
        "    <lastmod>" + today + "</lastmod>",
        "    <changefreq>daily</changefreq>",
        "    <priority>0.9</priority>",
        "  </url>",
    ]

    seen_urls = set()

    for recipe in index_data.get("recettes", []):
        relative_url = str(
            recipe.get("url", "")
        ).lstrip("/")

        if not relative_url:
            continue

        full_url = (
            SITE_URL
            + "/"
            + relative_url
        )

        if full_url in seen_urls:
            continue

        seen_urls.add(full_url)

        lastmod = str(
            recipe.get("date_iso") or today
        )

        lines.extend([
            "  <url>",
            "    <loc>" + full_url + "</loc>",
            "    <lastmod>" + lastmod + "</lastmod>",
            "    <changefreq>monthly</changefreq>",
            "    <priority>0.8</priority>",
            "  </url>",
        ])

    lines.append("</urlset>")

    Path("sitemap.xml").write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8"
    )

    print(
        "Sitemap mis a jour : "
        + str(len(seen_urls) + 2)
        + " URLs"
    )


def main():
    print(
        "Generateur Recettes Maison - "
        + datetime.now().strftime("%Y-%m-%d %H:%M")
    )

    day = datetime.now().timetuple().tm_yday
    recipe_data = RECIPES[day % len(RECIPES)]

    print(
        "Recette : "
        + recipe_data[0]
    )

    recipe = generate_recipe(
        recipe_data
    )

    print(
        "Generee : "
        + recipe["title"]
    )

    Path("recettes").mkdir(
        exist_ok=True
    )

    recipe_html = render_recipe_html(
        recipe
    )

    output_path = (
        Path("recettes")
        / (recipe["slug"] + ".html")
    )

    output_path.write_text(
        recipe_html,
        encoding="utf-8"
    )

    print(
        "Fichier cree : "
        + str(output_path)
    )

    index_path = Path(
        "recettes.json"
    )

    if index_path.exists():
        index_data = json.loads(
            index_path.read_text(
                encoding="utf-8"
            )
        )
    else:
        index_data = {
            "recettes": []
        }

    entry = {
        "slug": recipe["slug"],
        "title": recipe["title"],
        "meta_description": recipe["meta_description"],
        "category": recipe["category"],
        "emoji": recipe["emoji"],
        "cook_time": recipe["cook_time"],
        "prep_time": recipe["prep_time"],
        "servings": recipe["servings"],
        "date_iso": recipe["date_iso"],
        "date_display": recipe["date_display"],
        "url": (
            "recettes/"
            + recipe["slug"]
            + ".html"
        ),
    }

    index_data["recettes"] = [
        existing_recipe
        for existing_recipe
        in index_data.get(
            "recettes",
            []
        )
        if existing_recipe.get("slug")
        != recipe["slug"]
    ]

    index_data["recettes"].insert(
        0,
        entry
    )

    index_data["recettes"] = (
        index_data["recettes"][:300]
    )

    index_data["last_updated"] = (
        recipe["date_iso"]
    )

    index_path.write_text(
        json.dumps(
            index_data,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )

    generate_sitemap(
        index_data
    )

    Path("last_recipe.txt").write_text(
        "slug="
        + recipe["slug"]
        + "\n"
        + "title="
        + recipe["title"]
        + "\n"
        + "date="
        + recipe["date_iso"]
        + "\n",
        encoding="utf-8"
    )

    print(
        "Publie : "
        + recipe["title"]
    )


if __name__ == "__main__":
    main()
