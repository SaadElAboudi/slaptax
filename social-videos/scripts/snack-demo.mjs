import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {createParty,beginParty,actParty,tickParty,publicParty}=require('../../api/games/partyGames.js');
export async function prepareSnack(root){
 const g=createParty('snack',['demo-a','demo-b']);beginParty(g,1000);
 const frames=[],events=[];let previous='';
 for(let frame=0;frame<900;frame++){
  const now=1000+frame*1000/30;
  for(const p of g.snack.bodies){
   const carrier=g.snack.bodies.find(b=>b.id===g.snack.box.carrier);
   const home=p.slot?820:80;
   // Scripted demo players use the same input protocol as the real client.
   let target=p.id===carrier?.id?{x:home,y:300}:carrier||g.snack.box;
   if(p.slot===1&&(frame<80||frame>150))target={x:820,y:300};
   const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;
   actParty(g,p.id,{turn:g.turn,action:'input',dx:d<10?0:dx/d,dy:d<10?0:dy/d,ax:dx/d,ay:dy/d},now);
   if(!p.carrying&&carrier?.id!==p.id&&carrier&&Math.hypot(carrier.x-p.x,carrier.y-p.y)<110)actParty(g,p.id,{turn:g.turn,action:'attack'},now);
   if(g.snack.box.carrier===p.id&&Math.abs(p.x-home)<170)actParty(g,p.id,{turn:g.turn,action:'throw'},now);
  }
  tickParty(g,now);
  const snapshot=publicParty(g,'demo-a',now);frames.push(snapshot.snack);
  for(const e of snapshot.snack.events){const key=`${e.at}:${e.kind}:${e.id}`;if(!events.some(v=>v.key===key))events.push({key,frame,kind:e.kind,id:e.id});}
  if(g.phase==='done')break;
 }
 if(!events.some(e=>e.kind==='capture'))throw Error('Scripted demo produced no real delivery');
 await writeFile(path.join(root,'src/snack-demo.json'),JSON.stringify({provenance:'Scripted demonstration resolved by production createParty/actParty/tickParty/publicParty. Not a recorded human match.',fps:30,frames,events}));
 console.log(`Snack engine demo: ${frames.length} frames; ${events.filter(e=>e.kind==='capture').length} deliveries, ${events.filter(e=>e.kind==='hit').length} hits.`);
}
