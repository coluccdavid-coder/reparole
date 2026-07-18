// =====================================================================
//  TESTS — v6.178 : USAGE i18n — toute clé référencée doit exister.
//  ---------------------------------------------------------------------
//  Bug attrapé par l'utilisateur (capture) : « ortho_voice_title »
//  s'affichait en toutes lettres — 4 clés de la boucle vocale étaient
//  référencées dans le HTML/JS depuis la v6.174 mais jamais définies.
//  Les tests de PARITÉ ne peuvent pas voir ça (une clé absente de
//  toutes les langues est "cohérente"). Ce fichier verrouille l'USAGE :
//  il balaie tous les attributs data-i18n* de toutes les pages et tous
//  les appels littéraux I18N.t('…') / oT('…') / cgT('…') du JS, et
//  exige que chaque clé existe. Une clé référencée demain sans être
//  définie fera échouer la suite.
//
//  Lancer : node tests/i18n-usage.test.js
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

const i18nWin = new JSDOM('', { runScripts:'outside-only' }).window;
i18nWin.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
const KNOWN = new Set(Object.keys(i18nWin.I18N_STRINGS.fr));

// Préfixes de clés construites dynamiquement ('level_'+n, 'ex_'+type+'_t'…).
// Leur complétude est couverte par les tests dédiés (new-exercise-i18n,
// hide-untranslated-exercises, etc.) — ici on ignore le préfixe littéral.
const DYNAMIC_PREFIXES = ['level_', 'ex_', 'cg_tip_', 'tag_', 'ortho_clinical_'];
const isDynamicPrefix = k => DYNAMIC_PREFIXES.includes(k) || k.endsWith('_');

(async () => {

  await test('HTML : chaque data-i18n / -placeholder / -aria-label / -title pointe vers une clé existante (toutes pages)', () => {
    const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
    const missing = [];
    for(const f of pages){
      const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
      // ne balayer que les pages branchées sur le système i18n central
      if(!/js\/i18n\.js/.test(h)) continue;
      for(const m of h.matchAll(/data-i18n(?:-placeholder|-aria-label|-title)?="([a-zA-Z0-9_]+)"/g)){
        if(!KNOWN.has(m[1]) && !isDynamicPrefix(m[1])) missing.push(f + ' -> ' + m[1]);
      }
    }
    assert.strictEqual(missing.length, 0, 'clés référencées introuvables :\n    ' + [...new Set(missing)].join('\n    '));
  });

  await test('JS : chaque appel littéral I18N.t(\'…\') / oT(\'…\') / cgT(\'…\') pointe vers une clé existante', () => {
    const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
    const missing = [];
    for(const f of files){
      const j = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
      for(const m of j.matchAll(/(?:I18N\.t|\boT|\bcgT)\(\s*'([a-zA-Z0-9_]+)'/g)){
        if(!KNOWN.has(m[1]) && !isDynamicPrefix(m[1])) missing.push('js/' + f + ' -> ' + m[1]);
      }
    }
    assert.strictEqual(missing.length, 0, 'clés référencées introuvables :\n    ' + [...new Set(missing)].join('\n    '));
  });

  await test('les 4 clés du bug (boucle vocale ortho) existent désormais dans les 14 langues', () => {
    const S = i18nWin.I18N_STRINGS;
    for(const k of ['ortho_voice_title','ortho_voice_sub','ortho_voice_mark_acquired','ortho_voice_mark_retry']){
      for(const l of Object.keys(S)){
        assert.ok(typeof S[l][k] === 'string' && S[l][k].length, `${k} manquante en ${l}`);
      }
      assert.notStrictEqual(S.kab[k], S.fr[k], `${k} : kab ne doit pas être un repli français`);
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
