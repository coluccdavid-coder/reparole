// =====================================================================
//  BANQUE D'EXERCICES EN ANGLAIS (v6.9) — langue COMPLÈTE
//  ---------------------------------------------------------------------
//  Contrairement au kabyle, l'anglais est une langue très bien couverte
//  par les dictionnaires ET par la reconnaissance/synthèse vocales des
//  navigateurs : cette banque couvre donc TOUS les types d'exercices,
//  y compris les exercices vocaux (répétition, dénomination orale,
//  fluence, intonation), avec le même nombre de niveaux et d'items que
//  la banque française (js/exercises.js), pour une expérience équivalente.
//
//  Le vocabulaire ci-dessous est un choix éditorial ordinaire (mots
//  simples et courants de niveau 1 à des mots plus rares de niveau 3),
//  pas un contenu sourcé mot à mot comme pour le kabyle — l'anglais ne
//  présente pas le même risque d'erreur qu'une langue peu numérisée.
//  Cela reste néanmoins un contenu à validation clinique en attente,
//  comme tout le reste de l'app (voir garde-fou n°8 du projet).
//
//  Pour corriger ou enrichir ce contenu : même mécanisme BANK_EXTEND que
//  js/exercises.js, ou modifiez directement BANK_EN ci-dessous.
// =====================================================================

