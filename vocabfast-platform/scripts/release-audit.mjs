import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const read=path=>readFileSync(resolve(root,path),'utf8');
const failures=[];
const requireText=(file,text,message)=>{if(!read(file).includes(text))failures.push(message);};
const forbidText=(file,text,message)=>{if(read(file).includes(text))failures.push(message);};
const requireFile=(file,message)=>{if(!existsSync(resolve(root,file)))failures.push(message);};

requireFile('src/mobile-release.css','Mobile release stylesheet is missing.');
requireFile('src/preview-entry.js','Preview entry worker is missing.');
requireFile('src/components/TranslatorView.tsx','Multilingual translator UI is missing.');
requireFile('src/learning/curriculum/hr-a1.ts','Croatian A1 course is missing.');
requireFile('src/learning/curriculum/release-units.ts','Release curriculum expansion is missing.');

forbidText('src/components/WelcomeGate.tsx','/admin','Public welcome page must not expose an admin link.');
forbidText('src/components/WelcomeGate.tsx','Admin','Public welcome page must not mention the admin area.');
forbidText('src/components/LessonPlayer.tsx','in diesem Prototyp','Customer lesson UI still contains prototype copy.');
forbidText('src/components/ProModal.tsx','Testkauf öffnen','Customer Pro dialog still contains internal test-button copy.');

requireText('src/components/ProModal.tsx','developerHost()','Stripe test-mode copy must remain restricted to developer hosts.');
requireText('src/App.tsx','mobile-bottom-nav','Mobile bottom navigation is not wired into the app.');
requireText('src/App.tsx','switchLearningPair','Persistent multi-language switching is not wired into the app.');
requireText('src/components/ProfileView.tsx','learningPairs','Profile language-pair management is missing.');
requireText('src/components/Onboarding.tsx','sourceLanguage','First-run source language selection is missing.');
requireText('src/components/Onboarding.tsx','targetLanguage','First-run target language selection is missing.');
requireText('src/components/LessonPlayer.tsx','seededChoices','Lesson answer choices are not shuffled.');
requireText('src/components/LessonPlayer.tsx','answerMatches','Forgiving production/speech grading is not enabled.');
requireText('src/components/LessonPlayer.tsx','speakLanguage','Lessons are not using target-language speech.');
requireText('src/learning/progress.ts','activePairKey','Progress is not isolated by language pair.');
requireText('src/learning/mastery.ts','activePairKey','Mastery is not isolated by language pair.');
requireText('src/learning/course-state.ts','activePairKey','CEFR/course state is not isolated by language pair.');
requireText('src/learning/curriculum/index.ts','croatianCourseLevels','Croatian course is not registered.');
requireText('src/preview-entry.js','/api/platform/translate','Authenticated translation API is missing.');
requireText('wrangler.preview.jsonc','vocabfast.net/api/platform/translate','Translation API route is not wired.');
requireText('wrangler.preview.jsonc','vocabfast.net/admin*','The new protected admin SPA route is not wired.');
forbidText('wrangler.preview.jsonc','vocabfast.net/api/admin/login','Preview worker must not shadow the production admin login endpoint.');
forbidText('wrangler.preview.jsonc','vocabfast.net/api/admin/logout','Preview worker must not shadow the production admin logout endpoint.');
requireText('wrangler.preview.jsonc','./src/preview-entry.js','Cloudflare preview must deploy through preview-entry.js.');
requireText('../.github/workflows/platform-selftest.yml','/api/preview/admin/context','CI does not verify the protected preview admin context route.');

if(failures.length){
  console.error('\nVocabFast release-surface audit failed:\n');
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VocabFast release-surface audit passed.');
console.log('Checked: public admin exposure, multilingual onboarding/switching, pair-isolated progress, Croatian curriculum, translator route, mobile navigation, lesson shuffling/grading, customer test-copy gates and protected admin routing.');
