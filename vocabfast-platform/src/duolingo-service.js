function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive',...headers}})}
function sameOrigin(request){const origin=request.headers.get('Origin');return !origin||origin===new URL(request.url).origin;}
function accountStore(env){if(!env?.PREVIEW_ACCOUNTS)throw new Error('account-store-unavailable');const id=env.PREVIEW_ACCOUNTS.idFromName('global');return env.PREVIEW_ACCOUNTS.get(id);}
async function platformUser(request,env){const probe=new Request(new URL('/api/preview/me',request.url),{method:'GET',headers:request.headers});const response=await accountStore(env).fetch(probe);if(!response.ok)return null;const data=await response.json().catch(()=>({}));return data.user||null;}
function clean(value,max=120){return String(value??'').replace(/\0/g,'').trim().replace(/\s+/g,' ').slice(0,max);}
function safeUsername(value){const username=clean(value,80);return /^[A-Za-z0-9._-]{2,80}$/.test(username)?username:'';}
function num(value){const parsed=Number(value);return Number.isFinite(parsed)&&parsed>=0?Math.round(parsed):0;}
function normalizeCourse(course){if(!course||typeof course!=='object')return null;return{id:clean(course.id,120),title:clean(course.title,120),learningLanguage:clean(course.learningLanguage,12),fromLanguage:clean(course.fromLanguage,12),xp:num(course.xp),crowns:num(course.crowns)};}
export async function duolingoProfileApi(request,env){
  if(request.method!=='GET')return json({error:'Methode nicht erlaubt.'},405,{Allow:'GET'});
  if(!sameOrigin(request))return json({error:'Ungültiger Ursprung.'},403);
  const user=await platformUser(request,env);if(!user)return json({error:'Bitte zuerst anmelden.'},401);
  const url=new URL(request.url),username=safeUsername(url.searchParams.get('username'));
  if(!username)return json({error:'Bitte gib einen gültigen Duolingo-Benutzernamen ein.'},400);
  const upstreamUrl='https://www.duolingo.com/2017-06-30/users?username='+encodeURIComponent(username);
  try{
    const upstream=await fetch(upstreamUrl,{headers:{Accept:'application/json','User-Agent':'VocabFast/1.0 (+https://vocabfast.net)'}});
    if(upstream.status===404)return json({error:'Dieses Duolingo-Profil wurde nicht gefunden.'},404);
    if(!upstream.ok)return json({error:'Duolingo ist gerade nicht erreichbar. Bitte versuche es später erneut.'},502);
    const data=await upstream.json().catch(()=>null),profile=Array.isArray(data?.users)?data.users[0]:null;
    if(!profile)return json({error:'Das Duolingo-Profil ist nicht öffentlich verfügbar oder konnte nicht gelesen werden.'},404);
    const courses=Array.isArray(profile.courses)?profile.courses.map(normalizeCourse).filter(Boolean).slice(0,30):[];
    return json({ok:true,profile:{
      username:clean(profile.username||username,80),
      name:clean(profile.name,120),
      streak:num(profile.streak),
      totalXp:num(profile.totalXp),
      monthlyXp:num(profile.monthlyXp),
      learningLanguage:clean(profile.learningLanguage,12),
      fromLanguage:clean(profile.fromLanguage,12),
      courses,
      fetchedAt:Date.now()
    }});
  }catch(error){console.error('duolingo profile sync failed',error);return json({error:'Die Duolingo-Verknüpfung konnte gerade nicht aktualisiert werden.'},502);}
}
