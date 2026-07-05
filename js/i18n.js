// =====================================================================
//  v6.9 — ANGLAIS : langue complète, contrairement au kabyle
//  ---------------------------------------------------------------------
//  L'anglais est entièrement pris en charge : interface (ci-dessous),
//  contenu des exercices (js/exercises-en.js, BANK_EN, tous les types y
//  compris les exercices vocaux), synthèse ET reconnaissance vocales
//  (voir speechLocale ci-dessous, utilisé par js/app.js). Un patient qui
//  choisit l'anglais n'a donc plus aucun repli automatique vers le
//  français, contrairement au kabyle qui reste volontairement partiel
//  (voir l'explication ci-dessus).
// =====================================================================

// =====================================================================
//  TRADUCTION DE L'INTERFACE — français / kabyle (v6)
//  ---------------------------------------------------------------------
//  ⚠️ Je ne suis pas locuteur natif du kabyle. Ces traductions couvrent
//  l'interface générale avec un vocabulaire courant et standard, mais
//  DOIVENT être relues par une personne kabylophone avant tout usage
//  clinique réel — comme pour tout le contenu de cette application
//  (voir SKILL_ReParole_Pro_v4.md : "validation clinique obligatoire").
//
//  Pourquoi le kabyle ne couvre pas TOUT :
//   - Les exercices vocaux (répétition, dénomination orale, fluence,
//     conversation guidée) restent en français : la reconnaissance et
//     la synthèse vocales du navigateur ne prennent pas en charge le
//     kabyle à ce jour (vérifié — absent des langues de Google
//     Speech-to-Text / Web Speech API). Un patient qui choisit le
//     kabyle verra ces exercices annoncés comme restant en français,
//     avec une explication, plutôt que de simuler un support qui
//     n'existe pas.
//   - Seul le niveau 1 de "Nommer les images" est traduit pour l'instant
//     (vocabulaire simple et bien attesté). Les niveaux 2-3 et les
//     autres exercices à choix (complétion, compréhension) restent à
//     traduire — voir js/exercises-kab.js pour ajouter du contenu avec
//     le même mécanisme BANK_EXTEND que le reste de l'application.
//   - Certaines clés n'ont volontairement PAS d'entrée "kab" (ex :
//     "Niveau adapté", "Votre assistant a appris", les noms de niveaux
//     Doux/Intermédiaire/Avancé). Ce sont des tournures plus abstraites
//     pour lesquelles je n'ai pas de traduction que je juge assez fiable
//     sans relecture native. Dans ce cas, I18N.t() affiche automatiquement
//     le français — c'est un filet de sécurité, pas un bug. Ajoutez la
//     clé "kab" correspondante ici dès qu'une traduction fiable existe.
// =====================================================================

// =====================================================================
//  v6.1 — REGISTRE DES LANGUES DISPONIBLES
//  ---------------------------------------------------------------------
//  Pour ajouter une nouvelle langue à l'application :
//   1. Ajoutez une entrée ici (code + nom affiché dans le sélecteur).
//   2. Ajoutez un bloc de traductions dans I18N_STRINGS (une clé =
//      une traduction ; les clés absentes retombent automatiquement
//      sur le français, comme pour le kabyle — voir plus bas).
//   3. Rien à changer dans le HTML : le sélecteur de langue se génère
//      seul à partir de ce registre (voir Prefs.renderLangSwitcher()
//      dans js/prefs.js).
//  Ordre décidé avec l'utilisateur (v6.7) : anglais d'abord (langue la
//  mieux couverte par les dictionnaires ET par la reconnaissance/synthèse
//  vocale du navigateur — contrairement au kabyle, les exercices vocaux
//  ont de bonnes chances de fonctionner nativement), une langue complète
//  à la fois avant de passer à la suivante, puis arabe, italien, espagnol
//  (le champ `dir:'rtl'` ci-dessous existe déjà pour préparer l'arabe).
// =====================================================================
const LANGUAGES = {
  fr:  { label:'Français',  dir:'ltr', speechLocale:'fr-FR' },
  en:  { label:'English',   dir:'ltr', speechLocale:'en-US' },
  kab: { label:'Taqbaylit', dir:'ltr', speechLocale:null }   // pas de synthèse/reconnaissance dispo — voir plus haut
};

