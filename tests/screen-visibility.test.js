// =====================================================================
//  TEST — Régression : écran ".screen" bloqué par un style en ligne
//  ---------------------------------------------------------------------
//  Bug réel trouvé le 11 juillet (aidant.html + admin.html, tous les
//  deux) : un élément avec class="screen" (sans "active") ET un style
//  en ligne style="display:none" reste invisible pour toujours, même
//  après que le JS lui ajoute la classe "active" — l'inline style est
//  toujours prioritaire sur la règle CSS .screen.active{display:block},
//  et rien dans le code ne le vide jamais. Résultat : page blanche
//  après une connexion "réussie", SANS aucune erreur JavaScript (juste
//  un problème d'affichage CSS silencieux — d'où la difficulté à le
//  repérer).
//
//  Ce test scanne TOUTES les pages HTML du site : un ".screen" ne doit
//  jamais avoir de style "display" en ligne — la visibilité doit
//  passer uniquement par la classe "active" (voir show() dans
//  js/app.js, ou le même mécanisme réutilisé dans aidant.html/
//  admin.html).
//
//  Lancer : node tests/screen-visibility.test.js
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

const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

console.log(`Vérification de ${htmlFiles.length} pages HTML : aucun ".screen" avec un style en ligne`);

for(const file of htmlFiles){
  test(`${file} : aucun élément .screen n'a de style "display" en ligne`, () => {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const dom = new JSDOM(html);
    const screens = [...dom.window.document.querySelectorAll('.screen')];
    const offenders = screens.filter(el => el.getAttribute('style') && /display\s*:/.test(el.getAttribute('style')));
    assert.strictEqual(offenders.length, 0,
      `${offenders.length} élément(s) .screen avec un style display en ligne trouvé(s) (id: ${offenders.map(e=>e.id||'?').join(', ')}) — l'inline style empêchera toujours l'affichage même avec classList.add('active')`);
  });
}

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exitCode = 1;
