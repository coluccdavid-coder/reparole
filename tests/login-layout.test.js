// =====================================================================
//  TESTS — v6.171 : mise en page des connexions + habillage de tous les
//  espaces (patient / ortho / aidant), et GARDE-FOU contre la régression
//  d'affichage introduite en v6.170.
//  ---------------------------------------------------------------------
//  Contexte : en v6.170, la règle de centrage `#login{display:flex}`
//  (sélecteur d'ID) l'emportait sur `.screen{display:none}` (classe) —
//  l'écran de connexion ne se cachait donc plus jamais et s'empilait
//  par-dessus le tableau de bord une fois connecté. Le centrage est
//  désormais porté par `.wrap` (à l'intérieur de l'écran, masqué avec
//  lui). Ce fichier verrouille ce point + vérifie l'habillage aidant et
//  la connexion patient en 2 colonnes.
//
//  Tests structurels (le rendu visuel n'est pas vérifiable ici).
//  Lancer : node tests/login-layout.test.js
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

const CSS    = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
const index  = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')).window.document;
const aidant = new JSDOM(fs.readFileSync(path.join(ROOT, 'aidant.html'), 'utf8')).window.document;

(async () => {

  // ---- GARDE-FOU régression v6.170 : aucun display:… sur l'ID d'un écran ----
  await test('AUCUNE règle ne pose display:flex/grid/block sur l\'ID d\'un écran (sinon .screen{display:none} est cassé)', () => {
    const screenIds = ['login','ortho-login','caregiver-login','dashboard','ortho-list','caregiver-dashboard'];
    const rules = CSS.match(/[^{}]+\{[^{}]*\}/g) || [];
    for(const rule of rules){
      const i = rule.indexOf('{');
      const sel  = rule.slice(0, i);
      const body = rule.slice(i + 1);
      if(!/display\s*:\s*(flex|grid|block|inline)/.test(body)) continue;
      for(let s of sel.split(',')){
        s = s.trim();
        assert.ok(!screenIds.some(id => s === '#' + id),
          `${s}{display:…} masque mal l'écran — le centrage doit viser .wrap, pas l'ID de l'écran`);
      }
    }
  });

  await test('le centrage vertical des connexions est bien porté par .wrap', () => {
    assert.ok(/#login \.wrap,\s*#ortho-login \.wrap,\s*#caregiver-login \.wrap[^{]*\{[^}]*display:flex/s.test(CSS),
      'la règle de centrage sur .wrap (les 3 connexions) est absente');
  });

  // ---- v6.214 : connexion patient en carte à ONGLETS (maquette validée) ----
  await test('v6.214 : #login a deux onglets (Se connecter / Première visite) qui réutilisent des clés i18n existantes', () => {
    const tabs = index.querySelectorAll('#login .login-tabs .login-tab');
    assert.strictEqual(tabs.length, 2, `attendu 2 onglets, trouvé ${tabs.length}`);
    assert.strictEqual(tabs[0].getAttribute('data-i18n'), 'btn_login');
    assert.strictEqual(tabs[1].getAttribute('data-i18n'), 'first_visit');
  });

  await test('v6.214 : chaque onglet a son panneau — formulaire à gauche du temps (existing), création (new)', () => {
    const ex = index.querySelector('#login #login-tab-existing');
    const nw = index.querySelector('#login #login-tab-new');
    assert.ok(ex && nw, 'panneaux d\'onglets manquants');
    assert.ok(ex.querySelector('#name') && ex.querySelector('#code') && ex.querySelector('#login-btn'), 'formulaire de connexion incomplet');
    assert.ok(nw.querySelector('#new-name') && nw.querySelector('[data-i18n="btn_new_patient"]'), 'panneau première visite incomplet');
    assert.ok(ex.classList.contains('active') && !nw.classList.contains('active'), 'l\'onglet « Se connecter » doit être actif par défaut');
  });

  await test('v6.214 : css — les panneaux d\'onglets se masquent/affichent par classe .active', () => {
    assert.ok(/\.login-tab-panel\{display:none/.test(CSS), '.login-tab-panel doit être masqué par défaut');
    assert.ok(/\.login-tab-panel\.active\{display:block/.test(CSS), '.login-tab-panel.active doit s\'afficher');
  });

  await test('v6.214 : le confort (panneau titré) et les 2 liens d\'espaces restent visibles sous les onglets', () => {
    const panel = index.querySelector('#login .login-panel');
    assert.ok(panel, '.login-panel manquant');
    assert.ok(panel.querySelector('.login-panel-title[data-i18n="login_comfort_title"]'), 'titre du panneau manquant');
    assert.ok(panel.querySelector('.access-bar'), 'la barre d\'accessibilité doit être DANS le panneau');
    assert.strictEqual(index.querySelectorAll('#login .login-space-link a').length, 2, 'les 2 liens d\'espaces doivent rester présents');
  });

  // ---- Espace aidant : même habillage que les autres ----
  await test('#caregiver-login a le décor teal de l\'accueil (svg.bg-decor)', () => {
    const svg = aidant.querySelector('#caregiver-login svg.bg-decor');
    assert.ok(svg, 'svg.bg-decor manquant dans #caregiver-login');
    assert.ok(!svg.classList.contains('bg-decor-light'), 'la connexion aidant utilise le décor teal');
  });

  await test('#caregiver-dashboard a le décor clair + la grille 2 colonnes', () => {
    assert.ok(aidant.querySelector('#caregiver-dashboard svg.bg-decor.bg-decor-light'),
      'svg.bg-decor.bg-decor-light manquant dans #caregiver-dashboard');
    const grid = aidant.querySelector('#caregiver-dashboard .dashboard-grid');
    assert.ok(grid, '.dashboard-grid manquante dans #caregiver-dashboard');
    const cards = grid.querySelectorAll(':scope > .card');
    assert.strictEqual(cards.length, 4, `attendu 4 cartes dans la grille aidant, trouvé ${cards.length}`);
  });

  await test('css : #caregiver-login reçoit le dégradé teal, #caregiver-dashboard passe en large', () => {
    assert.ok(/#ortho-login, #caregiver-login[^{]*\{[^}]*linear-gradient\(160deg/s.test(CSS),
      'le dégradé de #caregiver-login est absent');
    assert.ok(/#caregiver-dashboard \.wrap[^{]*\{ max-width:1400px/.test(CSS),
      'la largeur étendue de #caregiver-dashboard est absente');
  });

  console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
  process.exit(failed ? 1 : 0);
})();
