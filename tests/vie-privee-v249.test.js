// =====================================================================
//  TESTS — v6.249 : VIE PRIVÉE (polices auto-hébergées + dossier RGPD)
//  ---------------------------------------------------------------------
//  Avant : les 16 pages chargeaient Fredoka, Atkinson Hyperlegible et
//  Noto Sans depuis fonts.googleapis.com — l'adresse IP de chaque
//  patient partait chez Google à chaque ouverture, sans consentement.
//  Pour une application de santé, c'est exactement le transfert que le
//  RGPD sanctionne (des sites ont été condamnés pour ce seul motif).
//
//  Désormais : 18 fichiers woff2 dans fonts/, déclarés par
//  css/fonts.css (générée depuis @fontsource, mêmes unicode-range),
//  pré-cachés pour le hors-ligne. Et docs/RGPD.md documente les
//  traitements réels — durées, droits, sous-traitants, lacunes.
//
//  Lancer : node tests/vie-privee-v249.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const HTML_FILES = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

async function main(){

console.log('Polices — plus un seul octet vers Google au chargement');

await test('AUCUNE page ne référence fonts.googleapis.com ni fonts.gstatic.com', ()=>{
  const coupables = [];
  for(const f of HTML_FILES){
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if(/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(src)) coupables.push(f);
  }
  assert.strictEqual(coupables.length, 0,
    `l'IP des patients repartirait chez Google : ${coupables.join(', ')}`);
});

await test('les 16 pages chargent css/fonts.css à la place', ()=>{
  const sans = HTML_FILES.filter(f => !fs.readFileSync(path.join(ROOT, f), 'utf8').includes('css/fonts.css'));
  assert.strictEqual(sans.length, 0, `sans polices locales : ${sans.join(', ')}`);
});

await test('css/fonts.css : chaque fichier déclaré existe, chaque fichier sur disque est déclaré', ()=>{
  const css = fs.readFileSync(path.join(ROOT, 'css/fonts.css'), 'utf8');
  const declares = new Set([...css.matchAll(/fonts\/([a-z0-9-]+\.woff2)/g)].map(m => m[1]));
  const disque = new Set(fs.readdirSync(path.join(ROOT, 'fonts')).filter(f => f.endsWith('.woff2')));
  const absents = [...declares].filter(f => !disque.has(f));
  const orphelins = [...disque].filter(f => !declares.has(f));
  assert.strictEqual(absents.length, 0, `déclarés mais absents : ${absents.join(', ')}`);
  assert.strictEqual(orphelins.length, 0, `sur disque mais jamais déclarés : ${orphelins.join(', ')}`);
});

await test('les trois familles sont couvertes, avec les poids réellement utilisés', ()=>{
  const css = fs.readFileSync(path.join(ROOT, 'css/fonts.css'), 'utf8');
  for(const fam of ['Fredoka', 'Atkinson Hyperlegible', 'Noto Sans']){
    assert.ok(css.includes(`font-family: '${fam}'`), `${fam} absente de fonts.css`);
  }
  // latin-ext est indispensable : sans lui, le polonais (ł, ż) et le
  // turc (ğ, ş, ı) retomberaient sur une police de secours au milieu
  // d'un mot — illisible pour un public aphasique.
  assert.ok(/latin-ext/.test(css), 'sous-ensemble latin-ext manquant');
  assert.ok(/font-display: swap/.test(css), 'font-display:swap manquant (texte invisible pendant le chargement sinon)');
});

await test('les polices sont pré-cachées : elles marchent hors-ligne (avant, non)', ()=>{
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(sw.includes("'./css/fonts.css'"), 'css/fonts.css absent du cache');
  const disque = fs.readdirSync(path.join(ROOT, 'fonts')).filter(f => f.endsWith('.woff2'));
  const manquants = disque.filter(f => !sw.includes(`'./fonts/${f}'`));
  assert.strictEqual(manquants.length, 0, `hors cache : ${manquants.join(', ')}`);
});

console.log('\nDossier RGPD — fondé sur le code, pas sur des intentions');

await test('docs/RGPD.md existe, substantiel, et référencé dans le portail', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/RGPD.md'), 'utf8');
  assert.ok(doc.length > 4000, 'document trop court pour un registre');
  assert.ok(fs.readFileSync(path.join(ROOT, 'docs/INDEX.md'), 'utf8').includes('RGPD.md'));
});

await test('le registre couvre chaque table réelle du schéma', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/RGPD.md'), 'utf8');
  const schema = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  const tables = [...new Set([...schema.matchAll(/create table(?: if not exists)? +([a-z_]+)/gi)].map(m => m[1]))]
    .filter(t => t !== 'if');
  const oubliees = tables.filter(t => !doc.includes('`' + t + '`'));
  assert.strictEqual(oubliees.length, 0,
    `tables absentes du registre : ${oubliees.join(', ')} — un traitement non documenté est un traitement caché`);
});

await test('le registre s\'appuie sur les droits RÉELS (export + suppression, testés)', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/RGPD.md'), 'utf8');
  assert.ok(/exportMyData/.test(doc) && /delete_patient_account/.test(doc),
    'le registre doit citer les mécanismes réels, pas des intentions');
  // et ces mécanismes existent vraiment dans le code
  assert.ok(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8').includes('function exportMyData'));
  assert.ok(fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8').includes('delete_patient_account'));
});

await test('le registre assume ses lacunes (HDS, GitHub Pages, DPO) au lieu de les taire', ()=>{
  const doc = fs.readFileSync(path.join(ROOT, 'docs/RGPD.md'), 'utf8');
  for(const l of ['HDS', 'GitHub Pages', 'DPO']){
    assert.ok(doc.includes(l), `lacune non documentée : ${l}`);
  }
  assert.ok(/pas un avis juridique/i.test(doc), 'l\'avertissement de non-conseil juridique doit rester');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
