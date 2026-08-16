#!/usr/bin/env python3

import argparse
import json
import os
import unicodedata
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape


# ============================================================
# CONFIGURATION
# ============================================================

ROOT_DIR = Path(__file__).resolve().parent.parent
JSON_FILE = ROOT_DIR / "recettes.json"
RECIPES_DIR = ROOT_DIR / "recettes"

SITEMAP_FILE = ROOT_DIR / "sitemap.xml"
SITEMAP_TEXT_FILE = ROOT_DIR / "sitemap.txt"

SITE_URL = os.environ.get(
    "SITE_URL",
    "https://latablemijote.fr",
).rstrip("/")


# Anciennes recettes déjà remplacées par une version correcte.
OLD_DUPLICATE_SLUGS = {
    "tajine-poulet-citron-confit-olives",
    "pissaladi-re-ni-oise-oignons-anchois",
    "rillettes-de-saumon-fum-maison",
    "velout-butternut-courge-gingembre",
    "tarte-flamb-e-alsacienne-recette",
    "croque-monsieur-b-chamel-maison",
    "p-te-cr-pes-recette-de-base",
    "soupe-de-tomates-fra-ches-basilic",
}


CATEGORY_NAMES = {
    "accompagnement": "Accompagnement",
    "accompagnements": "Accompagnement",

    "crepe": "Crêpes",
    "crepes": "Crêpes",

    "dessert": "Desserts",
    "desserts": "Desserts",

    "entree": "Entrées",
    "entrees": "Entrées",

    "gateau": "Gâteaux",
    "gateaux": "Gâteaux",

    "oeuf": "Œufs",
    "oeufs": "Œufs",

    "pate": "Pâtes",
    "pates": "Pâtes",

    "petit dejeuner": "Petit-déjeuner",
    "petits dejeuners": "Petit-déjeuner",

    "poisson": "Poisson",
    "poissons": "Poisson",

    "plat": "Plats",
    "plats": "Plats",

    "plat du monde": "Plats du monde",
    "plats du monde": "Plats du monde",

    "salade": "Salades",
    "salades": "Salades",

    "sandwich": "Sandwichs",
    "sandwichs": "Sandwichs",

    "soupe": "Soupes",
    "soupes": "Soupes",

    "tarte": "Tartes",
    "tartes": "Tartes",

    "vegetarien": "Végétarien",
    "vegetariens": "Végétarien",

    "viande": "Viande",
    "viandes": "Viande",

    "volaille": "Volaille",
    "volailles": "Volaille",
}


CATEGORY_EMOJIS = {
    "Accompagnement": "🥔",
    "Crêpes": "🥞",
    "Desserts": "🍰",
    "Entrées": "🥄",
    "Gâteaux": "🧁",
    "Œufs": "🍳",
    "Pâtes": "🍝",
    "Petit-déjeuner": "🥐",
    "Poisson": "🐟",
    "Plats": "🍲",
    "Plats du monde": "🌍",
    "Salades": "🥗",
    "Sandwichs": "🥪",
    "Soupes": "🥣",
    "Tartes": "🥧",
    "Végétarien": "🌿",
    "Viande": "🥩",
    "Volaille": "🍗",
}


FRENCH_MONTHS = {
    1: "janvier",
    2: "février",
    3: "mars",
    4: "avril",
    5: "mai",
    6: "juin",
    7: "juillet",
    8: "août",
    9: "septembre",
    10: "octobre",
    11: "novembre",
    12: "décembre",
}


# ============================================================
# FONCTIONS UTILES
# ============================================================

def normalize_text(value):
    """Simplifie un texte pour comparer les catégories et les titres."""
    text = str(value or "").strip().lower()

    text = unicodedata.normalize("NFD", text)
    text = "".join(
        character
        for character in text
        if unicodedata.category(character) != "Mn"
    )

    for character in ["-", "_", "'", "’"]:
        text = text.replace(character, " ")

    return " ".join(text.split())


def normalize_category(value):
    """Transforme une catégorie en catégorie officielle."""
    original = str(value or "").strip()

    if not original:
        return "Autres"

    normalized = normalize_text(original)

    return CATEGORY_NAMES.get(normalized, original)


def format_french_date(date_iso):
    """Transforme 2026-07-16 en 16 juillet 2026."""
    try:
        date = datetime.strptime(
            str(date_iso),
            "%Y-%m-%d",
        )
    except (ValueError, TypeError):
        return str(date_iso or "")

    return (
        f"{date.day} "
        f"{FRENCH_MONTHS[date.month]} "
        f"{date.year}"
    )