window.BANK_EN = {
  denomination:{ title:'Name the pictures', items:{
    1:[ {emoji:'🐱',answer:'CAT',choices:['CAT','DOG','RABBIT']},
        {emoji:'🍎',answer:'APPLE',choices:['PEAR','APPLE','PLUM']},
        {emoji:'🏠',answer:'HOUSE',choices:['HOUSE','CAR','TREE']},
        {emoji:'☀️',answer:'SUN',choices:['SUN','MOON','CLOUD']},
        {emoji:'🚗',answer:'CAR',choices:['CAR','BIKE','BOAT']},
        {emoji:'🐟',answer:'FISH',choices:['FISH','BIRD','HORSE']},
        {emoji:'🌹',answer:'FLOWER',choices:['FLOWER','GRASS','LEAF']},
        {emoji:'🍞',answer:'BREAD',choices:['BREAD','CAKE','CHEESE']} ],
    2:[ {emoji:'🦋',answer:'BUTTERFLY',choices:['BUTTERFLY','BEE','DRAGONFLY','GRASSHOPPER']},
        {emoji:'⌚',answer:'WATCH',choices:['CLOCK','WATCH','ALARM','PENDULUM']},
        {emoji:'🎻',answer:'VIOLIN',choices:['GUITAR','VIOLIN','CELLO','VIOLA']},
        {emoji:'🍄',answer:'MUSHROOM',choices:['MUSHROOM','TOMATO','ONION','CABBAGE']},
        {emoji:'🦒',answer:'GIRAFFE',choices:['GIRAFFE','CAMEL','ZEBRA','DONKEY']},
        {emoji:'⛵',answer:'SAILBOAT',choices:['SAILBOAT','LINER','CANOE','RAFT']},
        {emoji:'🎺',answer:'TRUMPET',choices:['TRUMPET','FLUTE','SAXOPHONE','CLARINET']},
        {emoji:'🌋',answer:'VOLCANO',choices:['VOLCANO','MOUNTAIN','HILL','CLIFF']} ],
    3:[ {emoji:'🧭',answer:'COMPASS',choices:['COMPASS','BAROMETER','THERMOMETER','SEXTANT','ALTIMETER']},
        {emoji:'🦔',answer:'HEDGEHOG',choices:['HEDGEHOG','PORCUPINE','MOLE','SHREW']},
        {emoji:'⚓',answer:'ANCHOR',choices:['ANCHOR','PROPELLER','RUDDER','KEEL','MAST']},
        {emoji:'🔬',answer:'MICROSCOPE',choices:['MICROSCOPE','TELESCOPE','PERISCOPE','STETHOSCOPE']},
        {emoji:'🪕',answer:'BANJO',choices:['BANJO','MANDOLIN','UKULELE','LUTE','ZITHER']},
        {emoji:'🦦',answer:'OTTER',choices:['OTTER','WEASEL','MARTEN','MINK']},
        {emoji:'🌪️',answer:'TORNADO',choices:['TORNADO','HURRICANE','TYPHOON','CYCLONE']},
        {emoji:'🛡️',answer:'SHIELD',choices:['SHIELD','ARMOUR','HELMET','BREASTPLATE']} ]
  }},
  completion:{ title:'Complete the sentence', items:{
    1:[ {text:'The cat drinks ___',answer:'MILK',choices:['MILK','BREAD','WATER']},
        {text:'I sleep in my ___',answer:'BED',choices:['BED','PLATE','BAG']},
        {text:'The sun is ___',answer:'YELLOW',choices:['YELLOW','COLD','HEAVY']},
        {text:'I eat with a ___',answer:'FORK',choices:['FORK','CHAIR','DOOR']},
        {text:'At night, the sky is ___',answer:'BLACK',choices:['BLACK','GREEN','ROUND']},
        {text:'I walk with my ___',answer:'FEET',choices:['FEET','HANDS','EYES']},
        {text:'We drink from a ___',answer:'GLASS',choices:['GLASS','BOOK','WALL']},
        {text:'The baby cries in the ___',answer:'CRIB',choices:['CRIB','GARDEN','OVEN']} ],
    2:[ {text:'To write, I use a ___',answer:'PEN',choices:['PEN','HAMMER','BROOM','GLASS']},
        {text:'In winter, it is very ___',answer:'COLD',choices:['HOT','COLD','HUMID','DRY']},
        {text:'The postman brings the ___',answer:'MAIL',choices:['MAIL','BREAD','NEWSPAPER','PARCEL']},
        {text:'To open the door, you need a ___',answer:'KEY',choices:['KEY','LAMP','CUP','CARD']},
        {text:'I watch a film on the ___',answer:'TELEVISION',choices:['TELEVISION','RADIO','WINDOW','KITCHEN']},
        {text:'The bird builds its ___',answer:'NEST',choices:['NEST','HOLE','WALL','BRIDGE']},
        {text:'We buy bread at the ___',answer:'BAKERY',choices:['BAKERY','PHARMACY','BANK','POST OFFICE']},
        {text:'Before eating, I wash my ___',answer:'HANDS',choices:['HANDS','HAIR','TEETH','EARS']} ],
    3:[ {text:'Before leaving, don\'t forget to ___ the door',answer:'LOCK',choices:['LOCK','OPEN','PAINT','BREAK','WASH']},
        {text:'The doctor prescribed a ___',answer:'TREATMENT',choices:['TREATMENT','DESSERT','BOUQUET','JOURNEY','TOOL']},
        {text:'The meeting was ___ until tomorrow',answer:'POSTPONED',choices:['POSTPONED','EATEN','PAINTED','SUNG','PLANTED']},
        {text:'You must ___ your taxes before the deadline',answer:'DECLARE',choices:['DECLARE','DANCE','WATER','DRIVE','DRAW']},
        {text:'The gardener is going to ___ the rose bushes',answer:'PRUNE',choices:['PRUNE','READ','PHONE','SWIM','VOTE']},
        {text:'After exercise, you need to ___',answer:'REST',choices:['REST','RUSH','GET ANGRY','WORRY','GET LOST']},
        {text:'This story is hard to ___',answer:'BELIEVE',choices:['BELIEVE','SEW','COOK','RUN','CUT']},
        {text:'The witness refused to ___',answer:'TESTIFY',choices:['TESTIFY','CALL','TRAVEL','SING','DIVE']} ]
  }},
  comprehension:{ title:'Understand the instruction', items:{
    1:[ {text:'Which animal barks?',answer:'THE DOG',choices:['THE DOG','THE FISH','THE BIRD']},
        {text:'What do you eat soup with?',answer:'A SPOON',choices:['A SPOON','A KNIFE','A FORK']},
        {text:'Where do you sleep?',answer:'IN A BED',choices:['IN A BED','IN A BOWL','IN A BAG']},
        {text:'What colour is grass?',answer:'GREEN',choices:['GREEN','RED','BLUE']},
        {text:'What do you drink when thirsty?',answer:'WATER',choices:['WATER','SAND','PAPER']},
        {text:'What object lights up the night?',answer:'A LAMP',choices:['A LAMP','A CUSHION','A PLATE']} ],
    2:[ {text:'What object tells you the time?',answer:'A WATCH',choices:['A WATCH','A BOOK','A LAMP','A GLASS']},
        {text:'Which season comes after winter?',answer:'SPRING',choices:['SUMMER','SPRING','AUTUMN','WINTER']},
        {text:'What do you use an umbrella for?',answer:'TO STAY DRY IN THE RAIN',choices:['TO STAY DRY IN THE RAIN','TO EAT','TO SLEEP','TO READ']},
        {text:'Which profession treats sick people?',answer:'A DOCTOR',choices:['A DOCTOR','A BAKER','A PAINTER','A PILOT']},
        {text:'How many days are in a week?',answer:'SEVEN',choices:['SEVEN','FIVE','TEN','THREE']},
        {text:'Where do you buy medicine?',answer:'AT THE PHARMACY',choices:['AT THE PHARMACY','AT THE POST OFFICE','AT THE GARAGE','AT SCHOOL']} ],
    3:[ {text:'If all roses are flowers, is a rose a flower?',answer:'YES',choices:['YES','NO','SOMETIMES','WE DON\'T KNOW']},
        {text:'The opposite of "quickly" is:',answer:'SLOWLY',choices:['SLOWLY','LOUDLY','HAPPILY','OFTEN']},
        {text:'"It\'s raining cats and dogs" means:',answer:'IT IS RAINING HEAVILY',choices:['IT IS RAINING HEAVILY','IT IS SUNNY','IT IS WINDY','IT IS SNOWING']},
        {text:'Peter is taller than Paul. Who is shorter?',answer:'PAUL',choices:['PAUL','PETER','BOTH','NEITHER']},
        {text:'"Turning the page" means:',answer:'MOVING ON',choices:['MOVING ON','READING A BOOK','RESTING','STARTING OVER']},
        {text:'Which word is not a fruit?',answer:'CARROT',choices:['CARROT','CHERRY','BANANA','GRAPE']} ]
  }},
  repetition:{ title:'Repeat aloud', voice:true, items:{
    1:[ {word:'BALL'},{word:'TABLE'},{word:'SUN'},{word:'CAT'},{word:'DOOR'},{word:'FLOWER'},{word:'HAND'},{word:'WATER'} ],
    2:[ {word:'COMPUTER'},{word:'UMBRELLA'},{word:'TELEPHONE'},{word:'LIBRARY'},{word:'RESTAURANT'},{word:'MOUNTAIN'},{word:'GARDENER'},{word:'CALENDAR'} ],
    3:[ {word:'HELICOPTER'},{word:'PHYSIOTHERAPIST'},{word:'UNCONSTITUTIONAL'},{word:'PARALLELEPIPED'},{word:'OTORHINOLARYNGOLOGIST'},{word:'CHRYSANTHEMUM'},{word:'FORTHCOMING'},{word:'STATISTICALLY'} ]
  }},
  denomination_orale:{ title:'Name aloud', voice:true, items:{
    1:[ {emoji:'🐱',word:'CAT'},{emoji:'🍎',word:'APPLE'},{emoji:'🏠',word:'HOUSE'},{emoji:'☀️',word:'SUN'},{emoji:'🚗',word:'CAR'},{emoji:'🌹',word:'FLOWER'} ],
    2:[ {emoji:'🦋',word:'BUTTERFLY'},{emoji:'⌚',word:'WATCH'},{emoji:'🍄',word:'MUSHROOM'},{emoji:'🦒',word:'GIRAFFE'},{emoji:'⛵',word:'SAILBOAT'},{emoji:'🎺',word:'TRUMPET'} ],
    3:[ {emoji:'🧭',word:'COMPASS'},{emoji:'🦔',word:'HEDGEHOG'},{emoji:'⚓',word:'ANCHOR'},{emoji:'🔬',word:'MICROSCOPE'},{emoji:'🌪️',word:'TORNADO'},{emoji:'🛡️',word:'SHIELD'} ]
  }},
  fluence:{ title:'Verbal fluency', voice:true, fluency:true, items:{
    1:[ {cat:'animals',accept:['cat','dog','rabbit','horse','cow','hen','sheep','pig','bird','fish','mouse','lion','tiger','bear','wolf','fox','duck','donkey','goat','monkey','elephant','giraffe','zebra','snake','frog']},
        {cat:'fruits',accept:['apple','pear','banana','orange','strawberry','cherry','grape','kiwi','melon','peach','apricot','plum','lemon','pineapple','mango','raspberry','blueberry','watermelon','fig','clementine']} ],
    2:[ {cat:'kitchen objects',accept:['knife','fork','spoon','plate','glass','pot','pan','oven','fridge','sink','table','cup','bowl','strainer','spatula','ladle','dish','kettle','teapot']},
        {cat:'clothes',accept:['trousers','pants','shirt','sweater','dress','skirt','coat','jacket','sock','shoe','scarf','glove','hat','shorts','tshirt','tie','belt','boot','sandal','tights','cardigan']} ],
    3:[ {cat:'words starting with the letter B',accept:['ball','box','bread','book','boat','bird','bed','bottle','banana','bell','bag','beach','rain','brush','button','bear','branch','bridge','basket','blanket','butter']},
        {cat:'professions',accept:['doctor','baker','firefighter','teacher','nurse','lawyer','plumber','painter','cook','postman','gardener','hairdresser','mechanic','pharmacist','electrician','architect','journalist','policeman','pilot','dentist']} ]
  }},
  intonation:{ title:'Repeat with intonation', voice:true, items:{
    1:[ {word:'Are you done?',cue:'question'},
        {word:'Are you sure?',cue:'question'},
        {word:"I'm coming tomorrow.",cue:'descriptive'},
        {word:'You eat here.',cue:'descriptive'},
        {word:'Come here!',cue:'exclamative'},
        {word:'What a good idea!',cue:'exclamative'} ],
    2:[ {word:'What are you doing?',cue:'question'},
        {word:'Oh really?',cue:'question'},
        {word:'She is playing outside.',cue:'descriptive'},
        {word:'They are talking with a friend.',cue:'descriptive'},
        {word:'How beautiful you are!',cue:'exclamative'},
        {word:'What a surprise!',cue:'exclamative'} ],
    3:[ {word:'Did you sleep well last night?',cue:'question'},
        {word:'Could you help me carry this?',cue:'question'},
        {word:"We'll leave early tomorrow morning.",cue:'descriptive'},
        {word:'The postman came while you were sleeping.',cue:'descriptive'},
        {word:'What a wonderful day we had!',cue:'exclamative'},
        {word:"I still can't believe it!",cue:'exclamative'} ]
  }}
};
