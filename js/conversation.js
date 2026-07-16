// =====================================================================
//  CONVERSATION GUIDÉE (v4, multilingue depuis v6.22)
//  ---------------------------------------------------------------------
//  ⚠️ Ce n'est PAS une IA générative : aucun dialogue libre, aucun texte
//  n'est généré par un modèle de langage. Ce sont des parcours SCRIPTÉS,
//  écrits à l'avance, avec un jeu fermé de réponses attendues — comme le
//  reste de l'application. Une conversation vraiment libre nécessiterait
//  un modèle de langage et des garde-fous spécifiques à un usage santé,
//  à n'envisager qu'avec validation clinique (voir README).
//
//  Chaque scénario = une suite d'échanges. À chaque étape :
//   - l'assistant "dit" sa réplique (synthèse vocale) ;
//   - le patient répond, au choix : à voix haute (micro) ou en touchant
//     la phrase correspondante (accessible si le micro n'est pas
//     disponible ou si la voix est difficile ce jour-là) ;
//   - la réponse est comparée aux formulations attendues (tolérance,
//     comme pour les autres exercices vocaux).
//
//  v6.22 : traduit en EN/ES/IT/PT/DE/AR (même structure que les banques
//  d'exercices — window.CONV_SCENARIOS_XX, sélection automatique selon
//  la langue active). Le kabyle n'est PAS concerné : ce sont des
//  scénarios de dialogue entiers, pas du vocabulaire isolé, donc hors de
//  portée sans relecture native (même règle que le reste du kabyle).
// =====================================================================

const CONV_SCENARIOS = {
  medecin:{
    title:'Chez le médecin',
    icon:'🩺',
    steps:[
      { ai:"Bonjour ! Qu'est-ce qui vous amène aujourd'hui ?",
        accept:["j'ai mal", "je ne me sens pas bien", "j'ai un problème", "je viens pour un controle", "je viens pour une visite"],
        choices:["J'ai mal.", "Je viens pour un contrôle.", "Je ne me sens pas bien."] },
      { ai:"Où avez-vous mal, exactement ?",
        accept:["a la tete","au ventre","au dos","au bras","a la jambe","nulle part"],
        choices:["À la tête.", "Au dos.", "Nulle part, c'est un contrôle."] },
      { ai:"Depuis combien de temps ?",
        accept:["depuis hier","depuis une semaine","depuis longtemps","depuis ce matin"],
        choices:["Depuis hier.", "Depuis une semaine.", "Depuis ce matin."] },
      { ai:"Très bien, merci. Avez-vous des questions pour moi ?",
        accept:["oui","non","j'ai une question"],
        choices:["Non, merci.", "Oui, j'ai une question."] }
    ]
  },
  cafe:{
    title:'Au café',
    icon:'☕',
    steps:[
      { ai:"Bonjour, qu'est-ce que je vous sers ?",
        accept:["un cafe","un the","un jus d'orange","une eau","un chocolat chaud"],
        choices:["Un café, s'il vous plaît.", "Un thé.", "Une eau."] },
      { ai:"Sur place ou à emporter ?",
        accept:["sur place","a emporter"],
        choices:["Sur place.", "À emporter."] },
      { ai:"Voulez-vous autre chose avec ça ?",
        accept:["non merci","oui un croissant","oui un gateau"],
        choices:["Non, merci.", "Oui, un croissant."] },
      { ai:"Voilà, ça fera trois euros cinquante. Bonne journée !",
        accept:["merci","au revoir","merci beaucoup"],
        choices:["Merci, au revoir.", "Merci beaucoup."] }
    ]
  },
  telephone:{
    title:'Appel téléphonique',
    icon:'📞',
    steps:[
      { ai:"Allô, bonjour ?",
        accept:["bonjour","allo bonjour","allo"],
        choices:["Bonjour.", "Allô, bonjour."] },
      { ai:"C'est de la part de qui ?",
        accept:["c'est moi-meme","c'est de la part de"],
        choices:["C'est moi-même.", "C'est de la part de..."] },
      { ai:"Je vous appelle pour prendre rendez-vous. Quel jour vous conviendrait ?",
        accept:["lundi","mardi","mercredi","jeudi","vendredi","n'importe quel jour"],
        choices:["Lundi.", "Mercredi.", "N'importe quel jour."] },
      { ai:"Parfait, c'est noté. Bonne journée à vous !",
        accept:["merci","au revoir","bonne journee a vous aussi"],
        choices:["Merci, au revoir.", "Bonne journée à vous aussi."] }
    ]
  }
};

