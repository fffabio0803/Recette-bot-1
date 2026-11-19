(function (root) {
  'use strict';
  const plurals = {poireaux:'poireau',choux:'chou',noix:'noix',mais:'mais',pois:'pois',riz:'riz'};
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('œ','oe').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).map(w=>plurals[w] || (w.length>3?w.replace(/s$/,''):w)).join(' ');
  const pasta = ['pate','pates','spaghetti','tagliatelle','penne','coquillette','macaroni','fusilli'];
  const canonical = s => {
    const n = norm(s);
    if(pasta.includes(n) || n==='pate alimentaire') return 'pates alimentaires';
    if(['marron','chataigne'].includes(n)) return 'chataigne';
    if(['oeuf','oeufs'].includes(n)) return 'oeuf';
    if(['patate','pomme de terre'].includes(n)) return 'pomme de terre';
    if(['dorade','daurade'].includes(n)) return 'daurade';
    if(['chevre','fromage de chevre'].includes(n)) return 'fromage de chevre';
    if(['levure de boulanger','levure boulangere','levure de boulangerie'].includes(n)) return 'levure boulangere';
    return n;
  };
  function matches(item, term) {
    // Search food, not measuring units or a replaced/excluded ingredient in a note.
    const cleaned = norm(String(item)).replace(/\b(?:a la place de|pas de)\b.*$/,'')
      .replace(/\b(?:cuillere|c) a (?:cafe|soupe)\b/g,'');
    const n = ' '+cleaned+' ', t = canonical(term);
    if(t === 'pates alimentaires') return /\b(tagliatelle|spaghetti|penne|coquillette|macaroni|fusilli)\b/.test(n) || /\bpate(?: alimentaire| seche| cuite| fraiche)\b/.test(n) || norm(item)==='pate';
    if(t === 'chataigne') return /\b(chataigne|marron)\b/.test(n);
    if(t === 'oeuf') return /\boeufs?\b/.test(n);
    if(t === 'pomme') return /\bpomme\b/.test(n.replace(/\bpomme de terre\b/g,''));
    if(t === 'pomme de terre') return /\bpomme de terre\b/.test(n) || /\bpatate\b/.test(n.replace(/\bpatate douce\b/g,''));
    if(t === 'noix') return /\bnoix\b/.test(n.replace(/\bnoix de (?:muscade|coco)\b/g,''));
    if(t === 'mais') return /\bmais\b/.test(n.replace(/\b(?:fecule|amidon|farine) de mais\b/g,''));
    if(t === 'daurade') return /\b(?:dorade|daurade)\b/.test(n);
    if(t === 'fromage de chevre') return /\bchevre\b/.test(n);
    if(t === 'levure boulangere') return /\blevure (?:boulangere|de boulanger(?:ie)?)\b/.test(n);
    return n.includes(' '+t+' ');
  }
  const basics = new Set(['creme','lait','beurre','huile','huile d olive','farine','sucre','sel','poivre','eau','moutarde','cannelle','cumin','paprika','muscade','thym','persil','vanille','levure chimique','levure boulangere']);
  function rank(recipes, rawTerms) {
    const terms = [...new Set(rawTerms.map(canonical).filter(Boolean))];
    if(!terms.length) return [];
    const anchors = terms.filter(t=>!basics.has(t));
    return recipes.map(r=>{
      const found=terms.filter(t=>r.ingredients.some(i=>matches(i,t)));
      const missing=r.ingredients.filter(i=>!terms.some(t=>matches(i,t)));
      return {r,found,missing,percent:Math.round(100*found.length/terms.length)};
    }).filter(x=>x.found.length && (!anchors.length || anchors.some(t=>x.found.includes(t))))
      .sort((a,b)=>b.found.length-a.found.length || a.missing.length-b.missing.length || a.r.title.localeCompare(b.r.title,'fr'));
  }
  root.LTMPlacard={norm,canonical,matches,rank};
})(globalThis);
