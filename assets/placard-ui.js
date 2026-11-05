(function () {
  'use strict';
  const page = document.querySelector('#placard');
  if (!page) return;
  const home = document.querySelector('#tools-home');
  const input = document.querySelector('#ingredient-search');
  const choices = document.querySelector('#ingredient-choices');
  const chips = document.querySelector('#ingredient-stock');
  const field = document.querySelector('#produits');
  const form = page.querySelector('form');
  const results = document.querySelector('#trouvailles');
  const notice = document.querySelector('#stock-status');
  const submit = document.querySelector('#find-recipes');
  const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('œ', 'oe').trim();
  const foods = ['Œufs','Farine','Lait','Beurre','Crème','Sucre','Riz','Pâtes','Pommes de terre','Carottes','Courgettes','Poireaux','Épinards','Champignons','Potiron','Butternut','Patate douce','Oignon','Échalote','Ail','Tomates','Poivron','Chou','Petits pois','Pois chiches','Lentilles','Haricots rouges','Haricots blancs','Maïs','Semoule','Boulgour','Pain','Poulet','Bœuf','Lardons','Jambon','Thon','Saumon','Daurade','Fromage de chèvre','Gruyère','Comté','Parmesan','Mascarpone','Yaourt','Banane','Pomme','Poire','Citron','Orange','Fraises','Framboises','Myrtilles','Marrons','Noisettes','Cannelle','Moutarde','Huile','Huile d’olive','Miel','Chocolat','Cacao','Café','Vanille','Levure chimique','Levure boulangère','Sel','Poivre','Cumin','Paprika','Muscade','Thym','Persil','Ciboulette','Aneth','Laurier','Romarin','Fenouil','Concombre','Olives','Anchois','Rhum','Vin rouge','Vin blanc','Vinaigre','Cassonade','Sucre glace','Graines de chia','Graines de courge'];
  const stock = [];
  function screen() {
    const active = location.hash === '#placard';
    home.hidden = active; page.hidden = !active;
    document.title = active ? 'Mon placard — Que cuisiner ? | La Table Mijote' : 'Outils de cuisine | La Table Mijote';
  }
  window.addEventListener('hashchange', screen); screen();
  function clearResults() { results.replaceChildren(); }
  function renderStock() {
    chips.replaceChildren();
    stock.forEach((food, index) => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'stock-chip'; button.textContent = food + ' ×';
      button.setAttribute('aria-label', 'Retirer ' + food);
      button.addEventListener('click', () => {
        stock.splice(index, 1); renderStock(); clearResults(); suggest(); input.focus();
      }); chips.append(button);
    });
    field.value = stock.join(', '); submit.disabled = !stock.length;
    notice.textContent = stock.length ? stock.length + ' ingrédient' + (stock.length > 1 ? 's' : '') + ' dans votre placard.' : 'Votre placard est vide. Ajoutez un premier ingrédient.';
  }
  function add(value) {
    const food = value.trim().slice(0, 50);
    if (!food) return;
    if (stock.length >= 20) { notice.textContent = '20 ingrédients maximum par recherche.'; return; }
    if (!stock.some(x => normalize(x) === normalize(food))) stock.push(food);
    input.value = ''; renderStock(); clearResults(); suggest(); input.focus();
  }
  function suggest() {
    choices.replaceChildren();
    const term = normalize(input.value);
    const list = foods.filter(food => !stock.includes(food) && (!term || normalize(food).includes(term))).slice(0, 8);
    for (const food of list) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = '+ ' + food; button.addEventListener('click', () => add(food)); choices.append(button);
    }
    if (term && !foods.some(x => normalize(x) === term)) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = 'Ajouter « ' + input.value.trim().slice(0, 50) + ' »';
      button.addEventListener('click', () => add(input.value)); choices.append(button);
    }
  }
  input.addEventListener('input', suggest);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const exact = foods.find(x => normalize(x) === normalize(input.value));
      const first = foods.find(x => normalize(x).startsWith(normalize(input.value)));
      if (input.value.trim()) add(exact || first || input.value);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); choices.querySelector('button')?.focus();
    } else if (event.key === 'Escape') { input.value = ''; suggest(); }
  });
  form.addEventListener('submit', () => { input.value = ''; suggest(); });
  document.querySelector('#empty-stock').addEventListener('click', () => {
    stock.length = 0; input.value = ''; renderStock(); clearResults(); suggest(); input.focus();
  });
  renderStock(); suggest();
})();
