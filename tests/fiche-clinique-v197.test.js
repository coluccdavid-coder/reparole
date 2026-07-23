// =====================================================================
//  TESTS — v6.197 : LE DOSSIER CLINIQUE EN 5 VOLETS (proposition du
//  propriétaire). Invariants : les 5 volets existent et sont navigables,
//  la durée des séances est MESURÉE (bornée) et compatible avec l'ancien
//  client, les volets 2-5 sont calculés LOCALEMENT (zéro appel IA), les
//  recommandations sont des règles transparentes, et le Journal d'Ami
//  reste factuel — jamais d'émotion prétendue, dans les 14 langues.
//  Lancer : node tests/fiche-clinique-v197.test.js
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
const ORT = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const STO = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const SQL = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');

(async () => {

  await test('les 5 volets existent avec leur navigation (overview, évolution, événements, journal, reco)', () => {
    for(const id of ['volet-overview','volet-evolution','volet-events','volet-journal','volet-reco']){
      assert.ok(ORT.includes('id="' + id + '"'), 'volet absent : ' + id);
    }
    assert.ok(ORT.includes('id="fiche-nav"'), 'navigation absente');
    assert.strictEqual((ORT.match(/scrollIntoView/g)||[]).length >= 5, true, '5 boutons de navigation attendus');
  });

  await test('durée des séances : colonne SQL + drop de l\'ancienne signature (anti « function is not unique ») + envoi client borné', () => {
    assert.ok(/alter table sessions add column if not exists duration_sec int;/.test(SQL), 'colonne absente');
    assert.ok(/drop function if exists log_session\(text, text, int, int, int, text\);/.test(SQL), 'drop de l\'ancienne signature absent — ambiguïté de surcharge garantie');
    assert.ok(/p_duration_sec int default null/.test(SQL), 'le défaut protège l\'ancien client déployé');
    assert.ok(/window\.__exStartMs = Date\.now\(\);/.test(APP), 'chronomètre absent au départ d\'exercice');
    assert.ok(/duration_sec: Math\.min\(3600, Math\.max\(5,/.test(APP), 'la durée doit être bornée (5 s à 1 h)');
    assert.ok(/p_duration_sec: \(Number\.isFinite\(entry\.duration_sec\)/.test(STO), 'transmission storage absente');
  });

  await test('volets 2-5 : calculés localement depuis l\'historique déjà chargé — ZÉRO appel IA/réseau', () => {
    const block = DOJS.match(/LE DOSSIER CLINIQUE EN 5 VOLETS[\s\S]*?volets cliniques/)[0];
    assert.ok(!/iaAssist|fetch\(|supa\./.test(block), 'appel réseau interdit dans les volets');
    assert.ok(/d-domain-bars/.test(block) && /d-events/.test(block) && /d-ami-journal/.test(block) && /d-reco/.test(block), 'zones manquantes');
    assert.ok(/gap > 7/.test(block), 'détection des pauses absente');
    assert.ok(/p >= 80/.test(block), 'détection des records absente');
  });

  await test('recommandations : des RÈGLES transparentes (seuils lisibles), annoncées comme telles, jamais présentées comme de l\'IA', () => {
    const block = DOJS.match(/⑤ Recommandations[\s\S]*?recoEl\.innerHTML/)[0];
    assert.ok(/r\.p < 50/.test(block) && /r\.p >= 85/.test(block) && /< 2\) recos\.push/.test(block), 'les 3 règles à seuils doivent être lisibles dans le code');
    const fr = I18N.match(/fiche_reco_intro:"([^"]+)"/)[1];
    assert.ok(/pas d'IA/.test(fr), 'l\'encart doit dire explicitement « pas d\'IA »');
  });

  await test('Journal d\'Ami : factuel dans les 14 langues — aucune émotion en première personne', () => {
    const keys = I18N.match(/amij_(high|mid|low):[^\n]+/g) || [];
    assert.ok(keys.length >= 42, '3 clés × 14 langues attendues, trouvé ' + keys.length);
    for(const k of keys){
      assert.ok(!/je suis (content|heureux|triste|fier|déçu)|I am (happy|sad|proud|disappointed)|estoy (feliz|triste)/i.test(k),
        'émotion en première personne : ' + k.slice(0, 50));
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