window.CONV_SCENARIOS_EN = {
  medecin:{ title:"At the doctor's", icon:'🩺', steps:[
    { ai:"Hello! What brings you in today?",
      accept:["i'm in pain","i don't feel well","i have a problem","i'm here for a check-up","i'm here for a visit"],
      choices:["I'm in pain.", "I'm here for a check-up.", "I don't feel well."] },
    { ai:"Where exactly does it hurt?",
      accept:["my head","my stomach","my back","my arm","my leg","nowhere"],
      choices:["My head.", "My back.", "Nowhere, it's a check-up."] },
    { ai:"How long has this been going on?",
      accept:["since yesterday","for a week","for a long time","since this morning"],
      choices:["Since yesterday.", "For a week.", "Since this morning."] },
    { ai:"Very well, thank you. Do you have any questions for me?",
      accept:["yes","no","i have a question"],
      choices:["No, thank you.", "Yes, I have a question."] }
  ]},
  cafe:{ title:'At the café', icon:'☕', steps:[
    { ai:'Hello, what can I get you?',
      accept:['a coffee','a tea','an orange juice','a water','a hot chocolate'],
      choices:['A coffee, please.', 'A tea.', 'A water.'] },
    { ai:'For here or to go?',
      accept:['for here','to go'],
      choices:['For here.', 'To go.'] },
    { ai:'Would you like anything else with that?',
      accept:['no thanks','yes a croissant','yes a cake'],
      choices:['No, thank you.', 'Yes, a croissant.'] },
    { ai:"Here you go, that'll be three fifty. Have a good day!",
      accept:['thanks','goodbye','thank you very much'],
      choices:['Thanks, goodbye.', 'Thank you very much.'] }
  ]},
  telephone:{ title:'Phone call', icon:'📞', steps:[
    { ai:'Hello?',
      accept:['hello','hi hello','hi'],
      choices:['Hello.', 'Hi, hello.'] },
    { ai:'Who am I speaking with?',
      accept:["it's me","this is"],
      choices:["It's me.", "This is..."] },
    { ai:"I'm calling to make an appointment. What day would work for you?",
      accept:['monday','tuesday','wednesday','thursday','friday','any day'],
      choices:['Monday.', 'Wednesday.', 'Any day.'] },
    { ai:"Perfect, that's noted. Have a great day!",
      accept:['thanks','goodbye','you too'],
      choices:['Thanks, goodbye.', 'You too.'] }
  ]}
};

window.CONV_SCENARIOS_ES = {
  medecin:{ title:'En el médico', icon:'🩺', steps:[
    { ai:'¡Hola! ¿Qué le trae hoy por aquí?',
      accept:['me duele','no me siento bien','tengo un problema','vengo para un control','vengo para una revisión'],
      choices:['Me duele.', 'Vengo para un control.', 'No me siento bien.'] },
    { ai:'¿Dónde le duele exactamente?',
      accept:['la cabeza','el estómago','la espalda','el brazo','la pierna','en ningún sitio'],
      choices:['La cabeza.', 'La espalda.', 'En ningún sitio, es un control.'] },
    { ai:'¿Desde cuándo?',
      accept:['desde ayer','desde hace una semana','desde hace tiempo','desde esta mañana'],
      choices:['Desde ayer.', 'Desde hace una semana.', 'Desde esta mañana.'] },
    { ai:'Muy bien, gracias. ¿Tiene alguna pregunta para mí?',
      accept:['sí','no','tengo una pregunta'],
      choices:['No, gracias.', 'Sí, tengo una pregunta.'] }
  ]},
  cafe:{ title:'En el café', icon:'☕', steps:[
    { ai:'Hola, ¿qué le sirvo?',
      accept:['un café','un té','un zumo de naranja','un agua','un chocolate caliente'],
      choices:['Un café, por favor.', 'Un té.', 'Un agua.'] },
    { ai:'¿Para tomar aquí o para llevar?',
      accept:['para tomar aquí','para llevar'],
      choices:['Para tomar aquí.', 'Para llevar.'] },
    { ai:'¿Quiere algo más con eso?',
      accept:['no gracias','sí un cruasán','sí un pastel'],
      choices:['No, gracias.', 'Sí, un cruasán.'] },
    { ai:'Aquí tiene, son tres euros con cincuenta. ¡Que tenga un buen día!',
      accept:['gracias','adiós','muchas gracias'],
      choices:['Gracias, adiós.', 'Muchas gracias.'] }
  ]},
  telephone:{ title:'Llamada telefónica', icon:'📞', steps:[
    { ai:'¿Diga?',
      accept:['hola','diga hola','hola buenas'],
      choices:['Hola.', '¿Diga? Hola.'] },
    { ai:'¿De parte de quién?',
      accept:['soy yo','de parte de'],
      choices:['Soy yo.', 'De parte de...'] },
    { ai:'Le llamo para pedir una cita. ¿Qué día le vendría bien?',
      accept:['lunes','martes','miércoles','jueves','viernes','cualquier día'],
      choices:['Lunes.', 'Miércoles.', 'Cualquier día.'] },
    { ai:'Perfecto, ya está anotado. ¡Que tenga un buen día!',
      accept:['gracias','adiós','igualmente'],
      choices:['Gracias, adiós.', 'Igualmente.'] }
  ]}
};

