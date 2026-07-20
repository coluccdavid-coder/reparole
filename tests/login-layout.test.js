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

  // ---- Connexion patient en 2 colonnes sur grand écran ----
  await test('#login : le corps est en 2 colonnes (.login-cols) avec formulaire ET options', () => {
    const cols = index.querySelector('#login .login-cols');
    assert.ok(cols, '.login-cols manquant dans #login');
    const columns = cols.querySelectorAll(':scope > .login-col');
    assert.strictEqual(columns.length, 2, `attendu 2 colonnes, trouvé ${columns.length}`);
    // le formulaire (champ prénom) et les options (barre d'accessibilité) sont chacun dans une colonne
    assert.ok(cols.querySelector('#name'), 'le champ prénom doit être dans .login-cols');
    assert.ok(cols.querySelector('.access-bar'), 'la barre d\'accessibilité doit être dans .login-cols');
  });

  await test('css : le corps 2 colonnes ne s\'active qu\'au-delà de 900px (téléphone = 1 colonne)', () => {
    // .login-cols par défaut en block ; grid seulement dans le media ≥900px
    assert.ok(/\.login-cols\{ display:block; \}/.test(CSS), '.login-cols doit être en block par défaut');
    assert.ok(/@media \(min-width:900px\)\{[\s\S]*?\.login-cols\{[^}]*display:grid/.test(CSS),
      '.login-cols doit passer en grid dans le media ≥900px');
  });

  // ---- v6.176 : colonnes équilibrées + panneau confort (retour "c'est moche / ça ne rentre pas") ----
  await test('v6.176 : les options d\'accessibilité sont dans un panneau titré (.login-panel), plus un nuage flottant', () => {
    const panel = index.querySelector('#login .login-panel');
    assert.ok(panel, '.login-panel manquant');
    assert.ok(panel.querySelector('.login-panel-title[data-i18n="login_comfort_title"]'), 'titre du panneau manquant');
    assert.ok(panel.querySelector('.access-bar'), 'la barre d\'accessibilité doit être DANS le panneau');
  });

  await test('v6.176 : colonnes équilibrées — "Première visite" et les liens d\'espaces sont dans la colonne de droite', () => {
    const cols = index.querySelectorAll('#login .login-col');
    const left = cols[0], right = cols[1];
    assert.ok(left.querySelector('#login-btn'), 'le bouton de connexion reste à gauche');
    assert.ok(!left.querySelector('[data-i18n="btn_new_patient"]'), '"Créer un nouveau dossier" ne doit plus être à gauche');
    assert.ok(right.querySelector('[data-i18n="btn_new_patient"]'), '"Créer un nouveau dossier" doit être à droite');
    assert.ok(right.querySelectorAll('.login-space-link a').length === 2, 'les 2 liens d\'espaces doivent être à droite en .login-space-link');
  });

  await test('v6.176 : carte compacte sur grand écran, sans réduire les tailles de police (lisibilité post-AVC)', () => {
    const media = CSS.match(/@media \(min-width:900px\)\{[\s\S]*?\n\}/g).join('\n');
    assert.ok(/#login \.login-card\{ padding:22px/.test(media), 'le resserrement de la carte doit être limité au ≥900px');
    assert.ok(!/#login[^}]*font-size/.test(media.match(/#login \.login-card\{[^}]*\}/)[0]),
      'aucune réduction de police dans la compaction');
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
