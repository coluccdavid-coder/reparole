// =====================================================================
//  TESTS — Drapeaux dans le sélecteur de langue (v6.100)
//  ---------------------------------------------------------------------
//  Réponse à "c'est possible de mettre le drapeau qui va avec ?".
//  Chaque langue a désormais un drapeau devant son nom. Cas particulier
//  discuté explicitement avec l'utilisateur : le kabyle utilise le
//  drapeau algérien (choix conscient — aucun émoji Unicode n'existe
//  pour le drapeau amazigh, propre à ce mouvement identitaire).
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

console.log('Un drapeau devant chaque langue');

const LANGUAGES = loadLanguages();
const EXPECTED_FLAGS = {
  fr:'🇫🇷', en:'🇺🇸', es:'🇪🇸', it:'🇮🇹', pt:'🇵🇹', de:'🇩🇪', ar:'🇸🇦', tr:'🇹🇷', pl:'🇵🇱',
  kab:'🇩🇿', dz:'🇩🇿', ma:'🇲🇦', tn:'🇹🇳', sg:'🇨🇫', ja:'🇯🇵',
};

for(const [code, flag] of Object.entries(EXPECTED_FLAGS)){
  test(`${code} : le libellé commence bien par ${flag}`, ()=>{
    assert.ok(LANGUAGES[code], `LANGUAGES.${code} manquant`);
    assert.ok(LANGUAGES[code].label.startsWith(flag), `attendu "${flag}...", reçu "${LANGUAGES[code].label}"`);
  });
}

test('les 15 langues ont toutes un drapeau (aucune oubliée)', ()=>{
  const FLAG_REGEX = /^\p{RI}\p{RI}/u; // deux "regional indicator" Unicode = un drapeau pays
  for(const [code, meta] of Object.entries(LANGUAGES)){
    assert.ok(FLAG_REGEX.test(meta.label), `${code} n'a pas de drapeau : "${meta.label}"`);
  }
});

test('kabyle : le nom lui-même ("Taqbaylit") reste inchangé après le drapeau', ()=>{
  assert.ok(LANGUAGES.kab.label.endsWith('Taqbaylit'));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