window.CONV_SCENARIOS_IT = {
  medecin:{ title:'Dal medico', icon:'🩺', steps:[
    { ai:'Buongiorno! Cosa la porta qui oggi?',
      accept:['ho dolore','non mi sento bene','ho un problema','vengo per un controllo','vengo per una visita'],
      choices:['Ho dolore.', 'Vengo per un controllo.', 'Non mi sento bene.'] },
    { ai:'Dove le fa male esattamente?',
      accept:['alla testa','allo stomaco','alla schiena','al braccio','alla gamba','da nessuna parte'],
      choices:['Alla testa.', 'Alla schiena.', 'Da nessuna parte, è un controllo.'] },
    { ai:'Da quanto tempo?',
      accept:['da ieri','da una settimana','da molto tempo','da stamattina'],
      choices:['Da ieri.', 'Da una settimana.', 'Da stamattina.'] },
    { ai:'Molto bene, grazie. Ha domande per me?',
      accept:['sì','no','ho una domanda'],
      choices:['No, grazie.', 'Sì, ho una domanda.'] }
  ]},
  cafe:{ title:'Al bar', icon:'☕', steps:[
    { ai:'Buongiorno, cosa le porto?',
      accept:['un caffè','un tè',"un succo d'arancia","un'acqua",'una cioccolata calda'],
      choices:['Un caffè, per favore.', 'Un tè.', "Un'acqua."] },
    { ai:'Da bere qui o da portare via?',
      accept:['da qui','da portare via'],
      choices:['Da qui.', 'Da portare via.'] },
    { ai:'Vuole altro?',
      accept:['no grazie','sì un croissant','sì un dolce'],
      choices:['No, grazie.', 'Sì, un croissant.'] },
    { ai:'Ecco a lei, sono tre euro e cinquanta. Buona giornata!',
      accept:['grazie','arrivederci','grazie mille'],
      choices:['Grazie, arrivederci.', 'Grazie mille.'] }
  ]},
  telephone:{ title:'Telefonata', icon:'📞', steps:[
    { ai:'Pronto?',
      accept:['pronto','buongiorno pronto','salve'],
      choices:['Pronto.', 'Pronto, buongiorno.'] },
    { ai:'Chi parla, scusi?',
      accept:['sono io','da parte di'],
      choices:['Sono io.', 'Da parte di...'] },
    { ai:'La chiamo per fissare un appuntamento. Che giorno le andrebbe bene?',
      accept:['lunedì','martedì','mercoledì','giovedì','venerdì','qualsiasi giorno'],
      choices:['Lunedì.', 'Mercoledì.', 'Qualsiasi giorno.'] },
    { ai:'Perfetto, è annotato. Buona giornata!',
      accept:['grazie','arrivederci','altrettanto'],
      choices:['Grazie, arrivederci.', 'Altrettanto.'] }
  ]}
};