def date_for_sort(recipe):
    """Retourne la date d'une recette pour le classement."""
    try:
        return datetime.strptime(
            str(recipe.get("date_iso", "")),
            "%Y-%m-%d",
        )
    except (ValueError, TypeError):
        return datetime.min


def load_recipes_json():
    """Charge et vérifie le fichier recettes.json."""
    if not JSON_FILE.exists():
        raise FileNotFoundError(
            f"Le fichier {JSON_FILE.name} est introuvable."
        )

    try:
        data = json.loads(
            JSON_FILE.read_text(encoding="utf-8")
        )
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Le fichier recettes.json est invalide : {error}"
        ) from error

    if not isinstance(data, dict):
        raise ValueError(
            "La racine de recettes.json doit être un objet."
        )

    if not isinstance(data.get("recettes"), list):
        raise ValueError(
            'Le champ "recettes" doit être une liste.'
        )

    return data


def clean_recipe(recipe):
    """Nettoie les informations d'une recette."""
    cleaned = dict(recipe)

    slug = str(
        cleaned.get("slug", "")
    ).strip()

    category = normalize_category(
        cleaned.get("category", "")
    )

    cleaned["slug"] = slug
    cleaned["category"] = category
    cleaned["emoji"] = CATEGORY_EMOJIS.get(
        category,
        "🍽️",
    )

    if slug:
        cleaned["url"] = f"recettes/{slug}.html"

    cleaned["date_display"] = format_french_date(
        cleaned.get("date_iso", "")
    )

    servings = cleaned.get("servings")

    if isinstance(servings, str):
        servings = servings.strip()

        if servings.isdigit():
            cleaned["servings"] = int(servings)

    return cleaned


def remove_duplicates(recipes):
    """
    Conserve uniquement les recettes uniques.

    Priorité :
    1. version la plus récente ;
    2. suppression des anciens slugs connus ;
    3. suppression des slugs identiques ;
    4. suppression des titres identiques.
    """
    sorted_recipes = sorted(
        recipes,
        key=date_for_sort,
        reverse=True,
    )

    kept = []
    removed = []

    seen_slugs = set()
    seen_titles = set()

    for recipe in sorted_recipes:
        slug = str(
            recipe.get("slug", "")
        ).strip()

        title_key = normalize_text(
            recipe.get("title", "")
        )

        if not slug:
            removed.append("Recette sans slug")
            continue

        if slug in OLD_DUPLICATE_SLUGS:
            removed.append(slug)
            continue

        if slug in seen_slugs:
            removed.append(slug)
            continue

        if title_key and title_key in seen_titles:
            removed.append(slug)
            continue

        seen_slugs.add(slug)

        if title_key:
            seen_titles.add(title_key)

        kept.append(recipe)

    return kept, removed


def validate_recipes(recipes):
    """Vérifie les champs indispensables de chaque recette."""
    required_fields = [
        "slug",
        "title",
        "meta_description",
        "category",
        "cook_time",
        "prep_time",
        "servings",
        "date_iso",
        "url",
    ]

    errors = []

    for index, recipe in enumerate(
        recipes,
        start=1,
    ):
        missing = [
            field
            for field in required_fields
            if recipe.get(field) in ("", None)
        ]

        if missing:
            errors.append(
                f"Recette {index} : "
                f"champs manquants : {', '.join(missing)}"
            )

    return errors