const I18N_STRINGS = {
  fr: {
    app_name:'ReParole',
    login_title:'Bonjour !',
    login_sub:"Votre espace de rééducation du langage, à votre rythme.",
    field_name:'Votre prénom',
    field_code:'Code de suivi',
    field_code_ph:'Reçu à votre première visite',
    btn_login:'Se connecter',
    first_visit:'Première visite ?',
    btn_new_patient:'Créer un nouveau dossier',
    greeting_hello:'Bonjour',
    progress_title:'Votre progression',
    stat_sessions:'séances',
    stat_success:'réussite',
    stat_streak:"jours d'affilée",
    exercises_title:'Exercices recommandés',
    recommended:'Recommandé',
    ready_today:"Prêt·e pour votre séance du jour ?",
    level_adapted:'Niveau adapté :',
    assistant_learned:'Votre assistant a appris',
    assistant_learning:'Je découvre votre profil…',
    level_1:'Doux', level_2:'Intermédiaire', level_3:'Avancé',
    voice_badge:'VOIX',
    ex_repetition_t:'Répéter à voix haute', ex_repetition_d:"Prononcer le mot — l'app vous écoute",
    ex_denomination_orale_t:'Nommer à voix haute', ex_denomination_orale_d:'Dire le nom de l\'image sans choix',
    ex_fluence_t:'Fluence verbale', ex_fluence_d:"Citer un maximum de mots d'une catégorie",
    ex_denomination_t:'Nommer les images', ex_denomination_d:"Retrouver le mot qui correspond à l'image",
    ex_comprehension_t:'Comprendre la consigne', ex_comprehension_d:'Choisir la bonne réponse',
    ex_completion_t:'Compléter la phrase', ex_completion_d:'Trouver le mot manquant',
    ex_photos_t:'Nommer vos photos', ex_photos_d:'Vos propres photos, à votre rythme',
    photos_title:'Vos photos', photos_desc:"Ajoutez une photo de votre quotidien (un objet, un lieu, une personne) et le mot qui va avec — elle deviendra un exercice personnalisé.",
    photos_label_ph:'Le mot à travailler (ex : jardin)', add_photo:'Ajouter la photo',
    photos_exercise_intro:"Ce sont vos propres photos — dites le mot que vous avez choisi pour chacune.",
    conversation_title:'Conversation guidée', conversation_desc:"Des mises en situation pas à pas (chez le médecin, au café, au téléphone) pour pratiquer la communication du quotidien.",
    conversation_start:'Commencer une conversation guidée',
    reminders_title:'Rappels', reminders_desc:"Recevoir un petit rappel par email si vous n'êtes pas venu·e depuis quelques jours (facultatif).",
    reminders_enable:'Activer les rappels par email',
    voice_note_forced_fr:"Cet exercice reste en français : la reconnaissance vocale ne prend pas encore en charge le kabyle.",
    content_not_translated_yet:"Ce contenu n'est pas encore traduit en kabyle — il s'affiche en français pour l'instant.",
    btn_logout:'Se déconnecter',

    // v6.9 — écran d'exercice (auparavant en français codé en dur, non
    // traduisible ; nécessaire pour que l'anglais soit une langue COMPLÈTE,
    // pas seulement le contenu des exercices)
    denom_prompt:'Quel est ce mot ?',
    listen_instructions:'Écouter la consigne',
    completion_label:'Complétez :',
    photos_prompt:'Comment appelle-t-on ceci ?',
    denom_orale_prompt:'Dites le nom de cette image :',
    intonation_prompt:"Répétez en exagérant l'intonation :",
    repetition_prompt:'Lisez ce mot à voix haute :',
    voice_unsupported:"⚠️ La reconnaissance vocale n'est pas disponible sur ce navigateur. Utilisez Chrome, ou validez manuellement.",
    listen_word:'Entendre le mot',
    mic_instruction:'Appuyez sur le micro, puis prononcez le mot.',
    said_correctly:"✅ Je l'ai dit correctement",
    didnt_try:"Je n'ai pas essayé →",
    fluency_prompt:'Citez le plus possible de…',
    fluency_instruction:'Parlez en continu après avoir appuyé sur le micro.',
    finish_category:'Terminer cette catégorie →',
    listening_now:'🎧 Je vous écoute…',
    heard_label:'Entendu :',
    mic_unavailable:'Micro indisponible',
    validate_manually:'Validez manuellement.',
    listening_words:'🎧 Citez vos mots…',
    words_found:(n)=>`${n} mot(s) trouvé(s) — continuez, vous faites bien !`,
    session_done:'Séance terminée',
    session_result:(c,t)=>`Vous avez réussi ${c} exercice(s) sur ${t}.`,
    level_reached:'Niveau atteint :',
    progress_saved:(mode)=>`✔ Progression enregistrée (${mode})`,
    back_to_home:"Revenir à l'accueil",
    level_up_msg:(lv)=>`Vous enchaînez les réussites — je passe au niveau « ${lv} » pour vous stimuler davantage.`,
    level_down_msg:(lv)=>`Je reviens à un niveau « ${lv} » plus accessible. On reconstruit en confiance.`,
    level_steady_msg:(lv)=>`Je suis votre rythme. Niveau actuel : « ${lv} ».`,
    correct_feedback:['Bravo ! 🎉','Parfait 👏','Très bien !','Excellent !'],
    wrong_feedback:'Pas grave, on continue 🌿',
    starting_level_msg:(lv)=>`Je commence au niveau « ${lv} » d'après vos résultats précédents.`,
    fluency_success:(n)=>`Bravo, ${n} mots ! 🎉`,
    fluency_more:(n)=>`${n} mot(s). On continue en douceur 🌿`,
    session_good_msg:"Belle séance. J'enregistre votre progression pour adapter la prochaine fois.",
    session_soft_msg:"On a bien travaillé. Je garderai un démarrage plus doux la prochaine fois.",
    mic_aria_voice:'Activer le microphone pour répondre à voix haute',
    mic_aria_fluency:'Activer le microphone pour citer des mots',

    // v6.9 — corrige un oubli : ces messages venaient de js/learner.js,
    // codés en dur en français, alors qu'ils s'affichent au patient
    // (tableau de bord + fin de séance). Repéré en vérifiant l'anglais
    // avant de le livrer plutôt qu'après.
    tag_mot_court:'les mots courts', tag_mot_moyen:'les mots de longueur moyenne', tag_mot_long:'les mots longs',
    tag_animaux:'les animaux', tag_nourriture:'la nourriture', tag_objets:'les objets du quotidien',
    tag_nature:'la nature', tag_musique:'les instruments de musique', tag_corps:'le corps',
    tag_autre:'le vocabulaire général',
    insight_weak:(label)=>`J'ai remarqué que ${label} vous demandent plus d'effort. Je vais vous en proposer un peu plus pour progresser.`,
    insight_due:(label)=>`C'est le bon moment pour revoir ${label} — un peu de temps a passé depuis votre dernière réussite, on consolide.`,
    insight_strong:(label)=>`Vous êtes à l'aise avec ${label}. On consolide et on varie pour continuer à progresser.`,
    insight_default:"Je continue d'apprendre votre profil au fil des séances.",
    fatigue_high:"Vous enchaînez plusieurs essais difficiles — une petite pause peut aider. Vous pouvez reprendre quand vous voulez.",
    fatigue_medium:'On ralentit un peu le rythme.',
    login_error:"Aucun dossier ne correspond à ce code. Vérifiez-le, ou créez un nouveau dossier ci-dessous si c'est votre première visite.",

    // v6.9 (correction) — ces 3 items de la liste d'exercices n'avaient
    // jamais eu de data-i18n du tout, même en v6.6 : oubli antérieur à
    // l'anglais, repéré à cette occasion.
    ex_intonation_t:'Répéter avec intonation', ex_intonation_d:'Question, exclamation, phrase simple',
    ex_memory_t:'Jeu de mémoire', ex_memory_d:"Retrouver l'ordre d'une séquence d'images — sans voix",
    ex_phonation_t:'Tenue vocale', ex_phonation_d:'Tenir un son confortablement, à votre rythme',
    // La conversation guidée (js/conversation.js) reste en français pour
    // toute langue autre que le français : ce sont des scénarios de
    // dialogue entiers, pas du vocabulaire isolé — les traduire demande
    // un vrai travail de contenu, pas encore fait. Note affichée pour
    // éviter tout mélange silencieux de langues (même principe que le
    // kabyle).
    conversation_untranslated_note:"La conversation guidée reste en français pour l'instant : ces scénarios n'ont pas encore été traduits.",

    // v6.16 — js/memory.js n'avait jamais été relié à I18N (repéré par
    // l'utilisateur en passant l'app en anglais). Texte simple, sans
    // risque de sens contrairement au kabyle, donc traduit directement.
    memory_title:'Jeu de mémoire',
    memory_round:(n,total)=>`Manche ${n} / ${total}`,
    memory_watch:"Regardez bien l'ordre d'apparition…",
    memory_instruction:'À vous : cliquez les images dans le même ordre.',
    memory_correct:'Bravo, le bon ordre ! 🎉',
    memory_wrong:(seq)=>`Pas tout à fait — la séquence était : ${seq}`,
    memory_result:(ok,total)=>`${ok} séquence(s) juste(s) sur ${total}.`,
    memory_restart:'Recommencer',

    // v6.16 — même oubli que memory.js, corrigé en même temps. Texte de
    // sécurité (garde-fous médicaux) traduit avec le même soin que
    // l'original, pas juste paraphrasé.
    phonation_intro:"Asseyez-vous confortablement. Quand vous êtes prêt·e, prenez une respiration naturelle, puis tenez un son \"aaaa\" de façon continue, à un volume confortable.",
    phonation_disclaimer:"ℹ️ Ceci n'est pas un test médical. Ne forcez jamais votre voix. Arrêtez immédiatement si vous ressentez une gêne, un essoufflement inhabituel ou une douleur.",
    phonation_ready_btn:'🎤 Je suis prêt·e',
    phonation_cancel:'Annuler',
    phonation_mic_error:'⚠️ Micro indisponible ou refusé. Vous pouvez réessayer, ou revenir plus tard.',
    phonation_retry:'← Réessayer',
    phonation_hold_now:'Tenez votre son maintenant…',
    phonation_stop_btn:"⏹ J'ai terminé",
    phonation_result_note:"C'est votre mesure d'aujourd'hui — il n'y a pas de \"bon\" ou \"mauvais\" chiffre ici, juste un repère que vous pourrez comparer à vous-même, si vous le souhaitez, une prochaine fois.",
    phonation_restart:'Recommencer',
    seconds_suffix:'secondes'
  },
  en: {
    app_name:'ReParole',
    login_title:'Hello!',
    login_sub:'Your speech rehabilitation space, at your own pace.',
    field_name:'Your first name',
    field_code:'Follow-up code',
    field_code_ph:'Received at your first visit',
    btn_login:'Log in',
    first_visit:'First visit?',
    btn_new_patient:'Create a new file',
    greeting_hello:'Hello',
    progress_title:'Your progress',
    stat_sessions:'sessions',
    stat_success:'success rate',
    stat_streak:'days in a row',
    exercises_title:'Recommended exercises',
    recommended:'Recommended',
    ready_today:'Ready for today\'s session?',
    level_adapted:'Adapted level:',
    assistant_learned:'What your assistant has learned',
    assistant_learning:'Getting to know your profile…',
    level_1:'Gentle', level_2:'Intermediate', level_3:'Advanced',
    voice_badge:'VOICE',
    ex_repetition_t:'Repeat aloud', ex_repetition_d:'Say the word — the app listens',
    ex_denomination_orale_t:'Name aloud', ex_denomination_orale_d:'Say the name of the picture, no choices',
    ex_fluence_t:'Verbal fluency', ex_fluence_d:'Name as many words as possible from a category',
    ex_denomination_t:'Name the pictures', ex_denomination_d:'Find the word that matches the picture',
    ex_comprehension_t:'Understand the instruction', ex_comprehension_d:'Choose the right answer',
    ex_completion_t:'Complete the sentence', ex_completion_d:'Find the missing word',
    ex_photos_t:'Name your photos', ex_photos_d:'Your own photos, at your own pace',
    photos_title:'Your photos', photos_desc:'Add a photo from your daily life (an object, a place, a person) and the matching word — it will become a personalised exercise.',
    photos_label_ph:'The word to practise (e.g. garden)', add_photo:'Add photo',
    photos_exercise_intro:"These are your own photos — say the word you chose for each one.",
    conversation_title:'Guided conversation', conversation_desc:'Step-by-step scenarios (at the doctor\'s, at a café, on the phone) to practise everyday communication.',
    conversation_start:'Start a guided conversation',
    reminders_title:'Reminders', reminders_desc:'Get a small email reminder if you haven\'t visited in a few days (optional).',
    reminders_enable:'Enable email reminders',
    voice_note_forced_fr:"This exercise stays in French: speech recognition doesn't support Kabyle yet.",
    content_not_translated_yet:'This content is not yet translated into Kabyle — it is shown in French for now.',
    btn_logout:'Log out',

    denom_prompt:'What is this word?',
    listen_instructions:'Listen to the instructions',
    completion_label:'Complete:',
    photos_prompt:'What is this called?',
    denom_orale_prompt:'Say the name of this picture:',
    intonation_prompt:'Repeat with exaggerated intonation:',
    repetition_prompt:'Read this word aloud:',
    voice_unsupported:"⚠️ Speech recognition isn't available in this browser. Use Chrome, or validate manually.",
    listen_word:'Hear the word',
    mic_instruction:'Tap the microphone, then say the word.',
    said_correctly:'✅ I said it correctly',
    didnt_try:"I didn't try →",
    fluency_prompt:'Name as many as you can:',
    fluency_instruction:'Speak continuously after pressing the microphone.',
    finish_category:'Finish this category →',
    listening_now:"🎧 I'm listening…",
    heard_label:'Heard:',
    mic_unavailable:'Microphone unavailable',
    validate_manually:'Validate manually.',
    listening_words:'🎧 Name your words…',
    words_found:(n)=>`${n} word(s) found — keep going, you're doing well!`,
    session_done:'Session complete',
    session_result:(c,t)=>`You completed ${c} out of ${t} exercise(s).`,
    level_reached:'Level reached:',
    progress_saved:(mode)=>`✔ Progress saved (${mode})`,
    back_to_home:'Back to home',
    level_up_msg:(lv)=>`You're on a roll — moving up to the "${lv}" level to keep you challenged.`,
    level_down_msg:(lv)=>`Stepping back to the more comfortable "${lv}" level. Let's rebuild confidence.`,
    level_steady_msg:(lv)=>`I'm following your pace. Current level: "${lv}".`,
    correct_feedback:['Great job! 🎉','Perfect 👏','Well done!','Excellent!'],
    wrong_feedback:"No worries, let's keep going 🌿",
    starting_level_msg:(lv)=>`Starting at the "${lv}" level based on your previous results.`,
    fluency_success:(n)=>`Well done, ${n} words! 🎉`,
    fluency_more:(n)=>`${n} word(s). Let's keep going gently 🌿`,
    session_good_msg:"Great session. I'm saving your progress to adjust next time.",
    session_soft_msg:"We worked well today. I'll start a bit more gently next time.",
    mic_aria_voice:'Turn on the microphone to answer aloud',
    mic_aria_fluency:'Turn on the microphone to name words',

    tag_mot_court:'short words', tag_mot_moyen:'medium-length words', tag_mot_long:'long words',
    tag_animaux:'animals', tag_nourriture:'food', tag_objets:'everyday objects',
    tag_nature:'nature', tag_musique:'musical instruments', tag_corps:'the body',
    tag_autre:'general vocabulary',
    insight_weak:(label)=>`I've noticed that ${label} take more effort for you. I'll offer a bit more of those to help you progress.`,
    insight_due:(label)=>`This is a good time to revisit ${label} — a little time has passed since your last success, let's reinforce it.`,
    insight_strong:(label)=>`You're comfortable with ${label}. Let's consolidate and vary things to keep progressing.`,
    insight_default:"I'm still getting to know your profile as we go.",
    fatigue_high:"You've had several difficult attempts in a row — a short break might help. Come back whenever you're ready.",
    fatigue_medium:"Let's slow the pace down a little.",
    login_error:"No file matches this code. Please check it, or create a new file below if this is your first visit.",

    ex_intonation_t:'Repeat with intonation', ex_intonation_d:'Question, exclamation, simple sentence',
    ex_memory_t:'Memory game', ex_memory_d:'Reproduce the order of a sequence of images — no voice needed',
    ex_phonation_t:'Vocal endurance', ex_phonation_d:'Hold a sound comfortably, at your own pace',
    conversation_untranslated_note:"Guided conversation is still in French for now: these scenarios haven't been translated yet.",

    memory_title:'Memory game',
    memory_round:(n,total)=>`Round ${n} of ${total}`,
    memory_watch:'Watch the order carefully…',
    memory_instruction:'Your turn: click the images in the same order.',
    memory_correct:'Well done, correct order! 🎉',
    memory_wrong:(seq)=>`Not quite — the sequence was: ${seq}`,
    memory_result:(ok,total)=>`${ok} correct sequence(s) out of ${total}.`,
    memory_restart:'Restart',

    phonation_intro:'Sit comfortably. When you\'re ready, take a natural breath, then hold an "aaaa" sound continuously, at a comfortable volume.',
    phonation_disclaimer:"ℹ️ This is not a medical test. Never force your voice. Stop immediately if you feel discomfort, unusual breathlessness, or pain.",
    phonation_ready_btn:"🎤 I'm ready",
    phonation_cancel:'Cancel',
    phonation_mic_error:'⚠️ Microphone unavailable or refused. You can try again, or come back later.',
    phonation_retry:'← Try again',
    phonation_hold_now:'Hold your sound now…',
    phonation_stop_btn:"⏹ I'm done",
    phonation_result_note:"This is today's measurement — there's no \"good\" or \"bad\" number here, just a marker you can compare yourself against another time, if you'd like.",
    phonation_restart:'Restart',
    seconds_suffix:'seconds'
  },
  kab: {
    app_name:'ReParole',
    login_title:'Azul !',
    login_sub:"Adeg-ik n uselmed n tutlayt, s wallaɣ-ik.",
    field_name:'Isem-ik',
    field_code:'Tangalt n uḍfar',
    field_code_ph:'Tettwarna-yak deg tikkelt tamezwarut',
    btn_login:'Qqen',
    first_visit:'D tikkelt tamezwarut?',
    btn_new_patient:'Rnu addad amaynut',
    greeting_hello:'Azul',
    progress_title:'Iswiren-ik',
    stat_sessions:'tiɣimiyin',
    stat_success:'lwerd',
    stat_streak:'ussan i d-yedduklen',
    exercises_title:'Isuraf',
    recommended:'Ihwej',
    voice_badge:'TAƔECT',                 // "voix" — confirmé, même racine que "aselken n taɣect" déjà utilisé plus haut
    ex_denomination_t:'Semmi tugniwin',   // même titre que js/exercises-kab.js, pour rester cohérent
    voice_note_forced_fr:"Aselmed-agi yeqqim s tefransist: aselken n taɣect ur yessefrak ara tura s taqbaylit.",
    content_not_translated_yet:"Agbur-agi ur yettwasuɣel ara tura s taqbaylit — ad d-yban s tefransist alamma tura.",
    btn_logout:'Ffeɣ'
  }
};

