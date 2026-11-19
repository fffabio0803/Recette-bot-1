import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
await import('../assets/placard-match.js');
let focused=null;
class Element {
 constructor(){this.handlers={};this.children=[];this.value='';this.disabled=false;this.attrs={};this.textContent='';}
 replaceChildren(...nodes){this.children=nodes;}
 append(node){this.children.push(node);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn,capture=false){(this.handlers[k]??=[]).push({fn,capture});}
 emit(k,extra={}){for(const h of [...(this.handlers[k]||[])].sort((a,b)=>Number(b.capture)-Number(a.capture)))h.fn({key:'',preventDefault(){},...extra});}
 focus(){focused=this;}
 querySelector(selector){return selector==='form'?form:this.children.find(x=>x.tag==='button');}
}
const form=new Element(),nodes=new Map();
const $=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
const document={title:'',querySelector:$,createElement(tag){const e=new Element();e.tag=tag;return e;}};
const location={hash:'#placard'},events={};
const window={LTMPlacard:globalThis.LTMPlacard,addEventListener(k,fn){events[k]=fn;}};
vm.runInNewContext(fs.readFileSync('assets/placard-ui.js','utf8'),{document,window,location});
const input=$('#ingredient-search'),status=$('#stock-status'),stock=$('#produits'),submit=$('#find-recipes');
const enter=s=>{input.value=s;input.emit('keydown',{key:'Enter'});};
const reset=()=>$('#empty-stock').emit('click');
assert.equal(submit.disabled,true);
enter('marrons');enter('châtaignes');assert.equal(stock.value.split(',').length,1);
reset();enter('poireau');enter('poireaux');assert.equal(stock.value.split(',').length,1);
reset();enter('pâtes');input.value='crème';
let readAtSearch;form.addEventListener('submit',()=>readAtSearch=stock.value);
form.emit('submit');assert.match(readAtSearch,/Pâtes, crème/);
assert.equal(input.value,'');assert.equal(submit.disabled,false);
$('#ingredient-stock').children[0].emit('click');assert.equal(stock.value,'crème');
reset();assert.equal(stock.value,'');assert.equal(submit.disabled,true);
input.value='œu';input.emit('input');assert.ok($('#ingredient-choices').children.some(e=>e.textContent==='+ Œufs'));
input.emit('keydown',{key:'ArrowDown'});assert.equal(focused,$('#ingredient-choices').children[0]);
input.emit('keydown',{key:'Escape'});assert.equal(input.value,'');
enter('ingredient libre');assert.equal(stock.value,'ingredient libre');
reset();for(let i=0;i<21;i++)enter('aliment '+i);
assert.equal(stock.value.split(',').length,20);assert.match(status.textContent,/20 ingrédients maximum/);
location.hash='#outils';events.hashchange();assert.equal($('#placard').hidden,true);
location.hash='#placard';events.hashchange();assert.equal($('#tools-home').hidden,true);
console.log('Saisie Mon placard : clavier, synonymes, dernier ingrédient, retrait, remise à zéro et limite de 20 testés.');
