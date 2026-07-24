// =====================================================================
//  TESTS — v6.245 : ARABE (RTL) ET IDENTITÉ VISUELLE
//  ---------------------------------------------------------------------
//  Issus de l'audit complet v6.245. Trois défauts constatés :
//
//  1. `dir="rtl"` est bien posé sur <html> pour ar/dz/ma/tn (i18n.js),
//     mais les feuilles de style n'utilisaient que des propriétés
//     PHYSIQUES (text-align:left, margin-left…). En arabe, un texte
//     aligné « à gauche » dans une page qui coule de droite à gauche
//     paraît cassé. Les propriétés LOGIQUES (start/inline-start) se
//     comportent à l'identique en LTR et se retournent seules en RTL.
//
//  2. `manifest.json` portait encore la palette d'avant la refonte
//     v6.206 (beige #efead9, vert #2F6B57) : l'écran de démarrage de
//     l'application installée et la barre système affichaient donc des
//     couleurs qui n'existent plus nulle part dans l'app.
//
//  3. Six pages sur seize n'avaient aucune balise theme-color.
//
//  Lancer : node tests/rtl-et-identite-v245.test.js
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

const CSS_FILES = fs.readdirSync(path.join(ROOT, 'css')).filter(f => f.endsWith('.css'));
const HTML_FILES = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
// Surfaces réellement traduites : l'app patient, l'espace ortho, l'aidant.
// Les pages légales et l'admin sont françaises par décision de projet.
const TRANSLATED_JS = ['js/app.js', 'js/assessment.js', 'js/phonation.js', 'js/admin.js'];
const TRANSLATED_HTML = ['dashboard-ortho.html', 'mon-resume.html', 'report.html'];

const THEME_COLOR = '#0A6B4F';

async function main(){

console.log('Arabe (RTL) — aucune propriété directionnelle physique');

await test('les feuilles de style n\'utilisent plus text-align:left ni margin-left', ()=>{
  const coupables = [];
  CSS_FILES.forEach(f=>{
    const src = fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
    src.split('\n').forEach((line, i)=>{
      if(/text-align: *left|margin-left:|padding-right:/.test(line)){
        coupables.push(`css/${f}:${i+1}`);
      }
    });
  });
  assert.strictEqual(coupables.length, 0,
    `propriétés physiques (cassent en arabe) : ${coupables.join(', ')} — utiliser start / inline-start / inline-end`);
});

await test('les surfaces traduites (JS et HTML) non plus', ()=>{
  const coupables = [];
  [...TRANSLATED_JS, ...TRANSLATED_HTML].forEach(f=>{
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    src.split('\n').forEach((line, i)=>{
      if(/text-align: *left|margin-left:/.test(line)) coupables.push(`${f}:${i+1}`);
    });
  });
  assert.strictEqual(coupables.length, 0, `propriétés physiques : ${coupables.join(', ')}`);
});

await test('les 4 langues à écriture droite-à-gauche sont bien déclarées dir:rtl', ()=>{
  const i18n = require('./i18n-source').texteComplet();
  const bloc = i18n.slice(i18n.indexOf('const LANGUAGES'), i18n.indexOf('const I18N_STRINGS'));
  ['ar','dz','ma','tn'].forEach(l=>{
    const ligne = bloc.split('\n').find(x => new RegExp(`^\\s*${l}\\s*:`).test(x));
    assert.ok(ligne, `langue ${l} introuvable dans LANGUAGES`);
    assert.ok(/dir\s*:\s*'rtl'/.test(ligne), `${l} devrait être déclarée dir:'rtl'`);
  });
});

await test('le sens d\'écriture est bien appliqué au document au changement de langue', ()=>{
  const i18n = require('./i18n-source').texteComplet();
  assert.ok(/document\.documentElement\.dir\s*=/.test(i18n),
    'i18n devrait poser documentElement.dir — sinon dir:rtl ne sert à rien');
});

console.log('\nIdentité visuelle — le manifeste suit la palette réelle');

await test('manifest.json : les couleurs correspondent aux variables CSS du thème clair', ()=>{
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  const bg = css.match(/--bg:\s*(#[0-9A-Fa-f]{6})/);
  const accentDark = css.match(/--accent-dark:\s*(#[0-9A-Fa-f]{6})/);
  assert.ok(bg && accentDark, 'variables --bg / --accent-dark introuvables dans css/style.css');
  assert.strictEqual(manifest.background_color.toUpperCase(), bg[1].toUpperCase(),
    'background_color du manifeste ≠ --bg : l\'écran de démarrage afficherait une couleur qui n\'existe plus');
  assert.strictEqual(manifest.theme_color.toUpperCase(), accentDark[1].toUpperCase(),
    'theme_color du manifeste ≠ --accent-dark');
});

await test('manifest.json : toutes les icônes déclarées existent vraiment', ()=>{
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  manifest.icons.forEach(i=>{
    assert.ok(fs.existsSync(path.join(ROOT, i.src)), `icône déclarée mais absente : ${i.src}`);
  });
});

await test('les icônes du manifeste sont toutes dans le cache hors-ligne', ()=>{
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  manifest.icons.forEach(i=>{
    assert.ok(sw.includes(`'./${i.src}'`), `${i.src} n'est pas dans APP_SHELL`);
  });
});

await test(`les ${HTML_FILES.length} pages déclarent la même couleur de barre système`, ()=>{
  const manquantes = [], divergentes = [];
  HTML_FILES.forEach(f=>{
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const m = src.match(/<meta name="theme-color" content="(#[0-9A-Fa-f]{6})">/i);
    if(!m) manquantes.push(f);
    else if(m[1].toUpperCase() !== THEME_COLOR.toUpperCase()) divergentes.push(`${f} (${m[1]})`);
  });
  assert.strictEqual(manquantes.length, 0, `sans theme-color : ${manquantes.join(', ')}`);
  assert.strictEqual(divergentes.length, 0, `couleur divergente : ${divergentes.join(', ')}`);
});

await test('theme-color est cohérente avec le manifeste', ()=>{
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.strictEqual(manifest.theme_color.toUpperCase(), THEME_COLOR.toUpperCase());
});

console.log('\nVitrine publique — aperçu au partage');

await test('accueil.html expose un aperçu Open Graph complet', ()=>{
  const src = fs.readFileSync(path.join(ROOT, 'accueil.html'), 'utf8');
  ['og:type','og:url','og:title','og:description','og:image'].forEach(p=>{
    assert.ok(new RegExp(`property="${p}"`).test(src), `balise ${p} absente`);
  });
});

await test('l\'image d\'aperçu déclarée existe dans le dépôt', ()=>{
  const src = fs.readFileSync(path.join(ROOT, 'accueil.html'), 'utf8');
  const img = src.match(/property="og:image" content="https:\/\/reparole\.fr\/([^"]+)"/);
  assert.ok(img, 'og:image devrait pointer une URL absolue sur reparole.fr');
  assert.ok(fs.existsSync(path.join(ROOT, img[1])), `og:image pointe ${img[1]}, absent du dépôt`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
