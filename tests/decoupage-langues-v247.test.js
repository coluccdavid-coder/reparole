// =====================================================================
//  TESTS — v6.247 : LE DÉCOUPAGE DES LANGUES
//  ---------------------------------------------------------------------
//  Les 14 langues vivaient dans js/i18n.js (735 Ko) chargé intégralement
//  pour n'en utiliser qu'une. Elles vivent désormais dans
//  js/i18n/<code>.js. Ce fichier verrouille les invariants du montage :
//
//  - le FRANÇAIS est toujours chargé (repli inconditionnel de I18N.t() :
//    sans lui, une clé manquante ferait planter au lieu d'afficher du
//    français) — dans les pages ET dans le cache hors-ligne ;
//  - les 13 autres langues ne sont PAS pré-chargées (les précacher
//    annulerait le bénéfice du découpage) ;
//  - chaque fichier de langue s'enregistre par I18N.register() et son
//    contenu est complet (même jeu de clés que le français) ;
//  - le changement de langue charge le fichier AVANT de basculer, et un
//    échec réseau retombe sur le français au lieu de bloquer ;
//  - le poids de l'app patient a réellement baissé, et le budget suit.
//
//  Lancer : node tests/decoupage-langues-v247.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const I18N_SRC = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const SW = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const LANG_DIR = path.join(ROOT, 'js/i18n');
const LANG_FILES = fs.readdirSync(LANG_DIR).filter(f => f.endsWith('.js'));

// Évalue i18n.js + un sous-ensemble de langues dans un bac à sable.
function chargeI18N(langsAcharger){
  const sandbox = {
    window: {},
    document: { documentElement:{}, createElement:()=>({}), head:{appendChild(){}}, querySelectorAll:()=>[] },
    navigator: { language:'fr' },
    localStorage: { getItem:()=>null, setItem:()=>{} },
    console: { warn(){}, log(){} },
    Promise, Math, JSON, Array, Object, Error
  };
  vm.createContext(sandbox);
  vm.runInContext(I18N_SRC, sandbox);
  for(const l of langsAcharger){
    vm.runInContext(fs.readFileSync(path.join(LANG_DIR, l + '.js'), 'utf8'), sandbox);
  }
  vm.runInContext('globalThis.__S = I18N_STRINGS; globalThis.__I = I18N;', sandbox);
  return sandbox;
}

