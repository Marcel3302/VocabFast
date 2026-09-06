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
requireFile('src/learning/curriculum/release-units.ts','Release curriculum expansion is missing.');

forbidText('src/components/WelcomeGate.tsx','/admin','Public welcome page must not expose an admin link.');
forbidText('src/components/WelcomeGate.tsx','Admin','Public welcome page must not mention the admin area.');
forbidText('src/components/LessonPlayer.tsx','in diesem Prototyp','Customer lesson UI still contains prototype copy.');
forbidText('src/components/ProModal.tsx','Testkauf öffnen','Customer Pro dialog still contains internal test-button copy.');

requireText('src/components/ProModal.tsx','developerHost()','Stripe test-mode copy must remain restricted to developer hosts.');
requireText('src/App.tsx','mobile-bottom-nav','Mobile bottom navigation is not wired into the app.');
requireText('src/components/LessonPlayer.tsx','seededChoices','Lesson answer choices are not shuffled.');
requireText('src/components/LessonPlayer.tsx','answerMatches','Forgiving production/speech grading is not enabled.');
requireText('wrangler.preview.jsonc','./src/preview-entry.js','Cloudflare preview must deploy through preview-entry.js.');
requireText('wrangler.preview.jsonc','vocabfast.net/api/admin/context','Protected admin context route is not wired.');
requireText('../.github/workflows/platform-selftest.yml','protected admin context route','CI does not verify the admin context route.');

if(failures.length){
  console.error('\nVocabFast release-surface audit failed:\n');
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}

console.log('VocabFast release-surface audit passed.');
console.log('Checked: public admin exposure, mobile navigation, lesson shuffling/grading, customer test copy gates and admin route wiring.');
