import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {EventEmitter} from 'node:events';
const require=createRequire(import.meta.url);
const {createParty,beginParty,actParty,tickParty,publicParty}=require('../../api/games/partyGames.js');
const {createSharedArenaManager}=require('../../api/games/sharedArena.js');
const copy=o=>JSON.parse(JSON.stringify(o));
export async function prepareDistinct(root){
 const tower=createParty('onemore',['demo']);beginParty(tower,1000);const frames=[];let bank=null;
 for(let f=0;f<450;f++){
  const now=1000+f*1000/30,run=tower.runs.demo,state=publicParty(tower,'demo',now).runs.demo;
  if(run.status==='playing'&&now-run.motionAt>250){
   const base=run.layers.at(-1),offset=state.moving.x-base.x;
   const drop=run.level<6?offset>.065&&offset<.095:state.moving.x+state.moving.width-base.x<.04;
   if(drop)actParty(tower,'demo',{turn:tower.turn,action:'drop'},now);
   if(run.level===6&&!bank){const branch=copy(tower);actParty(branch,'demo',{turn:branch.turn,action:'bank'},now);bank={frame:f,score:branch.scores.demo,run:publicParty(branch,'demo',now).runs.demo};}
  }
  tickParty(tower,now);frames.push(copy(publicParty(tower,'demo',now).runs.demo));
 }
 if(!bank||tower.runs.demo.status!=='crashed')throw Error(`Tower: bank=${bank?.score}, level=${tower.runs.demo.level}, status=${tower.runs.demo.status}`);
 await writeFile(path.join(root,'src/tower-demo.json'),JSON.stringify({provenance:'Two scripted branches of the production tower engine, not a human record.',frames,bank}));
 const realNow=Date.now,realRandom=Math.random;let now=10000;Date.now=()=>now;Math.random=()=>.5;
 let manager;
 try{
  const duel={id:'demo-bomb',currentRound:1,status:'playing',games:['bombpass'],challengerId:'a',opponentId:'b'};
  manager=createSharedArenaManager({read:()=>({users:[],duels:[duel]}),write:()=>{}},{resolveAuthoritativeDuelRound:()=>({ok:true})});
  const clients={};for(const id of ['a','b']){const c=new EventEmitter();Object.assign(c,{userId:id,readyState:1,bufferedAmount:0,send:()=>{}});manager.attach(c);c.emit('message',JSON.stringify({type:'arena.join',duelId:duel.id,round:1}));clients[id]=c;}
  now=12500;await new Promise(r=>setTimeout(r,65));const session=manager.sessions.get('demo-bomb:1');if(session.phase!=='playing')throw Error('Bomb did not start');
  const start=now,bomb=[];
  for(let f=0;f<450;f++){
   now=start+f*1000/30;const g=session.game,wave=((now-g.markerStartedAt)/1000*g.markerSpeed)%2,marker=wave<=1?wave:2-wave;
   // The first three deliveries use genuine accepted server actions. Then let the fuse expire.
   if(session.phase==='playing'&&g.passes<3&&Math.abs(marker-g.safeCenter)<.025)clients[g.holderId].emit('message',JSON.stringify({type:'arena.action',action:'pass'}));
   if(now>=g.fuseEndsAt&&session.phase==='playing')await new Promise(r=>setTimeout(r,40));
   const next=session.game,w=((now-next.markerStartedAt)/1000*next.markerSpeed)%2;
   bomb.push(copy({holder:next.holderId,passes:next.passes,fuse:Math.max(0,(next.fuseEndsAt-now)/1000),marker:w<=1?w:2-w,center:next.safeCenter,width:next.safeWidth,phase:session.phase,winner:session.winnerId}));
  }
  if(!bomb.some(s=>s.passes===3)||!bomb.some(s=>s.phase==='done'))throw Error('Bomb demonstration has no actual resolution');
  await writeFile(path.join(root,'src/bomb-demo.json'),JSON.stringify({provenance:'Scripted duel resolved by production sharedArena; no human match or live user data.',frames:bomb}));
  console.log(`Distinct demos: tower bank ${bank.score}, risk ${tower.scores.demo}; bomb ${session.game.passes} passes then ${session.finishReason}.`);
 }finally{manager?.close();Date.now=realNow;Math.random=realRandom;}
}
