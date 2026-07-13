// =====================================================================
//  PARCOURS D'ACCUEIL (première connexion)
//  ---------------------------------------------------------------------
//  1) Questionnaire court sur les symptômes RESSENTIS (auto-évaluation).
//  2) Bilan rapide : quelques items dans chaque domaine pour mesurer
//     objectivement les points forts / faibles.
//  3) Le résultat initialise le profil de l'IA (Learner), qui oriente
//     ensuite les exercices.
//
//  ⚠️ Ce n'est PAS un diagnostic médical. C'est un point de départ pour
//     personnaliser l'entraînement. Un bilan orthophonique réel reste
//     indispensable.
// =====================================================================

// --- Les domaines évalués, reliés aux types d'exercices ---
const ASSESS_DOMAINS = [
  { key:'denomination',  label:"Trouver le nom des objets" },
  { key:'completion',    label:"Compléter des phrases" },
  { key:'comprehension', label:"Comprendre des consignes" }
];
// v6.19 : généralisé à toutes les langues avec un contenu disponible
// (avant : anglais seulement, codé en dur). Le nom de la variable
// ASSESS_DOMAIN_LABELS_XX doit correspondre au code de langue en
// majuscules, comme window.BANK_XX dans js/app.js.
window.ASSESS_DOMAIN_LABELS_EN = {
  denomination:'Finding the names of objects',
  completion:'Completing sentences',
  comprehension:'Understanding instructions'
};
window.ASSESS_DOMAIN_LABELS_ES = {
  denomination:'Encontrar el nombre de los objetos',
  completion:'Completar frases',
  comprehension:'Entender consignas'
};
window.ASSESS_DOMAIN_LABELS_IT = {
  denomination:'Trovare il nome degli oggetti',
  completion:'Completare frasi',
  comprehension:'Capire le consegne'
};
window.ASSESS_DOMAIN_LABELS_PT = {
  denomination:'Encontrar o nome dos objetos',
  completion:'Completar frases',
  comprehension:'Compreender instruções'
};
window.ASSESS_DOMAIN_LABELS_DE = {
  denomination:'Die Namen von Gegenständen finden',
  completion:'Sätze vervollständigen',
  comprehension:'Anweisungen verstehen'
};
window.ASSESS_DOMAIN_LABELS_AR = {
  denomination:'إيجاد أسماء الأشياء',
  completion:'إكمال الجمل',
  comprehension:'فهم التعليمات'
};
window.ASSESS_DOMAIN_LABELS_TR = {
  denomination:'Nesnelerin adını bulma',
  completion:'Cümleleri tamamlama',
  comprehension:'Yönergeleri anlama'
};
window.ASSESS_DOMAIN_LABELS_PL = {
  denomination:'Znajdowanie nazw przedmiotów',
  completion:'Uzupełnianie zdań',
  comprehension:'Rozumienie poleceń'
};
// v6.115 : traduit et relu par une personne kabylophone — voir
// docs/kabyle-symptoms-request.md et docs/kabyle-glossary.md.
window.ASSESS_DOMAIN_LABELS_KAB = {
  denomination:'Af isem n tɣawsiwin',
  completion:'Semmed tifyar',
  comprehension:'Gzu iwellihen'
};
function domainLabel(key){
  const lang=((window.Prefs && Prefs.data.lang) || 'fr').toUpperCase();
  const table = window['ASSESS_DOMAIN_LABELS_'+lang];
  if(table && table[key]) return table[key];
  return (ASSESS_DOMAINS.find(d=>d.key===key)||{}).label || key;
}

