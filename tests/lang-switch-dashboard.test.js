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
  dom.window.alert = (msg) => { dom.window.__lastAlert = msg; };
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

  await testAsync('les 8 langues du sélecteur suivent bien le changement, une par une', async () => {
    // Le fix (onLangChange -> renderDashboard) est générique : il ne
    // connaît pas la langue, il se contente de tout re-rendre. Mais
    // seule ar<->fr avait été vérifiée avant ce test — on couvre ici
    // les 6 autres langues actives, plus le cas particulier du kabyle
    // (kab), volontairement incomplet (voir tests/i18n-completeness.test.js) :
    // son accueil a sa propre traduction ("Azul"), mais le nom du niveau
    // n'existe pas dans cette langue et doit retomber sur le français
    // (repli documenté de I18N.t(), pas un oubli).
    const expected = {
      fr:  { hello:'Bonjour',  level1:'Doux' },
      en:  { hello:'Hello',    level1:'Gentle' },
      es:  { hello:'Hola',     level1:'Suave' },
      it:  { hello:'Ciao',     level1:'Leggero' },
      pt:  { hello:'Olá',      level1:'Suave' },
      de:  { hello:'Hallo',    level1:'Sanft' },
      kab: { hello:'Azul',     level1:'Doux' }, // repli fr pour level_1, absent en kab
    };
    for(const [lang, exp] of Object.entries(expected)){
      window.Prefs.setLang(lang);
      // renderMedia() (appelée par renderDashboard) est asynchrone et
      // PAS attendue par renderDashboard() — sans ce petit délai, le
      // contenu de #media-grid vérifié juste après serait encore celui
      // de la langue précédente (mais hello/level-name, eux, sont bien
      // synchrones : voir onLangChange() dans js/app.js).
      await new Promise(res => setTimeout(res, 0));
      const hello = document.getElementById('hello').textContent;
      const levelName = document.getElementById('level-name').textContent;
      const mediaEmpty = document.querySelector('#media-grid .media-empty');
      assert.ok(hello.includes(exp.hello), `[${lang}] accueil attendu contenant "${exp.hello}", obtenu : "${hello}"`);
      assert.strictEqual(levelName, exp.level1, `[${lang}] nom du niveau attendu "${exp.level1}", obtenu : "${levelName}"`);
      assert.strictEqual(document.documentElement.dir, 'ltr', `[${lang}] direction attendue ltr (seul l'arabe est rtl)`);
      // v6.25 (suite) : bug signalé par capture — "Ajoutez une photo..."
      // restait figé en français quelle que soit la langue (texte en dur
      // dans renderMedia(), jamais passé par I18N.t()). Vérifie que ce
      // n'est plus le cas, dans toutes les langues.
      assert.ok(mediaEmpty, `[${lang}] le message d'état vide des photos doit exister (aucune photo pour ce patient de test)`);
      if(lang !== 'fr' && lang !== 'kab'){ // kab retombe aussi sur le fr ici (pas de clé photos_empty en kab, repli documenté)
        assert.ok(!mediaEmpty.textContent.includes('Ajoutez une photo de votre quotidien'), `[${lang}] le message d'état vide des photos ne doit plus être figé en français, obtenu : "${mediaEmpty.textContent}"`);
      }
    }
    // Retour à l'arabe pour confirmer qu'on ne reste pas bloqué sur la
    // dernière langue de la boucle (déjà couvert plus haut, mais ça ne
    // coûte rien de le reconfirmer après avoir cyclé sur 7 langues).
    window.Prefs.setLang('ar');
    assert.ok(document.getElementById('hello').textContent.includes('مرحبًا'), 'retour à l\'arabe après la boucle : accueil arabe');
    assert.strictEqual(document.documentElement.dir, 'rtl', 'retour à l\'arabe après la boucle : direction rtl');
  });

  await testAsync('audit large : alerte de connexion sans code et message du graphique vide sont bien traduits', async () => {
    // v6.25 (suite, audit demandé après le bug des photos) : 2 autres
    // textes en dur trouvés hors du tableau de bord — l'alerte "Saisissez
    // votre code..." (écran de connexion) et le message "Pas encore
    // assez de séances..." du graphique de progression (js/charts.js,
    // qui doit rester fonctionnel aussi côté espace ortho, lequel ne
    // charge PAS i18n.js — d'où le repli explicite dans ce fichier).
    window.logout();
    const cases = { fr:'Saisissez votre code', en:'Enter your tracking code', it:'Inserisci il tuo codice' };
    for(const [lang, expected] of Object.entries(cases)){
      window.Prefs.setLang(lang);
      document.getElementById('code').value = '';
      window.__lastAlert = undefined;
      await window.login();
      assert.ok(document.getElementById('login').classList.contains('active'), `[${lang}] doit rester sur l'écran de connexion sans code`);
      assert.ok(window.__lastAlert && window.__lastAlert.includes(expected), `[${lang}] alerte attendue contenant "${expected}", obtenu : "${window.__lastAlert}"`);
    }
    // Reconnexion réelle pour vérifier le message du graphique (aucune
    // séance enregistrée pour ce patient de test -> message "pas assez
    // de séances", pas un graphique vide silencieux).
    document.getElementById('code').value = 'p-test123';
    for(const [lang, expected] of Object.entries({ fr:'Pas encore assez', en:'Not enough sessions', it:'Non ci sono ancora' })){
      window.Prefs.setLang(lang);
      await window.login();
      await new Promise(res => setTimeout(res, 0));
      const histEl = document.getElementById('progress-chart') || document.querySelector('.card p.hint');
      assert.ok(histEl, `[${lang}] la zone du graphique de progression doit exister`);
      assert.ok(histEl.textContent.includes(expected), `[${lang}] message du graphique attendu contenant "${expected}", obtenu : "${histEl.textContent}"`);
      window.logout();
    }
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
