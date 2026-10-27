import {paintRim} from '../../../gameplay/scenery';
import type {ToiletState} from '../../../gameplay/party';
const INK='#182642',colors=['#ffdf68','#ff9388','#baa1ee','#84e3c5'];
export function paintToilet(ctx:CanvasRenderingContext2D,s:ToiletState,identity:string,now:number,fr:boolean,reduced:boolean){
 ctx.clearRect(0,0,600,600);ctx.fillStyle='#b4e4dd';ctx.fillRect(0,0,600,600);
 for(let x=0;x<600;x+=60)for(let y=0;y<600;y+=60){ctx.fillStyle=(x/60+y/60)%2?'#9bd5d2':'#b4e4dd';ctx.fillRect(x+2,y+2,56,56);}
 paintRim(ctx,600);
 // Recessed tile highlights keep the wet floor readable from above.
 ctx.strokeStyle='#ffffff44';ctx.lineWidth=2;for(let y=4;y<600;y+=60){ctx.beginPath();ctx.moveTo(12,y);ctx.lineTo(588,y);ctx.stroke();}
 for(const x of [24,576]){ctx.fillStyle='#607f88';ctx.fillRect(x-5,36,10,528);ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.strokeRect(x-5,36,10,528);for(const y of [60,300,540]){ctx.fillStyle='#cfdfcf';ctx.fillRect(x-9,y,18,9);}}
 const flushing=s.flush==='flush',warning=s.flush==='warning';
 ctx.save();ctx.translate(300,300);ctx.fillStyle=flushing?'#5aa4df':'#6a8fa6';ctx.beginPath();ctx.arc(0,0,flushing?65:43,0,Math.PI*2);ctx.fill();ctx.strokeStyle=warning?'#ffdf68':INK;ctx.lineWidth=5;ctx.stroke();
 ctx.rotate(reduced?0:now/(flushing?160:1300));ctx.strokeStyle='#d8f8ff';ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.arc(0,0,flushing?47:26,.1,1.3);ctx.stroke();}ctx.fillStyle='#233c65';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.restore();
 if(warning){ctx.fillStyle=INK;ctx.font='900 18px sans-serif';ctx.textAlign='center';ctx.fillText(fr?'LA CHASSE ARRIVE !':'FLUSH INCOMING!',300,220);}
 for(const b of s.bumpers){ctx.fillStyle='#935d47';ctx.fillRect(b.x-5,b.y-62,10,55);ctx.strokeStyle=INK;ctx.lineWidth=4;ctx.strokeRect(b.x-5,b.y-62,10,55);ctx.fillStyle='#f38e9b';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffc3c1';ctx.beginPath();ctx.ellipse(b.x-8,b.y-8,8,5,-.4,0,Math.PI*2);ctx.fill();}
 for(const d of s.ducks){ctx.save();ctx.translate(d.x,d.y);if(!reduced)ctx.rotate(Math.sin(now/220+d.id)*.08);ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.fillStyle=d.value===3?'#ffcc45':'#fff299';ctx.beginPath();ctx.ellipse(0,6,13,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(3,-4,9,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f59c4e';ctx.beginPath();ctx.moveTo(10,-5);ctx.lineTo(20,-1);ctx.lineTo(10,2);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(5,-6,2,0,Math.PI*2);ctx.fill();if(d.value===3){ctx.font='900 16px sans-serif';ctx.textAlign='center';ctx.fillText('✦ 3',0,-20);}ctx.restore();}
 for(const p of s.bodies){
  const own=p.id===identity,angle=Math.atan2(p.vy,p.vx);
  if(p.boosting&&!reduced){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);for(let j=0;j<4;j++){ctx.fillStyle=j%2?'#e1eea9':'#b3db92';ctx.beginPath();ctx.arc(-35-j*13,Math.sin(j+now/90)*9,14-j*2,0,Math.PI*2);ctx.fill();}ctx.restore();}
  if(own){ctx.strokeStyle='#fff7bc';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,38,0,Math.PI*2);ctx.stroke();}
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(reduced?0:Math.max(-.28,Math.min(.28,p.vx*.025)));ctx.globalAlpha=p.stunned?.55:1;
  ctx.fillStyle='#18264235';ctx.beginPath();ctx.ellipse(3,28,32,12,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=3.5;
  ctx.fillStyle=INK;for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*20,24,7,10,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#f8f5e9';ctx.beginPath();ctx.roundRect(-24,-28,48,23,7);ctx.fill();ctx.stroke();ctx.fillStyle=colors[p.slot%4];ctx.beginPath();ctx.roundRect(-19,-23,38,11,4);ctx.fill();
  ctx.fillStyle='#fffbed';ctx.beginPath();ctx.ellipse(0,7,27,26,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#86c9ef';ctx.beginPath();ctx.ellipse(0,9,17,16,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  // Each rider peeks out of the bowl; eyes panic when the flush starts.
  ctx.fillStyle=colors[p.slot%4];ctx.beginPath();ctx.ellipse(0,-1,19,15,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  for(const side of [-1,1]){ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(side*8,-4,6,flushing?9:7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(side*8,-3,3,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle=INK;ctx.lineWidth=2.5;ctx.beginPath();if(p.stunned||flushing)ctx.ellipse(0,8,3,5,0,0,Math.PI*2);else{ctx.moveTo(-5,5);ctx.quadraticCurveTo(0,13,5,5);}ctx.stroke();
  ctx.globalAlpha=1;ctx.textAlign='center';ctx.font=`900 ${own?15:10}px sans-serif`;ctx.lineWidth=4;ctx.strokeStyle=INK;const name=own?(fr?'TOI':'YOU'):p.bot?`BOT ${p.slot}`:'RIVAL';ctx.strokeText(`${name} · ${p.loot}`,0,-41);ctx.fillStyle='white';ctx.fillText(`${name} · ${p.loot}`,0,-41);ctx.restore();
 }
 const event=s.event;if(event&&event.age<700){const words={boost:fr?'PROUT !':'PFFT!',bonk:'POC !',steal:fr?'PIQUÉ ! +1':'STOLEN! +1',duck:`+${event.value||1} ${fr?'COIN COIN !':'QUACK!'}`,flush:fr?'PLOUF !':'SPLASH!'};ctx.save();ctx.textAlign='center';ctx.font='900 23px sans-serif';ctx.lineWidth=6;ctx.strokeStyle=INK;ctx.fillStyle=event.kind==='boost'?'#e2f6ac':'#fff3b8';const x=Math.max(100,Math.min(500,event.x)),y=Math.max(65,event.y-55);ctx.strokeText(words[event.kind],x,y);ctx.fillText(words[event.kind],x,y);ctx.restore();}
}
