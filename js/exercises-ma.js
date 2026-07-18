// =====================================================================
//  BANQUE D'EXERCICES EN DARIJA MAROCAINE (v6.147)
//  ---------------------------------------------------------------------
//  ⚠️ BROUILLON — pas comme la darija algérienne (js/exercises-dz.js),
//  dont la dénomination et la complétion venaient à 100% de fichiers
//  fournis par l'utilisateur. Ici, aucun fichier natif n'a été fourni
//  pour le marocain : ce contenu est une première tentative de ma
//  part, demandée explicitement ("attaque la traduction marocain et
//  tunisien"), plutôt que de laisser ces deux langues à zéro contenu
//  indéfiniment (voir les audits précédents, qui signalaient ce trou
//  comme la priorité la plus concrète).
//
//  Structure identique aux 9 langues "complètes" (24 mots de
//  dénomination, 24 phrases de complétion, 18 questions de
//  compréhension — 8/8/8 et 6/6/6 par niveau), avec le même contenu
//  sémantique que js/exercises-en.js comme base de traduction, pour
//  rester cohérent et déjà validé sur le plan clinique/pédagogique.
//
//  Marqueur possessif distinctif utilisé : ديال (marocain), comme
//  pour le reste de l'interface marocaine (voir js/i18n.js, bloc
//  I18N_STRINGS.ma) — pas تاع (algérien) ni متاع (tunisien).
//
//  ⚠️ CONTENU NON RELU par une personne marocaine darijaphone à ce
//  jour — à faire vérifier avant tout usage clinique réel, plus
//  encore que le reste de l'app (garde-fou n°8). Pas d'exercices
//  vocaux (répétition, dénomination orale, fluence) : aucune voix de
//  navigateur ne prend en charge la darija marocaine.
// =====================================================================

