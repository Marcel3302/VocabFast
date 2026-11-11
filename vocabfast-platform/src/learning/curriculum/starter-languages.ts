import type { Lesson } from '../types';
import type { CourseLevel, CourseUnit } from './index';
import { expandLesson } from '../lesson-expansion';

type Phrase={id:string;de:string;target:Record<string,string>};
type UnitSpec={id:string;title:string;subtitle:string;phrases:Phrase[]};

const T=(sl:string,es:string,fr:string,de:string,it:string,pt:string,nl:string,pl:string,cs:string,tr:string,el:string,ru:string,uk:string,zh:string,ja:string,ko:string,ar:string)=>({sl,es,fr,de,it,pt,nl,pl,cs,tr,el,ru,uk,zh,ja,ko,ar});
const units:UnitSpec[]=[
  {id:'basics',title:'Erste Gespräche',subtitle:'Begrüßen, vorstellen und höflich reagieren.',phrases:[
    {id:'hello',de:'Hallo.',target:T('Živjo.','Hola.','Bonjour.','Hallo.','Ciao.','Olá.','Hallo.','Cześć.','Ahoj.','Merhaba.','Γεια σας.','Здравствуйте.','Добрий день.','你好。','こんにちは。','안녕하세요.','مرحبًا.')},
    {id:'name',de:'Ich heiße Anna.',target:T('Ime mi je Anna.','Me llamo Anna.','Je m’appelle Anna.','Ich heiße Anna.','Mi chiamo Anna.','Chamo-me Anna.','Ik heet Anna.','Mam na imię Anna.','Jmenuji se Anna.','Benim adım Anna.','Με λένε Άννα.','Меня зовут Анна.','Мене звати Анна.','我叫安娜。','私はアンナです。','제 이름은 안나예요.','اسمي آنا.')},
    {id:'please',de:'Bitte.',target:T('Prosim.','Por favor.','S’il vous plaît.','Bitte.','Per favore.','Por favor.','Alstublieft.','Proszę.','Prosím.','Lütfen.','Παρακαλώ.','Пожалуйста.','Будь ласка.','请。','お願いします。','부탁합니다.','من فضلك.')},
    {id:'thanks',de:'Danke.',target:T('Hvala.','Gracias.','Merci.','Danke.','Grazie.','Obrigado.','Dank u.','Dziękuję.','Děkuji.','Teşekkür ederim.','Ευχαριστώ.','Спасибо.','Дякую.','谢谢。','ありがとうございます。','감사합니다.','شكرًا.')}
  ]},
  {id:'travel',title:'Unterwegs & Essen',subtitle:'Bestellen, Orientierung finden und Hilfe bekommen.',phrases:[
    {id:'coffee',de:'Einen Kaffee, bitte.',target:T('Kavo, prosim.','Un café, por favor.','Un café, s’il vous plaît.','Einen Kaffee, bitte.','Un caffè, per favore.','Um café, por favor.','Een koffie, alstublieft.','Kawę, proszę.','Kávu, prosím.','Bir kahve, lütfen.','Έναν καφέ, παρακαλώ.','Кофе, пожалуйста.','Каву, будь ласка.','请给我一杯咖啡。','コーヒーをお願いします。','커피 한 잔 주세요.','قهوة، من فضلك.')},
    {id:'bill',de:'Die Rechnung, bitte.',target:T('Račun, prosim.','La cuenta, por favor.','L’addition, s’il vous plaît.','Die Rechnung, bitte.','Il conto, per favore.','A conta, por favor.','De rekening, alstublieft.','Rachunek, proszę.','Účet, prosím.','Hesap, lütfen.','Τον λογαριασμό, παρακαλώ.','Счёт, пожалуйста.','Рахунок, будь ласка.','请结账。','お会計をお願いします。','계산서 주세요.','الحساب، من فضلك.')},
    {id:'station',de:'Wo ist der Bahnhof?',target:T('Kje je železniška postaja?','¿Dónde está la estación de tren?','Où est la gare ?','Wo ist der Bahnhof?','Dov’è la stazione ferroviaria?','Onde fica a estação de comboios?','Waar is het treinstation?','Gdzie jest dworzec kolejowy?','Kde je vlakové nádraží?','Tren istasyonu nerede?','Πού είναι ο σιδηροδρομικός σταθμός;','Где находится железнодорожный вокзал?','Де знаходиться залізничний вокзал?','火车站在哪里？','駅はどこですか？','기차역이 어디예요?','أين محطة القطار؟')},
    {id:'help',de:'Ich brauche Hilfe.',target:T('Potrebujem pomoč.','Necesito ayuda.','J’ai besoin d’aide.','Ich brauche Hilfe.','Ho bisogno di aiuto.','Preciso de ajuda.','Ik heb hulp nodig.','Potrzebuję pomocy.','Potřebuji pomoc.','Yardıma ihtiyacım var.','Χρειάζομαι βοήθεια.','Мне нужна помощь.','Мені потрібна допомога.','我需要帮助。','助けが必要です。','도움이 필요해요.','أحتاج إلى مساعدة.')}
  ]},
  {id:'hotel',title:'Hotel & Bezahlen',subtitle:'Reservierung, Preise, Karte und wichtige Orte.',phrases:[
    {id:'reservation',de:'Ich habe eine Reservierung.',target:T('Imam rezervacijo.','Tengo una reserva.','J’ai une réservation.','Ich habe eine Reservierung.','Ho una prenotazione.','Tenho uma reserva.','Ik heb een reservering.','Mam rezerwację.','Mám rezervaci.','Rezervasyonum var.','Έχω μια κράτηση.','У меня есть бронирование.','У мене є бронювання.','我有预订。','予約があります。','예약했어요.','لدي حجز.')},
    {id:'cost',de:'Wie viel kostet das?',target:T('Koliko to stane?','¿Cuánto cuesta esto?','Combien ça coûte ?','Wie viel kostet das?','Quanto costa questo?','Quanto custa isto?','Hoeveel kost dit?','Ile to kosztuje?','Kolik to stojí?','Bu ne kadar?','Πόσο κοστίζει αυτό;','Сколько это стоит?','Скільки це коштує?','这个多少钱？','これはいくらですか？','이거 얼마예요?','كم سعر هذا؟')},
    {id:'card',de:'Kann ich mit Karte zahlen?',target:T('Ali lahko plačam s kartico?','¿Puedo pagar con tarjeta?','Puis-je payer par carte ?','Kann ich mit Karte zahlen?','Posso pagare con la carta?','Posso pagar com cartão?','Kan ik met kaart betalen?','Czy mogę zapłacić kartą?','Mohu platit kartou?','Kartla ödeyebilir miyim?','Μπορώ να πληρώσω με κάρτα;','Можно оплатить картой?','Можна оплатити карткою?','可以刷卡吗？','カードで払えますか？','카드로 결제할 수 있나요?','هل يمكنني الدفع بالبطاقة؟')},
    {id:'toilet',de:'Wo ist die Toilette?',target:T('Kje je stranišče?','¿Dónde está el baño?','Où sont les toilettes ?','Wo ist die Toilette?','Dov’è il bagno?','Onde fica a casa de banho?','Waar is het toilet?','Gdzie jest toaleta?','Kde je toaleta?','Tuvalet nerede?','Πού είναι η τουαλέτα;','Где туалет?','Де туалет?','洗手间在哪里？','トイレはどこですか？','화장실이 어디예요?','أين الحمام؟')}
  ]},
  {id:'communication',title:'Verstehen & Notfall',subtitle:'Nachfragen, langsameres Sprechen und Hilfe im Notfall.',phrases:[
    {id:'understand',de:'Ich verstehe nicht.',target:T('Ne razumem.','No entiendo.','Je ne comprends pas.','Ich verstehe nicht.','Non capisco.','Não entendo.','Ik begrijp het niet.','Nie rozumiem.','Nerozumím.','Anlamıyorum.','Δεν καταλαβαίνω.','Я не понимаю.','Я не розумію.','我不明白。','わかりません。','이해하지 못해요.','لا أفهم.')},
    {id:'slowly',de:'Sprechen Sie bitte langsamer.',target:T('Prosim, govorite počasneje.','Hable más despacio, por favor.','Parlez plus lentement, s’il vous plaît.','Sprechen Sie bitte langsamer.','Parli più lentamente, per favore.','Fale mais devagar, por favor.','Spreek alstublieft langzamer.','Proszę mówić wolniej.','Mluvte prosím pomaleji.','Lütfen daha yavaş konuşun.','Μιλήστε πιο αργά, παρακαλώ.','Говорите, пожалуйста, медленнее.','Говоріть, будь ласка, повільніше.','请说慢一点。','もう少しゆっくり話してください。','좀 더 천천히 말해 주세요.','تكلم ببطء أكثر، من فضلك.')},
    {id:'police',de:'Rufen Sie bitte die Polizei.',target:T('Pokličite policijo, prosim.','Llame a la policía, por favor.','Appelez la police, s’il vous plaît.','Rufen Sie bitte die Polizei.','Chiami la polizia, per favore.','Chame a polícia, por favor.','Bel de politie, alstublieft.','Proszę zadzwonić na policję.','Zavolejte prosím policii.','Lütfen polisi arayın.','Καλέστε την αστυνομία, παρακαλώ.','Вызовите полицию, пожалуйста.','Викличте поліцію, будь ласка.','请报警。','警察を呼んでください。','경찰을 불러 주세요.','اتصل بالشرطة، من فضلك.')},
    {id:'doctor',de:'Ich brauche einen Arzt.',target:T('Potrebujem zdravnika.','Necesito un médico.','J’ai besoin d’un médecin.','Ich brauche einen Arzt.','Ho bisogno di un medico.','Preciso de um médico.','Ik heb een dokter nodig.','Potrzebuję lekarza.','Potřebuji lékaře.','Doktora ihtiyacım var.','Χρειάζομαι γιατρό.','Мне нужен врач.','Мені потрібен лікар.','我需要医生。','医者が必要です。','의사가 필요해요.','أحتاج إلى طبيب.')}
  ]}
];

