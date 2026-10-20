import {createHash} from 'node:crypto';
export const tenantHash=tenant=>createHash('sha256').update(tenant).digest('hex');
export function createErasure({db,mail}){
 db.exec('CREATE TABLE IF NOT EXISTS erasure_ledger(tenant_hash TEXT PRIMARY KEY,deleted_at TEXT NOT NULL)');
 const has=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
 function erase(tenant){
  if(!/^(local:[a-f\d-]{36}|facebook:\d+)$/.test(tenant))throw Error('Хэрэглэгчийн төрөл буруу');
  const split=tenant.indexOf(':'),provider=tenant.slice(0,split),id=tenant.slice(split+1),email=provider==='local'?db.prepare('SELECT email FROM accounts WHERE id=?').get(id)?.email:null;
  db.exec('BEGIN');
  try{
   mail.purgeTenant(tenant,email);
   if(has('sessions'))db.prepare("DELETE FROM sessions WHERE json_extract(user,'$.id')=? AND json_extract(user,'$.provider')=?").run(id,provider);
   if(has('account_tokens'))db.prepare('DELETE FROM account_tokens WHERE user_id=?').run(id);
   for(const table of ['activity','monitors','notifications','subscriptions'])if(has(table))db.prepare('DELETE FROM '+table+' WHERE tenant=?').run(tenant);
   if(has('kv')){const prefix='tenant:'+tenant+':';db.prepare('DELETE FROM kv WHERE substr(key,1,?)=?').run(prefix.length,prefix)}
   if(has('qpay_invoices'))db.prepare('DELETE FROM qpay_invoices WHERE local_id IN (SELECT id FROM invoices WHERE tenant=?)').run(tenant);
   // Retain only anonymized financial totals. Replay protection uses hashed references.
   db.prepare("DELETE FROM invoices WHERE tenant=? AND status!='paid'").run(tenant);
   db.prepare("UPDATE invoices SET tenant='erased',reference='erased:'||id WHERE tenant=? AND status='paid'").run(tenant);
   if(provider==='local')db.prepare('DELETE FROM accounts WHERE id=?').run(id);
   else db.prepare('DELETE FROM external_users WHERE tenant=?').run(tenant);
   db.prepare('INSERT OR REPLACE INTO erasure_ledger VALUES (?,?)').run(tenantHash(tenant),new Date().toISOString());
   db.exec('COMMIT');return{ok:true,financialRecords:'anonymized',backupRetentionHours:48};
  }catch(error){db.exec('ROLLBACK');throw error}
 }
 function ledger(){return db.prepare('SELECT * FROM erasure_ledger ORDER BY deleted_at').all()}
 function apply(rows){if(!Array.isArray(rows)||rows.some(r=>!/^[a-f\d]{64}$/.test(r.tenant_hash)||!Number.isFinite(Date.parse(r.deleted_at))))throw Error('Устгалын жагсаалт буруу');const hashes=new Map(rows.map(r=>[r.tenant_hash,Date.parse(r.deleted_at)]));
  const tenants=[...db.prepare('SELECT id,created FROM accounts').all().map(r=>({tenant:'local:'+r.id,created:Date.parse(r.created)||0})),...db.prepare('SELECT tenant,created FROM external_users').all()];
  for(const row of tenants){const deletedAt=hashes.get(tenantHash(row.tenant));if(deletedAt!==undefined&&row.created<=deletedAt)erase(row.tenant)}
  for(const row of rows)db.prepare('INSERT OR IGNORE INTO erasure_ledger VALUES (?,?)').run(row.tenant_hash,String(row.deleted_at||''));
 }
 return{erase,ledger,apply};
}
