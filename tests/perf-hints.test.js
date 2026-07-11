// =====================================================================
//  TESTS — Indices de performance : préconnexion Supabase + polices
//  (v6.79)
//  ---------------------------------------------------------------------
//  Vérifie que le @import CSS (bloquant, aller-retour réseau en série)
//  a bien été retiré au profit de <link> dans le <head>, et que la
//  préconnexion Supabase est présente sur toutes les pages qui en ont
//  besoin. Vérifie aussi que Fraunces (jamais chargée jusqu'ici,
//  utilisée en silence avec repli sur serif) est maintenant réellement
//  chargée.
//
//  Lancer : node tests/perf-hints.test.js
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

console.log('Indices de performance (v6.79)');

test("css/style.css n'utilise plus @import pour charger une police (bloquant)", ()=>{
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  assert.ok(!/@import\s+url\(['"]https:\/\/fonts\.googleapis/.test(css), '@import Google Fonts encore présent dans le CSS');
});

const PAGES_WITH_STYLE = ['admin.html','aidant.html','audio-checklist.html','cgu.html','cgv.html',
  'contribuer.html','dashboard-ortho.html','index.html','mentions-legales.html','mon-resume.html','report.html'];

PAGES_WITH_STYLE.forEach(page=>{
  test(`${page} : preconnect + stylesheet Google Fonts présents dans le <head>`, ()=>{
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    assert.ok(html.includes('rel="preconnect" href="https://fonts.googleapis.com"'), 'preconnect fonts.googleapis.com manquant');
    assert.ok(html.includes('rel="preconnect" href="https://fonts.gstatic.com" crossorigin'), 'preconnect fonts.gstatic.com manquant');
    assert.ok(/rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2\?family=/.test(html), 'lien <link rel="stylesheet"> vers Google Fonts manquant');
  });
});

test('Fraunces est maintenant réellement chargée (référencée dans dashboard-ortho.html, jamais importée avant)', ()=>{
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(html.includes("font-family:'Fraunces'"), 'Fraunces toujours utilisée quelque part (sinon ce test n\'a plus de sens)');
  assert.ok(/family=Fraunces/.test(html), 'Fraunces doit apparaître dans l\'URL Google Fonts chargée');
});

const PAGES_WITH_SUPABASE = ['admin.html','aidant.html','contribuer.html','dashboard-ortho.html','index.html','mon-resume.html','report.html'];

PAGES_WITH_SUPABASE.forEach(page=>{
  test(`${page} : préconnexion Supabase présente`, ()=>{
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    assert.ok(html.includes('rel="preconnect" href="https://bwxlshedzpfaeszwktdx.supabase.co"'), 'preconnect Supabase manquant');
    assert.ok(html.includes('rel="dns-prefetch" href="https://bwxlshedzpfaeszwktdx.supabase.co"'), 'dns-prefetch Supabase manquant');
  });
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
