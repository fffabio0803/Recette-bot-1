import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = fs.readFileSync('assets/advertising-consent.js', 'utf8');
const urls = [...fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)];
for (const [, url] of urls) {
  const file = new URL(url).pathname.slice(1) || 'index.html';
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/src="\/assets\/advertising-consent.js\?v=20261027-1"/g) || []).length, 1, file);
  assert.ok(html.indexOf('/assets/analytics-consent.js') < html.indexOf('/assets/advertising-consent.js'), file);
  assert.ok(html.indexOf('/assets/advertising-consent.js') < html.indexOf('</head>'), 'Loader outside head: ' + file);
}
assert.ok(!source.includes('adsbygoogle.push'), 'Do not request ad units');
assert.ok(!source.includes("gtag("), 'Do not change the independent Analytics consent');
assert.ok(!source.includes('localStorage'), 'Google owns advertising consent storage');
const nodes = [];
function element(tag) {
  const e = { tag, style: {}, dataset: {}, children: [], handlers: {},
    appendChild(child) { this.children.push(child); nodes.push(child); },
    setAttribute(key, value) { this[key] = value; },
    addEventListener(key, callback) { this.handlers[key] = callback; }
  };
  return e;
}
const footer = element('footer'), head = element('head');
const document = {
  head, body: element('body'), createElement: element,
  getElementById: id => nodes.find(e => e.id === id),
  querySelector: s => s === 'footer' ? footer : nodes.find(e => e.dataset.ltmAdsense)
};
const window = {};
vm.runInNewContext(source, {window, document});
const button = nodes.find(e => e.tag === 'button');
const status = nodes.find(e => e.role === 'status');
button.handlers.click();
assert.equal(status.hidden, false, 'Show an explanation when CMP is unavailable');
assert.equal(head.children.length, 1);
assert.equal(head.children[0].crossOrigin, 'anonymous');
assert.match(head.children[0].src, /client=ca-pub-4732923807982186$/);
let revoked = 0;
window.googlefc.showRevocationMessage = () => { revoked++; };
window.googlefc.callbackQueue[0].CONSENT_API_READY();
assert.equal(status.hidden, true);
button.handlers.click();
assert.equal(revoked, 0, 'Use the official callback queue');
window.googlefc.callbackQueue[1]();
assert.equal(revoked, 1);
vm.runInNewContext(source, {window, document});
assert.equal(head.children.length, 1, 'No duplicate tag or controls');
console.log('Consentement publicitaire : 31 pages, chargement unique, retrait et indisponibilité testés.');