window.CONV_SCENARIOS_PT = {
  medecin:{ title:'No médico', icon:'🩺', steps:[
    { ai:'Bom dia! O que o traz cá hoje?',
      accept:['estou com dores','não me sinto bem','tenho um problema','venho para uma consulta de rotina','venho para uma consulta'],
      choices:['Estou com dores.', 'Venho para uma consulta de rotina.', 'Não me sinto bem.'] },
    { ai:'Onde lhe dói exatamente?',
      accept:['na cabeça','na barriga','nas costas','no braço','na perna','em lado nenhum'],
      choices:['Na cabeça.', 'Nas costas.', 'Em lado nenhum, é uma consulta de rotina.'] },
    { ai:'Desde quando?',
      accept:['desde ontem','há uma semana','há muito tempo','desde esta manhã'],
      choices:['Desde ontem.', 'Há uma semana.', 'Desde esta manhã.'] },
    { ai:'Muito bem, obrigado. Tem alguma pergunta para mim?',
      accept:['sim','não','tenho uma pergunta'],
      choices:['Não, obrigado.', 'Sim, tenho uma pergunta.'] }
  ]},
  cafe:{ title:'No café', icon:'☕', steps:[
    { ai:'Bom dia, o que lhe posso servir?',
      accept:['um café','um chá','um sumo de laranja','uma água','um chocolate quente'],
      choices:['Um café, por favor.', 'Um chá.', 'Uma água.'] },
    { ai:'Para tomar aqui ou para levar?',
      accept:['para tomar aqui','para levar'],
      choices:['Para tomar aqui.', 'Para levar.'] },
    { ai:'Deseja mais alguma coisa?',
      accept:['não obrigado','sim um croissant','sim um bolo'],
      choices:['Não, obrigado.', 'Sim, um croissant.'] },
    { ai:'Aqui está, são três euros e cinquenta. Tenha um bom dia!',
      accept:['obrigado','adeus','muito obrigado'],
      choices:['Obrigado, adeus.', 'Muito obrigado.'] }
  ]},
  telephone:{ title:'Chamada telefónica', icon:'📞', steps:[
    { ai:'Estou?',
      accept:['olá','estou sim','está lá'],
      choices:['Olá.', 'Estou? Olá.'] },
    { ai:'Da parte de quem, por favor?',
      accept:['sou eu','da parte de'],
      choices:['Sou eu.', 'Da parte de...'] },
    { ai:'Estou a ligar para marcar uma consulta. Que dia lhe convém?',
      accept:['segunda','terça','quarta','quinta','sexta','qualquer dia'],
      choices:['Segunda.', 'Quarta.', 'Qualquer dia.'] },
    { ai:'Perfeito, ficou anotado. Tenha um bom dia!',
      accept:['obrigado','adeus','igualmente'],
      choices:['Obrigado, adeus.', 'Igualmente.'] }
  ]}
};

window.CONV_SCENARIOS_DE = {
  medecin:{ title:'Beim Arzt', icon:'🩺', steps:[
    { ai:'Guten Tag! Was führt Sie heute zu mir?',
      accept:['ich habe schmerzen','mir geht es nicht gut','ich habe ein problem','ich komme zur kontrolle','ich komme zu einem termin'],
      choices:['Ich habe Schmerzen.', 'Ich komme zur Kontrolle.', 'Mir geht es nicht gut.'] },
    { ai:'Wo genau haben Sie Schmerzen?',
      accept:['am kopf','am bauch','am rücken','am arm','am bein','nirgends'],
      choices:['Am Kopf.', 'Am Rücken.', 'Nirgends, es ist eine Kontrolle.'] },
    { ai:'Seit wann?',
      accept:['seit gestern','seit einer woche','seit langem','seit heute morgen'],
      choices:['Seit gestern.', 'Seit einer Woche.', 'Seit heute Morgen.'] },
    { ai:'Sehr gut, danke. Haben Sie Fragen an mich?',
      accept:['ja','nein','ich habe eine frage'],
      choices:['Nein, danke.', 'Ja, ich habe eine Frage.'] }
  ]},
  cafe:{ title:'Im Café', icon:'☕', steps:[
    { ai:'Guten Tag, was darf ich Ihnen bringen?',
      accept:['einen kaffee','einen tee','einen orangensaft','ein wasser','eine heiße schokolade'],
      choices:['Einen Kaffee, bitte.', 'Einen Tee.', 'Ein Wasser.'] },
    { ai:'Zum Hieressen oder zum Mitnehmen?',
      accept:['zum hieressen','zum mitnehmen'],
      choices:['Zum Hieressen.', 'Zum Mitnehmen.'] },
    { ai:'Möchten Sie noch etwas dazu?',
      accept:['nein danke','ja ein croissant','ja ein kuchen'],
      choices:['Nein, danke.', 'Ja, ein Croissant.'] },
    { ai:'Bitte schön, das macht drei fünfzig. Schönen Tag noch!',
      accept:['danke','auf wiedersehen','vielen dank'],
      choices:['Danke, auf Wiedersehen.', 'Vielen Dank.'] }
  ]},
  telephone:{ title:'Telefonanruf', icon:'📞', steps:[
    { ai:'Hallo?',
      accept:['hallo','guten tag hallo','ja hallo'],
      choices:['Hallo.', 'Hallo, guten Tag.'] },
    { ai:'Mit wem spreche ich, bitte?',
      accept:['ich bin es','hier spricht'],
      choices:['Ich bin es.', 'Hier spricht...'] },
    { ai:'Ich rufe an, um einen Termin zu vereinbaren. Welcher Tag würde Ihnen passen?',
      accept:['montag','dienstag','mittwoch','donnerstag','freitag','jeder tag'],
      choices:['Montag.', 'Mittwoch.', 'Jeder Tag passt.'] },
    { ai:'Perfekt, das ist notiert. Schönen Tag noch!',
      accept:['danke','auf wiedersehen','ihnen auch'],
      choices:['Danke, auf Wiedersehen.', 'Ihnen auch.'] }
  ]}
};

