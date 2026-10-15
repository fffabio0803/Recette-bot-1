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
assert.equal(summary({review_count:0,average_rating:null}),'Pas encore d’avis');
assert.equal(summary(undefined),'Avis indisponibles');
assert.equal(summary({review_count:2,average_rating:4.5}),'★ 4,5/5 · 2 avis');
assert.equal(summary({review_count:1,average_rating:4}),'★ 4/5 · 1 avis');
assert.ok(!js.includes('La moyenne inclut uniquement'), 'Detailed policy stays in privacy page');
assert.equal(summary({review_count:1,average_rating:9}),'Avis indisponibles');
let forms=0;
for(const file of fs.readdirSync('recettes').filter(f=>f.endsWith('.html'))) {
 const html=fs.readFileSync('recettes/'+file,'utf8');
 assert.equal((html.match(/src="\/assets\/reviews.js\?v=20261015-3"/g)||[]).length,1,file);
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

