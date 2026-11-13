(function (root) {
  'use strict';
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('œ','oe').replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).map(w=>w.length>3?w.replace(/s$/,''):w).join(' ');
  const pasta = ['pate','pates','spaghetti','tagliatelle','penne','coquillette','macaroni','fusilli'];
  const canonical = s => {
    const n = norm(s);
    if(pasta.includes(n) || n==='pate alimentaire') return 'pates alimentaires';
    if(['oeuf','oeufs'].includes(n)) return 'oeuf';
    if(['patate','pomme de terre'].includes(n)) return 'pomme de terre';
    return n;
  };
  function matches(item, term) {
    const n = ' '+norm(String(item).replace(/pas de[^)]*/gi,''))+' ', t = canonical(term);
    if(t === 'pates alimentaires') return /\b(tagliatelle|spaghetti|penne|coquillette|macaroni|fusilli)\b/.test(n) || /\bpate(?: alimentaire| seche| cuite| fraiche)\b/.test(n) || norm(item)==='pate';
    if(t === 'oeuf') return /\boeufs?\b/.test(n);
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
