const $=s=>document.querySelector(s);const messages={not_configured:'Facebook App-ийн серверийн тохиргоо дутуу байна.',invalid_state:'Нэвтрэх хүсэлтийн хугацаа дууссан. Дахин оролдоно уу.',cancelled:'Facebook нэвтрэлт цуцлагдсан.',not_allowed:'Энэ Facebook аккаунт ажлын орчинд нэвтрэх зөвшөөрөлгүй.',provider:'Facebook баталгаажуулалт амжилтгүй. App тохиргоог шалгана уу.'};const code=new URLSearchParams(location.search).get('error');if(messages[code]){$('#loginerror').hidden=false;$('#loginerror').textContent=messages[code];history.replaceState(null,'','/login')}fetch('/auth/config').then(r=>r.json()).then(d=>{$('#registerbutton').disabled=d.signupEnabled===false;$('#signupnotice').textContent=d.signupEnabled===false?'Шинэ хэрэглэгчийн бүртгэл хаалттай. Админтай холбогдоно уу.':'Имэйлээр бүртгүүлж, 12–200 тэмдэгттэй нууц үг тохируулна.';$('#facebooklogin').setAttribute('aria-disabled',String(!d.facebookEnabled));if(!d.facebookEnabled)$('#facebooklogin').removeAttribute('href');$('#fbnotice').textContent=d.facebookEnabled?'Meta-ийн албан ёсны нэвтрэх хуудас руу шилжинэ.':'Facebook нэвтрэлт тохируулаагүй. Имэйлээр эсвэл админ эрхээр нэвтэрч болно.'}).catch(()=>$('#fbnotice').textContent='Холболтын төлөв уншиж чадсангүй.');$('#loginform').onsubmit=async e=>{e.preventDefault();$('#signin').disabled=true;try{const r=await fetch('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('#username').value,password:$('#password').value})});const d=await r.json();if(!r.ok)throw Error(d.error);location.assign('/')}catch(e){$('#loginerror').textContent=e.message;$('#loginerror').hidden=false;$('#signin').disabled=false}};

$('#registerform').onsubmit=async event=>{
 event.preventDefault();$('#registerbutton').disabled=true;$('#registererror').hidden=true;$('#registerrecovery').hidden=true;
 try{
  const response=await fetch('/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('#registername').value,email:$('#registeremail').value,password:$('#registerpassword').value})});
  const data=await response.json();
  if(!response.ok){const error=Object.assign(Error(data.error||'Бүртгэл үүсгэж чадсангүй. Дахин оролдоно уу.'),{code:data.code});throw error}
  location.assign('/');
 }catch(error){
  const box=$('#registererror');box.textContent=error.message;box.hidden=false;$('#registerrecovery').hidden=error.code!=='EMAIL_IN_USE';box.focus();box.scrollIntoView({block:'nearest',behavior:'smooth'});$('#registerbutton').disabled=error.code==='SIGNUP_DISABLED';
 }
};
$('#registersignin').onclick=()=>{$('#username').value=$('#registeremail').value;$('#password').focus();$('#loginform').scrollIntoView({block:'center',behavior:'smooth'})};
$('#registerreset').onclick=()=>{$('#forgotsection').open=true;$('#forgotemail').value=$('#registeremail').value;$('#forgotemail').focus();$('#forgotsection').scrollIntoView({block:'center',behavior:'smooth'})};

$('#forgotform').onsubmit=async e=>{e.preventDefault();$('#forgotbutton').disabled=true;try{const r=await fetch('/auth/request-reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#forgotemail').value})});const d=await r.json();$('#forgotmessage').textContent=d.message||d.error}catch{$('#forgotmessage').textContent='Холболтын алдаа'}finally{$('#forgotbutton').disabled=false}};
