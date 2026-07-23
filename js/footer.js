// =====================================================================
//  PIED DE PAGE COMMUN (v6.56, multilingue depuis v6.124)
//  ---------------------------------------------------------------------
//  Obligation légale : ces 3 pages doivent être accessibles en un clic
//  depuis n'importe quelle page du site. Plutôt que de dupliquer le
//  même HTML dans chaque fichier .html (5 pages concernées), un seul
//  script injecté partout — un seul endroit à mettre à jour si les
//  liens ou le texte changent.
//
//  Chargé via <script src="js/footer.js"></script> juste avant la
//  fermeture de <body> sur : index.html, aidant.html, mon-resume.html,
//  contribuer.html, dashboard-ortho.html. Pas sur admin.html (outil
//  interne, pas un espace "client") ni report.html (destiné à
//  l'impression, pas à la navigation).
//
//  v6.124 : jusqu'ici codé en dur en français pour TOUTES les langues,
//  jamais localisé (repéré en intégrant les traductions kabyles reçues
//  pour ces 6 libellés). Utilise maintenant I18N.t() — mais
//  mon-resume.html et contribuer.html ne chargent pas js/i18n.js,
//  donc repli défensif sur le français si I18N n'existe pas, même
//  principe que le correctif de js/charts.js (v6.115).
// =====================================================================
(function(){
  const year = new Date().getFullYear();
  const hasI18N = (typeof I18N !== 'undefined' && typeof I18N.t === 'function');
  const t = (key, fallback) => hasI18N ? I18N.t(key) : fallback;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <nav aria-label="Informations légales">
      <a href="mentions-legales.html">${t('footer_mentions_legales','Mentions légales')}</a>
      <span aria-hidden="true">·</span>
      <a href="confidentialite.html">${t('footer_confidentialite','Confidentialité')}</a>
      <span aria-hidden="true">·</span>
      <a href="politique-cookies.html">${t('footer_cookies_policy','Politique cookies')}</a>
      <span aria-hidden="true">·</span>
      <a href="gestion-cookies.html">${t('footer_cookies_management','Gestion des cookies')}</a>
      <span aria-hidden="true">·</span>
      <a href="cgv.html">${t('footer_cgv','CGV')}</a>
      <span aria-hidden="true">·</span>
      <a href="cgu.html">${t('footer_cgu','CGU')}</a>
    </nav>
    <p>© ${year} ReParole</p>
  `;
  document.body.appendChild(footer);
})();
