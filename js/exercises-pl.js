// =====================================================================
//  BANQUE D'EXERCICES EN POLONAIS (v6.40) — langue COMPLÈTE
//  ---------------------------------------------------------------------
//  Même principe que js/exercises-en.js et js/exercises-tr.js : le
//  polonais est bien couvert par la reconnaissance/synthèse vocale des
//  navigateurs (pl-PL), donc cette banque couvre TOUS les types
//  d'exercices, y compris les exercices vocaux, avec le même nombre de
//  niveaux et d'items que la banque française.
//
//  Capitalisation : contrairement au turc, le polonais suit les règles
//  de casse latines standard (Ą→ą, Ł→ł, etc. — pas d'exception comme
//  i/İ vs ı/I). Le seul point d'attention pour la reconnaissance
//  vocale était "ł", déjà couvert par le correctif générique de
//  js/app.js:normalize() (v6.39, table NORMALIZE_SUBSTITUTIONS) — voir
//  tests/text-normalize.test.js.
// =====================================================================

window.BANK_PL = {
  denomination:{ title:'Nazywaj obrazki', items:{
    1:[ {emoji:'🐱',answer:'KOT',choices:['KOT','PIES','KRÓLIK']},
        {emoji:'🍎',answer:'JABŁKO',choices:['GRUSZKA','JABŁKO','ŚLIWKA']},
        {emoji:'🏠',answer:'DOM',choices:['DOM','SAMOCHÓD','DRZEWO']},
        {emoji:'☀️',answer:'SŁOŃCE',choices:['SŁOŃCE','KSIĘŻYC','CHMURA']},
        {emoji:'🚗',answer:'SAMOCHÓD',choices:['SAMOCHÓD','ROWER','ŁÓDŹ']},
        {emoji:'🐟',answer:'RYBA',choices:['RYBA','PTAK','KOŃ']},
        {emoji:'🌹',answer:'KWIAT',choices:['KWIAT','TRAWA','LIŚĆ']},
        {emoji:'🍞',answer:'CHLEB',choices:['CHLEB','CIASTO','SER']} ],
    2:[ {emoji:'🦋',answer:'MOTYL',choices:['MOTYL','PSZCZOŁA','WAŻKA']},
        {emoji:'⌚',answer:'ZEGAREK',choices:['ZEGAR','ZEGAREK','BUDZIK']},
        {emoji:'🎻',answer:'SKRZYPCE',choices:['GITARA','SKRZYPCE','WIOLONCZELA']},
        {emoji:'🍄',answer:'GRZYB',choices:['GRZYB','POMIDOR','CEBULA']},
        {emoji:'🦒',answer:'ŻYRAFA',choices:['ŻYRAFA','WIELBŁĄD','ZEBRA']},
        {emoji:'⛵',answer:'ŻAGLÓWKA',choices:['ŻAGLÓWKA','STATEK','KAJAK']},
        {emoji:'🎺',answer:'TRĄBKA',choices:['TRĄBKA','FLET','SAKSOFON']},
        {emoji:'🌋',answer:'WULKAN',choices:['WULKAN','GÓRA','WZGÓRZE']} ],
    3:[ {emoji:'🧭',answer:'KOMPAS',choices:['KOMPAS','BAROMETR','TERMOMETR']},
        {emoji:'🦔',answer:'JEŻ',choices:['JEŻ','JEŻOZWIERZ','KRET']},
        {emoji:'⚓',answer:'KOTWICA',choices:['KOTWICA','ŚRUBA','STER']},
        {emoji:'🔬',answer:'MIKROSKOP',choices:['MIKROSKOP','TELESKOP','PERYSKOP']},
        {emoji:'🪕',answer:'BANJO',choices:['BANJO','MANDOLINA','UKULELE']},
        {emoji:'🦦',answer:'WYDRA',choices:['WYDRA','ŁASICA','KUNA']},
        {emoji:'🌪️',answer:'TORNADO',choices:['TORNADO','HURAGAN','TAJFUN']},
        {emoji:'🛡️',answer:'TARCZA',choices:['TARCZA','ZBROJA','HEŁM']} ]
  }},
  completion:{ title:'Uzupełnij zdanie', items:{
    1:[ {text:'Kot pije ___',answer:'MLEKO',choices:['MLEKO','CHLEB','WODĘ']},
        {text:'Śpię w moim ___',answer:'ŁÓŻKU',choices:['ŁÓŻKU','TALERZU','PLECAKU']},
        {text:'Słońce jest ___',answer:'ŻÓŁTE',choices:['ŻÓŁTE','ZIMNE','CIĘŻKIE']},
        {text:'Jem ___',answer:'WIDELCEM',choices:['WIDELCEM','KRZESŁEM','DRZWIAMI']},
        {text:'W nocy niebo jest ___',answer:'CZARNE',choices:['CZARNE','ZIELONE','OKRĄGŁE']},
        {text:'Chodzę na moich ___',answer:'NOGACH',choices:['NOGACH','RĘKACH','OCZACH']},
        {text:'Pijemy z ___',answer:'SZKLANKI',choices:['SZKLANKI','KSIĄŻKI','ŚCIANY']},
        {text:'Dziecko płacze w ___',answer:'KOŁYSCE',choices:['KOŁYSCE','OGRODZIE','PIEKARNIKU']} ],
    2:[ {text:'Do pisania używam ___',answer:'DŁUGOPISU',choices:['DŁUGOPISU','MŁOTKA','MIOTŁY']},
        {text:'Zimą jest bardzo ___',answer:'ZIMNO',choices:['GORĄCO','ZIMNO','WILGOTNO']},
        {text:'Listonosz przynosi ___',answer:'LIST',choices:['LIST','CHLEB','GAZETĘ']},
        {text:'Aby otworzyć drzwi, potrzebny jest ___',answer:'KLUCZ',choices:['KLUCZ','LAMPA','FILIŻANKA']},
        {text:'Oglądam film w ___',answer:'TELEWIZJI',choices:['TELEWIZJI','RADIU','OKNIE']},
        {text:'Ptak buduje swoje ___',answer:'GNIAZDO',choices:['GNIAZDO','DZIURĘ','ŚCIANĘ']},
        {text:'Chleb kupujemy w ___',answer:'PIEKARNI',choices:['PIEKARNI','APTECE','BANKU']},
        {text:'Przed jedzeniem myję ___',answer:'RĘCE',choices:['RĘCE','WŁOSY','ZĘBY']} ],
    3:[ {text:'Przed wyjściem nie zapomnij ___ drzwi',answer:'ZAMKNĄĆ',choices:['ZAMKNĄĆ','OTWORZYĆ','POMALOWAĆ']},
        {text:'Lekarz przepisał ___',answer:'LECZENIE',choices:['LECZENIE','DESER','BUKIET']},
        {text:'Spotkanie zostało ___ do jutra',answer:'PRZEŁOŻONE',choices:['PRZEŁOŻONE','ZJEDZONE','POMALOWANE']},
        {text:'Musisz ___ podatki przed terminem',answer:'ZADEKLAROWAĆ',choices:['ZADEKLAROWAĆ','ZATAŃCZYĆ','PODLAĆ']},
        {text:'Ogrodnik przytnie ___',answer:'RÓŻE',choices:['RÓŻE','KSIĄŻKI','TELEFONY']},
        {text:'Po ćwiczeniach trzeba ___',answer:'ODPOCZĄĆ',choices:['ODPOCZĄĆ','BIEC','ZDENERWOWAĆ SIĘ']},
        {text:'W tę historię trudno ___',answer:'UWIERZYĆ',choices:['UWIERZYĆ','SZYĆ','GOTOWAĆ']},
        {text:'Świadek odmówił ___',answer:'ZEZNAWANIA',choices:['ZEZNAWANIA','DZWONIENIA','PODRÓŻOWANIA']} ]
  }},
  comprehension:{ title:'Zrozum polecenie', items:{
    1:[ {text:'Które zwierzę szczeka?',answer:'PIES',choices:['PIES','RYBA','PTAK']},
        {text:'Czym jesz zupę?',answer:'ŁYŻKĄ',choices:['ŁYŻKĄ','NOŻEM','WIDELCEM']},
        {text:'Gdzie śpisz?',answer:'W ŁÓŻKU',choices:['W ŁÓŻKU','W MISCE','W TORBIE']},
        {text:'Jakiego koloru jest trawa?',answer:'ZIELONA',choices:['ZIELONA','CZERWONA','NIEBIESKA']},
        {text:'Co pijesz, gdy jesteś spragniony·a?',answer:'WODĘ',choices:['WODĘ','PIASEK','PAPIER']},
        {text:'Jaki przedmiot oświetla noc?',answer:'LAMPA',choices:['LAMPA','PODUSZKA','TALERZ']} ],
    2:[ {text:'Jaki przedmiot podaje Ci godzinę?',answer:'ZEGAREK',choices:['ZEGAREK','KSIĄŻKA','LAMPA']},
        {text:'Jaka pora roku przychodzi po zimie?',answer:'WIOSNA',choices:['LATO','WIOSNA','JESIEŃ']},
        {text:'Do czego służy parasol?',answer:'ABY NIE ZMOKNĄĆ',choices:['ABY NIE ZMOKNĄĆ','DO JEDZENIA','DO SPANIA']},
        {text:'Jaki zawód leczy chorych?',answer:'LEKARZ',choices:['LEKARZ','PIEKARZ','MALARZ']},
        {text:'Ile dni ma tydzień?',answer:'SIEDEM',choices:['SIEDEM','PIĘĆ','DZIESIĘĆ']},
        {text:'Gdzie kupujesz lekarstwa?',answer:'W APTECE',choices:['W APTECE','NA POCZCIE','W WARSZTACIE']} ],
    3:[ {text:'Jeśli wszystkie róże są kwiatami, czy róża jest kwiatem?',answer:'TAK',choices:['TAK','NIE','CZASAMI']},
        {text:'Przeciwieństwo słowa „szybko":',answer:'WOLNO',choices:['WOLNO','GŁOŚNO','CZĘSTO']},
        {text:'„Przelała się czara" oznacza:',answer:'PRZEKROCZONA GRANICA CIERPLIWOŚCI',choices:['PRZEKROCZONA GRANICA CIERPLIWOŚCI','SŁONECZNA POGODA','PADA ŚNIEG']},
        {text:'Piotr jest wyższy niż Paweł. Kto jest niższy?',answer:'PAWEŁ',choices:['PAWEŁ','PIOTR','OBAJ','ŻADEN']},
        {text:'„Przewrócić kartkę" oznacza:',answer:'IŚĆ DALEJ',choices:['IŚĆ DALEJ','CZYTAĆ KSIĄŻKĘ','ODPOCZYWAĆ']},
        {text:'Które słowo nie jest owocem?',answer:'MARCHEWKA',choices:['MARCHEWKA','WIŚNIA','BANAN']} ]
  }},
  repetition:{ title:'Powtarzaj na głos', voice:true, items:{
    1:[ {word:'PIŁKA'},{word:'STÓŁ'},{word:'SŁOŃCE'},{word:'KOT'},{word:'DRZWI'},{word:'KWIAT'},{word:'RĘKA'},{word:'WODA'} ],
    2:[ {word:'KOMPUTER'},{word:'PARASOL'},{word:'TELEFON'},{word:'BIBLIOTEKA'},{word:'RESTAURACJA'},{word:'GÓRA'},{word:'OGRODNIK'},{word:'KALENDARZ'} ],
    3:[ {word:'HELIKOPTER'},{word:'FIZJOTERAPEUTA'},{word:'NIEKONSTYTUCYJNY'},{word:'RÓWNOLEGŁOŚCIAN'},{word:'LARYNGOLOG'},{word:'CHRYZANTEMA'},{word:'NADCHODZĄCY'},{word:'STATYSTYCZNIE'} ]
  }},
  denomination_orale:{ title:'Nazywaj na głos', voice:true, items:{
    1:[ {emoji:'🐱',word:'KOT'},{emoji:'🍎',word:'JABŁKO'},{emoji:'🏠',word:'DOM'},{emoji:'☀️',word:'SŁOŃCE'},{emoji:'🚗',word:'SAMOCHÓD'},{emoji:'🌹',word:'KWIAT'} ],
    2:[ {emoji:'🦋',word:'MOTYL'},{emoji:'⌚',word:'ZEGAREK'},{emoji:'🍄',word:'GRZYB'},{emoji:'🦒',word:'ŻYRAFA'},{emoji:'⛵',word:'ŻAGLÓWKA'},{emoji:'🎺',word:'TRĄBKA'} ],
    3:[ {emoji:'🧭',word:'KOMPAS'},{emoji:'🦔',word:'JEŻ'},{emoji:'⚓',word:'KOTWICA'},{emoji:'🔬',word:'MIKROSKOP'},{emoji:'🌪️',word:'TORNADO'},{emoji:'🛡️',word:'TARCZA'} ]
  }},
  fluence:{ title:'Płynność słowna', voice:true, fluency:true, items:{
    1:[ {cat:'zwierzęta',accept:['kot','pies','królik','koń','krowa','kura','owca','świnia','ptak','ryba','mysz','lew','tygrys','niedźwiedź','wilk','lis','kaczka','osioł','koza','małpa','słoń','żyrafa','zebra','wąż','żaba']},
        {cat:'owoce',accept:['jabłko','gruszka','banan','pomarańcza','truskawka','wiśnia','winogrono','kiwi','melon','brzoskwinia','morela','śliwka','cytryna','ananas','mango','malina','borówka','arbuz','figa','mandarynka']} ],
    2:[ {cat:'przedmioty kuchenne',accept:['nóż','widelec','łyżka','talerz','szklanka','garnek','patelnia','piekarnik','lodówka','zlew','stół','filiżanka','miska','durszlak','łopatka','chochla','czajnik']},
        {cat:'ubrania',accept:['spodnie','koszula','sweter','sukienka','spódnica','płaszcz','kurtka','skarpetka','but','szalik','rękawiczka','czapka','szorty','koszulka','krawat','pasek','kozak','sandał','rajstopy','kardigan']} ],
    3:[ {cat:'słowa zaczynające się na literę B',accept:['balon','but','bochenek','bilet','bagno','bęben','bagaż','baton','babcia','biedronka','burza','brzeg','biały','burak','brat','bank','bramka','biurko','błoto','bluza']},
        {cat:'zawody',accept:['lekarz','piekarz','strażak','nauczyciel','pielęgniarka','prawnik','hydraulik','malarz','kucharz','listonosz','ogrodnik','fryzjer','mechanik','farmaceuta','elektryk','architekt','dziennikarz','policjant','pilot','dentysta']} ]
  }},
  intonation:{ title:'Powtarzaj z intonacją', voice:true, items:{
    1:[ {word:'Skończyłeś?',cue:'question'},
        {word:'Jesteś pewien?',cue:'question'},
        {word:'Przyjeżdżam jutro.',cue:'descriptive'},
        {word:'Jesz tutaj.',cue:'descriptive'},
        {word:'Chodź tutaj!',cue:'exclamative'},
        {word:'Co za dobry pomysł!',cue:'exclamative'} ],
    2:[ {word:'Co robisz?',cue:'question'},
        {word:'Naprawdę?',cue:'question'},
        {word:'Ona bawi się na dworze.',cue:'descriptive'},
        {word:'Rozmawiają z przyjacielem.',cue:'descriptive'},
        {word:'Jaka jesteś piękna!',cue:'exclamative'},
        {word:'Co za niespodzianka!',cue:'exclamative'} ],
    3:[ {word:'Czy dobrze spałeś zeszłej nocy?',cue:'question'},
        {word:'Czy mógłbyś mi pomóc to przenieść?',cue:'question'},
        {word:'Wyjedziemy wcześnie jutro rano.',cue:'descriptive'},
        {word:'Listonosz przyszedł, kiedy spałeś.',cue:'descriptive'},
        {word:'Co za wspaniały dzień mieliśmy!',cue:'exclamative'},
        {word:'Wciąż nie mogę w to uwierzyć!',cue:'exclamative'} ]
  }}
};
