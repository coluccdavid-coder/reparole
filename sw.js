// =====================================================================
//  SERVICE WORKER — mode hors-ligne (v6.23)
//  ---------------------------------------------------------------------
//  Objectif : une fois l'app chargée une première fois (avec
//  connexion), les patients peuvent continuer à faire leurs exercices
//  sans connexion internet — utile en salle d'attente, en zone mal
//  couverte, ou simplement pour économiser des données mobiles.
//
//  Ce que ça change concrètement pour le mode local (sans compte
//  cloud) : l'app entière fonctionne hors-ligne, exercices compris,
//  puisque les données sont déjà stockées dans le navigateur
//  (localStorage). Pour le mode cloud (compte Supabase) : la
//  connexion reste nécessaire pour se connecter/sauvegarder, mais
//  l'app elle-même (l'interface, pas de page blanche) se charge même
//  hors-ligne.
//
//  Stratégie : "cache d'abord" pour les fichiers de l'app (HTML/CSS/JS)
//  — rapide et fonctionne hors-ligne — avec repli sur le réseau si un
//  fichier n'est pas encore en cache (ex: après une mise à jour).
//  Les requêtes vers d'autres domaines (Supabase, Google Fonts) ne
//  sont JAMAIS interceptées : uniquement les fichiers de cette app.
//
//  ⚠️ Pour livrer une mise à jour de l'app qui doit vraiment atteindre
//  les patients (correctif important), il FAUT incrémenter CACHE_NAME
//  ci-dessous — sinon les navigateurs continueront de servir les
//  anciens fichiers mis en cache. Ne pas oublier, comme pour tout
//  changement touchant à plusieurs fichiers.
// =====================================================================

const CACHE_NAME = 'reparole-v6-93';

const APP_SHELL = [
  './',
  './index.html',
  './aidant.html',
  './mon-resume.html',
  './contribuer.html',
  './admin.html',
  './mentions-legales.html',
  './confidentialite.html',
  './politique-cookies.html',
  './gestion-cookies.html',
  './cgv.html',
  './cgu.html',
  './manifest.json',
  './css/style.css',
  './css/ortho.css',
  './css/companion.css',
  './js/app.js',
  './js/admin.js',
  './js/contribute.js',
  './js/assessment.js',
  './js/caregiver.js',
  './js/caregiver-tips.js',
  './js/charts.js',
  './js/companion.js',
  './js/suggestions.js',
  './js/footer.js',
  './js/conversation.js',
  './js/exercises.js',
  './js/exercises-en.js',
  './js/exercises-es.js',
  './js/exercises-it.js',
  './js/exercises-pt.js',
  './js/exercises-de.js',
  './js/exercises-ar.js',
  './js/exercises-tr.js',
  './js/exercises-pl.js',
  './js/exercises-kab.js',
  './js/exercises-sango.js',
  './js/exercises-ja.js',
  './js/i18n.js',
  './js/learner.js',
  './js/memory.js',
  './js/phonation.js',
  './js/prefs.js',
  './js/storage.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne jamais intercepter autre chose que les fichiers de cette app
  // (Supabase, polices Google Fonts, etc. passent directement au réseau).
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Met aussi en cache les fichiers récupérés du réseau, pour
          // qu'ils soient disponibles hors-ligne la prochaine fois.
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Hors-ligne et pas en cache : pour une navigation (changement
          // de page), on retombe sur index.html plutôt qu'une erreur brute.
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 408, statusText: 'Hors-ligne' });
        });
    })
  );
});
