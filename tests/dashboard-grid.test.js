// =====================================================================
//  TEST — Grille du tableau de bord grand écran (v6.62)
//  ---------------------------------------------------------------------
//  Vérifie que les 9 cartes du tableau de bord sont bien à l'intérieur
//  de .dashboard-grid (mise en page 2 colonnes au-delà de 900px, voir
//  css/style.css), et que le bandeau du code / la salutation / Ami /
//  le bloc de réglages en bas de page restent bien EN DEHORS (pleine
//  largeur volontaire).
//
//  Lancer : node tests/dashboard-grid.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html);
const doc = dom.window.document;

console.log('Grille du tableau de bord (mise en page grand écran, v6.62)');

test('.dashboard-grid existe et contient exactement 10 cartes', () => {
  const grid = doc.querySelector('#dashboard .dashboard-grid');
  assert.ok(grid, '.dashboard-grid doit exister dans #dashboard');
  const cards = grid.querySelectorAll(':scope > .card');
  assert.strictEqual(cards.length, 10, `attendu 10 cartes directement dans .dashboard-grid, trouvé ${cards.length}`);
});

test('le bandeau du code de suivi reste hors de la grille (pleine largeur)', () => {
  const banner = doc.querySelector('#your-code-banner');
  const grid = doc.querySelector('#dashboard .dashboard-grid');
  assert.ok(banner && grid, 'les deux éléments doivent exister');
  assert.ok(!grid.contains(banner), 'le bandeau du code ne doit pas être à l\'intérieur de la grille');
});

test('la salutation et le compagnon Ami restent hors de la grille (pleine largeur)', () => {
  const greeting = doc.querySelector('.greeting');
  const companion = doc.getElementById('companion-dashboard');
  const grid = doc.querySelector('#dashboard .dashboard-grid');
  assert.ok(!grid.contains(greeting), 'la salutation ne doit pas être dans la grille');
  assert.ok(!grid.contains(companion), 'le compagnon Ami ne doit pas être dans la grille');
});

test('le bloc de réglages en bas de page (langue, accessibilité, mode de sauvegarde) reste hors de la grille', () => {
  const langSwitcher = doc.querySelector('#dashboard [data-lang-switcher]');
  const grid = doc.querySelector('#dashboard .dashboard-grid');
  assert.ok(!grid.contains(langSwitcher), 'le sélecteur de langue ne doit pas être dans la grille');
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