window.BANK_MA = {
  denomination:{ title:'سمي الصور', items:{
    1:[ {emoji:'🐱',answer:'القط',choices:['القط','الكلب',"الفنيك"]},
        {emoji:'🍎',answer:'التفاحة',choices:['التفاحة','الكمثرى','البرقوق']},
        {emoji:'🏠',answer:'الدار',choices:['الدار','الطوموبيل','الشجرة']},
        {emoji:'☀️',answer:'الشمس',choices:['الشمس','القمر','السحاب']},
        {emoji:'🚗',answer:'الطوموبيل',choices:['الطوموبيل','البيسكليت','الفلوكة']},
        {emoji:'🐟',answer:'الحوت',choices:['الحوت','الطير','العود']},
        {emoji:'🌹',answer:'الوردة',choices:['الوردة','الحشيش','الورقة']},
        {emoji:'🍞',answer:'الخبز',choices:['الخبز','الحلوة','الفرماج']} ],
    2:[ {emoji:'🦋',answer:'الفراشة',choices:['الفراشة','النحلة','اليعسوب']},
        {emoji:'⌚',answer:'الساعة',choices:['الساعة','المنبه','البندول']},
        {emoji:'🎻',answer:'الكمانجة',choices:['الكيطارة','الكمانجة','الفيولونسيل']},
        {emoji:'🍄',answer:'الفطر',choices:['الفطر','الماطيشة','البصلة']},
        {emoji:'🦒',answer:'الزرافة',choices:['الزرافة','الجمل','الحمار']},
        {emoji:'⛵',answer:'فلوكة الشراع',choices:['فلوكة الشراع','الباخرة','الزورق']},
        {emoji:'🎺',answer:'البوق',choices:['البوق','الفلوت','الساكسو']},
        {emoji:'🌋',answer:'البركان',choices:['البركان','الجبل','الهضبة']} ],
    3:[ {emoji:'🧭',answer:'البوصلة',choices:['البوصلة','البارومتر','الترمومتر']},
        {emoji:'🦔',answer:'القنفد',choices:['القنفد','الفار','الخلد']},
        {emoji:'⚓',answer:'المرساة',choices:['المرساة','الهيليس','الدفة']},
        {emoji:'🔬',answer:'المجهر',choices:['المجهر','التلسكوب','السماعة']},
        {emoji:'🪕',answer:'البانجو',choices:['البانجو','الماندولين','الغيثارة الصغيرة']},
        {emoji:'🦦',answer:'قضاعة الما',choices:['قضاعة الما','ابن عرس','الفنك']},
        {emoji:'🌪️',answer:'الإعصار',choices:['الإعصار','العاصفة','الريح القوية']},
        {emoji:'🛡️',answer:'الدرع',choices:['الدرع','الخوذة','السلاح']} ]
  }},
  completion:{ title:'كمل الجملة', items:{
    1:[ {text:'القط يشرب ___.',answer:'الحليب',choices:['الحليب','الخبز','الما']},
        {text:'نرقد في ___ ديالي.',answer:'الفراش',choices:['الفراش','الطبسيل','الساك']},
        {text:'الشمس ___.',answer:'صفراء',choices:['صفراء','بردة','تقيلة']},
        {text:'ناكل بـ ___.',answer:'الشوكة',choices:['الشوكة','الكرسي','الباب']},
        {text:'فالليل السما ___.',answer:'كحلة',choices:['كحلة','خضرة','مدورة']},
        {text:'نمشي بـ ___ ديالي.',answer:'الرجلين',choices:['الرجلين','اليدين','العينين']},
        {text:'نشربو من ___.',answer:'الكاس',choices:['الكاس','الكتاب','الحيط']},
        {text:'البيبي كيبكي فـ ___ ديالو.',answer:'المهد',choices:['المهد','الجنان','الفرن']} ],
    2:[ {text:'باش نكتب، نستعمل ___.',answer:'الستيلو',choices:['الستيلو','المطرقة','المكنسة']},
        {text:'فالشتا، الجو كيكون ___.',answer:'بارد',choices:['بارد','سخون','رطب']},
        {text:'البوسطي كيجيب ___.',answer:'البريد',choices:['البريد','الخبز','الجريدة']},
        {text:'باش نحل الباب، خاصني ___.',answer:'المفتاح',choices:['المفتاح','القنديل','الكاس']},
        {text:'كنتفرج فيلم فـ ___.',answer:'التلفزة',choices:['التلفزة','الراديو','الشرجم']},
        {text:'الطير كيبني ___ ديالو.',answer:'العش',choices:['العش','الحفرة','الحيط']},
        {text:'كنشريو الخبز من ___.',answer:'الفران',choices:['الفران','الصيدلية','البنك']},
        {text:'قبل ما ناكلو، كنغسلو ___.',answer:'اليدين',choices:['اليدين','الشعر','السنان']} ],
    3:[ {text:'قبل ما تخرج، ما تنساش ___ الباب.',answer:'تسد',choices:['تسد','تحل','تصبغ']},
        {text:'الطبيب كتب ليه ___.',answer:'علاج',choices:['علاج','حلوة','باقة']},
        {text:'الاجتماع ___ لغدا.',answer:'تأجل',choices:['تأجل','تولد','تصبغ']},
        {text:'خاصك ___ بالضرائب قبل الأجل.',answer:'تصرح',choices:['تصرح','ترقص','تسقي']},
        {text:'البستاني غادي ___ الورد.',answer:'يقلم',choices:['يقلم','يقرا','يعوم']},
        {text:'من بعد الرياضة، خاصك ___.',answer:'ترتاح',choices:['ترتاح','تتسرع','تقلق']},
        {text:'هاد القصة صعيبة باش ___.',answer:'تصدقها',choices:['تصدقها','تخيطها','تطيّبها']},
        {text:'الشاهد رفض ___.',answer:'يشهد',choices:['يشهد','يعيط','يغني']} ]
  }},
  comprehension:{ title:'افهم السؤال', items:{
    1:[ {text:'شنو الحيوان اللي كيهبب؟',answer:'الكلب',choices:['الكلب','الحوت','الطير']},
        {text:'بواش كناكلو الشوربة؟',answer:'بالمعلقة',choices:['بالمعلقة','بالموس','بالفورشيطة']},
        {text:'فين كنرقدو؟',answer:'فالفراش',choices:['فالفراش','فالطبسيل','فالساك']},
        {text:'شنو اللون ديال الحشيش؟',answer:'أخضر',choices:['أخضر','أحمر','أزرق']},
        {text:'شنو كنشربو ملي نعطشو؟',answer:'الما',choices:['الما','الرمل','الورق']},
        {text:'شنو الحاجة اللي كتضوي بالليل؟',answer:'القنديل',choices:['القنديل','الوسادة','الطبسيل']} ],
    2:[ {text:'شنو الحاجة اللي كتقول ليك الوقت؟',answer:'الساعة',choices:['الساعة','الكتاب','القنديل']},
        {text:'شنو الفصل اللي كيجي من بعد الشتا؟',answer:'الربيع',choices:['الربيع','الصيف','الخريف']},
        {text:'علاش كنستعملو المظلة؟',answer:'باش ما نتبلوش من الشتا',choices:['باش ما نتبلوش من الشتا','باش ناكلو','باش نرقدو']},
        {text:'شنو الخدمة اللي كتداوي الناس المرضى؟',answer:'الطبيب',choices:['الطبيب','الخباز','الصباغ']},
        {text:'شحال من نهار فـ سيمانة؟',answer:'سبعة',choices:['سبعة','خمسة','عشرة']},
        {text:'فين كنشريو الدوا؟',answer:'فالصيدلية',choices:['فالصيدلية','فالبوسطة','فالكراج']} ],
    3:[ {text:'إلا كون كولشي وردة زهرة، واش الوردة زهرة؟',answer:'إيه',choices:['إيه','لا','بعض المرات']},
        {text:'عكس ديال "بسرعة" هو:',answer:'بشوية',choices:['بشوية','بصوت عالي','بفرح']},
        {text:'"الشتا كتصب" كيعني:',answer:'الشتا كبيرة بزاف',choices:['الشتا كبيرة بزاف','الجو صافي','الريح قوية']},
        {text:'بيار طول من بول. شكون الأقصر؟',answer:'بول',choices:['بول','بيار','بجوج']},
        {text:'"قلب الصفحة" كيعني:',answer:'نتقدم لقدام',choices:['نتقدم لقدام','نقرا كتاب','نرتاح']},
        {text:'شنو الكلمة اللي ماشي فاكهة؟',answer:'الجزر',choices:['الجزر','الكرز','الموز']} ]
  }}
};
