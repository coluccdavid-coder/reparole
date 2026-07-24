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

const CACHE_NAME = 'reparole-v6-247';

// v6.244 — LES VOIX NE DOIVENT PLUS ÊTRE PURGÉES À CHAQUE VERSION.
// ---------------------------------------------------------------------
// Les enregistrements de audio/ vivent dans un cache SÉPARÉ, que
// l'évènement `activate` ne supprime jamais. Pourquoi c'est sans risque :
// un mp3 est nommé d'après le hash de son texte (voir speak() dans
// js/app.js) — pour un nom de fichier donné, le contenu ne change JAMAIS.
// Un texte modifié produit un nouveau nom, donc un nouveau téléchargement.
// Il n'y a donc rien à invalider.
//
// Ce qui se passait avant : CACHE_NAME change à chaque version, `activate`
// supprimait tous les caches portant un autre nom — y compris les ~300 mp3
// déjà téléchargés. Après CHAQUE déploiement, le patient re-téléchargeait
// la totalité des voix, mot par mot, et réentendait la voix synthétique du
// navigateur en attendant (repli au bout de 2,5 s dans speak()).
const AUDIO_CACHE = 'reparole-audio-v1';

const APP_SHELL = [
  './',
  './index.html',
  './accueil.html',
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
  './js/sw-update.js',
  './js/conversation.js',
  './js/exercises.js',
  './js/exercises-new-types.js',
  './js/exercises-acalculie.js',
  './js/exercises-story.js',
  './js/exercises-story-i18n.js',
  './js/exercises-acalculie-i18n.js',
  './js/exercises-syntax-i18n.js',
  './js/exercises-en.js',
  './js/exercises-es.js',
  './js/exercises-it.js',
  './js/exercises-pt.js',
  './js/exercises-de.js',
  './js/exercises-ar.js',
  './js/exercises-tr.js',
  './js/exercises-pl.js',
  './js/exercises-kab.js',
  './js/exercises-dz.js',
  './js/exercises-ma.js',
  './js/exercises-tn.js',
  './js/exercises-story-dz.js',
  './js/exercises-story-ma.js',
  './js/exercises-story-tn.js',
  './js/exercises-ja.js',
  './js/i18n.js',
  // v6.247 : seul le français est pré-chargé pour le mode hors-ligne — c'est
  // le repli de I18N.t(), donc l'app reste utilisable sans lui. Les 13 autres
  // langues font 580 Ko à elles toutes : les précharger annulerait tout le
  // bénéfice du découpage. Elles sont mises en cache automatiquement au
  // premier usage par la branche « cache d'abord » du gestionnaire fetch,
  // donc disponibles hors-ligne dès la deuxième ouverture.
  './js/i18n/fr.js',
  './js/learner.js',
  './js/memory.js',
  './js/phonation.js',
  './js/prefs.js',
  './js/storage.js',
  './js/error-tracking.js',
  './js/enter-submit.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
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
        // v6.244 : AUDIO_CACHE est épargné — voir le commentaire de sa
        // déclaration. Le supprimer ici reviendrait à refaire télécharger
        // toutes les voix à chaque mise à jour.
        names
          .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE)
          .map((name) => caches.delete(name))
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
  // v6.219 : les PAGES (navigations) passent en « réseau d'abord » — on
  // sert toujours la dernière version en ligne, et le cache ne sert qu'en
  // secours hors-ligne. Ça évite de rester bloqué sur une ancienne page
  // après un déploiement. Les autres ressources restent « cache d'abord ».
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // v6.244 : les voix pré-générées vont dans le cache permanent, pas dans
  // le cache de version. Seules les réponses 200 sont conservées : un 404
  // (langue partielle sans enregistrement) ne doit jamais être mémorisé,
  // sinon un fichier ajouté plus tard resterait invisible.
  if (url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => new Response('', { status: 408, statusText: 'Hors-ligne' }));
        })
      )
    );
    return;
  }

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
