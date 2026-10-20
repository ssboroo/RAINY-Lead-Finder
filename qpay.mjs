import {createHmac,timingSafeEqual} from 'node:crypto';
const money=value=>{const s=String(value);if(!/^\d{1,12}(\.\d{1,2})?$/.test(s))return null;const [whole,fraction='']=s.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'))};
export function createQPay({db,saas,fetcher=fetch,now=()=>Date.now()}){
 db.exec("CREATE TABLE IF NOT EXISTS qpay_invoices(local_id TEXT PRIMARY KEY,provider_id TEXT UNIQUE,state TEXT NOT NULL,data TEXT NOT NULL,created INTEGER NOT NULL)");
 let cached=null,authenticating=null;const locks=new Map();
 function config(){const c=saas.runtime();let origin;try{const u=new URL(c.PUBLIC_BASE_URL);if(u.protocol==='https:'&&u.pathname==='/'&&!u.search&&!u.hash&&!u.username&&!u.password)origin=u.origin}catch{}return{...c,origin,base:c.QPAY_SANDBOX==='true'?'https://merchant-sandbox.qpay.mn':'https://merchant.qpay.mn',ready:!!(origin&&c.QPAY_USERNAME&&c.QPAY_PASSWORD&&c.QPAY_INVOICE_CODE&&/^[a-f\d]{64}$/i.test(c.QPAY_CALLBACK_SECRET||''))}}
 async function request(path,payload,authorization){const c=config(),r=await fetcher(c.base+path,{method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('QPay үйлчилгээний HTTP '+r.status);const data=await r.json();if(!data||typeof data!=='object')throw Error('QPay хариу буруу');return data}
 async function token(){const c=config();if(!c.ready)throw Error('QPay тохиргоо дутуу');const fingerprint=c.base+':'+c.QPAY_USERNAME+':'+c.QPAY_PASSWORD;if(cached?.fingerprint===fingerprint&&cached.until>now())return cached.value;if(authenticating)return authenticating;authenticating=(async()=>{const d=await request('/v2/auth/token',{},'Basic '+Buffer.from(c.QPAY_USERNAME+':'+c.QPAY_PASSWORD).toString('base64'));if(typeof d.access_token!=='string'||!d.access_token)throw Error('QPay token хариу буруу');const seconds=Number(d.expires_in);const until=Number.isFinite(seconds)&&seconds>0?(seconds>1e9?seconds*1000:now()+seconds*1000):now()+60000;cached={fingerprint,value:d.access_token,until:Math.max(now()+1000,until-30000)};return d.access_token})().finally(()=>authenticating=null);return authenticating}
 const call=async(path,payload)=>request(path,payload,'Bearer '+await token());
 const callbackToken=id=>createHmac('sha256',config().QPAY_CALLBACK_SECRET).update(id).digest('hex');
 async function exclusive(id,work){while(locks.has(id))await locks.get(id).catch(()=>{});const promise=work().finally(()=>locks.delete(id));locks.set(id,promise);return promise}
 function publicRow(row){return row?{state:row.state,...JSON.parse(row.data)}:null}
 async function create(tenant,id){return exclusive(id,async()=>{
  const item=db.prepare('SELECT * FROM invoices WHERE id=? AND tenant=?').get(id,tenant);if(!item||!['pending','submitted'].includes(item.status))throw Error('Төлөх нэхэмжлэх олдсонгүй');if(item.amount<=0)throw Error('QPay төлбөрийн дүн эерэг байна');
  if(!config().ready)throw Error('QPay тохиргоо дутуу');const prior=db.prepare('SELECT * FROM qpay_invoices WHERE local_id=?').get(id);if(prior){if(prior.state==='ready')return publicRow(prior);throw Error('QPay хүсэлтийн төлөв тодорхойгүй. Админтай холбогдоно уу; давхар нэхэмжлэх үүсгэхгүй.')}
  db.prepare("INSERT INTO qpay_invoices VALUES (?,NULL,'creating','{}',?)").run(id,now());
  try{const c=config(),d=await call('/v2/invoice',{invoice_code:c.QPAY_INVOICE_CODE,sender_invoice_no:id,invoice_receiver_code:'terminal',invoice_description:'RAINY Lead Finder '+id,amount:item.amount,callback_url:c.origin+'/api/qpay/callback?id='+encodeURIComponent(id)+'&token='+callbackToken(id)});
   if(typeof d.invoice_id!=='string'||!d.invoice_id||d.invoice_id.length>200||typeof d.qr_image!=='string'||d.qr_image.length>1000000||!/^([A-Za-z0-9+/]+={0,2})$/.test(d.qr_image))throw Error('QPay нэхэмжлэхийн хариу буруу');
   const data={qrImage:d.qr_image,links:(Array.isArray(d.urls)?d.urls:[]).slice(0,50).filter(x=>typeof x.link==='string'&&x.link.length<3000&&/^[a-z][a-z0-9+.-]*:\/\//i.test(x.link)&&!/^((javascript|data|file|vbscript):|https?:\/\/[^/]*@)/i.test(x.link)).map(x=>({name:String(x.description||x.name||'Банкны апп').slice(0,100),url:x.link}))};
   if(!db.prepare('SELECT id FROM invoices WHERE id=? AND tenant=?').get(id,tenant))throw Error('Нэхэмжлэх устгагдсан');
   db.prepare("UPDATE qpay_invoices SET provider_id=?,state='ready',data=? WHERE local_id=?").run(d.invoice_id,JSON.stringify(data),id);return{state:'ready',...data};
  }catch(error){db.prepare("UPDATE qpay_invoices SET state='uncertain',data='{}' WHERE local_id=?").run(id);throw error}
 })}
 function status(tenant,id){const item=db.prepare('SELECT status FROM invoices WHERE id=? AND tenant=?').get(id,tenant);if(!item)throw Error('Нэхэмжлэх олдсонгүй');return{status:item.status,payment:publicRow(db.prepare('SELECT * FROM qpay_invoices WHERE local_id=?').get(id))}}
 async function verify(id){return exclusive(id,async()=>{
  const item=db.prepare('SELECT * FROM invoices WHERE id=?').get(id),mapping=db.prepare('SELECT * FROM qpay_invoices WHERE local_id=?').get(id);if(!item||!mapping?.provider_id)throw Error('QPay нэхэмжлэх бэлэн биш');if(item.status==='paid')return{paid:true};
  const check=await call('/v2/payment/check',{object_type:'INVOICE',object_id:mapping.provider_id,offset:{page_number:1,page_limit:100}});const rows=Array.isArray(check.rows)?check.rows:[];
  const paid=rows.find(row=>row.payment_status==='PAID'&&row.payment_currency==='MNT'&&money(row.payment_amount)===item.amount*100&&typeof row.payment_id==='string'&&row.payment_id.length<=150);
  if(!paid)return{paid:false};
  const r=await fetcher(config().base+'/v2/payment/'+encodeURIComponent(paid.payment_id),{headers:{Authorization:'Bearer '+await token()},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('QPay гүйлгээ баталгаажуулах HTTP '+r.status);const detail=await r.json();
  if(detail.object_type!=='INVOICE'||detail.object_id!==mapping.provider_id||detail.payment_status!=='PAID'||detail.payment_currency!=='MNT'||money(detail.payment_amount)!==item.amount*100)throw Error('QPay гүйлгээний дүн эсвэл нэхэмжлэх зөрсөн');
  const fresh=db.prepare('SELECT status FROM invoices WHERE id=?').get(id);if(!fresh)throw Error('Нэхэмжлэх устгагдсан');if(fresh.status!=='paid')saas.approve(id,'qpay:'+paid.payment_id);
  db.prepare("UPDATE qpay_invoices SET state='paid',data='{}' WHERE local_id=?").run(id);return{paid:true};
 })}
 async function callback(req,res){const u=new URL(req.url,'http://local');if(u.pathname!=='/api/qpay/callback')return false;const reply=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};if(!['GET','POST'].includes(req.method)){reply(405,{error:'Method not allowed'});return true}req.resume();const id=u.searchParams.get('id')||'',provided=u.searchParams.get('token')||'';
  if(!config().ready||!/^[a-f\d-]{36}$/.test(id)||!/^[a-f\d]{64}$/.test(provided)||!timingSafeEqual(Buffer.from(provided),Buffer.from(callbackToken(id)))){reply(403,{error:'Callback rejected'});return true}
  try{reply(200,await verify(id))}catch{reply(503,{error:'Төлбөр баталгаажаагүй. Дахин callback илгээнэ үү.'})}return true;
 }
 return{config,create,status,verify,callback};
}
