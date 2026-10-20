import {randomUUID} from 'node:crypto';
import {facebookURL} from './core.mjs';
export const TTL=10*60000;
export function liveItems(items,now=Date.now()){return items.filter(x=>Number.isFinite(x.expiresAt)&&x.expiresAt>now)}
export function mergeTransient(existing,found,now=Date.now(),limit=200){
  const current=liveItems(existing,now),seen=new Set(current.map(x=>facebookURL(x.url))),fresh=[];
  for(const row of found){const url=facebookURL(row.url);if(!url||seen.has(url))continue;seen.add(url);fresh.push({...row,url,id:'live:'+randomUUID(),transient:true,expiresAt:now+TTL})}
  return {items:[...fresh,...current].slice(0,limit),added:Math.min(fresh.length,limit)};
}
