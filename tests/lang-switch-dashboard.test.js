// =====================================================================
//  FILET DE SÉCURITÉ — changement de langue depuis le tableau de bord (v6.25)
//  ---------------------------------------------------------------------
//  Vrai bug remonté par capture d'écran : un patient passe de l'arabe au
//  français DEPUIS le tableau de bord (sélecteur présent directement sur
//  cet écran, voir index.html). Les libellés statiques (marqués
//  data-i18n, ex. "Niveau adapté :", "Se déconnecter") repassaient bien
//  en français, mais tout ce que renderDashboard() écrit directement en
//  JS (accueil "Bonjour Marie", nom du niveau, message d'Ami, encadré
//  "Votre assistant a appris") restait figé dans l'ancienne langue —
//  calculé une seule fois, à l'affichage précédent du tableau de bord,
//  jamais recalculé par Prefs.apply() qui ne touche que le DOM marqué
//  data-i18n.
//
//  Corrigé en v6.25 via un hook optionnel `onLangChange()` (js/app.js),
//  appelé par Prefs.apply() (js/prefs.js) après avoir appliqué la
//  nouvelle langue : si le tableau de bord est l'écran actif, il est
//  entièrement re-rendu.
//
//  Lancer : node tests/lang-switch-dashboard.test.js
//  (nécessite jsdom : npm install)
// =====================================================================

const { JSDOM } = require('jsdom');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn){
  try{ fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}
async function testAsync(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.error('  ✘', name, '\n    ', e.message); process.exitCode = 1; }
}

function loadApp(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url:'http://localhost/', runScripts:'outside-only' });
  dom.window.scrollTo = () => {};
  dom.window.alert = () => {};
  const scripts = [...dom.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  const errors = [];
  for(const src of scripts){
    let code = fs.readFileSync(path.join(ROOT, src), 'utf8');
    // v6.25 : depuis que de vraies clés Supabase sont renseignées dans
    // js/storage.js, CLOUD_ENABLED vaut désormais `true` par défaut. Ce
    // test porte sur l'i18n du tableau de bord, pas sur l'intégration
    // cloud (déjà couverte par tests/ortho-security.test.js, avec son
    // propre faux client Supabase) — on force donc ici le mode
    // navigateur (localStorage) en vidant temporairement les 2 constantes
    // UNIQUEMENT dans la copie en mémoire chargée par ce test, jamais
    // dans le vrai fichier sur disque.
    if(src === 'js/storage.js'){
      code = code
        .replace(/const SUPABASE_URL = "[^"]*";/, 'const SUPABASE_URL = "";')
        .replace(/const SUPABASE_ANON_KEY = "[^"]*";/, 'const SUPABASE_ANON_KEY = "";');
    }
    try{ dom.window.eval(code); }
    catch(e){ errors.push(`Erreur de chargement dans ${src} : ${e.message}`); }
  }
  // Reproduit <script>Prefs.load();</script> (index.html, après tous les autres) :
  // sans ça, Prefs.data.lang resterait au défaut du constructeur ('fr') sans
  // jamais appeler apply(), ce qui masquerait le bug testé ici.
  dom.window.eval('Prefs.load();');
  return { window: dom.window, loadErrors: errors };
}

