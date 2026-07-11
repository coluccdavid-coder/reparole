// =====================================================================
//  COMPAGNON ANIMÉ "AMI" — v7
//  ---------------------------------------------------------------------
//  ⚠️ AUCUNE IA GÉNÉRATIVE / LLM ICI, ET C'EST VOLONTAIRE (garde-fou n°1
//  du projet, voir SKILL_ReParole_v6.md). Ami ne "comprend" rien : c'est
//  un dessin SVG animé (CSS pur, pas de dépendance) qui affiche une
//  phrase piochée au hasard dans une banque de phrases ÉCRITES À
//  L'AVANCE, selon un contexte précis (accueil, bonne réponse, erreur,
//  fin de séance...). Le mécanisme est donc entièrement testable et
//  prévisible, comme le reste du moteur d'exercices — pas de boîte
//  noire, pas de réponse inventée.
//
//  Pourquoi ce choix plutôt qu'un vrai agent conversationnel :
//   - Le public de cette app peut être vulnérable (troubles cognitifs
//     ou de compréhension post-AVC). Une IA qui semble "comprendre"
//     peut créer une confusion ou une confiance mal placée.
//   - Une boîte noire n'est pas vérifiable phrase par phrase. Cette
//     banque l'est : n'importe qui peut relire (et donc valider ou
//     corriger) chaque phrase avant qu'elle n'atteigne un patient.
//
//  RÈGLES DE CONTENU DE CE FICHIER — mêmes garde-fous que le reste :
//   - Jamais une phrase qui compare à une "norme" ou pourrait sembler
//     un diagnostic (garde-fou n°6).
//   - Jamais de phrase négative/moralisatrice après une erreur — on
//     encourage, sans minimiser ni forcer un ton faussement enjoué.
//   - Le score bas en fin de séance reste valorisé pour l'EFFORT, pas
//     pour une fausse réussite (cohérent avec le garde-fou n°5 : pas de
//     score truqué — Ami ne dit jamais "bravo, parfait" sur une séance
//     ratée, mais reste toujours bienveillant).
//
//  POUR AJOUTER UNE LANGUE : ajouter une clé dans COMPANION_PHRASES avec
//  les mêmes noms de contexte. Comme pour I18N, une langue incomplète
//  retombe automatiquement sur le français (voir Companion.pick).
// =====================================================================

