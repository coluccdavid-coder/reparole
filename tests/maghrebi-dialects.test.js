// =====================================================================
//  TESTS — Dialectes maghrébins : algérien, marocain, tunisien (v6.94)
//  ---------------------------------------------------------------------
//  Ajoutés à la demande explicite de l'utilisateur, en langues
//  PARTIELLES (comme le kabyle) — pas en langues complètes comme le
//  japonais, volontairement, vu le risque de qualité plus élevé pour
//  des dialectes avant tout parlés. Vérifie l'enregistrement correct
//  (LANGUAGES, PARTIAL_LANGS), et que chaque dialecte utilise bien ses
//  marqueurs possessifs distinctifs (تاع algérien / ديال marocain /
//  متاع tunisien) — pas trois copies identiques du même texte.
//
//  v6.102 : le socle n'est plus figé à 22 clés — extension progressive
//  de l'interface (demande explicite de l'utilisateur : trop d'écrans
//  restaient en français). On vérifie maintenant que rien n'a régressé
//  par rapport au socle kabyle, et que les trois dialectes restent
//  synchronisés entre eux au fil de l'extension.
//
//  Lancer : node tests/maghrebi-dialects.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function loadPatientApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable', pretendToBeVisual:true });
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    if(src === 'js/storage.js'){
      code = code.replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
                  .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    dom.window.eval(code);
  }
  dom.window.eval("Prefs.load();");
  return dom;
}

async function main(){

console.log('Enregistrement des trois dialectes');

await test('dz, ma, tn présents dans LANGUAGES avec un libellé propre et sans voix (speechLocale:null)', ()=>{
  const dom = loadPatientApp();
  ['dz','ma','tn'].forEach(code=>{
    const lang = dom.window.LANGUAGES[code];
    assert.ok(lang, `LANGUAGES.${code} manquant`);
    assert.strictEqual(lang.dir, 'rtl');
    assert.strictEqual(lang.speechLocale, null, `${code} ne devrait avoir aucune voix (aucun navigateur n'en propose pour ces dialectes)`);
    assert.ok(lang.label.length > 0);
  });
});

await test('dz, ma, tn présents dans PARTIAL_LANGS (pas des langues complètes, volontairement)', ()=>{
  const dom = loadPatientApp();
  ['dz','ma','tn'].forEach(code=>{
    assert.ok(dom.window.PARTIAL_LANGS.includes(code), `${code} doit être une langue partielle`);
  });
});

await test('le sélecteur de langue les propose bien tous les trois (généré automatiquement depuis LANGUAGES)', ()=>{
  const dom = loadPatientApp();
  const select = dom.window.document.querySelector('.lang-select');
  const values = [...select.querySelectorAll('option')].map(o=>o.value);
  assert.ok(values.includes('dz') && values.includes('ma') && values.includes('tn'));
});

console.log('\nSocle : au moins les mêmes clés de base que le kabyle, et les trois dialectes alignés entre eux');

// v6.102 : les trois dialectes ne sont plus figés au socle minimal de 22
// clés — extension progressive vers la parité complète demandée par
// l'utilisateur (capture d'écran : trop d'éléments visibles restaient en
// français). On vérifie maintenant deux choses différentes : (1) le socle
// de base du kabyle reste bien couvert (rien n'a régressé), et (2) les
// trois dialectes avancent en même temps, avec exactement le même
// ensemble de clés entre eux (pas un qui prend de l'avance sur les
// deux autres sans que ce soit une décision explicite).
await test('les trois dialectes couvrent au moins le socle de base du kabyle (rien n\'a régressé)', ()=>{
  const dom = loadPatientApp();
  const kabKeys = Object.keys(dom.window.I18N_STRINGS.kab);
  ['dz','ma','tn'].forEach(code=>{
    const keys = new Set(Object.keys(dom.window.I18N_STRINGS[code]));
    const missing = kabKeys.filter(k=>!keys.has(k));
    assert.deepStrictEqual(missing, [], `${code} : clés du socle kabyle manquantes : ${missing.join(', ')}`);
  });
});

await test('les trois dialectes ont exactement le même ensemble de clés entre eux (progression synchronisée)', ()=>{
  const dom = loadPatientApp();
  const dzKeys = Object.keys(dom.window.I18N_STRINGS.dz).sort();
  ['ma','tn'].forEach(code=>{
    const keys = Object.keys(dom.window.I18N_STRINGS[code]).sort();
    assert.deepStrictEqual(keys, dzKeys, `${code} devrait couvrir exactement les mêmes clés que dz`);
  });
});

await test('changer de langue traduit bien l\'écran de connexion pour chacun des trois dialectes', ()=>{
  const dom = loadPatientApp();
  ['dz','ma','tn'].forEach(code=>{
    dom.window.eval(`Prefs.setLang('${code}');`);
    const title = dom.window.document.querySelector('[data-i18n="login_title"]').textContent;
    assert.notStrictEqual(title, 'Bonjour !', `${code} : le titre ne doit plus être en français`);
    assert.ok(/[\u0600-\u06FF]/.test(title), `${code} : le titre doit contenir de l'écriture arabe`);
  });
});

console.log('\nDistinction réelle entre les trois dialectes (pas trois copies identiques)');

await test('les trois blocs de traduction sont bien différents les uns des autres (pas un copier-coller)', ()=>{
  const dom = loadPatientApp();
  const dz = JSON.stringify(dom.window.I18N_STRINGS.dz);
  const ma = JSON.stringify(dom.window.I18N_STRINGS.ma);
  const tn = JSON.stringify(dom.window.I18N_STRINGS.tn);
  assert.notStrictEqual(dz, ma);
  assert.notStrictEqual(ma, tn);
  assert.notStrictEqual(dz, tn);
});

await test('chaque dialecte utilise bien son marqueur possessif distinctif (تاع algérien / ديال marocain / متاع tunisien)', ()=>{
  const dom = loadPatientApp();
  assert.ok(dom.window.I18N_STRINGS.dz.progress_title.includes('تاع'), 'algérien : تاع attendu');
  assert.ok(dom.window.I18N_STRINGS.ma.progress_title.includes('ديال'), 'marocain : ديال attendu');
  assert.ok(dom.window.I18N_STRINGS.tn.progress_title.includes('متاع'), 'tunisien : متاع attendu');
});

console.log('\nParité complète avec le français (v6.145)');

await test('v6.145 : VRAI BUG CORRIGÉ — dz/ma/tn étaient tombés à 518/538, mélange visible de darija et de français signalé par l\'utilisateur sur capture d\'écran. dz/ma/tn doivent rester à 100% désormais.', ()=>{
  const dom = loadPatientApp();
  const fr = dom.window.I18N_STRINGS.fr;
  ['dz','ma','tn'].forEach(l=>{
    const missing = Object.keys(fr).filter(k=>!(k in dom.window.I18N_STRINGS[l]));
    assert.strictEqual(missing.length, 0, `${l} : ${missing.length} clé(s) manquante(s) — ${missing.slice(0,5).join(', ')}`);
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);

}

main();
