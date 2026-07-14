// =====================================================================
//  TESTS — Drapeaux dans le sélecteur de langue (v6.100, ajusté v6.105)
//  ---------------------------------------------------------------------
//  Réponse à "c'est possible de mettre le drapeau qui va avec ?".
//  Chaque langue a désormais un symbole devant son nom.
//
//  Cas particulier du kabyle, changé en v6.105 : utilisait le drapeau
//  algérien 🇩🇿 (choix discuté à l'époque, faute d'émoji Unicode pour un
//  drapeau amazigh). L'utilisateur a signalé que ça représentait mal
//  une identité distincte — capture d'écran à l'appui montrant le vrai
//  drapeau kabyle/amazigh (tricolore bleu/vert/jaune avec le symbole
//  rouge "yaz" ⵣ au centre). Remplacé par ⵣ (la lettre tifinagh elle-
//  même, qui EST ce symbole rouge) — pas un vrai drapeau au sens
//  Unicode (deux "regional indicator" accolés), donc traité à part des
//  14 autres langues dans ce fichier.
//
//  Lancer : node tests/language-flags.test.js
// =====================================================================

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

function loadLanguages(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only', resources:'usable' });
  dom.window.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
  return dom.window.LANGUAGES;
}

console.log('Un symbole devant chaque langue');

const LANGUAGES = loadLanguages();
const EXPECTED_FLAGS = {
  fr:'🇫🇷', en:'🇺🇸', es:'🇪🇸', it:'🇮🇹', pt:'🇵🇹', de:'🇩🇪', ar:'🇸🇦', tr:'🇹🇷', pl:'🇵🇱',
  dz:'🇩🇿', ma:'🇲🇦', tn:'🇹🇳', sg:'🇨🇫', ja:'🇯🇵',
};

for(const [code, flag] of Object.entries(EXPECTED_FLAGS)){
  test(`${code} : le libellé commence bien par ${flag}`, ()=>{
    assert.ok(LANGUAGES[code], `LANGUAGES.${code} manquant`);
    assert.ok(LANGUAGES[code].label.startsWith(flag), `attendu "${flag}...", reçu "${LANGUAGES[code].label}"`);
  });
}

test('les 14 langues à drapeau pays en ont bien un (kabyle exclu, voir plus bas)', ()=>{
  const FLAG_REGEX = /^\p{RI}\p{RI}/u; // deux "regional indicator" Unicode = un drapeau pays
  for(const [code, meta] of Object.entries(LANGUAGES)){
    if(code === 'kab') continue;
    assert.ok(FLAG_REGEX.test(meta.label), `${code} n'a pas de drapeau : "${meta.label}"`);
  }
});

test('kabyle : utilise le symbole ⵣ (yaz), PAS un drapeau pays (v6.105)', ()=>{
  assert.ok(LANGUAGES.kab.label.startsWith('ⵣ'), `attendu "ⵣ...", reçu "${LANGUAGES.kab.label}"`);
  const FLAG_REGEX = /^\p{RI}\p{RI}/u;
  assert.ok(!FLAG_REGEX.test(LANGUAGES.kab.label), 'le kabyle ne devrait plus utiliser un drapeau pays (v6.105)');
});

test('kabyle : le nom lui-même ("Taqbaylit") reste présent après le symbole', ()=>{
  // v6.122 : un suffixe "(en cours de traduction)" a été ajouté après le
  // nom — .endsWith() ne convient plus, on vérifie juste que le nom
  // reste bien présent et non altéré.
  assert.ok(LANGUAGES.kab.label.includes('Taqbaylit'));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
