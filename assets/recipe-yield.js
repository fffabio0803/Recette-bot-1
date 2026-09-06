(function (root) {
  'use strict';
  function label(recipe) {
    return recipe.yield_label || (recipe.servings ? recipe.servings + ' pers.' : 'Rendement à préciser');
  }
  function compareServings(a, b, descending) {
    // Ne pas comparer un nombre de biscuits à un nombre de convives.
    var x = Number(a.servings), y = Number(b.servings);
    if (!(x > 0)) return y > 0 ? 1 : 0;
    if (!(y > 0)) return -1;
    return descending ? y - x : x - y;
  }
  var api = {label:label, compareServings:compareServings};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RecipeYield = api;
})(typeof window !== 'undefined' ? window : this);
