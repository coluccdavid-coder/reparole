// =====================================================================
//  TESTS — v6.172 : outillage sécurité/ops issu de l'audit v6.171.
//  ---------------------------------------------------------------------
//  1. scripts/build-deploy-zip.sh : le script de déploiement doit
//     TOUJOURS exclure audio/ (protège les voix de l'hébergeur — le
//     risque n°1 documenté dans HEBERGEMENT.md), lancer les tests avant
//     de construire, et vérifier son propre résultat. On teste le texte
//     du script (invariants), pas son exécution (trop long ici : il
//     relance toute la suite).
//  2. .github/workflows/ci.yml : la CI lance bien `npm test`.
//  3. sql/durcissement-securite.sql : rejouable, CSPRNG, garde de débit
//     — et schema.sql n'utilise plus random() pour générer des codes
//     une fois le durcissement appliqué (ici : le fichier de
//     durcissement contient bien le remplacement).
//
//  Lancer : node tests/deploy-tooling.test.js
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

(async () => {

  // ---- 1. Script de déploiement ----
  const SH = fs.readFileSync(path.join(ROOT, 'scripts/build-deploy-zip.sh'), 'utf8');

  await test('deploy : audio/ est exclu du ZIP (protection des voix hébergées)', () => {
    assert.ok(/-x "audio\/\*"/.test(SH), 'l\'exclusion -x "audio/*" est absente');
  });

  await test('deploy : le script lance npm test avant de construire et refuse si rouge', () => {
    assert.ok(/npm test/.test(SH), 'npm test absent du script');
    assert.ok(/déploiement refusé/i.test(SH), 'le refus en cas d\'échec des tests est absent');
  });

  await test('deploy : le script vérifie son propre résultat (audio absent, fichiers clés présents)', () => {
    assert.ok(/grep -q " audio\/"/.test(SH), 'la vérification "audio/ absent du zip" manque');
    for(const f of ['index.html','dashboard-ortho.html','aidant.html','sw.js','manifest.json']){
      assert.ok(SH.includes(f), `le fichier clé ${f} n'est pas vérifié`);
    }
  });

  await test('deploy : la liste du zip est capturée UNE fois (pas de grep -q sur pipe + pipefail)', () => {
    // Régression vécue pendant l'écriture du script : grep -q branché
    // directement sur le pipe d'unzip + set -o pipefail => SIGPIPE
    // aléatoire, faux "fichier manquant". On verrouille le correctif.
    assert.ok(/LISTING=\$\(unzip -l/.test(SH), 'la capture LISTING=$(unzip -l …) est absente');
    assert.ok(!/unzip -l "\$OUT" \| grep -q/.test(SH),
      'grep -q ne doit pas être branché directement sur le pipe d\'unzip (SIGPIPE + pipefail)');
  });

  await test('deploy : sortie nommée depuis la version du sw.js (source de vérité)', () => {
    assert.ok(/grep -oE "reparole-v\[0-9\]\+-\[0-9\]\+" sw\.js/.test(SH), 'la version doit être lue depuis sw.js');
  });

  // ---- 2. CI ----
  await test('ci : le workflow GitHub Actions lance npm test sur push et pull_request', () => {
    const CI = fs.readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8');
    assert.ok(/on:\s*\n\s*push:\s*\n\s*pull_request:/.test(CI), 'déclencheurs push + pull_request absents');
    assert.ok(/run: npm test/.test(CI), 'l\'étape npm test est absente');
    assert.ok(/run: npm install/.test(CI), 'l\'étape npm install est absente');
  });

  // ---- 3. Durcissement SQL (fichier à relire, mais cohérent) ----
  const SQL = fs.readFileSync(path.join(ROOT, 'sql/durcissement-securite.sql'), 'utf8');

  await test('sql : le code aidant passe au CSPRNG (gen_random_bytes), plus de random()', () => {
    assert.ok(/gen_random_bytes\(6\)/.test(SQL), 'gen_random_bytes absent');
    assert.ok(!/md5\(random\(\)/.test(SQL.replace(/--[^\n]*/g, '')),
      'md5(random()) ne doit plus apparaître dans le code actif (hors commentaires)');
  });

  await test('sql : la garde de débit existe, avec table + index + RLS sans policy', () => {
    assert.ok(/create or replace function _rate_guard/.test(SQL), '_rate_guard absente');
    assert.ok(/create table if not exists access_attempts/.test(SQL), 'table access_attempts absente');
    assert.ok(/alter table access_attempts enable row level security/.test(SQL), 'RLS absente sur access_attempts');
  });

  await test('sql : le fichier est rejouable (create or replace / if not exists partout)', () => {
    const active = SQL.replace(/--[^\n]*/g, '');
    const creates = active.match(/create (table|index|function)[^\n(]*/gi) || [];
    for(const c of creates){
      assert.ok(/or replace|if not exists/i.test(c), `non rejouable : "${c.trim()}"`);
    }
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