window.CONV_SCENARIOS_AR = {
  medecin:{ title:'عند الطبيب', icon:'🩺', steps:[
    { ai:'مرحبًا! ما الذي أتى بك اليوم؟',
      accept:['أشعر بألم','لا أشعر أني بخير','لدي مشكلة','جئت من أجل فحص روتيني','جئت من أجل زيارة'],
      choices:['أشعر بألم.', 'جئت من أجل فحص روتيني.', 'لا أشعر أني بخير.'] },
    { ai:'أين يؤلمك بالضبط؟',
      accept:['في رأسي','في بطني','في ظهري','في ذراعي','في ساقي','لا يوجد ألم'],
      choices:['في رأسي.', 'في ظهري.', 'لا يوجد ألم، إنه فحص روتيني.'] },
    { ai:'منذ متى؟',
      accept:['منذ الأمس','منذ أسبوع','منذ وقت طويل','منذ هذا الصباح'],
      choices:['منذ الأمس.', 'منذ أسبوع.', 'منذ هذا الصباح.'] },
    { ai:'حسنًا جدًا، شكرًا. هل لديك أسئلة لي؟',
      accept:['نعم','لا','لدي سؤال'],
      choices:['لا، شكرًا.', 'نعم، لدي سؤال.'] }
  ]},
  cafe:{ title:'في المقهى', icon:'☕', steps:[
    { ai:'مرحبًا، ماذا أقدم لك؟',
      accept:['قهوة','شاي','عصير برتقال','ماء','شوكولاتة ساخنة'],
      choices:['قهوة من فضلك.', 'شاي.', 'ماء.'] },
    { ai:'هنا أم للأخذ؟',
      accept:['هنا','للأخذ'],
      choices:['هنا.', 'للأخذ.'] },
    { ai:'هل تريد شيئًا آخر معها؟',
      accept:['لا شكرًا','نعم كرواسون','نعم قطعة حلوى'],
      choices:['لا، شكرًا.', 'نعم، كرواسون.'] },
    { ai:'تفضل، المجموع ثلاثة يورو ونصف. يومًا سعيدًا!',
      accept:['شكرًا','مع السلامة','شكرًا جزيلاً'],
      choices:['شكرًا، مع السلامة.', 'شكرًا جزيلاً.'] }
  ]},
  telephone:{ title:'مكالمة هاتفية', icon:'📞', steps:[
    { ai:'ألو؟',
      accept:['ألو مرحبًا','مرحبًا','ألو'],
      choices:['مرحبًا.', 'ألو، مرحبًا.'] },
    { ai:'من المتحدث من فضلك؟',
      accept:['أنا بنفسي','من طرف'],
      choices:['أنا بنفسي.', 'من طرف...'] },
    { ai:'أتصل بك لتحديد موعد. أي يوم يناسبك؟',
      accept:['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','أي يوم'],
      choices:['الإثنين.', 'الأربعاء.', 'أي يوم يناسبني.'] },
    { ai:'ممتاز، تم التسجيل. يومًا سعيدًا!',
      accept:['شكرًا','مع السلامة','ولك أيضًا'],
      choices:['شكرًا، مع السلامة.', 'ولك أيضًا.'] }
  ]}
};