const languageNames:Record<string,string>={sl:'Slowenisch',es:'Spanisch',fr:'Französisch',de:'Deutsch',it:'Italienisch',pt:'Portugiesisch',nl:'Niederländisch',pl:'Polnisch',cs:'Tschechisch',tr:'Türkisch',el:'Griechisch',ru:'Russisch',uk:'Ukrainisch',zh:'Chinesisch',ja:'Japanisch',ko:'Koreanisch',ar:'Arabisch'};
function lessonFor(language:string,unit:UnitSpec,phrase:Phrase,index:number):Lesson{
  const target=phrase.target[language],targets=unit.phrases.map(item=>item.target[language]),sources=unit.phrases.map(item=>item.de);
  return expandLesson({id:`${language}-a1-${unit.id}-l${index+1}`,courseId:`de-${language}`,level:'A1',unitId:`${language}-a1-${unit.id}`,title:phrase.de.replace(/[.!?]$/,''),subtitle:`Aktiv verwenden: ${phrase.de}`,estimatedMinutes:7,newConcepts:[`starter.${unit.id}.${phrase.id}`],exercises:[
    {id:`${phrase.id}-mc`,type:'multiple-choice',instruction:'Wähle die passende Formulierung in der Zielsprache.',prompt:phrase.de,choices:targets,answer:target,conceptIds:[`starter.${unit.id}.${phrase.id}`],difficulty:1,xp:6},
    {id:`${phrase.id}-tr`,type:'translation',instruction:'Übersetze in die Zielsprache.',prompt:'Formuliere den Satz natürlich.',sourceText:phrase.de,acceptedAnswers:[target,target.replace(/[.!?。؟]$/u,'')],conceptIds:[`starter.${unit.id}.${phrase.id}`],difficulty:1,xp:9},
    {id:`${phrase.id}-li`,type:'listening',instruction:'Höre zu und wähle die Bedeutung.',prompt:'Was bedeutet die Aussage?',speech:target,choices:sources,answer:phrase.de,conceptIds:[`starter.${unit.id}.${phrase.id}`],difficulty:1,xp:9},
    {id:`${phrase.id}-di`,type:'dictation',instruction:'Höre zu und schreibe die Aussage.',prompt:'Schreibe, was du hörst.',speech:target,acceptedAnswers:[target,target.replace(/[.!?。؟]$/u,'')],conceptIds:[`starter.${unit.id}.${phrase.id}`],difficulty:2,xp:10},
    {id:`${phrase.id}-sp`,type:'speaking',instruction:'Sprich den Satz selbst.',prompt:phrase.de,speech:target,acceptedAnswers:[target,target.replace(/[.!?。؟]$/u,'')],conceptIds:[`starter.${unit.id}.${phrase.id}`],difficulty:2,xp:10}
  ]});
}
export function starterCourseLevels(language:string):CourseLevel[]{
  const name=languageNames[language];if(!name)return[];
  const courseUnits:CourseUnit[]=units.map((unit,unitIndex)=>({id:`${language}-a1-${unit.id}`,number:unitIndex+1,title:unit.title,subtitle:unit.subtitle,lessons:unit.phrases.map((phrase,index)=>lessonFor(language,unit,phrase,index))}));
  return[{id:'A1',title:'Starter',descriptor:'Alltag, Reise & erste Gespräche',goal:`Die wichtigsten ${name}-Sätze verstehen, hören, sprechen und in typischen Alltagssituationen selbst produzieren.`,units:courseUnits,productionTargetUnits:4}];
}
export const starterCourseLanguages=Object.keys(languageNames);
