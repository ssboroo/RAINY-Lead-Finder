import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {createSaaS} from '../saas.mjs';import {createMail} from '../mail.mjs';import {createErasure,tenantHash} from '../erasure.mjs';
test('erasure isolates tenants, revokes sessions/outbox, anonymizes paid invoices and preserves replay protection',async()=>{
 const db=new DatabaseSync(':memory:'),env={SETTINGS_ENCRYPTION_KEY:'c'.repeat(64),PUBLIC_BASE_URL:'https://example.com',RESEND_API_KEY:'key',EMAIL_FROM:'mail@example.com'};
 db.exec('CREATE TABLE sessions(hash TEXT PRIMARY KEY,user TEXT,expires INTEGER);CREATE TABLE kv(key TEXT PRIMARY KEY,value TEXT);CREATE TABLE activity(tenant TEXT,data TEXT);CREATE TABLE monitors(tenant TEXT);CREATE TABLE notifications(tenant TEXT)');
 const saas=createSaaS({db,env}),mail=createMail({db,saas,env}),erasure=createErasure({db,mail});
 try{
 const u=await saas.register({email:'erase@example.com',name:'Erase',password:'original-password-123'}),tenant='local:'+u.id,other=await saas.register({email:'keep@example.com',name:'Keep',password:'original-password-456'});
 const account=db.prepare('SELECT * FROM accounts WHERE id=?').get(u.id);
 db.prepare('INSERT INTO sessions VALUES (?,?,?)').run('session',JSON.stringify(u),Date.now()+10000);db.prepare('INSERT INTO kv VALUES (?,?)').run('tenant:'+tenant+':state','{"sensitive":true}');db.prepare('INSERT INTO kv VALUES (?,?)').run('tenant:local:'+other.id+':state','{"keep":true}');
 for(const table of ['activity','monitors','notifications'])db.prepare('INSERT INTO '+table+'(tenant) VALUES (?)').run(tenant);
 await mail.requestReset('erase@example.com');const paid=saas.invoice(tenant,'starter');saas.approve(paid.id,'bank-reference-erase');saas.invoice(tenant,'pro');
 erasure.erase(tenant);assert.equal(saas.localEnabled(u.id),false);assert.equal(saas.localEnabled(other.id),true);assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);assert.equal(db.prepare('SELECT count(*) AS n FROM account_tokens').get().n,0);assert.equal(db.prepare('SELECT count(*) AS n FROM mail_queue').get().n,0);assert.equal(db.prepare('SELECT count(*) AS n FROM kv').get().n,1);
 const invoice=db.prepare('SELECT * FROM invoices WHERE id=?').get(paid.id);assert.equal(invoice.tenant,'erased');assert.ok(!invoice.reference.includes('bank-reference'));const replay=saas.invoice('local:'+other.id,'starter');assert.throws(()=>saas.approve(replay.id,'bank-reference-erase'));
 const ledger=erasure.ledger();assert.equal(ledger[0].tenant_hash,tenantHash(tenant));assert.ok(!JSON.stringify(ledger).includes(u.id));
 db.prepare('INSERT INTO accounts(id,email,name,password,created,disabled,email_verified) VALUES (?,?,?,?,?,0,0)').run(account.id,account.email,account.name,account.password,account.created);erasure.apply(ledger);assert.equal(saas.localEnabled(u.id),false);assert.throws(()=>erasure.erase('admin'));
 }finally{db.close()}
});