const COMPANION_PHRASES = {
  fr: {
    // Accueil du patient sur le tableau de bord
    welcome: [
      "Contente de vous revoir !",
      "Prêt·e quand vous voudrez, on y va doucement.",
      "Une nouvelle séance, à votre rythme.",
      "Je suis là si vous avez besoin d'un coup de pouce."
    ],
    // v6.11 : quand le patient revient après plus d'un jour sans venir —
    // JAMAIS de reproche ni de culpabilisation ("ça fait longtemps",
    // compteur remis à zéro affiché comme un échec, etc.). Le seul but
    // est d'aider à reprendre l'habitude, pas de faire culpabiliser
    // quelqu'un qui a probablement d'autres priorités de santé.
    welcome_back: [
      "Content de vous revoir, peu importe la pause !",
      "Vous revoilà, c'est le principal — on reprend en douceur.",
      "Ravi de vous revoir. On repart tranquillement, à votre rythme."
    ],
    // v6.11 : quand le moteur adaptatif a un vrai conseil à donner (pas
    // le texte par défaut), Ami y renvoie plutôt que de le répéter —
    // voir renderDashboard() dans js/app.js.
    insight_pointer: [
      "J'ai un conseil pour vous juste en dessous 👇",
      "Regardez ce que j'ai remarqué pour vous, juste ici 👇",
      "J'ai ajusté quelque chose pour vous — le détail est juste en dessous."
    ],
    // v6.11 : conseils pratiques génériques sur la façon de s'entraîner
    // (rythme, régularité, repos) — PAS des conseils médicaux. Aucune
    // phrase ici ne doit évoquer un symptôme, un traitement, ou un avis
    // clinique : ça reste strictement hors de portée de cette app (voir
    // garde-fou n°8 et les disclaimers de js/assessment.js).
    tip: [
      "Un petit peu chaque jour aide souvent plus qu'une longue séance de temps en temps.",
      "Si vous êtes fatigué·e, une pause est toujours une bonne idée — on reprendra après.",
      "Pas besoin de tout réussir : chaque séance compte, même les difficiles.",
      "Vous pouvez noter votre code de suivi quelque part de sûr, pour le transmettre à votre orthophoniste si vous le souhaitez."
    ],
    // Au lancement d'un exercice
    exerciseStart: [
      "On y va, tranquillement.",
      "Prenez votre temps, il n'y a pas de chrono.",
      "Je reste avec vous pendant l'exercice."
    ],
    // Bonne réponse
    correct: [
      "Bravo !",
      "Voilà, exactement ça.",
      "Très bien !",
      "Parfait, on continue comme ça."
    ],
    // Plusieurs bonnes réponses d'affilée
    streak: [
      "Vous enchaînez bien, bravo !",
      "Trois de suite, belle régularité !",
      "Ça avance très bien, continuez ainsi."
    ],
    // Réponse incorrecte — jamais de ton négatif, jamais de fausse joie
    encourage: [
      "Pas grave, on continue.",
      "Ce n'est rien, on avance à votre rythme.",
      "On essaie la suivante, tranquillement.",
      "Aucun souci, chaque séance compte."
    ],
    // Fin de séance — le ton reste chaleureux quel que soit le score,
    // mais Ami ne dit jamais "bravo" sur un score bas (pas de fausse
    // réussite, cf. garde-fou n°5).
    sessionEnd_high: [
      "Belle séance, bravo pour votre travail !",
      "Très bonne séance aujourd'hui !"
    ],
    sessionEnd_mid: [
      "Bonne séance, merci d'être venu·e.",
      "C'est une séance de plus, et ça compte."
    ],
    sessionEnd_low: [
      "Merci d'être resté·e jusqu'au bout, c'est ce qui compte.",
      "Chaque séance aide, même quand c'est plus difficile.",
      "On se retrouve pour la prochaine, à votre rythme."
    ],
    // v6.34 : ce qu'Ami explique en arrivant sur un exercice — à QUOI ça
    // sert, pas COMMENT y jouer (déjà couvert par la consigne affichée à
    // l'écran). Une seule phrase par type suffit ici (pas besoin de
    // variété comme pour les encouragements) : la nouveauté vient du
    // fait qu'Ami se déplace pour la donner, pas du contenu lui-même.
    explain: {
      denomination: "Cet exercice vous aide à retrouver le mot qui correspond à une image, en douceur.",
      completion: "Cet exercice entraîne à retrouver un mot manquant, en s'appuyant sur le sens de la phrase.",
      comprehension: "Cet exercice travaille la compréhension d'une consigne simple, à votre rythme.",
      repetition: "Cet exercice entraîne la prononciation : vous répétez un mot, et l'app vous écoute.",
      denomination_orale: "Ici, vous dites le nom de l'image à voix haute, sans choix pour vous aider — un bon entraînement pour retrouver le mot seul·e.",
      fluence: "Cet exercice stimule la recherche rapide de mots dans une catégorie donnée.",
      intonation: "Cet exercice travaille l'intonation : question, exclamation, phrase simple.",
      photos_perso: "Ici, vous nommez vos propres photos — des mots qui vous sont familiers, pour un entraînement plus personnel.",
      memory: "Ce jeu entraîne la mémoire visuelle, en retrouvant l'ordre d'une séquence d'images — sans avoir besoin de parler.",
      phonation: "Cet exercice travaille le souffle : tenir un son confortablement, à votre rythme, sans chercher à faire mieux qu'avant.",
      conversation: "Ici, vous vous entraînez à une conversation guidée, étape par étape, comme dans une vraie situation du quotidien."
    }
  },
  en: {
    welcome: [
      "Good to see you again!",
      "Ready whenever you are, nice and easy.",
      "A new session, at your own pace.",
      "I'm here if you need a hand."
    ],
    welcome_back: [
      "Good to see you, no matter the break!",
      "You're back, that's what matters — let's ease back in.",
      "Glad to see you again. We'll pick up gently, at your own pace."
    ],
    insight_pointer: [
      "I've got a tip for you just below 👇",
      "Take a look at what I've noticed, right here 👇",
      "I adjusted something for you — the detail is just below."
    ],
    tip: [
      "A little bit each day often helps more than one long session now and then.",
      "If you're tired, a break is always a good idea — we'll pick up again after.",
      "You don't need to get everything right: every session counts, even the hard ones.",
      "You can keep your follow-up code somewhere safe, to share with your speech therapist if you'd like."
    ],
    exerciseStart: [
      "Let's go, nice and easy.",
      "Take your time, there's no clock.",
      "I'll stay with you through this exercise."
    ],
    correct: [
      "Well done!",
      "That's it, exactly right.",
      "Very good!",
      "Perfect, keep it up."
    ],
    streak: [
      "You're on a roll, well done!",
      "Three in a row, great consistency!",
      "This is going really well, keep going."
    ],
    encourage: [
      "That's alright, let's carry on.",
      "No worries, we go at your own pace.",
      "Let's try the next one, gently.",
      "No problem at all, every session counts."
    ],
    sessionEnd_high: [
      "Great session, well done for your work!",
      "Really good session today!"
    ],
    sessionEnd_mid: [
      "Good session, thanks for coming.",
      "That's one more session, and it counts."
    ],
    sessionEnd_low: [
      "Thanks for staying until the end, that's what matters.",
      "Every session helps, even the harder ones.",
      "See you next time, at your own pace."
    ],
    explain: {
      denomination: "This exercise helps you find the word that matches a picture, nice and easy.",
      completion: "This exercise helps you find a missing word, using the meaning of the sentence.",
      comprehension: "This exercise works on understanding a simple instruction, at your own pace.",
      repetition: "This exercise trains pronunciation: you repeat a word, and the app listens.",
      denomination_orale: "Here, you say the name of the picture out loud, with no choices to help you — good practice for finding the word on your own.",
      fluence: "This exercise stimulates quick word-finding within a given category.",
      intonation: "This exercise works on intonation: question, exclamation, simple sentence.",
      photos_perso: "Here, you name your own photos — familiar words, for a more personal kind of practice.",
      memory: "This game trains visual memory, by reproducing the order of a sequence of images — no talking needed.",
      phonation: "This exercise works on your breath: holding a sound comfortably, at your own pace, with no pressure to do better than before.",
      conversation: "Here, you practice a guided conversation, step by step, like a real everyday situation."
    }
  },
  es: {
    welcome: [
      "¡Qué bien verte de nuevo!",
      "List·o cuando quieras, vamos con calma.",
      "Una nueva sesión, a tu ritmo.",
      "Estoy aquí si necesitas una ayuda."
    ],
    welcome_back: [
      "¡Qué bien verte, sin importar la pausa!",
      "Has vuelto, eso es lo importante — retomemos con calma.",
      "Me alegra verte de nuevo. Retomaremos suavemente, a tu ritmo."
    ],
    insight_pointer: [
      "Tengo un consejo para ti justo abajo 👇",
      "Mira lo que he notado, aquí mismo 👇",
      "He ajustado algo para ti — el detalle está justo abajo."
    ],
    tip: [
      "Un poco cada día suele ayudar más que una sesión larga de vez en cuando.",
      "Si estás cansad·o, un descanso siempre es buena idea — seguiremos después.",
      "No hace falta acertar todo: cada sesión cuenta, incluso las difíciles.",
      "Puedes guardar tu código de seguimiento en un lugar seguro, para compartirlo con tu logopeda si quieres."
    ],
    exerciseStart: [
      "Vamos, con calma.",
      "Tómate tu tiempo, no hay cronómetro.",
      "Te acompaño durante este ejercicio."
    ],
    correct: [
      "¡Muy bien!",
      "Eso es, exactamente.",
      "¡Muy bien hecho!",
      "Perfecto, sigue así."
    ],
    streak: [
      "¡Estás encadenando aciertos, muy bien!",
      "¡Tres seguidos, qué regularidad!",
      "Esto va muy bien, sigue así."
    ],
    encourage: [
      "No pasa nada, sigamos.",
      "No te preocupes, vamos a tu ritmo.",
      "Probemos con el siguiente, con calma.",
      "Ningún problema, cada sesión cuenta."
    ],
    sessionEnd_high: [
      "¡Buena sesión, enhorabuena por tu trabajo!",
      "¡Muy buena sesión hoy!"
    ],
    sessionEnd_mid: [
      "Buena sesión, gracias por venir.",
      "Una sesión más, y eso cuenta."
    ],
    sessionEnd_low: [
      "Gracias por quedarte hasta el final, eso es lo que cuenta.",
      "Cada sesión ayuda, incluso las más difíciles.",
      "Hasta la próxima, a tu ritmo."
    ],
    explain: {
      denomination: "Este ejercicio te ayuda a encontrar la palabra que corresponde a una imagen, con calma.",
      completion: "Este ejercicio te ayuda a encontrar una palabra que falta, apoyándote en el sentido de la frase.",
      comprehension: "Este ejercicio trabaja la comprensión de una consigna sencilla, a tu ritmo.",
      repetition: "Este ejercicio entrena la pronunciación: repites una palabra y la aplicación te escucha.",
      denomination_orale: "Aquí dices el nombre de la imagen en voz alta, sin opciones que te ayuden — un buen entrenamiento para encontrar la palabra por ti mismo·a.",
      fluence: "Este ejercicio estimula la búsqueda rápida de palabras dentro de una categoría.",
      intonation: "Este ejercicio trabaja la entonación: pregunta, exclamación, frase simple.",
      photos_perso: "Aquí nombras tus propias fotos — palabras que te resultan familiares, para un entrenamiento más personal.",
      memory: "Este juego entrena la memoria visual, reproduciendo el orden de una secuencia de imágenes — sin necesidad de hablar.",
      phonation: "Este ejercicio trabaja la respiración: mantener un sonido cómodamente, a tu ritmo, sin buscar hacerlo mejor que antes.",
      conversation: "Aquí practicas una conversación guiada, paso a paso, como en una situación real del día a día."
    }
  },
  it: {
    welcome: [
      "Che piacere rivederti!",
      "Pront·o quando vuoi, andiamo con calma.",
      "Una nuova seduta, al tuo ritmo.",
      "Sono qui se hai bisogno di una mano."
    ],
    welcome_back: [
      "Che piacere rivederti, non importa la pausa!",
      "Sei tornat·o, è questo che conta — ripartiamo con calma.",
      "Felice di rivederti. Ripartiremo dolcemente, al tuo ritmo."
    ],
    insight_pointer: [
      "Ho un consiglio per te qui sotto 👇",
      "Guarda cosa ho notato, proprio qui 👇",
      "Ho aggiustato qualcosa per te — il dettaglio è qui sotto."
    ],
    tip: [
      "Un po' ogni giorno aiuta spesso più di una lunga seduta ogni tanto.",
      "Se sei stanc·o, una pausa è sempre una buona idea — riprenderemo dopo.",
      "Non serve fare tutto giusto: ogni seduta conta, anche le più difficili.",
      "Puoi conservare il tuo codice di monitoraggio in un posto sicuro, da condividere con il tuo logopedista se vuoi."
    ],
    exerciseStart: [
      "Andiamo, con calma.",
      "Prenditi il tuo tempo, non c'è cronometro.",
      "Resto con te durante questo esercizio."
    ],
    correct: [
      "Bravo!",
      "Ecco, esattamente così.",
      "Molto bene!",
      "Perfetto, continua così."
    ],
    streak: [
      "Stai infilando successi, bravo!",
      "Tre di fila, che costanza!",
      "Sta andando molto bene, continua così."
    ],
    encourage: [
      "Non fa niente, andiamo avanti.",
      "Non preoccuparti, andiamo al tuo ritmo.",
      "Proviamo il prossimo, con calma.",
      "Nessun problema, ogni seduta conta."
    ],
    sessionEnd_high: [
      "Bella seduta, bravo per il tuo lavoro!",
      "Ottima seduta oggi!"
    ],
    sessionEnd_mid: [
      "Buona seduta, grazie per essere venut·o.",
      "Un'altra seduta, e questo conta."
    ],
    sessionEnd_low: [
      "Grazie per essere rimast·o fino alla fine, è questo che conta.",
      "Ogni seduta aiuta, anche le più difficili.",
      "Alla prossima, al tuo ritmo."
    ],
    explain: {
      denomination: "Questo esercizio ti aiuta a trovare la parola che corrisponde a un'immagine, con calma.",
      completion: "Questo esercizio ti aiuta a trovare una parola mancante, basandoti sul senso della frase.",
      comprehension: "Questo esercizio lavora sulla comprensione di una consegna semplice, al tuo ritmo.",
      repetition: "Questo esercizio allena la pronuncia: ripeti una parola e l'app ti ascolta.",
      denomination_orale: "Qui dici il nome dell'immagine ad alta voce, senza scelte ad aiutarti — un buon allenamento per trovare la parola da solo·a.",
      fluence: "Questo esercizio stimola la ricerca rapida di parole in una categoria.",
      intonation: "Questo esercizio lavora sull'intonazione: domanda, esclamazione, frase semplice.",
      photos_perso: "Qui nomini le tue foto — parole che ti sono familiari, per un allenamento più personale.",
      memory: "Questo gioco allena la memoria visiva, riproducendo l'ordine di una sequenza di immagini — senza bisogno di parlare.",
      phonation: "Questo esercizio lavora sul respiro: tenere un suono comodamente, al tuo ritmo, senza cercare di fare meglio di prima.",
      conversation: "Qui ti alleni con una conversazione guidata, passo dopo passo, come in una vera situazione quotidiana."
    }
  },
  pt: {
    welcome: [
      "Que bom rever-te!",
      "Pront·o quando quiseres, vamos com calma.",
      "Uma nova sessão, ao teu ritmo.",
      "Estou aqui se precisares de uma ajuda."
    ],
    welcome_back: [
      "Que bom ver-te, seja qual for a pausa!",
      "Voltaste, é isso que importa — vamos retomar com calma.",
      "Fico contente por te rever. Vamos retomar suavemente, ao teu ritmo."
    ],
    insight_pointer: [
      "Tenho uma dica para ti aqui em baixo 👇",
      "Vê o que reparei, aqui mesmo 👇",
      "Ajustei algo para ti — o detalhe está aqui em baixo."
    ],
    tip: [
      "Um pouco todos os dias ajuda muitas vezes mais do que uma sessão longa de vez em quando.",
      "Se estiveres cansad·o, uma pausa é sempre uma boa ideia — continuamos depois.",
      "Não precisas de acertar tudo: cada sessão conta, mesmo as difíceis.",
      "Podes guardar o teu código de acompanhamento num sítio seguro, para partilhar com o teu terapeuta da fala se quiseres."
    ],
    exerciseStart: [
      "Vamos lá, com calma.",
      "Leva o teu tempo, não há cronómetro.",
      "Fico contigo durante este exercício."
    ],
    correct: [
      "Muito bem!",
      "Isso mesmo, exatamente.",
      "Muito bem feito!",
      "Perfeito, continua assim."
    ],
    streak: [
      "Estás a encadear sucessos, muito bem!",
      "Três seguidos, que regularidade!",
      "Está a correr muito bem, continua assim."
    ],
    encourage: [
      "Não faz mal, vamos continuar.",
      "Não te preocupes, vamos ao teu ritmo.",
      "Vamos tentar o próximo, com calma.",
      "Sem problema nenhum, cada sessão conta."
    ],
    sessionEnd_high: [
      "Boa sessão, parabéns pelo teu trabalho!",
      "Sessão muito boa hoje!"
    ],
    sessionEnd_mid: [
      "Boa sessão, obrigado por teres vindo.",
      "Mais uma sessão, e isso conta."
    ],
    sessionEnd_low: [
      "Obrigado por teres ficado até ao fim, é isso que conta.",
      "Cada sessão ajuda, mesmo as mais difíceis.",
      "Até à próxima, ao teu ritmo."
    ],
    explain: {
      denomination: "Este exercício ajuda-te a encontrar a palavra que corresponde a uma imagem, com calma.",
      completion: "Este exercício ajuda-te a encontrar uma palavra em falta, com base no sentido da frase.",
      comprehension: "Este exercício trabalha a compreensão de uma instrução simples, ao teu ritmo.",
      repetition: "Este exercício treina a pronúncia: repetes uma palavra e a aplicação ouve-te.",
      denomination_orale: "Aqui dizes o nome da imagem em voz alta, sem opções para te ajudar — um bom treino para encontrares a palavra sozinho·a.",
      fluence: "Este exercício estimula a procura rápida de palavras dentro de uma categoria.",
      intonation: "Este exercício trabalha a entoação: pergunta, exclamação, frase simples.",
      photos_perso: "Aqui nomeias as tuas próprias fotos — palavras que te são familiares, para um treino mais pessoal.",
      memory: "Este jogo treina a memória visual, reproduzindo a ordem de uma sequência de imagens — sem precisares de falar.",
      phonation: "Este exercício trabalha a respiração: manter um som confortavelmente, ao teu ritmo, sem procurar fazer melhor do que antes.",
      conversation: "Aqui treinas uma conversa guiada, passo a passo, como numa situação real do dia a dia."
    }
  },
  de: {
    welcome: [
      "Schön, Sie wiederzusehen!",
      "Bereit, wann immer Sie wollen, ganz entspannt.",
      "Eine neue Sitzung, in Ihrem Tempo.",
      "Ich bin da, wenn Sie Hilfe brauchen."
    ],
    welcome_back: [
      "Schön, Sie zu sehen, egal wie lange die Pause war!",
      "Sie sind zurück, das ist die Hauptsache — steigen wir sanft wieder ein.",
      "Freut mich, Sie wiederzusehen. Wir starten sanft, in Ihrem Tempo."
    ],
    insight_pointer: [
      "Ich habe einen Tipp für Sie direkt hier unten 👇",
      "Schauen Sie, was ich bemerkt habe, genau hier 👇",
      "Ich habe etwas für Sie angepasst — die Details stehen hier unten."
    ],
    tip: [
      "Ein wenig jeden Tag hilft oft mehr als eine lange Sitzung ab und zu.",
      "Wenn Sie müde sind, ist eine Pause immer eine gute Idee — wir machen danach weiter.",
      "Sie müssen nicht alles richtig machen: Jede Sitzung zählt, auch die schwierigen.",
      "Sie können Ihren Verfolgungscode an einem sicheren Ort aufbewahren, um ihn bei Bedarf mit Ihrem Logopäden zu teilen."
    ],
    exerciseStart: [
      "Los geht's, ganz entspannt.",
      "Lassen Sie sich Zeit, es gibt keine Uhr.",
      "Ich bleibe während dieser Übung bei Ihnen."
    ],
    correct: [
      "Gut gemacht!",
      "Genau, das ist es.",
      "Sehr gut!",
      "Perfekt, weiter so."
    ],
    streak: [
      "Sie sind auf einem guten Weg, gut gemacht!",
      "Drei hintereinander, tolle Beständigkeit!",
      "Das läuft sehr gut, weiter so."
    ],
    encourage: [
      "Kein Problem, machen wir weiter.",
      "Keine Sorge, wir gehen in Ihrem Tempo vor.",
      "Versuchen wir die nächste, ganz entspannt.",
      "Überhaupt kein Problem, jede Sitzung zählt."
    ],
    sessionEnd_high: [
      "Schöne Sitzung, gut gemacht für Ihre Arbeit!",
      "Heute eine sehr gute Sitzung!"
    ],
    sessionEnd_mid: [
      "Gute Sitzung, danke fürs Kommen.",
      "Wieder eine Sitzung mehr, und das zählt."
    ],
    sessionEnd_low: [
      "Danke, dass Sie bis zum Ende geblieben sind, das ist die Hauptsache.",
      "Jede Sitzung hilft, auch die schwierigeren.",
      "Bis zum nächsten Mal, in Ihrem Tempo."
    ],
    explain: {
      denomination: "Diese Übung hilft Ihnen, das passende Wort zu einem Bild zu finden, ganz in Ruhe.",
      completion: "Diese Übung hilft Ihnen, ein fehlendes Wort zu finden, gestützt auf den Sinn des Satzes.",
      comprehension: "Diese Übung trainiert das Verstehen einer einfachen Anweisung, in Ihrem Tempo.",
      repetition: "Diese Übung trainiert die Aussprache: Sie wiederholen ein Wort, und die App hört zu.",
      denomination_orale: "Hier sagen Sie den Namen des Bildes laut, ohne Auswahlmöglichkeiten — ein gutes Training, um das Wort selbst zu finden.",
      fluence: "Diese Übung regt die schnelle Wortsuche innerhalb einer Kategorie an.",
      intonation: "Diese Übung trainiert die Betonung: Frage, Ausruf, einfacher Satz.",
      photos_perso: "Hier benennen Sie Ihre eigenen Fotos — vertraute Wörter, für ein persönlicheres Training.",
      memory: "Dieses Spiel trainiert das visuelle Gedächtnis, indem Sie die Reihenfolge einer Bildsequenz wiedergeben — ganz ohne Sprechen.",
      phonation: "Diese Übung trainiert die Atmung: einen Ton bequem halten, in Ihrem Tempo, ohne den Anspruch, besser als beim letzten Mal zu sein.",
      conversation: "Hier üben Sie ein geführtes Gespräch, Schritt für Schritt, wie in einer echten Alltagssituation."
    }
  },
  ar: {
    welcome: [
      "سعيد برؤيتك من جديد!",
      "مستعد متى شئت، لنبدأ بهدوء.",
      "جلسة جديدة، على إيقاعك الخاص.",
      "أنا هنا إذا احتجت إلى مساعدة."
    ],
    welcome_back: [
      "سعيد برؤيتك، مهما كانت مدة الانقطاع!",
      "لقد عدت، وهذا هو المهم — لنعد بهدوء.",
      "سعيد برؤيتك مجددًا. سنعاود العمل بلطف، على إيقاعك."
    ],
    insight_pointer: [
      "لدي نصيحة لك أدناه مباشرة 👇",
      "انظر إلى ما لاحظته، هنا بالضبط 👇",
      "لقد عدّلت شيئًا من أجلك — التفاصيل أدناه مباشرة."
    ],
    tip: [
      "القليل كل يوم غالبًا ما يساعد أكثر من جلسة طويلة بين الحين والآخر.",
      "إذا كنت متعبًا، فإن أخذ استراحة فكرة جيدة دائمًا — سنواصل بعد ذلك.",
      "لست بحاجة لإتقان كل شيء: كل جلسة مهمة، حتى الصعبة منها.",
      "يمكنك الاحتفاظ برمز المتابعة في مكان آمن، لمشاركته مع أخصائي النطق إذا أردت."
    ],
    exerciseStart: [
      "لنبدأ، بهدوء.",
      "خذ وقتك، لا يوجد ضغط زمني.",
      "سأبقى معك خلال هذا التمرين."
    ],
    correct: [
      "أحسنت!",
      "هذا صحيح تمامًا.",
      "جيد جدًا!",
      "ممتاز، واصل هكذا."
    ],
    streak: [
      "أنت تحقق نجاحات متتالية، أحسنت!",
      "ثلاثة متتالية، يا لها من ثبات!",
      "الأمور تسير بشكل جيد جدًا، واصل هكذا."
    ],
    encourage: [
      "لا بأس، لنواصل.",
      "لا تقلق، نتقدّم على إيقاعك.",
      "لنجرّب التالي، بهدوء.",
      "لا مشكلة على الإطلاق، كل جلسة مهمة."
    ],
    sessionEnd_high: [
      "جلسة رائعة، أحسنت في عملك!",
      "جلسة جيدة جدًا اليوم!"
    ],
    sessionEnd_mid: [
      "جلسة جيدة، شكرًا على حضورك.",
      "جلسة إضافية، وهذا مهم."
    ],
    sessionEnd_low: [
      "شكرًا لبقائك حتى النهاية، هذا هو المهم.",
      "كل جلسة تساعد، حتى الأصعب منها.",
      "إلى المرة القادمة، على إيقاعك."
    ],
    explain: {
      denomination: "يساعدك هذا التمرين على إيجاد الكلمة المطابقة لصورة، بهدوء.",
      completion: "يساعدك هذا التمرين على إيجاد كلمة ناقصة، بالاعتماد على معنى الجملة.",
      comprehension: "يعمل هذا التمرين على فهم تعليمة بسيطة، على إيقاعك.",
      repetition: "يدرّب هذا التمرين على النطق: تردّد كلمة والتطبيق يستمع إليك.",
      denomination_orale: "هنا تقول اسم الصورة بصوت عالٍ، دون خيارات تساعدك — تدريب جيد لإيجاد الكلمة بمفردك.",
      fluence: "يحفّز هذا التمرين البحث السريع عن الكلمات ضمن فئة معينة.",
      intonation: "يعمل هذا التمرين على التنغيم: سؤال، تعجب، جملة بسيطة.",
      photos_perso: "هنا تسمّي صورك الخاصة — كلمات مألوفة لديك، من أجل تدريب أكثر شخصية.",
      memory: "تدرّب هذه اللعبة الذاكرة البصرية، بإعادة ترتيب تسلسل من الصور — دون الحاجة إلى الكلام.",
      phonation: "يعمل هذا التمرين على التنفّس: الحفاظ على صوت بشكل مريح، على إيقاعك، دون السعي لفعل ما هو أفضل من المرة السابقة.",
      conversation: "هنا تتدرّب على محادثة موجَّهة، خطوة بخطوة، كما في موقف حقيقي من الحياة اليومية."
    }
  },
  tr: {
    welcome: [
      "Sizi tekrar görmek güzel!",
      "İstediğiniz zaman hazırım, sakin bir şekilde başlayalım.",
      "Yeni bir oturum, kendi hızınızda.",
      "Yardıma ihtiyacınız olursa buradayım."
    ],
    welcome_back: [
      "Ne kadar ara verdiyseniz verin, sizi görmek güzel!",
      "Geri döndünüz, önemli olan bu — yavaşça devam edelim.",
      "Sizi tekrar görmek sevindirici. Kendi hızınızda, yumuşak bir şekilde devam edeceğiz."
    ],
    insight_pointer: [
      "Hemen aşağıda sizin için bir ipucum var 👇",
      "Fark ettiğim şeye bir bakın, tam burada 👇",
      "Sizin için bir şey ayarladım — detay hemen aşağıda."
    ],
    tip: [
      "Her gün biraz, ara sıra uzun bir oturumdan genellikle daha çok yardımcı olur.",
      "Yorgunsanız, mola vermek her zaman iyi bir fikirdir — sonra devam ederiz.",
      "Her şeyi doğru yapmanıza gerek yok: her oturum önemlidir, zor olanlar bile.",
      "İsterseniz dil terapistinizle paylaşmak üzere takip kodunuzu güvenli bir yerde saklayabilirsiniz."
    ],
    exerciseStart: [
      "Hadi başlayalım, sakin bir şekilde.",
      "Acele etmeyin, zaman sınırı yok.",
      "Bu alıştırma boyunca sizinle olacağım."
    ],
    correct: [
      "Aferin!",
      "İşte bu, tam olarak doğru.",
      "Çok iyi!",
      "Mükemmel, böyle devam edin."
    ],
    streak: [
      "Çok iyi gidiyorsunuz, aferin!",
      "Arka arkaya üç tane, ne kadar istikrarlı!",
      "Bu gerçekten çok iyi gidiyor, devam edin."
    ],
    encourage: [
      "Sorun değil, devam edelim.",
      "Merak etmeyin, kendi hızınızda ilerliyoruz.",
      "Sıradakini deneyelim, sakin bir şekilde.",
      "Hiç sorun değil, her oturum önemlidir."
    ],
    sessionEnd_high: [
      "Harika bir oturum, emeğiniz için tebrikler!",
      "Bugün gerçekten çok iyi bir oturumdu!"
    ],
    sessionEnd_mid: [
      "İyi bir oturumdu, geldiğiniz için teşekkürler.",
      "Bir oturum daha, ve bu önemli."
    ],
    sessionEnd_low: [
      "Sonuna kadar kaldığınız için teşekkürler, önemli olan bu.",
      "Her oturum yardımcı olur, zor olanlar bile.",
      "Bir sonraki sefere, kendi hızınızda."
    ],
    explain: {
      denomination: "Bu alıştırma, bir resme karşılık gelen kelimeyi bulmanıza yardımcı olur, sakin bir şekilde.",
      completion: "Bu alıştırma, cümlenin anlamını kullanarak eksik bir kelimeyi bulmanıza yardımcı olur.",
      comprehension: "Bu alıştırma, kendi hızınızda basit bir yönergeyi anlamak üzerine çalışır.",
      repetition: "Bu alıştırma telaffuzu geliştirir: bir kelimeyi tekrar edersiniz, uygulama sizi dinler.",
      denomination_orale: "Burada, size yardımcı olacak seçenekler olmadan resmin adını yüksek sesle söylersiniz — kelimeyi tek başınıza bulmak için iyi bir pratik.",
      fluence: "Bu alıştırma, belirli bir kategoride hızlı kelime bulmayı teşvik eder.",
      intonation: "Bu alıştırma tonlama üzerine çalışır: soru, ünlem, basit cümle.",
      photos_perso: "Burada kendi fotoğraflarınızı adlandırırsınız — daha kişisel bir pratik için size tanıdık gelen kelimeler.",
      memory: "Bu oyun, bir resim dizisinin sırasını yeniden oluşturarak görsel hafızayı geliştirir — konuşmaya gerek yok.",
      phonation: "Bu alıştırma nefesiniz üzerine çalışır: kendi hızınızda, öncekinden daha iyi yapma baskısı olmadan, rahatça bir sesi sürdürmek.",
      conversation: "Burada, gerçek bir günlük durum gibi, adım adım yönlendirilmiş bir konuşma pratiği yaparsınız."
    }
  },
  pl: {
    welcome: [
      "Miło Cię znów widzieć!",
      "Gotowy·a kiedy chcesz, zaczynajmy spokojnie.",
      "Nowa sesja, w Twoim tempie.",
      "Jestem tutaj, jeśli potrzebujesz pomocy."
    ],
    welcome_back: [
      "Miło Cię widzieć, niezależnie od przerwy!",
      "Wróciłeś·aś, to najważniejsze — wracajmy spokojnie do pracy.",
      "Cieszę się, że Cię znowu widzę. Zaczniemy łagodnie, w Twoim tempie."
    ],
    insight_pointer: [
      "Mam dla Ciebie wskazówkę tuż poniżej 👇",
      "Spójrz, co zauważyłem·am, dokładnie tutaj 👇",
      "Dostosowałem·am coś dla Ciebie — szczegóły tuż poniżej."
    ],
    tip: [
      "Odrobina każdego dnia często pomaga bardziej niż jedna długa sesja od czasu do czasu.",
      "Jeśli jesteś zmęczony·a, przerwa to zawsze dobry pomysł — wrócimy do tego później.",
      "Nie musisz mieć wszystkiego dobrze: każda sesja się liczy, nawet te trudne.",
      "Możesz przechowywać swój kod użytkownika w bezpiecznym miejscu, aby podzielić się nim ze swoim logopedą, jeśli chcesz."
    ],
    exerciseStart: [
      "Zaczynajmy, spokojnie.",
      "Nie spiesz się, nie ma zegara.",
      "Będę z Tobą przez całe to ćwiczenie."
    ],
    correct: [
      "Brawo!",
      "Właśnie tak, dokładnie.",
      "Bardzo dobrze!",
      "Doskonale, tak trzymaj."
    ],
    streak: [
      "Świetnie Ci idzie, brawo!",
      "Trzy z rzędu, co za regularność!",
      "To idzie naprawdę dobrze, kontynuuj."
    ],
    encourage: [
      "Nic straconego, kontynuujmy.",
      "Nie martw się, idziemy w Twoim tempie.",
      "Spróbujmy następnego, spokojnie.",
      "Żaden problem, każda sesja się liczy."
    ],
    sessionEnd_high: [
      "Świetna sesja, gratulacje za Twoją pracę!",
      "Naprawdę bardzo dobra sesja dzisiaj!"
    ],
    sessionEnd_mid: [
      "Dobra sesja, dziękuję za przybycie.",
      "Jeszcze jedna sesja, i to się liczy."
    ],
    sessionEnd_low: [
      "Dziękuję, że zostałeś·aś do końca, to najważniejsze.",
      "Każda sesja pomaga, nawet te trudniejsze.",
      "Do następnego razu, w Twoim tempie."
    ],
    explain: {
      denomination: "To ćwiczenie pomaga Ci znaleźć słowo odpowiadające obrazkowi, spokojnie.",
      completion: "To ćwiczenie pomaga Ci znaleźć brakujące słowo, wykorzystując znaczenie zdania.",
      comprehension: "To ćwiczenie pracuje nad zrozumieniem prostego polecenia, w Twoim tempie.",
      repetition: "To ćwiczenie trenuje wymowę: powtarzasz słowo, a aplikacja Cię słucha.",
      denomination_orale: "Tutaj wypowiadasz nazwę obrazka na głos, bez podpowiedzi — dobra praktyka, aby samodzielnie znaleźć słowo.",
      fluence: "To ćwiczenie stymuluje szybkie wyszukiwanie słów w danej kategorii.",
      intonation: "To ćwiczenie pracuje nad intonacją: pytanie, wykrzyknienie, proste zdanie.",
      photos_perso: "Tutaj nazywasz swoje własne zdjęcia — znajome słowa, dla bardziej osobistej praktyki.",
      memory: "Ta gra trenuje pamięć wzrokową, odtwarzając kolejność sekwencji obrazków — bez mówienia.",
      phonation: "To ćwiczenie pracuje nad oddechem: utrzymanie dźwięku wygodnie, w Twoim tempie, bez presji, by zrobić to lepiej niż ostatnim razem.",
      conversation: "Tutaj ćwiczysz prowadzoną rozmowę, krok po kroku, jak w prawdziwej codziennej sytuacji."
    }
  },
  ja: {
    welcome: [
      "また会えて嬉しいです！",
      "準備ができたらいつでもどうぞ、ゆっくりで大丈夫です。",
      "新しいセッションです、自分のペースで進めましょう。",
      "手助けが必要なときはいつでもそばにいます。"
    ],
    welcome_back: [
      "また会えて嬉しいです、間隔が空いても大丈夫ですよ！",
      "戻ってきてくれたことが一番大切です — また少しずつ始めましょう。",
      "お会いできて嬉しいです。焦らず、自分のペースで再開しましょう。"
    ],
    insight_pointer: [
      "この下にあなたへのアドバイスがあります👇",
      "気づいたことをここに書きました、見てみてください👇",
      "あなたに合わせて調整しました — 詳細はすぐ下にあります。"
    ],
    tip: [
      "たまに長くやるより、毎日少しずつの方が助けになることが多いです。",
      "疲れているときは、休憩するのも良い考えです — また後で再開しましょう。",
      "すべてに正解する必要はありません：難しいセッションも、それだけで意味があります。",
      "フォローアップコードは安全な場所に控えておくと、言語聴覚士に伝えたいときに便利です。"
    ],
    exerciseStart: [
      "では、ゆっくり始めましょう。",
      "時間を気にせず、自分のペースでどうぞ。",
      "練習の間、ずっとそばにいます。"
    ],
    correct: [
      "よくできました！",
      "その通りです。",
      "とても良いです！",
      "完璧です、その調子で続けましょう。"
    ],
    streak: [
      "順調に続いていますね、素晴らしいです！",
      "3回連続です、とても良いペースです！",
      "とても順調です、その調子で続けましょう。"
    ],
    encourage: [
      "大丈夫、続けましょう。",
      "問題ありません、自分のペースで進みましょう。",
      "次のものを試してみましょう、焦らずに。",
      "心配いりません、どのセッションも意味があります。"
    ],
    sessionEnd_high: [
      "素晴らしいセッションでした、頑張りましたね！",
      "今日はとても良いセッションでした！"
    ],
    sessionEnd_mid: [
      "良いセッションでした、来てくれてありがとうございます。",
      "また一つセッションを重ねましたね、それが大切です。"
    ],
    sessionEnd_low: [
      "最後まで続けてくれてありがとうございます、それが一番大切です。",
      "どのセッションも助けになります、難しいときでも。",
      "また次回、自分のペースでお会いしましょう。"
    ],
    explain: {
      denomination: "この練習は、絵に合う言葉を無理なく見つける手助けをします。",
      completion: "この練習は、文の意味を手がかりに足りない言葉を見つける練習です。",
      comprehension: "この練習は、簡単な質問の理解を、自分のペースで鍛えます。",
      repetition: "この練習は発音を鍛えます：単語を繰り返すと、アプリが聞き取ります。",
      denomination_orale: "ここでは、ヒントなしで絵の名前を声に出して言います — 一人で言葉を見つける良い練習になります。",
      fluence: "この練習は、あるカテゴリーの言葉を素早く思い出す力を鍛えます。",
      intonation: "この練習はイントネーションを鍛えます：質問文、感嘆文、平叙文。",
      photos_perso: "ここでは、あなた自身の写真に名前をつけます — よく知っている言葉で、より個人的な練習になります。",
      memory: "このゲームは視覚的な記憶を鍛えます。画像が表示された順番を当てましょう — 話す必要はありません。",
      phonation: "この練習は呼吸を鍛えます：以前より上手くしようとせず、自分のペースで心地よく音を保ちましょう。",
      conversation: "ここでは、実際の日常の場面のように、段階的な会話練習をします。"
    }
  }
};

