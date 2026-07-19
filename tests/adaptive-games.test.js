// =====================================================================
//  TESTS — v6.184 : jeux adaptatifs (« Le mot en morceaux », « Ça va
//  ensemble ? »).
//  ---------------------------------------------------------------------
//  Architecture assumée : mécanique en code, CONTENU depuis les banques
//  déjà traduites des 14 langues + mots ciblés (fusionnés en amont),
//  ADAPTATION par le moteur d'apprentissage existant (typeLevel +
//  AI.record via answer_feedback). Aucun LLM face au patient — c'est ce
//  qui rend le « toutes les langues » honnête, kabyle et darijas
//  comprises. Et : GRATUITS (esprit « accessible à tous »), sans
//  chronomètre (fatigue post-AVC réelle).
//
//  Lancer : node tests/adaptive-games.test.js
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

const IDX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const idxDoc = new JSDOM(IDX).window.document;

const i18nWin = new JSDOM('', { runScripts:'outside-only' }).window;
i18nWin.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
const S = i18nWin.I18N_STRINGS;

(async () => {

  await test('sélecteur : les deux tuiles de jeu existent (anagramme, verif) et lancent startExercise', () => {
    for(const t of ['anagramme','verif']){
      const tile = idxDoc.querySelector(`.ex-item[data-type="${t}"]`);
      assert.ok(tile, `tuile ${t} absente`);
      assert.ok(new RegExp(`startExercise\\('${t}'\\)`).test(IDX), `lancement ${t} absent`);
    }
  });

  await test('gratuits : ni anagramme ni verif dans PRO_ONLY_TYPES (accessible à tous)', () => {
    const list = APP.match(/const PRO_ONLY_TYPES = \[[^\]]*\]/)[0];
    assert.ok(!/anagramme|verif/.test(list), 'les jeux doivent rester gratuits');
  });

  await test('multilingue honnête : le contenu vient de la banque de la langue active (BANK_<LANG>), pas d\'un LLM', () => {
    const block = APP.match(/if\(type==='anagramme' \|\| type==='verif'\)\{[\s\S]*?\n  \}/);
    assert.ok(block, 'bloc de construction des jeux absent');
    assert.ok(/window\['BANK_'\+lang\.toUpperCase\(\)\]/.test(block[0]), 'résolution de la banque par langue absente');
    assert.ok(!/iaAssist|fetch\(/.test(block[0]), 'AUCUN appel réseau/LLM dans la construction du jeu');
  });

  await test('adaptatif : la longueur des mots suit le niveau du moteur (typeLevel), et le pool respecte le niveau', () => {
    const block = APP.match(/if\(type==='anagramme' \|\| type==='verif'\)\{[\s\S]*?\n  \}/)[0];
    assert.ok(/typeLevel\(type\)/.test(block), 'niveau par type absent');
    assert.ok(/maxLen = lvl<=1 \? 5 : \(lvl===2 \? 7 : 10\)/.test(block), 'progression de longueur absente');
    assert.ok(/Number\(l\)<=lvl/.test(block), 'le pool doit être borné au niveau courant');
  });

  await test('apprentissage : les deux jeux passent par answer_feedback (donc AI.record) — aucun scoring parallèle', () => {
    const ana = APP.match(/function renderAnagramme[\s\S]*?\n\}/)[0];
    const ver = APP.match(/function renderVerif[\s\S]*?\n\}/)[0];
    assert.ok(/answer_feedback\(ok, c\._built\)/.test(ana), 'anagramme doit conclure par answer_feedback');
    assert.ok(/answer_feedback\(q\.ok===true/.test(ver) && /answer_feedback\(q\.ok===false/.test(ver), 'verif doit conclure par answer_feedback');
    assert.ok(/AI\.record\(c\.type, c\._target, ok\)/.test(APP), 'answer_feedback doit alimenter le moteur');
    assert.ok(/c\._target=q\.answer/.test(ana) && /c\._target=q\.answer/.test(ver), 'la cible du moteur doit être posée');
  });

  await test('accessibilité : « Effacer » sans pénalité, et AUCUN chronomètre dans les jeux', () => {
    const ana = APP.match(/function renderAnagramme[\s\S]*?\n\}/)[0];
    const eraseHandler = ana.match(/#anagram-erase'\)\.addEventListener\('click',\(\)=>\{[\s\S]*?\}\);/)[0];
    assert.ok(!/answer_feedback/.test(eraseHandler), 'effacer ne doit JAMAIS compter comme une erreur');
    const ver = APP.match(/function renderVerif[\s\S]*?\n\}/)[0];
    assert.ok(!/setInterval|setTimeout\([^)]*count|chrono/i.test(ana + ver), 'pas de compte à rebours anxiogène');
  });

  await test('robustesse : mélange qui évite l\'ordre déjà correct + banque trop maigre = repli silencieux', () => {
    assert.ok(/out\.join\(''\)!==word/.test(APP), 'le mélange doit éviter de présenter le mot déjà résolu');
    assert.ok(/if\(source\.length<4\)\{ return; \}/.test(APP), 'garde banque partielle absente');
  });

  await test('sécurité : lettres et mots échappés dans le HTML des jeux', () => {
    const ana = APP.match(/function renderAnagramme[\s\S]*?\n\}/)[0];
    const ver = APP.match(/function renderVerif[\s\S]*?\n\}/)[0];
    assert.ok(/escapeHTML\(l\)/.test(ana), 'lettres non échappées');
    assert.ok(/escapeHTML\(q\.word\)/.test(ver), 'mot non échappé');
  });

  await test('i18n : les 9 clés des jeux existent dans les 14 langues, kabyle réel', () => {
    const KEYS = ['ex_anagramme_t','ex_anagramme_d','ex_verif_t','ex_verif_d','anagram_hint','verif_hint','game_erase','game_yes','game_no'];
    const langs = Object.keys(S);
    assert.strictEqual(langs.length, 14);
    for(const l of langs) for(const k of KEYS){
      assert.ok(typeof S[l][k] === 'string' && S[l][k].length, `${k} manquante en ${l}`);
    }
    for(const k of KEYS){
      assert.notStrictEqual(S.kab[k], S.fr[k], `${k} : kab = repli français`);
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