(async () => {
  const { window, loadErrors } = loadApp();
  loadErrors.forEach(e => console.error('  ✘ chargement:', e));
  const { document } = window;

  // Dossier patient de test, en mode navigateur (localStorage) — pas
  // besoin de Supabase pour ce test, seul le rendu compte.
  window.localStorage.setItem('reparole:p-test123', JSON.stringify({
    name:'Marie', level:1, sessions:0, correct:0, total:0, streak:1
  }));
  document.getElementById('name').value = 'Marie';
  document.getElementById('code').value = 'p-test123';

  await testAsync('connexion + tableau de bord en arabe -> contenu réellement en arabe', async () => {
    window.Prefs.setLang('ar');
    await window.login();
    assert.ok(document.getElementById('dashboard').classList.contains('active'), 'le tableau de bord doit être affiché après connexion');
    assert.strictEqual(document.documentElement.dir, 'rtl', 'la direction du document doit passer en RTL pour l\'arabe');
    assert.ok(document.getElementById('hello').textContent.includes('مرحبًا'), 'accueil attendu en arabe');
    assert.strictEqual(document.getElementById('level-name').textContent, 'سهل', 'nom du niveau attendu en arabe (niveau 1)');
  });

  test('changement de langue arabe -> français DEPUIS le tableau de bord : accueil traduit', () => {
    window.Prefs.setLang('fr');
    assert.strictEqual(document.documentElement.dir, 'ltr', 'la direction du document doit repasser en LTR pour le français');
    assert.ok(document.getElementById('hello').textContent.includes('Bonjour'), `l'accueil doit repasser en français, obtenu : "${document.getElementById('hello').textContent}"`);
    assert.ok(!document.getElementById('hello').textContent.includes('مرحبًا'), 'l\'accueil ne doit plus contenir de texte arabe');
  });

  test('changement de langue : nom du niveau traduit', () => {
    assert.strictEqual(document.getElementById('level-name').textContent, 'Doux', 'nom du niveau attendu en français (niveau 1)');
  });

  test('changement de langue : le message d\'Ami est retraduit (plus de texte arabe)', () => {
    const bubble = document.querySelector('#companion-dashboard .companion-bubble');
    assert.ok(bubble, 'la bulle de message d\'Ami doit exister après renderDashboard()');
    // On ne connaît pas la phrase exacte (tirage aléatoire), mais elle ne
    // doit plus contenir de caractères arabes après le passage en français.
    assert.ok(!/[\u0600-\u06FF]/.test(bubble.textContent), `le message d'Ami ne doit plus contenir d'arabe, obtenu : "${bubble.textContent}"`);
  });

  test('re-changement vers l\'arabe : le contenu redevient bien arabe (pas un simple blocage sur le français)', () => {
    window.Prefs.setLang('ar');
    assert.ok(document.getElementById('hello').textContent.includes('مرحبًا'), 'l\'accueil doit redevenir arabe');
    assert.strictEqual(document.getElementById('level-name').textContent, 'سهل', 'le nom du niveau doit redevenir arabe');
  });

  await testAsync('changer de langue DEPUIS un autre écran (ex : login) ne doit pas planter, ni ne fait rien de superflu', async () => {
    // Laisse le rendu asynchrone déclenché par le setLang('ar') précédent
    // se terminer avant de se déconnecter (Store.history() etc.) — sans
    // quoi ce renderDashboard() encore en cours retrouverait `user` à
    // `null` après logout(), ce qui est un autre sujet que celui testé
    // ici (pas de garde contre un rendu interrompu par une déconnexion :
    // à signaler séparément si ça devient un vrai problème en pratique).
    await new Promise(res => setTimeout(res, 20));
    // logout() ramène à l'écran de connexion ; le tableau de bord n'est
    // alors plus l'écran actif, onLangChange() ne doit rien re-rendre
    // (pas d'erreur si #hello n'a pas besoin d'être retouché, `user` est
    // à null après logout() donc le hook se contente de ne rien faire).
    window.logout();
    assert.doesNotThrow(() => window.Prefs.setLang('fr'), 'changer de langue depuis l\'écran de connexion ne doit jamais lever d\'erreur');
    assert.ok(document.getElementById('login').classList.contains('active'), 'reste bien sur l\'écran de connexion');
  });

  console.log(`\n${passed} test(s) réussi(s).`);
  if(process.exitCode){ console.log('\n❌ Des problèmes ont été détectés ci-dessus.'); }
  else{ console.log('\n✅ Aucun problème détecté — le contenu dynamique du tableau de bord suit bien le changement de langue.'); }
})();
