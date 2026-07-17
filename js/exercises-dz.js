// =====================================================================
//  BANQUE D'EXERCICES EN DARIJA ALGÉRIENNE (v6.103)
//  ---------------------------------------------------------------------
//  Contenu fourni intégralement par l'utilisateur (5 fichiers Excel :
//  Darija_Algerienne_Denomination_Partie1/2/3.xlsx et
//  Darija_Algerienne_Completion_Partie1/2.xlsx) — aucun mot ni aucune
//  phrase n'a été inventé ici. Couvre exactement la liste demandée dans
//  docs/kabyle-parity-request.md (92 mots de dénomination répartis
//  23/34/35 par niveau, 24 phrases de complétion réparties 8/8/8).
//
//  Ce que j'ai généré moi-même : les choix multiples (distracteurs) —
//  toujours puisés dans le vocabulaire DÉJÀ FOURNI par l'utilisateur
//  pour ce même exercice, jamais un mot inventé. Voir
//  /home/claude/build_dz_bank.py dans la session de développement pour
//  la logique exacte si besoin de la reproduire.
//
//  4 phrases de complétion demandaient un ajustement : le mot à
//  blanquer dans la phrase en darija n'est pas toujours identique au
//  "mot attendu" isolé de la colonne source, à cause des accords de
//  l'arabe algérien (possessif, duel) — ex. "فراشي" (mon lit) dans la
//  phrase, vs "الفراش" (le lit) comme mot isolé. Dans ces 4 cas, c'est
//  la forme réellement présente dans la phrase qui a été blanquée,
//  pas la forme du dictionnaire — même principe que l'arabe standard
//  déjà en place dans l'app (voir exercises-ar.js, "أنام في ___" →
//  "سريري"). Détail des 4 phrases concernées dans le commentaire du
//  script de construction.
//
//  ⚠️ CONTENU NON RELU par un∙e professionnel∙le de santé ou un∙e
//  locuteur∙rice natif∙ve à ce jour, au-delà de la personne
//  algérienne-darijaphone de l'utilisateur qui a fourni ces fichiers
//  — même statut que le reste de l'app tant qu'aucune validation
//  clinique externe n'a eu lieu (garde-fou n°8, PREPARATION-REGLEMENTAIRE.md).
//
//  Ce qui MANQUAIT pour la parité complète avec le français :
//   - Compréhension (18 questions, 6/6/6) — v6.142 : brouillon ajouté
//     (voir le bloc "comprehension" plus bas, avec son propre
//     avertissement détaillé) — PAS au même niveau de confiance que
//     dénomination/complétion ci-dessus, à faire vérifier par une
//     personne algérienne-darijaphone en priorité.
//   - Les exercices vocaux (répétition, dénomination orale, fluence,
//     conversation guidée) restent en français : aucune voix de
//     navigateur ne prend en charge la darija algérienne
//     (LANGUAGES.dz.speechLocale = null, voir js/i18n.js).
//   - L'interface (menus, boutons) au-delà des clés déjà traduites —
//     voir js/i18n.js, bloc `dz`, et le suivi dans SKILL_ReParole_v6.md.
//
//  POUR CONTRIBUER / CORRIGER : ce fichier suit le même mécanisme que
//  js/exercises.js (banque par langue, items par niveau) — ajoutez ou
//  corrigez des entrées ici, sans toucher au reste du code.
// =====================================================================

