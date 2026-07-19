// =====================================================================
//  BANQUE D'EXERCICES EN DARIJA TUNISIENNE (v6.147)
//  ---------------------------------------------------------------------
//  ⚠️ BROUILLON — même statut que js/exercises-ma.js (voir son
//  commentaire d'en-tête pour le détail complet). Aucun fichier natif
//  n'a été fourni pour le tunisien : première tentative de ma part,
//  demandée explicitement, plutôt que de laisser cette langue à zéro
//  contenu indéfiniment.
//
//  Structure identique aux 9 langues "complètes" (24 mots de
//  dénomination, 24 phrases de complétion, 18 questions de
//  compréhension), même contenu sémantique que js/exercises-en.js
//  comme base de traduction.
//
//  Marqueur possessif distinctif utilisé : متاع (tunisien), comme
//  pour le reste de l'interface tunisienne (voir js/i18n.js, bloc
//  I18N_STRINGS.tn) — pas تاع (algérien) ni ديال (marocain).
//
//  ⚠️ CONTENU NON RELU par une personne tunisienne darijaphone à ce
//  jour — à faire vérifier avant tout usage clinique réel (garde-fou
//  n°8). Pas d'exercices vocaux : aucune voix de navigateur ne prend
//  en charge la darija tunisienne.
// =====================================================================

