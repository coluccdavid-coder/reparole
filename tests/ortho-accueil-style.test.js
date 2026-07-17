// =====================================================================
//  TESTS — v6.170 : l'ambiance de l'accueil patient étendue à l'espace
//  orthophoniste (retour utilisateur : écrans ortho "vides", fond plat
//  peu accueillant, cartes empilées gâchant l'espace sur ordinateur).
//  ---------------------------------------------------------------------
//  Ces tests sont STRUCTURELS : le rendu visuel ne peut pas être vérifié
//  ici (pas de navigateur). On vérifie donc que les briques déjà
//  éprouvées côté patient (#login / #dashboard) sont bien réutilisées à
//  l'identique sur les écrans ortho, et que le bug du placeholder email
//  est corrigé. Le rendu final reste à contrôler à l'œil.
//
//  Lancer : node tests/ortho-accueil-style.test.js
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

const HTML = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
const CSS  = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
const doc  = new JSDOM(HTML).window.document;

// I18N_STRINGS évalué seul (sans lancer le reste de l'app)
const i18nWin = new JSDOM('', { runScripts:'outside-only' }).window;
i18nWin.eval(fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8'));
const S = i18nWin.I18N_STRINGS;

(async () => {

  // --- Décor de fond réutilisé sur les écrans ortho ---
  await test('#ortho-login a le décor de fond (svg.bg-decor) de l\'accueil', () => {
    const svg = doc.querySelector('#ortho-login svg.bg-decor');
    assert.ok(svg, 'svg.bg-decor manquant dans #ortho-login');
    assert.ok(!svg.classList.contains('bg-decor-light'),
      'la connexion ortho doit utiliser le décor teal (comme #login), pas la version claire');
  });

  await test('#ortho-list a le décor clair (svg.bg-decor.bg-decor-light), comme le tableau de bord patient', () => {
    const svg = doc.querySelector('#ortho-list svg.bg-decor.bg-decor-light');
    assert.ok(svg, 'svg.bg-decor.bg-decor-light manquant dans #ortho-list');
  });

  // --- Mise en page 2 colonnes sur grand écran (réutilise .dashboard-grid) ---
  await test('#ortho-list a une grille .dashboard-grid contenant la liste des patients', () => {
    const grid = doc.querySelector('#ortho-list .dashboard-grid');
    assert.ok(grid, '.dashboard-grid manquante dans #ortho-list');
    const list = doc.querySelector('#patient-list');
    assert.ok(list, '#patient-list introuvable');
    assert.ok(grid.contains(list), 'la liste des patients doit être placée dans la grille');
  });

  await test('les réglages du compte restent pleine largeur (hors grille) — évite les <details> en colonnes CSS', () => {
    const grid = doc.querySelector('#ortho-list .dashboard-grid');
    const settings = doc.querySelector('#ortho-settings-details');
    assert.ok(settings, '#ortho-settings-details introuvable');
    assert.ok(!grid.contains(settings), 'les réglages ne doivent PAS être dans la grille');
  });

  // --- Bug corrigé : placeholder du champ email ---
  await test('ortho_email_placeholder est traduit (fini le nom brut de la clé) — langues complètes + kab', () => {
    const langs = ['fr','en','es','it','pt','de','ar','tr','pl','ja','kab'];
    for(const l of langs){
      const v = S[l] && S[l].ortho_email_placeholder;
      assert.ok(typeof v === 'string' && v.length, `ortho_email_placeholder manquant en ${l}`);
      assert.notStrictEqual(v, 'ortho_email_placeholder', `${l} : le nom brut de la clé s'affiche encore`);
      assert.ok(v.includes('@'), `${l} : l'exemple d'email devrait contenir "@" (reçu : ${v})`);
    }
  });

  // --- CSS : dégradé + centrage repris de l'accueil, largeur écran ---
  await test('css : #ortho-login reçoit le dégradé teal de #login', () => {
    assert.ok(/#ortho-login\{[^}]*linear-gradient\(160deg[^}]*var\(--teal-deep\)/s.test(CSS),
      'la règle de dégradé #ortho-login est absente');
  });

  await test('css : les écrans de connexion sont centrés verticalement (flex-column + center)', () => {
    assert.ok(/#login,\s*#ortho-login\{[^}]*flex-direction:column[^}]*justify-content:center/s.test(CSS),
      'la règle de centrage vertical des écrans de connexion est absente');
  });

  await test('css : le tableau de bord ortho passe en large sur grand écran (max-width 1400px)', () => {
    assert.ok(/#ortho-list \.wrap\{ max-width:1400px/.test(CSS),
      'la largeur étendue #ortho-list (≥900px) est absente');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
