import {FIELD,KITS,WALLS,type Combat,type Command} from '../../gameplay/combatArena';
export function paintCombat(ctx:CanvasRenderingContext2D,s:Combat,input:Command,width:number,height:number,reduced:boolean){
 const scale=Math.max(width/680,height/900),viewW=width/scale,viewH=height/scale,hero=s.players[0];
 const cx=Math.max(viewW/2-60,Math.min(FIELD.width-viewW/2+60,hero.x+hero.aimX*65)),cy=Math.max(viewH/2-90,Math.min(FIELD.height-viewH/2+180,hero.y+hero.aimY*100));
 const ox=width/2-cx*scale,oy=height/2-cy*scale;
 ctx.clearRect(0,0,width,height);ctx.fillStyle='#10232b';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
 ctx.fillStyle='#274c50';ctx.fillRect(0,0,960,1200);
 for(let y=0;y<1200;y+=80)for(let x=0;x<960;x+=80){ctx.fillStyle=(x/80+y/80)%2?'#2b5154':'#294d50';ctx.fillRect(x+1,y+1,78,78);}
 ctx.strokeStyle='#a1cfb04a';ctx.lineWidth=5;ctx.strokeRect(18,18,924,1164);
 for(const [x,y] of [[35,350],[870,350],[35,820],[870,820]]){ctx.fillStyle='#173e3c';ctx.fillRect(x,y,55,80);ctx.fillStyle='#426d50';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+12+i*14,y+18+(i%2)*28,19,0,7);ctx.fill();}}
 // Painted spawn pads, perimeter lights and objective markings.
 for(const team of[0,1]){ctx.fillStyle=team===0?'#1f7280':'#734653';ctx.fillRect(155,team===0?1000:110,650,90);ctx.fillStyle=team===0?'#74eff1':'#ff9baf';for(let x=180;x<800;x+=60)ctx.fillRect(x,team===0?1160:30,30,5);}
 const z=FIELD.zone,color=s.zone===0?'#6ff4e9':s.zone===1?'#ff8098':'#f6cf7b';ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fillStyle=s.zone===0?'#52d7d42b':s.zone===1?'#ff69812b':'#f6cf7b1c';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.setLineDash([14,10]);ctx.stroke();ctx.setLineDash([]);
 ctx.save();ctx.translate(480,600);ctx.rotate(Math.PI/4);ctx.strokeStyle=color;ctx.lineWidth=5;ctx.strokeRect(-22,-22,44,44);ctx.restore();
 // Low covers have a visible front face; all silhouettes match collision rectangles.
 for(const w of WALLS){ctx.fillStyle='#102b31aa';ctx.fillRect(w.x+8,w.y+15,w.w,w.h);ctx.fillStyle='#52666b';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.fillStyle='#91a9a4';ctx.fillRect(w.x,w.y-8,w.w,w.h-8);ctx.fillStyle='#b9cec0';ctx.fillRect(w.x+5,w.y-8,w.w-10,5);ctx.fillStyle='#d6ae6f';ctx.fillRect(w.x+w.w/2-14,w.y+8,28,6);}
 const own=s.players[0];
 if(own.hp>0&&input.fire){const kit=KITS[own.kit];ctx.beginPath();ctx.moveTo(own.x,own.y);ctx.lineTo(own.x+own.aimX*kit.range,own.y+own.aimY*kit.range);ctx.strokeStyle='#f8efc66b';ctx.lineWidth=4;ctx.setLineDash([12,10]);ctx.stroke();ctx.setLineDash([]);}
 for(const p of [...s.players].sort((a,b)=>a.y-b.y)){
  if(p.hp<=0)continue;const kit=KITS[p.kit],team=p.team===0?'#6cf2e4':'#ff7b98',walk=reduced?0:Math.sin(s.time*15+p.id)*2;
  ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#08262e88';ctx.beginPath();ctx.ellipse(0,16,27,12,0,0,Math.PI*2);ctx.fill();
  if(p.id===0){ctx.strokeStyle='#fff3bc';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,13,32,17,0,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#142b37';ctx.fillRect(-16,8+walk,12,14);ctx.fillRect(4,8-walk,12,14);
  if(p.kit==='echo'){ctx.fillStyle='#6954a1';ctx.beginPath();ctx.moveTo(-20,-10);ctx.lineTo(20,-10);ctx.lineTo(28,27);ctx.lineTo(-28,27);ctx.fill();}
  ctx.fillStyle=team;ctx.strokeStyle='#102d39';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(p.kit==='brick'?-28:-23,-19,p.kit==='brick'?56:46,35,12);ctx.fill();ctx.stroke();
  ctx.save();ctx.rotate(Math.atan2(p.aimY,p.aimX));ctx.fillStyle='#132932';ctx.beginPath();ctx.roundRect(13,-7,27,14,5);ctx.fill();ctx.fillStyle=kit.color;ctx.fillRect(32,-5,p.kit==='echo'?27:12,10);ctx.restore();
  ctx.fillStyle=kit.color;ctx.strokeStyle='#142b37';ctx.beginPath();ctx.roundRect(-18,-37,36,32,11);ctx.fill();ctx.stroke();ctx.fillStyle='#18323d';ctx.beginPath();ctx.roundRect(-13,-25,26,10,4);ctx.fill();ctx.fillStyle='#effff1';ctx.fillRect(-8,-23,5,4);ctx.fillRect(4,-23,5,4);
  if(p.kit==='volt'){ctx.strokeStyle=kit.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,-37);ctx.lineTo(0,-47);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-48,4,0,7);ctx.fill();}
  ctx.fillStyle='#102630';ctx.fillRect(-27,-56,54,7);ctx.fillStyle=team;ctx.fillRect(-25,-54,50*p.hp/kit.hp,3);
  if(p.id===0){ctx.fillStyle='#fff1bb';ctx.beginPath();ctx.moveTo(-6,-72);ctx.lineTo(6,-72);ctx.lineTo(0,-63);ctx.fill();}
  ctx.restore();
 }
 for(const b of s.shots){ctx.strokeStyle=b.super?'#ffe6a3':s.players[b.owner].team===0?'#abfff8':'#ffa6bb';ctx.lineWidth=b.super?10:7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-b.vx*.016,b.y-b.vy*.016);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,3,0,7);ctx.fill();}
 for(const p of s.sparks){ctx.globalAlpha=Math.min(1,p.life*4);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life*2,0,7);ctx.fill();}ctx.globalAlpha=1;
 ctx.restore();
}
