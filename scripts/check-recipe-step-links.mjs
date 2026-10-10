import fs from 'node:fs';
import assert from 'node:assert/strict';

const slugs = ['boeuf-bourguignon-recette-traditionnelle', 'tiramisu-recette-italienne-originale'];
for (const slug of slugs) {
  const html = fs.readFileSync(`recettes/${slug}.html`, 'utf8');
  const nodes = [...html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)].flatMap(match => {
    const data = JSON.parse(match[1]);
    return data['@graph'] || [data];
  });
  const recipe = nodes.find(node => node['@type'] === 'Recipe');
  const canonical = `https://latablemijote.fr/recettes/${slug}.html`;
  const ids = [...html.matchAll(/\bid=['"]([^'"]+)['"]/g)].map(match => match[1]);
  assert.equal(recipe.recipeInstructions.length, 7, `${slug}: sept étapes attendues`);
  recipe.recipeInstructions.forEach((step, index) => {
    const id = `etape-${index + 1}`;
    assert.equal(step['@type'], 'HowToStep');
    assert.equal(step.position, index + 1);
    assert.equal(step.url, `${canonical}#${id}`, `${slug}: URL de l'étape ${index + 1}`);
    assert.equal(ids.filter(value => value === id).length, 1, `${slug}: ancre unique ${id}`);
  });
  assert.equal(new Set(recipe.recipeInstructions.map(step => step.url)).size, 7);
}
console.log('Liens des étapes : 14 URL structurées reliées à 14 ancres uniques.');
