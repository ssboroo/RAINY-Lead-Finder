import {test} from 'node:test';import assert from 'node:assert/strict';import {mergeTransient,liveItems,TTL} from '../transient.mjs';
const row=i=>({url:'https://facebook.com/groups/1/posts/'+i,body:'post'});
test('full transient cache admits new results, evicts oldest, and deduplicates canonical links',()=>{
 const first=mergeTransient([],Array.from({length:200},(_,i)=>row(i)),1000);
 const next=mergeTransient(first.items,[row(200),row(0)],2000);
 assert.equal(next.items.length,200);assert.equal(next.added,1);assert.equal(next.items[0].url,row(200).url.replace('facebook.com','www.facebook.com'));assert.ok(!next.items.some(x=>x.url.endsWith('/199')));
});
test('new batches never extend the lifetime of old results',()=>{
 const first=mergeTransient([],[row(1)],1000);const next=mergeTransient(first.items,[row(2)],1000+TTL-1);
 assert.equal(liveItems(next.items,1000+TTL).length,1);assert.equal(liveItems(next.items,1000+TTL)[0].url.endsWith('/2'),true);
});
