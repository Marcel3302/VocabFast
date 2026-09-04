export type ConceptMeta = {
  id: string;
  label: string;
  translation?: string;
  category: 'Wortschatz' | 'Grammatik' | 'Kommunikation';
};

export const conceptCatalog: ConceptMeta[] = [
  { id:'greeting.hello', label:'hello / hi', translation:'hallo', category:'Kommunikation' },
  { id:'greeting.goodbye', label:'goodbye', translation:'auf Wiedersehen', category:'Kommunikation' },
  { id:'intro.name', label:'my name is …', translation:'mein Name ist …', category:'Kommunikation' },
  { id:'pronoun.i', label:'I', translation:'ich', category:'Grammatik' },
  { id:'verb.be.am', label:'I am', translation:'ich bin', category:'Grammatik' },
  { id:'verb.be.is', label:'is', translation:'ist', category:'Grammatik' },
  { id:'verb.be.are', label:'are', translation:'bist / seid / sind', category:'Grammatik' },
  { id:'courtesy.please', label:'please', translation:'bitte', category:'Kommunikation' },
  { id:'courtesy.thanks', label:'thank you', translation:'danke', category:'Kommunikation' },
  { id:'courtesy.you-are-welcome', label:'you’re welcome', translation:'gern geschehen', category:'Kommunikation' },
  { id:'courtesy.sorry', label:'sorry', translation:'Entschuldigung / tut mir leid', category:'Kommunikation' },
  { id:'cafe.coffee', label:'coffee', translation:'Kaffee', category:'Wortschatz' },
  { id:'cafe.tea', label:'tea', translation:'Tee', category:'Wortschatz' },
  { id:'cafe.want', label:'I would like …', translation:'ich möchte …', category:'Kommunikation' },
  { id:'cafe.order', label:'ordering', translation:'bestellen', category:'Kommunikation' },
  { id:'cafe.bill', label:'the bill', translation:'die Rechnung', category:'Wortschatz' },
  { id:'number.1-20', label:'numbers 1–20', translation:'Zahlen 1–20', category:'Wortschatz' },
  { id:'age.ask', label:'How old are you?', translation:'Wie alt bist du?', category:'Kommunikation' },
  { id:'age.answer', label:'… years old', translation:'… Jahre alt', category:'Kommunikation' },
  { id:'origin.ask', label:'Where are you from?', translation:'Woher kommst du?', category:'Kommunikation' },
  { id:'origin.from', label:'from', translation:'aus / von', category:'Grammatik' },
  { id:'country.austria', label:'Austria', translation:'Österreich', category:'Wortschatz' },
  { id:'country.germany', label:'Germany', translation:'Deutschland', category:'Wortschatz' },
  { id:'country.england', label:'England', translation:'England', category:'Wortschatz' },
  { id:'question.what-name', label:'What is your name?', translation:'Wie heißt du?', category:'Kommunikation' },
  { id:'question.where-live', label:'Where do you live?', translation:'Wo wohnst du?', category:'Kommunikation' },
  { id:'question.speak-english', label:'Do you speak English?', translation:'Sprichst du Englisch?', category:'Kommunikation' },
  { id:'verb.live', label:'live', translation:'wohnen / leben', category:'Wortschatz' },
  { id:'verb.speak', label:'speak', translation:'sprechen', category:'Wortschatz' },
  { id:'article.a', label:'a', translation:'ein / eine', category:'Grammatik' },
  { id:'article.an', label:'an', translation:'ein / eine vor Vokallaut', category:'Grammatik' },
  { id:'demonstrative.this', label:'this', translation:'dies / das hier', category:'Grammatik' },
  { id:'demonstrative.that', label:'that', translation:'das dort', category:'Grammatik' },
  { id:'noun.book', label:'book', translation:'Buch', category:'Wortschatz' },
  { id:'noun.apple', label:'apple', translation:'Apfel', category:'Wortschatz' }
];

export function conceptMeta(id: string) {
  return conceptCatalog.find(item => item.id === id) ?? { id, label: id, category: 'Wortschatz' as const };
}
