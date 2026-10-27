import {paintScenery} from '../../../gameplay/scenery';
import type {CarnivalState} from '../../../gameplay/party';
const ink='#182642';
export function paintCarnival(c:CanvasRenderingContext2D,s:CarnivalState,identity:string,isFr:boolean,aim?:number,reducedMotion=false){
 c.clearRect(0,0,600,420);paintScenery(c,s.kind==='pie'?'bakery':'pressure',600,420);
 c.fillStyle='#f0bd70';c.beginPath();c.moveTo(0,0);c.lineTo(600,0);c.lineTo(600,55);for(let x=600;x>=0;x-=50)c.lineTo(x,x%100===0?35:65);c.closePath();c.fill();
 const self=s.bodies.find(p=>p.id===identity)||s.bodies[0],rival=s.bodies.find(p=>p.id!==self.id)!;
 const bodies=s.kind==='pie'?[rival,self]:[self,rival];
 for(const [i,p] of bodies.entries()){
  const x=s.kind==='pie'?70+p.x*460:150+i*300,y=s.kind==='pie'?(i===0?145:330):310;
  const impact=s.events.some(e=>e.id===p.id&&e.age<280&&['splat','bullseye','revenge-hit','pop','blocked'].includes(e.kind));
  const squash=impact&&!reducedMotion?Math.sin(Math.min(1,([...s.events].reverse().find(e=>e.id===p.id)?.age||0)/280)*Math.PI)*.15:0;
  c.fillStyle='#18264224';c.beginPath();c.ellipse(x,y+52,57,12,0,0,Math.PI*2);c.fill();
  c.save();c.translate(x,y+(p.ducking?40:0));c.scale(1+squash,1-squash);

  c.strokeStyle=ink;c.lineWidth=5;c.fillStyle=p.id===self.id?'#ffda68':'#fc9f9e';
  c.beginPath();c.roundRect(-44,-35,88,85,24);c.fill();c.stroke();
  // Original carnival cast: Cornichon with a quiff, Moustache with eyebrows.
  c.fillStyle=p.slot===0?'#42645a':'#663c5c';
  c.beginPath();if(p.slot===0){c.moveTo(-25,-34);c.lineTo(-16,-58);c.lineTo(-3,-41);c.lineTo(12,-63);c.lineTo(20,-35);}else{c.moveTo(-30,-33);c.lineTo(-10,-48);c.lineTo(5,-34);c.lineTo(23,-45);c.lineTo(31,-31);}c.closePath();c.fill();c.stroke();
  if(p.shield){c.fillStyle='#a9becd';c.beginPath();c.ellipse(0,-39,49,23,0,Math.PI,Math.PI*2);c.lineTo(49,-34);c.lineTo(-49,-34);c.closePath();c.fill();c.stroke();c.fillStyle=ink;for(const dx of [-24,0,24]){c.beginPath();c.arc(dx,-48,3,0,Math.PI*2);c.fill();}}

  // Disproportionate ears, anxious eyebrows, teeth and cream create real reactions.
  for(const side of [-1,1]){c.beginPath();c.ellipse(side*45,-3,10,16,0,0,Math.PI*2);c.fill();c.stroke();}
  c.fillStyle='#fffdf0';for(const side of [-1,1]){c.beginPath();c.ellipse(side*16,-10,12,p.ducking?3:16,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=ink;c.beginPath();c.arc(side*16,-7,4,0,Math.PI*2);c.fill();c.fillStyle='#fffdf0';}
  if(s.kind==='balloon'&&p.inflating){c.fillStyle='#ed8e91';for(const dx of [-30,30]){c.beginPath();c.ellipse(dx,13,9+p.volume*.08,7+p.volume*.06,0,0,Math.PI*2);c.fill();}}
  if(p.slot===1){c.fillStyle='#663c5c';c.beginPath();c.moveTo(0,8);c.quadraticCurveTo(-13,-2,-23,11);c.quadraticCurveTo(-9,24,0,12);c.quadraticCurveTo(10,24,23,11);c.quadraticCurveTo(11,-2,0,8);c.fill();}
  c.beginPath();c.ellipse(0,25,14,p.volume>70?14:7,0,0,Math.PI*2);c.fill();c.stroke();
  // Work apron: an original pastry-crew costume, with a stitched pocket.
  c.fillStyle=p.id===self.id?'#517f84':'#95627c';c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.roundRect(-31,36,62,16,4);c.fill();c.stroke();c.strokeStyle='#fff3ce';c.lineWidth=2;c.strokeRect(-8,39,16,8);
  c.fillStyle=ink;c.font='900 17px sans-serif';c.textAlign='center';c.fillText(p.id===self.id?(isFr?'TOI':'YOU'):p.bot?'BOT':'RIVAL',0,74);
  if(p.creamed){c.fillStyle='#fffdf0';for(const [dx,dy,r] of [[0,0,28],[-23,0,17],[23,10,18],[0,28,17]]){c.beginPath();c.arc(dx,dy,r,0,Math.PI*2);c.fill();}c.fillStyle='#e7687c';c.beginPath();c.arc(0,-12,7,0,Math.PI*2);c.fill();}
  c.restore();
  if(s.kind==='balloon'){
   const r=20+p.volume*.63,bx=x,by=175-r*.3;
   c.strokeStyle=ink;c.lineWidth=4;c.beginPath();c.moveTo(x,280);c.quadraticCurveTo(x+15,230,bx,by+r);c.stroke();
   c.fillStyle=p.volume>=70?'#ff827e':i===0?'#ffdb68':'#92dcd0';c.beginPath();c.ellipse(bx,by,r*.8,r,reducedMotion?0:Math.sin(s.elapsed/130)*.035,0,Math.PI*2);c.fill();c.stroke();
   c.fillStyle='#ffffff99';c.beginPath();c.ellipse(bx-r*.28,by-r*.3,r*.12,r*.28,-.4,0,Math.PI*2);c.fill();
   c.fillStyle=ink;c.font='900 20px sans-serif';c.textAlign='center';c.fillText(`${Math.round(p.volume)}%`,bx,by+7);
  }
 }
 if(s.kind==='pie'){
  for(const shot of s.shots){const from=shot.id===self.id?330:145,to=shot.target===self.id?330:145,t=shot.progress,x=70+shot.aim*460,y=from+(to-from)*t-Math.sin(t*Math.PI)*65;c.save();c.translate(x,y);c.rotate(reducedMotion?0:t*6);if(shot.revenge)c.scale(1.65,1.65);c.fillStyle=shot.revenge?'#fff1a1':'#fffdf0';c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.ellipse(0,0,23,10,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#e86d83';c.beginPath();c.arc(0,-6,6,0,Math.PI*2);c.fill();c.restore();}
  if(aim!==undefined){const x=70+aim*460;c.strokeStyle='#d14e64';c.lineWidth=3;c.beginPath();c.arc(x,145,25,0,Math.PI*2);c.moveTo(x-36,145);c.lineTo(x+36,145);c.moveTo(x,109);c.lineTo(x,181);c.stroke();}
 }
 const pop=[...s.events].reverse().find(e=>e.kind==='pop'&&e.age<700);
 if(pop&&s.kind==='balloon'){
  const x=pop.id===self.id?150:450,t=pop.age/700;c.strokeStyle='#182642';c.lineWidth=3;
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9,dx=x+Math.cos(a)*(25+t*90),dy=150+Math.sin(a)*(25+t*70);c.fillStyle=i%2?'#ffdf78':'#ee7a9e';c.beginPath();c.moveTo(dx,dy);c.lineTo(dx+Math.cos(a+.5)*15,dy+Math.sin(a+.5)*15);c.lineTo(dx+Math.cos(a-.5)*15,dy+Math.sin(a-.5)*15);c.closePath();c.fill();c.stroke();}
 }
 const e=[...s.events].reverse().find(e=>e.age<850&&['pop','poke','bullseye','splat','dodged','bank','helmet','blocked','revenge-hit'].includes(e.kind));
 if(e){c.font='900 29px sans-serif';c.textAlign='center';c.lineWidth=7;c.strokeStyle=ink;c.fillStyle='#fff3bb';const text=e.kind==='revenge-hit'?(isFr?'RETOUR À L’ENVOYEUR !':'RETURN TO SENDER!'):e.kind==='blocked'?(isFr?'DANS LA PASSOIRE !':'NICE HELMET!'):e.kind==='helmet'?(isFr?'CASQUE GAGNÉ !':'HELMET EARNED!'):e.kind==='pop'?'PAAAAF !':e.kind==='poke'?(isFr?'PETIT TRAÎTRE !':'SNEAKY!'):e.kind==='bullseye'?(isFr?'PLEINE TRONCHE !':'RIGHT IN THE FACE!'):e.kind==='splat'?'SPLAAAT !':e.kind==='dodged'?(isFr?'ESQUIVÉ ! À MOI !':'DODGED! MY TURN!'):`+${e.value} !`;c.strokeText(text,300,245,570);c.fillText(text,300,245,570);}
}