window.CONV_SCENARIOS_TR = {
  medecin:{ title:'Doktorda', icon:'🩺', steps:[
    { ai:'Merhaba! Bugün sizi buraya getiren nedir?',
      accept:['ağrım var','kendimi iyi hissetmiyorum','bir sorunum var','kontrole geldim','ziyarete geldim'],
      choices:['Ağrım var.', 'Kontrole geldim.', 'Kendimi iyi hissetmiyorum.'] },
    { ai:'Tam olarak neresi ağrıyor?',
      accept:['başım','karnım','sırtım','kolum','bacağım','hiçbir yerim'],
      choices:['Başım.', 'Sırtım.', 'Hiçbir yerim, kontrol için geldim.'] },
    { ai:'Bu ne zamandır sürüyor?',
      accept:['dünden beri','bir haftadır','uzun zamandır','bu sabahtan beri'],
      choices:['Dünden beri.', 'Bir haftadır.', 'Bu sabahtan beri.'] },
    { ai:'Çok iyi, teşekkürler. Bana sormak istediğiniz bir şey var mı?',
      accept:['evet','hayır','bir sorum var'],
      choices:['Hayır, teşekkürler.', 'Evet, bir sorum var.'] }
  ]},
  cafe:{ title:'Kafede', icon:'☕', steps:[
    { ai:'Merhaba, size ne getirebilirim?',
      accept:['bir kahve','bir çay','bir portakal suyu','bir su','bir sıcak çikolata'],
      choices:['Bir kahve, lütfen.', 'Bir çay.', 'Bir su.'] },
    { ai:'Burada mı, yoksa yanınıza mı?',
      accept:['burada','yanıma'],
      choices:['Burada.', 'Yanıma.'] },
    { ai:'Yanında başka bir şey ister misiniz?',
      accept:['hayır teşekkürler','evet bir kruvasan','evet bir kek'],
      choices:['Hayır, teşekkürler.', 'Evet, bir kruvasan.'] },
    { ai:'Buyurun, üç buçuk avro. İyi günler!',
      accept:['teşekkürler','hoşça kalın','çok teşekkür ederim'],
      choices:['Teşekkürler, hoşça kalın.', 'Çok teşekkür ederim.'] }
  ]},
  telephone:{ title:'Telefon görüşmesi', icon:'📞', steps:[
    { ai:'Alo?',
      accept:['alo','merhaba alo','merhaba'],
      choices:['Merhaba.', 'Alo, merhaba.'] },
    { ai:'Kiminle görüşüyorum?',
      accept:['benim','ben arıyorum'],
      choices:['Benim.', 'Ben...'] },
    { ai:'Randevu almak için arıyorum. Size hangi gün uyar?',
      accept:['pazartesi','salı','çarşamba','perşembe','cuma','her gün olur'],
      choices:['Pazartesi.', 'Çarşamba.', 'Her gün olur.'] },
    { ai:'Mükemmel, not edildi. İyi günler!',
      accept:['teşekkürler','hoşça kalın','size de'],
      choices:['Teşekkürler, hoşça kalın.', 'Size de.'] }
  ]}
};