const Companion = {
  mood: 'neutral',
  message: '',
  mounts: [],

  // Enregistre un conteneur DOM (id) où afficher Ami ; peut y en avoir
  // plusieurs en même temps (tableau de bord + écran d'exercice) — ils
  // restent synchronisés.
  mount(containerId){
    if(!this.mounts.includes(containerId)) this.mounts.push(containerId);
    this.render(containerId);
  },

  pick(context){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    const bank = (COMPANION_PHRASES[lang] && COMPANION_PHRASES[lang][context])
      || (COMPANION_PHRASES.fr[context]) || [];
    if(!bank.length) return '';
    return bank[Math.floor(Math.random()*bank.length)];
  },

  // v6.34 — explication du BUT d'un exercice (pas comment y jouer, juste
  // à quoi ça sert), donnée par Ami quand il arrive sur l'écran de
  // l'exercice. Une phrase fixe par type et par langue (pas une banque
  // à picorer au hasard comme pour les encouragements) : ici la
  // variété n'apporte rien, le contenu doit rester précis et vérifiable.
  pickExplain(type){
    const lang = (window.Prefs && Prefs.data.lang) || 'fr';
    return (COMPANION_PHRASES[lang] && COMPANION_PHRASES[lang].explain && COMPANION_PHRASES[lang].explain[type])
      || (COMPANION_PHRASES.fr.explain && COMPANION_PHRASES.fr.explain[type]) || '';
  },

  // v6.34 — Ami "se déplace" jusqu'à l'exercice pour expliquer à quoi il
  // sert, plutôt que d'apparaître d'un coup avec le message générique
  // "exerciseStart". `render(containerId, {arriving:true})` joue une
  // entrée plus marquée (marche depuis plus loin) et retarde légèrement
  // l'apparition de la bulle de texte, pour donner l'impression qu'il
  // arrive d'abord, puis parle une fois sur place — voir companion.css.
  // Respecte les mêmes préférences d'accessibilité que le reste (réduire
  // les animations / mode lecture facilitée) : dans ce cas, tout
  // apparaît instantanément, sans marche ni délai.
  explain(containerId, type){
    if(!this.mounts.includes(containerId)) this.mounts.push(containerId);
    this.message = this.pickExplain(type);
    this.mood = 'happy';
    this.pose = 'point'; // v6.65 : geste qui accompagne l'explication, plutôt qu'un simple changement de visage
    this.render(containerId, {arriving:true});
  },

  moodFor(context){
    if(context==='streak') return 'delighted';
    if(context==='correct') return 'happy';
    // v6.65 : "encourage" passe de "gentle" à "caring" — un cœur qui
    // bat plutôt qu'un simple sourire, pour un moment qui est
    // justement censé être bienveillant (après une erreur).
    if(context==='encourage') return 'caring';
    if(context && context.indexOf('sessionEnd')===0) return 'proud';
    // v6.65 : nouveaux contextes — accueil (calme, pas juste "neutre"
    // par défaut) et conseil du jour (posture réfléchie, cohérent avec
    // le geste "menton" ci-dessous).
    if(context==='welcome' || context==='welcome_back') return 'calm';
    if(context==='tip') return 'thinking';
    return 'neutral';
  },

  // v6.65 : le GESTE (bras) est indépendant de l'HUMEUR (visage) — un
  // même visage peut avoir différents gestes selon le moment. Ajouté
  // à la demande de l'utilisateur ("le faire plus interagir"), sur les
  // mêmes déclencheurs que moodFor() ci-dessus plutôt que d'en créer
  // de nouveaux.
  poseFor(context){
    if(context==='streak') return 'celebrate';
    if(context==='welcome' || context==='welcome_back') return 'wave';
    if(context==='tip') return 'chin';
    return 'neutral';
  },

  say(context){
    this.message = this.pick(context);
    this.mood = this.moodFor(context);
    this.pose = this.poseFor(context);
    this.mounts.forEach(id=>this.render(id));
  },

  // Nom du personnage — volontairement identique dans toutes les langues
  // (comme "ReParole" reste "ReParole" en anglais), plutôt qu'un nom
  // traduit qui perdrait son identité.
  name(){ return 'Ami'; },

  // v6.34 : factorisé hors de svg() pour être réutilisé par render()
  // (délai de la bulle) sans dupliquer la vérification.
  _reduceMotion(){
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      || !!(window.Prefs && Prefs.data && Prefs.data.dyslexia);
  },

  render(containerId, opts){
    opts = opts || {};
    const el = document.getElementById(containerId);
    if(!el) return;
    const arriving = !!opts.arriving && !this._reduceMotion();
    const textWrap = document.createElement('div');
    textWrap.className = 'companion-textwrap';
    const name = document.createElement('div');
    name.className = 'companion-name';
    name.textContent = this.name();
    const bubble = document.createElement('div');
    // v6.52 : accent chaleureux (--warm) sur la bulle quand Ami félicite
    // une série de jours (mood "delighted") — distingue visuellement un
    // moment à célébrer du reste des messages, sans nouvel état : le
    // mood existait déjà (moodFor('streak') === 'delighted').
    const celebrate = this.mood === 'delighted' ? ' companion-bubble-celebrate' : '';
    bubble.className = (arriving ? 'companion-bubble companion-bubble-delayed' : 'companion-bubble') + celebrate;
    bubble.setAttribute('role','status');
    bubble.setAttribute('aria-live','polite');
    bubble.textContent = this.message || '';
    textWrap.appendChild(name);
    textWrap.appendChild(bubble);
    el.innerHTML = this.svg(this.mood, {arriving, pose:this.pose});
    el.appendChild(textWrap);
  },

  // v6.10 : Ami "marche sur place" (jambes qui alternent) et flotte
  // doucement (idle bob), et entre en scène (glisse + apparaît) à chaque
  // fois qu'il prend la parole — comme `render()` reconstruit le HTML à
  // chaque appel, l'animation d'entrée se rejoue naturellement à chaque
  // nouveau message, sans code de gestion d'état supplémentaire.
  // v6.15 : les animations des jambes/yeux passent de CSS
  // (transform-origin sur des formes SVG, comportement historiquement
  // capricieux selon les moteurs de rendu) à de l'animation SVG native
  // (<animateTransform>/<animate>, spec SMIL) — un mécanisme bien plus
  // ancien et beaucoup plus largement supporté, y compris sur d'anciens
  // navigateurs Android. Le point de rotation est passé explicitement en
  // paramètre ("rotate(-14 40 86)"), donc aucune ambiguïté possible sur
  // l'origine, contrairement à transform-origin qui a été la source de
  // plusieurs bugs successifs.
  //
  // L'accessibilité (préférence système "réduire les animations", et le
  // mode "lecture facilitée" de l'app) est vérifiée ICI en JS plutôt
  // qu'en CSS, car ces media-queries CSS n'ont pas d'effet sur les
  // animations SMIL : si l'une des deux est active, les balises
  // d'animation ne sont simplement pas générées — Ami reste alors une
  // image fixe, comme prévu.
  svg(mood, opts){
    opts = opts || {};
    const mouths = {
      neutral:    'M 37 59 Q 50 63 63 59',
      happy:      'M 35 55 Q 50 72 65 55',
      delighted:  'M 33 53 Q 50 77 67 53',
      gentle:     'M 39 60 Q 50 62 61 60',
      proud:      'M 35 56 Q 50 70 65 56',
      calm:       'M 40 60 Q 50 63 60 60',
      thinking:   'M 40 60 Q 50 63 60 60',
      tired:      'M 40 62 Q 50 58 60 62',
      caring:     'M 39 60 Q 50 65 61 60',
      listening:  'M 40 59 Q 50 61 60 59'
    };
    // v6.65 : 10 nouvelles expressions demandées par l'utilisateur — la
    // bouche seule ne suffit pas à distinguer certaines humeurs
    // (surpris/parle ont besoin d'une bouche ouverte, pas juste une
    // courbe), donc "surprised"/"speaking" utilisent une forme ovale
    // à part (voir mouthShape ci-dessous) plutôt qu'un chemin classique.
    const openMouths = {
      surprised: {cx:50, cy:60, rx:5, ry:7},
      speaking:  {cx:50, cy:59, rx:5, ry:5}
    };
    const mouth = mouths[mood] || mouths.neutral;
    const openMouth = openMouths[mood];
    const reduceMotion = this._reduceMotion();

    // Taille des yeux : plus grands (surpris), quasi fermés (fatigué),
    // normaux sinon. L'animation de clignement (eyeAnim) ne s'applique
    // qu'aux yeux de taille normale — un œil déjà fermé ("fatigué") ne
    // doit pas re-cligner par-dessus, et un œil agrandi ("surpris") ne
    // doit pas non plus revenir à une taille normale au milieu du clin.
    const eyeRy = mood==='surprised' ? 6 : (mood==='tired' ? 1.3 : 4.2);
    const eyeAnimActive = !reduceMotion && mood!=='tired' && mood!=='surprised';

    const legLeftAnim  = reduceMotion ? '' : '<animateTransform attributeName="transform" type="rotate" values="-14 40 86;14 40 86;-14 40 86" dur="0.8s" repeatCount="indefinite"/>';
    const legRightAnim = reduceMotion ? '' : '<animateTransform attributeName="transform" type="rotate" values="14 60 86;-14 60 86;14 60 86" dur="0.8s" repeatCount="indefinite"/>';
    const eyeAnim       = eyeAnimActive ? '<animate attributeName="ry" values="'+eyeRy+';'+eyeRy+';0.4;'+eyeRy+';'+eyeRy+'" keyTimes="0;0.85;0.9;0.95;1" dur="5.5s" repeatCount="indefinite"/>' : '';
    const sparkAnim     = reduceMotion ? '' : '<animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3.2s" repeatCount="indefinite"/>';
    const bobClass = reduceMotion ? '' : ' companion-animated';
    const enterClass = (opts.arriving && !reduceMotion) ? 'companion-enter-explain' : 'companion-enter';

    const mouthMarkup = openMouth
      ? '<ellipse class="companion-mouth-open" cx="'+openMouth.cx+'" cy="'+openMouth.cy+'" rx="'+openMouth.rx+'" ry="'+openMouth.ry+'"/>'
      : '<path class="companion-mouth" d="'+mouth+'"/>';

    // v6.65 : accessoire spécifique à certaines humeurs, à la place (ou
    // en plus) de la simple "étincelle" — jamais plus d'un accessoire à
    // la fois, pour qu'Ami reste lisible et pas surchargé.
    const accessories = {
      delighted:   '<g class="companion-accessory companion-confetti">'+
                     '<circle class="c1" cx="76" cy="12" r="3"/><circle class="c2" cx="88" cy="20" r="2.4"/><circle class="c3" cx="82" cy="30" r="2.6"/>'+
                   '</g>',
      thinking:    '<g class="companion-accessory companion-thinking">'+
                     '<circle cx="74" cy="22" r="2.2"/><circle cx="80" cy="15" r="2.8"/><circle cx="88" cy="6" r="3.4"/>'+
                   '</g>',
      tired:       '<g class="companion-accessory companion-tired">'+
                     '<text x="72" y="20" class="companion-zzz">Z</text>'+
                     '<text x="82" y="10" class="companion-zzz companion-zzz-sm">Z</text>'+
                   '</g>',
      caring:      '<path class="companion-accessory companion-heart" d="M 78 10 C 75 6 69 8 69 13 C 69 18 78 24 78 24 C 78 24 87 18 87 13 C 87 8 81 6 78 10 Z"/>',
      listening:   '<g class="companion-accessory companion-soundwave">'+
                     '<path d="M 8 42 Q 2 45 8 48"/><path d="M 4 38 Q -4 45 4 52"/>'+
                   '</g>',
      speaking:    '<g class="companion-accessory companion-soundwave companion-soundwave-right">'+
                     '<path d="M 78 55 Q 84 59 78 63"/><path d="M 82 50 Q 92 59 82 68"/>'+
                   '</g>'
    };
    const accessory = accessories[mood] || '<circle class="companion-spark" cx="78" cy="16" r="5">'+sparkAnim+'</circle>';

    // v6.65 : bras + gestes — jusqu'ici Ami ne pouvait changer que de
    // visage, jamais de posture. Demande explicite de l'utilisateur
    // ("le faire plus interagir"). Le geste (pose) est indépendant de
    // l'humeur (mood) : un même visage peut avoir différents gestes
    // selon le moment (ex. "calme" + geste "salut" à l'arrivée). Un
    // seul geste actif à la fois, jamais plus — même principe que les
    // accessoires, pour qu'Ami reste lisible.
    const poses = {
      neutral:  '<ellipse class="companion-arm" cx="20" cy="66" rx="6" ry="13"/><ellipse class="companion-arm" cx="80" cy="66" rx="6" ry="13"/>',
      wave:     '<ellipse class="companion-arm companion-arm-wave" cx="20" cy="45" rx="6" ry="16" transform="rotate(-50 20 45)"/><ellipse class="companion-arm" cx="80" cy="66" rx="6" ry="13"/>',
      point:    '<ellipse class="companion-arm" cx="20" cy="66" rx="6" ry="13"/><ellipse class="companion-arm" cx="88" cy="42" rx="6" ry="18" transform="rotate(35 88 42)"/>',
      celebrate:'<ellipse class="companion-arm companion-arm-wave" cx="15" cy="35" rx="6" ry="16" transform="rotate(-65 15 35)"/><ellipse class="companion-arm companion-arm-wave" cx="85" cy="35" rx="6" ry="16" transform="rotate(65 85 35)"/>',
      chin:     '<ellipse class="companion-arm" cx="80" cy="62" rx="6" ry="14"/><ellipse class="companion-arm" cx="58" cy="66" rx="6" ry="13" transform="rotate(-70 58 66)"/>'
    };
    const armsMarkup = poses[opts.pose] || poses.neutral;

    return (
      '<div class="'+enterClass+'">'+
        '<svg class="companion-svg mood-'+mood+bobClass+'" viewBox="0 0 100 120" width="84" height="100" aria-hidden="true" focusable="false">'+
          '<ellipse class="companion-leg" cx="40" cy="96" rx="7" ry="10">'+legLeftAnim+'</ellipse>'+
          '<ellipse class="companion-leg" cx="60" cy="96" rx="7" ry="10">'+legRightAnim+'</ellipse>'+
          armsMarkup+
          '<ellipse class="companion-body" cx="50" cy="52" rx="34" ry="30"/>'+
          '<ellipse class="companion-belly" cx="50" cy="65" rx="22" ry="12"/>'+
          '<ellipse class="companion-eye" cx="39" cy="45" rx="4.2" ry="'+eyeRy+'">'+eyeAnim+'</ellipse>'+
          '<ellipse class="companion-eye" cx="61" cy="45" rx="4.2" ry="'+eyeRy+'">'+eyeAnim+'</ellipse>'+
          mouthMarkup+
          accessory+
        '</svg>'+
      '</div>'
    );
  }
};

window.Companion = Companion;
window.COMPANION_PHRASES = COMPANION_PHRASES;
