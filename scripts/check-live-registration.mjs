import {randomUUID,randomBytes} from 'node:crypto';
const base=process.env.LIVE_BASE_URL||'https://rainy-lead-finder-production.up.railway.app';
const url=new URL(base);if(url.protocol!=='https:')throw Error('HTTPS required');
const email='registration-check-'+randomUUID()+'@example.invalid',password=randomBytes(32).toString('hex');
const post=(path,data,cookie='')=>fetch(url.origin+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:url.origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data),redirect:'manual',signal:AbortSignal.timeout(20000)});
const cookieOf=res=>res.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
const signup=await post('/auth/register',{name:'Түр бүртгэлийн шалгалт',email,password});const data=await signup.json();
console.log(JSON.stringify({phase:'signup',status:signup.status,code:data.code||null,error:data.error||null}));
let cookie=cookieOf(signup);
if(!cookie){const login=await post('/auth/login',{username:email,password});cookie=cookieOf(login);console.log(JSON.stringify({phase:'login-after-signup',status:login.status}))}
if(cookie){const removal=await post('/api/account/delete',{confirm:'УСТГАХ',password},cookie);console.log(JSON.stringify({phase:'temporary-account-cleanup',status:removal.status}));if(!removal.ok)throw Error('Temporary account cleanup failed')}
if(!signup.ok)process.exitCode=1;