async function main(){

console.log('Structure — un fichier par langue, tous enregistrés');

await test('les 14 langues ont chacune leur fichier js/i18n/<code>.js', ()=>{
  assert.strictEqual(LANG_FILES.length, 14, `14 fichiers attendus, trouvé ${LANG_FILES.length}`);
});

await test('chaque fichier de langue passe par I18N.register (jamais d\'affectation directe)', ()=>{
  for(const f of LANG_FILES){
    const src = fs.readFileSync(path.join(LANG_DIR, f), 'utf8');
    assert.ok(/I18N\.register\(/.test(src), `${f} ne s'enregistre pas via I18N.register()`);
  }
});

await test('chaque langue enregistre EXACTEMENT le même jeu de clés que le français', ()=>{
  const sb = chargeI18N(LANG_FILES.map(f => f.replace('.js','')));
  const S = sb.__S;
  const fr = Object.keys(S.fr).sort();
  assert.ok(fr.length >= 700, `français suspect : ${fr.length} clés`);
  for(const l of Object.keys(S)){
    const k = Object.keys(S[l]).sort();
    assert.deepStrictEqual(k, fr, `${l} : jeu de clés différent du français`);
  }
});

console.log('\nLe français, repli inconditionnel — toujours présent');

await test('I18N.t() retombe sur le français quand la langue active n\'est pas chargée', ()=>{
  const sb = chargeI18N(['fr']);       // seule fr est chargée
  // Dans un navigateur, `window.Prefs` et le global `Prefs` sont une seule
  // et même chose ; dans le bac à sable, il faut poser les deux.
  vm.runInContext("var Prefs = { data: { lang: 'ja' } }; window.Prefs = Prefs;", sb);
  const v = vm.runInContext("I18N.t('app_name')", sb);
  assert.strictEqual(v, sb.__S.fr.app_name, 'devrait servir la valeur française plutôt que planter');
});

await test('index.html, aidant.html et dashboard-ortho.html chargent js/i18n/fr.js en dur', ()=>{
  for(const p of ['index.html','aidant.html','dashboard-ortho.html']){
    const src = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert.ok(/src="js\/i18n\/fr\.js"/.test(src), `${p} ne charge pas le français`);
    assert.ok(/js\/i18n\/' \+ l \+ '\.js/.test(src), `${p} ne pré-charge pas la langue mémorisée`);
  }
});

await test('sw.js pré-cache le français, et SEULEMENT le français', ()=>{
  assert.ok(SW.includes("'./js/i18n/fr.js'"), 'fr.js absent du cache hors-ligne — l\'app casserait hors-ligne');
  const autres = LANG_FILES.map(f=>f.replace('.js','')).filter(l=>l!=='fr')
    .filter(l => SW.includes(`'./js/i18n/${l}.js'`));
  assert.strictEqual(autres.length, 0,
    `pré-cachées à tort : ${autres.join(', ')} — ça annule le bénéfice du découpage`);
});

console.log('\nChangement de langue — charger d\'abord, basculer ensuite');

await test('I18N.charger() existe, dédoublonne les appels simultanés, et I18N.appliquer() ne peut pas échouer', ()=>{
  assert.ok(/_chargementsLangue\[code\]/.test(I18N_SRC), 'pas de dédoublonnage des chargements simultanés');
  const appliquer = I18N_SRC.slice(I18N_SRC.indexOf('I18N.appliquer'), I18N_SRC.indexOf('window.I18N ='));
  assert.ok(/\.catch\(/.test(appliquer), 'un échec réseau doit être rattrapé (repli français), jamais propagé');
});

await test('Prefs.setLang charge la langue AVANT de basculer, et bascule quand même si le réseau échoue', ()=>{
  const prefs = fs.readFileSync(path.join(ROOT, 'js/prefs.js'), 'utf8');
  assert.ok(/I18N\.charger\(lang\)\.then\(suite, suite\)/.test(prefs),
    'le repli en cas d\'échec doit basculer quand même (français) plutôt que figer l\'écran');
});

await test('un fichier chargé mais vide n\'est PAS compté comme une langue disponible', ()=>{
  const charger = I18N_SRC.slice(I18N_SRC.indexOf('I18N.charger'), I18N_SRC.indexOf('I18N.appliquer'));
  assert.ok(/estChargee\(code\)\)\s*resoudre/.test(charger.replace(/\n/g,' ')) || /estChargee\(code\)/.test(charger),
    'le onload doit vérifier que le fichier a réellement enregistré quelque chose');
});

console.log('\nLe gain est réel — et le budget le protège');

await test('js/i18n.js (le cœur) reste un petit fichier de mécanique, pas un dictionnaire', ()=>{
  const ko = Math.round(fs.statSync(path.join(ROOT, 'js/i18n.js')).size / 1024);
  assert.ok(ko < 40, `js/i18n.js pèse ${ko} Ko — un dictionnaire est revenu dedans ?`);
});

await test('l\'app patient est passée sous 2 Mo (elle en pesait 2,5 avant le découpage)', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let total = fs.statSync(path.join(ROOT, 'index.html')).size;
  [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].forEach(m=>{
    const f = path.join(ROOT, m[1]);
    if(fs.existsSync(f)) total += fs.statSync(f).size;
  });
  const ko = Math.round(total / 1024);
  assert.ok(ko < 2048, `l'application patient pèse ${ko} Ko — au-dessus du plafond de 2048 Ko`);
  console.log(`      (poids actuel : ${ko} Ko, langue française incluse)`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
