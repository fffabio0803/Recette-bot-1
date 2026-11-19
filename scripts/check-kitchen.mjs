import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/kitchen.js','utf8'), context={};
vm.runInNewContext(source,context);
const core=context.LTMKitchenCore;
assert.equal(core.clean(null).favorites.length,0);
assert.equal(core.load({getItem(){return '{broken'}}).shopping.length,0);
assert.equal(core.load({getItem(){throw Error('blocked')}}).favorites.length,0);
assert.equal(core.save({setItem(){throw Error('quota')}},{}),false);
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
const data={favorites:[{title:'Pâtes',url:'/recettes/pates-creme-parmesan.html'},{title:'Unsafe',url:'javascript:alert(1)'},{title:'External',url:'https://example.org/a'}],shopping:[{title:'Pâtes',items:[{text:'80 g parmesan',checked:true,group:'Indispensable'},null,{}],url:'javascript:alert(1)'}]};
assert.equal(core.save(storage,data),true);
const restored=core.load(storage);
assert.equal(restored.favorites.length,1);
assert.equal(restored.shopping[0].items.length,1);
assert.equal(restored.shopping[0].items[0].checked,true);
assert.equal(restored.shopping[0].url,'');
assert.equal(core.clean({favorites:Array(120).fill(data.favorites[0])}).favorites.length,100);
assert.equal(core.steps({recipeInstructions:[{itemListElement:[{text:'Une étape',name:'Préparer'}]},'Puis cuire']}).length,2);
assert.ok(!/fetch\s*\(|XMLHttpRequest|innerHTML|sendBeacon/.test(source),'Le module cuisine reste local et utilise textContent');
assert.ok(source.includes('#securite-gravlax'),'Précautions gravlax conservées');
const recipes=JSON.parse(fs.readFileSync('recettes.json','utf8')).recettes;
const manifest=JSON.parse(fs.readFileSync('assets/responsive-images.json','utf8'));
for(const [original,info] of Object.entries(manifest)){
 assert.ok(fs.existsSync('.'+original),original);
 assert.ok(info.width>0&&info.height>0);
 for(const variant of info.variants){assert.ok(fs.existsSync('.'+variant.src),variant.src);assert.ok(variant.width<=info.width);}
}
for(const r of recipes){
 const html=fs.readFileSync(r.url,'utf8');
 assert.equal((html.match(/src="\/assets\/kitchen.js/g)||[]).length,1,r.url);
 assert.ok(html.includes('/assets/kitchen.css'),r.url);
 const schemas=[...html.matchAll(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const d=JSON.parse(m[1]);return d['@graph']||[d];});
 const recipe=schemas.find(x=>x['@type']==='Recipe');
 assert.ok(recipe?.recipeIngredient?.length&&core.steps(recipe).length,r.url);
 for(const m of html.matchAll(/<img\b[^>]*>/g)){
  const src=m[0].match(/\bsrc=['"]([^'"]+)['"]/)?.[1];if(!src)continue;
  const path=new URL(src,'https://latablemijote.fr/'+r.url).pathname;
  if(manifest[path])assert.ok(/\bsrcset=/.test(m[0])&&/\bwidth=/.test(m[0])&&/\bheight=/.test(m[0]),r.url+' responsive '+path);
 }
}
const feedback=['roules-cannelle-moelleux','quiche-lorraine-recette-authentique','boeuf-bourguignon-recette-traditionnelle'];
for(const slug of feedback)assert.ok(fs.readFileSync('recettes/'+slug+'.html','utf8').includes('<details class="kitchen-feedback">'));
assert.ok(fs.readFileSync('outils.html','utf8').includes('Ajouter les manquants'));
assert.ok(fs.readFileSync('assets/kitchen.css','utf8').includes('@media print'));
console.log('Cuisine : stockage, erreurs, liens sûrs, étapes, '+recipes.length+' fiches et '+Object.keys(manifest).length+' images adaptés vérifiés.');
