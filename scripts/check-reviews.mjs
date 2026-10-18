import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const js=fs.readFileSync('assets/reviews.js','utf8');
new vm.Script(js);
assert.ok(!js.includes('innerHTML'), 'User reviews must be rendered as text');
assert.ok(!/sb_secret_|service_role/.test(js),'No privileged key in client');
assert.ok(js.includes('sb_publishable_'),'Public key configured');
assert.ok(js.includes('AbortController'),'Network timeout');
assert.ok(js.includes("result==='pending'"),'Submission status validated');
assert.ok(js.includes('p_receipt:receipt'),'Idempotency receipt sent');
assert.ok(js.includes('p_consent:consent.checked'),'Consent transmitted');
assert.ok(!js.includes('aggregateRating'),'No fabricated aggregate rating');
assert.ok(js.includes('.recipe-card,.latest-item,#hero-content'),'All homepage layouts supported');
const textFunction=js.slice(js.indexOf('function summaryText('),js.indexOf('function decorateCards('));
const summary=vm.runInNewContext('('+textFunction.trim()+')');
const photoFunction=js.slice(js.indexOf('async function preparePhoto('),js.indexOf('function summaryText('));
let closed=0, canvas;
const prepare=vm.runInNewContext('('+photoFunction.trim()+')',{
 createImageBitmap:async()=>({width:1920,height:1080,close(){closed++;}}),
 document:{createElement(){canvas={getContext:()=>({fillRect(){},drawImage(){}}),toDataURL:()=> 'data:image/jpeg;base64,/9j/2Q=='};return canvas;}},
 atob:s=>Buffer.from(s,'base64').toString('binary')
});
assert.equal(await prepare(null),null);
await assert.rejects(prepare({type:'image/svg+xml',size:100}),/INVALID_PHOTO/);
await assert.rejects(prepare({type:'image/jpeg',size:9*1024*1024}),/INVALID_PHOTO/);
assert.equal(await prepare({type:'image/jpeg',size:1000}),'/9j/2Q==');
assert.equal(canvas.width,960);assert.equal(canvas.height,540);assert.equal(closed,1);
const photoSql=fs.readFileSync('supabase/migrations/20261018_review_photos.sql','utf8');
for(const guard of ['102400','20971520','INVALID_PHOTO','PHOTO_LIMIT',"r.status='approved'",'ltm_clear_review_photo'])assert.ok(photoSql.includes(guard),guard);
assert.equal(summary({review_count:0,average_rating:null}),'Pas encore d’avis');
assert.equal(summary(undefined),'Avis indisponibles');
assert.equal(summary({review_count:2,average_rating:4.5}),'★ 4,5/5 · 2 avis');
assert.equal(summary({review_count:1,average_rating:4}),'★ 4/5 · 1 avis');
assert.ok(!js.includes('La moyenne inclut uniquement'), 'Detailed policy stays in privacy page');
assert.equal(summary({review_count:1,average_rating:9}),'Avis indisponibles');
let forms=0;
for(const file of fs.readdirSync('recettes').filter(f=>f.endsWith('.html'))) {
 const html=fs.readFileSync('recettes/'+file,'utf8');
 assert.equal((html.match(/src="\/assets\/reviews.js\?v=20261018-1"/g)||[]).length,1,file);
 if(html.includes('</main>')){
  assert.equal((html.match(/id="avis"/g)||[]).length,1,file);
  assert.ok(html.includes('aria-labelledby="avis-title"'));
  forms++;
 }
}
assert.equal(forms,63,'63 recipe documents; one legacy redirect');
for(const file of ['index.html','toutes-les-recettes.html'])assert.ok(fs.readFileSync(file,'utf8').includes('/assets/reviews.js'));
const sql=fs.readFileSync('supabase/migrations/20261015_reviews.sql','utf8');
assert.equal((sql.match(/security definer set search_path = ''/g)||[]).length,4);
assert.ok(sql.includes('enable row level security'));
assert.ok(sql.includes('from public, anon, authenticated'));
assert.ok(sql.includes("r.status='approved'"));
assert.ok(sql.includes('pg_advisory_xact_lock'));
assert.ok(sql.includes('REVIEW_LIMIT'));
assert.ok(fs.readFileSync('confidentialite.html','utf8').includes('id="avis"'));
console.log('Avis : 63 formulaires, cartes, affichage sans faux chiffres, protections et clé publique contrôlés.');

