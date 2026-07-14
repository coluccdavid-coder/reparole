// =====================================================================
//  BANQUE D'EXERCICES EN JAPONAIS (v6.89)
//  ---------------------------------------------------------------------
//  Contenu fourni intégralement par l'utilisateur (fichier
//  Japonais_Complet.xlsx : dénomination sur 3 niveaux, complétion de
//  phrase et compréhension) — je n'ai inventé aucun mot japonais.
//
//  Les choix multiples (distracteurs) ont été générés automatiquement
//  à partir du VOCABULAIRE DÉJÀ FOURNI uniquement (regroupement par
//  catégorie pour la dénomination, tirage parmi les autres réponses du
//  même niveau pour la complétion/compréhension) — jamais de mot
//  japonais ajouté par mes soins. Voir /home/claude/build_ja_bank.py
//  dans la session de développement si la logique exacte doit être
//  reproduite ou ajustée plus tard.
//
//  ⚠️ CONTENU NON RELU par un∙e professionnel∙le de santé ou un∙e
//  locuteur∙rice natif∙ve japonais∙e à ce jour — même statut que le
//  reste de l'app tant qu'aucune validation clinique externe n'a eu
//  lieu (voir garde-fou n°8 et PREPARATION-REGLEMENTAIRE.md).
//
//  Limitation connue : la lecture (hiragana/rōmaji) fournie dans le
//  fichier source n'est pas encore affichée dans l'interface — les
//  exercices utilisent uniquement le kanji/l'écriture japonaise
//  standard. L'ajout d'une annotation furigana (lecture au-dessus du
//  kanji) est possible plus tard mais demande une vraie extension du
//  moteur d'affichage (voir js/app.js, choicesHTML) — pas fait ici
//  pour ne pas casser la comparaison réponse/choix déjà en place.
//
//  Langue traitée comme "partielle" (voir PARTIAL_LANGS, js/i18n.js) :
//  l'interface (boutons, menus, messages) n'est PAS traduite en
//  japonais — seul le contenu des exercices l'est. Repli automatique
//  sur le français pour tout le reste de l'interface, comme le
//  kabyle et le sango.
// =====================================================================

