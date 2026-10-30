import {paintRoyalChicken,paintChickenFloor,paintEggWarnings} from './paintChicken';
import type {SnackState} from '../../../gameplay/party';
export interface SnackCamera {x:number;y:number;zoom:number}
const ink='#1a303b';
const team=(p:SnackState['bodies'][number])=>p.team??p.slot;

function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,r=8){c.fillStyle=color;c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();}
export function paintSnack(c:CanvasRenderingContext2D,s:SnackState,id:string,cam:SnackCamera,fr:boolean,now:number,reduced:boolean,viewportHeight=600){
 const me=s.bodies.find(p=>p.id===id)||s.bodies[0],friendly=(p:SnackState['bodies'][number])=>team(p)===team(me);
 c.clearRect(0,0,900,viewportHeight);c.fillStyle='#263f45';c.fillRect(0,0,900,viewportHeight);c.save();c.translate(450,viewportHeight/2);c.scale(cam.zoom,cam.zoom);c.translate(-cam.x,-cam.y);
 rect(c,0,0,900,600,'#a4bbae',15);
 for(let x=0;x<900;x+=60)for(let y=0;y<600;y+=60){c.fillStyle=(x/60+y/60)%2?'#9db3a7':'#b2c6b6';c.fillRect(x+2,y+2,56,56);c.fillStyle='#fff3';c.fillRect(x+3,y+3,52,2);}
 const light=c.createRadialGradient(450,260,80,450,300,550);light.addColorStop(0,'#fff3c51f');light.addColorStop(1,'#173b4033');c.fillStyle=light;c.fillRect(0,0,900,600);
 if(s.chicken)paintChickenFloor(c);
 // Floor markings guide play, rather than pretending to be collision hazards.
 c.strokeStyle='#e9e4af';c.lineWidth=4;c.setLineDash([12,12]);c.beginPath();c.moveTo(145,300);c.lineTo(755,300);c.stroke();c.setLineDash([]);
 for(const side of [0,1]){const x=side?820:80,own=side===team(me),color=own?'#ffdc72':'#ef9e94';rect(c,x-50,245,100,110,'#486361',20);c.strokeStyle=color;c.lineWidth=6;c.strokeRect(x-42,253,84,94);c.fillStyle=color;c.textAlign='center';c.font='900 13px sans-serif';c.fillText(own?(s.teamMode?(fr?'VOTRE DÉPÔT':'TEAM DEPOT'):(s.chicken?(fr?'TON POULAILLER':'YOUR COOP'):(fr?'TON DÉPÔT':'YOUR DEPOT'))):(fr?'RIVAUX':'RIVALS'),x,235);c.font='900 36px sans-serif';c.fillText(`${s.teamScores?.[side]??s.bodies.find(p=>team(p)===side)?.captures??0}/3`,x,315);}
 // A shape and word identify home even when team colors cannot be distinguished.
 if(me.carrying){const x=team(me)?820:80;c.save();c.strokeStyle='#fff9dd';c.lineWidth=5;c.setLineDash([8,6]);c.beginPath();c.arc(x,300,66,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle='#fff9dd';c.font='900 17px sans-serif';c.textAlign='center';c.fillText(fr?'ICI !':'HOME!',x,390);c.restore();}
 c.save();c.fillStyle='#fff3cc';c.font='900 14px sans-serif';c.textAlign='center';c.fillText(s.chicken?(fr?'FERME ROYALE · FOURNISSEUR DE LA CANTINE':'ROYAL FARM · CANTEEN SUPPLIER'):(fr?'LA CANTINE · REPRENEZ LE GOÛTER':'THE CANTEEN · RECLAIM SNACK TIME'),450,42);c.restore();
 // Stainless benches: the exact public collision rectangles, with feet/shadows.
 for(const w of s.walls){rect(c,w.x+5,w.y+10,w.w,w.h,'#263f4540');rect(c,w.x,w.y,w.w,w.h,s.chicken?'#3c3b61':'#678887');rect(c,w.x+5,w.y+5,w.w-10,w.h-14,s.chicken?'#c0a8cf':'#d2ded1',6);c.strokeStyle='#9db8ae';c.lineWidth=2;for(let y=w.y+20;y<w.y+w.h-15;y+=20){c.beginPath();c.moveTo(w.x+9,y);c.lineTo(w.x+w.w-9,y);c.stroke();}for(const x of [w.x+10,w.x+w.w-10])for(const y of [w.y+10,w.y+w.h-10]){c.fillStyle=ink;c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}}
 c.strokeStyle='#6f9087';c.lineWidth=4;c.beginPath();c.arc(450,300,53,0,Math.PI*2);c.stroke();
 if(!s.box.readyIn&&!s.box.carrier){c.fillStyle=s.box.contested?'#ee9b8277':'#fff5ba55';c.beginPath();c.arc(s.box.x,s.box.y,39,0,Math.PI*2);c.fill();}
 for(const z of s.zones||[]){
  const own=s.bodies.some(p=>p.id===z.owner&&friendly(p));c.save();c.fillStyle=z.activeIn>0?'#dbeaaa44':own?'#acd77e66':'#91c27299';c.strokeStyle=own?'#e4f1aa':'#426d55';c.lineWidth=4;c.setLineDash(z.activeIn>0?[9,8]:[]);c.beginPath();c.arc(z.x,z.y,z.radius,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);
  if(z.activeIn>0&&z.fromX!==undefined&&z.fromY!==undefined){const t=1-z.activeIn/300,x=z.fromX+(z.x-z.fromX)*t,y=z.fromY+(z.y-z.fromY)*t-(reduced?0:Math.sin(t*Math.PI)*60);rect(c,x-9,y-12,18,24,'#b4dc7d',7);}
  if(!z.activeIn){for(const [x,y]of [[-30,-15],[22,24],[35,-27]]){c.strokeStyle='#6e9d63';c.lineWidth=3;c.beginPath();c.ellipse(z.x+x,z.y+y,10,6,.4,0,Math.PI*2);c.stroke();}}
  c.restore();
 }
 if(s.chicken)paintEggWarnings(c,s.chicken,reduced);
 for(const p of s.bodies){
  if(p.respawnIn)continue;
  const own=friendly(p),hit=s.events.find(e=>e.id===p.id&&e.kind==='hit'&&e.age<220),squash=hit&&!reduced?Math.sin(hit.age/220*Math.PI)*.12:0;
  if(p.id===id&&!p.carrying&&!p.windup&&!p.superWindup){const angle=Math.atan2(p.ay,p.ax),range=p.range||112;c.save();c.strokeStyle=(p.ammo??3)>0?'#fff4bf99':'#d9e1df55';c.fillStyle='#fff4bf12';c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y);c.arc(p.x,p.y,range,angle-.95,angle+.95);c.closePath();c.fill();c.setLineDash([5,7]);c.stroke();c.setLineDash([]);const tx=p.x+Math.cos(angle)*range,ty=p.y+Math.sin(angle)*range;c.strokeStyle='#fff5c9';c.lineWidth=3;c.beginPath();c.arc(tx,ty,6,0,Math.PI*2);c.stroke();c.restore();}
  if(p.windup){const a=Math.atan2(p.ay,p.ax);c.fillStyle=own?'#fff0a780':'#ef7f7080';c.strokeStyle=own?'#ffe19a':'#b95354';c.lineWidth=3;c.beginPath();c.moveTo(p.x,p.y);c.arc(p.x,p.y,p.range||112,a-.95,a+.95);c.closePath();c.fill();c.stroke();}
  if(p.superWindup){const angle=Math.atan2(p.superAimY||0,p.superAimX||1);c.fillStyle='#ffda6555';c.strokeStyle='#ffe595';c.lineWidth=5;c.beginPath();c.moveTo(p.x,p.y);c.arc(p.x,p.y,175,angle-1.42,angle+1.42);c.closePath();c.fill();c.stroke();}
  if(p.wardRemaining){c.strokeStyle='#b7e7ff';c.lineWidth=5;c.beginPath();c.arc(p.x,p.y,37,0,Math.PI*2);c.stroke();}
  if(p.skillWindup){c.fillStyle=own?'#ffe6a54a':'#f5a59a55';c.strokeStyle=own?'#fff0b4':'#df8c82';c.lineWidth=4;c.setLineDash([8,7]);c.beginPath();c.arc(p.x,p.y,135,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);}
  if(p.slowed){c.strokeStyle='#5e9359';c.lineWidth=5;c.beginPath();c.ellipse(p.x,p.y+22,35,13,0,0,Math.PI*2);c.stroke();}
  if(p.dashing&&!reduced){c.strokeStyle=own?'#fff3bba0':'#ffcfbba0';c.lineWidth=22;c.lineCap='round';c.beginPath();c.moveTo(p.x-p.ax*45,p.y-p.ay*45);c.lineTo(p.x,p.y);c.stroke();c.lineCap='butt';}
  c.fillStyle='#233e4540';c.beginPath();c.ellipse(p.x+3,p.y+26,26,10,0,0,Math.PI*2);c.fill();
  c.save();c.translate(p.x,p.y);c.scale(1+squash,1-squash);
  if(p.id===id||p.shielded){c.strokeStyle=p.shielded?'#d9f9ed':'#fff0b0';c.lineWidth=3;c.beginPath();c.arc(0,0,31,0,Math.PI*2);c.stroke();}
  const stride=!reduced&&(Math.abs(p.dx)+Math.abs(p.dy)>.1)?Math.sin(now/80)*4:0;
  for(const side of [-1,1])rect(c,side*12-7,17+side*stride,15,9,'#36525b',4);
  if(p.character==='pickle'){
   rect(c,-19,-33,38,62,own?'#afd27b':'#8fba79',18);c.strokeStyle='#5f8c55';c.lineWidth=3;for(const [x,y]of [[-12,-23],[11,-17],[-12,12],[10,20]]){c.beginPath();c.moveTo(x,y);c.lineTo(x+3,y-3);c.stroke();}c.fillStyle='#5e9565';c.strokeStyle=ink;c.beginPath();c.moveTo(-3,-33);c.lineTo(-9,-44);c.lineTo(2,-39);c.lineTo(11,-45);c.lineTo(7,-32);c.fill();c.stroke();
  }else if(p.character==='toast'){
   rect(c,-27,-29,54,57,'#b98356',16);rect(c,-21,-23,42,46,'#f7e1a0',12);c.strokeStyle='#d4ad70';c.lineWidth=2;for(const [x,y]of [[-12,-17],[9,-18],[-13,14]]){c.beginPath();c.moveTo(x,y);c.lineTo(x+4,y+3);c.stroke();}
  }else{
   rect(c,-24,-25,48,49,own?'#ffda72':'#ed9a8c',16);c.fillStyle='#c69552';c.beginPath();c.ellipse(0,-23,23,7,0,0,Math.PI*2);c.fill();c.strokeStyle=ink;c.stroke();
   c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(0,-27);c.quadraticCurveTo(1,-40,9,-38);c.stroke();c.fillStyle='#d66b73';c.beginPath();c.arc(0,-29,6,0,Math.PI*2);c.fill();c.stroke();
  }
  for(const side of [-1,1]){c.fillStyle='white';c.beginPath();c.ellipse(side*9,-7,7,9,0,0,Math.PI*2);c.fill();c.strokeStyle=ink;c.lineWidth=2;c.stroke();c.fillStyle=ink;c.beginPath();c.arc(side*9+p.ax*2,-6+p.ay*2,3,0,Math.PI*2);c.fill();}
  c.strokeStyle=ink;c.lineWidth=2;c.beginPath();if(hit)c.ellipse(0,8,4,6,0,0,Math.PI*2);else{c.moveTo(-5,6);c.quadraticCurveTo(0,13,6,6);}c.stroke();rect(c,-17,18,34,9,own?'#efd27a':'#c97d7c',3);
  // The glove points at the actual aiming direction.
  c.save();c.translate(p.ax*28,p.ay*28);c.rotate(Math.atan2(p.ay,p.ax));rect(c,-8,-9,21,18,'#fff1c5',7);c.restore();
  if(p.guardRemaining){c.save();c.rotate(Math.atan2(p.guardY||0,p.guardX||1));c.strokeStyle='#fff0ad';c.lineWidth=6;c.beginPath();c.arc(0,0,41,-1.3,1.3);c.stroke();rect(c,31,-24,15,48,'#f6dd92',7);c.restore();}
  c.restore();
  c.textAlign='center';c.font='900 12px sans-serif';c.lineWidth=3;c.strokeStyle=ink;const name=p.id===id?(fr?'TOI':'YOU'):own?(fr?'POTE':'MATE'):p.bot?'BOT':'RIVAL';c.strokeText(name,p.x,p.y-48);c.fillStyle='#fff9df';c.fillText(name,p.x,p.y-48);
  for(let i=0;i<(p.maxHp||4);i++)rect(c,p.x-(p.maxHp||4)*6.5+i*13,p.y-41,10,5,i<p.hp?(own?'#d1e991':'#efaca0'):'#506c6b',2);
 }
 if(me.carrying){
  c.save();c.strokeStyle='#fff3ba';c.lineWidth=4;c.setLineDash([8,9]);c.beginPath();c.moveTo(me.x,me.y);let x=me.x,y=me.y,vx=me.ax*720,vy=me.ay*720,bounces=0;
  for(let i=0;i<50;i++){let bounced=false;const nx=x+vx/180,ny=y+vy/180;if(nx<14||nx>886||s.walls.some(w=>nx>w.x-14&&nx<w.x+w.w+14&&y>w.y-14&&y<w.y+w.h+14)){vx=-vx*.8;bounced=true;}else x=nx;if(ny<14||ny>586||s.walls.some(w=>x>w.x-14&&x<w.x+w.w+14&&ny>w.y-14&&ny<w.y+w.h+14)){vy=-vy*.8;bounced=true;}else y=ny;c.lineTo(x,y);if(bounced&&++bounces>=3)break;}c.stroke();c.setLineDash([]);c.beginPath();c.arc(x,y,9,0,Math.PI*2);c.stroke();c.restore();
 }
 if(s.box.flying&&!reduced){c.strokeStyle='#fff0a899';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(s.box.x-(s.box.vx||0)*.05,s.box.y-(s.box.vy||0)*.05);c.lineTo(s.box.x,s.box.y);c.stroke();c.lineCap='butt';}
 if(!s.box.readyIn){const carrier=s.bodies.find(p=>p.id===s.box.carrier),x=s.box.x,y=s.box.y-(carrier?55:0);if(s.chicken){const panic=carrier?1-s.chicken.carryRemaining/s.chicken.carryLimit:0;paintRoyalChicken(c,x,y,1,panic,now,reduced);if(carrier){c.strokeStyle=panic>.75?'#ff9b8b':'#ffe799';c.lineWidth=5;c.beginPath();c.arc(x,y,36,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-panic));c.stroke();}}else{rect(c,x-21,y-16,42,32,'#ffe7a0',7);c.strokeStyle='#ad7750';c.lineWidth=4;c.beginPath();c.moveTo(x-21,y-6);c.lineTo(x+21,y-6);c.moveTo(x,y-16);c.lineTo(x,y+16);c.stroke();c.fillStyle='#c97570';c.beginPath();c.arc(x,y,6,0,Math.PI*2);c.fill();}}
 for(const e of s.events.filter(e=>['super-wave','ward','ward-block','super-brine','heal','chicken-escape','egg-splat','hit','ko','capture','pickup','swing','boing','blocked','guard','throw','pass','intercept','ricochet'].includes(e.kind)&&e.age<650)){
  if(e.kind==='super-wave'){c.save();c.strokeStyle='#ffde78';c.lineWidth=10;c.globalAlpha=1-e.age/650;c.beginPath();c.arc(e.x,e.y,reduced?175:50+e.age*.2,0,Math.PI*2);c.stroke();c.restore();}
  if(e.kind==='boing'){c.save();c.strokeStyle='#fff0a4';c.lineWidth=8;c.globalAlpha=1-e.age/650;c.beginPath();c.arc(e.x,e.y,reduced?135:135+e.age*.08,0,Math.PI*2);c.stroke();c.restore();}
  if(e.kind==='swing'){c.save();c.translate(e.x,e.y);c.rotate(Math.atan2(e.ay||0,e.ax||1));c.strokeStyle='#fff2bc';c.lineWidth=8;c.globalAlpha=1-e.age/650;c.beginPath();c.arc(0,0,70,-.8,.8);c.stroke();c.restore();continue;}
  const word=e.kind==='heal'?(fr?'+1 PV':'+1 HP'):e.kind==='ward-block'?(fr?'PROTÉGÉ !':'PROTECTED!'):e.kind==='ward'?(fr?'BRUNCH SOLIDAIRE !':'TEAM BRUNCH!'):e.kind==='super-wave'?'CATAPULTE !':e.kind==='super-brine'?(fr?'BOCAL GÉANT !':'GIANT JAR!'):e.kind==='chicken-escape'?(fr?'COT COT ! LIBERTÉ !':'CLUCK! FREEDOM!'):e.kind==='egg-splat'?'SPLAAATCH !':e.kind==='throw'?(fr?'ÇA PART !':'CATCH!'):e.kind==='pass'?(fr?'BIEN REÇU !':'NICE PASS!'):e.kind==='intercept'?(fr?'C’EST POUR MOI !':'MINE NOW!'):e.kind==='ricochet'?'BONK !':e.kind==='boing'?'BOOOING !':e.kind==='blocked'?'CRAC !':e.kind==='guard'?(fr?'CROÛTE PRÊTE !':'CRUST READY!'):e.kind==='hit'?'PAF !':e.kind==='ko'?'KO !':e.kind==='capture'?(fr?'LIVRÉ !':'DELIVERED!'):(fr?'AU DÉPÔT !':'BRING IT HOME!');c.font='900 20px sans-serif';c.textAlign='center';c.lineWidth=5;c.strokeStyle=ink;c.fillStyle='#fff2bb';const y=e.y-66-(reduced?0:e.age/40);const textX=Math.max(95,Math.min(805,e.x));c.strokeText(word,textX,y);c.fillText(word,textX,y);
 }
 c.restore();
 // Always-visible objective pointers survive the mobile follow camera.
 const self=s.bodies.find(p=>p.id===id)||s.bodies[0],target=s.box.carrier===self.id?{x:team(self)?820:80,y:300}:s.box;
 const tx=(target.x-cam.x)*cam.zoom+450,ty=(target.y-cam.y)*cam.zoom+viewportHeight/2;
 if(tx<35||tx>865||ty<45||ty>viewportHeight-35){const x=Math.max(32,Math.min(868,tx)),y=Math.max(42,Math.min(viewportHeight-35,ty));c.save();c.translate(x,y);c.rotate(Math.atan2(ty-viewportHeight/2,tx-450));c.fillStyle='#ffe396';c.strokeStyle=ink;c.lineWidth=4;c.beginPath();c.moveTo(15,0);c.lineTo(-10,-12);c.lineTo(-10,12);c.closePath();c.fill();c.stroke();c.restore();}
}
