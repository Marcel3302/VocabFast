import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const failures=[];
const read=path=>readFileSync(resolve(root,path),'utf8');
const requireFile=(path,message)=>{if(!existsSync(resolve(root,path)))failures.push(message);};
const requireText=(path,text,message)=>{if(!read(path).includes(text))failures.push(message);};
const forbidText=(path,text,message)=>{if(read(path).includes(text))failures.push(message);};

requireFile('public/robots.txt','robots.txt is missing.');
requireFile('public/sitemap.xml','sitemap.xml is missing.');
requireFile('public/impressum.html','Impressum is missing.');
requireFile('public/datenschutz.html','Privacy policy is missing.');
requireFile('public/nutzungsbedingungen.html','Terms page is missing.');
requireFile('public/widerruf.html','Pro/withdrawal information is missing.');

requireText('src/components/WelcomeGate.tsx','Passwort vergessen?','Self-service password recovery is missing from login.');
requireText('src/components/WelcomeGate.tsx','requestPasswordReset','Password reset request is not wired.');
requireText('src/components/WelcomeGate.tsx','resetPasswordWithToken','Password reset confirmation is not wired.');
requireText('src/learning/account.ts','/api/preview/auth/password-reset/request','Password reset request API client is missing.');
requireText('src/learning/account.ts','/api/preview/auth/password-reset/confirm','Password reset confirmation API client is missing.');
requireText('src/preview-entry.js','requestPasswordReset','Password reset backend is missing.');
requireText('src/preview-entry.js','confirmPasswordReset','Password reset confirmation backend is missing.');
requireText('src/preview-entry.js','RESEND_API_KEY','Transactional email integration is missing.');
requireText('src/preview-entry.js','RESET_TOKEN_TTL_MS=20*60*1000','Password reset token must expire after 20 minutes.');
requireText('src/preview-entry.js','publicSurfaceResponse','Public pages are not protected from global API noindex headers.');
requireText('public/robots.txt','Disallow: /api/','robots.txt must block API crawling.');
requireText('public/robots.txt','Disallow: /admin','robots.txt must block admin crawling.');
requireText('public/sitemap.xml','https://vocabfast.net/','Public sitemap must contain the VocabFast homepage.');
forbidText('index.html','noindex,nofollow','Public homepage must not be marked noindex.');
forbidText('src/components/WelcomeGate.tsx','Testkauf öffnen','Public login must not expose test checkout.');

if(failures.length){
  console.error('\nVocabFast public-beta readiness audit failed:\n');
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log('VocabFast public-beta readiness audit passed.');
console.log('Checked: public indexing surface, robots/sitemap, legal pages, self-service password recovery wiring, transactional email adapter, reset expiry and hidden test checkout.');
