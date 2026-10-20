import {createHash} from 'node:crypto';
export function offsiteConfig(env){try{const u=new URL(env.BACKUP_REMOTE_URL);return{ready:u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&!!env.BACKUP_REMOTE_TOKEN}}catch{return{ready:false}}}
export async function uploadOffsite({env,name,data,fetcher=fetch}){
 if(!offsiteConfig(env).ready)return{configured:false,verified:false};
 if(!/^[a-zA-Z0-9-]+\.enc$/.test(name))throw Error('Backup filename буруу');
 const url=new URL(encodeURIComponent(name),env.BACKUP_REMOTE_URL.replace(/\/?$/,'/')),headers={Authorization:'Bearer '+env.BACKUP_REMOTE_TOKEN};
 const put=await fetcher(url,{method:'PUT',headers:{...headers,'Content-Type':'application/octet-stream'},body:data,redirect:'error',signal:AbortSignal.timeout(30000)});
 if(!put.ok)throw Error('Offsite upload HTTP '+put.status);
 const get=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(30000)});if(!get.ok)throw Error('Offsite verify HTTP '+get.status);
 const length=Number(get.headers?.get('content-length'));if(length&&length!==data.length)throw Error('Offsite хэмжээ зөрсөн');
 const digest=createHash('sha256').update(data).digest('hex');
 // Read no more than the expected encrypted object size, even if storage misbehaves.
 const chunks=[];let total=0;for await(const chunk of get.body){total+=chunk.length;if(total>data.length)throw Error('Offsite хэмжээ хэтэрсэн');chunks.push(chunk)}
 if(total!==data.length||createHash('sha256').update(Buffer.concat(chunks)).digest('hex')!==digest)throw Error('Offsite checksum зөрсөн');
 return{configured:true,verified:true,sha256:digest};
}
