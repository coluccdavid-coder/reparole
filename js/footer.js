// =====================================================================
//  PIED DE PAGE COMMUN (v6.56) — mentions légales / CGV / CGU
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
// =====================================================================
(function(){
  const year = new Date().getFullYear();
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <nav aria-label="Informations légales">
      <a href="mentions-legales.html">Mentions légales</a>
      <span aria-hidden="true">·</span>
      <a href="cgv.html">CGV</a>
      <span aria-hidden="true">·</span>
      <a href="cgu.html">CGU</a>
    </nav>
    <p>© ${year} ReParole</p>
  `;
  document.body.appendChild(footer);
})();