// --- Questionnaire symptômes (ressenti, pas de diagnostic) ---
const SYMPTOM_QUESTIONS = [
  { key:'mots',   q:"Vous arrive-t-il de chercher vos mots ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] },
  { key:'compr',  q:"Avez-vous du mal à comprendre ce qu'on vous dit ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] },
  { key:'parole', q:"Votre parole est-elle difficile à articuler ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] },
  { key:'lecture',q:"La lecture vous demande-t-elle beaucoup d'effort ?",
    options:[['Souvent',2],['Parfois',1],['Rarement',0]] }
];
// v6.119 : traduit et relu par une personne kabylophone, en 2 temps
// (questions 1-2 puis 3-4, versions "recommandées" simplifiées pour un
// public aphasique) — voir docs/kabyle-glossary.md. Échelle de réponse
// harmonisée (Aṭas n tikkal / Tikwal / Drus), à ne pas retraduire ailleurs.
window.SYMPTOM_QUESTIONS_KAB = [
  { key:'mots',   q:'Tettafeḍ-d iman-ik tettedduḍ ad tnadiḍ awal?',
    options:[['Aṭas n tikkal',2],['Tikwal',1],['Drus',0]] },
  { key:'compr',  q:'Tegzuḍ s wugur ayen i ak-d-qqaren?',
    options:[['Aṭas n tikkal',2],['Tikwal',1],['Drus',0]] },
  { key:'parole', q:'Yewɛer fell-ak ad tessusruḍ awalen?',
    options:[['Aṭas n tikkal',2],['Tikwal',1],['Drus',0]] },
  { key:'lecture',q:'Taqra tesra fell-ak aṭas n lǧehd?',
    options:[['Aṭas n tikkal',2],['Tikwal',1],['Drus',0]] }
];
// v6.17 : version anglaise, même structure (clés et valeurs identiques,
// pour que le score reste comparable quelle que soit la langue choisie).
window.SYMPTOM_QUESTIONS_EN = [
  { key:'mots',   q:'Do you sometimes struggle to find your words?',
    options:[['Often',2],['Sometimes',1],['Rarely',0]] },
  { key:'compr',  q:'Do you find it hard to understand what people say to you?',
    options:[['Often',2],['Sometimes',1],['Rarely',0]] },
  { key:'parole', q:'Is your speech difficult to articulate?',
    options:[['Often',2],['Sometimes',1],['Rarely',0]] },
  { key:'lecture',q:'Does reading take a lot of effort for you?',
    options:[['Often',2],['Sometimes',1],['Rarely',0]] }
];
// v6.19 : mêmes questions dans les 5 nouvelles langues, mêmes clés/valeurs.
window.SYMPTOM_QUESTIONS_ES = [
  { key:'mots',   q:'¿Te ocurre que te cuesta encontrar tus palabras?',
    options:[['A menudo',2],['A veces',1],['Rara vez',0]] },
  { key:'compr',  q:'¿Te cuesta entender lo que te dicen?',
    options:[['A menudo',2],['A veces',1],['Rara vez',0]] },
  { key:'parole', q:'¿Te resulta difícil articular al hablar?',
    options:[['A menudo',2],['A veces',1],['Rara vez',0]] },
  { key:'lecture',q:'¿Leer te exige mucho esfuerzo?',
    options:[['A menudo',2],['A veces',1],['Rara vez',0]] }
];
window.SYMPTOM_QUESTIONS_IT = [
  { key:'mots',   q:'Ti capita di avere difficoltà a trovare le parole?',
    options:[['Spesso',2],['A volte',1],['Raramente',0]] },
  { key:'compr',  q:'Fai fatica a capire quello che ti dicono?',
    options:[['Spesso',2],['A volte',1],['Raramente',0]] },
  { key:'parole', q:'Hai difficoltà ad articolare le parole?',
    options:[['Spesso',2],['A volte',1],['Raramente',0]] },
  { key:'lecture',q:'Leggere ti richiede molto sforzo?',
    options:[['Spesso',2],['A volte',1],['Raramente',0]] }
];
window.SYMPTOM_QUESTIONS_PT = [
  { key:'mots',   q:'Costuma custar-lhe encontrar as palavras?',
    options:[['Frequentemente',2],['Às vezes',1],['Raramente',0]] },
  { key:'compr',  q:'Tem dificuldade em compreender o que lhe dizem?',
    options:[['Frequentemente',2],['Às vezes',1],['Raramente',0]] },
  { key:'parole', q:'A sua fala é difícil de articular?',
    options:[['Frequentemente',2],['Às vezes',1],['Raramente',0]] },
  { key:'lecture',q:'A leitura exige-lhe muito esforço?',
    options:[['Frequentemente',2],['Às vezes',1],['Raramente',0]] }
];
window.SYMPTOM_QUESTIONS_DE = [
  { key:'mots',   q:'Fällt es Ihnen manchmal schwer, Ihre Worte zu finden?',
    options:[['Oft',2],['Manchmal',1],['Selten',0]] },
  { key:'compr',  q:'Haben Sie Mühe zu verstehen, was man Ihnen sagt?',
    options:[['Oft',2],['Manchmal',1],['Selten',0]] },
  { key:'parole', q:'Ist es für Sie schwierig, deutlich zu sprechen?',
    options:[['Oft',2],['Manchmal',1],['Selten',0]] },
  { key:'lecture',q:'Erfordert Lesen viel Anstrengung für Sie?',
    options:[['Oft',2],['Manchmal',1],['Selten',0]] }
];
window.SYMPTOM_QUESTIONS_AR = [
  { key:'mots',   q:'هل يحدث أن تجد صعوبة في إيجاد كلماتك؟',
    options:[['غالبًا',2],['أحيانًا',1],['نادرًا',0]] },
  { key:'compr',  q:'هل تجد صعوبة في فهم ما يُقال لك؟',
    options:[['غالبًا',2],['أحيانًا',1],['نادرًا',0]] },
  { key:'parole', q:'هل من الصعب عليك نطق الكلام بوضوح؟',
    options:[['غالبًا',2],['أحيانًا',1],['نادرًا',0]] },
  { key:'lecture',q:'هل تتطلب منك القراءة مجهودًا كبيرًا؟',
    options:[['غالبًا',2],['أحيانًا',1],['نادرًا',0]] }
];
window.SYMPTOM_QUESTIONS_TR = [
  { key:'mots',   q:'Kelimelerinizi bulmakta zorlandığınız oluyor mu?',
    options:[['Sık sık',2],['Bazen',1],['Nadiren',0]] },
  { key:'compr',  q:'Size söylenenleri anlamakta zorluk çekiyor musunuz?',
    options:[['Sık sık',2],['Bazen',1],['Nadiren',0]] },
  { key:'parole', q:'Konuşmanızı net bir şekilde ifade etmek zor mu?',
    options:[['Sık sık',2],['Bazen',1],['Nadiren',0]] },
  { key:'lecture',q:'Okumak sizin için çok çaba gerektiriyor mu?',
    options:[['Sık sık',2],['Bazen',1],['Nadiren',0]] }
];
window.SYMPTOM_QUESTIONS_PL = [
  { key:'mots',   q:'Czy zdarza Ci się mieć trudności ze znalezieniem słów?',
    options:[['Często',2],['Czasami',1],['Rzadko',0]] },
  { key:'compr',  q:'Czy masz trudności ze zrozumieniem tego, co się do Ciebie mówi?',
    options:[['Często',2],['Czasami',1],['Rzadko',0]] },
  { key:'parole', q:'Czy trudno Ci jest wyraźnie artykułować mowę?',
    options:[['Często',2],['Czasami',1],['Rzadko',0]] },
  { key:'lecture',q:'Czy czytanie wymaga od Ciebie dużego wysiłku?',
    options:[['Często',2],['Czasami',1],['Rzadko',0]] }
];
function symptomQuestions(){
  const lang=((window.Prefs && Prefs.data.lang) || 'fr').toUpperCase();
  return window['SYMPTOM_QUESTIONS_'+lang] || SYMPTOM_QUESTIONS;
}

// --- Bilan : 3 items rapides par domaine (niveau intermédiaire) ---
const ASSESS_ITEMS = {
  denomination:[
    {emoji:'🐶',answer:'CHIEN',choices:['CHIEN','CHAT','CHEVAL']},
    {emoji:'🚲',answer:'VÉLO',choices:['VÉLO','MOTO','VOITURE']},
    {emoji:'🌧️',answer:'PLUIE',choices:['PLUIE','NEIGE','SOLEIL']}
  ],
  completion:[
    {text:'Je bois mon café dans une ___',answer:'TASSE',choices:['TASSE','CHAISE','PORTE']},
    {text:'La nuit, je vois la ___',answer:'LUNE',choices:['LUNE','TABLE','MAIN']},
    {text:'Pour couper le pain, je prends un ___',answer:'COUTEAU',choices:['COUTEAU','LIVRE','VERRE']}
  ],
  comprehension:[
    {text:'Quel animal vole ?',answer:"L'OISEAU",choices:["L'OISEAU",'LE CHIEN','LE POISSON']},
    {text:'Où range-t-on les livres ?',answer:'SUR UNE ÉTAGÈRE',choices:['SUR UNE ÉTAGÈRE','DANS LE FRIGO','DANS LA BAIGNOIRE']},
    {text:'Que fait-on avec des ciseaux ?',answer:'COUPER',choices:['COUPER','BOIRE','DORMIR']}
  ]
};
// v6.17 : version anglaise des items du bilan, même structure.
window.ASSESS_ITEMS_EN = {
  denomination:[
    {emoji:'🐶',answer:'DOG',choices:['DOG','CAT','HORSE']},
    {emoji:'🚲',answer:'BIKE',choices:['BIKE','MOTORBIKE','CAR']},
    {emoji:'🌧️',answer:'RAIN',choices:['RAIN','SNOW','SUN']}
  ],
  completion:[
    {text:'I drink my coffee in a ___',answer:'CUP',choices:['CUP','CHAIR','DOOR']},
    {text:'At night, I see the ___',answer:'MOON',choices:['MOON','TABLE','HAND']},
    {text:'To cut bread, I use a ___',answer:'KNIFE',choices:['KNIFE','BOOK','GLASS']}
  ],
  comprehension:[
    {text:'Which animal flies?',answer:'THE BIRD',choices:['THE BIRD','THE DOG','THE FISH']},
    {text:'Where do you keep books?',answer:'ON A SHELF',choices:['ON A SHELF','IN THE FRIDGE','IN THE BATH']},
    {text:'What do you use scissors for?',answer:'CUTTING',choices:['CUTTING','DRINKING','SLEEPING']}
  ]
};
// v6.19 : mêmes items dans les 5 nouvelles langues.
window.ASSESS_ITEMS_ES = {
  denomination:[
    {emoji:'🐶',answer:'PERRO',choices:['PERRO','GATO','CABALLO']},
    {emoji:'🚲',answer:'BICI',choices:['BICI','MOTO','COCHE']},
    {emoji:'🌧️',answer:'LLUVIA',choices:['LLUVIA','NIEVE','SOL']}
  ],
  completion:[
    {text:'Bebo mi café en una ___',answer:'TAZA',choices:['TAZA','SILLA','PUERTA']},
    {text:'De noche, veo la ___',answer:'LUNA',choices:['LUNA','MESA','MANO']},
    {text:'Para cortar el pan, uso un ___',answer:'CUCHILLO',choices:['CUCHILLO','LIBRO','VASO']}
  ],
  comprehension:[
    {text:'¿Qué animal vuela?',answer:'EL PÁJARO',choices:['EL PÁJARO','EL PERRO','EL PEZ']},
    {text:'¿Dónde se guardan los libros?',answer:'EN UNA ESTANTERÍA',choices:['EN UNA ESTANTERÍA','EN LA NEVERA','EN LA BAÑERA']},
    {text:'¿Para qué se usan las tijeras?',answer:'CORTAR',choices:['CORTAR','BEBER','DORMIR']}
  ]
};
window.ASSESS_ITEMS_IT = {
  denomination:[
    {emoji:'🐶',answer:'CANE',choices:['CANE','GATTO','CAVALLO']},
    {emoji:'🚲',answer:'BICI',choices:['BICI','MOTO','AUTO']},
    {emoji:'🌧️',answer:'PIOGGIA',choices:['PIOGGIA','NEVE','SOLE']}
  ],
  completion:[
    {text:'Bevo il caffè in una ___',answer:'TAZZA',choices:['TAZZA','SEDIA','PORTA']},
    {text:'Di notte, vedo la ___',answer:'LUNA',choices:['LUNA','TAVOLO','MANO']},
    {text:'Per tagliare il pane, uso un ___',answer:'COLTELLO',choices:['COLTELLO','LIBRO','BICCHIERE']}
  ],
  comprehension:[
    {text:'Quale animale vola?',answer:"L'UCCELLO",choices:["L'UCCELLO",'IL CANE','IL PESCE']},
    {text:'Dove si tengono i libri?',answer:'SU UNO SCAFFALE',choices:['SU UNO SCAFFALE','NEL FRIGO','NELLA VASCA']},
    {text:'A cosa servono le forbici?',answer:'TAGLIARE',choices:['TAGLIARE','BERE','DORMIRE']}
  ]
};
window.ASSESS_ITEMS_PT = {
  denomination:[
    {emoji:'🐶',answer:'CÃO',choices:['CÃO','GATO','CAVALO']},
    {emoji:'🚲',answer:'BICICLETA',choices:['BICICLETA','MOTA','CARRO']},
    {emoji:'🌧️',answer:'CHUVA',choices:['CHUVA','NEVE','SOL']}
  ],
  completion:[
    {text:'Bebo o meu café numa ___',answer:'CHÁVENA',choices:['CHÁVENA','CADEIRA','PORTA']},
    {text:'À noite, vejo a ___',answer:'LUA',choices:['LUA','MESA','MÃO']},
    {text:'Para cortar o pão, uso uma ___',answer:'FACA',choices:['FACA','LIVRO','COPO']}
  ],
  comprehension:[
    {text:'Que animal voa?',answer:'O PÁSSARO',choices:['O PÁSSARO','O CÃO','O PEIXE']},
    {text:'Onde se guardam os livros?',answer:'NUMA ESTANTE',choices:['NUMA ESTANTE','NO FRIGORÍFICO','NA BANHEIRA']},
    {text:'Para que serve a tesoura?',answer:'CORTAR',choices:['CORTAR','BEBER','DORMIR']}
  ]
};
window.ASSESS_ITEMS_DE = {
  denomination:[
    {emoji:'🐶',answer:'HUND',choices:['HUND','KATZE','PFERD']},
    {emoji:'🚲',answer:'FAHRRAD',choices:['FAHRRAD','MOTORRAD','AUTO']},
    {emoji:'🌧️',answer:'REGEN',choices:['REGEN','SCHNEE','SONNE']}
  ],
  completion:[
    {text:'Ich trinke meinen Kaffee aus einer ___',answer:'TASSE',choices:['TASSE','STUHL','TÜR']},
    {text:'Nachts sehe ich den ___',answer:'MOND',choices:['MOND','TISCH','HAND']},
    {text:'Zum Brotschneiden benutze ich ein ___',answer:'MESSER',choices:['MESSER','BUCH','GLAS']}
  ],
  comprehension:[
    {text:'Welches Tier fliegt?',answer:'DER VOGEL',choices:['DER VOGEL','DER HUND','DER FISCH']},
    {text:'Wo bewahrt man Bücher auf?',answer:'IN EINEM REGAL',choices:['IN EINEM REGAL','IM KÜHLSCHRANK','IN DER BADEWANNE']},
    {text:'Wofür benutzt man eine Schere?',answer:'SCHNEIDEN',choices:['SCHNEIDEN','TRINKEN','SCHLAFEN']}
  ]
};
window.ASSESS_ITEMS_AR = {
  denomination:[
    {emoji:'🐶',answer:'كلب',choices:['كلب','قطة','حصان']},
    {emoji:'🚲',answer:'دراجة',choices:['دراجة','دراجة نارية','سيارة']},
    {emoji:'🌧️',answer:'مطر',choices:['مطر','ثلج','شمس']}
  ],
  completion:[
    {text:'أشرب قهوتي في ___',answer:'كوب',choices:['كوب','كرسي','باب']},
    {text:'ليلًا، أرى ___',answer:'القمر',choices:['القمر','الطاولة','اليد']},
    {text:'لقطع الخبز، أستخدم ___',answer:'سكين',choices:['سكين','كتاب','كوب زجاجي']}
  ],
  comprehension:[
    {text:'أي حيوان يطير؟',answer:'الطائر',choices:['الطائر','الكلب','السمكة']},
    {text:'أين تُحفظ الكتب؟',answer:'على رف',choices:['على رف','في الثلاجة','في حوض الاستحمام']},
    {text:'لماذا نستخدم المقص؟',answer:'القص',choices:['القص','الشرب','النوم']}
  ]
};
window.ASSESS_ITEMS_TR = {
  denomination:[
    {emoji:'🐶',answer:'KÖPEK',choices:['KÖPEK','KEDİ','AT']},
    {emoji:'🚲',answer:'BİSİKLET',choices:['BİSİKLET','MOTOSİKLET','ARABA']},
    {emoji:'🌧️',answer:'YAĞMUR',choices:['YAĞMUR','KAR','GÜNEŞ']}
  ],
  completion:[
    {text:'Kahvemi bir ___ içinde içerim',answer:'FİNCAN',choices:['FİNCAN','SANDALYE','KAPI']},
    {text:'Geceleyin ___ görürüm',answer:'AYI',choices:['AYI','MASAYI','ELİ']},
    {text:'Ekmeği kesmek için bir ___ kullanırım',answer:'BIÇAK',choices:['BIÇAK','KİTAP','BARDAK']}
  ],
  comprehension:[
    {text:'Hangi hayvan uçar?',answer:'KUŞ',choices:['KUŞ','KÖPEK','BALIK']},
    {text:'Kitaplar nerede saklanır?',answer:'RAFTA',choices:['RAFTA','BUZDOLABINDA','KÜVETTE']},
    {text:'Makas ne için kullanılır?',answer:'KESMEK',choices:['KESMEK','İÇMEK','UYUMAK']}
  ]
};
window.ASSESS_ITEMS_PL = {
  denomination:[
    {emoji:'🐶',answer:'PIES',choices:['PIES','KOT','KOŃ']},
    {emoji:'🚲',answer:'ROWER',choices:['ROWER','MOTOCYKL','SAMOCHÓD']},
    {emoji:'🌧️',answer:'DESZCZ',choices:['DESZCZ','ŚNIEG','SŁOŃCE']}
  ],
  completion:[
    {text:'Piję kawę z ___',answer:'FILIŻANKI',choices:['FILIŻANKI','KRZESŁA','DRZWI']},
    {text:'W nocy widzę ___',answer:'KSIĘŻYC',choices:['KSIĘŻYC','STÓŁ','RĘKĘ']},
    {text:'Do krojenia chleba używam ___',answer:'NOŻA',choices:['NOŻA','KSIĄŻKI','SZKLANKI']}
  ],
  comprehension:[
    {text:'Które zwierzę lata?',answer:'PTAK',choices:['PTAK','PIES','RYBA']},
    {text:'Gdzie przechowuje się książki?',answer:'NA PÓŁCE',choices:['NA PÓŁCE','W LODÓWCE','W WANNIE']},
    {text:'Do czego służą nożyczki?',answer:'DO CIĘCIA',choices:['DO CIĘCIA','DO PICIA','DO SPANIA']}
  ]
};
function assessItems(domainKey){
  const lang=((window.Prefs && Prefs.data.lang) || 'fr').toUpperCase();
  const table = window['ASSESS_ITEMS_'+lang];
  return (table && table[domainKey]) ? table[domainKey] : ASSESS_ITEMS[domainKey];
}

// =====================================================================
//  TRADUCTION KABYLE DU BILAN INITIAL — désormais quasi complète
//  ---------------------------------------------------------------------
//  Même principe de prudence que js/exercises-kab.js : les mots isolés
//  (dénomination) comme les phrases complètes (complétion,
//  compréhension) sont désormais traduits ET relus par une personne
//  kabylophone (v6.115-v6.119) — plus une improvisation de ma part,
//  contrairement à ce que suggère encore le titre historique de cette
//  section. Reste en français : l'écran de dépôt/lecture de bilan
//  externe (PDF/texte), ~9 clés secondaires — voir ASSESS_STRINGS.kab.
// =====================================================================
const ASSESS_ITEMS_KAB = {
  denomination:[
    // aqjun = chien / amcic = chat / agmar = cheval : tous confirmés par
    // relecture native (v6.113 et v6.116, docs/kabyle-glossary.md).
    // v6.121 : distracteur "AƐEWDIW" (non vérifié) remplacé par "AGMAR"
    // (confirmé et tranché).
    {emoji:'🐶',answer:'AQJUN',choices:['AQJUN','AMCIC','AGMAR']},
    // avilu = vélo / takeṛṛust = voiture / tamuturt = moto : tous
    // confirmés et tranchés (v6.116, docs/kabyle-glossary.md) — Avilu et
    // Takeṛṛust préférés à Tafradit/Ttamubil pour la même raison de
    // cohérence terminologique.
    // v6.121 : distracteur "AƐEWDIW" (placeholder faute de mot pour
    // "moto") remplacé par "TAMUTURT", maintenant confirmé.
    {emoji:'🚲',answer:'AVILU',choices:['AVILU','TAKEṚṚUST','TAMUTURT']},
    // ageffur = pluie (confirmé Glosbe) / adfel = neige (confirmé Glosbe) / tafukt = soleil (confirmé, et reconfirmé par relecture native v6.115)
    {emoji:'🌧️',answer:'AGEFFUR',choices:['AGEFFUR','ADFEL','TAFUKT']}
  ],
  // v6.119 : complétion traduite et relue par une personne kabylophone
  // (3/3 phrases reçues, sur plusieurs envois) — voir docs/kabyle-glossary.md.
  completion:[
    {text:'Sseweɣ lqahwa-w deg ___.',answer:'TASEKKURT',choices:['TASEKKURT','TAKERSI','TAWWURT']},
    {text:'Deg yiḍ, waliɣ ___.',answer:'AGGUR',choices:['AGGUR','ṬṬABLA','AFUS']},
    {text:'I wakken ad gzemɣ aɣrum, ad awiɣ ___.',answer:'AJENWI',choices:['AJENWI','ADLIS','TAQESSAST']}
  ],
  // v6.115 : compréhension traduite et relue par une personne kabylophone
  // (3/3 phrases reçues) — voir docs/kabyle-glossary.md.
  comprehension:[
    {text:'Anwa aɣersiw i yeffergen?',answer:'AFRUX',choices:['AFRUX','ASLEM','AQJUN']},
    {text:'Anida i nesseqdac i wakken ad nerr idlisen?',answer:'ƔEF TSEDDART',choices:['ƔEF TSEDDART','DEG USEXXAN N USEMMIḌ','DEG TEBBUṬ N USIRED']},
    {text:'D acu i nesseqdac s lmeqweṣ?',answer:'GZEM',choices:['GZEM','GGEN','SEW']}
  ]
};

// Textes d'interface du bilan (français / kabyle). Les questions de
// ressenti et les phrases de complétion/compréhension restent en
// français dans les deux langues (voir note ci-dessus).
const ASSESS_STRINGS = {
  fr:{
    welcome:'Bienvenue', welcome_p1:"Avant de commencer, prenons un instant pour mieux vous connaître. Cela nous aidera à choisir les exercices les plus utiles pour vous.",
    welcome_p2:"Il y a quelques étapes courtes. Il n'y a pas de bonne ou mauvaise façon de répondre.",
    not_diagnosis:"ℹ️ Ce test n'est pas un diagnostic médical. Il sert uniquement à personnaliser votre entraînement.",
    start:'Commencer', ready:'Je suis prêt·e',
    small_test:'Petit test', small_test_p:"Quelques questions simples pour repérer ensemble vos points forts et ce qu'on peut travailler. Prenez votre temps.",
    partial_kab_note:"ℹ️ Certaines questions de ce bilan restent en français pour l'instant (voir « à propos » pour le détail).",
    import_title:'Avez-vous un bilan ?',
    import_p1:"Si vous avez un compte-rendu (orthophonique, médical…), vous pouvez le déposer. L'application l'affichera pour vous aider à repérer les points à travailler, puis l'effacera aussitôt.",
    import_note:"🔒 Votre fichier reste sur votre appareil. Il n'est ni envoyé, ni enregistré. Il est effacé dès que vous quittez cette étape.",
    import_upload:'📎 Cliquez pour choisir un fichier (PDF ou texte)',
    skip_step:'Passer cette étape →',
    symptoms_note:"ℹ️ Ces questions restent en français pour l'instant.",
    result_title:'Votre point de départ', result_thanks:"Merci ! Voici ce que j'ai compris pour bien démarrer :",
    priority_label:'À travailler en priorité', level_label:'Niveau de départ conseillé',
    result_disclaimer:"ℹ️ Ceci personnalise votre entraînement, mais ne remplace pas un bilan orthophonique.",
    begin_exercises:'Commencer mes exercices',
    imported_from_bilan:"D'après votre bilan",
    feelings_title:'Vos ressentis',
    listen_btn:'🔊 Écouter', listen_question:'🔊 Écouter la question', listen_beginning:'🔊 Écouter le début',
    complete_choices_btn:'Valider mes choix et continuer',
    next_btn:'Suivant →',
    reading_in_progress:'Lecture en cours…',
    read_file_failed:"Je n'ai pas réussi à lire ce fichier (il est peut-être scanné en image). Vous pouvez cocher manuellement vos points à travailler ci-dessous.",
    content_read_label:'Contenu lu (non enregistré) :',
    priority_from_report:'D\'après ce bilan, que souhaitez-vous travailler en priorité ?',
    text_will_be_erased:'Ce texte sera effacé quand vous continuerez. Seuls vos choix cochés seront conservés.',
    level_adjust_note:"Il s'ajustera automatiquement selon vos progrès.",
    priority_detail:(rWeak)=>`(${rWeak} au test). Je vous proposerai cet entraînement en premier.`,
    imported_priorities_detail:(list)=>`Vous avez indiqué vouloir travailler : ${list}. J'en tiens compte en priorité.`
  },
  kab:{
    welcome:'Ansuf', welcome_p1:"Send ad nebdu, a nefk kra n wakud akken a k-nissin ugar. Ayagi ad aɣ-yeɛawen a nefren isuraf ilhan i kečč.",
    welcome_p2:"Llan kra n yiwenniten iwezlanen. Ulac tiririt tameqqrant neɣ tadeffirt.",
    not_diagnosis:"ℹ️ Ahil-agi mačči d asenqed uzeddig. Ipseqdac kan akken ad nsezgi aselmed-ik.",
    // v6.113 : ready et skip_step mis à jour avec les formulations
    // recommandées par la relecture native (verbes courts et directs,
    // plus naturels pour un bouton que les formes précédentes) — voir
    // docs/kabyle-symptoms-request.md pour le retour complet.
    start:'Bdu', ready:'Bduɣ',
    small_test:'Aqerru amecṭuḥ', small_test_p:"Ad ak-nseqsi kra n yisteqsiyen ifessasen iwakken ad nẓer ayen i tzemreḍ akked ayen i yessefk ad tesnerniḍ. Err lwelha-k.",
    partial_kab_note:"ℹ️ Kra n yisteqsiyen n ubeddel-agi mazal-iten s tefransist alamma tura.",
    // v6.113 : traduit et relu par une personne kabylophone — l'écran
    // "Avez-vous un bilan ?" n'est donc plus laissé en français pour le
    // kabyle (voir historique dans le commentaire ci-dessous et dans
    // docs/kabyle-symptoms-request.md).
    import_title:'Tesɛiḍ anezgum?',
    import_p1:"Ma tesɛiḍ anezgum (n umeslay n tutlayt, asedyan...), tzemreḍ ad t-id-tazneḍ. Asnas ad t-id-yesken iwakken ad ak-iɛin ad tafeḍ ayen i yessefk ad teslemded, sakin ad t-yesfesx s tikkelt-nni.",
    import_note:"🔒 Afaylu-ik ad yeqqim kan deg yibenk-ik. Ur yettwazen ara, ur yettwasekles ara. Ad yettwakkes mi ara teffɣeḍ seg umecwar-agi.",
    import_upload:'📎 Sit iwakken ad tferneḍ afaylu (PDF neɣ aḍris).',
    skip_step:'Zgel amecwar-agi →',
    symptoms_note:"ℹ️ Isteqsiyen-agi mazal-iten s tefransist alamma tura.",
    // v6.113 : titre + bouton "écouter" du bilan de ressentis, mis à jour
    // avec la formulation simplifiée recommandée pour un public aphasique
    // (phrases courtes, formes naturelles à l'oral) — voir
    // docs/kabyle-symptoms-request.md.
    feelings_title:'Amek i tḥusseḍ?',
    listen_question:'🔊 Ssel i usteqsi',
    listen_btn:'🔊 Ssel',
    // v6.115 : écran "Votre point de départ" (fin du bilan), traduit et
    // relu par une personne kabylophone — versions "recommandées"
    // (simplifiées pour un public aphasique) préférées quand les deux
    // étaient données. Voir docs/kabyle-glossary.md.
    result_title:'Anida ara tebduḍ',
    result_thanks:'Tanemmirt! Aya d ayen gziɣ fell-ak.',
    priority_label:'Ayen ara teslemded d amezwaru',
    priority_detail:(rWeak)=>`(${rWeak} deg ukayad). D aya ara tebduḍ yis.`,
    level_label:'Aswir n tazwara',
    level_adjust_note:"Ad yemhaz s yiman-is ilmend n usfari-ik.",
    result_disclaimer:"Aya yettunezzem aselmed-ik, maca ur yettakk ara amkan n unezgum n umeslay n tutlayt.",
    begin_exercises:'Bdu isemdanen-iw',
    next_btn:'Uḍfir →',
  },
  en:{
    welcome:'Welcome', welcome_p1:"Before we start, let's take a moment to get to know you a little. This will help us choose the most useful exercises for you.",
    welcome_p2:"There are a few short steps. There's no right or wrong way to answer.",
    not_diagnosis:"ℹ️ This test is not a medical diagnosis. It's only used to personalise your training.",
    start:'Start', ready:"I'm ready",
    small_test:'Quick test', small_test_p:"A few simple questions to spot your strengths and what we can work on together. Take your time.",
    import_title:'Do you have a report?',
    import_p1:"If you have a report (speech therapy, medical...), you can upload it. The app will display it to help you spot the points to work on, then erase it right away.",
    import_note:"🔒 Your file stays on your device. It is never sent or saved. It is erased as soon as you leave this step.",
    import_upload:'📎 Click to choose a file (PDF or text)',
    skip_step:'Skip this step →',
    result_title:'Your starting point', result_thanks:"Thank you! Here's what I understood to get started:",
    priority_label:'To work on as a priority', level_label:'Suggested starting level',
    result_disclaimer:"ℹ️ This personalises your training, but doesn't replace a real speech therapy assessment.",
    begin_exercises:'Start my exercises',
    imported_from_bilan:'Based on your report',
    feelings_title:'How you feel',
    listen_btn:'🔊 Listen', listen_question:'🔊 Listen to the question', listen_beginning:'🔊 Listen to the start',
    complete_choices_btn:'Confirm my choices and continue',
    next_btn:'Next →',
    reading_in_progress:'Reading in progress…',
    read_file_failed:"I couldn't read this file (it might be a scanned image). You can manually check the points to work on below.",
    content_read_label:'Content read (not saved):',
    priority_from_report:'Based on this report, what would you like to work on as a priority?',
    text_will_be_erased:'This text will be erased when you continue. Only your checked choices will be kept.',
    level_adjust_note:'It will adjust automatically as you progress.',
    priority_detail:(rWeak)=>`(${rWeak} on the test). I'll suggest this exercise first.`,
    imported_priorities_detail:(list)=>`You indicated you'd like to work on: ${list}. I'll take this into account as a priority.`
  },
  es:{
    welcome:'Bienvenido/a', welcome_p1:'Antes de empezar, tomemos un momento para conocerte mejor. Esto nos ayudará a elegir los ejercicios más útiles para ti.',
    welcome_p2:'Hay algunos pasos cortos. No hay una forma correcta o incorrecta de responder.',
    not_diagnosis:'ℹ️ Esta prueba no es un diagnóstico médico. Solo sirve para personalizar tu entrenamiento.',
    start:'Empezar', ready:'Estoy list·o',
    small_test:'Pequeña prueba', small_test_p:'Algunas preguntas sencillas para detectar juntos tus puntos fuertes y lo que podemos trabajar. Tómate tu tiempo.',
    import_title:'¿Tienes un informe?',
    import_p1:'Si tienes un informe (logopédico, médico...), puedes subirlo. La aplicación lo mostrará para ayudarte a identificar los puntos a trabajar, y luego lo borrará enseguida.',
    import_note:'🔒 Tu archivo permanece en tu dispositivo. Nunca se envía ni se guarda. Se borra en cuanto sales de este paso.',
    import_upload:'📎 Haz clic para elegir un archivo (PDF o texto)',
    skip_step:'Saltar este paso →',
    result_title:'Tu punto de partida', result_thanks:'¡Gracias! Esto es lo que he entendido para empezar:',
    priority_label:'A trabajar como prioridad', level_label:'Nivel de inicio sugerido',
    result_disclaimer:'ℹ️ Esto personaliza tu entrenamiento, pero no sustituye una evaluación logopédica real.',
    begin_exercises:'Empezar mis ejercicios',
    imported_from_bilan:'Según tu informe',
    feelings_title:'Cómo te sientes',
    listen_btn:'🔊 Escuchar', listen_question:'🔊 Escuchar la pregunta', listen_beginning:'🔊 Escuchar el inicio',
    complete_choices_btn:'Confirmar mis elecciones y continuar',
    next_btn:'Siguiente →',
    reading_in_progress:'Leyendo…',
    read_file_failed:'No he podido leer este archivo (quizás es una imagen escaneada). Puedes marcar manualmente los puntos a trabajar abajo.',
    content_read_label:'Contenido leído (no guardado):',
    priority_from_report:'Según este informe, ¿qué te gustaría trabajar como prioridad?',
    text_will_be_erased:'Este texto se borrará cuando continúes. Solo se conservarán tus opciones marcadas.',
    level_adjust_note:'Se ajustará automáticamente a medida que progreses.',
    priority_detail:(rWeak)=>`(${rWeak} en la prueba). Te propondré este ejercicio primero.`,
    imported_priorities_detail:(list)=>`Has indicado que quieres trabajar: ${list}. Lo tendré en cuenta como prioridad.`
  },
  it:{
    welcome:'Benvenuto/a', welcome_p1:"Prima di iniziare, prendiamoci un momento per conoscerti meglio. Questo ci aiuterà a scegliere gli esercizi più utili per te.",
    welcome_p2:'Ci sono alcuni brevi passaggi. Non c\'è un modo giusto o sbagliato di rispondere.',
    not_diagnosis:'ℹ️ Questo test non è una diagnosi medica. Serve solo a personalizzare il tuo allenamento.',
    start:'Inizia', ready:'Sono pront·o',
    small_test:'Piccolo test', small_test_p:'Alcune domande semplici per individuare insieme i tuoi punti di forza e cosa possiamo lavorare. Prenditi il tuo tempo.',
    import_title:'Hai una relazione?',
    import_p1:'Se hai una relazione (logopedica, medica...), puoi caricarla. L\'app la mostrerà per aiutarti a individuare i punti su cui lavorare, poi la cancellerà subito.',
    import_note:'🔒 Il tuo file resta sul tuo dispositivo. Non viene mai inviato né salvato. Viene cancellato non appena esci da questo passaggio.',
    import_upload:'📎 Clicca per scegliere un file (PDF o testo)',
    skip_step:'Salta questo passaggio →',
    result_title:'Il tuo punto di partenza', result_thanks:'Grazie! Ecco cosa ho capito per iniziare:',
    priority_label:'Da lavorare come priorità', level_label:'Livello di partenza consigliato',
    result_disclaimer:'ℹ️ Questo personalizza il tuo allenamento, ma non sostituisce una vera valutazione logopedica.',
    begin_exercises:'Inizia i miei esercizi',
    imported_from_bilan:'In base alla tua relazione',
    feelings_title:'Come ti senti',
    listen_btn:'🔊 Ascolta', listen_question:'🔊 Ascolta la domanda', listen_beginning:"🔊 Ascolta l'inizio",
    complete_choices_btn:'Conferma le mie scelte e continua',
    next_btn:'Avanti →',
    reading_in_progress:'Lettura in corso…',
    read_file_failed:'Non sono riuscito a leggere questo file (potrebbe essere un\'immagine scansionata). Puoi selezionare manualmente i punti da lavorare qui sotto.',
    content_read_label:'Contenuto letto (non salvato):',
    priority_from_report:'In base a questa relazione, cosa vorresti lavorare come priorità?',
    text_will_be_erased:'Questo testo verrà cancellato quando continuerai. Verranno conservate solo le tue scelte selezionate.',
    level_adjust_note:'Si adatterà automaticamente man mano che progredisci.',
    priority_detail:(rWeak)=>`(${rWeak} al test). Ti proporrò questo esercizio per primo.`,
    imported_priorities_detail:(list)=>`Hai indicato di voler lavorare su: ${list}. Ne terrò conto come priorità.`
  },
  pt:{
    welcome:'Bem-vindo/a', welcome_p1:'Antes de começar, vamos dedicar um momento a conhecê-lo melhor. Isto vai ajudar-nos a escolher os exercícios mais úteis para si.',
    welcome_p2:'Há algumas etapas curtas. Não há uma forma certa ou errada de responder.',
    not_diagnosis:'ℹ️ Este teste não é um diagnóstico médico. Serve apenas para personalizar o seu treino.',
    start:'Começar', ready:'Estou pront·o',
    small_test:'Pequeno teste', small_test_p:'Algumas perguntas simples para identificarmos juntos os seus pontos fortes e o que podemos trabalhar. Leve o seu tempo.',
    import_title:'Tem um relatório?',
    import_p1:'Se tiver um relatório (de terapia da fala, médico...), pode carregá-lo. A aplicação vai mostrá-lo para o ajudar a identificar os pontos a trabalhar, e depois apagá-lo de imediato.',
    import_note:'🔒 O seu ficheiro fica no seu dispositivo. Nunca é enviado nem guardado. É apagado assim que sair desta etapa.',
    import_upload:'📎 Clique para escolher um ficheiro (PDF ou texto)',
    skip_step:'Saltar esta etapa →',
    result_title:'O seu ponto de partida', result_thanks:'Obrigado! Aqui está o que percebi para começar:',
    priority_label:'A trabalhar em prioridade', level_label:'Nível inicial sugerido',
    result_disclaimer:'ℹ️ Isto personaliza o seu treino, mas não substitui uma avaliação real de terapia da fala.',
    begin_exercises:'Começar os meus exercícios',
    imported_from_bilan:'Com base no seu relatório',
    feelings_title:'Como se sente',
    listen_btn:'🔊 Ouvir', listen_question:'🔊 Ouvir a pergunta', listen_beginning:'🔊 Ouvir o início',
    complete_choices_btn:'Confirmar as minhas escolhas e continuar',
    next_btn:'Seguinte →',
    reading_in_progress:'A ler…',
    read_file_failed:'Não consegui ler este ficheiro (pode ser uma imagem digitalizada). Pode assinalar manualmente os pontos a trabalhar abaixo.',
    content_read_label:'Conteúdo lido (não guardado):',
    priority_from_report:'Com base neste relatório, o que gostaria de trabalhar em prioridade?',
    text_will_be_erased:'Este texto será apagado quando continuar. Apenas as suas escolhas assinaladas serão mantidas.',
    level_adjust_note:'Vai ajustar-se automaticamente à medida que progride.',
    priority_detail:(rWeak)=>`(${rWeak} no teste). Vou sugerir este exercício primeiro.`,
    imported_priorities_detail:(list)=>`Indicou que gostaria de trabalhar: ${list}. Vou ter isso em conta como prioridade.`
  },
  de:{
    welcome:'Willkommen', welcome_p1:'Bevor wir beginnen, nehmen wir uns einen Moment Zeit, Sie ein wenig kennenzulernen. Das hilft uns, die nützlichsten Übungen für Sie auszuwählen.',
    welcome_p2:'Es gibt ein paar kurze Schritte. Es gibt keine richtige oder falsche Art zu antworten.',
    not_diagnosis:'ℹ️ Dieser Test ist keine medizinische Diagnose. Er dient nur dazu, Ihr Training zu personalisieren.',
    start:'Starten', ready:'Ich bin bereit',
    small_test:'Kurzer Test', small_test_p:'Ein paar einfache Fragen, um gemeinsam Ihre Stärken und Ansatzpunkte zu finden. Lassen Sie sich Zeit.',
    import_title:'Haben Sie einen Bericht?',
    import_p1:'Wenn Sie einen Bericht haben (logopädisch, medizinisch...), können Sie ihn hochladen. Die App zeigt ihn an, um Ihnen zu helfen, die zu bearbeitenden Punkte zu erkennen, und löscht ihn dann sofort.',
    import_note:'🔒 Ihre Datei bleibt auf Ihrem Gerät. Sie wird niemals gesendet oder gespeichert. Sie wird gelöscht, sobald Sie diesen Schritt verlassen.',
    import_upload:'📎 Klicken Sie, um eine Datei auszuwählen (PDF oder Text)',
    skip_step:'Diesen Schritt überspringen →',
    result_title:'Ihr Ausgangspunkt', result_thanks:'Danke! Das habe ich verstanden, um zu starten:',
    priority_label:'Vorrangig zu bearbeiten', level_label:'Empfohlenes Startniveau',
    result_disclaimer:'ℹ️ Dies personalisiert Ihr Training, ersetzt aber keine echte logopädische Untersuchung.',
    begin_exercises:'Meine Übungen beginnen',
    imported_from_bilan:'Basierend auf Ihrem Bericht',
    feelings_title:'Wie Sie sich fühlen',
    listen_btn:'🔊 Anhören', listen_question:'🔊 Frage anhören', listen_beginning:'🔊 Anfang anhören',
    complete_choices_btn:'Meine Auswahl bestätigen und fortfahren',
    next_btn:'Weiter →',
    reading_in_progress:'Lese gerade…',
    read_file_failed:'Ich konnte diese Datei nicht lesen (es könnte ein gescanntes Bild sein). Sie können unten manuell die zu bearbeitenden Punkte ankreuzen.',
    content_read_label:'Gelesener Inhalt (nicht gespeichert):',
    priority_from_report:'Was möchten Sie basierend auf diesem Bericht vorrangig bearbeiten?',
    text_will_be_erased:'Dieser Text wird gelöscht, wenn Sie fortfahren. Nur Ihre angekreuzten Auswahlen werden behalten.',
    level_adjust_note:'Es passt sich automatisch an, während Sie Fortschritte machen.',
    priority_detail:(rWeak)=>`(${rWeak} im Test). Ich schlage Ihnen diese Übung zuerst vor.`,
    imported_priorities_detail:(list)=>`Sie haben angegeben, dass Sie an Folgendem arbeiten möchten: ${list}. Ich werde dies vorrangig berücksichtigen.`
  },
  ar:{
    welcome:'مرحبًا', welcome_p1:'قبل أن نبدأ، لنأخذ لحظة للتعرف عليك أكثر. سيساعدنا هذا على اختيار التمارين الأكثر فائدة لك.',
    welcome_p2:'هناك بضع خطوات قصيرة. لا توجد طريقة صحيحة أو خاطئة للإجابة.',
    not_diagnosis:'ℹ️ هذا الاختبار ليس تشخيصًا طبيًا. يُستخدم فقط لتخصيص تدريبك.',
    start:'بدء', ready:'أنا مستعد',
    small_test:'اختبار قصير', small_test_p:'بضعة أسئلة بسيطة لتحديد نقاط قوتك وما يمكننا العمل عليه معًا. خذ وقتك.',
    import_title:'هل لديك تقرير؟',
    import_p1:'إذا كان لديك تقرير (تخاطب، طبي...)، يمكنك تحميله. سيعرضه التطبيق لمساعدتك على تحديد النقاط التي يجب العمل عليها، ثم يحذفه فورًا.',
    import_note:'🔒 يبقى ملفك على جهازك. لا يُرسل أو يُحفظ أبدًا. يُحذف بمجرد مغادرتك لهذه الخطوة.',
    import_upload:'📎 انقر لاختيار ملف (PDF أو نص)',
    skip_step:'تخطي هذه الخطوة ←',
    result_title:'نقطة انطلاقك', result_thanks:'شكرًا! إليك ما فهمته للبدء:',
    priority_label:'للعمل عليه كأولوية', level_label:'المستوى المقترح للبدء',
    result_disclaimer:'ℹ️ هذا يخصص تدريبك، لكنه لا يحل محل تقييم حقيقي من أخصائي تخاطب.',
    begin_exercises:'بدء تمارينـي',
    imported_from_bilan:'بناءً على تقريرك',
    feelings_title:'كيف تشعر',
    listen_btn:'🔊 استماع', listen_question:'🔊 الاستماع إلى السؤال', listen_beginning:'🔊 الاستماع إلى البداية',
    complete_choices_btn:'تأكيد اختياراتي والمتابعة',
    next_btn:'التالي ←',
    reading_in_progress:'جارٍ القراءة…',
    read_file_failed:'لم أتمكن من قراءة هذا الملف (قد يكون صورة ممسوحة ضوئيًا). يمكنك تحديد النقاط التي تريد العمل عليها يدويًا أدناه.',
    content_read_label:'المحتوى المقروء (غير محفوظ):',
    priority_from_report:'بناءً على هذا التقرير، ماذا تود العمل عليه كأولوية؟',
    text_will_be_erased:'سيتم حذف هذا النص عند المتابعة. سيتم الاحتفاظ فقط باختياراتك المحددة.',
    level_adjust_note:'سيتكيف تلقائيًا مع تقدمك.',
    priority_detail:(rWeak)=>`(${rWeak} في الاختبار). سأقترح عليك هذا التمرين أولاً.`,
    imported_priorities_detail:(list)=>`لقد أشرت إلى رغبتك في العمل على: ${list}. سآخذ ذلك بعين الاعتبار كأولوية.`
  },
  tr:{
    welcome:'Hoş geldiniz', welcome_p1:'Başlamadan önce, sizi biraz daha iyi tanımak için bir an ayıralım. Bu, sizin için en yararlı alıştırmaları seçmemize yardımcı olacak.',
    welcome_p2:'Birkaç kısa adım var. Cevap vermenin doğru veya yanlış bir yolu yok.',
    not_diagnosis:'ℹ️ Bu test tıbbi bir tanı değildir. Yalnızca eğitiminizi kişiselleştirmek için kullanılır.',
    start:'Başla', ready:'Hazırım',
    small_test:'Kısa test', small_test_p:'Güçlü yönlerinizi ve birlikte üzerinde çalışabileceğimiz noktaları belirlemek için birkaç basit soru. Acele etmeyin.',
    import_title:'Bir raporunuz var mı?',
    import_p1:'Bir raporunuz (dil terapisi, tıbbi...) varsa, yükleyebilirsiniz. Uygulama, üzerinde çalışılacak noktaları belirlemenize yardımcı olmak için onu gösterecek, sonra hemen silecektir.',
    import_note:'🔒 Dosyanız cihazınızda kalır. Asla gönderilmez veya kaydedilmez. Bu adımdan ayrılır ayrılmaz silinir.',
    import_upload:'📎 Bir dosya seçmek için tıklayın (PDF veya metin)',
    skip_step:'Bu adımı atla →',
    result_title:'Başlangıç noktanız', result_thanks:'Teşekkürler! Başlamak için anladıklarım şunlar:',
    priority_label:'Öncelikli olarak üzerinde çalışılacak', level_label:'Önerilen başlangıç seviyesi',
    result_disclaimer:'ℹ️ Bu, eğitiminizi kişiselleştirir, ancak gerçek bir dil terapisi değerlendirmesinin yerini tutmaz.',
    begin_exercises:'Alıştırmalarıma başla',
    imported_from_bilan:'Raporunuza göre',
    feelings_title:'Nasıl hissediyorsunuz',
    listen_btn:'🔊 Dinle', listen_question:'🔊 Soruyu dinle', listen_beginning:'🔊 Başlangıcı dinle',
    complete_choices_btn:'Seçimlerimi onayla ve devam et',
    next_btn:'İleri →',
    reading_in_progress:'Okunuyor…',
    read_file_failed:'Bu dosyayı okuyamadım (taranmış bir görüntü olabilir). Aşağıdan üzerinde çalışılacak noktaları elle işaretleyebilirsiniz.',
    content_read_label:'Okunan içerik (kaydedilmedi):',
    priority_from_report:'Bu rapora göre, öncelikli olarak neyin üzerinde çalışmak istersiniz?',
    text_will_be_erased:'Devam ettiğinizde bu metin silinecek. Yalnızca işaretlediğiniz seçimler saklanacak.',
    level_adjust_note:'İlerlemenize göre otomatik olarak ayarlanacaktır.',
    priority_detail:(rWeak)=>`(testte ${rWeak}). Bu alıştırmayı önce öneriyorum.`,
    imported_priorities_detail:(list)=>`Şunun üzerinde çalışmak istediğinizi belirttiniz: ${list}. Bunu öncelik olarak dikkate alacağım.`
  },
  pl:{
    welcome:'Witaj', welcome_p1:'Zanim zaczniemy, poświęćmy chwilę, aby lepiej Cię poznać. Pomoże nam to wybrać najbardziej przydatne dla Ciebie ćwiczenia.',
    welcome_p2:'Jest kilka krótkich etapów. Nie ma dobrego ani złego sposobu odpowiadania.',
    not_diagnosis:'ℹ️ Ten test nie jest diagnozą medyczną. Służy wyłącznie do personalizacji Twojego treningu.',
    start:'Zacznij', ready:'Jestem gotowy·a',
    small_test:'Krótki test', small_test_p:'Kilka prostych pytań, aby wspólnie określić Twoje mocne strony i to, nad czym możemy popracować. Nie spiesz się.',
    import_title:'Czy masz raport?',
    import_p1:'Jeśli masz raport (logopedyczny, medyczny...), możesz go przesłać. Aplikacja wyświetli go, aby pomóc Ci określić punkty do pracy, a następnie od razu go usunie.',
    import_note:'🔒 Twój plik pozostaje na Twoim urządzeniu. Nigdy nie jest wysyłany ani zapisywany. Zostaje usunięty, gdy tylko opuścisz ten etap.',
    import_upload:'📎 Kliknij, aby wybrać plik (PDF lub tekst)',
    skip_step:'Pomiń ten etap →',
    result_title:'Twój punkt wyjścia', result_thanks:'Dziękuję! Oto co zrozumiałem·am, aby zacząć:',
    priority_label:'Do priorytetowej pracy', level_label:'Sugerowany poziom początkowy',
    result_disclaimer:'ℹ️ To personalizuje Twój trening, ale nie zastępuje prawdziwej oceny logopedycznej.',
    begin_exercises:'Zacznij moje ćwiczenia',
    imported_from_bilan:'Na podstawie Twojego raportu',
    feelings_title:'Jak się czujesz',
    listen_btn:'🔊 Posłuchaj', listen_question:'🔊 Posłuchaj pytania', listen_beginning:'🔊 Posłuchaj początku',
    complete_choices_btn:'Zatwierdź moje wybory i kontynuuj',
    next_btn:'Dalej →',
    reading_in_progress:'Czytanie w toku…',
    read_file_failed:'Nie udało mi się odczytać tego pliku (może to być zeskanowany obraz). Możesz ręcznie zaznaczyć poniżej punkty do pracy.',
    content_read_label:'Odczytana treść (niezapisana):',
    priority_from_report:'Na podstawie tego raportu, nad czym chciałbyś·chciałabyś pracować w pierwszej kolejności?',
    text_will_be_erased:'Ten tekst zostanie usunięty, gdy będziesz kontynuować. Zachowane zostaną tylko Twoje zaznaczone wybory.',
    level_adjust_note:'Będzie się automatycznie dostosowywać w miarę Twoich postępów.',
    priority_detail:(rWeak)=>`(${rWeak} w teście). Zaproponuję to ćwiczenie jako pierwsze.`,
    imported_priorities_detail:(list)=>`Wskazałeś·aś, że chcesz pracować nad: ${list}. Uwzględnię to jako priorytet.`
  },
  ja:{
    welcome:'ようこそ', welcome_p1:"始める前に、少しあなたのことを教えてください。より役立つ練習を選ぶための参考にします。",
    welcome_p2:"短い質問がいくつかあります。正しい答え・間違った答えというものはありません。",
    not_diagnosis:"ℹ️ このテストは医学的診断ではありません。あなたの練習を調整するためだけに使われます。",
    start:'始める', ready:'準備ができました',
    small_test:'簡単なテスト', small_test_p:"得意なことと、これから取り組めることを一緒に見つけるための簡単な質問です。時間をかけて答えてください。",
    partial_kab_note:"ℹ️ この質問の一部は現在フランス語のままです（詳細は「このアプリについて」をご覧ください）。",
    import_title:'評価書はお持ちですか？',
    import_p1:"言語聴覚士や医師からの報告書があれば、アップロードできます。アプリが取り組むべき点を見つける参考として表示し、その後すぐに削除します。",
    import_note:"🔒 ファイルはあなたの端末に残ります。送信も保存もされません。このステップを終えるとすぐに削除されます。",
    import_upload:'📎 クリックしてファイルを選択（PDFまたはテキスト）',
    skip_step:'このステップを飛ばす →',
    symptoms_note:"ℹ️ これらの質問は現在フランス語のままです。",
    result_title:'あなたの出発点', result_thanks:"ありがとうございます！最初に理解できた内容はこちらです：",
    priority_label:'優先して取り組むこと', level_label:'おすすめの開始レベル',
    result_disclaimer:"ℹ️ これはあなたの練習を調整するためのものであり、言語聴覚士による評価の代わりにはなりません。",
    begin_exercises:'練習を始める',
    imported_from_bilan:"評価書によると",
    feelings_title:'あなたの気持ち',
    listen_btn:'🔊 聞く', listen_question:'🔊 質問を聞く', listen_beginning:'🔊 冒頭を聞く',
    complete_choices_btn:'選択を確定して続ける',
    next_btn:'次へ →',
    reading_in_progress:'読み込み中…',
    read_file_failed:"このファイルを読み取れませんでした（画像としてスキャンされている可能性があります）。下から取り組みたい点を手動で選択できます。",
    content_read_label:'読み取った内容（保存されません）：',
    priority_from_report:'この評価書によると、優先して取り組みたいことは何ですか？',
    text_will_be_erased:'このテキストは続行すると削除されます。チェックした選択のみが保存されます。',
    level_adjust_note:"あなたの進捗に応じて自動的に調整されます。",
    priority_detail:(rWeak)=>`（テストで${rWeak}）。この練習を優先的に提案します。`,
    imported_priorities_detail:(list)=>`優先して取り組みたいこととして「${list}」を挙げていただきました。優先的に考慮します。`
  }
};
function AS(key){
  const lang=(window.Prefs && Prefs.data.lang) || 'fr';
  return (ASSESS_STRINGS[lang] && ASSESS_STRINGS[lang][key]) || ASSESS_STRINGS.fr[key] || key;
}

const Assessment = {
  state:null,

  // Démarre tout le parcours d'accueil. onDone(profileSeed) est appelé à la fin.
  start(onDone){
    this.state = { step:'intro', symptomIdx:0, symptoms:{}, domainIdx:0, itemIdx:0, scores:{},
                   importedPriorities:[], onDone };
    ASSESS_DOMAINS.forEach(d=>this.state.scores[d.key]={ok:0,total:0});
    this._render();
  },

  _el(){ return document.getElementById('assess-body'); },

  _render(){
    const s=this.state;
    if(s.step==='intro') return this._intro();
    if(s.step==='import') return this._import();
    if(s.step==='symptoms') return this._symptom();
    if(s.step==='bilanIntro') return this._bilanIntro();
    if(s.step==='bilan') return this._bilanItem();
    if(s.step==='result') return this._result();
  },

  _intro(){
    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">👋</div>
        <div class="prompt-main" style="text-align:center;font-size:1.6rem">${AS('welcome')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('welcome_p1')}</p>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('welcome_p2')}</p>
        <div class="voice-warn" style="background:var(--accent-soft);color:var(--accent-dark)">${AS('not_diagnosis')}</div>
        ${(window.Prefs && Prefs.data.lang==='kab') ? `<div class="voice-warn" style="margin-top:8px">${AS('partial_kab_note')}</div>` : ''}
        <button class="btn-primary" style="margin-top:18px" onclick="Assessment.next()">${AS('start')}</button>
      </div>`;
  },

  // ÉTAPE OPTIONNELLE : déposer un bilan existant. Le fichier est lu UNIQUEMENT
  // dans le navigateur, jamais envoyé ni stocké, et effacé après lecture.
  // La personne reste décideuse : elle coche elle-même les points à travailler.
  _import(){
    // v6.113 : le bandeau "reste en français" pour le kabyle est retiré —
    // import_title/import_p1/import_note/import_upload sont maintenant
    // traduits (voir ASSESS_STRINGS.kab), relus par une personne
    // kabylophone. Voir docs/kabyle-symptoms-request.md pour l'historique.
    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">📄</div>
        <div class="prompt-main" style="text-align:center;font-size:1.45rem">${AS('import_title')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('import_p1')}</p>
        <div class="erased-note">${AS('import_note')}</div>
        <div class="upload-zone" onclick="document.getElementById('bilan-file').click()">
          ${AS('import_upload')}
          <input id="bilan-file" type="file" accept=".pdf,.txt,text/plain,application/pdf" style="display:none" onchange="Assessment.readFile(this.files[0])">
        </div>
        <div id="bilan-output"></div>
        <button class="btn-ghost" style="margin-top:18px;width:100%" onclick="Assessment.skipImport()">${AS('skip_step')}</button>
      </div>`;
  },

  async readFile(file){
    if(!file) return;
    const out=document.getElementById('bilan-output');
    out.innerHTML=`<p style="color:var(--ink-soft);margin-top:12px">${AS('reading_in_progress')}</p>`;
    let text='';
    try{
      if(file.type==='application/pdf' || file.name.toLowerCase().endsWith('.pdf')){
        text = await this._readPdf(file);
      } else {
        text = await file.text();
      }
    }catch(e){ text=''; console.warn('Lecture bilan:', e); }

    // EFFACEMENT immédiat : on ne garde aucune référence au fichier
    try{ document.getElementById('bilan-file').value=''; }catch(e){}

    if(!text || !text.trim()){
      out.innerHTML=`<div class="voice-warn">${AS('read_file_failed')}</div>${this._checklistHTML()}`;
      return;
    }
    // Affichage du texte (lecture seule) + bouton pour l'écouter + checklist
    const safe = text.replace(/[<>]/g,'').slice(0, 4000);
    out.innerHTML=`
      <p style="margin-top:14px;font-weight:600">${AS('content_read_label')}</p>
      <div class="bilan-text" id="bilan-text">${safe}</div>
      <button class="speak-btn" onclick="speak(document.getElementById('bilan-text').textContent.slice(0,600))">${AS('listen_beginning')}</button>
      <p style="margin-top:16px;font-weight:600">${AS('priority_from_report')}</p>
      ${this._checklistHTML()}
      <div class="erased-note">${AS('text_will_be_erased')}</div>`;
    // suggestion : si le texte mentionne un domaine, on pré-coche
    this._autoSuggest(text);
  },

  _readPdf(file){
    return new Promise(async (resolve,reject)=>{
      try{
        if(!window.pdfjsLib){
          await new Promise((res,rej)=>{ const s=document.createElement('script');
            s.src='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs'; s.type='module';
            s.onload=res; s.onerror=rej; document.head.appendChild(s); });
        }
        // pdf.min.mjs expose pdfjsLib en module ; fallback simple si indisponible
        const lib = window.pdfjsLib;
        if(!lib){ return resolve(''); }
        const buf = await file.arrayBuffer();
        const pdf = await lib.getDocument({data:buf}).promise;
        let txt='';
        for(let i=1;i<=pdf.numPages;i++){
          const page=await pdf.getPage(i); const c=await page.getTextContent();
          txt += c.items.map(it=>it.str).join(' ')+'\n';
        }
        resolve(txt);
      }catch(e){ resolve(''); }
    });
  },

  _checklistHTML(){
    return `<div class="bilan-checklist">`+ASSESS_DOMAINS.map(d=>
      `<label class="bilan-check"><input type="checkbox" value="${d.key}" onchange="Assessment.togglePriority('${d.key}',this.checked)"> <span>${domainLabel(d.key)}</span></label>`
    ).join('')+`</div>
    <button class="btn-primary" style="margin-top:14px" onclick="Assessment.confirmImport()">${AS('complete_choices_btn')}</button>`;
  },
  _autoSuggest(text){
    const t=text.toLowerCase();
    const map={denomination:['dénomination','manque du mot','trouver les mots','anomie'],
      completion:['syntaxe','phrase','grammaire','construction'],
      comprehension:['compréhension','comprendre','réceptif']};
    // mots qui signalent qu'un domaine est au contraire préservé (on ne coche pas)
    const preserved=['préservé','preserve','intact','normal','bon niveau','sans difficulté'];
    for(const [key,kw] of Object.entries(map)){
      const idx = kw.map(k=>t.indexOf(k)).filter(i=>i>=0);
      if(!idx.length) continue;
      // si "préservé/normal" apparaît juste après le mot-clé, on ne pré-coche pas
      const near = idx.some(i=>{ const window=t.slice(i, i+60); return preserved.some(p=>window.includes(p)); });
      if(near) continue;
      const box=document.querySelector(`.bilan-check input[value="${key}"]`);
      if(box && !box.checked){ box.checked=true; this.togglePriority(key,true); }
    }
  },
  togglePriority(key,on){
    const s=this.state; s.importedPriorities=s.importedPriorities.filter(k=>k!==key);
    if(on) s.importedPriorities.push(key);
  },
  confirmImport(){
    // on efface tout contenu affiché du bilan ; seuls les choix cochés restent
    const out=document.getElementById('bilan-output'); if(out) out.innerHTML='';
    this.state.step='symptoms'; this._render();
  },
  skipImport(){ this.state.step='symptoms'; this._render(); },

  _symptom(){
    const s=this.state, qq=symptomQuestions()[s.symptomIdx];
    const opts=qq.options.map(([lab,val])=>`<button class="choice" onclick="Assessment.answerSymptom('${qq.key}',${val},this)">${lab}</button>`).join('');
    // v6.119 : SYMPTOM_QUESTIONS_KAB existe désormais au complet (4/4) —
    // le bandeau "reste en français" et le bouton d'écoute (qui aurait
    // lu le kabyle avec une prononciation française, le kabyle n'ayant
    // pas de speechLocale) sont retirés pour cette langue.
    const lang=(window.Prefs && Prefs.data.lang) || 'fr';
    const listenBtn = lang==='kab' ? '' : `<button class="speak-btn" onclick="speak('${qq.q.replace(/'/g,"\\'")}')">${AS('listen_question')}</button>`;
    this._el().innerHTML=`
      <div class="ex-header"><h2 style="font-size:1.2rem">${AS('feelings_title')}</h2><span dir="ltr" style="color:var(--ink-soft);font-size:.9rem">${s.symptomIdx+1} / ${symptomQuestions().length}</span></div>
      <div class="prompt-card">
        <div class="prompt-main" style="font-size:1.4rem">${qq.q}</div>
        ${listenBtn}
      </div>
      <div class="choices">${opts}</div>`;
  },
  // v6.49 : confirmation visuelle avant de passer à la question suivante
  // — jusqu'ici le clic faisait avancer instantanément, sans aucun
  // signe que la réponse avait été prise en compte (signalé par
  // l'utilisateur : "on ne voit pas si on a fait les bonnes réponses").
  // Pas de vert/rouge ici : ce ne sont pas des bonnes/mauvaises
  // réponses, juste un ressenti — seulement une mise en évidence
  // neutre du choix sélectionné (classe .selected), le temps d'un
  // court délai, avant d'avancer.
  answerSymptom(key,val,btn){
    const s=this.state;
    s.symptoms[key]=val;
    document.querySelectorAll('.choices .choice').forEach(b=>{ b.disabled=true; });
    if(btn) btn.classList.add('selected');
    s.symptomIdx++;
    setTimeout(()=>{
      if(s.symptomIdx>=symptomQuestions().length){ s.step='bilanIntro'; }
      this._render();
    }, 450);
  },

  _bilanIntro(){
    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">📝</div>
        <div class="prompt-main" style="text-align:center;font-size:1.5rem">${AS('small_test')}</div>
        <p style="color:var(--ink-soft);margin-top:10px">${AS('small_test_p')}</p>
        <button class="btn-primary" style="margin-top:18px" onclick="Assessment.next()">${AS('ready')}</button>
      </div>`;
  },

  _bilanItem(){
    const s=this.state;
    const domain=ASSESS_DOMAINS[s.domainIdx];
    const lang=(window.Prefs && Prefs.data.lang) || 'fr';
    // v6.115 : généralisé au-delà de la dénomination — utilise le kabyle
    // dès qu'un domaine a du contenu vérifié dans ASSESS_ITEMS_KAB,
    // plutôt que de le restreindre à la dénomination en dur (v6.3).
    const useKab = lang==='kab' && !!ASSESS_ITEMS_KAB[domain.key];
    const items=useKab ? ASSESS_ITEMS_KAB[domain.key] : assessItems(domain.key);
    const q=items[s.itemIdx];
    const totalItems=ASSESS_DOMAINS.reduce((n,d)=>n+ASSESS_ITEMS[d.key].length,0);
    const doneItems=ASSESS_DOMAINS.slice(0,s.domainIdx).reduce((n,d)=>n+ASSESS_ITEMS[d.key].length,0)+s.itemIdx;
    let promptHTML='', consigne='';
    if(domain.key==='denomination'){
      consigne = useKab ? BANK_KAB.denomination.consigne : I18N.t('denom_prompt');
      promptHTML=`<div class="prompt-emoji">${q.emoji}</div><div class="prompt-text">${consigne}</div>`;
    }
    else if(domain.key==='completion'){ promptHTML=`<div class="prompt-text">${I18N.t('completion_label')}</div><div class="prompt-main">${q.text.replace('___','<span class=blank>____</span>')}</div>`; consigne=I18N.t('completion_label')+' '+q.text.replace('___','...'); }
    else { promptHTML=`<div class="prompt-main" style="font-size:1.4rem">${q.text}</div>`; consigne=q.text; }
    const shuffled=[...q.choices].sort(()=>Math.random()-0.5);
    const opts=shuffled.map(ch=>`<button class="choice" onclick="Assessment.answerBilan('${ch.replace(/'/g,"\\'")}','${q.answer.replace(/'/g,"\\'")}')">${ch}</button>`).join('');
    // v6.3 : quand les items sont en kabyle, le titre du domaine l'est aussi
    // (évite le mélange "titre français + mots kabyles" repéré en test)
    // v6.115 : passe par domainLabel() (ASSESS_DOMAIN_LABELS_KAB) pour
    // completion/comprehension — BANK_KAB.denomination.title reste
    // utilisé seulement pour ce domaine précis.
    const domLabel = useKab ? (domain.key==='denomination' ? BANK_KAB.denomination.title : domainLabel(domain.key)) : domainLabel(domain.key);
    // v6.3 : pas de bouton "Écouter" sur une consigne/un item en kabyle —
    // la synthèse vocale du navigateur la prononcerait en français, ce
    // qui serait faux (le kabyle n'a pas de speechLocale).
    const listenBtn = useKab ? '' : `<button class="speak-btn" onclick="speak(${JSON.stringify(consigne).replace(/"/g,'&quot;')})">${AS('listen_btn')}</button>`;
    this._el().innerHTML=`
      <div class="ex-header"><h2 style="font-size:1.2rem">${domLabel}</h2><span dir="ltr" style="color:var(--ink-soft);font-size:.9rem">${doneItems+1} / ${totalItems}</span></div>
      <div class="progress"><span style="width:${100*doneItems/totalItems}%"></span></div>
      <div class="prompt-card">${promptHTML}${listenBtn}</div>
      <div class="choices">${opts}</div>`;
  },
  answerBilan(chosen,answer){
    const s=this.state, domain=ASSESS_DOMAINS[s.domainIdx];
    const ok=chosen===answer;
    s.scores[domain.key].total++; if(ok) s.scores[domain.key].ok++;
    // marquer visuellement
    document.querySelectorAll('.choice').forEach(b=>{ b.disabled=true;
      if(b.textContent===answer) b.classList.add('correct');
      else if(b.textContent===chosen) b.classList.add('wrong'); });
    // v6.114 : un bouton "Suivant" explicite remplace l'ancien enchaînement
    // automatique (700ms/1100ms) — retour utilisateur : la réponse
    // disparaissait avant d'avoir eu le temps d'être lue, même correctif
    // que le jeu de mémoire en v6.101.
    const nextBtn=document.createElement('button');
    nextBtn.className='btn-primary';
    nextBtn.id='assess-next-btn';
    nextBtn.style.marginTop='14px';
    nextBtn.textContent=AS('next_btn');
    nextBtn.onclick=()=>{
      const s2=this.state, domain2=ASSESS_DOMAINS[s2.domainIdx];
      s2.itemIdx++;
      const items2=assessItems(domain2.key);
      if(s2.itemIdx>=items2.length){ s2.itemIdx=0; s2.domainIdx++; }
      if(s2.domainIdx>=ASSESS_DOMAINS.length){ s2.step='result'; }
      this._render();
    };
    const card=this._el().querySelector('.prompt-card') || this._el();
    card.appendChild(nextBtn);
    nextBtn.focus();
  },

  next(){
    const s=this.state;
    if(s.step==='intro'){ s.step='import'; }
    else if(s.step==='bilanIntro'){ s.step='bilan'; }
    this._render();
  },

  // Construit le profil initial pour l'IA à partir des résultats du bilan.
  _buildSeed(){
    const s=this.state;
    const seed={ byType:{}, byTag:{}, updated:new Date().toISOString(),
                 symptoms:s.symptoms, assessedAt:new Date().toISOString() };
    // injecte les résultats du bilan comme premières observations de l'IA
    ASSESS_DOMAINS.forEach(d=>{
      const sc=s.scores[d.key];
      seed.byType[d.key]={ seen:sc.total, ok:sc.ok };
    });
    // priorités cochées par la personne d'après son bilan : on les marque comme
    // axes de travail (observations "à renforcer" sans fausser les scores réels)
    (s.importedPriorities||[]).forEach(key=>{
      if(seed.byType[key]){ seed.byType[key].flagged=true; }
    });
    seed.userPriorities = s.importedPriorities||[];
    return seed;
  },

  // Recommande un niveau de départ selon le score global du bilan
  _suggestLevel(){
    const s=this.state;
    let ok=0,total=0;
    ASSESS_DOMAINS.forEach(d=>{ ok+=s.scores[d.key].ok; total+=s.scores[d.key].total; });
    const r=total?ok/total:0.5;
    if(r<0.4) return 1;       // Doux
    if(r<0.8) return 2;       // Intermédiaire
    return 3;                 // Avancé
  },

  _result(){
    const s=this.state;
    const seed=this._buildSeed();
    const level=this._suggestLevel();
    // domaine le plus faible (à travailler en priorité)
    const sorted=[...ASSESS_DOMAINS].sort((a,b)=>{
      const ra=s.scores[a.key].total?s.scores[a.key].ok/s.scores[a.key].total:1;
      const rb=s.scores[b.key].total?s.scores[b.key].ok/s.scores[b.key].total:1;
      return ra-rb;
    });
    const weakest=sorted[0], rWeak=s.scores[weakest.key].ok+'/'+s.scores[weakest.key].total;

    const importedBlock = (s.importedPriorities&&s.importedPriorities.length)
      ? `<div class="ai-note"><span>📄</span><div><b>${AS('imported_from_bilan')}</b>${AS('imported_priorities_detail')(s.importedPriorities.map(domainLabel).join(', '))}</div></div>`
      : '';
    // v6.17 : l'anglais a maintenant ses propres libellés (domainLabel,
    // levelName) donc ce résumé est traduit pour cette langue. Le kabyle
    // reste en français ici : labelOf()/LEVEL_NAMES n'ont pas d'équivalent
    // kabyle fiable pour l'instant (voir note plus bas).
    const kabResultNote = (window.Prefs && Prefs.data.lang==='kab')
      ? `<div class="voice-warn" style="margin-top:10px">ℹ️ Ce résumé reste en français (les noms d'exercices et de niveaux ne sont pas encore traduits).</div>` : '';

    this._el().innerHTML=`
      <div class="prompt-card" style="text-align:left">
        <div class="prompt-emoji" style="text-align:center">🌱</div>
        <div class="prompt-main" style="text-align:center;font-size:1.5rem">${AS('result_title')}</div>
        <p style="color:var(--ink-soft);margin-top:12px">${AS('result_thanks')}</p>
        ${kabResultNote}
        ${importedBlock}
        <div class="ai-note" style="margin-top:12px"><span>🎯</span><div><b>${AS('priority_label')}</b>${domainLabel(weakest.key)} ${AS('priority_detail')(rWeak)}</div></div>
        <div class="ai-note"><span>📊</span><div><b>${AS('level_label')}</b>${levelName(level)}. ${AS('level_adjust_note')}</div></div>
        <div class="voice-warn" style="background:var(--accent-soft);color:var(--accent-dark);margin-top:14px">${AS('result_disclaimer')}</div>
        <button class="btn-primary" style="margin-top:18px" onclick="Assessment.finish()">${AS('begin_exercises')}</button>
      </div>`;
    s._seed=seed; s._level=level;
  },

  finish(){
    const s=this.state;
    if(s.onDone) s.onDone({ seed:s._seed, level:s._level });
  }
};

window.Assessment = Assessment;
// v6.21 : même correctif que I18N_STRINGS (js/i18n.js) — ASSESS_STRINGS
// n'était accessible que par AS() dans ce même fichier.
window.ASSESS_STRINGS = ASSESS_STRINGS;
