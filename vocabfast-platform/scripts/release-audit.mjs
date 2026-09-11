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
requireFile('src/learning/curriculum/hr-a2.ts','Croatian A2 course is missing.');
requireFile('src/learning/curriculum/release-units.ts','Release curriculum expansion is missing.');
requireFile('src/platform-billing.js','Platform billing worker module is missing.');

forbidText('src/components/WelcomeGate.tsx','/admin','Public welcome page must not expose an admin link.');
forbidText('src/components/WelcomeGate.tsx','Admin','Public welcome page must not mention the admin area.');
forbidText('src/components/LessonPlayer.tsx','in diesem Prototyp','Customer lesson UI still contains prototype copy.');
forbidText('src/components/ProModal.tsx','Testkauf öffnen','Customer Pro dialog still contains internal test-button copy.');
forbidText('src/learning/billing.ts','buy.stripe.com/test_','Frontend must not contain a hard-coded Stripe test payment link.');

requireText('src/components/ProModal.tsx',"billing?.mode==='test'",'Stripe test-mode copy must be driven by server billing state.');
requireText('src/components/ProModal.tsx','/api/preview/billing/status','Pro dialog does not load server billing state.');
requireText('src/components/ProModal.tsx',"activePlan?'portal':'checkout'",'Pro dialog is not switching between checkout and billing portal.');
requireText('src/learning/account.ts','reconcileBillingReturn','Stripe checkout return is not reconciled into the signed-in account.');
requireText('src/learning/account.ts','/api/preview/billing/sync','Checkout return does not verify the Stripe session server-side.');
requireText('src/platform-billing.js','verifiedEvent','Signed Stripe webhook verification is missing.');
requireText('src/platform-billing.js','checkout/sessions/${encodeURIComponent(sessionId)}','Stripe checkout-return session verification is missing.');
requireText('src/platform-billing.js','client_reference_id!==user.id','Stripe checkout return is not bound to the authenticated VocabFast account.');
requireText('src/platform-billing.js','{CHECKOUT_SESSION_ID}','Stripe success URL does not return the Checkout Session id.');
requireText('wrangler.preview.jsonc','PLATFORM_STRIPE_PRICE_TEST','Cloudflare preview is missing the VocabFast Pro test price configuration.');

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
requireText('src/learning/curriculum/index.ts','croatianA2Units','Croatian A2 is not registered.');
requireText('src/learning/curriculum/index.ts',"id:'A2'",'Croatian multi-level progression is missing.');
requireText('src/preview-entry.js','/api/platform/translate','Authenticated translation API is missing.');
requireText('wrangler.preview.jsonc','vocabfast.net/api/platform/translate','Translation API route is not wired.');
requireText('wrangler.preview.jsonc','vocabfast.net/admin*','The new protected admin SPA route is not wired.');
requireText('wrangler.preview.jsonc','vocabfast.net/api/admin/context','Protected admin context bridge is not wired.');
requireText('wrangler.preview.jsonc','vocabfast.net/api/admin/login','Admin login route must use the internal service bridge.');
requireText('wrangler.preview.jsonc','vocabfast.net/api/admin/logout','Admin logout route must use the internal service bridge.');
requireText('src/preview-entry.js','accountStore(env).fetch(new Request(targetUrl,init))','Admin authentication must use the existing account store, not public DNS.');
requireText('src/admin-auth.js','ADMIN_SETUP_REQUIRED','Missing admin credentials must fail closed.');
requireText('wrangler.preview.jsonc','./src/preview-entry.js','Cloudflare preview must deploy through preview-entry.js.');
requireText('../.github/workflows/platform-selftest.yml','/api/admin/context','CI does not verify the protected admin context bridge.');

if(failures.length){
  console.error('\nVocabFast release-surface audit failed:\n');
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VocabFast release-surface audit passed.');
console.log('Checked: public admin exposure, multilingual onboarding/switching, pair-isolated progress, Croatian A1/A2, translator route, mobile navigation, lesson grading, Stripe checkout/webhook/return-sync wiring and protected admin routing.');
