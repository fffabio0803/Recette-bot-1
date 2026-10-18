import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
// Isolated form tests: no network, no real review or browser storage.
const nodes=[];
class Element {
 constructor(tag){this.tag=tag;this.children=[];this.events={};this.value='';this.style={};this.classList={toggle(){}};nodes.push(this);}
 append(...items){this.children.push(...items);}
 after(){}
 replaceChildren(...items){this.children=items;}
 setAttribute(k,v){this[k]=v;}
 removeAttribute(k){delete this[k];}
 addEventListener(k,v){this.events[k]=v;}
 focus(){this.focused=true;}
 scrollIntoView(){}
 checkValidity(){return true;}
 setCustomValidity(){}
 querySelector(s){return this.querySelectorAll(s)[0]||null;}
 querySelectorAll(s){const all=this.children.flatMap(n=>n instanceof Element?[n,...n.querySelectorAll('*')]:[]);return all.filter(n=>s==='*'||(s==='input:checked'&&n.tag==='input'&&n.checked)||(s==='label'&&n.tag==='label'));}
}
const section=new Element('section'),main=new Element('main'),heading=new Element('h1');main.append(section);
const oldReceipt=randomUUID(),oldAuthor=randomUUID(),slug='roules-cannelle-moelleux';
let storage=JSON.stringify({author:oldAuthor,receipts:{[slug]:oldReceipt}}),fail=false;
const requests=[];
const context={
 document:{createElement:t=>new Element(t),createTextNode:t=>t,getElementById:id=>id==='avis'?section:null,querySelector:s=>s==='h1'?heading:s==='main'?main:nodes.find(n=>n.className===s.slice(1)),querySelectorAll:()=>[],body:main},
 location:{pathname:'/recettes/'+slug+'.html'},localStorage:{getItem:()=>storage,setItem:(k,v)=>{storage=v;}},
 crypto:{randomUUID},MutationObserver:class{observe(){}},requestAnimationFrame(){},URL,AbortController,setTimeout,clearTimeout,
 FormData:class{constructor(form){this.form=form;}get(name){return this.form.querySelectorAll('*').find(n=>n.name===name&&n.checked)?.value;}},
 fetch:async(url,opts)=>{const data=JSON.parse(opts.body);if(url.includes('submit')||url.includes('edit_review')){requests.push({url,data});if(fail)throw new Error('offline');return {ok:true,json:async()=> 'approved'};}return {ok:true,json:async()=>[]};}
};
vm.runInNewContext(fs.readFileSync('assets/reviews.js','utf8'),context);
const form=nodes.find(n=>n.className==='ltm-review-form'),mode=nodes.find(n=>n.name==='review_mode');
const message=nodes.find(n=>n.className==='ltm-review-status'),name=nodes.find(n=>n.name==='nickname'),comment=nodes.find(n=>n.name==='comment');
const consent=nodes.find(n=>n.name==='consent'),other=nodes.find(n=>n.type==='checkbox'&&!n.name);
const editCode=nodes.find(n=>n.type==='password');
const submit=()=>form.events.submit({preventDefault(){}});
await submit();assert.match(message.textContent,/Choisissez une action/);assert.equal(requests.length,0);
mode.value='other';mode.events.change();await submit();assert.match(message.textContent,/Confirmez/);
other.checked=true;await submit();assert.match(message.textContent,/Choisissez une note/);
nodes.find(n=>n.name==='rating'&&n.value==='4').checked=true;await submit();assert.match(message.textContent,/pseudonyme/);
name.value='Testeur';comment.value='Court';await submit();assert.match(message.textContent,/20 à 2 000/);
comment.value='Très bonne recette, résultat moelleux.';await submit();assert.match(message.textContent,/Cochez votre accord/);
consent.checked=true;fail=true;await submit();const attempt=requests.at(-1);assert.match(message.textContent,/Envoi non confirmé/);
fail=false;await submit();assert.equal(requests.at(-1).data.p_receipt,attempt.data.p_receipt);assert.equal(requests.at(-1).data.p_author,attempt.data.p_author);
assert.notEqual(attempt.data.p_receipt,oldReceipt);assert.notEqual(attempt.data.p_author,oldAuthor);
assert.equal(mode.value,'');assert.match(message.textContent,/Votre avis est publié/);
mode.value='edit';mode.events.change();await submit();assert.match(message.textContent,/code privé/);
editCode.value=oldReceipt;name.value='Testeur';comment.value='Recette difficile, résultat trop sec.';consent.checked=true;
await submit();assert.match(requests.at(-1).url,/ltm_edit_review$/);assert.equal(requests.at(-1).data.p_receipt,oldReceipt);assert.equal(requests.at(-1).data.p_photo_mode,'keep');
assert.equal(requests.at(-1).data.p_author,undefined);assert.equal(editCode.value,'');
assert.equal(JSON.parse(storage).history,undefined);
console.log('Parcours avis : erreurs visibles, autre personne, reprise réseau sans doublon, modification par code privé.');
