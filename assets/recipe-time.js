(function (root) {
  'use strict';
  function parseMinutes(value) {
    var text = String(value == null ? '' : value).trim().toLowerCase().replace(',', '.');
    // Pour une plage, retenir la borne haute afin de ne pas sous-estimer le temps.
    text = text.replace(/\d+(?:\.\d+)?\s*(?:à|-)\s*(\d+(?:\.\d+)?)\s*(h|min)/g, '$1$2');
    var match = text.match(/^(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*(?:min)?)?$/);
    if (match) return Number(match[1]) * 60 + Number(match[2] || 0);
    match = text.match(/^(\d+)\s*(?:min)?$/);
    return match ? Number(match[1]) : 99999;
  }
  function isQuickRecipe(recipe) {
    var prep = parseMinutes(recipe.prep_time), cook = parseMinutes(recipe.cook_time);
    var rest = recipe.rest_time ? parseMinutes(recipe.rest_time) : 0;
    return prep !== 99999 && cook !== 99999 && rest !== 99999 && prep + cook + rest <= 30;
  }
  var api = { parseMinutes: parseMinutes, isQuickRecipe: isQuickRecipe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RecipeTime = api;
})(typeof window !== 'undefined' ? window : this);
