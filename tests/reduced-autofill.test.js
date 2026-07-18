// =====================================================================
//  TESTS — Réduction de la proposition d'enregistrement du navigateur
//  sur les connexions admin/orthophoniste (v6.98)
//  ---------------------------------------------------------------------
//  Retour utilisateur : "le profil ainsi que le mot de passe reste à
//  chaque reconnexion... d'un point de vue sécurité c'est pas terrible."
//  Comportement du NAVIGATEUR (gestionnaire de mots de passe), pas de
//  l'app — l'app ne stocke jamais le mot de passe. Réduit ici avec les
//  valeurs autocomplete les plus efficaces connues (aucune solution
//  n'est garantie à 100% sur tous les navigateurs — Chrome en
//  particulier propose parfois de sauvegarder malgré tout).
//
//  Lancer : node tests/reduced-autofill.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

console.log('admin.html — champs de connexion');

const admin = fs.readFileSync(path.join(ROOT, 'admin.html'), 'utf8');

test('email : autocomplete="off" (plus "username")', ()=>{
  assert.ok(/id="a-email"[^>]*autocomplete="off"/.test(admin));
});

test('mot de passe : autocomplete="new-password" (plus "current-password")', ()=>{
  assert.ok(/id="a-password"[^>]*autocomplete="new-password"/.test(admin));
});

console.log('\ndashboard-ortho.html — champs de connexion');

const ortho = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');

test('email : autocomplete="off"', ()=>{
  assert.ok(/id="o-email"[^>]*autocomplete="off"/.test(ortho));
});

test('mot de passe : autocomplete="new-password"', ()=>{
  assert.ok(/id="o-password"[^>]*autocomplete="new-password"/.test(ortho));
});

console.log('\nreset-password.html — déjà correct, vérifié pour non-régression');

const reset = fs.readFileSync(path.join(ROOT, 'reset-password.html'), 'utf8');

test('les deux champs utilisent déjà autocomplete="new-password" (cohérent, formulaire de définition de mot de passe)', ()=>{
  assert.ok(/id="rp-password" autocomplete="new-password"/.test(reset));
  assert.ok(/id="rp-password-confirm" autocomplete="new-password"/.test(reset));
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
