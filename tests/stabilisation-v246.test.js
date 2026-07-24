// =====================================================================
//  TESTS — v6.246 : STABILISATION (perte de données silencieuse)
//  ---------------------------------------------------------------------
//  Trois défauts corrigés, tous silencieux — donc tous dangereux, parce
//  qu'un patient aphasique ne signalera pas « ma séance n'a pas été
//  enregistrée » :
//
//  1. 31 lectures de localStorage faisaient JSON.parse() sans filet.
//     En mode local, localStorage EST la base de données du patient :
//     une valeur corrompue cassait l'écran au chargement, alors que les
//     données étaient toujours là, simplement illisibles.
//  2. La file d'attente hors-ligne n'avait ni plafond, ni purge, ni
//     limite de réessais, et `_enqueue()` ignorait l'échec d'écriture.
//  3. L'interface promettait « rien n'est perdu » — une affirmation que
//     le code ne pouvait pas garantir (règle 5 du projet).
//
//  Et un garde-fou de poids, pour que l'allègement à venir ne soit pas
//  repris par la dérive habituelle.
//
//  Lancer : node tests/stabilisation-v246.test.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let passed = 0, failed = 0;
async function test(name, fn){
  try{ await fn(); console.log('  ✔', name); passed++; }
  catch(e){ console.log('  ✘', name, '—', e.message); failed++; }
}

const STORAGE = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');

// Un faux localStorage qu'on peut corrompre et saturer à volonté.
function fauxStockage(initial = {}, opts = {}){
  const data = Object.assign({}, initial);
  return {
    _data: data,
    plein: !!opts.plein,
    getItem(k){ return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v){
      if(this.plein){ const e = new Error('QuotaExceededError'); e.name = 'QuotaExceededError'; throw e; }
      data[k] = String(v);
    },
    removeItem(k){ delete data[k]; }
  };
}

// Charge uniquement les fonctions bas niveau de storage.js, sans Supabase.
function chargeHelpers(localStorage){
  const debut = STORAGE.indexOf('function _lsGet(');
  const fin = STORAGE.indexOf('const ReParoleStore');
  assert.ok(debut !== -1 && fin > debut, 'structure de storage.js inattendue');
  const sandbox = {
    localStorage,
    console: { warn(){}, log(){}, info(){} },
    Date, JSON, Array, Object, Number, String, Error,
    CLOUD_ENABLED: false,
    window: undefined,
    navigator: undefined
  };
  vm.createContext(sandbox);
  vm.runInContext(STORAGE.slice(debut, fin) + `
    ;globalThis.__api = { _lsGet, _lsSet, _pendingList, _enqueue, _abandonCount,
                          PENDING_MAX, PENDING_TRIES, PENDING_MAX_AGE_MS };`, sandbox);
  return sandbox.__api;
}