def save_recipes_json(data, recipes):
    """Enregistre le catalogue nettoyé."""
    output = dict(data)
    output["recettes"] = recipes

    if recipes:
        output["last_updated"] = recipes[0].get(
            "date_iso",
            "",
        )
    else:
        output["last_updated"] = datetime.now().strftime(
            "%Y-%m-%d"
        )

    JSON_FILE.write_text(
        json.dumps(
            output,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )


def build_site_urls(recipes):
    """Construit la liste complète des URL du site."""
    urls = [
        f"{SITE_URL}/",
        f"{SITE_URL}/toutes-les-recettes.html",
    ]

    for recipe in recipes:
        relative_url = str(
            recipe.get("url", "")
        ).strip().lstrip("/")

        if not relative_url:
            continue

        urls.append(
            f"{SITE_URL}/{relative_url}"
        )

    # Supprime les éventuels doublons en conservant l'ordre.
    return list(dict.fromkeys(urls))


def generate_xml_sitemap(recipes):
    """Crée le sitemap XML."""
    today = datetime.now().strftime(
        "%Y-%m-%d"
    )

    if recipes:
        latest_date = str(
            recipes[0].get(
                "date_iso",
                today,
            )
        ).strip() or today
    else:
        latest_date = today

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        (
            '<urlset '
            'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        ),
        "  <url>",
        f"    <loc>{escape(SITE_URL + '/')}</loc>",
        f"    <lastmod>{escape(latest_date)}</lastmod>",
        "    <changefreq>daily</changefreq>",
        "    <priority>1.0</priority>",
        "  </url>",
        "  <url>",
        (
            "    <loc>"
            f"{escape(SITE_URL + '/toutes-les-recettes.html')}"
            "</loc>"
        ),
        f"    <lastmod>{escape(latest_date)}</lastmod>",
        "    <changefreq>daily</changefreq>",
        "    <priority>0.9</priority>",
        "  </url>",
    ]

    for recipe in recipes:
        relative_url = str(
            recipe.get("url", "")
        ).strip().lstrip("/")

        if not relative_url:
            continue

        recipe_url = (
            f"{SITE_URL}/{relative_url}"
        )

        date_iso = str(
            recipe.get("date_iso", "")
        ).strip()

        if not date_iso:
            date_iso = today

        lines.extend([
            "  <url>",
            f"    <loc>{escape(recipe_url)}</loc>",
            f"    <lastmod>{escape(date_iso)}</lastmod>",
            "    <changefreq>monthly</changefreq>",
            "    <priority>0.8</priority>",
            "  </url>",
        ])

    lines.append("</urlset>")

    SITEMAP_FILE.write_text(
        "\n".join(lines) + "\n",
        encoding="utf-8",
    )


def generate_text_sitemap(recipes):
    """
    Crée un sitemap au format texte.

    Une URL complète est inscrite sur chaque ligne.
    """
    urls = build_site_urls(recipes)

    SITEMAP_TEXT_FILE.write_text(
        "\n".join(urls) + "\n",
        encoding="utf-8",
    )


def delete_old_html_files():
    """Supprime les anciennes pages HTML en double."""
    deleted = []

    for slug in sorted(
        OLD_DUPLICATE_SLUGS
    ):
        file_path = (
            RECIPES_DIR / f"{slug}.html"
        )

        if file_path.exists():
            file_path.unlink()
            deleted.append(str(file_path))

    return deleted


# ============================================================
# PROGRAMME PRINCIPAL
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Nettoyage des recettes du site "
            "Recettes Maison."
        )
    )

    parser.add_argument(
        "--delete-old-html",
        action="store_true",
        help=(
            "Supprime aussi les anciennes pages HTML "
            "en double."
        ),
    )

    args = parser.parse_args()

    print("=" * 55)
    print("NETTOYAGE RECETTES MAISON")
    print("=" * 55)

    try:
        data = load_recipes_json()
    except (FileNotFoundError, ValueError) as error:
        print(f"ERREUR : {error}")
        return 1

    original_recipes = data["recettes"]

    print(
        "Entrées avant nettoyage : "
        f"{len(original_recipes)}"
    )

    cleaned_recipes = []

    for recipe in original_recipes:
        if isinstance(recipe, dict):
            cleaned_recipes.append(
                clean_recipe(recipe)
            )

    unique_recipes, removed = remove_duplicates(
        cleaned_recipes
    )

    unique_recipes.sort(
        key=date_for_sort,
        reverse=True,
    )

    errors = validate_recipes(
        unique_recipes
    )

    if errors:
        print()
        print("ERREURS DÉTECTÉES :")

        for error in errors:
            print(f"- {error}")

        print()
        print(
            "Aucun fichier n'a été modifié."
        )

        return 1

    save_recipes_json(
        data,
        unique_recipes,
    )

    generate_xml_sitemap(
        unique_recipes
    )

    generate_text_sitemap(
        unique_recipes
    )

    deleted_files = []

    if args.delete_old_html:
        deleted_files = (
            delete_old_html_files()
        )

    print()
    print(
        "Entrées après nettoyage : "
        f"{len(unique_recipes)}"
    )

    print(
        "Entrées supprimées : "
        f"{len(original_recipes) - len(unique_recipes)}"
    )

    if removed:
        print()
        print("Doublons supprimés :")

        for slug in removed:
            print(f"- {slug}")

    print()
    print("recettes.json nettoyé")
    print("sitemap.xml régénéré")
    print("sitemap.txt régénéré")
    print("catégories normalisées")
    print("emojis corrigés")
    print("dates affichées en français")

    if args.delete_old_html:
        print(
            "Pages HTML supprimées : "
            f"{len(deleted_files)}"
        )
    else:
        print(
            "Les anciens fichiers HTML sont conservés."
        )

    print()
    print("NETTOYAGE TERMINÉ")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