window.BANK_JA = {
  denomination:{ title:'絵の名前を答えてください', items:{
    1:[
        {emoji:'🐶',answer:'犬',choices:['犬','兎','鴨']},
        {emoji:'🐰',answer:'兎',choices:['牛','鴨','兎']},
        {emoji:'🐮',answer:'牛',choices:['牛','鴨','犬']},
        {emoji:'🐷',answer:'豚',choices:['犬','鴨','豚']},
        {emoji:'🐭',answer:'ねずみ',choices:['兎','ねずみ','犬']},
        {emoji:'🦆',answer:'鴨',choices:['豚','ねずみ','鴨']},
        {emoji:'🥚',answer:'卵',choices:['ぶどう','バナナ','卵']},
        {emoji:'🧀',answer:'チーズ',choices:['チーズ','オレンジ','いちご']},
        {emoji:'🥛',answer:'牛乳',choices:['にんじん','牛乳','チーズ']},
        {emoji:'🍌',answer:'バナナ',choices:['オレンジ','卵','バナナ']},
        {emoji:'🍊',answer:'オレンジ',choices:['オレンジ','にんじん','牛乳']},
        {emoji:'🍇',answer:'ぶどう',choices:['ぶどう','にんじん','卵']},
        {emoji:'🍓',answer:'いちご',choices:['卵','いちご','オレンジ']},
        {emoji:'🥕',answer:'にんじん',choices:['にんじん','オレンジ','牛乳']},
        {emoji:'🌙',answer:'月',choices:['雲','雨','月']},
        {emoji:'☁️',answer:'雲',choices:['雨','月','雲']},
        {emoji:'🌧️',answer:'雨',choices:['雨','月','雲']},
        {emoji:'🔑',answer:'鍵',choices:['シャツ','鍵','ベッド']},
        {emoji:'🪑',answer:'椅子',choices:['シャツ','椅子','鍵']},
        {emoji:'🛏️',answer:'ベッド',choices:['椅子','靴','ベッド']},
        {emoji:'👕',answer:'シャツ',choices:['ズボン','シャツ','ベッド']},
        {emoji:'👖',answer:'ズボン',choices:['ベッド','鍵','ズボン']},
        {emoji:'👟',answer:'靴',choices:['シャツ','靴','ベッド']}
    ],
    2:[
        {emoji:'🦋',answer:'蝶',choices:['蝶','鷲','亀']},
        {emoji:'🦒',answer:'キリン',choices:['キリン','トカゲ','鷲']},
        {emoji:'🦌',answer:'鹿',choices:['キリン','鹿','カニ']},
        {emoji:'🦉',answer:'フクロウ',choices:['フクロウ','鷲','トカゲ']},
        {emoji:'🦅',answer:'鷲',choices:['鷲','亀','タコ']},
        {emoji:'🐢',answer:'亀',choices:['亀','フクロウ','キリン']},
        {emoji:'🦎',answer:'トカゲ',choices:['キリン','タコ','トカゲ']},
        {emoji:'🐙',answer:'タコ',choices:['亀','鹿','タコ']},
        {emoji:'🦀',answer:'カニ',choices:['カニ','フクロウ','キリン']},
        {emoji:'🎻',answer:'バイオリン',choices:['サクソフォン','バイオリン','太鼓']},
        {emoji:'🎺',answer:'トランペット',choices:['トランペット','バイオリン','太鼓']},
        {emoji:'🎸',answer:'ギター',choices:['太鼓','ギター','バイオリン']},
        {emoji:'🥁',answer:'太鼓',choices:['太鼓','ピアノ','バイオリン']},
        {emoji:'🎹',answer:'ピアノ',choices:['サクソフォン','ピアノ','トランペット']},
        {emoji:'🎷',answer:'サクソフォン',choices:['トランペット','ギター','サクソフォン']},
        {emoji:'🌋',answer:'火山',choices:['噴水','火山','浜辺']},
        {emoji:'⛰️',answer:'山',choices:['波','山','城']},
        {emoji:'🏖️',answer:'浜辺',choices:['波','浜辺','火山']},
        {emoji:'🌊',answer:'波',choices:['火山','波','山']},
        {emoji:'🌉',answer:'橋',choices:['塔','橋','火山']},
        {emoji:'🏰',answer:'城',choices:['噴水','橋','城']},
        {emoji:'🗼',answer:'塔',choices:['城','塔','波']},
        {emoji:'⛲',answer:'噴水',choices:['噴水','浜辺','橋']},
        {emoji:'⌚',answer:'腕時計',choices:['カメラ','腕時計','風船']},
        {emoji:'🍄',answer:'きのこ',choices:['きのこ','電球','パラソル']},
        {emoji:'⛵',answer:'ヨット',choices:['風船','ヨット','贈り物']},
        {emoji:'🖼️',answer:'絵',choices:['パズル','カメラ','絵']},
        {emoji:'📷',answer:'カメラ',choices:['腕時計','風船','カメラ']},
        {emoji:'💡',answer:'電球',choices:['腕時計','電球','きのこ']},
        {emoji:'🏮',answer:'ランタン',choices:['きのこ','絵','ランタン']},
        {emoji:'⛱️',answer:'パラソル',choices:['風船','きのこ','パラソル']},
        {emoji:'🎁',answer:'贈り物',choices:['パラソル','贈り物','絵']},
        {emoji:'🎈',answer:'風船',choices:['パラソル','パズル','風船']},
        {emoji:'🧩',answer:'パズル',choices:['ランタン','絵','パズル']}
    ],
    3:[
        {emoji:'🦔',answer:'ハリネズミ',choices:['ハリネズミ','孔雀','オウム']},
        {emoji:'🦦',answer:'カワウソ',choices:['白鳥','カワウソ','ハリネズミ']},
        {emoji:'🦥',answer:'ナマケモノ',choices:['ナマケモノ','ハリネズミ','オウム']},
        {emoji:'🦫',answer:'ビーバー',choices:['カワウソ','スカンク','ビーバー']},
        {emoji:'🦨',answer:'スカンク',choices:['白鳥','サソリ','スカンク']},
        {emoji:'🦩',answer:'フラミンゴ',choices:['スカンク','フラミンゴ','ナマケモノ']},
        {emoji:'🦚',answer:'孔雀',choices:['カワウソ','孔雀','白鳥']},
        {emoji:'🦜',answer:'オウム',choices:['ハリネズミ','サソリ','オウム']},
        {emoji:'🦢',answer:'白鳥',choices:['白鳥','ナマケモノ','ビーバー']},
        {emoji:'🦂',answer:'サソリ',choices:['ビーバー','サソリ','オウム']},
        {emoji:'🐊',answer:'ワニ',choices:['孔雀','ナマケモノ','ワニ']},
        {emoji:'🧭',answer:'羅針盤',choices:['羅針盤','磁石','望遠鏡']},
        {emoji:'🔬',answer:'顕微鏡',choices:['天秤','磁石','顕微鏡']},
        {emoji:'🧪',answer:'試験管',choices:['望遠鏡','顕微鏡','試験管']},
        {emoji:'🔭',answer:'望遠鏡',choices:['羅針盤','試験管','望遠鏡']},
        {emoji:'🧲',answer:'磁石',choices:['天秤','顕微鏡','磁石']},
        {emoji:'⚖️',answer:'天秤',choices:['顕微鏡','天秤','羅針盤']},
        {emoji:'⚓',answer:'錨',choices:['盾','錨','弓']},
        {emoji:'🛡️',answer:'盾',choices:['弓','盾','錨']},
        {emoji:'⚔️',answer:'剣',choices:['剣','錨','弓']},
        {emoji:'🏹',answer:'弓',choices:['弓','盾','錨']},
        {emoji:'🎪',answer:'サーカステント',choices:['的','サーカステント','回転木馬']},
        {emoji:'🎠',answer:'回転木馬',choices:['サーカステント','回転木馬','的']},
        {emoji:'🎯',answer:'的',choices:['サーカステント','的','回転木馬']},
        {emoji:'🪡',answer:'針',choices:['陶器','ボルト','針']},
        {emoji:'⚙️',answer:'歯車',choices:['ドライバー','罠','歯車']},
        {emoji:'🔩',answer:'ボルト',choices:['消火器','罠','ボルト']},
        {emoji:'🪛',answer:'ドライバー',choices:['陶器','ドライバー','消火器']},
        {emoji:'🪚',answer:'のこぎり',choices:['陶器','のこぎり','消火器']},
        {emoji:'🧯',answer:'消火器',choices:['ボルト','のこぎり','消火器']},
        {emoji:'🪤',answer:'罠',choices:['罠','ボルト','陶器']},
        {emoji:'🕸️',answer:'クモの巣',choices:['クモの巣','バンジョー','ドライバー']},
        {emoji:'🌪️',answer:'竜巻',choices:['竜巻','ドライバー','のこぎり']},
        {emoji:'🏺',answer:'陶器',choices:['針','のこぎり','陶器']},
        {emoji:'🪕',answer:'バンジョー',choices:['針','のこぎり','バンジョー']}
    ]
  }},
  completion:{ title:'文を完成させてください', items:{
    1:[
        {text:'猫は___を飲みます。',answer:'牛乳',choices:['牛乳','ゆりかご','黄色']},
        {text:'私は___で寝ます。',answer:'ベッド',choices:['ベッド','コップ','黄色']},
        {text:'太陽は___です。',answer:'黄色',choices:['足','牛乳','黄色']},
        {text:'___で食べます。',answer:'フォーク',choices:['コップ','フォーク','ベッド']},
        {text:'夜、空は___です。',answer:'黒い',choices:['ゆりかご','黒い','黄色']},
        {text:'___で歩きます。',answer:'足',choices:['ベッド','フォーク','足']},
        {text:'___で飲みます。',answer:'コップ',choices:['牛乳','コップ','黄色']},
        {text:'赤ちゃんは___で泣いています。',answer:'ゆりかご',choices:['足','ゆりかご','ベッド']}
    ],
    2:[
        {text:'書くために___を使います。',answer:'ペン',choices:['巣','ペン','鍵']},
        {text:'冬はとても___です。',answer:'寒い',choices:['手','郵便','寒い']},
        {text:'___配達員が郵便を届けます。',answer:'郵便',choices:['郵便','ペン','寒い']},
        {text:'ドアを開けるには___が必要です。',answer:'鍵',choices:['手','鍵','テレビ']},
        {text:'___で映画を見ます。',answer:'テレビ',choices:['郵便','テレビ','寒い']},
        {text:'鳥は___を作ります。',answer:'巣',choices:['ペン','巣','鍵']},
        {text:'パンは___で買います。',answer:'パン屋',choices:['パン屋','鍵','寒い']},
        {text:'食べる前に___を洗います。',answer:'手',choices:['パン屋','寒い','手']}
    ],
    3:[
        {text:'出かける前にドアを___のを忘れないでください。',answer:'閉める',choices:['閉める','延期','信じる']},
        {text:'医者は___を処方しました。',answer:'治療',choices:['治療','閉める','申告']},
        {text:'会議は明日に___されました。',answer:'延期',choices:['延期','休む','信じる']},
        {text:'期限までに税金を___しなければなりません。',answer:'申告',choices:['証言','申告','閉める']},
        {text:'庭師はバラを___します。',answer:'剪定',choices:['休む','延期','剪定']},
        {text:'運動の後は___まなければなりません。',answer:'休む',choices:['休む','申告','剪定']},
        {text:'この話は___のが難しいです。',answer:'信じる',choices:['申告','信じる','剪定']},
        {text:'証人は___することを拒否しました。',answer:'証言',choices:['剪定','申告','証言']}
    ]
  }},
  comprehension:{ title:'質問を理解してください', items:{
    1:[
        {text:'ほえる動物は何ですか。',answer:'犬',choices:['スプーン','水','犬']},
        {text:'スープは何で食べますか。',answer:'スプーン',choices:['水','緑','スプーン']},
        {text:'どこで寝ますか。',answer:'ベッド',choices:['ランプ','ベッド','緑']},
        {text:'草は何色ですか。',answer:'緑',choices:['緑','ベッド','ランプ']},
        {text:'のどが渇いたら何を飲みますか。',answer:'水',choices:['水','ベッド','緑']},
        {text:'夜を照らすものは何ですか。',answer:'ランプ',choices:['スプーン','水','ランプ']}
    ],
    2:[
        {text:'時間を見るための物は何ですか。',answer:'腕時計',choices:['腕時計','七日','雨から身を守る']},
        {text:'冬の次の季節は何ですか。',answer:'春',choices:['春','腕時計','七日']},
        {text:'傘で何をしますか。',answer:'雨から身を守る',choices:['雨から身を守る','春','七日']},
        {text:'病気の人を治す仕事は何ですか。',answer:'医者',choices:['薬局','医者','七日']},
        {text:'一週間は何日ですか。',answer:'七日',choices:['薬局','七日','医者']},
        {text:'薬はどこで買いますか。',answer:'薬局',choices:['薬局','腕時計','雨から身を守る']}
    ],
    3:[
        {text:'すべてのバラが花なら、バラは花ですか。',answer:'はい',choices:['はい','ゆっくり','たくさん雨が降る']},
        {text:'『速く』の反対は何ですか。',answer:'ゆっくり',choices:['たくさん雨が降る','にんじん','ゆっくり']},
        {text:'『土砂降り』の意味は。',answer:'たくさん雨が降る',choices:['ゆっくり','たくさん雨が降る','はい']},
        {text:'ピエールはポールより背が高いです。小さいのは誰ですか。',answer:'ポール',choices:['新しいことを始める','ポール','にんじん']},
        {text:'『ページをめくる』の意味は。',answer:'新しいことを始める',choices:['にんじん','新しいことを始める','ポール']},
        {text:'果物ではない言葉はどれですか。',answer:'にんじん',choices:['はい','ゆっくり','にんじん']}
    ]
  }}
};
