// =====================================================================
//  TESTS — v6.177 : passe systématique sur TOUS les écrans.
//  ---------------------------------------------------------------------
//  Retour utilisateur : « les fonds d'écran sont même pas appliqués »,
//  « c'est pas fait à fond » — exact : le décor était posé écran par
//  écran, au fil des retours, et 12 écrans sur 18 avaient été oubliés.
//  Ce fichier verrouille la COMPLÉTUDE : il énumère lui-même tous les
//  écrans de toutes les pages et exige le décor sur chacun — un écran
//  ajouté demain sans décor fera échouer la suite.
//  + fiche ortho en 2 colonnes, choix d'exercice alignés sur grand
//  écran, association 🪚→🪵 (fini le marteau qui « va avec » le bois),
//  message d'erreur réseau admin actionnable.
//
//  Lancer : node tests/screens-completeness.test.js
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

const PAGES = ['index.html', 'dashboard-ortho.html', 'aidant.html', 'admin.html'];
const CSS = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');

(async () => {

  // ---- COMPLÉTUDE : tous les écrans, toutes les pages, un décor chacun ----
  await test('chaque écran de chaque page a son décor de fond (énumération automatique — aucun oubli possible)', () => {
    let total = 0;
    for(const page of PAGES){
      const doc = new JSDOM(fs.readFileSync(path.join(ROOT, page), 'utf8')).window.document;
      const screens = [...doc.querySelectorAll('div.screen[id]')];
      assert.ok(screens.length > 0, `${page} : aucun écran trouvé ?`);
      for(const s of screens){
        total++;
        assert.ok(s.querySelector(':scope > svg.bg-decor'),
          `${page} #${s.id} : svg.bg-decor manquant`);
      }
    }
    assert.ok(total >= 18, `attendu au moins 18 écrans, trouvé ${total}`);
  });

  await test('css : règle GLOBALE d\'empilement (décor derrière, contenu devant) — plus de cas-par-cas', () => {
    assert.ok(/\.screen\{ position:relative; \}/.test(CSS), '.screen{position:relative} absente');
    assert.ok(/\.screen > \.topbar, \.screen > \.wrap\{ position:relative; z-index:1; \}/.test(CSS),
      'la règle générique topbar/wrap au-dessus du décor est absente');
  });

  await test('css : le dégradé + centrage couvrent TOUTES les connexions (patient, ortho, aidant, admin, défis MFA)', () => {
    assert.ok(/#ortho-login, #caregiver-login, #admin-login, #ortho-mfa-challenge, #admin-mfa-challenge\{/.test(CSS),
      'le dégradé doit couvrir les 5 écrans de connexion/défi non-patient');
    assert.ok(/#login \.wrap, #ortho-login \.wrap, #caregiver-login \.wrap, #admin-login \.wrap, #ortho-mfa-challenge \.wrap, #admin-mfa-challenge \.wrap\{/.test(CSS),
      'le centrage vertical doit couvrir les mêmes écrans');
  });

  // ---- Fiche patient ortho : large + 2 colonnes ----
  await test('fiche ortho : cartes en grille 2 colonnes sur grand écran + pleine largeur', () => {
    const doc = new JSDOM(fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8')).window.document;
    const grid = doc.querySelector('#ortho-detail .dashboard-grid');
    assert.ok(grid, '.dashboard-grid manquante dans #ortho-detail');
    const cards = grid.querySelectorAll(':scope > .card');
    assert.ok(cards.length >= 8, `attendu au moins 8 cartes dans la grille, trouvé ${cards.length}`);
    assert.ok(grid.querySelector('#d-target-words') && grid.querySelector('#d-notes'),
      'mots ciblés et notes doivent être dans la grille');
    assert.ok(/#ortho-detail \.wrap[^{]*\{ max-width:1400px/.test(CSS), 'largeur étendue #ortho-detail absente');
  });

  // ---- Choix d'exercice alignés sur grand écran ----
  await test('css : les choix d\'exercice passent côte à côte au-delà de 900px (téléphone : empilés, inchangé)', () => {
    // l'auto-fit doit être défini À L'INTÉRIEUR d'un bloc ≥900px…
    const idxRule = CSS.indexOf('.choices{ grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); }');
    assert.ok(idxRule > -1, 'la grille des choix ≥900px est absente');
    const before = CSS.slice(0, idxRule);
    const lastMediaOpen = before.lastIndexOf('@media (min-width:900px){');
    assert.ok(lastMediaOpen > -1 && before.slice(lastMediaOpen).split('}').length - before.slice(lastMediaOpen).split('{').length < 1,
      'l\'auto-fit doit être dans un bloc @media ≥900px');
    // …et la base (mobile, hors media) reste une grille 1 colonne, intacte
    assert.ok(/\.choices\{display:grid;gap:12px;margin-top:24px\}/.test(CSS), 'la base mobile de .choices a changé');
  });

  // ---- Association : 🪚→🪵 remplace 🔨→🪵 ----
  await test('association : « Scie → Bois » remplace « Marteau → Bois » (signalé comme illogique), libellé ×14', () => {
    const EX = fs.readFileSync(path.join(ROOT, 'js/exercises-new-types.js'), 'utf8');
    assert.ok(/\{text:'🪚',answer:'🪵',choices:\['🪵','🍞','📖'\]\}/.test(EX), 'l\'item 🪚→🪵 est absent');
    assert.ok(!/\{text:'🔨',answer:'🪵'/.test(EX), 'l\'ancien item 🔨→🪵 doit avoir disparu');
    assert.ok(/'🪚': 'label_saw'/.test(EX), 'le libellé de 🪚 doit être branché (EMOJI_LABEL_KEYS)');
    const w = new JSDOM('', { runScripts:'outside-only' }).window;
    w.eval(require('./i18n-source').texteComplet());
    const S = w.I18N_STRINGS;
    for(const l of Object.keys(S)){
      assert.ok(typeof S[l].label_saw === 'string' && S[l].label_saw.length, `label_saw manquant en ${l}`);
    }
    assert.notStrictEqual(S.kab.label_saw, S.fr.label_saw, 'label_saw kab ne doit pas être un repli français');
  });

  // ---- Admin : erreur réseau actionnable ----
  await test('admin : un échec RÉSEAU affiche un message actionnable (pause Supabase) au lieu de « NetworkError » brut', () => {
    const A = fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8');
    assert.ok(/NetworkError\|Failed to fetch/.test(A), 'la détection des erreurs réseau est absente');
    assert.ok(/pause|relancez/i.test(A), 'le message doit orienter vers la cause probable (projet Supabase en pause)');
  });

  await test('v6.185 : Lecture facilitée raffinée (visuels centrés, consignes à gauche) + pied de page collé en bas', () => {
    const CSS = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
    // dys : la gauche pour la lecture des phrases, le centre pour le reste
    assert.ok(/body\.dys \.prompt-card\{ text-align:center; \}/.test(CSS), 'les visuels doivent rester centrés en mode dys');
    assert.ok(/body\.dys \.prompt-card \.prompt-text\{ text-align:start; \}/.test(CSS), 'les consignes restent à gauche (start = compatible RTL)');
    // footer : jamais au milieu d\'un écran court
    assert.ok(/min-height:100vh;display:flex;flex-direction:column/.test(CSS), 'body en colonne pleine hauteur absent');
    assert.ok(/\.screen\{flex:1 0 auto;width:100%\}/.test(CSS), 'l\'écran visible doit s\'étirer');
    assert.ok(/\.site-footer\{margin-top:auto/.test(CSS), 'le footer doit se pousser en bas');
  });

  await test('v6.186 : ménage historique (SQL gaté admins + bouton à double confirmation) + carte d\'accueil embellie', () => {
    const SQL = fs.readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
    const pu = SQL.match(/create or replace function purge_login_events\(\)[\s\S]*?\$\$;/);
    assert.ok(pu, 'purge_login_events absente du schéma');
    assert.ok(/from admins a where a\.code = auth\.uid\(\)::text/.test(pu[0]), 'la purge doit être gatée par la table admins');
    assert.ok(/interval '30 days'/.test(pu[0]), 'la purge doit garder 30 jours');
    const ADM = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');
    assert.ok(/id="purge-logins-btn"/.test(ADM) && /AdminPanel\.purgeLoginEvents/.test(ADM), 'bouton ménage absent');
    const AJS = fs.readFileSync(path.join(ROOT, 'js/admin.js'), 'utf8');
    const fn = AJS.match(/async purgeLoginEvents\(\)[\s\S]*?\n  \},/);
    assert.ok(fn && /dataset\.confirm/.test(fn[0]), 'la double confirmation (pas de confirm() natif) est requise');
    assert.ok(/renderLoginHistory\(\)/.test(fn[0]), 'la liste doit se rafraîchir après le ménage');
    const CSS = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
    assert.ok(/\.login-card\{background:linear-gradient\(180deg,#FFFFFF 0%,#f3f9f6 100%\)/.test(CSS), 'carte d\'accueil : dégradé clair absent');
    assert.ok(/border:1px solid rgba\(47,138,124,\.14\)/.test(CSS), 'carte d\'accueil : bordure lumineuse absente');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
