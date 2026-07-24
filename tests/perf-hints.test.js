// =====================================================================
//  TESTS — Indices de performance : préconnexion Supabase + polices
//  (v6.79)
//  ---------------------------------------------------------------------
//  Vérifie que le @import CSS (bloquant, aller-retour réseau en série)
//  a bien été retiré au profit de <link> dans le <head>, et que la
//  préconnexion Supabase est présente sur toutes les pages qui en ont
//  besoin. Vérifie aussi que Fredoka (police des titres,
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
  test(`${page} : polices AUTO-HÉBERGÉES (plus aucun appel à Google Fonts)`, ()=>{
    // v6.249 : ce test exigeait l'INVERSE (preconnect + lien Google Fonts
    // sur chaque page, posés par la refonte v6.206). Depuis, constat
    // RGPD : chaque visite transmettait l'adresse IP du patient à Google
    // sans consentement — inacceptable pour une application de santé.
    // Les polices vivent dans fonts/ et css/fonts.css. Ce test verrouille
    // le NOUVEL état : le retour d'un lien Google Fonts est une régression
    // de conformité, plus une optimisation de performance.
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html),
      'lien Google Fonts réintroduit — l\'IP des patients repartirait chez Google');
    assert.ok(html.includes('css/fonts.css'), 'feuille de polices locales absente');
  });
});

test('Fredoka est réellement chargée (déclarée localement ET utilisée)', ()=>{
  const fontsCss = fs.readFileSync(path.join(ROOT, 'css/fonts.css'), 'utf8');
  assert.ok(fontsCss.includes("font-family: 'Fredoka'"), 'Fredoka absente de css/fonts.css');
  const html = fs.readFileSync(path.join(ROOT, 'dashboard-ortho.html'), 'utf8');
  assert.ok(html.includes("font-family:'Fredoka'"), 'Fredoka toujours utilisée quelque part (sinon ce test n\'a plus de sens)');
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