window.CONV_SCENARIOS_PL = {
  medecin:{ title:'U lekarza', icon:'🩺', steps:[
    { ai:'Dzień dobry! Co Pana/Panią do mnie sprowadza?',
      accept:['boli mnie','źle się czuję','mam problem','przyszedłem·am na kontrolę','przyszedłem·am z wizytą'],
      choices:['Boli mnie.', 'Przyszedłem·am na kontrolę.', 'Źle się czuję.'] },
    { ai:'Gdzie dokładnie boli?',
      accept:['głowa','brzuch','plecy','ręka','noga','nigdzie'],
      choices:['Głowa.', 'Plecy.', 'Nigdzie, to kontrola.'] },
    { ai:'Od jak dawna to trwa?',
      accept:['od wczoraj','od tygodnia','od dawna','od dzisiejszego ranka'],
      choices:['Od wczoraj.', 'Od tygodnia.', 'Od dzisiejszego ranka.'] },
    { ai:'Bardzo dobrze, dziękuję. Czy ma Pan/Pani jakieś pytania?',
      accept:['tak','nie','mam pytanie'],
      choices:['Nie, dziękuję.', 'Tak, mam pytanie.'] }
  ]},
  cafe:{ title:'W kawiarni', icon:'☕', steps:[
    { ai:'Dzień dobry, co mogę podać?',
      accept:['kawę','herbatę','sok pomarańczowy','wodę','gorącą czekoladę'],
      choices:['Kawę, proszę.', 'Herbatę.', 'Wodę.'] },
    { ai:'Na miejscu czy na wynos?',
      accept:['na miejscu','na wynos'],
      choices:['Na miejscu.', 'Na wynos.'] },
    { ai:'Czy życzy Pan/Pani sobie coś jeszcze?',
      accept:['nie dziękuję','tak croissant','tak ciastko'],
      choices:['Nie, dziękuję.', 'Tak, croissant.'] },
    { ai:'Proszę bardzo, to trzy pięćdziesiąt. Miłego dnia!',
      accept:['dziękuję','do widzenia','bardzo dziękuję'],
      choices:['Dziękuję, do widzenia.', 'Bardzo dziękuję.'] }
  ]},
  telephone:{ title:'Rozmowa telefoniczna', icon:'📞', steps:[
    { ai:'Halo?',
      accept:['halo','dzień dobry halo','dzień dobry'],
      choices:['Dzień dobry.', 'Halo, dzień dobry.'] },
    { ai:'Z kim rozmawiam?',
      accept:['to ja','mówi'],
      choices:['To ja.', 'Mówi...'] },
    { ai:'Dzwonię, aby umówić wizytę. Który dzień Panu/Pani odpowiada?',
      accept:['poniedziałek','wtorek','środa','czwartek','piątek','dowolny dzień'],
      choices:['Poniedziałek.', 'Środa.', 'Dowolny dzień mi odpowiada.'] },
    { ai:'Doskonale, zanotowane. Miłego dnia!',
      accept:['dziękuję','do widzenia','nawzajem'],
      choices:['Dziękuję, do widzenia.', 'Nawzajem.'] }
  ]}
};

function convScenarios(){
  const lang=((window.Prefs && Prefs.data.lang) || 'fr').toUpperCase();
  return window['CONV_SCENARIOS_'+lang] || CONV_SCENARIOS;
}