const I18N = {
  // v6.9 : accepte des valeurs sous forme de fonction, ex. session_result:(c,t)=>`...`
  // -> I18N.t('session_result', 3, 8). Rétrocompatible : les chaînes simples
  // fonctionnent comme avant.
  t(key, ...params){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    const raw = (I18N_STRINGS[lang] && I18N_STRINGS[lang][key]!==undefined ? I18N_STRINGS[lang][key] : undefined);
    const val = raw!==undefined ? raw : (I18N_STRINGS.fr[key]!==undefined ? I18N_STRINGS.fr[key] : key);
    if(typeof val==='function') return val(...params);
    if(Array.isArray(val)) return val[0]; // valeur stable ; voir I18N.rand() pour un tirage aléatoire
    return val;
  },
  // Pioche une valeur au hasard dans une clé qui contient un tableau (ex : phrases d'encouragement variées)
  rand(key){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    const bank = (I18N_STRINGS[lang] && I18N_STRINGS[lang][key]) || I18N_STRINGS.fr[key];
    if(!Array.isArray(bank) || !bank.length) return this.t(key);
    return bank[Math.floor(Math.random()*bank.length)];
  },
  // Renvoie le code de langue vocale (fr-FR, en-US...) de la langue active,
  // ou null si cette langue ne dispose pas de synthèse/reconnaissance fiable.
  speechLocale(){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    return (LANGUAGES[lang] && LANGUAGES[lang].speechLocale) || null;
  },
  // Applique les traductions à tous les éléments marqués data-i18n / data-i18n-placeholder
  apply(lang){
    document.documentElement.lang = lang;
    document.documentElement.dir = (LANGUAGES[lang] && LANGUAGES[lang].dir) || 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
  }
};

window.I18N = I18N;
window.LANGUAGES = LANGUAGES;
