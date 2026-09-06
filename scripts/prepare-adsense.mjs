// Associer le site au compte AdSense sans charger de script publicitaire.
import fs from 'node:fs';
const meta = '<meta name="google-adsense-account" content="ca-pub-4732923807982186">';
for (const file of [...fs.readdirSync('.').filter(f => f.endsWith('.html')), ...['recettes', 'guides'].flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.html')).map(f => `${d}/${f}`))]) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('name="google-adsense-account"')) fs.writeFileSync(file, html.replace(/<head>/i, '<head>\n' + meta));
}