window.BANK_TN = {
  denomination:{ title:'سمّي الصور', items:{
    1:[ {emoji:'🐱',answer:'القطوسة',choices:['القطوسة','الكلب','الأرنب']},
        {emoji:'🍎',answer:'التفاحة',choices:['التفاحة','الأنجاصة','البرقوقة']},
        {emoji:'🏠',answer:'الدار',choices:['الدار','الكرهبة','الشجرة']},
        {emoji:'☀️',answer:'الشمس',choices:['الشمس','القمر','السحاب']},
        {emoji:'🚗',answer:'الكرهبة',choices:['الكرهبة','البيسكليت','الفلوكة']},
        {emoji:'🐟',answer:'الحوت',choices:['الحوت','العصفور','الفرس']},
        {emoji:'🌹',answer:'الزهرة',choices:['الزهرة','الحشيش','الورقة']},
        {emoji:'🍞',answer:'الخبز',choices:['الخبز','الحلوة','الجبن']} ],
    2:[ {emoji:'🦋',answer:'الفراشة',choices:['الفراشة','النحلة','اليعسوب']},
        {emoji:'⌚',answer:'الساعة',choices:['الساعة','المنبه','البندول']},
        {emoji:'🎻',answer:'الكمنجة',choices:['الڨيتارة','الكمنجة','الفيولونسال']},
        {emoji:'🍄',answer:'الفطر',choices:['الفطر','الطماطم','البصلة']},
        {emoji:'🦒',answer:'الزرافة',choices:['الزرافة','الجمل','الحمار']},
        {emoji:'⛵',answer:'فلوكة',choices:['فلوكة','الباخرة','الزورق']},
        {emoji:'🎺',answer:'البوق',choices:['البوق','الفلوت','الساكسو']},
        {emoji:'🌋',answer:'البركان',choices:['البركان','الجبل','الهضبة']} ],
    3:[ {emoji:'🧭',answer:'البوصلة',choices:['البوصلة','البارومتر','الترمومتر']},
        {emoji:'🦔',answer:'القنفذ',choices:['القنفذ','الفار','الخلد']},
        {emoji:'⚓',answer:'المرسى',choices:['المرسى','الهيليس','الدفة']},
        {emoji:'🔬',answer:'المجهر',choices:['المجهر','التلسكوب','السماعة']},
        {emoji:'🪕',answer:'البانجو',choices:['البانجو','الماندولين','الڨيتارة الصغيرة']},
        {emoji:'🦦',answer:'قضاعة الما',choices:['قضاعة الما','ابن عرس','الفنك']},
        {emoji:'🌪️',answer:'الاعصار',choices:['الاعصار','العاصفة','الريح القوية']},
        {emoji:'🛡️',answer:'الدرع',choices:['الدرع','الخوذة','السلاح']} ]
  }},
  completion:{ title:'كمّل الجملة', items:{
    1:[ {text:'القطوسة تشرب ___.',answer:'الحليب',choices:['الحليب','الخبز','الما']},
        {text:'نرقد في ___ متاعي.',answer:'الفراش',choices:['الفراش','الطبسي','الشكارة']},
        {text:'الشمس ___.',answer:'صفراء',choices:['صفراء','بردة','ثقيلة']},
        {text:'ناكل بـ ___.',answer:'الشوكة',choices:['الشوكة','الكرسي','الباب']},
        {text:'بالليل السما ___.',answer:'كحلة',choices:['كحلة','خضرة','مدورة']},
        {text:'نمشي بـ ___ متاعي.',answer:'الرجلين',choices:['الرجلين','اليدين','العينين']},
        {text:'نشربو من ___.',answer:'الكاس',choices:['الكاس','الكتاب','الحيط']},
        {text:'الصغير يعيط في ___ متاعو.',answer:'المهد',choices:['المهد','الجنان','الكوجينة']} ],
    2:[ {text:'باش نكتب، نستعمل ___.',answer:'القلم',choices:['القلم','المطرقة','المكنسة']},
        {text:'في الشتا، الجو يكون ___.',answer:'بارد',choices:['بارد','سخون','رطب']},
        {text:'البوسطجي يجيب ___.',answer:'البريد',choices:['البريد','الخبز','الجريدة']},
        {text:'باش نحل الباب، لازمني ___.',answer:'المفتاح',choices:['المفتاح','القنديل','الكاس']},
        {text:'نتفرج في فيلم في ___.',answer:'التلفزة',choices:['التلفزة','الراديو','الشباك']},
        {text:'الطير يبني ___ متاعو.',answer:'العش',choices:['العش','الحفرة','الحيط']},
        {text:'نشريو الخبز من ___.',answer:'المخبزة',choices:['المخبزة','الصيدلية','البنك']},
        {text:'قبل ما ناكلو، نغسلو ___.',answer:'اليدين',choices:['اليدين','الشعر','السنان']} ],
    3:[ {text:'قبل ما تخرج، ماتنساش ___ الباب.',answer:'تسكر',choices:['تسكر','تحل','تصبغ']},
        {text:'الطبيب كتبلو ___.',answer:'علاج',choices:['علاج','حلاوة','باقة']},
        {text:'الاجتماع ___ لغدوة.',answer:'تأجل',choices:['تأجل','تولد','تصبغ']},
        {text:'لازمك ___ بالضرائب قبل الأجل.',answer:'تصرح',choices:['تصرح','ترقص','تسقي']},
        {text:'البستاني باش ___ الورد.',answer:'يقلم',choices:['يقلم','يقرا','يعوم']},
        {text:'بعد الرياضة، لازمك ___.',answer:'تستريح',choices:['تستريح','تتعصب','تقلق']},
        {text:'هاذي القصة صعيبة باش ___.',answer:'تصدقها',choices:['تصدقها','تخيطها','تطيبها']},
        {text:'الشاهد رفض ___.',answer:'يشهد',choices:['يشهد','يعيط','يغني']} ]
  }},
  comprehension:{ title:'افهم السؤال', items:{
    1:[ {text:'شنية الحيوان اللي ينبح؟',answer:'الكلب',choices:['الكلب','الحوت','العصفور']},
        {text:'بشنو ناكلو الشربة؟',answer:'بالمغرفة',choices:['بالمغرفة','بالسكين','بالفرشيطة']},
        {text:'وين نرقدو؟',answer:'في الفراش',choices:['في الفراش','في الطبسي','في الشكارة']},
        {text:'شنية لون الحشيش؟',answer:'أخضر',choices:['أخضر','أحمر','أزرق']},
        {text:'شنو نشربو كي نكونو عطشانين؟',answer:'الما',choices:['الما','الرمل','الورقة']},
        {text:'شنية الحاجة اللي تضوي بالليل؟',answer:'القنديل',choices:['القنديل','المخدة','الطبسي']} ],
    2:[ {text:'شنية الحاجة تستعمل باش تعرف الوقت؟',answer:'الساعة',choices:['الساعة','الكتاب','القنديل']},
        {text:'شنو الفصل اللي يجي بعد الشتا؟',answer:'الربيع',choices:['الربيع','الصيف','الخريف']},
        {text:'علاش نستعملو الشمسية؟',answer:'باش ما نبلّوش بالشتا',choices:['باش ما نبلّوش بالشتا','باش ناكلو','باش نرقدو']},
        {text:'شنية الخدمة اللي تداوي المرضى؟',answer:'الطبيب',choices:['الطبيب','الخبّاز','الصبّاغ']},
        {text:'قداش نهار في الجمعة؟',answer:'سبعة',choices:['سبعة','خمسة','عشرة']},
        {text:'وين نشريو الدوا؟',answer:'في الصيدلية',choices:['في الصيدلية','في البوسطة','في الكراج']} ],
    3:[ {text:'إذا كل الورد زهرة، الوردة زهرة؟',answer:'أيه',choices:['أيه','لا','بعض المرات']},
        {text:'عكس "بسرعة" هو:',answer:'بالشوية',choices:['بالشوية','بصوت عالي','بالفرحة']},
        {text:'"الشتا حابسة" تعني:',answer:'تنزل شتا برشة',choices:['تنزل شتا برشة','الجو صافي','الريح قوية']},
        {text:'بيار أطول من بول. شكون الأقصر؟',answer:'بول',choices:['بول','بيار','الزوز']},
        {text:'"قلب الصفحة" تعني:',answer:'نتقدم لقدام',choices:['نتقدم لقدام','نقرا كتاب','نرتاح']},
        {text:'شنية الكلمة اللي موش فاكهة؟',answer:'الجزر',choices:['الجزر','الكرز','الموز']} ]
  }}
};