const Conversation = {
  state:null,

  _el(){ return document.getElementById('conv-body'); },

  menu(){
    if(window.Companion) Companion.explain('companion-conversation', 'conversation');
    const scenarios = convScenarios();
    const cards = Object.entries(scenarios).map(([key,s])=>`
      <div class="ex-item" onclick="Conversation.start('${key}')">
        <div class="ex-icon">${s.icon}</div>
        <div><div class="t">${s.title}</div><div class="d">${s.steps.length} ${I18N.t('conv_exchanges_label')}</div></div>
      </div>`).join('');
    this._el().innerHTML = `
      <div class="card">
        <h3>${I18N.t('conv_choose_scenario')}</h3>
        <p style="color:var(--ink-soft);font-size:.88rem;margin-bottom:14px">
          ${I18N.t('conv_choose_scenario_desc')}
        </p>
        <div class="ex-list">${cards}</div>
      </div>`;
  },

  start(key){
    // v6.24 : la conversation guidée fait partie des fonctionnalités
    // réservées au compte pro (comme les exercices vocaux avancés).
    if(typeof lockReason==='function'){
      const reason = lockReason('conversation');
      if(reason){ showUpsell(reason); return; }
      if(typeof recordDailySession==='function') recordDailySession();
    }
    const scenario = convScenarios()[key];
    this.state = { key, scenario, index:0, ok:0, total:scenario.steps.length, given:null };
    this._renderStep();
  },

  _renderStep(){
    const st=this.state, step=st.scenario.steps[st.index];
    const warn = (typeof voiceSupported==='function' && voiceSupported()) ? '' :
      `<div class="voice-warn">${I18N.t('voice_unsupported')}</div>`;
    const choicesHTML = step.choices.map(c=>`<button class="choice" onclick="Conversation.answer(${JSON.stringify(c).replace(/"/g,'&quot;')})">${c}</button>`).join('');
    this._el().innerHTML = `
      <div class="card">
        <div class="ex-header"><h3 style="margin:0">${st.scenario.icon} ${st.scenario.title}</h3><span dir="ltr" style="color:var(--ink-soft);font-size:.9rem">${st.index+1} / ${st.total}</span></div>
        <div class="progress"><span style="width:${100*st.index/st.total}%"></span></div>
        <div class="prompt-card" style="margin-top:16px">
          <div class="prompt-text" style="font-size:1rem;color:var(--ink-soft)">${I18N.t('conv_interlocutor_says')}</div>
          <div class="prompt-main" style="font-size:1.35rem">« ${step.ai} »</div>
          <button class="speak-btn" onclick="speak(${JSON.stringify(step.ai).replace(/"/g,'&quot;')})">${I18N.t('conv_replay')}</button>
          <p style="margin-top:18px;color:var(--ink-soft);font-size:.9rem">${I18N.t('conv_your_turn')}</p>
          <button class="mic-btn" id="mic" aria-label="${I18N.t('mic_aria_voice')}" onclick="Conversation.toggleListen()">🎤</button>
          <div class="heard" id="heard"></div>${warn}
          <p class="hint" style="margin-top:16px;margin-bottom:6px">${I18N.t('conv_choices_hint')}</p>
          <div class="choices" style="margin-top:6px">${choicesHTML}</div>
        </div>
      </div>`;
  },

  toggleListen(){
    if(typeof voiceSupported!=='function' || !voiceSupported()) return;
    const mic=document.getElementById('mic'), heard=document.getElementById('heard');
    if(typeof recognition!=='undefined' && recognition){ stopRecognition(); mic.classList.remove('listening'); return; }
    const step=this.state.scenario.steps[this.state.index];
    const SRlocal = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SRlocal(); recognition.lang=(window.I18N && I18N.speechLocale()) || 'fr-FR'; recognition.interimResults=false; recognition.maxAlternatives=3;
    mic.classList.add('listening'); heard.innerHTML=I18N.t('listening_now');
    recognition.onresult=(e)=>{
      const said=[...e.results[0]].map(r=>r.transcript)[0];
      heard.innerHTML=`${I18N.t('heard_label')} <b>« ${said} »</b>`;
      mic.classList.remove('listening'); stopRecognition();
      setTimeout(()=>Conversation.answer(said),400);
    };
    recognition.onerror=(e)=>{ heard.innerHTML=`<span style="color:var(--error)">${I18N.t('mic_unavailable')} (${e.error}). ${I18N.t('validate_manually')}</span>`; mic.classList.remove('listening'); stopRecognition(); };
    recognition.onend=()=>{ mic.classList.remove('listening'); };
    recognition.start();
  },

  async answer(given){
    stopRecognition();
    const st=this.state, step=st.scenario.steps[st.index];
    const ok = step.accept.some(a=>isCloseEnough(given,a)) || step.choices.some(c=>isCloseEnough(given,c));
    if(ok) st.ok++;
    else if(typeof AI!=='undefined' && Store){
      const category = AI.recordError('comprehension', step.accept[0], given);
      Store.logError(userCode, { exercise:'conversation_'+st.key, category, target:step.accept[0], given:given||'', level:user?user.level:null });
    }
    st.index++;
    if(st.index>=st.total){ this._finish(); return; }
    this._renderStep();
  },

  async _finish(){
    const st=this.state;
    if(typeof user!=='undefined' && user){
      user.sessions++; user.total+=st.total; user.correct+=st.ok;
      await Store.savePatient(userCode, user);
      await Store.logSession(userCode, { type:'conversation_'+st.key, score:st.ok, total:st.total, level:user.level });
      await Store.saveProfile(userCode, AI.dump());
    }
    this._el().innerHTML = `
      <div class="prompt-card">
        <div class="prompt-emoji">${st.ok>=st.total*0.7?'🌟':'🌱'}</div>
        <div class="prompt-main">${I18N.t('conv_finished')}</div>
        <div class="prompt-text">${I18N.t('conv_result', st.ok, st.total)}</div>
        <button class="btn-primary" style="margin-top:20px" onclick="Conversation.menu()">${I18N.t('conv_try_another')}</button>
        <button class="btn-ghost" style="margin-top:12px;width:100%" onclick="goDashboard()">${I18N.t('back_to_home')}</button>
      </div>`;
  }
};

window.Conversation = Conversation;
window.CONV_SCENARIOS = CONV_SCENARIOS;
