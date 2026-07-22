// =====================================================================
//  TESTS — v6.195 : « La liste à retenir » (mémoire de travail, chantier
//  issu de la VEILLE IA), prompts v2, bandeau d'inactivité honnête.
//  Lancer : node tests/memoire-v195.test.js
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
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const IDX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DOC = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');
const ORT = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const idxDoc = new JSDOM(IDX).window.document;

(async () => {

  await test('mémoire : tuile présente, jeu GRATUIT, taille de liste adaptée au niveau (2/3/4), 5 manches', () => {
    assert.ok(idxDoc.querySelector('.ex-item[data-type="memoire_liste"]'), 'tuile absente');
    assert.ok(!/memoire_liste/.test(APP.match(/const PRO_ONLY_TYPES = \[[^\]]*\]/)[0]), 'doit rester gratuit');
    const b = APP.match(/if\(type==='memoire_liste'\)\{[\s\S]*?renderQuestion\(\);\n    return;\n  \}/)[0];
    assert.ok(/const k = lvl<=1 \? 2 : \(lvl===2 \? 3 : 4\);/.test(b), 'progression 2/3/4 absente');
    assert.ok(/Math\.min\(5,/.test(b), '5 manches attendues');
    assert.ok(/ABSTRACT_GAME_EMOJIS_M/.test(b), 'filtre des emojis abstraits absent');
    assert.ok(/seen\.has\(it\.emoji\)/.test(b), 'dédoublonnage par emoji absent (sélection ambiguë sinon)');
  });

  await test('mémoire : deux phases auto-rythmées SANS chronomètre, rappel LIBRE (égalité d\'ensembles, pas d\'ordre)', () => {
    const r = APP.match(/function renderMemoireListe[\s\S]*?\n\}/)[0];
    assert.ok(/memoire_done_btn/.test(r) && /#mem-done/.test(r), 'phase mémorisation absente');
    assert.ok(!/setTimeout|setInterval/.test(r), 'AUCUN chronomètre (auto-rythmé, adapté à l\'aphasie)');
    assert.ok(/chosen\.size===wanted\.size && \[\.\.\.wanted\]\.every\(w=>chosen\.has\(w\)\)/.test(r), 'le rappel est LIBRE : égalité d\'ensembles, pas de séquence');
    assert.ok(/answer_feedback\(ok,/.test(r), 'doit nourrir le moteur adaptatif');
    assert.ok(/sel\.size<q\.k/.test(r), 'la sélection est bornée à k');
  });

  await test('prompts v2 : libellés humains des 21 types transmis + consignes fluence/complétion dans le compte-rendu', () => {
    assert.ok(/libelles_types/.test(DOC), 'carte des libellés absente');
    for(const t of ['denomination','croises','memoire_liste','fluence','completion']){
      assert.ok(new RegExp(t + ':').test(DOC.match(/summary\['libelles_types'\] = \{[\s\S]*?\};/)[0]), 'libellé manquant : ' + t);
    }
    assert.ok(/jamais les codes techniques/.test(DOC), 'consigne libellés absente');
    assert.ok(/fluence ne sont pas des pourcentages classiques/.test(DOC), 'consigne fluence absente');
    assert.ok(/pas des « phrases complexes »/.test(DOC), 'consigne complétion absente');
  });

  await test('bandeau inactivité : masqué par défaut, affiché SEULEMENT si un patient est réellement inactif >7 j', () => {
    const p = ORT.match(/id="ortho-stale-hint"[^>]*/)[0];
    assert.ok(/display:none/.test(p), 'doit être masqué par défaut');
    assert.ok(/sorted\.some\(p=>daysSince\(p\) > 7\)/.test(DOJS), 'condition réelle absente');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
