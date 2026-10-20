import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {mkdtempSync,writeFileSync,rmSync,utimesSync} from 'node:fs';import {tmpdir} from 'node:os';import {spawnSync} from 'node:child_process';import {createSaaS} from '../saas.mjs';import {createMail} from '../mail.mjs';import {createErasure} from '../erasure.mjs';import {createOperations} from '../operations.mjs';
test('CLI restore applies current encrypted offsite erasure ledger to an older snapshot',async()=>{
 const dir=mkdtempSync(tmpdir()+'/rainy-restore-'),db=new DatabaseSync(':memory:'),env={SETTINGS_ENCRYPTION_KEY:'d'.repeat(64),BACKUP_REMOTE_URL:'https://storage.example/backups/',BACKUP_REMOTE_TOKEN:'fake-token'},uploads=new Map();
 db.exec('CREATE TABLE sessions(hash TEXT PRIMARY KEY,user TEXT,expires INTEGER);CREATE TABLE kv(key TEXT PRIMARY KEY,value TEXT)');
 const saas=createSaaS({db,env}),mail=createMail({db,saas,env}),erasure=createErasure({db,mail}),ops=createOperations({db,saas,env,dataDir:dir,runMonitor:async()=>({status:'completed'}),upload:async({name,data})=>{uploads.set(name,data);return{configured:true,verified:true}}});
 try{
 const user=await saas.register({name:'Erased',email:'erase@example.com',password:'original-password-123'}),keep=await saas.register({name:'Keep',email:'keep@example.com',password:'original-password-123'});
 const snapshot=await ops.makeBackup();erasure.erase('local:'+user.id);await ops.syncErasureLedger();assert.ok(uploads.has('erasure-ledger.enc'));
 const input=dir+'/snapshot.enc',ledger=dir+'/current-ledger.enc',output=dir+'/restored.sqlite';writeFileSync(input,uploads.get(snapshot.name));writeFileSync(ledger,uploads.get('erasure-ledger.enc'));
 const cli=spawnSync(process.execPath,['restore-backup.mjs',input,output,ledger],{env:{...process.env,SETTINGS_ENCRYPTION_KEY:env.SETTINGS_ENCRYPTION_KEY},encoding:'utf8'});assert.equal(cli.status,0,cli.stderr);
 const check=new DatabaseSync(output);try{assert.equal(check.prepare('SELECT id FROM accounts WHERE id=?').get(user.id),undefined);assert.ok(check.prepare('SELECT id FROM accounts WHERE id=?').get(keep.id));assert.equal(check.prepare('PRAGMA integrity_check').get().integrity_check,'ok')}finally{check.close()}
 const withoutLedger=spawnSync(process.execPath,['restore-backup.mjs',input,dir+'/unsafe.sqlite'],{env:{...process.env,SETTINGS_ENCRYPTION_KEY:env.SETTINGS_ENCRYPTION_KEY}});assert.notEqual(withoutLedger.status,0);
 utimesSync(dir+'/backups/'+snapshot.name,new Date(Date.now()-49*3600000),new Date(Date.now()-49*3600000));ops.prune();assert.equal(ops.summary().backups.length,0);
 }finally{db.close();rmSync(dir,{recursive:true,force:true})}
});
