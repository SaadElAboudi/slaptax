import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {createParty,beginParty,actParty,tickParty,publicParty}=require('../../api/games/partyGames.js');
const {position}=require('../../api/games/carnival.js');
const copy=value=>JSON.parse(JSON.stringify(value));
export async function prepareCampaign(root){
 const chroma=createParty('chroma',['demo']);chroma.colorTargets=[[72,178,196]];beginParty(chroma,0);tickParty(chroma,3000);
 const colors=[];let chromaResult;
 for(let f=0;f<360;f++){
  const now=3000+f*1000/30;
  if(!chromaResult){tickParty(chroma,now);
   if(chroma.phase==='mix'){
    const progress=Math.min(1,Math.max(0,(f-60)/120)),answer=[80,166,207],rgb=answer.map((v,i)=>Math.round(128+(v-128)*progress));
    if(!actParty(chroma,'demo',{turn:chroma.turn,action:f>=210?'lock':'color',rgb},now))throw Error('Rejected CHROMA action');
   }
   if(chroma.phase==='reveal')chromaResult=copy(publicParty(chroma,'demo',now));
  }
  colors.push(copy(chromaResult||publicParty(chroma,'demo',now)));
 }
 if(!chromaResult||chromaResult.feedback.color.join(',')!=='72,178,196'||!chromaResult.runs.demo.errors[0])throw Error('CHROMA lacks a real measured result');
 const table=createParty('table',['demo','rival']);beginParty(table,1000);const tableFrames=[];let tableEnd;
 for(let f=0;f<360;f++){
  const now=1000+f*1000/30;
  if(!tableEnd){
   const a=table.table.bodies[0],b=table.table.bodies[1];
   if(f>=60&&!a.out&&!b.out){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);actParty(table,'demo',{turn:table.turn,action:'dash',dx:dx/d,dy:dy/d,power:1},now);}
   tickParty(table,now);if(table.phase==='done')tableEnd=f;
  }
  tableFrames.push(copy(publicParty(table,'demo',now)));
 }
 if(!tableEnd||table.winnerId!=='demo'||table.table.bodies[0].kos!==1)throw Error('Table lacks a server-confirmed knockout');
 const pie=createParty('pie',['demo','rival']);beginParty(pie,1000);const pieFrames=[];const events=new Map();let ducked=0,hits=0;
 for(let f=0;f<360;f++){
  const now=1000+f*1000/30;tickParty(pie,now);
  if(f%45===0)actParty(pie,'demo',{turn:pie.turn,action:'throw',aim:position(1,now-1000+350)},now);
  if(f%90===25)actParty(pie,'rival',{turn:pie.turn,action:'throw',aim:position(0,now-1000+350)},now);
  if(f%90===30)actParty(pie,'demo',{turn:pie.turn,action:'duck'},now);
  const state=copy(publicParty(pie,'demo',now));pieFrames.push(state);
  for(const e of state.carnival.events)events.set(e.serial,e);
 }
 ducked=[...events.values()].filter(e=>e.kind==='dodged').length;hits=[...events.values()].filter(e=>['splat','bullseye','revenge-hit'].includes(e.kind)).length;
 if(!ducked||!hits)throw Error('Pie demo must contain real dodges and hits');
 const data={provenance:'Scripted accepted production actions. No human match, no invented scores. One CHROMA attempt; excerpts for live games.',fps:30,chroma:{frames:colors,result:chromaResult},table:{frames:tableFrames,end:tableEnd},pie:{frames:pieFrames,dodges:ducked,hits}};
 await writeFile(path.join(root,'src/campaign-demo.json'),JSON.stringify(data));
 console.log(`Six-game campaign: CHROMA measured; table KO at frame ${tableEnd}; pie ${hits} hits, ${ducked} dodges.`);
 return data;
}
