// =====================================================================
//  FILET DE SÉCURITÉ — charte d'Ami (v6.28)
//  ---------------------------------------------------------------------
//  Demande explicite de l'utilisateur : Ami n'est pas une mascotte, il
//  est un compagnon. Il accueille, explique, encourage, rassure. Il ne
//  plaisante jamais au détriment du patient, ne minimise jamais une
//  difficulté, ne dramatise jamais une erreur. Ton toujours chaleureux,
//  simple, respectueux (voir la charte complète en tête de
//  js/companion.js).
//
//  Ce test scanne le contenu RÉEL de COMPANION_PHRASES (7 langues, le
//  kabyle n'a volontairement pas de banque Ami — voir plus haut) à la
//  recherche de mots qui trahiraient la charte : mots durs/négatifs
//  ("faux", "raté", "nul"...), jamais censés apparaître dans une phrase
//  qu'Ami adresse au patient, quel que soit le contexte (même après une
//  erreur — cf. la catégorie "encourage").
//
//  ⚠️ Heuristique par mots-clés, pas une compréhension du sens : elle
//  attrape les régressions les plus probables (un mot dur ajouté par
//  erreur dans une future phrase), pas toutes les violations possibles
//  de ton. Une relecture humaine reste utile pour toute nouvelle phrase,
//  en particulier dans les langues où je ne suis pas locuteur natif
//  (comme documenté ailleurs dans le projet).
//
//  Lancer : node tests/companion-charter.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}

// Charge COMPANION_PHRASES sans dépendre du navigateur (pas besoin de
// jsdom ici : ce fichier ne touche pas au DOM tant qu'on ne construit
// pas de sandbox avec `window`).
const sandbox = { window:{} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/companion.js'), 'utf8'), sandbox);
const PHRASES = sandbox.window.COMPANION_PHRASES;

// Mots qui trahiraient la charte (dramatiser une erreur, minimiser une
// difficulté, ton dur/moqueur) — un par langue à support complet. Pas
// une liste exhaustive, un filet de sécurité contre les régressions les
// plus probables.
const BANNED_WORDS = {
  fr: ['nul','faux','raté','échec','incorrect','mauvais','décevant','dommage','hélas','stupide','bête','pas bon','pas bien'],
  en: ['wrong','fail','failure','bad','terrible','stupid','dumb','too bad','incorrect','poor'],
  es: ['mal ','malo','fallo','fallaste','incorrecto','tonto','estúpido','lástima'],
  it: ['sbagliato','male ','brutto','peccato','stupido','fallimento'],
  pt: ['errado','mau ','pena ','estúpido','fracasso'],
  de: ['falsch','schlecht','schade','dumm','versagen'],
  ar: ['خطأ','فشل','سيء','غبي']
};

const EXPECTED_CONTEXTS = ['welcome','welcome_back','insight_pointer','tip','exerciseStart','correct','streak','encourage','sessionEnd_high','sessionEnd_mid','sessionEnd_low','aidant_welcome'];

test('COMPANION_PHRASES chargé et non vide', () => {
  if(!PHRASES || !Object.keys(PHRASES).length) throw new Error('COMPANION_PHRASES introuvable ou vide');
});

Object.keys(BANNED_WORDS).forEach(lang=>{
  test(`${lang} : tous les contextes attendus sont présents`, () => {
    if(!PHRASES[lang]) throw new Error(`langue "${lang}" absente de COMPANION_PHRASES`);
    EXPECTED_CONTEXTS.forEach(ctx=>{
      if(!Array.isArray(PHRASES[lang][ctx]) || !PHRASES[lang][ctx].length){
        throw new Error(`contexte "${ctx}" manquant ou vide pour "${lang}"`);
      }
    });
  });

  test(`${lang} : aucune phrase ne contient un mot banni par la charte`, () => {
    const violations = [];
    Object.entries(PHRASES[lang]).forEach(([ctx, phrases])=>{
      phrases.forEach(phrase=>{
        const lower = phrase.toLowerCase();
        BANNED_WORDS[lang].forEach(word=>{
          if(lower.includes(word.toLowerCase())) violations.push(`[${ctx}] "${phrase}" contient "${word}"`);
        });
      });
    });
    if(violations.length) throw new Error(violations.join('\n    '));
  });
});

test("Ami garde le même nom dans toutes les langues (identité du personnage)", () => {
  if(sandbox.window.Companion.name() !== 'Ami') throw new Error('Companion.name() a changé — vérifier que ce n\'est pas accidentel');
});

console.log(`\n${passed} test(s) réussi(s).`);
if(!process.exitCode){
  console.log('✅ Aucun problème détecté — Ami respecte la charte dans les 7 langues.');
} else {
  console.log('❌ Des problèmes ont été détectés ci-dessus.');
}
