import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'public', 'data');

function loadBrowserData(file, key) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(dataDir, file), 'utf8'), context, { filename: file });
  return context.window[key];
}

const normalize = value => String(value || '').toLowerCase().trim().replace(/\s+/g, ' ');
const core = loadBrowserData('core-vocabulary.js', 'VOCABFAST_CORE_WORDS');
const packs = loadBrowserData('theme-packs.js', 'VOCABFAST_THEME_PACKS');
const translations = loadBrowserData('theme-translations.js', 'VOCABFAST_THEME_TRANSLATIONS');

const failures = [];
if (!Array.isArray(core) || core.length !== 4500) failures.push(`Kernwortschatz: erwartet 4500, gefunden ${core?.length ?? 0}.`);
const coreUnique = new Set((core || []).map(x => normalize(x.word)));
if (coreUnique.size !== core.length) failures.push(`Kernwortschatz enthält ${core.length - coreUnique.size} Duplikate.`);

const expectedCefr = { A1: 650, A2: 850, B1: 1000, B2: 1100, C1: 900 };
const counts = {};
for (const item of core || []) counts[item.cefr] = (counts[item.cefr] || 0) + 1;
for (const [level, expected] of Object.entries(expectedCefr)) if ((counts[level] || 0) !== expected) failures.push(`${level}: erwartet ${expected}, gefunden ${counts[level] || 0}.`);

const globalThemeTerms = new Map();
let themeTotal = 0;
for (const pack of packs || []) {
  themeTotal += pack.words.length;
  const unique = new Set(pack.words.map(normalize));
  if (unique.size !== pack.words.length) failures.push(`${pack.title}: ${pack.words.length - unique.size} interne Duplikate.`);
  const dict = translations?.[pack.id] || {};
  for (const word of pack.words) {
    if (!String(dict[word] || '').trim()) failures.push(`${pack.title}: keine deutsche Übersetzung für „${word}“.`);
    const key = normalize(word);
    if (!globalThemeTerms.has(key)) globalThemeTerms.set(key, []);
    globalThemeTerms.get(key).push(pack.id);
  }
}
const crossTheme = [...globalThemeTerms].filter(([, where]) => where.length > 1);
if (crossTheme.length) failures.push(`Themenpakete enthalten ${crossTheme.length} paketübergreifende Duplikate: ${crossTheme.slice(0,10).map(([w,p])=>`${w} (${p.join(',')})`).join('; ')}`);

const aviation = translations?.aviation || {};
for (const [word, expected] of Object.entries({ approach: 'Anflug', 'bank angle': 'Querneigungswinkel', altimeter: 'Höhenmesser' })) {
  if (aviation[word] !== expected) failures.push(`Luftfahrt: „${word}“ muss „${expected}“ sein, gefunden „${aviation[word] || ''}“.`);
}

if (failures.length) {
  console.error('VocabFast Datenprüfung FEHLGESCHLAGEN:\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log(`OK: 4.500 eindeutige Kernwörter (${Object.entries(expectedCefr).map(([k,v])=>`${k} ${v}`).join(', ')}).`);
console.log(`OK: ${themeTotal.toLocaleString('de-DE')} Themenbegriffe, global ${globalThemeTerms.size.toLocaleString('de-DE')} eindeutige Begriffe, alle mit deutscher Übersetzung.`);
console.log('OK: Luftfahrt-Stichprobe: approach=Anflug, bank angle=Querneigungswinkel, altimeter=Höhenmesser.');