async function main(){

console.log('Lecture du stockage local — plus aucune exception possible');

await test('plus aucun JSON.parse(localStorage…) non protégé dans storage.js', ()=>{
  const restants = [];
  STORAGE.split('\n').forEach((ligne, i)=>{
    if(/JSON\.parse\(localStorage/.test(ligne) && !/try\{/.test(ligne)) restants.push(i+1);
  });
  assert.strictEqual(restants.length, 0,
    `lecture non protégée ligne(s) ${restants.join(', ')} — passer par _lsGet()`);
});

await test('_lsGet() rend la valeur par défaut sur une donnée corrompue, sans lever', ()=>{
  const ls = fauxStockage({ 'reparole:hist:AB12': '[{"score":3,' });  // JSON tronqué
  const { _lsGet } = chargeHelpers(ls);
  const v = _lsGet('reparole:hist:AB12', []);
  assert.deepStrictEqual(v, [], 'devrait retomber sur la valeur par défaut');
});

await test('la donnée corrompue est MISE DE CÔTÉ, jamais perdue', ()=>{
  const brut = '[{"score":3,';
  const ls = fauxStockage({ 'reparole:hist:AB12': brut });
  const { _lsGet } = chargeHelpers(ls);
  _lsGet('reparole:hist:AB12', []);
  assert.strictEqual(ls.getItem('reparole:hist:AB12:corrompu'), brut,
    'les octets originaux doivent rester récupérables');
});

await test('_lsGet() refuse aussi du JSON valide mais de la mauvaise forme', ()=>{
  const ls = fauxStockage({ liste: '"une chaîne"', objet: '[1,2,3]' });
  const { _lsGet } = chargeHelpers(ls);
  assert.deepStrictEqual(_lsGet('liste', []), [], 'une chaîne là où on attend une liste');
  assert.deepStrictEqual(_lsGet('objet', {}), {}, 'une liste là où on attend un objet');
});

await test('_lsGet() survit à un stockage totalement inaccessible', ()=>{
  const ls = { getItem(){ throw new Error('SecurityError'); }, setItem(){}, removeItem(){} };
  const { _lsGet } = chargeHelpers(ls);
  assert.deepStrictEqual(_lsGet('peu importe', []), []);
});

console.log('\nFile d\'attente hors-ligne — bornée, et honnête sur ses pertes');

await test('la file a un plafond, une limite de réessais et une purge par âge', ()=>{
  const { PENDING_MAX, PENDING_TRIES, PENDING_MAX_AGE_MS } = chargeHelpers(fauxStockage());
  assert.ok(PENDING_MAX > 0 && PENDING_MAX <= 1000, 'plafond absent ou déraisonnable');
  assert.ok(PENDING_TRIES > 0 && PENDING_TRIES <= 20, 'limite de réessais absente');
  assert.ok(PENDING_MAX_AGE_MS > 0, 'purge par âge absente');
});

await test('au-delà du plafond, la file sacrifie les PLUS ANCIENS (pas le dernier fait)', ()=>{
  const ls = fauxStockage();
  const api = chargeHelpers(ls);
  for(let i = 0; i < api.PENDING_MAX + 5; i++) api._enqueue('session', { n: i });
  const liste = api._pendingList();
  assert.strictEqual(liste.length, api.PENDING_MAX, 'la file dépasse son plafond');
  assert.strictEqual(liste[liste.length - 1].payload.n, api.PENDING_MAX + 4,
    'le dernier enregistrement doit être conservé');
  assert.strictEqual(liste[0].payload.n, 5, 'ce sont les plus anciens qui cèdent la place');
});

await test('ce qui est sacrifié est COMPTÉ (jamais une perte muette)', ()=>{
  const ls = fauxStockage();
  const api = chargeHelpers(ls);
  for(let i = 0; i < api.PENDING_MAX + 3; i++) api._enqueue('session', { n: i });
  assert.strictEqual(api._abandonCount(), 3, 'les 3 éléments évincés doivent être comptés');
});

await test('un stockage plein est constaté, pas ignoré', ()=>{
  const ls = fauxStockage({}, { plein: true });
  const api = chargeHelpers(ls);
  api._enqueue('session', { score: 8 });
  assert.strictEqual(api._abandonCount(), 0,
    'le compteur lui-même ne peut pas être écrit si le stockage est plein — mais _enqueue ne doit pas lever');
});

await test('chaque élément mis en file porte un compteur de tentatives', ()=>{
  const ls = fauxStockage();
  const api = chargeHelpers(ls);
  api._enqueue('session', { score: 1 });
  assert.strictEqual(api._pendingList()[0].tries, 0, 'champ tries absent — le réessai serait infini');
});

await test('_flushPending() abandonne après N échecs au lieu de rejouer sans fin', ()=>{
  const bloc = STORAGE.slice(STORAGE.indexOf('async function _flushPending'), STORAGE.indexOf('if(typeof window'));
  assert.ok(/tries\s*>=\s*PENDING_TRIES/.test(bloc), 'aucune sortie après N tentatives');
  assert.ok(/PENDING_MAX_AGE_MS/.test(bloc), 'aucune purge par âge avant les appels réseau');
});

await test('une perte remonte dans les erreurs client (visible côté administrateur)', ()=>{
  const bloc = STORAGE.slice(STORAGE.indexOf('function _abandon'), STORAGE.indexOf('let _statusListeners'));
  assert.ok(/logClientError/.test(bloc),
    'une perte doit atterrir là où quelqu\'un la verra, pas seulement dans la console');
});

console.log('\nHonnêteté de l\'interface');

await test('l\'app ne promet plus « rien n\'est perdu »', ()=>{
  // On regarde le code affiché, pas les commentaires : celui qui explique
  // ce correctif cite forcément la phrase qu'il supprime.
  const coupables = APP.split('\n')
    .map((l, i)=>({ l, n: i+1 }))
    .filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.l) && /rien n'est perdu/i.test(x.l));
  assert.strictEqual(coupables.length, 0,
    `promesse que le code ne peut pas tenir quand le stockage est plein (règle 5) — ligne(s) ${coupables.map(x=>x.n).join(', ')}`);
});

await test('l\'indicateur sait afficher les enregistrements réellement perdus', ()=>{
  const bloc = APP.slice(APP.indexOf('onSaveStatusChange'), APP.indexOf('onSaveStatusChange') + 900);
  assert.ok(/perdus/.test(bloc), 'le second paramètre (pertes) n\'est pas exploité');
});

await test('le nombre de pertes est exposé par le store', ()=>{
  assert.ok(/lostCount\(\)/.test(STORAGE), 'lostCount() absent de ReParoleStore');
  assert.ok(/clearLostCount\(\)/.test(STORAGE), 'clearLostCount() absent — le compteur ne pourrait jamais être soldé');
});

console.log('\nFilets et garde-fous');

await test('toutes les pages interactives du parcours patient remontent leurs erreurs', ()=>{
  const pages = ['index.html', 'aidant.html', 'mon-resume.html', 'reset-password.html', 'contribuer.html'];
  const sans = pages.filter(p => !fs.readFileSync(path.join(ROOT, p), 'utf8').includes('js/error-tracking.js'));
  assert.strictEqual(sans.length, 0, `sans suivi d'erreurs : ${sans.join(', ')}`);
});

await test('budget de poids : index.html et ses fichiers restent sous 2 Mo', ()=>{
  // Garde-fou, pas objectif : l'application patient pèse aujourd'hui
  // ~2,5 Mo (voir docs/AUDIT-v6.245.md). Ce plafond existe pour que le
  // poids ne remonte pas pendant qu'on travaille à le faire baisser.
  // Quand l'allègement de i18n.js sera fait, ABAISSER ce chiffre.
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  let total = fs.statSync(path.join(ROOT, 'index.html')).size;
  [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].forEach(m=>{
    const f = path.join(ROOT, m[1]);
    if(fs.existsSync(f)) total += fs.statSync(f).size;
  });
  const ko = Math.round(total / 1024);
  // v6.247 : plafond ABAISSÉ après le découpage des langues (2765 -> 2048).
  assert.ok(ko < 2048, `l'application patient pèse ${ko} Ko — au-dessus du plafond de 2048 Ko`);
  console.log(`      (poids actuel : ${ko} Ko)`);
});

console.log(`\n${passed} test(s) réussi(s), ${failed} échec(s).`);
if(failed > 0) process.exit(1);
}

main();
