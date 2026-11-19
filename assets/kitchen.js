/* Practical kitchen tools. No account, tracking or external service. */
(function(root){
'use strict';
const KEY='ltm_kitchen_v1';
const blank=()=>({favorites:[],shopping:[],cooking:{}});
function clean(raw){
  if(!raw||typeof raw!=='object') return blank();
  const recipe=r=>r&&typeof r.title==='string'&&/^\/recettes\/[a-z0-9-]+\.html$/.test(r.url);
  return {favorites:Array.isArray(raw.favorites)?raw.favorites.filter(recipe).slice(0,100).map(r=>({title:r.title.slice(0,200),url:r.url})):[],
    shopping:Array.isArray(raw.shopping)?raw.shopping.filter(g=>g&&typeof g.title==='string'&&Array.isArray(g.items)).slice(0,30).map(g=>({title:g.title.slice(0,200),url:recipe(g)?g.url:'',items:g.items.filter(i=>i&&typeof i.text==='string').slice(0,80).map(i=>({text:i.text.slice(0,600),group:String(i.group||'Indispensable').slice(0,30),checked:i.checked===true}))})):[],
    cooking:raw.cooking&&typeof raw.cooking==='object'&&!Array.isArray(raw.cooking)?raw.cooking:{}};
}
function load(storage){try{return clean(JSON.parse(storage.getItem(KEY)||'null'));}catch{return blank();}}
function save(storage,data){try{storage.setItem(KEY,JSON.stringify(clean(data)));return true;}catch{return false;}}
function steps(recipe){return (recipe.recipeInstructions||[]).flatMap(s=>typeof s==='string'?[{text:s}]:s.itemListElement?steps({recipeInstructions:s.itemListElement}):s.text?[{text:s.text,name:s.name||''}]:[]);}
root.LTMKitchenCore={clean,load,save,steps,KEY};
if(typeof document==='undefined')return;
let storage;try{storage=root.localStorage;}catch{}
let state=load(storage),persisted=true,modal,lastFocus;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const btn=(text,action,cls)=>{const b=el('button',text,cls||'kitchen-button');b.type='button';b.addEventListener('click',action);return b;};
const status=el('p','','kitchen-status');status.setAttribute('role','status');
function write(){persisted=save(storage,state);if(!persisted)status.textContent='Le navigateur bloque la sauvegarde : vos choix restent disponibles seulement sur cette page.';updateHearts();}
function close(){if(modal?.open)modal.close();}
function dialog(title){
  close();modal?.remove();lastFocus=document.activeElement;
  modal=el('dialog',undefined,'kitchen-dialog');modal.setAttribute('aria-labelledby','kitchen-dialog-title');
  const head=el('div',undefined,'kitchen-dialog-head'),h=el('h2',title);h.id='kitchen-dialog-title';
  head.append(h,btn('Fermer',close));const body=el('div',undefined,'kitchen-dialog-body');
  const note=el('p','Enregistré uniquement dans ce navigateur, sans compte.','kitchen-note');
  modal.append(head,body,note);document.body.append(modal);
  modal.addEventListener('close',()=>{document.body.classList.remove('kitchen-modal-open');if(lastFocus?.isConnected)lastFocus.focus();});
  if(typeof modal.showModal!=='function'){modal.remove();status.textContent='Ce navigateur ne prend pas en charge cette vue. La recette reste accessible sur la page.';return null;}
  document.body.classList.add('kitchen-modal-open');modal.showModal();
  if(!persisted)note.textContent='Sauvegarde indisponible : ces choix seront perdus en quittant la page.';
  return body;
}
function updateHearts(){
  document.querySelectorAll('[data-favorite-url]').forEach(b=>{const active=state.favorites.some(r=>r.url===b.dataset.favoriteUrl);b.setAttribute('aria-pressed',String(active));b.textContent=active?'♥ Enregistrée':'♡ Enregistrer';});
}
function heart(r){
  const b=btn('',()=>{const at=state.favorites.findIndex(x=>x.url===r.url);if(at<0){if(state.favorites.length>=100){status.textContent='Votre liste contient déjà 100 favoris.';return;}state.favorites.push({title:r.title,url:r.url});}else state.favorites.splice(at,1);write();if(persisted)status.textContent=at<0?'Recette ajoutée à vos favoris.':'Recette retirée des favoris.';});
  b.dataset.favoriteUrl=r.url;b.setAttribute('aria-label','Enregistrer : '+r.title);return b;
}
function favorites(){
  const body=dialog('Mes favoris');if(!body)return;
  if(!state.favorites.length)body.append(el('p','Aucun favori pour le moment. Touchez le cœur d’une recette pour la retrouver ici.'));
  for(const r of state.favorites){const row=el('div',undefined,'kitchen-saved-row'),a=el('a',r.title);a.href=r.url;row.append(a,btn('Retirer',()=>{state.favorites=state.favorites.filter(x=>x.url!==r.url);write();row.remove();if(!state.favorites.length)body.append(el('p','Votre liste de favoris est vide.'));}));body.append(row);}
}
function shopping(){
  const body=dialog('Ma liste de courses');if(!body)return;
  body.append(el('p','Les quantités déjà dans votre placard ne sont pas connues. Vérifiez-les avant de faire vos courses.','kitchen-note'));
  if(!state.shopping.length){body.append(el('p','Votre liste est vide. Dans Mon placard, ouvrez une idée puis choisissez « Ajouter les manquants ».'));const a=el('a','Ouvrir Mon placard');a.href='/outils.html#placard';body.append(a);return;}
  const actions=el('div',undefined,'kitchen-actions');
  actions.append(btn('Copier la liste',async()=>{const text=state.shopping.map(g=>g.title+'\n'+g.items.map(i=>(i.checked?'☑ ':'☐ ')+i.text+(i.group==='Indispensable'?'':' ('+i.group+')')).join('\n')).join('\n\n');try{await navigator.clipboard.writeText(text);copyNotice.textContent='Liste copiée.';}catch{const area=el('textarea');area.value=text;area.setAttribute('aria-label','Liste de courses à copier');body.append(area);area.focus();area.select();copyNotice.textContent='Sélectionnez puis copiez le texte ci-dessous.';}}),btn('Imprimer la liste',()=>printShopping()));
  body.append(actions);const copyNotice=el('p');copyNotice.setAttribute('role','status');body.append(copyNotice);
  state.shopping.forEach(g=>{
    const block=el('section',undefined,'kitchen-shopping-group');block.append(el('h3',g.title));
    for(const item of g.items){const label=el('label',undefined,'kitchen-check'),input=el('input');input.type='checkbox';input.checked=item.checked;
      input.addEventListener('change',()=>{item.checked=input.checked;write();});label.append(input,el('span',item.text+(item.group==='Indispensable'?'':' — '+item.group)));block.append(label);}
    block.append(btn('Retirer cette recette',()=>{state.shopping=state.shopping.filter(x=>x!==g);write();block.remove();if(!state.shopping.length)body.append(el('p','Votre liste est vide.'));}));
    body.append(block);
  });
}
function addShopping(r,groups,button){
  const items=Object.entries(groups).flatMap(([group,values])=>values.map(text=>({text,group,checked:false})));
  if(!items.length)return;
  const existing=state.shopping.find(g=>g.title===r.title&&g.url===(r.url||''));
  if(existing){const previous=new Map(existing.items.map(i=>[i.text,i.checked]));existing.items=items.map(i=>({...i,checked:previous.get(i.text)||false}));}
  else if(state.shopping.length<30)state.shopping.push({title:r.title,url:r.url||'',items});
  else{status.textContent='Votre liste contient déjà 30 recettes. Retirez-en une avant d’en ajouter.';return;}
  write();button.textContent='Manquants ajoutés';if(persisted)status.textContent='Liste de courses mise à jour pour '+r.title+'.';
}
root.LTMKitchen={addShopping};
function recipeData(){
  for(const node of document.querySelectorAll('script[type="application/ld+json"]')){try{const data=JSON.parse(node.textContent),nodes=Array.isArray(data)?data:data['@graph']||[data];const r=nodes.find(x=>x['@type']==='Recipe'||Array.isArray(x['@type'])&&x['@type'].includes('Recipe'));if(r&&Array.isArray(r.recipeIngredient)&&steps(r).length)return r;}catch{}}
  return null;
}
const recipe=recipeData();
function cook(){
  const body=dialog('Mode cuisine');if(!body)return;
  const list=steps(recipe),fingerprint=JSON.stringify([recipe.recipeIngredient,list]);
  const raw=state.cooking[location.pathname];
  let progress=raw?.fingerprint===fingerprint?raw:{fingerprint,index:0,checked:[]};
  progress.index=Math.max(0,Math.min(list.length-1,Number.isInteger(progress.index)?progress.index:0));
  progress.checked=Array.isArray(progress.checked)?progress.checked.filter(i=>Number.isInteger(i)&&i>=0&&i<recipe.recipeIngredient.length):[];
  const keep=()=>{state.cooking[location.pathname]=progress;const keys=Object.keys(state.cooking);if(keys.length>100)delete state.cooking[keys[0]];write();};
  body.append(el('p',recipe.name,'kitchen-recipe-name'),el('p','Gardez les conseils et précautions de la fiche à portée de main.','kitchen-note'));
  const safety=document.querySelector('#securite-gravlax');
  if(safety)body.append(el('p',safety.innerText,'kitchen-note'));
  const ingredients=el('details');ingredients.open=true;ingredients.append(el('summary','Mes ingrédients'));
  recipe.recipeIngredient.forEach((text,i)=>{const label=el('label',undefined,'kitchen-check'),input=el('input');input.type='checkbox';input.checked=progress.checked.includes(i);
    input.addEventListener('change',()=>{progress.checked=progress.checked.filter(x=>x!==i);if(input.checked)progress.checked.push(i);keep();});
    label.append(input,el('span',text));ingredients.append(label);});
  const step=el('section',undefined,'kitchen-step'),counter=el('p',undefined,'kitchen-step-counter'),heading=el('h3'),text=el('p'),bar=el('progress');heading.tabIndex=-1;bar.max=list.length;bar.setAttribute('aria-label','Progression des étapes');
  const nav=el('div',undefined,'kitchen-actions');
  const previous=btn('Précédente',()=>{progress.index--;keep();render();heading.focus();});
  const next=btn('Étape suivante',()=>{if(progress.index<list.length-1){progress.index++;keep();render();heading.focus();}else{const done=el('p','Toutes les étapes ont été parcourues. Vérifiez la cuisson avec les repères de la recette.');done.setAttribute('role','status');next.disabled=true;step.append(done);}});
  const reset=btn('Recommencer',()=>{progress={fingerprint,index:0,checked:[]};keep();cook();});
  function render(){const current=list[progress.index];counter.textContent='Étape '+(progress.index+1)+' sur '+list.length;heading.textContent=current.name||'À vous de jouer';text.textContent=current.text;bar.value=progress.index+1;previous.disabled=progress.index===0;next.disabled=false;next.textContent=progress.index===list.length-1?'Terminer':'Étape suivante';}
  nav.append(previous,next);step.append(counter,bar,heading,text,nav);body.append(ingredients,step,reset);render();
}
let printKind='recipe';
function printRoot(title){
  document.querySelector('#kitchen-print')?.remove();const node=el('section');node.id='kitchen-print';node.append(el('p','La Table Mijote'),el('h1',title));document.body.append(node);return node;
}
function buildRecipePrint(){
  if(!recipe)return;const node=printRoot(recipe.name);
  const meta=document.querySelector('.recipe-bar,.meta,.stats');if(meta)node.append(el('p',meta.innerText));
  node.append(el('p','Fiche complète : https://latablemijote.fr'+location.pathname),el('h2','Ingrédients'));
  const ul=el('ul');recipe.recipeIngredient.forEach(i=>ul.append(el('li',i)));node.append(ul,el('h2','Préparation'));
  const ol=el('ol');steps(recipe).forEach(s=>ol.append(el('li',(s.name?s.name+' — ':'')+s.text)));node.append(ol);
  // Include existing safety and conservation advice; never omit it for sensitive recipes.
  const notes=document.querySelectorAll('.tips,.notice,#conseils,#reperes-durees,#dossier-pratique,#securite-gravlax');
  for(const n of notes){const p=el('p',n.innerText);node.append(p);}
  for(const p of document.querySelectorAll('main p,.wrap p'))if(/^Allergènes\s*:/i.test(p.textContent.trim())&&![...notes].some(n=>n.contains(p)))node.append(el('p',p.innerText));
  for(const h of document.querySelectorAll('h2,h3'))if(/conserv|allerg|précaution|sécurité/i.test(h.textContent)&&![...notes].some(n=>n.contains(h))){node.append(el('h2',h.textContent));let n=h.nextElementSibling;while(n&&!/^H[1-3]$/.test(n.tagName)&&!n.classList.contains('ltm-reviews')){if(n.tagName!=='SCRIPT')node.append(el('p',n.innerText));n=n.nextElementSibling;}}
}
function printShopping(){
  printKind='shopping';const node=printRoot('Ma liste de courses');for(const g of state.shopping){node.append(el('h2',g.title));const ul=el('ul');g.items.forEach(i=>ul.append(el('li',(i.checked?'☑ ':'☐ ')+i.text+(i.group==='Indispensable'?'':' — '+i.group))));node.append(ul);}document.body.classList.add('kitchen-printing');root.print();
}
root.addEventListener('beforeprint',()=>{if(printKind==='recipe'&&recipe)buildRecipePrint();if(document.querySelector('#kitchen-print'))document.body.classList.add('kitchen-printing');});
root.addEventListener('afterprint',()=>{document.body.classList.remove('kitchen-printing');printKind='recipe';document.querySelector('#kitchen-print')?.remove();});
const main=document.querySelector('main,.wrap');if(!main)return;
const utility=el('div',undefined,'kitchen-utility');utility.append(btn('♡ Mes favoris',favorites),btn('Ma liste de courses',shopping));main.prepend(utility);utility.after(status);
if(recipe){const actions=el('div',undefined,'kitchen-actions recipe-actions');actions.append(btn('Mode cuisine',cook,'kitchen-button kitchen-primary'),heart({title:recipe.name,url:location.pathname}),btn('Imprimer',()=>{printKind='recipe';buildRecipePrint();document.body.classList.add('kitchen-printing');root.print();}));document.querySelector('h1')?.after(actions);}
function enhanceCards(){
  for(const card of document.querySelectorAll('.recipe-card')){
    if(card.querySelector('[data-favorite-url]'))continue;
    const link=card.querySelector('a[href*="recettes/"]'),title=card.querySelector('h2,h3');if(!link||!title)continue;
    const url=new URL(link.href,location.href);if(url.origin!==location.origin||!/^\/recettes\/[a-z0-9-]+\.html$/.test(url.pathname))continue;
    const b=heart({title:title.textContent.trim(),url:url.pathname});b.classList.add('kitchen-card-heart');card.append(b);
  }updateHearts();
}
enhanceCards();let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhanceCards();});});
// Only card list replacements, not heart text updates.
document.querySelectorAll('#recipes-grid,#featured-grid,#latest-recipes,#seasonal-recipes').forEach(n=>observer.observe(n,{childList:true}));
root.addEventListener('storage',event=>{if(event.key===KEY||event.key===null){state=load(storage);updateHearts();if(modal?.open){close();status.textContent='Vos choix ont changé dans un autre onglet. Rouvrez la liste pour les consulter.';}}});
function openFeedback(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(!id)return;document.getElementById(id)?.closest('details.kitchen-feedback')?.setAttribute('open','');}
root.addEventListener('hashchange',openFeedback);openFeedback();
updateHearts();
})(globalThis);