window.BANK_DZ = {
  // "شنو هذا؟" (chnou hada?) = "qu'est-ce que c'est ?" — expression très
  // courante et largement attestée en darija algérienne (pas tirée des
  // fichiers Excel fournis, ajoutée pour activer l'écoute des mots via
  // un vrai enregistrement — voir js/app.js, playPartialLangWordUI).
  denomination:{ title:'سمي الصور', consigne:'شنو هذا؟', items:{
    1:[ {emoji:'🐶',answer:'كلب',choices:['فأر','سروال','كلب']},
        {emoji:'🐰',answer:'أرنب',choices:['حليب','أرنب','بطّة']},
        {emoji:'🐮',answer:'بقرة',choices:['كرسي','صباط','بقرة']},
        {emoji:'🐷',answer:'خنزير',choices:['أرنب','كلب','خنزير']},
        {emoji:'🐭',answer:'فأر',choices:['حليب','فأر','مفتاح']},
        {emoji:'🦆',answer:'بطّة',choices:['بطّة','كرسي','فرماج']},
        {emoji:'🥚',answer:'بيض',choices:['بيض','حليب','سحاب']},
        {emoji:'🧀',answer:'فرماج',choices:['فرماج','كلب','بطّة']},
        {emoji:'🥛',answer:'حليب',choices:['عنب','موز','حليب']},
        {emoji:'🍌',answer:'موز',choices:['خنزير','عنب','موز']},
        {emoji:'🍊',answer:'برتقال',choices:['برتقال','فريز','خنزير']},
        {emoji:'🍇',answer:'عنب',choices:['أرنب','عنب','سحاب']},
        {emoji:'🍓',answer:'فريز',choices:['فريز','جزر','بقرة']},
        {emoji:'🥕',answer:'جزر',choices:['قميجة','جزر','سروال']},
        {emoji:'🌙',answer:'قمر',choices:['بقرة','قمر','أرنب']},
        {emoji:'☁️',answer:'سحاب',choices:['موز','بقرة','سحاب']},
        {emoji:'🌧️',answer:'شتا',choices:['شتا','حليب','فريز']},
        {emoji:'🔑',answer:'مفتاح',choices:['عنب','مفتاح','بطّة']},
        {emoji:'🪑',answer:'كرسي',choices:['صباط','كرسي','حليب']},
        {emoji:'🛏️',answer:'فراش',choices:['قميجة','سروال','فراش']},
        {emoji:'👕',answer:'قميجة',choices:['قميجة','قمر','بطّة']},
        {emoji:'👖',answer:'سروال',choices:['مفتاح','قميجة','سروال']},
        {emoji:'👟',answer:'صباط',choices:['فرماج','أرنب','صباط']} ],
    2:[ {emoji:'🦋',answer:'فراشة',choices:['لوحة','ساكسوفون','فراشة']},
        {emoji:'⌚',answer:'مونطرا',choices:['مونطرا','موجة','سرطان البحر']},
        {emoji:'🎻',answer:'فيولون',choices:['باراسول','لوحة','فيولون']},
        {emoji:'🍄',answer:'فطر',choices:['فطر','بومة','طبل']},
        {emoji:'🦒',answer:'زرافة',choices:['لوحة','زرافة','لامبة']},
        {emoji:'⛵',answer:'مركب شراعي',choices:['بازل','مركب شراعي','بومة']},
        {emoji:'🎺',answer:'ترومبيت',choices:['فطر','أيل','ترومبيت']},
        {emoji:'🌋',answer:'بركان',choices:['بركان','زرافة','لامبة']},
        {emoji:'🦌',answer:'أيل',choices:['باراسول','أيل','بيانو']},
        {emoji:'🦉',answer:'بومة',choices:['بومة','بركان','ساكسوفون']},
        {emoji:'🦅',answer:'نسر',choices:['جبل','نسر','بركان']},
        {emoji:'🐢',answer:'سلحفاة',choices:['سلحفاة','باراسول','فراشة']},
        {emoji:'🦎',answer:'وزغة',choices:['بازل','وزغة','سلحفاة']},
        {emoji:'🐙',answer:'أخطبوط',choices:['شاطئ','أخطبوط','بازل']},
        {emoji:'🦀',answer:'سرطان البحر',choices:['بومة','برج','سرطان البحر']},
        {emoji:'🎸',answer:'قيتار',choices:['موجة','بالون','قيتار']},
        {emoji:'🥁',answer:'طبل',choices:['برج','شاطئ','طبل']},
        {emoji:'🎹',answer:'بيانو',choices:['مركب شراعي','قيتار','بيانو']},
        {emoji:'🎷',answer:'ساكسوفون',choices:['أيل','زرافة','ساكسوفون']},
        {emoji:'⛰️',answer:'جبل',choices:['جبل','نسر','طبل']},
        {emoji:'🏖️',answer:'شاطئ',choices:['شاطئ','أخطبوط','وزغة']},
        {emoji:'🌊',answer:'موجة',choices:['موجة','برج','لوحة']},
        {emoji:'🌉',answer:'جسر',choices:['بركان','قيتار','جسر']},
        {emoji:'🏰',answer:'قصر',choices:['موجة','قصر','مونطرا']},
        {emoji:'🗼',answer:'برج',choices:['سرطان البحر','فراشة','برج']},
        {emoji:'⛲',answer:'نافورة',choices:['زرافة','سرطان البحر','نافورة']},
        {emoji:'🖼️',answer:'لوحة',choices:['بازل','زرافة','لوحة']},
        {emoji:'🎥',answer:'كاميرا',choices:['بالون','كاميرا','أخطبوط']},
        {emoji:'💡',answer:'لامبة',choices:['لامبة','قيتار','هدية']},
        {emoji:'🏮',answer:'فانوس',choices:['ترومبيت','وزغة','فانوس']},
        {emoji:'⛱️',answer:'باراسول',choices:['باراسول','كاميرا','جسر']},
        {emoji:'🎁',answer:'هدية',choices:['ترومبيت','فطر','هدية']},
        {emoji:'🎈',answer:'بالون',choices:['موجة','ترومبيت','بالون']},
        {emoji:'🧩',answer:'بازل',choices:['لامبة','وزغة','بازل']} ],
    3:[ {emoji:'🧭',answer:'بوصلة',choices:['ميزان','بوصلة','طاووس']},
        {emoji:'🦔',answer:'قنفذ',choices:['ثعلب الماء','قنفذ','منشار']},
        {emoji:'⚓',answer:'مرساة',choices:['بانجو','بوصلة','مرساة']},
        {emoji:'🔬',answer:'ميكروسكوب',choices:['ميكروسكوب','برغي','فلامنغو']},
        {emoji:'🪕',answer:'بانجو',choices:['بجعة','ترس','بانجو']},
        {emoji:'🦦',answer:'ثعلب الماء',choices:['ثعلب الماء','بوصلة','إبرة']},
        {emoji:'🌪️',answer:'إعصار',choices:['إعصار','فخار','مطفأة']},
        {emoji:'🛡️',answer:'ترس',choices:['ببغاء','ترس','ظربان']},
        {emoji:'🦥',answer:'كسلان',choices:['ميكروسكوب','قوس','كسلان']},
        {emoji:'🦫',answer:'قندس',choices:['فخ','قندس','عقرب']},
        {emoji:'🦨',answer:'ظربان',choices:['ميكروسكوب','عقرب','ظربان']},
        {emoji:'🦩',answer:'فلامنغو',choices:['تلسكوب','فلامنغو','بانجو']},
        {emoji:'🦚',answer:'طاووس',choices:['تلسكوب','طاووس','مرساة']},
        {emoji:'🦜',answer:'ببغاء',choices:['ببغاء','تمساح','برغي']},
        {emoji:'🦢',answer:'بجعة',choices:['قوس','ببغاء','بجعة']},
        {emoji:'🧪',answer:'أنبوب اختبار',choices:['أنبوب اختبار','ترس','كسلان']},
        {emoji:'🔭',answer:'تلسكوب',choices:['مطفأة','قوس','تلسكوب']},
        {emoji:'🧲',answer:'مغناطيس',choices:['مطفأة','إعصار','مغناطيس']},
        {emoji:'⚖️',answer:'ميزان',choices:['تلسكوب','عقرب','ميزان']},
        {emoji:'🏺',answer:'فخار',choices:['فخار','أنبوب اختبار','بانجو']},
        {emoji:'⚔️',answer:'سيف',choices:['سيف','ظربان','منشار']},
        {emoji:'🏹',answer:'قوس',choices:['قوس','تمساح','بوصلة']},
        {emoji:'🎪',answer:'خيمة السيرك',choices:['كسلان','خيمة السيرك','إعصار']},
        {emoji:'🎠',answer:'دوارة',choices:['دوارة','قندس','إعصار']},
        {emoji:'🎯',answer:'هدف',choices:['قوس','ببغاء','هدف']},
        {emoji:'🪡',answer:'إبرة',choices:['بيت العنكبوت','إبرة','عقرب']},
        {emoji:'⚙️',answer:'ترس',choices:['منشار','ترس','ثعلب الماء']},
        {emoji:'🔩',answer:'برغي',choices:['قوس','بوصلة','برغي']},
        {emoji:'🪛',answer:'مفك',choices:['مفك','ظربان','منشار']},
        {emoji:'🪚',answer:'منشار',choices:['بوصلة','ترس','منشار']},
        {emoji:'🧯',answer:'مطفأة',choices:['مرساة','مطفأة','دوارة']},
        {emoji:'🪤',answer:'فخ',choices:['كسلان','برغي','فخ']},
        {emoji:'🕸️',answer:'بيت العنكبوت',choices:['مرساة','بيت العنكبوت','دوارة']},
        {emoji:'🦂',answer:'عقرب',choices:['عقرب','إعصار','أنبوب اختبار']},
        {emoji:'🐊',answer:'تمساح',choices:['قندس','أنبوب اختبار','تمساح']} ]
  }},
  completion:{ title:'كمل الجملة', items:{
    1:[ {text:'القط يشرب ___.',answer:'الحليب',choices:['فراشي','كحلة','الحليب']},
        {text:'نرقد في ___.',answer:'فراشي',choices:['المهد','فراشي','كحلة']},
        {text:'الشمس ___.',answer:'صفراء',choices:['شوكة','صفراء','فراشي']},
        {text:'ناكل بال___.',answer:'شوكة',choices:['الحليب','شوكة','كحلة']},
        {text:'فالليل السما ___.',answer:'كحلة',choices:['كحلة','شوكة','فراشي']},
        {text:'نمشي ب___.',answer:'رجليا',choices:['المهد','فراشي','رجليا']},
        {text:'نشرب ب___.',answer:'كاس',choices:['كاس','فراشي','رجليا']},
        {text:'البيبي يبكي في ___ تاعو.',answer:'المهد',choices:['المهد','الحليب','صفراء']} ],
    2:[ {text:'باش نكتب نستعمل ___.',answer:'ستيلو',choices:['ستيلو','العش','المخبزة']},
        {text:'فالشتا البرد ___.',answer:'قارس',choices:['يديا','قارس','ستيلو']},
        {text:'البوسطجي يجيب ___.',answer:'البريد',choices:['العش','مفتاح','البريد']},
        {text:'باش تحل الباب لازم ___.',answer:'مفتاح',choices:['مفتاح','تلفزيون','العش']},
        {text:'نتفرج فيلم فال___.',answer:'تلفزيون',choices:['مفتاح','تلفزيون','العش']},
        {text:'الطير يبني ___ تاعو.',answer:'العش',choices:['تلفزيون','مفتاح','العش']},
        {text:'نشري الخبز من ___.',answer:'المخبزة',choices:['العش','المخبزة','ستيلو']},
        {text:'قبل ما ناكل نغسل ___.',answer:'يديا',choices:['تلفزيون','يديا','المخبزة']} ],
    3:[ {text:'قبل ما تخرج، ما تنساش ___ الباب.',answer:'تغلق',choices:['يقلم','تصرح','تغلق']},
        {text:'الطبيب كتبلي ___.',answer:'علاج',choices:['ترتاح','علاج','تصرح']},
        {text:'الاجتماع ___ للغد.',answer:'تأجل',choices:['تأجل','تصدق','تصرح']},
        {text:'لازم ___ بالضرائب قبل آخر أجل.',answer:'تصرح',choices:['تصرح','يقلم','تصدق']},
        {text:'الجنان ___ الورد.',answer:'يقلم',choices:['تصدق','يقلم','تأجل']},
        {text:'بعد المجهود لازم ___.',answer:'ترتاح',choices:['ترتاح','علاج','تصرح']},
        {text:'هاد القصة صعيبة باش ___.',answer:'تصدق',choices:['يشهد','ترتاح','تصدق']},
        {text:'الشاهد رفض ___.',answer:'يشهد',choices:['يقلم','تصرح','يشهد']} ]
  }},
  // =====================================================================
  //  ⚠️ COMPRÉHENSION — BROUILLON, PAS COMME LE RESTE DE CE FICHIER
  //  ---------------------------------------------------------------------
  //  Contrairement à la dénomination et à la complétion ci-dessus
  //  (100% fournies par l'utilisateur, aucun mot inventé), ces 18
  //  questions sont une PREMIÈRE TENTATIVE de ma part — l'utilisateur a
  //  explicitement demandé de finaliser ce qui restait plutôt que
  //  d'attendre un nouveau fichier natif (voir docs/dz-parity-request.md
  //  pour l'historique complet). Même risque déjà signalé pour ce même
  //  fichier : sonner "arabe standard à peine modifié" plutôt que du
  //  vrai parler algérien, en particulier les 2 questions contenant une
  //  expression idiomatique (niveau 3, "il pleut des cordes" et
  //  "tourner la page") — à faire vérifier par une personne
  //  algérienne-darijaphone en priorité, comme le reste de l'app avant
  //  tout usage clinique (garde-fou n°8).
  // =====================================================================
  comprehension:{ title:'افهم السؤال', items:{
    1:[ {text:'شنو الحيوان اللي يهبب؟',answer:'الكلب',choices:['الكلب','القط','الحصان']},
        {text:'بواش ناكلو الشوربة؟',answer:'المعلقة',choices:['المعلقة','الشوكة','الكاس']},
        {text:'وين نرقدو؟',answer:'فالفراش',choices:['فالفراش','فالكرسي','فالطاولة']},
        {text:'شنو اللون تاع الحشيش؟',answer:'أخضر',choices:['أخضر','أصفر','أزرق']},
        {text:'شنو نشربو كي نكونو عطشانين؟',answer:'الما',choices:['الما','الحليب','الزيت']},
        {text:'شنو الحاجة اللي تضوي بالليل؟',answer:'اللمبة',choices:['اللمبة','الساعة','المرآة']} ],
    2:[ {text:'شنو الحاجة تخدم باش نشوفو الوقت؟',answer:'الساعة',choices:['الساعة','اللمبة','المرآة']},
        {text:'شنو الفصل اللي يجي من بعد الشتاء؟',answer:'الربيع',choices:['الربيع','الصيف','الخريف']},
        {text:'شنو نديرو بالمظلة؟',answer:'نتحاماو من الشتا',choices:['نتحاماو من الشتا','نشربو الما','نطيرو']},
        {text:'شنو الخدمة اللي تداوي المرضى؟',answer:'الطبيب',choices:['الطبيب','البوسطجي','الخبّاز']},
        {text:'شحال يوم فالجمعة؟',answer:'سبعة',choices:['سبعة','خمسة','عشرة']},
        {text:'وين نشريو الدوا؟',answer:'فالصيدلية',choices:['فالصيدلية','فالمخبزة','فالبريد']} ],
    3:[ {text:'إذا كل الورد هو زهرة، واش الوردة هي زهرة؟',answer:'إيه',choices:['إيه','لا','ماكانش جواب']},
        {text:'عكس "بالسرعة" هو:',answer:'بالشوية',choices:['بالشوية','بقوة','بالنهار']},
        {text:'"الشتا صابة بزاف" تعني:',answer:'شتا كبيرة',choices:['شتا كبيرة','شتا خفيفة','ماكانش شتا']},
        {text:'بيار أطول من بول. شكون الأقصر؟',answer:'بول',choices:['بول','بيار','بصح']},
        {text:'"ندّي لحاجة أخرى" تعني:',answer:'نبدل الموضوع',choices:['نبدل الموضوع','نرجع للور','نبقى فنفس الحاجة']},
        {text:'شنو الكلمة اللي ماشي فاكهة؟',answer:'الجزر',choices:['الجزر','التفاح','الموز']} ]
  }}
};
