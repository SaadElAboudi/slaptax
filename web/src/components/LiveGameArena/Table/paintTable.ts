import {paintScenery,paintRim} from '../../../gameplay/scenery';
import type {TableState} from '../../../gameplay/party';
import {paintCharacter,TABLE_CAST} from './tableCharacters';
export function paintTable(ctx:CanvasRenderingContext2D,state:TableState,identity:string,aim:{dx:number;dy:number;power:number}|null,now:number,isFr=true,reduced=false){
 ctx.clearRect(0,0,600,600);paintScenery(ctx,'canteen',600,600);paintRim(ctx,600);
 const b=state.bound,s=600-2*b;
 ctx.fillStyle='#172c4840';ctx.beginPath();ctx.roundRect(b+5,b+16,s,s,30);ctx.fill();
 ctx.fillStyle='#aa6037';ctx.strokeStyle='#182642';ctx.lineWidth=8;ctx.beginPath();ctx.roundRect(b,b,s,s,26);ctx.fill();ctx.stroke();
 ctx.fillStyle=state.elapsed>15000?'#eda75d':'#f3c27c';ctx.beginPath();ctx.roundRect(b+7,b+7,s-14,s-21,21);ctx.fill();
 ctx.save();ctx.beginPath();ctx.roundRect(b+8,b+8,s-16,s-22,20);ctx.clip();
 ctx.strokeStyle='#dda15a';ctx.lineWidth=3;for(let y=80;y<600;y+=75){ctx.beginPath();ctx.moveTo(b,y);ctx.lineTo(600-b,y);ctx.stroke();}
 ctx.strokeStyle='#ffe2a9';ctx.lineWidth=3;ctx.setLineDash([8,12]);ctx.beginPath();ctx.arc(300,300,47,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#cf8b48';ctx.font='900 17px sans-serif';ctx.textAlign='center';ctx.fillText('SLAP$TAX',300,306);ctx.restore();
 if(state.elapsed>10000){ctx.strokeStyle='#d85e4f';ctx.lineWidth=4;ctx.setLineDash([10,10]);ctx.beginPath();ctx.roundRect(b-8,b-8,s+16,s+16,30);ctx.stroke();ctx.setLineDash([]);}
 if(state.cloth&&state.cloth.phase!=='calm'){
  const dir=state.cloth.direction;ctx.save();ctx.fillStyle=state.cloth.phase==='warning'?'#fff4aa':'#ff9e86';ctx.strokeStyle='#182642';ctx.lineWidth=4;
  for(const y of [210,300,390]){ctx.beginPath();const x=dir>0?520:80;ctx.moveTo(x-dir*25,y-18);ctx.lineTo(x+dir*10,y);ctx.lineTo(x-dir*25,y+18);ctx.closePath();ctx.fill();ctx.stroke();}
  ctx.fillStyle='#fff4aa';ctx.font='900 23px sans-serif';ctx.textAlign='center';const text=state.cloth.phase==='warning'?(isFr?'LA NAPPE VA PARTIR !':'HOLD YOUR PLATES!'):(isFr?'NAPPE-OCALYPSE !':'TABLECLOTH CHAOS!');ctx.strokeText(text,300,93,480);ctx.fillText(text,300,93,480);ctx.restore();
 }
 const own=state.bodies.find(p=>p.id===identity);
 if(own&&!own.out){ctx.strokeStyle='#fff6bd';ctx.lineWidth=3;ctx.globalAlpha=.35+.15*Math.sin(now/170);ctx.beginPath();ctx.arc(own.x,own.y,44,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  if(aim){const len=45+aim.power*85,d=Math.hypot(aim.dx,aim.dy)||1,dx=aim.dx/d,dy=aim.dy/d;
   ctx.save();ctx.translate(own.x,own.y);ctx.rotate(Math.atan2(dy,dx));ctx.strokeStyle='#172846';ctx.fillStyle='#ffdf58';ctx.lineWidth=4;
   ctx.beginPath();ctx.moveTo(35,-8);ctx.lineTo(len-16,-8);ctx.lineTo(len-16,-18);ctx.lineTo(len+8,0);ctx.lineTo(len-16,18);ctx.lineTo(len-16,8);ctx.lineTo(35,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
 }
 state.bodies.forEach((p,i)=>{
  if(p.out&&p.fallAge>1500)return;const own=p.id===identity,fall=p.out?Math.min(1,p.fallAge/1000):0;
  ctx.save();ctx.translate(p.x,p.y+fall*38);ctx.rotate(reduced?0:p.out?fall*5:Math.max(-.2,Math.min(.2,p.vx*.025)));ctx.scale(1-fall*.85,1-fall*.85);ctx.globalAlpha=1-fall*.8;
  ctx.fillStyle='#18264240';ctx.beginPath();ctx.ellipse(3,25,34,15,0,0,Math.PI*2);ctx.fill();
  paintCharacter(ctx,p,i,state,now,own&&!!aim,reduced);
  ctx.globalAlpha=1;ctx.font=`900 ${own?17:10}px sans-serif`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#182642';const label=own?(isFr?'TOI':'YOU'):p.bot?`BOT · ${TABLE_CAST[i%4].name}`:'RIVAL';ctx.strokeText(label,0,-44);ctx.fillStyle='white';ctx.fillText(label,0,-44);
  if(own&&!p.out&&p.cooldown>0){ctx.strokeStyle='#fff4af';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,38,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p.cooldown/950));ctx.stroke();}
  ctx.restore();
 });
 const hit=state.lastHit;if(hit&&hit.age<350){const t=hit.age/350;ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=1-t;ctx.fillStyle='#ffdf58';ctx.strokeStyle='#172846';ctx.lineWidth=2;for(let i=0;i<(reduced?0:7);i++){const a=i*Math.PI*2/7,r=22+t*44;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,5*(1-t)+2,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.restore();}
 if(hit&&hit.age<600){ctx.save();ctx.translate(Math.max(64,Math.min(536,hit.x)),Math.max(65,hit.y-58));ctx.rotate(reduced?0:-.12);ctx.font='900 25px sans-serif';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#182642';ctx.fillStyle='#fff4ae';const words=isFr?['POUF !','PAF !','PATATRAS !']:['BONK!','POW!','OOPS!'];const word=words[state.hits%words.length];ctx.strokeText(word,0,0);ctx.fillText(word,0,0);ctx.restore();}
}
