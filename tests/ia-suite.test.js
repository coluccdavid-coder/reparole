// =====================================================================
//  TESTS — v6.182 : suite d'assistances IA (« l'IA prépare, l'humain
//  décide »).
//  ---------------------------------------------------------------------
//  5 tâches derrière UNE edge function `ia-assist` : suggestions de mots
//  ciblés, note de préparation, reformulation de note (ortho, Pro) ;
//  tri de la boîte à idées, résumé des erreurs (admin). Invariant
//  central verrouillé ici : RIEN n'est appliqué sans geste humain — les
//  mots suggérés ne sont ciblés qu'au clic, la note reformulée reste
//  dans le champ, les analyses admin sont de la lecture.
//
//  Lancer : node tests/ia-suite.test.js
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

const DOC  = fs.readFileSync(path.join(ROOT, 'js/ia-edge-function.md'), 'utf8');
const ORT  = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const ADM  = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
const DOJS = fs.readFileSync(path.join(ROOT, 'js/dashboard-ortho.js'), 'utf8');
const ADJS = fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8');
const ortDoc = new JSDOM(ORT).window.document;
const admDoc = new JSDOM(ADM).window.document;

(async () => {

  // ---- Edge function multi-tâches ----
  await test('edge : les 11 tâches existent, réparties par rôle (ortho vs admin), tâche inconnue refusée', () => {
    assert.ok(/ORTHO_TASKS = \['report_draft', 'suggest_words', 'prep_note', 'rewrite_note', 'generate_exercise', 'evolution_story', 'cabinet_digest', 'research_exercises'\]/.test(DOC));
    assert.ok(/ADMIN_TASKS = \['triage_suggestions', 'errors_digest', 'research_exercises'\]/.test(DOC));
    assert.ok(/from\('admins'\)/.test(DOC), 'le rôle admin doit être re-vérifié côté serveur');
    assert.ok(/tâche inconnue/.test(DOC), 'une tâche inconnue doit être refusée');
  });

  await test('edge : la règle « l\'IA prépare, l\'humain décide » est dans TOUS les prompts (HUMAN_RULE)', () => {
    assert.ok(/const HUMAN_RULE = `Règle absolue : tu PRÉPARES, l'humain DÉCIDE/.test(DOC));
    // chaque prompt système commence par la règle
    const count = (DOC.match(/\$\{HUMAN_RULE\}/g) || []).length;
    assert.ok(count >= 5, `HUMAN_RULE doit préfixer les prompts (trouvé ${count} usages, attendu >= 5)`);
  });

  await test('edge : anonymisation étendue — pas de nom patient, et les emails de la boîte à idées NON transmis', () => {
    assert.ok(!/select\('.*\bname\b/.test(DOC), 'patients.name ne doit jamais être sélectionné');
    const triage = DOC.match(/if \(task === 'triage_suggestions'\)[\s\S]*?\n    \}/)[0];
    assert.ok(!/email/.test(triage.replace(/\/\/[^\n]*/g, '').replace(/ANONYMISATION[^\n]*/g, '')),
      'les emails de contact ne doivent pas être sélectionnés pour le tri');
    assert.ok(/emails de contact ne sont PAS transmis/i.test(DOC), 'la garantie doit être documentée');
  });

  await test('edge : suggest_words répond en JSON strict et se présente comme des PROPOSITIONS', () => {
    const m = DOC.match(/wantJson = true;[\s\S]*?en \$\{L\}\.`;/);
    assert.ok(m, 'bloc suggest_words introuvable');
    assert.ok(/UNIQUEMENT en JSON strict/.test(m[0]));
    assert.ok(/PROPOSITIONS/.test(m[0]) && /validera/.test(m[0]), 'le prompt doit rappeler que l\'ortho valide');
  });

  // ---- Ortho : l'humain valide ----
  await test('ortho : mots suggérés — AUCUN ajout automatique, ciblage uniquement au clic (délégation data-ai-word)', () => {
    const m = DOJS.match(/async suggestTargetWords\(\)[\s\S]*?\n  \},/);
    assert.ok(m, 'suggestTargetWords absente');
    // l'appel IA ne doit contenir AUCUN orthoAddWord hors du gestionnaire de clic
    const beforeClick = m[0].split("addEventListener('click'")[0];
    assert.ok(!/orthoAddWord/.test(beforeClick), 'orthoAddWord ne doit être appelé QUE dans le gestionnaire de clic');
    assert.ok(/data-ai-word/.test(m[0]) && /addEventListener\('click'/.test(m[0]), 'validation par clic absente');
    assert.ok(/escapeHTML\(s\.mot/.test(m[0]), 'les mots suggérés doivent être échappés');
    assert.ok(m[0].indexOf('!OrthoApp.iaAllowed()') < m[0].indexOf('iaAssist'), 'contrôle d\'accès avant l\'appel');
  });

  await test('ortho : note de préparation -> zone éditable ; reformulation -> reste dans le champ, l\'ajout reste manuel', () => {
    const prep = DOJS.match(/async generatePrepNote\(\)[\s\S]*?\n  \},/);
    assert.ok(prep && /ai-draft-text/.test(prep[0]), 'la note de préparation doit remplir la zone éditable');
    const rw = DOJS.match(/async rewriteNote\(\)[\s\S]*?\n  \},/);
    assert.ok(rw, 'rewriteNote absente');
    assert.ok(/ta\.value = res\.result/.test(rw[0]), 'la reformulation doit remplir le champ');
    assert.ok(!/addNote\(/.test(rw[0]), 'rewriteNote ne doit JAMAIS ajouter la note elle-même');
    for(const fn of [prep[0], rw[0]]){
      assert.ok(fn.indexOf('!OrthoApp.iaAllowed()') < fn.indexOf('iaAssist'), 'contrôle d\'accès avant l\'appel');
    }
  });

  await test('ortho html : les 3 boutons existent avec statuts aria-live', () => {
    for(const id of ['ai-words-btn','ai-prep-btn','ai-rewrite-btn']){
      assert.ok(ortDoc.getElementById(id), `#${id} absent`);
    }
    for(const id of ['ai-words-status','ai-rewrite-status']){
      const el = ortDoc.getElementById(id);
      assert.ok(el && el.getAttribute('aria-live') === 'polite', `#${id} : aria-live absent`);
    }
  });

  await test('v6.186 : accès IA via iaAllowed — interrupteur bêta documenté, contrôle Pro conservé pour le lancement', () => {
    const m = DOJS.match(/iaAllowed\(\)\{[\s\S]*?\n  \},/);
    assert.ok(m, 'helper iaAllowed absent');
    assert.ok(/IA_BETA_OPEN = true; \/\/ <-- false au lancement commercial/.test(m[0]), 'l\'interrupteur bêta doit être documenté');
    assert.ok(/orthoPlan === 'pro'/.test(m[0]), 'le contrôle Pro doit rester dans le helper');
  });

  // ---- Admin ----
  await test('admin : boutons tri + erreurs branchés sur AdminPanel, résultats en lecture seule', () => {
    assert.ok(admDoc.getElementById('ai-triage-btn') && admDoc.getElementById('ai-errors-btn'), 'boutons admin absents');
    assert.ok(/AdminPanel\.iaTriageSuggestions/.test(ADM) && /AdminPanel\.iaErrorsDigest/.test(ADM));
    assert.ok(/async iaTriageSuggestions\(\)/.test(ADJS) && /async iaErrorsDigest\(\)/.test(ADJS));
    // lecture seule : les fonctions écrivent du texte, ne modifient aucune donnée
    const both = ADJS.match(/async iaTriageSuggestions\(\)[\s\S]*?async iaErrorsDigest\(\)[\s\S]*?\n  \}/)[0];
    assert.ok(!/setSuggestion|archive|delete|update|insert/i.test(both), 'les analyses admin doivent rester en lecture seule');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
