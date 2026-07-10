// =====================================================================
//  BANQUE D'EXERCICES EN TURC (v6.39) — langue COMPLÈTE
//  ---------------------------------------------------------------------
//  Même principe que js/exercises-en.js : le turc est bien couvert par
//  la reconnaissance/synthèse vocale des navigateurs (tr-TR), donc
//  cette banque couvre TOUS les types d'exercices, y compris les
//  exercices vocaux, avec le même nombre de niveaux et d'items que la
//  banque française.
//
//  Attention capitalisation turque : "i" minuscule se met en majuscule
//  "İ" (point), et "ı" (sans point) minuscule se met en majuscule "I" —
//  l'inverse de la plupart des langues latines. Les mots ci-dessous
//  sont écrits directement dans leur forme MAJUSCULE correcte (pas de
//  .toUpperCase() JS appliqué dessus, qui utiliserait la règle latine
//  et casserait cette distinction) — cohérent avec le reste de l'app
//  (voir aussi le correctif de js/app.js:normalize() pour la
//  reconnaissance vocale, v6.39).
// =====================================================================

window.BANK_TR = {
  denomination:{ title:'Resimleri adlandırın', items:{
    1:[ {emoji:'🐱',answer:'KEDİ',choices:['KEDİ','KÖPEK','TAVŞAN']},
        {emoji:'🍎',answer:'ELMA',choices:['ARMUT','ELMA','ERİK']},
        {emoji:'🏠',answer:'EV',choices:['EV','ARABA','AĞAÇ']},
        {emoji:'☀️',answer:'GÜNEŞ',choices:['GÜNEŞ','AY','BULUT']},
        {emoji:'🚗',answer:'ARABA',choices:['ARABA','BİSİKLET','TEKNE']},
        {emoji:'🐟',answer:'BALIK',choices:['BALIK','KUŞ','AT']},
        {emoji:'🌹',answer:'ÇİÇEK',choices:['ÇİÇEK','ÇİMEN','YAPRAK']},
        {emoji:'🍞',answer:'EKMEK',choices:['EKMEK','PASTA','PEYNİR']} ],
    2:[ {emoji:'🦋',answer:'KELEBEK',choices:['KELEBEK','ARI','YUSUFÇUK']},
        {emoji:'⌚',answer:'KOL SAATİ',choices:['DUVAR SAATİ','KOL SAATİ','ÇALAR SAAT']},
        {emoji:'🎻',answer:'KEMAN',choices:['GİTAR','KEMAN','ÇELLO']},
        {emoji:'🍄',answer:'MANTAR',choices:['MANTAR','DOMATES','SOĞAN']},
        {emoji:'🦒',answer:'ZÜRAFA',choices:['ZÜRAFA','DEVE','ZEBRA']},
        {emoji:'⛵',answer:'YELKENLİ',choices:['YELKENLİ','GEMİ','KANO']},
        {emoji:'🎺',answer:'TROMPET',choices:['TROMPET','FLÜT','SAKSOFON']},
        {emoji:'🌋',answer:'YANARDAĞ',choices:['YANARDAĞ','DAĞ','TEPE']} ],
    3:[ {emoji:'🧭',answer:'PUSULA',choices:['PUSULA','BAROMETRE','TERMOMETRE']},
        {emoji:'🦔',answer:'KİRPİ',choices:['KİRPİ','OKLUKİRPİ','KÖSTEBEK']},
        {emoji:'⚓',answer:'ÇAPA',choices:['ÇAPA','PERVANE','DÜMEN']},
        {emoji:'🔬',answer:'MİKROSKOP',choices:['MİKROSKOP','TELESKOP','PERİSKOP']},
        {emoji:'🪕',answer:'BANJO',choices:['BANJO','MANDOLİN','UKULELE']},
        {emoji:'🦦',answer:'SU SAMURU',choices:['SU SAMURU','GELİNCİK','SANSAR']},
        {emoji:'🌪️',answer:'HORTUM',choices:['HORTUM','KASIRGA','TAYFUN']},
        {emoji:'🛡️',answer:'KALKAN',choices:['KALKAN','ZIRH','MİĞFER']} ]
  }},
  completion:{ title:'Cümleyi tamamlayın', items:{
    1:[ {text:'Kedi ___ içer',answer:'SÜT',choices:['SÜT','EKMEK','SU']},
        {text:'Ben ___ uyurum',answer:'YATAKTA',choices:['YATAKTA','TABAKTA','ÇANTADA']},
        {text:'Güneş ___',answer:'SARI',choices:['SARI','SOĞUK','AĞIR']},
        {text:'Ben ___ yemek yerim',answer:'ÇATALLA',choices:['ÇATALLA','SANDALYEYLE','KAPIYLA']},
        {text:'Gece gökyüzü ___',answer:'SİYAH',choices:['SİYAH','YEŞİL','YUVARLAK']},
        {text:'Ben ___ yürürüm',answer:'AYAKLARIMLA',choices:['AYAKLARIMLA','ELLERİMLE','GÖZLERİMLE']},
        {text:'Bir ___ içinden su içeriz',answer:'BARDAK',choices:['BARDAK','KİTAP','DUVAR']},
        {text:'Bebek ___ ağlar',answer:'BEŞİKTE',choices:['BEŞİKTE','BAHÇEDE','FIRINDA']} ],
    2:[ {text:'Yazmak için bir ___ kullanırım',answer:'KALEM',choices:['KALEM','ÇEKİÇ','SÜPÜRGE']},
        {text:'Kışın hava çok ___',answer:'SOĞUK',choices:['SICAK','SOĞUK','NEMLİ']},
        {text:'Postacı ___ getirir',answer:'MEKTUP',choices:['MEKTUP','EKMEK','GAZETE']},
        {text:'Kapıyı açmak için bir ___ gerekir',answer:'ANAHTAR',choices:['ANAHTAR','LAMBA','FİNCAN']},
        {text:'___ üzerinde bir film izlerim',answer:'TELEVİZYON',choices:['TELEVİZYON','RADYO','PENCERE']},
        {text:'Kuş ___ yapar',answer:'YUVASINI',choices:['YUVASINI','DELİĞİNİ','DUVARINI']},
        {text:'Ekmeği ___ satın alırız',answer:'FIRINDAN',choices:['FIRINDAN','ECZANEDEN','BANKADAN']},
        {text:'Yemekten önce ___ yıkarım',answer:'ELLERİMİ',choices:['ELLERİMİ','SAÇIMI','DİŞLERİMİ']} ],
    3:[ {text:'Çıkmadan önce kapıyı ___ unutmayın',answer:'KİLİTLEMEYİ',choices:['KİLİTLEMEYİ','AÇMAYI','BOYAMAYI']},
        {text:'Doktor bir ___ yazdı',answer:'TEDAVİ',choices:['TEDAVİ','TATLI','BUKET']},
        {text:'Toplantı yarına ___',answer:'ERTELENDİ',choices:['ERTELENDİ','YENDİ','BOYANDI']},
        {text:'Vergilerinizi son tarihten önce ___ gerekir',answer:'BEYAN ETMENİZ',choices:['BEYAN ETMENİZ','DANS ETMENİZ','SULAMANIZ']},
        {text:'Bahçıvan gül fidanlarını ___',answer:'BUDAYACAK',choices:['BUDAYACAK','OKUYACAK','ARAYACAK']},
        {text:'Egzersizden sonra ___ gerekir',answer:'DİNLENMEK',choices:['DİNLENMEK','KOŞMAK','SİNİRLENMEK']},
        {text:'Bu hikayeye ___ zor',answer:'İNANMAK',choices:['İNANMAK','DİKMEK','PİŞİRMEK']},
        {text:'Tanık ___ reddetti',answer:'İFADE VERMEYİ',choices:['İFADE VERMEYİ','ARAMAYI','SEYAHAT ETMEYİ']} ]
  }},
  comprehension:{ title:'Yönergeyi anlayın', items:{
    1:[ {text:'Hangi hayvan havlar?',answer:'KÖPEK',choices:['KÖPEK','BALIK','KUŞ']},
        {text:'Çorbayı ne ile içersiniz?',answer:'KAŞIKLA',choices:['KAŞIKLA','BIÇAKLA','ÇATALLA']},
        {text:'Nerede uyursunuz?',answer:'YATAKTA',choices:['YATAKTA','KASEDE','ÇANTADA']},
        {text:'Çimen ne renktir?',answer:'YEŞİL',choices:['YEŞİL','KIRMIZI','MAVİ']},
        {text:'Susadığınızda ne içersiniz?',answer:'SU',choices:['SU','KUM','KAĞIT']},
        {text:'Geceyi hangi eşya aydınlatır?',answer:'LAMBA',choices:['LAMBA','YASTIK','TABAK']} ],
    2:[ {text:'Hangi eşya size saati söyler?',answer:'SAAT',choices:['SAAT','KİTAP','LAMBA']},
        {text:'Kıştan sonra hangi mevsim gelir?',answer:'İLKBAHAR',choices:['YAZ','İLKBAHAR','SONBAHAR']},
        {text:'Şemsiyeyi ne için kullanırsınız?',answer:'YAĞMURDAN KORUNMAK',choices:['YAĞMURDAN KORUNMAK','YEMEK','UYUMAK']},
        {text:'Hangi meslek hasta insanları tedavi eder?',answer:'DOKTOR',choices:['DOKTOR','FIRINCI','RESSAM']},
        {text:'Bir haftada kaç gün vardır?',answer:'YEDİ',choices:['YEDİ','BEŞ','ON']},
        {text:'İlacı nereden satın alırsınız?',answer:'ECZANEDEN',choices:['ECZANEDEN','POSTANEDEN','GARAJDAN']} ],
    3:[ {text:'Tüm güller çiçekse, bir gül çiçek midir?',answer:'EVET',choices:['EVET','HAYIR','BAZEN']},
        {text:'"Hızlı"nın zıttı:',answer:'YAVAŞ',choices:['YAVAŞ','YÜKSEK SESLE','SIK SIK']},
        {text:'"Bardağın taştığı nokta" ne anlama gelir?',answer:'DAYANMA SINIRINA ULAŞMAK',choices:['DAYANMA SINIRINA ULAŞMAK','GÜNEŞLİ OLMAK','KAR YAĞMASI']},
        {text:"Ali, Ahmet'ten daha uzun. Kim daha kısa?",answer:'AHMET',choices:['AHMET','ALİ','İKİSİ DE','HİÇBİRİ']},
        {text:'"Sayfayı çevirmek" ne anlama gelir?',answer:'DEVAM ETMEK',choices:['DEVAM ETMEK','KİTAP OKUMAK','DİNLENMEK']},
        {text:'Hangi kelime meyve değildir?',answer:'HAVUÇ',choices:['HAVUÇ','KİRAZ','MUZ']} ]
  }},
  repetition:{ title:'Sesli tekrar edin', voice:true, items:{
    1:[ {word:'TOP'},{word:'MASA'},{word:'GÜNEŞ'},{word:'KEDİ'},{word:'KAPI'},{word:'ÇİÇEK'},{word:'EL'},{word:'SU'} ],
    2:[ {word:'BİLGİSAYAR'},{word:'ŞEMSİYE'},{word:'TELEFON'},{word:'KÜTÜPHANE'},{word:'RESTORAN'},{word:'DAĞ'},{word:'BAHÇIVAN'},{word:'TAKVİM'} ],
    3:[ {word:'HELİKOPTER'},{word:'FİZYOTERAPİST'},{word:'ANAYASAYA AYKIRI'},{word:'DÖRTGENLER PRİZMASI'},{word:'KULAK BURUN BOĞAZ UZMANI'},{word:'KASIMPATI'},{word:'YAKLAŞMAKTA OLAN'},{word:'İSTATİSTİKSEL OLARAK'} ]
  }},
  denomination_orale:{ title:'Sesli adlandırın', voice:true, items:{
    1:[ {emoji:'🐱',word:'KEDİ'},{emoji:'🍎',word:'ELMA'},{emoji:'🏠',word:'EV'},{emoji:'☀️',word:'GÜNEŞ'},{emoji:'🚗',word:'ARABA'},{emoji:'🌹',word:'ÇİÇEK'} ],
    2:[ {emoji:'🦋',word:'KELEBEK'},{emoji:'⌚',word:'KOL SAATİ'},{emoji:'🍄',word:'MANTAR'},{emoji:'🦒',word:'ZÜRAFA'},{emoji:'⛵',word:'YELKENLİ'},{emoji:'🎺',word:'TROMPET'} ],
    3:[ {emoji:'🧭',word:'PUSULA'},{emoji:'🦔',word:'KİRPİ'},{emoji:'⚓',word:'ÇAPA'},{emoji:'🔬',word:'MİKROSKOP'},{emoji:'🌪️',word:'HORTUM'},{emoji:'🛡️',word:'KALKAN'} ]
  }},
  fluence:{ title:'Sözel akıcılık', voice:true, fluency:true, items:{
    1:[ {cat:'hayvanlar',accept:['kedi','köpek','tavşan','at','inek','tavuk','koyun','domuz','kuş','balık','fare','aslan','kaplan','ayı','kurt','tilki','ördek','eşek','keçi','maymun','fil','zürafa','zebra','yılan','kurbağa']},
        {cat:'meyveler',accept:['elma','armut','muz','portakal','çilek','kiraz','üzüm','kivi','kavun','şeftali','kayısı','erik','limon','ananas','mango','ahududu','yaban mersini','karpuz','incir','mandalina']} ],
    2:[ {cat:'mutfak eşyaları',accept:['bıçak','çatal','kaşık','tabak','bardak','tencere','tava','fırın','buzdolabı','lavabo','masa','fincan','kase','süzgeç','spatula','kepçe','çaydanlık']},
        {cat:'kıyafetler',accept:['pantolon','gömlek','kazak','elbise','etek','palto','ceket','çorap','ayakkabı','atkı','eldiven','şapka','şort','tişört','kravat','kemer','bot','sandalet','külotlu çorap','hırka']} ],
    3:[ {cat:'B harfiyle başlayan kelimeler',accept:['balık','bardak','bahçe','bisiklet','balon','bebek','bal','buz','bilgisayar','banka','battaniye','bulut','burun','boya','büyük','beyaz','bacak','baba','buket']},
        {cat:'meslekler',accept:['doktor','fırıncı','itfaiyeci','öğretmen','hemşire','avukat','tesisatçı','ressam','aşçı','postacı','bahçıvan','kuaför','tamirci','eczacı','elektrikçi','mimar','gazeteci','polis','pilot','diş hekimi']} ]
  }},
  intonation:{ title:'Vurguyla tekrar edin', voice:true, items:{
    1:[ {word:'Bitirdin mi?',cue:'question'},
        {word:'Emin misin?',cue:'question'},
        {word:'Yarın geliyorum.',cue:'descriptive'},
        {word:'Burada yemek yiyorsun.',cue:'descriptive'},
        {word:'Buraya gel!',cue:'exclamative'},
        {word:'Ne güzel bir fikir!',cue:'exclamative'} ],
    2:[ {word:'Ne yapıyorsun?',cue:'question'},
        {word:'Gerçekten mi?',cue:'question'},
        {word:'Dışarıda oynuyor.',cue:'descriptive'},
        {word:'Bir arkadaşla konuşuyorlar.',cue:'descriptive'},
        {word:'Ne kadar güzelsin!',cue:'exclamative'},
        {word:'Ne sürpriz!',cue:'exclamative'} ],
    3:[ {word:'Dün gece iyi uyudunuz mu?',cue:'question'},
        {word:'Bunu taşımama yardım eder misiniz?',cue:'question'},
        {word:'Yarın sabah erken çıkacağız.',cue:'descriptive'},
        {word:'Siz uyurken postacı geldi.',cue:'descriptive'},
        {word:'Ne harika bir gün geçirdik!',cue:'exclamative'},
        {word:'Hâlâ inanamıyorum!',cue:'exclamative'} ]
  }}
};
