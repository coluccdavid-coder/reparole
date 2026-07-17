// =====================================================================
//  CONTENU DE L'EXERCICE "LIRE ET COMPRENDRE" — LANGUES COMPLÈTES
//  ---------------------------------------------------------------------
//  v6.143 : traduit dès la création de l'exercice (pas en 2 temps comme
//  "structure de phrase", v6.133 → v6.138) — signalé par l'utilisateur
//  la dernière fois : les traductions et l'aide doivent être complètes
//  dès l'ajout d'une nouvelle fonctionnalité, pas rattrapées après coup.
//  Même contenu que js/exercises-story.js (fr), traduit fidèlement —
//  contrairement aux rimes (non traduisibles), une petite histoire
//  garde son sens d'une langue à l'autre.
// =====================================================================
window.BANK_EN = window.BANK_EN || {};
window.BANK_EN.story = { items:{
  1:[
    {text:"The cat sleeps on the sofa. It naps every afternoon.\n\nWhere does the cat sleep?",answer:'ON THE SOFA',choices:['ON THE SOFA','IN THE GARDEN','UNDER THE TABLE']},
    {text:"Mary makes coffee. She drinks a cup every morning.\n\nWhat does Mary make?",answer:'COFFEE',choices:['COFFEE','TEA','CHOCOLATE']},
    {text:"It's raining today. Paul takes his umbrella before going out.\n\nWhat does Paul take before going out?",answer:'HIS UMBRELLA',choices:['HIS UMBRELLA','HIS HAT','HIS GLASSES']},
    {text:"The children play in the garden. They run after the ball.\n\nWhere do the children play?",answer:'IN THE GARDEN',choices:['IN THE GARDEN','IN THE HOUSE','AT SCHOOL']},
    {text:"The baker sells fresh bread. He opens his shop very early.\n\nWhat does the baker sell?",answer:'BREAD',choices:['BREAD','FLOWERS','BOOKS']},
    {text:"Sophie reads a book in the evening. She likes travel stories.\n\nWhen does Sophie read?",answer:'IN THE EVENING',choices:['IN THE EVENING','IN THE MORNING','AT NOON']}
  ],
  2:[
    {text:"The train leaves at 8 o'clock. Julien arrives at the station at 7:45, just in time.\n\nDoes Julien arrive late or on time?",answer:'ON TIME',choices:['ON TIME','LATE','2 HOURS EARLY']},
    {text:"It's very cold this morning. Emma puts on a warm coat and a scarf before leaving.\n\nWhy does Emma put on a coat?",answer:"IT'S COLD",choices:["IT'S COLD","IT'S RAINING","IT'S NIGHT"]},
    {text:"The shop closes at 6pm. It's 5:30pm when Laura arrives to buy bread.\n\nDoes Laura have time to shop?",answer:'YES',choices:['YES','NO','THE SHOP IS CLOSED']},
    {text:"Thomas has had a toothache for two days. He decides to call the dentist.\n\nWhy does Thomas call the dentist?",answer:'HE HAS A TOOTHACHE',choices:['HE HAS A TOOTHACHE','HE WANTS A CHECKUP','HE LOST A TOOTH']},
    {text:"The weather forecast says sunny for the weekend. The family plans a picnic in the park.\n\nWhat does the family plan?",answer:'A PICNIC',choices:['A PICNIC','A TRIP TO THE CINEMA','A JOURNEY']},
    {text:"Léa forgot her keys at the office. She has to wait for her husband to get home.\n\nWhy does Léa wait for her husband?",answer:'SHE FORGOT HER KEYS',choices:['SHE FORGOT HER KEYS','HER CAR BROKE DOWN','SHE HAS NO MONEY']}
  ],
  3:[
    {text:"The clothes shop has a sale this week. Prices are halved on every item.\n\nA jumper that cost £40 now costs how much?",answer:'£20',choices:['£20','£30','£10']},
    {text:"Every day, Marc waters his plants in the morning. Today it rained a lot, so he doesn't water them.\n\nWhy doesn't Marc water his plants today?",answer:'IT ALREADY RAINED',choices:['IT ALREADY RAINED','HE WENT ON HOLIDAY','THE PLANTS ARE DEAD']},
    {text:"The film starts at 8:30pm. It lasts two hours. Camille has to catch the last bus, which leaves at 11pm.\n\nWill Camille have time to catch her bus after the film?",answer:'YES',choices:['YES','NO','ONLY JUST']},
    {text:"The doctor prescribed a medicine to take three times a day, for 5 days. Today is the 3rd day of treatment.\n\nHow many days of treatment are left?",answer:'2 DAYS',choices:['2 DAYS','3 DAYS','5 DAYS']},
    {text:"Nina saves £10 every week to buy a bike that costs £100. She has already saved for 7 weeks.\n\nHow much money is Nina still short?",answer:'£30',choices:['£30','£70','£100']},
    {text:"The plane was due to take off at 2pm, but it's 1 hour late because of the weather. Passengers are waiting in the hall.\n\nWhat time will the plane take off?",answer:'3PM',choices:['3PM','1PM','2PM']}
  ]
}};
window.BANK_ES = window.BANK_ES || {};
window.BANK_ES.story = { items:{
  1:[
    {text:"El gato duerme en el sofá. Duerme la siesta cada tarde.\n\n¿Dónde duerme el gato?",answer:'EN EL SOFÁ',choices:['EN EL SOFÁ','EN EL JARDÍN','BAJO LA MESA']},
    {text:"María prepara café. Bebe una taza cada mañana.\n\n¿Qué prepara María?",answer:'CAFÉ',choices:['CAFÉ','TÉ','CHOCOLATE']},
    {text:"Hoy llueve. Pablo coge su paraguas antes de salir.\n\n¿Qué coge Pablo antes de salir?",answer:'SU PARAGUAS',choices:['SU PARAGUAS','SU SOMBRERO','SUS GAFAS']},
    {text:"Los niños juegan en el jardín. Corren detrás del balón.\n\n¿Dónde juegan los niños?",answer:'EN EL JARDÍN',choices:['EN EL JARDÍN','EN LA CASA','EN LA ESCUELA']},
    {text:"El panadero vende pan fresco. Abre su tienda muy temprano.\n\n¿Qué vende el panadero?",answer:'PAN',choices:['PAN','FLORES','LIBROS']},
    {text:"Sofía lee un libro por la noche. Le gustan las historias de viajes.\n\n¿Cuándo lee Sofía?",answer:'POR LA NOCHE',choices:['POR LA NOCHE','POR LA MAÑANA','AL MEDIODÍA']}
  ],
  2:[
    {text:"El tren sale a las 8. Julián llega a la estación a las 7:45, justo a tiempo.\n\n¿Julián llega tarde o a tiempo?",answer:'A TIEMPO',choices:['A TIEMPO','TARDE','2 HORAS ANTES']},
    {text:"Hace mucho frío esta mañana. Ema se pone un abrigo grueso y una bufanda antes de salir.\n\n¿Por qué se pone Ema un abrigo?",answer:'HACE FRÍO',choices:['HACE FRÍO','LLUEVE','ES DE NOCHE']},
    {text:"La tienda cierra a las 18h. Son las 17:30 cuando Laura llega a comprar pan.\n\n¿Tiene Laura tiempo para hacer la compra?",answer:'SÍ',choices:['SÍ','NO','LA TIENDA ESTÁ CERRADA']},
    {text:"A Tomás le duelen las muelas desde hace dos días. Decide llamar al dentista.\n\n¿Por qué llama Tomás al dentista?",answer:'LE DUELEN LAS MUELAS',choices:['LE DUELEN LAS MUELAS','QUIERE UNA REVISIÓN','PERDIÓ UN DIENTE']},
    {text:"El pronóstico anuncia sol para el fin de semana. La familia planea un pícnic en el parque.\n\n¿Qué planea la familia?",answer:'UN PÍCNIC',choices:['UN PÍCNIC','UNA SALIDA AL CINE','UN VIAJE']},
    {text:"Lea olvidó sus llaves en la oficina. Tiene que esperar a su marido para entrar.\n\n¿Por qué espera Lea a su marido?",answer:'OLVIDÓ SUS LLAVES',choices:['OLVIDÓ SUS LLAVES','SU COCHE SE AVERIÓ','NO TIENE DINERO']}
  ],
  3:[
    {text:"La tienda de ropa tiene rebajas esta semana. Los precios han bajado a la mitad en todos los artículos.\n\n¿Cuánto cuesta ahora un jersey que costaba 40€?",answer:'20€',choices:['20€','30€','10€']},
    {text:"Cada día, Marcos riega sus plantas por la mañana. Hoy ha llovido mucho, así que no las riega.\n\n¿Por qué no riega Marcos sus plantas hoy?",answer:'YA HA LLOVIDO',choices:['YA HA LLOVIDO','SE FUE DE VACACIONES','LAS PLANTAS HAN MUERTO']},
    {text:"La película empieza a las 20:30. Dura dos horas. Camila debe coger el último autobús, que sale a las 23h.\n\n¿Tendrá Camila tiempo de coger su autobús después de la película?",answer:'SÍ',choices:['SÍ','NO','MUY JUSTO']},
    {text:"El médico recetó un medicamento para tomar tres veces al día, durante 5 días. Hoy es el 3er día del tratamiento.\n\n¿Cuántos días de tratamiento quedan?",answer:'2 DÍAS',choices:['2 DÍAS','3 DÍAS','5 DÍAS']},
    {text:"Nina ahorra 10 euros cada semana para comprarse una bici que cuesta 100 euros. Ya ha ahorrado durante 7 semanas.\n\n¿Cuánto dinero le falta a Nina?",answer:'30 EUROS',choices:['30 EUROS','70 EUROS','100 EUROS']},
    {text:"El avión debía despegar a las 14h, pero lleva 1 hora de retraso por el tiempo. Los pasajeros esperan en la sala.\n\n¿A qué hora despegará el avión?",answer:'15H',choices:['15H','13H','14H']}
  ]
}};
window.BANK_IT = window.BANK_IT || {};
window.BANK_IT.story = { items:{
  1:[
    {text:"Il gatto dorme sul divano. Fa un pisolino ogni pomeriggio.\n\nDove dorme il gatto?",answer:'SUL DIVANO',choices:['SUL DIVANO','IN GIARDINO','SOTTO IL TAVOLO']},
    {text:"Maria prepara il caffè. Beve una tazza ogni mattina.\n\nCosa prepara Maria?",answer:'IL CAFFÈ',choices:['IL CAFFÈ','IL TÈ','LA CIOCCOLATA']},
    {text:"Oggi piove. Paolo prende l'ombrello prima di uscire.\n\nCosa prende Paolo prima di uscire?",answer:"L'OMBRELLO",choices:["L'OMBRELLO","IL CAPPELLO","GLI OCCHIALI"]},
    {text:"I bambini giocano in giardino. Corrono dietro al pallone.\n\nDove giocano i bambini?",answer:'IN GIARDINO',choices:['IN GIARDINO','IN CASA','A SCUOLA']},
    {text:"Il panettiere vende pane fresco. Apre il negozio molto presto.\n\nCosa vende il panettiere?",answer:'IL PANE',choices:['IL PANE','I FIORI','I LIBRI']},
    {text:"Sofia legge un libro la sera. Le piacciono le storie di viaggio.\n\nQuando legge Sofia?",answer:'LA SERA',choices:['LA SERA','LA MATTINA','A MEZZOGIORNO']}
  ],
  2:[
    {text:"Il treno parte alle 8. Giulio arriva in stazione alle 7:45, appena in tempo.\n\nGiulio arriva in ritardo o in orario?",answer:'IN ORARIO',choices:['IN ORARIO','IN RITARDO','2 ORE PRIMA']},
    {text:"Fa molto freddo stamattina. Emma indossa un cappotto pesante e una sciarpa prima di uscire.\n\nPerché Emma indossa un cappotto?",answer:'FA FREDDO',choices:['FA FREDDO','PIOVE','È NOTTE']},
    {text:"Il negozio chiude alle 18. Sono le 17:30 quando Laura arriva per comprare il pane.\n\nLaura ha il tempo di fare la spesa?",answer:'SÌ',choices:['SÌ','NO','IL NEGOZIO È CHIUSO']},
    {text:"Tommaso ha mal di denti da due giorni. Decide di chiamare il dentista.\n\nPerché Tommaso chiama il dentista?",answer:'HA MAL DI DENTI',choices:['HA MAL DI DENTI','VUOLE UN CONTROLLO','HA PERSO UN DENTE']},
    {text:"Le previsioni annunciano sole per il weekend. La famiglia organizza un picnic al parco.\n\nCosa organizza la famiglia?",answer:'UN PICNIC',choices:['UN PICNIC','UNA USCITA AL CINEMA','UN VIAGGIO']},
    {text:"Lea ha dimenticato le chiavi in ufficio. Deve aspettare suo marito per entrare.\n\nPerché Lea aspetta suo marito?",answer:'HA DIMENTICATO LE CHIAVI',choices:['HA DIMENTICATO LE CHIAVI','LA SUA AUTO SI È ROTTA','NON HA SOLDI']}
  ],
  3:[
    {text:"Il negozio di abbigliamento fa i saldi questa settimana. I prezzi sono dimezzati su tutti gli articoli.\n\nUn maglione che costava 40€ ora costa quanto?",answer:'20€',choices:['20€','30€','10€']},
    {text:"Ogni giorno, Marco innaffia le piante al mattino. Oggi ha piovuto molto, quindi non le innaffia.\n\nPerché Marco non innaffia le piante oggi?",answer:'HA GIÀ PIOVUTO',choices:['HA GIÀ PIOVUTO','È ANDATO IN VACANZA','LE PIANTE SONO MORTE']},
    {text:"Il film inizia alle 20:30. Dura due ore. Camilla deve prendere l'ultimo autobus, che parte alle 23.\n\nCamilla farà in tempo a prendere l'autobus dopo il film?",answer:'SÌ',choices:['SÌ','NO','GIUSTO IN TEMPO']},
    {text:"Il medico ha prescritto una medicina da prendere tre volte al giorno, per 5 giorni. Oggi è il 3° giorno di cura.\n\nQuanti giorni di cura restano?",answer:'2 GIORNI',choices:['2 GIORNI','3 GIORNI','5 GIORNI']},
    {text:"Nina risparmia 10 euro ogni settimana per comprarsi una bici che costa 100 euro. Ha già risparmiato per 7 settimane.\n\nQuanti soldi mancano a Nina?",answer:'30 EURO',choices:['30 EURO','70 EURO','100 EURO']},
    {text:"L'aereo doveva decollare alle 14, ma ha 1 ora di ritardo per il maltempo. I passeggeri aspettano in sala.\n\nA che ora decollerà l'aereo?",answer:'15',choices:['15','13','14']}
  ]
}};
window.BANK_PT = window.BANK_PT || {};
window.BANK_PT.story = { items:{
  1:[
    {text:"O gato dorme no sofá. Faz a sesta todas as tardes.\n\nOnde dorme o gato?",answer:'NO SOFÁ',choices:['NO SOFÁ','NO JARDIM','DEBAIXO DA MESA']},
    {text:"A Maria prepara café. Bebe uma chávena todas as manhãs.\n\nO que prepara a Maria?",answer:'CAFÉ',choices:['CAFÉ','CHÁ','CHOCOLATE']},
    {text:"Hoje está a chover. O Paulo leva o guarda-chuva antes de sair.\n\nO que leva o Paulo antes de sair?",answer:'O GUARDA-CHUVA',choices:['O GUARDA-CHUVA','O CHAPÉU','OS ÓCULOS']},
    {text:"As crianças brincam no jardim. Correm atrás da bola.\n\nOnde brincam as crianças?",answer:'NO JARDIM',choices:['NO JARDIM','EM CASA','NA ESCOLA']},
    {text:"O padeiro vende pão fresco. Abre a loja muito cedo.\n\nO que vende o padeiro?",answer:'PÃO',choices:['PÃO','FLORES','LIVROS']},
    {text:"A Sofia lê um livro à noite. Gosta de histórias de viagens.\n\nQuando lê a Sofia?",answer:'À NOITE',choices:['À NOITE','DE MANHÃ','AO MEIO-DIA']}
  ],
  2:[
    {text:"O comboio parte às 8 horas. O Júlio chega à estação às 7h45, mesmo a tempo.\n\nO Júlio chega atrasado ou a tempo?",answer:'A TEMPO',choices:['A TEMPO','ATRASADO','2 HORAS ANTES']},
    {text:"Está muito frio esta manhã. A Emma veste um casaco quente e um cachecol antes de sair.\n\nPor que veste a Emma um casaco?",answer:'ESTÁ FRIO',choices:['ESTÁ FRIO','ESTÁ A CHOVER','É DE NOITE']},
    {text:"A loja fecha às 18h. São 17h30 quando a Laura chega para comprar pão.\n\nA Laura tem tempo de fazer compras?",answer:'SIM',choices:['SIM','NÃO','A LOJA ESTÁ FECHADA']},
    {text:"O Tomás tem dor de dentes há dois dias. Decide ligar ao dentista.\n\nPor que liga o Tomás ao dentista?",answer:'TEM DOR DE DENTES',choices:['TEM DOR DE DENTES','QUER UMA REVISÃO','PERDEU UM DENTE']},
    {text:"A previsão anuncia sol para o fim de semana. A família planeia um piquenique no parque.\n\nO que planeia a família?",answer:'UM PIQUENIQUE',choices:['UM PIQUENIQUE','UMA IDA AO CINEMA','UMA VIAGEM']},
    {text:"A Lea esqueceu-se das chaves no escritório. Tem de esperar pelo marido para entrar.\n\nPor que espera a Lea pelo marido?",answer:'ESQUECEU-SE DAS CHAVES',choices:['ESQUECEU-SE DAS CHAVES','O CARRO AVARIOU','NÃO TEM DINHEIRO']}
  ],
  3:[
    {text:"A loja de roupa tem saldos esta semana. Os preços baixaram para metade em todos os artigos.\n\nUma camisola que custava 40€ custa agora quanto?",answer:'20€',choices:['20€','30€','10€']},
    {text:"Todos os dias, o Marco rega as plantas de manhã. Hoje choveu muito, por isso não as rega.\n\nPor que não rega o Marco as plantas hoje?",answer:'JÁ CHOVEU',choices:['JÁ CHOVEU','FOI DE FÉRIAS','AS PLANTAS MORRERAM']},
    {text:"O filme começa às 20h30. Dura duas horas. A Camila tem de apanhar o último autocarro, que parte às 23h.\n\nA Camila terá tempo de apanhar o autocarro depois do filme?",answer:'SIM',choices:['SIM','NÃO','MUITO À JUSTA']},
    {text:"O médico receitou um medicamento para tomar três vezes por dia, durante 5 dias. Hoje é o 3º dia de tratamento.\n\nQuantos dias de tratamento faltam?",answer:'2 DIAS',choices:['2 DIAS','3 DIAS','5 DIAS']},
    {text:"A Nina poupa 10 euros todas as semanas para comprar uma bicicleta que custa 100 euros. Já poupou durante 7 semanas.\n\nQuanto dinheiro falta à Nina?",answer:'30 EUROS',choices:['30 EUROS','70 EUROS','100 EUROS']},
    {text:"O avião devia descolar às 14h, mas está 1 hora atrasado por causa do tempo. Os passageiros esperam na sala.\n\nA que horas vai o avião descolar?",answer:'15H',choices:['15H','13H','14H']}
  ]
}};
window.BANK_DE = window.BANK_DE || {};
window.BANK_DE.story = { items:{
  1:[
    {text:"Die Katze schläft auf dem Sofa. Sie macht jeden Nachmittag ein Nickerchen.\n\nWo schläft die Katze?",answer:'AUF DEM SOFA',choices:['AUF DEM SOFA','IM GARTEN','UNTER DEM TISCH']},
    {text:"Marie macht Kaffee. Sie trinkt jeden Morgen eine Tasse.\n\nWas macht Marie?",answer:'KAFFEE',choices:['KAFFEE','TEE','SCHOKOLADE']},
    {text:"Heute regnet es. Paul nimmt seinen Regenschirm mit, bevor er rausgeht.\n\nWas nimmt Paul mit, bevor er rausgeht?",answer:'SEINEN REGENSCHIRM',choices:['SEINEN REGENSCHIRM','SEINEN HUT','SEINE BRILLE']},
    {text:"Die Kinder spielen im Garten. Sie laufen dem Ball hinterher.\n\nWo spielen die Kinder?",answer:'IM GARTEN',choices:['IM GARTEN','IM HAUS','IN DER SCHULE']},
    {text:"Der Bäcker verkauft frisches Brot. Er öffnet sein Geschäft sehr früh.\n\nWas verkauft der Bäcker?",answer:'BROT',choices:['BROT','BLUMEN','BÜCHER']},
    {text:"Sophie liest abends ein Buch. Sie mag Reisegeschichten.\n\nWann liest Sophie?",answer:'ABENDS',choices:['ABENDS','MORGENS','MITTAGS']}
  ],
  2:[
    {text:"Der Zug fährt um 8 Uhr ab. Julian kommt um 7:45 Uhr am Bahnhof an, gerade rechtzeitig.\n\nKommt Julian zu spät oder pünktlich an?",answer:'PÜNKTLICH',choices:['PÜNKTLICH','ZU SPÄT','2 STUNDEN ZU FRÜH']},
    {text:"Es ist heute Morgen sehr kalt. Emma zieht einen warmen Mantel und einen Schal an, bevor sie geht.\n\nWarum zieht Emma einen Mantel an?",answer:'ES IST KALT',choices:['ES IST KALT','ES REGNET','ES IST NACHT']},
    {text:"Das Geschäft schließt um 18 Uhr. Es ist 17:30 Uhr, als Laura ankommt, um Brot zu kaufen.\n\nHat Laura Zeit einzukaufen?",answer:'JA',choices:['JA','NEIN','DAS GESCHÄFT IST GESCHLOSSEN']},
    {text:"Thomas hat seit zwei Tagen Zahnschmerzen. Er beschließt, den Zahnarzt anzurufen.\n\nWarum ruft Thomas den Zahnarzt an?",answer:'ER HAT ZAHNSCHMERZEN',choices:['ER HAT ZAHNSCHMERZEN','ER WILL EINE KONTROLLE','ER HAT EINEN ZAHN VERLOREN']},
    {text:"Der Wetterbericht sagt Sonne fürs Wochenende voraus. Die Familie plant ein Picknick im Park.\n\nWas plant die Familie?",answer:'EIN PICKNICK',choices:['EIN PICKNICK','EINEN KINOBESUCH','EINE REISE']},
    {text:"Léa hat ihre Schlüssel im Büro vergessen. Sie muss auf ihren Mann warten, um hineinzukommen.\n\nWarum wartet Léa auf ihren Mann?",answer:'SIE HAT IHRE SCHLÜSSEL VERGESSEN',choices:['SIE HAT IHRE SCHLÜSSEL VERGESSEN','IHR AUTO IST KAPUTT','SIE HAT KEIN GELD']}
  ],
  3:[
    {text:"Das Kleidergeschäft hat diese Woche Ausverkauf. Die Preise sind bei allen Artikeln um die Hälfte gesunken.\n\nEin Pullover, der 40€ kostete, kostet jetzt wie viel?",answer:'20€',choices:['20€','30€','10€']},
    {text:"Jeden Tag gießt Marc morgens seine Pflanzen. Heute hat es stark geregnet, also gießt er sie nicht.\n\nWarum gießt Marc seine Pflanzen heute nicht?",answer:'ES HAT SCHON GEREGNET',choices:['ES HAT SCHON GEREGNET','ER IST IM URLAUB','DIE PFLANZEN SIND TOT']},
    {text:"Der Film beginnt um 20:30 Uhr. Er dauert zwei Stunden. Camille muss den letzten Bus nehmen, der um 23 Uhr fährt.\n\nHat Camille nach dem Film Zeit, ihren Bus zu nehmen?",answer:'JA',choices:['JA','NEIN','GERADE NOCH']},
    {text:"Der Arzt hat ein Medikament verschrieben, das dreimal täglich für 5 Tage einzunehmen ist. Heute ist der 3. Tag der Behandlung.\n\nWie viele Behandlungstage bleiben noch?",answer:'2 TAGE',choices:['2 TAGE','3 TAGE','5 TAGE']},
    {text:"Nina spart jede Woche 10 Euro, um sich ein Fahrrad zu kaufen, das 100 Euro kostet. Sie hat bereits 7 Wochen lang gespart.\n\nWie viel Geld fehlt Nina noch?",answer:'30 EURO',choices:['30 EURO','70 EURO','100 EURO']},
    {text:"Das Flugzeug sollte um 14 Uhr starten, hat aber wegen des Wetters 1 Stunde Verspätung. Die Passagiere warten in der Halle.\n\nUm wie viel Uhr wird das Flugzeug starten?",answer:'15 UHR',choices:['15 UHR','13 UHR','14 UHR']}
  ]
}};
window.BANK_AR = window.BANK_AR || {};
window.BANK_AR.story = { items:{
  1:[
    {text:"القطة تنام على الأريكة. تأخذ قيلولة كل بعد ظهر.\n\nأين تنام القطة؟",answer:'على الأريكة',choices:['على الأريكة','في الحديقة','تحت الطاولة']},
    {text:"ماري تحضّر القهوة. تشرب كوبًا كل صباح.\n\nماذا تحضّر ماري؟",answer:'القهوة',choices:['القهوة','الشاي','الشوكولاتة']},
    {text:"الجو ممطر اليوم. بول يأخذ مظلته قبل الخروج.\n\nماذا يأخذ بول قبل الخروج؟",answer:'مظلته',choices:['مظلته','قبعته','نظارته']},
    {text:"الأطفال يلعبون في الحديقة. يجرون خلف الكرة.\n\nأين يلعب الأطفال؟",answer:'في الحديقة',choices:['في الحديقة','في المنزل','في المدرسة']},
    {text:"الخبّاز يبيع خبزًا طازجًا. يفتح متجره باكرًا جدًا.\n\nماذا يبيع الخبّاز؟",answer:'الخبز',choices:['الخبز','الزهور','الكتب']},
    {text:"صوفي تقرأ كتابًا في المساء. تحب قصص السفر.\n\nمتى تقرأ صوفي؟",answer:'في المساء',choices:['في المساء','في الصباح','في الظهيرة']}
  ],
  2:[
    {text:"القطار يغادر الساعة 8. جوليان يصل إلى المحطة الساعة 7:45، في الوقت المناسب تمامًا.\n\nهل وصل جوليان متأخرًا أم في الوقت المحدد؟",answer:'في الوقت المحدد',choices:['في الوقت المحدد','متأخرًا','قبل ساعتين']},
    {text:"الجو بارد جدًا هذا الصباح. إيما ترتدي معطفًا سميكًا ووشاحًا قبل الخروج.\n\nلماذا ترتدي إيما معطفًا؟",answer:'الجو بارد',choices:['الجو بارد','الجو ممطر','الوقت ليل']},
    {text:"المتجر يغلق الساعة 18:00. الساعة 17:30 عندما تصل لورا لشراء الخبز.\n\nهل لدى لورا وقت للتسوق؟",answer:'نعم',choices:['نعم','لا','المتجر مغلق']},
    {text:"توما يعاني من ألم في الأسنان منذ يومين. يقرر الاتصال بطبيب الأسنان.\n\nلماذا يتصل توما بطبيب الأسنان؟",answer:'لديه ألم في الأسنان',choices:['لديه ألم في الأسنان','يريد فحصًا','فقد سنًا']},
    {text:"تتوقع النشرة الجوية شمسًا في نهاية الأسبوع. العائلة تخطط لنزهة في الحديقة العامة.\n\nماذا تخطط العائلة؟",answer:'نزهة',choices:['نزهة','خروجًا للسينما','رحلة']},
    {text:"ليا نسيت مفاتيحها في المكتب. عليها انتظار زوجها لتدخل.\n\nلماذا تنتظر ليا زوجها؟",answer:'نسيت مفاتيحها',choices:['نسيت مفاتيحها','سيارتها معطلة','ليس لديها مال']}
  ],
  3:[
    {text:"متجر الملابس يقيم تخفيضات هذا الأسبوع. انخفضت الأسعار إلى النصف على جميع القطع.\n\nكنزة كانت تكلف 40 يورو، كم تكلف الآن؟",answer:'20 يورو',choices:['20 يورو','30 يورو','10 يورو']},
    {text:"كل يوم، يسقي مارك نباتاته في الصباح. اليوم أمطرت كثيرًا، لذلك لا يسقيها.\n\nلماذا لا يسقي مارك نباتاته اليوم؟",answer:'لأنها أمطرت بالفعل',choices:['لأنها أمطرت بالفعل','لأنه في عطلة','لأن النباتات ماتت']},
    {text:"الفيلم يبدأ الساعة 20:30 ويستمر ساعتين. يجب على كاميل أخذ آخر حافلة تغادر الساعة 23:00.\n\nهل سيكون لدى كاميل وقت للحاق بالحافلة بعد الفيلم؟",answer:'نعم',choices:['نعم','لا','بالكاد']},
    {text:"وصف الطبيب دواءً يؤخذ ثلاث مرات يوميًا لمدة 5 أيام. اليوم هو اليوم الثالث من العلاج.\n\nكم يومًا من العلاج تبقى؟",answer:'يومان',choices:['يومان','3 أيام','5 أيام']},
    {text:"نينا توفّر 10 يورو كل أسبوع لشراء دراجة تكلف 100 يورو. وفّرت بالفعل لمدة 7 أسابيع.\n\nكم من المال ينقص نينا؟",answer:'30 يورو',choices:['30 يورو','70 يورو','100 يورو']},
    {text:"كان من المفترض أن تقلع الطائرة الساعة 14:00، لكنها تأخرت ساعة بسبب الطقس. الركاب ينتظرون في الصالة.\n\nفي أي ساعة ستقلع الطائرة؟",answer:'15:00',choices:['15:00','13:00','14:00']}
  ]
}};
window.BANK_TR = window.BANK_TR || {};
window.BANK_TR.story = { items:{
  1:[
    {text:"Kedi kanepede uyur. Her öğleden sonra kestirir.\n\nKedi nerede uyur?",answer:'KANEPEDE',choices:['KANEPEDE','BAHÇEDE','MASANIN ALTINDA']},
    {text:"Marie kahve yapar. Her sabah bir fincan içer.\n\nMarie ne yapar?",answer:'KAHVE',choices:['KAHVE','ÇAY','ÇİKOLATA']},
    {text:"Bugün yağmur yağıyor. Paul dışarı çıkmadan önce şemsiyesini alır.\n\nPaul dışarı çıkmadan önce ne alır?",answer:'ŞEMSİYESİNİ',choices:['ŞEMSİYESİNİ','ŞAPKASINI','GÖZLÜĞÜNÜ']},
    {text:"Çocuklar bahçede oynar. Topun peşinden koşarlar.\n\nÇocuklar nerede oynar?",answer:'BAHÇEDE',choices:['BAHÇEDE','EVDE','OKULDA']},
    {text:"Fırıncı taze ekmek satar. Dükkanını çok erken açar.\n\nFırıncı ne satar?",answer:'EKMEK',choices:['EKMEK','ÇİÇEK','KİTAP']},
    {text:"Sophie akşamları kitap okur. Seyahat hikayelerini sever.\n\nSophie ne zaman okur?",answer:'AKŞAMLARI',choices:['AKŞAMLARI','SABAHLARI','ÖĞLEN']}
  ],
  2:[
    {text:"Tren saat 8'de kalkıyor. Julien istasyona 7:45'te, tam zamanında varıyor.\n\nJulien geç mi kalıyor yoksa vaktinde mi geliyor?",answer:'VAKTİNDE',choices:['VAKTİNDE','GEÇ','2 SAAT ERKEN']},
    {text:"Bu sabah hava çok soğuk. Emma çıkmadan önce kalın bir palto ve atkı giyiyor.\n\nEmma neden palto giyiyor?",answer:'HAVA SOĞUK',choices:['HAVA SOĞUK','YAĞMUR YAĞIYOR','GECE OLDU']},
    {text:"Mağaza saat 18:00'de kapanıyor. Laura ekmek almak için 17:30'da geliyor.\n\nLaura'nın alışveriş için vakti var mı?",answer:'EVET',choices:['EVET','HAYIR','MAĞAZA KAPALI']},
    {text:"Thomas iki gündür diş ağrısı çekiyor. Dişçiyi aramaya karar veriyor.\n\nThomas neden dişçiyi arıyor?",answer:'DİŞ AĞRISI VAR',choices:['DİŞ AĞRISI VAR','KONTROL İSTİYOR','BİR DİŞİNİ KAYBETTİ']},
    {text:"Hava durumu hafta sonu için güneş açıklıyor. Aile parkta piknik planlıyor.\n\nAile ne planlıyor?",answer:'BİR PİKNİK',choices:['BİR PİKNİK','SİNEMAYA GİTMEYİ','BİR GEZİ']},
    {text:"Léa anahtarlarını ofiste unuttu. İçeri girmek için kocasını beklemesi gerekiyor.\n\nLéa neden kocasını bekliyor?",answer:'ANAHTARLARINI UNUTTU',choices:['ANAHTARLARINI UNUTTU','ARABASI BOZULDU','PARASI YOK']}
  ],
  3:[
    {text:"Giyim mağazasında bu hafta indirim var. Tüm ürünlerde fiyatlar yarı yarıya düştü.\n\n40€ olan bir kazak şimdi kaç € oldu?",answer:'20€',choices:['20€','30€','10€']},
    {text:"Marc her gün sabahları bitkilerini sular. Bugün çok yağmur yağdı, bu yüzden sulamıyor.\n\nMarc bugün bitkilerini neden sulamıyor?",answer:'ZATEN YAĞMUR YAĞDI',choices:['ZATEN YAĞMUR YAĞDI','TATİLE GİTTİ','BİTKİLER ÖLDÜ']},
    {text:"Film saat 20:30'da başlıyor. İki saat sürüyor. Camille son otobüsü yakalamalı, saat 23:00'te kalkıyor.\n\nCamille filmden sonra otobüsünü yakalamak için vakti olacak mı?",answer:'EVET',choices:['EVET','HAYIR','ÇOK ZOR YETİŞİR']},
    {text:"Doktor günde üç kez, 5 gün boyunca alınacak bir ilaç yazdı. Bugün tedavinin 3. günü.\n\nKaç gün tedavi kaldı?",answer:'2 GÜN',choices:['2 GÜN','3 GÜN','5 GÜN']},
    {text:"Nina, 100€ değerinde bir bisiklet almak için her hafta 10€ biriktiriyor. Zaten 7 haftadır biriktiriyor.\n\nNina'nın ne kadar parası eksik?",answer:'30€',choices:['30€','70€','100€']},
    {text:"Uçak saat 14:00'te kalkacaktı ama hava nedeniyle 1 saat gecikti. Yolcular salonda bekliyor.\n\nUçak saat kaçta kalkacak?",answer:'15:00',choices:['15:00','13:00','14:00']}
  ]
}};
window.BANK_PL = window.BANK_PL || {};
window.BANK_PL.story = { items:{
  1:[
    {text:"Kot śpi na kanapie. Drzemie każdego popołudnia.\n\nGdzie śpi kot?",answer:'NA KANAPIE',choices:['NA KANAPIE','W OGRODZIE','POD STOŁEM']},
    {text:"Maria robi kawę. Pije filiżankę każdego ranka.\n\nCo robi Maria?",answer:'KAWĘ',choices:['KAWĘ','HERBATĘ','CZEKOLADĘ']},
    {text:"Dziś pada deszcz. Paweł bierze parasol przed wyjściem.\n\nCo bierze Paweł przed wyjściem?",answer:'PARASOL',choices:['PARASOL','KAPELUSZ','OKULARY']},
    {text:"Dzieci bawią się w ogrodzie. Biegają za piłką.\n\nGdzie bawią się dzieci?",answer:'W OGRODZIE',choices:['W OGRODZIE','W DOMU','W SZKOLE']},
    {text:"Piekarz sprzedaje świeży chleb. Otwiera sklep bardzo wcześnie.\n\nCo sprzedaje piekarz?",answer:'CHLEB',choices:['CHLEB','KWIATY','KSIĄŻKI']},
    {text:"Zofia czyta książkę wieczorem. Lubi historie o podróżach.\n\nKiedy czyta Zofia?",answer:'WIECZOREM',choices:['WIECZOREM','RANO','W POŁUDNIE']}
  ],
  2:[
    {text:"Pociąg odjeżdża o 8. Julian przyjeżdża na dworzec o 7:45, w samą porę.\n\nCzy Julian przyjeżdża spóźniony czy na czas?",answer:'NA CZAS',choices:['NA CZAS','SPÓŹNIONY','2 GODZINY WCZEŚNIEJ']},
    {text:"Dziś rano jest bardzo zimno. Emma zakłada ciepły płaszcz i szalik przed wyjściem.\n\nDlaczego Emma zakłada płaszcz?",answer:'JEST ZIMNO',choices:['JEST ZIMNO','PADA DESZCZ','JEST NOC']},
    {text:"Sklep zamyka się o 18:00. Jest 17:30, gdy Laura przychodzi kupić chleb.\n\nCzy Laura ma czas na zakupy?",answer:'TAK',choices:['TAK','NIE','SKLEP JEST ZAMKNIĘTY']},
    {text:"Tomasz ma ból zęba od dwóch dni. Postanawia zadzwonić do dentysty.\n\nDlaczego Tomasz dzwoni do dentysty?",answer:'BOLI GO ZĄB',choices:['BOLI GO ZĄB','CHCE KONTROLI','STRACIŁ ZĄB']},
    {text:"Prognoza zapowiada słońce na weekend. Rodzina planuje piknik w parku.\n\nCo planuje rodzina?",answer:'PIKNIK',choices:['PIKNIK','WYJŚCIE DO KINA','PODRÓŻ']},
    {text:"Lea zapomniała kluczy w biurze. Musi czekać na męża, żeby wejść.\n\nDlaczego Lea czeka na męża?",answer:'ZAPOMNIAŁA KLUCZY',choices:['ZAPOMNIAŁA KLUCZY','JEJ SAMOCHÓD SIĘ ZEPSUŁ','NIE MA PIENIĘDZY']}
  ],
  3:[
    {text:"Sklep odzieżowy ma wyprzedaż w tym tygodniu. Ceny spadły o połowę na wszystkie produkty.\n\nIle kosztuje teraz sweter, który kosztował 40€?",answer:'20€',choices:['20€','30€','10€']},
    {text:"Codziennie Marek podlewa rośliny rano. Dziś mocno padało, więc ich nie podlewa.\n\nDlaczego Marek nie podlewa dziś roślin?",answer:'JUŻ PADAŁO',choices:['JUŻ PADAŁO','WYJECHAŁ NA WAKACJE','ROŚLINY UMARŁY']},
    {text:"Film zaczyna się o 20:30. Trwa dwie godziny. Kamila musi zdążyć na ostatni autobus, który odjeżdża o 23:00.\n\nCzy Kamila zdąży na autobus po filmie?",answer:'TAK',choices:['TAK','NIE','LEDWO']},
    {text:"Lekarz przepisał lek do brania trzy razy dziennie przez 5 dni. Dziś jest 3. dzień leczenia.\n\nIle dni leczenia zostało?",answer:'2 DNI',choices:['2 DNI','3 DNI','5 DNI']},
    {text:"Nina oszczędza 10 euro co tydzień na rower za 100 euro. Oszczędza już od 7 tygodni.\n\nIle pieniędzy brakuje Ninie?",answer:'30 EURO',choices:['30 EURO','70 EURO','100 EURO']},
    {text:"Samolot miał wystartować o 14:00, ale ma godzinę opóźnienia z powodu pogody. Pasażerowie czekają w hali.\n\nO której godzinie wystartuje samolot?",answer:'15:00',choices:['15:00','13:00','14:00']}
  ]
}};
window.BANK_JA = window.BANK_JA || {};
window.BANK_JA.story = { items:{
  1:[
    {text:"猫はソファで眠ります。毎日午後にお昼寝をします。\n\n猫はどこで眠りますか？",answer:'ソファで',choices:['ソファで','庭で','テーブルの下で']},
    {text:"マリーはコーヒーを入れます。毎朝一杯飲みます。\n\nマリーは何を入れますか？",answer:'コーヒー',choices:['コーヒー','紅茶','ココア']},
    {text:"今日は雨です。ポールは出かける前に傘を持ちます。\n\nポールは出かける前に何を持ちますか？",answer:'傘',choices:['傘','帽子','眼鏡']},
    {text:"子どもたちは庭で遊びます。ボールを追いかけて走ります。\n\n子どもたちはどこで遊びますか？",answer:'庭で',choices:['庭で','家の中で','学校で']},
    {text:"パン屋は焼きたてのパンを売ります。とても早く店を開けます。\n\nパン屋は何を売りますか？",answer:'パン',choices:['パン','花','本']},
    {text:"ソフィーは夜に本を読みます。旅の物語が好きです。\n\nソフィーはいつ読みますか？",answer:'夜に',choices:['夜に','朝に','昼に']}
  ],
  2:[
    {text:"電車は8時に出発します。ジュリアンは7時45分に駅に着き、ちょうど間に合いました。\n\nジュリアンは遅刻ですか、それとも時間通りですか？",answer:'時間通り',choices:['時間通り','遅刻','2時間早い']},
    {text:"今朝はとても寒いです。エマは出かける前に厚いコートとマフラーを着けます。\n\nエマはなぜコートを着けますか？",answer:'寒いから',choices:['寒いから','雨だから','夜だから']},
    {text:"店は18時に閉まります。ローラがパンを買いに来たのは17時30分でした。\n\nローラは買い物をする時間がありますか？",answer:'はい',choices:['はい','いいえ','店は閉まっている']},
    {text:"トマは2日前から歯が痛いです。歯医者に電話することにします。\n\nトマはなぜ歯医者に電話しますか？",answer:'歯が痛いから',choices:['歯が痛いから','検診を受けたいから','歯を失ったから']},
    {text:"天気予報は週末晴れると言っています。家族は公園でピクニックを計画しています。\n\n家族は何を計画していますか？",answer:'ピクニック',choices:['ピクニック','映画に行くこと','旅行']},
    {text:"レアはオフィスに鍵を忘れました。入るために夫を待たなければなりません。\n\nレアはなぜ夫を待っていますか？",answer:'鍵を忘れたから',choices:['鍵を忘れたから','車が故障したから','お金がないから']}
  ],
  3:[
    {text:"洋服店は今週セールをしています。すべての商品が半額になっています。\n\n40ユーロだったセーターは今いくらですか？",answer:'20ユーロ',choices:['20ユーロ','30ユーロ','10ユーロ']},
    {text:"マルクは毎日朝に植物に水をやります。今日はたくさん雨が降ったので、水をやりません。\n\nマルクはなぜ今日植物に水をやりませんか？",answer:'すでに雨が降ったから',choices:['すでに雨が降ったから','休暇に行ったから','植物が枯れたから']},
    {text:"映画は20時30分に始まります。2時間続きます。カミーユは23時発の最終バスに乗らなければなりません。\n\nカミーユは映画の後バスに間に合いますか？",answer:'はい',choices:['はい','いいえ','ぎりぎり']},
    {text:"医師は1日3回、5日間の薬を処方しました。今日は治療の3日目です。\n\n治療は何日残っていますか？",answer:'2日',choices:['2日','3日','5日']},
    {text:"ニナは100ユーロの自転車を買うために毎週10ユーロ貯金しています。すでに7週間貯金しました。\n\nニナはあといくら足りませんか？",answer:'30ユーロ',choices:['30ユーロ','70ユーロ','100ユーロ']},
    {text:"飛行機は14時に離陸する予定でしたが、天候のため1時間遅れています。乗客はホールで待っています。\n\n飛行機は何時に離陸しますか？",answer:'15時',choices:['15時','13時','14時']}
  ]
}};
