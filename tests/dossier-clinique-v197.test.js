// =====================================================================
//  TESTS — v6.197 : le DOSSIER CLINIQUE en 5 volets (idée du
//  propriétaire). Volets 1-3 factuels (locaux, zéro IA), volets 4-5
//  générés par l'IA À LA DEMANDE (plafonnés, à valider par l'ortho,
//  non-décisionnaires). Lancer : node tests/dossier-clinique-v197.test.js
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
const STORE = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const EDGE = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');

(async () => {

  await test('les 5 volets existent dans la fiche patient, avec une navigation dédiée', () => {
    for(const v of ['volet-overview','volet-evolution','volet-events','volet-journal','volet-reco'])
      assert.ok(new RegExp('id="'+v+'"').test(ORT), 'volet absent : ' + v);
    assert.ok(/id="fiche-nav"/.test(ORT), 'navigation du dossier absente');
  });

  await test('volets 1-3 (vue d\'ensemble, évolution, événements) : FACTUELS, calculés localement, ZÉRO appel IA', () => {
    const block = DOJS.match(/① Vue d'ensemble[\s\S]*?volets cliniques/)[0];
    assert.ok(/d-time-freq/.test(block) && /d-domain-bars/.test(block) && /d-events/.test(block), 'un volet factuel manque');
    assert.ok(!/iaAssist|Store\.ortho(AmiJournal|ClinicalReco|GenerateReportDraft)/.test(block), 'les volets 1-3 ne doivent faire AUCUN appel IA');
    assert.ok(/event_gap|event_record/.test(block), 'la détection d\'événements doit venir des données');
  });

  await test('volets 4-5 : générés par l\'IA À LA DEMANDE (bouton), jamais au simple affichage de la fiche', () => {
    assert.ok(/genAmiJournal\(\)/.test(DOJS) && /genClinicalReco\(\)/.test(DOJS), 'générateurs absents');
    assert.ok(/id="ami-journal-btn"/.test(ORT) && /id="reco-btn"/.test(ORT), 'boutons de génération absents');
    // aucun appel automatique dans le rendu de la fiche
    const renderBlock = DOJS.match(/① Vue d'ensemble[\s\S]*?volets cliniques/)[0];
    // on tolère la mention en commentaire ; on interdit l'APPEL effectif
    const renderNoComments = renderBlock.split('\n').filter(l=>!l.trim().startsWith('//')).join('\n');
    assert.ok(!/genAmiJournal\(|genClinicalReco\(|orthoAmiJournal|orthoClinicalReco/.test(renderNoComments), 'les volets IA ne doivent PAS se déclencher à l\'affichage');
  });

  await test('volets 4-5 : plafonnés (iaAllowed) et respectant la frontière — l\'IA propose, l\'ortho dispose', () => {
    for(const fn of ['genAmiJournal','genClinicalReco']){
      const code = DOJS.match(new RegExp('async '+fn+'\\([\\s\\S]*?\\n  \\},'))[0];
      assert.ok(/iaAllowed\(\)/.test(code), fn + ' doit vérifier le plafond/Pro');
    }
    assert.ok(/orthoAmiJournal/.test(STORE) && /orthoClinicalReco/.test(STORE), 'méthodes Store absentes');
  });

  await test('edge : les 2 tâches sont déclarées, non-décisionnaires, et rien n\'est stocké', () => {
    assert.ok(/'ami_journal'/.test(EDGE) && /'clinical_reco'/.test(EDGE), 'tâches non déclarées dans ORTHO_TASKS');
    const recoStart = EDGE.indexOf("if (task === 'clinical_reco') {");
    const reco = EDGE.slice(recoStart, recoStart + 900);
    assert.ok(/jamais des\s+prescriptions|seule décision clinique/.test(reco), 'le garde-fou non-décisionnaire doit être dans le prompt');
    const journalStart = EDGE.indexOf("if (task === 'ami_journal') {");
    const journal = EDGE.slice(journalStart, journalStart + 900);
    assert.ok(/n'attribue aucune émotion|N'invente aucun ressenti/.test(journal), 'le journal ne doit pas prêter d\'émotion (règle Ami)');
    // pas d'insert/update dans ces prompts : ils ne stockent rien
    assert.ok(!/\.insert\(|\.update\(/.test(reco) && !/\.insert\(|\.update\(/.test(journal), 'les volets ne doivent rien stocker');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
