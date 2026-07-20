// =====================================================================
//  TESTS — v6.198 : finitions signalées sur captures.
//  ① Ami n'affiche plus de bulle VIDE (mots croisés, mémoire) — il
//     s'efface s'il n'a rien à dire, et il A quelque chose à dire pour
//     TOUS les types d'exercices.
//  ② Les niveaux par exercice sont repliés et titrés (plus de pavé).
//  Lancer : node tests/ui-polish-v198.test.js
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
const COMP = fs.readFileSync(path.join(ROOT, 'js/companion.js'), 'utf8');
const ORT = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

(async () => {

  await test('① pas de bulle fantôme : render() s\'efface si Ami n\'a aucun message', () => {
    const r = COMP.match(/render\(containerId, opts\)\{[\s\S]{0,400}?\}/)[0];
    assert.ok(/if\(!this\.message\)\{ el\.innerHTML = ''; return; \}/.test(COMP), 'garde anti-bulle-vide absent');
  });

  await test('① Ami a une explication pour CHAQUE type d\'exercice jouable (fini les croisés/mémoire muets)', () => {
    // les types déclarés dans les tuiles patient
    const types = [...new Set([...IDX.matchAll(/data-type="([a-z_]+)"/g)].map(m => m[1]))];
    // le bloc explain FR (référence, via fallback pour les autres langues)
    const frExplain = COMP.match(/\n  fr: \{[\s\S]*?\n      prix: "[\s\S]*?\n    \}/)[0];
    const missing = types.filter(t => !new RegExp('\\n      ' + t + ':').test(frExplain));
    assert.strictEqual(missing.length, 0, 'types sans explication d\'Ami : ' + missing.join(', '));
  });

  await test('① croises et memoire_liste sont explicités dans les 10 langues complètes', () => {
    assert.ok((COMP.match(/croises:/g) || []).length >= 10, 'croises manque dans des langues');
    assert.ok((COMP.match(/memoire_liste:/g) || []).length >= 10, 'memoire_liste manque dans des langues');
  });

  await test('② les niveaux par exercice sont repliés (<details>) avec un libellé clair', () => {
    assert.ok(/<details[\s\S]*?id="d-levels-breakdown"[\s\S]*?<\/details>/.test(ORT), 'le pavé doit être dans un <details>');
    assert.ok(/data-i18n="ortho_levels_toggle"/.test(ORT), 'le libellé du dépliant doit être traduit');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
