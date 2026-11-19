import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
await import('../assets/placard-match.js');
const {canonical,matches,rank}=globalThis.LTMPlacard;
const cases=[
 ['200 ml de lait de coco','lait',false],['200 ml de lait de coco','lait de coco',true],
 ['125 ml de lait entier','lait',true],
 ['600 g de poireaux','poireau',true],['600 g de poireaux','poireaux',true],
 ['800 g de pommes de terre','pomme',false],['4 pommes Golden','pomme',true],
 ['800 g de pommes de terre','patates',true],['patate douce','pommes de terre',false],
 ['une noix de muscade','noix',false],['noix de coco','noix',false],['50 g de noix','noix',true],
 ['1 c. à café de levure chimique','café',false],['1 cuillère à café de sel','café',false],
 ['150 ml de café fort','café',true],['1 c. à café de café soluble','café',true],
 ['beurre à la place de huile de coco','huile de coco',false],
 ['marrons cuits (pas de crème de marrons)','crème',false],
 ['160 g de châtaignes','marrons',true],['160 g de marrons','châtaignes',true],
 ['1 dorade','daurade',true],['1 daurade','dorade',true],
 ['fromage de chèvre','chèvre',true],['chèvre frais','fromage de chèvre',true],
 ['levure de boulanger fraîche','levure boulangère',true],
 ['levure chimique','levure boulangère',false],
 ['300 g de tagliatelles','pâtes',true],['pâte brisée','pâtes',false],['farine pour la pâte','pâtes',false],
 ['20 g de fécule de maïs','maïs',false],['200 g de maïs égoutté','maïs',true],
 ['4 œufs','oeuf',true],['pois chiches','pois chiche',true],['choux','chou',true]
];
for(const [item,term,expected] of cases) assert.equal(matches(item,term),expected,item+' / '+term);
for(const food of ['pâtes','maïs','noix','pois','riz','poireaux','choux','œufs','marrons','pommes de terre','dorade','chèvre','levure de boulanger']) assert.equal(canonical(canonical(food)),canonical(food),food);
const html=fs.readFileSync('outils.html','utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function placard(recipes)'));
const recipes=JSON.parse(source.slice(source.lastIndexOf('})([')+3).replace(/\);\s*$/,''));
const ideaCode=source.slice(source.indexOf('const ideas='),source.indexOf('const allRecipes='));
const ideas=vm.runInNewContext('(function(){'+ideaCode+';return ideas;})()');
const all=[...recipes,...ideas.map(([title,ingredients,method])=>({title,ingredients,method}))];
assert.equal(rank(all,['pâtes','crème'])[0].r.title,'Pâtes à la crème et au parmesan');
assert.equal(all.filter(r=>r.title==='Pâtes à la crème et au parmesan').length,1,'La fiche complète remplace son idée express');
assert.equal(rank([{title:'Fiche',url:'/fiche',ingredients:['pâtes']},{title:'Idée',ingredients:['pâtes','crème']}],['pâtes','crème'])[0].r.title,'Idée','La couverture prime sur le format');
assert.ok(!rank(all,['pomme']).some(x=>/gratin|terre/i.test(x.r.title)));
assert.ok(rank(all,['poireau']).some(x=>/Gratin de poireaux/.test(x.r.title)));
assert.ok(!rank(all,['café']).some(x=>/Cookies|Banana|Pavlova/.test(x.r.title)));
assert.equal(rank(all,['marrons','châtaignes'])[0].percent,100);
const catalogue=JSON.parse(fs.readFileSync('recettes.json','utf8')).recettes;
function findRecipe(x){if(x?.['@type']==='Recipe')return x; for(const y of x?.['@graph']||[]) {const r=findRecipe(y);if(r)return r;}}
for(const r of catalogue){
 const page=fs.readFileSync(r.url,'utf8');
 const schema=[...page.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)].map(m=>findRecipe(JSON.parse(m[1]))).find(Boolean);
 assert.ok(schema?.recipeIngredient?.length,r.slug);
 assert.ok(schema.recipeInstructions.length>=3,r.slug);
 const pantry=recipes.find(p=>p.url.replace(/^\//,'')===r.url.replace(/^\//,''));
 assert.ok(pantry,r.slug+' missing in pantry');
 const strip=s=>s.normalize('NFC').replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
 assert.deepEqual(pantry.ingredients.map(strip),schema.recipeIngredient.map(strip),r.slug+' ingredient mismatch');
}
console.log('Qualité Mon placard : '+cases.length+' cas ciblés, synonymes, '+ideas.length+' idées express et '+catalogue.length+' fiches synchronisées.');
