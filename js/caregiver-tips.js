// =====================================================================
//  ESPACE AIDANT — conseils du jour (v6.35)
//  ---------------------------------------------------------------------
//  Garde-fou n°1 (SKILL_ReParole_v6.md) : pas d'IA générative. Ce
//  fichier ne fait QUE des règles explicites, lisibles et testables sur
//  des chiffres déjà connus (streak, dernière activité, catégories
//  d'erreurs) — jamais une boîte noire, jamais un texte inventé au vol.
//
//  Garde-fou n°6 : ces conseils restent au niveau pratique ("comment
//  aider aujourd'hui"), jamais une norme clinique chiffrée qui pourrait
//  inquiéter ou pousser à l'auto-diagnostic.
//
//  Testé par tests/caregiver.test.js.
// =====================================================================

const CAREGIVER_TIP_TEXT = {
  no_sessions:
    "Pas encore de séance enregistrée. Installez-vous à côté la première fois, ça rassure — vous n'avez rien de spécial à faire, juste être présent·e.",
  inactivity:
    "Ça fait quelques jours sans séance. Proposez une séance courte aujourd'hui, sans insister si la personne est fatiguée — 5 minutes valent mieux que rien.",
  streak_good:
    "Belle régularité ces derniers jours. Un mot d'encouragement compte autant que l'exercice lui-même — pensez à le dire.",
  cat_semantic:
    "Les erreurs récentes sont surtout des mots qui ne viennent pas (\"sur le bout de la langue\"). Laissez du temps, proposez un indice (la catégorie, le premier son) plutôt que de donner la réponse tout de suite.",
  cat_phonological:
    "Les erreurs récentes touchent surtout la prononciation. Répétez le mot correct une fois, lentement, sans faire répéter en boucle si la frustration monte.",
  cat_syntax:
    "Les erreurs récentes touchent plutôt la construction des phrases. Pas besoin de corriger chaque mot — reformulez simplement la phrase correcte en réponse, naturellement.",
  cat_omission:
    "Il arrive souvent que la réponse ne vienne pas du tout en ce moment. C'est normal, ça ne veut pas dire un recul — proposer un choix (\"un animal ou un objet ?\") aide plus que d'attendre en silence.",
  general_ok:
    "Rien de particulier à signaler cette semaine. Continuez à proposer des séances courtes et régulières, c'est ce qui compte le plus.",
  always_refer:
    "Vous accompagnez, vous ne remplacez pas l'orthophoniste. Une difficulté nouvelle ou qui inquiète ? Mieux vaut en parler à l'équipe soignante qu'essayer de la résoudre seul·e."
};

// data attendu : { sessions, streak, last_seen, error_tally } (voir
// get_caregiver_data côté SQL / loadCaregiverData côté storage.js).
// now : injectable pour les tests (sinon new Date()).
function generateCaregiverTips(data, now){
  now = now || new Date();
  data = data || {};
  const sessions = data.sessions || 0;
  const streak = data.streak || 0;
  const tally = data.error_tally || {};

  const dynamic = [];

  if(sessions === 0){
    dynamic.push('no_sessions');
  } else {
    if(data.last_seen){
      const days = Math.floor((now - new Date(data.last_seen)) / 86400000);
      if(days >= 3) dynamic.push('inactivity');
    }
    if(streak >= 5) dynamic.push('streak_good');

    const totalErrors = Object.values(tally).reduce((a,b)=>a+b, 0);
    if(totalErrors >= 3){
      // tri par fréquence décroissante, égalité tranchée par ordre alphabétique
      // (déterministe : pas de hasard dans un conseil affiché à un aidant)
      const [topCategory] = Object.entries(tally).sort((a,b)=> b[1]-a[1] || a[0].localeCompare(b[0]))[0];
      const key = 'cat_' + topCategory;
      if(CAREGIVER_TIP_TEXT[key]) dynamic.push(key);
    }

    if(dynamic.length === 0) dynamic.push('general_ok');
  }

  // au maximum 2 conseils "dynamiques" par jour + le rappel fixe, pour
  // ne pas noyer l'aidant sous du texte
  const ids = dynamic.slice(0, 2);
  ids.push('always_refer');
  return ids.map(id => ({ id, text: CAREGIVER_TIP_TEXT[id] }));
}

if(typeof window !== 'undefined'){
  window.CaregiverTips = { generateCaregiverTips, CAREGIVER_TIP_TEXT };
}
if(typeof module !== 'undefined' && module.exports){
  module.exports = { generateCaregiverTips, CAREGIVER_TIP_TEXT };
}
