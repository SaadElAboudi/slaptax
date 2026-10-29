const {rules:combatRules,initializeCombat,chargeSuper,spendAmmo,combatActivity,tickCombat}=require('./arenaCombat');
const {rules:chickenRules,beginChicken,tickChicken,publicChicken,pauseChicken}=require('./chicken');
const CHARACTERS=require('../../shared/snack-characters.json');
const character=id=>CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
// Braquage du Goûter: fixed-step, authoritative movement/combat/objective.
const STEP=1000/60,DURATION=90000,R=23;
const WALLS=[{x:250,y:110,w:75,h:130},{x:575,y:360,w:75,h:130},{x:250,y:360,w:75,h:130},{x:575,y:110,w:75,h:130}];
const team=p=>p.team??p.slot;
const homeX=p=>team(p)?820:80;
const spawnY=p=>p.slot>=2?360:300;
const enemies=(a,b)=>team(a)!==team(b);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function event(s,kind,p,now,extra={}){s.events.push({kind,id:p.id,x:p.x,y:p.y,at:now,...extra});s.events=s.events.filter(e=>now-e.at<1800).slice(-16);}
function beginSnack(g,now){
 g.phase='brawl';g.deadline=now+(g.id==='chicken'?chickenRules.durationMs:DURATION);
 const ids=g.players.length===1?[...g.players,'snack-bot']:g.players;
 g.snack={startedAt:now,tickAt:now,winnerId:null,winnerTeam:null,teamMode:ids.length===4,events:[],zones:[],walls:WALLS,box:{x:450,y:300,carrier:null,availableAt:now},
 bodies:ids.map((id,slot)=>({id,slot,team:slot%2,throws:0,passes:0,interceptions:0,assists:0,character:!g.players.includes(id)?'pickle':'flan',chosen:false,locked:false,skillAt:now,skillResolveAt:0,guardUntil:0,guardX:1,guardY:0,slowed:false,botSkillDecisionAt:now+1500,botReactAt:0,botSeenSwing:0,botWaypoint:null,botLastPlanAt:0,bot:!g.players.includes(id),x:slot%2?820:80,y:slot>=2?360:300,dx:0,dy:0,ax:slot%2?-1:1,ay:0,kx:0,ky:0,hp:4,kos:0,captures:0,inputAt:now,attackAt:0,resolveAt:0,dashAt:0,dashUntil:0,respawnAt:0,shieldUntil:now+1000,swings:0}))};
 for(const p of g.snack.bodies)initializeCombat(p,now);
 if(g.id==='chicken')beginChicken(g.snack,now);
}
function moveBody(p,dx,dy){
 p.x=clamp(p.x+dx,28,872);
 for(const w of WALLS)if(p.x>w.x-R&&p.x<w.x+w.w+R&&p.y>w.y-R&&p.y<w.y+w.h+R)p.x=dx>0?w.x-R:w.x+w.w+R;
 p.y=clamp(p.y+dy,28,572);
 for(const w of WALLS)if(p.x>w.x-R&&p.x<w.x+w.w+R&&p.y>w.y-R&&p.y<w.y+w.h+R)p.y=dy>0?w.y-R:w.y+w.h+R;
}
function attack(s,p,now){if(p.respawnAt||s.box.carrier===p.id||now<p.attackAt||p.skillResolveAt||p.superResolveAt)return false;if(!spendAmmo(p,now))return false;combatActivity(p,now);const config=character(p.character);p.locked=true;p.guardUntil=0;p.attackAt=now+config.attackCooldown;p.resolveAt=now+config.windup;p.strikeX=p.ax;p.strikeY=p.ay;p.swings++;p.shieldUntil=0;event(s,'windup',p,now,{ax:p.ax,ay:p.ay});return true;}
function dash(s,p,now){if(p.respawnAt||now<p.dashAt)return false;p.locked=true;p.dashAt=now+2400;p.dashUntil=now+160;const d=Math.hypot(p.dx,p.dy);p.dashX=d?p.dx/d:p.ax;p.dashY=d?p.dy/d:p.ay;event(s,'dash',p,now);return true;}
function clearLine(x,y,tx,ty){const steps=Math.max(8,Math.ceil(Math.hypot(tx-x,ty-y)/12));for(let i=1;i<=steps;i++){const px=x+(tx-x)*i/steps,py=y+(ty-y)*i/steps;if(WALLS.some(w=>px>=w.x&&px<=w.x+w.w&&py>=w.y&&py<=w.y+w.h))return false;}return true;}
function skill(s,p,now){
 if(p.respawnAt||now<p.skillAt||p.resolveAt||p.skillResolveAt||p.superResolveAt)return false;combatActivity(p,now);
 p.locked=true;p.shieldUntil=0;p.skillAt=now+character(p.character).skillCooldown;
 if(p.character==='toast'){p.guardUntil=now+1200;p.guardX=p.ax;p.guardY=p.ay;event(s,'guard',p,now,{ax:p.ax,ay:p.ay});}
 else if(p.character==='pickle'){
  let x=p.x,y=p.y;for(let d=12;d<=150;d+=6){const nx=clamp(p.x+p.ax*d,28,872),ny=clamp(p.y+p.ay*d,28,572);if(!clearLine(p.x,p.y,nx,ny))break;x=nx;y=ny;}
  s.zones.push({id:`${p.id}:${now}`,owner:p.id,fromX:p.x,fromY:p.y,x,y,radius:85,activeAt:now+300,until:now+2500});event(s,'brine-cast',p,now,{targetX:x,targetY:y});
 }else{p.skillResolveAt=now+300;event(s,'boing-windup',p,now);}
 return true;
}
function superPower(s,p,now){
 if(p.respawnAt||p.superCharge<combatRules.superMax||p.resolveAt||p.skillResolveAt||p.superResolveAt)return false;
 p.superCharge=0;p.supersUsed++;p.locked=true;p.shieldUntil=0;combatActivity(p,now);
 if(p.character==='toast'){
  for(const q of s.bodies)if(!enemies(p,q)&&!q.respawnAt&&Math.hypot(q.x-p.x,q.y-p.y)<=combatRules.wardRange&&clearLine(p.x,p.y,q.x,q.y)){q.wardUntil=now+combatRules.wardDurationMs;q.wardCharges=1;event(s,'ward',q,now,{by:p.id});}
 }else if(p.character==='pickle'){
  for(const distance of [60,140,220]){let x=p.x,y=p.y;for(let d=6;d<=distance;d+=6){const nx=clamp(p.x+p.ax*d,28,872),ny=clamp(p.y+p.ay*d,28,572);if(!clearLine(p.x,p.y,nx,ny))break;x=nx;y=ny;}
   s.zones.push({id:`super:${p.id}:${now}:${distance}`,owner:p.id,fromX:p.x,fromY:p.y,x,y,radius:72,activeAt:now+300,until:now+4300,boostAllies:true});
  }event(s,'super-brine',p,now);
 }else{p.superResolveAt=now+combatRules.superWindupMs;p.superAimX=p.ax;p.superAimY=p.ay;event(s,'super-windup',p,now,{ax:p.ax,ay:p.ay});}
 return true;
}
function actSnack(g,id,a,now){
 const s=g.snack,p=s?.bodies.find(p=>p.id===id);if(g.phase!=='brawl'||!p||p.bot||p.respawnAt)return false;
 if(a.action==='character'){const config=CHARACTERS.find(c=>c.id===a.character);if(!config||p.chosen||p.locked||now-s.startedAt>5000)return false;p.character=config.id;p.hp=config.hp;p.chosen=true;const rival=s.bodies.find(q=>q.bot);if(rival&&!rival.locked){const next=CHARACTERS[(CHARACTERS.findIndex(c=>c.id===config.id)+1)%CHARACTERS.length];rival.character=next.id;rival.hp=next.hp;}event(s,'character',p,now);return true;}
 if(a.action==='super')return superPower(s,p,now);
 if(a.action==='throw')return throwBox(s,p,now);
 if(a.action==='skill')return skill(s,p,now);
 if(a.action==='input'){
  if(![a.dx,a.dy,a.ax,a.ay].every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1))return false;
  const d=Math.max(1,Math.hypot(a.dx,a.dy)),aim=Math.hypot(a.ax,a.ay);if(aim<.1)return false;
  p.dx=a.dx/d;p.dy=a.dy/d;if(Math.hypot(p.dx,p.dy)>.1)p.locked=true;p.ax=a.ax/aim;p.ay=a.ay/aim;p.inputAt=now;return true;
 }
 if(a.action==='attack')return attack(s,p,now);
 if(a.action==='evade')return dash(s,p,now);
 return false;
}
function throwBox(s,p,now){
 if(s.box.carrier!==p.id||p.resolveAt||p.skillResolveAt||p.superResolveAt||now<p.attackAt)return false;
 p.locked=true;p.guardUntil=0;p.shieldUntil=0;p.attackAt=now+450;p.throws++;
 s.box={x:p.x,y:p.y,carrier:null,availableAt:now+80,vx:p.ax*720,vy:p.ay*720,flightUntil:now+1050,thrownBy:p.id,throwTeam:team(p),throwAt:now,selfCatchAt:now+450,bounces:0};
 event(s,'throw',p,now,{ax:p.ax,ay:p.ay});return true;
}
function tickBox(s,now){
 const b=s.box;if(b.carrier||!b.flightUntil)return;
 if(now>=b.flightUntil){b.vx=0;b.vy=0;b.flightUntil=0;return;}
 // Swept small steps prevent a fast box crossing a bench between frames.
 for(let i=0;i<3;i++){
  let bounced=false;const nx=b.x+b.vx/180,ny=b.y+b.vy/180;
  if(nx<14||nx>886||WALLS.some(w=>nx>w.x-14&&nx<w.x+w.w+14&&b.y>w.y-14&&b.y<w.y+w.h+14)){b.vx=-b.vx*.8;bounced=true;}else b.x=nx;
  if(ny<14||ny>586||WALLS.some(w=>b.x>w.x-14&&b.x<w.x+w.w+14&&ny>w.y-14&&ny<w.y+w.h+14)){b.vy=-b.vy*.8;bounced=true;}else b.y=ny;
  if(bounced){b.bounces++;event(s,'ricochet',{id:b.thrownBy,x:b.x,y:b.y},now);if(b.bounces>=3){b.vx=0;b.vy=0;b.flightUntil=0;break;}}
 }
}
function drop(s,p,now){if(s.box.carrier!==p.id)return;s.box={x:p.x,y:p.y,carrier:null,availableAt:now+450};event(s,'drop',p,now);}
function finish(g){
 const s=g.snack,totals=[0,1].map(t=>({team:t,captures:s.bodies.filter(p=>team(p)===t).reduce((n,p)=>n+p.captures,0),kos:s.bodies.filter(p=>team(p)===t).reduce((n,p)=>n+p.kos,0)})).sort((a,b)=>b.captures-a.captures||b.kos-a.kos),[a,b]=totals;
 const tied=a.captures===b.captures&&a.kos===b.kos;s.winnerTeam=tied?null:a.team;s.winnerId=tied?null:s.bodies.find(p=>team(p)===a.team).id;g.winnerId=s.winnerId;
 for(const id of g.players){const p=s.bodies.find(p=>p.id===id);g.scores[id]=Math.min(1000,p.captures*250+Math.min(200,p.kos*20+p.assists*50+p.passes*20+p.interceptions*30)+(p.captures&&team(p)===s.winnerTeam?250:0));}
 g.summary=g.id==='chicken'?'chicken-deliveries-then-knockouts':'snack-captures-then-knockouts';g.phase=tied&&g.players.length>1?'draw':'done';g.ready=[];
}
function clearMove(x,y,tx,ty){const steps=Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/12));for(let i=1;i<=steps;i++){const px=x+(tx-x)*i/steps,py=y+(ty-y)*i/steps;if(WALLS.some(w=>px>w.x-R-2&&px<w.x+w.w+R+2&&py>w.y-R-2&&py<w.y+w.h+R+2))return false;}return true;}
function waypoint(p,target,now){
 if(clearMove(p.x,p.y,target.x,target.y))return target;
 if(p.botWaypoint&&now-p.botLastPlanAt<250&&Math.hypot(p.x-p.botWaypoint.x,p.y-p.botWaypoint.y)>10)return p.botWaypoint;
 const nodes=[];for(let y=50;y<=550;y+=50)for(let x=50;x<=850;x+=50)if(!WALLS.some(w=>x>w.x-R-2&&x<w.x+w.w+R+2&&y>w.y-R-2&&y<w.y+w.h+R+2))nodes.push({x,y});
 const closest=point=>nodes.reduce((best,n)=>Math.hypot(n.x-point.x,n.y-point.y)<Math.hypot(best.x-point.x,best.y-point.y)?n:best,nodes[0]),start=closest(p),goal=closest(target),queue=[start],previous=new Map([[start,null]]);
 for(let i=0;i<queue.length&&!previous.has(goal);i++){const n=queue[i];for(const q of nodes)if(!previous.has(q)&&Math.abs(n.x-q.x)+Math.abs(n.y-q.y)===50){previous.set(q,n);queue.push(q);}}
 let next=goal;if(!previous.has(goal))next=start;else while(previous.get(next)&&previous.get(next)!==start)next=previous.get(next);
 p.botWaypoint=next;p.botLastPlanAt=now;return next;
}
function bot(s,p,now){
 const rival=s.bodies.filter(q=>enemies(q,p)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0],box=s.box,home={x:homeX(p),y:300};
 const target=box.carrier===p.id||p.hp===1&&Math.hypot(rival.x-p.x,rival.y-p.y)<200?home:box.carrier?rival:box,next=waypoint(p,target,now),d=Math.hypot(next.x-p.x,next.y-p.y);
 p.dx=d>8?(next.x-p.x)/d:0;p.dy=d>8?(next.y-p.y)/d:0;p.inputAt=now;
 if(s.chicken&&box.carrier===p.id&&box.panicAt-now<1400){p.ax=(home.x-p.x)/(Math.hypot(home.x-p.x,home.y-p.y)||1);p.ay=(home.y-p.y)/(Math.hypot(home.x-p.x,home.y-p.y)||1);throwBox(s,p,now);}
 if(!rival.respawnAt){const rx=rival.x-p.x,ry=rival.y-p.y,r=Math.hypot(rx,ry)||1;p.ax=rx/r;p.ay=ry/r;
  const signal=rival.resolveAt||rival.skillResolveAt||0;if(signal&&p.botSeenSwing!==signal){p.botSeenSwing=signal;p.botReactAt=now+160;}
  if(signal>now&&p.botReactAt&&now>=p.botReactAt&&r<150){dash(s,p,now);p.botReactAt=0;}
  if(now>=p.botSkillDecisionAt){p.botSkillDecisionAt=now+700;if(p.superCharge>=combatRules.superMax&&(r<210||p.character==='toast'&&(box.carrier===p.id||p.hp<=2)))superPower(s,p,now);if(r<190&&(p.character==='pickle'||p.character==='flan'&&r<130||p.character==='toast'&&(signal>now||box.carrier===p.id)))skill(s,p,now);}
  if(box.carrier!==p.id&&p.guardUntil<=now&&r<character(p.character).range-7)attack(s,p,now);
 }
}
function tickSnack(g,now){
 if(g.phase!=='brawl')return;const s=g.snack,end=Math.min(now,g.deadline);
 while(s.tickAt+STEP<=end+.001){s.tickAt+=STEP;const time=s.tickAt;
  for(const p of s.bodies){
   if(p.respawnAt){if(time<p.respawnAt)continue;Object.assign(p,{respawnAt:0,hp:character(p.character).hp,ammo:combatRules.ammoCapacity,ammoNextAt:time+combatRules.ammoReloadMs,regenAt:time+combatRules.regenDelayMs,superResolveAt:0,wardCharges:0,skillResolveAt:0,guardUntil:0,x:homeX(p),y:spawnY(p),kx:0,ky:0,dx:0,dy:0,inputAt:0,shieldUntil:time+800});event(s,'respawn',p,time);}
   if(tickCombat(p,time,character(p.character).hp,s.box.carrier===p.id))event(s,'heal',p,time);
   if(p.bot)bot(s,p,time);
   const fresh=time-p.inputAt<=260,boost=time<p.dashUntil;
   p.slowed=s.zones.some(z=>enemies(s.bodies.find(q=>q.id===z.owner)||p,p)&&time>=z.activeAt&&time<z.until&&Math.hypot(p.x-z.x,p.y-z.y)<z.radius&&clearLine(z.x,z.y,p.x,p.y));
   p.hasted=s.zones.some(z=>z.boostAllies&&!enemies(s.bodies.find(q=>q.id===z.owner)||p,p)&&time>=z.activeAt&&time<z.until&&Math.hypot(p.x-z.x,p.y-z.y)<z.radius&&clearLine(z.x,z.y,p.x,p.y));
   const speed=boost?660:character(p.character).speed*(s.box.carrier===p.id?165/215:1)*(p.slowed?.55:1)*(p.hasted?1.18:1);
   const dx=boost?p.dashX:fresh?p.dx:0,dy=boost?p.dashY:fresh?p.dy:0;
   moveBody(p,(dx*speed+p.kx)/60,(dy*speed+p.ky)/60);p.kx*=.82;p.ky*=.82;
  }
  if(s.chicken)tickChicken(s,time,moveBody);
  s.zones=s.zones.filter(z=>time<z.until);
  const living=s.bodies.filter(p=>!p.respawnAt);
  for(let i=0;i<living.length;i++)for(let j=i+1;j<living.length;j++){const a=living[i],b=living[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<2*R){const nx=d?dx/d:1,ny=d?dy/d:0,over=(2*R-d)/2;moveBody(a,-nx*over,-ny*over);moveBody(b,nx*over,ny*over);}}
  // Gather hits before applying damage: simultaneous swings can trade KOs.
  const striking=s.bodies.filter(p=>p.resolveAt&&time>=p.resolveAt&&!p.respawnAt),hits=[];
  for(const p of striking){p.resolveAt=0;event(s,'swing',p,time,{ax:p.strikeX,ay:p.strikeY});
   for(const q of s.bodies){if(!enemies(q,p)||q.respawnAt||time<q.shieldUntil||time<q.dashUntil)continue;const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1;
    const blocked=WALLS.some(w=>{for(let i=1;i<=8;i++){const x=p.x+dx*i/8,y=p.y+dy*i/8;if(x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h)return true;}return false;});
    if(d<=character(p.character).range&&(dx*p.strikeX+dy*p.strikeY)/d>=.45&&!blocked)hits.push({p,q,dx,dy,d,power:p.character==='toast'?520:430});
   }
  }
  // Resolve all prepared attacks before applying damage, including shockwaves.
  for(const p of s.bodies){if(!p.skillResolveAt||time<p.skillResolveAt)continue;p.skillResolveAt=0;if(p.respawnAt)continue;event(s,'boing',p,time);
   for(const q of s.bodies){const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1;if(enemies(q,p)&&!q.respawnAt&&time>=q.shieldUntil&&time>=q.dashUntil&&d<=135&&clearLine(p.x,p.y,q.x,q.y))hits.push({p,q,dx,dy,d,power:700});}
  }
  for(const p of s.bodies){if(!p.superResolveAt||time<p.superResolveAt)continue;p.superResolveAt=0;if(p.respawnAt)continue;event(s,'super-wave',p,time,{ax:p.superAimX,ay:p.superAimY});
   for(const q of s.bodies){const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1;if(enemies(q,p)&&!q.respawnAt&&time>=q.shieldUntil&&time>=q.dashUntil&&d<=combatRules.superWaveRange&&(dx*p.superAimX+dy*p.superAimY)/d>=.15&&clearLine(p.x,p.y,q.x,q.y))hits.push({p,q,dx,dy,d,power:1000,damage:2,superHit:true});}
  }
  for(const {p,q,dx,dy,d,power,damage=1,superHit=false} of hits){
   if(q.hp<=0)continue;
   if(q.wardCharges&&q.wardUntil>time){q.wardCharges=0;chargeSuper(q,combatRules.chargeBlock);event(s,'ward-block',q,time,{by:p.id});continue;}
   if(q.guardUntil>time&&(-dx*q.guardX-dy*q.guardY)/d>=.25){q.guardUntil=0;chargeSuper(q,combatRules.chargeBlock);p.kx=-dx/d*340;p.ky=-dy/d*340;event(s,'blocked',q,time,{by:p.id});continue;}
   const taken=Math.min(q.hp,damage);q.hp-=taken;combatActivity(p,time);combatActivity(q,time);if(!superHit)chargeSuper(p,combatRules.chargeHit);chargeSuper(q,combatRules.chargeDamageTaken*taken);q.locked=true;q.kx=dx/d*power;q.ky=dy/d*power;event(s,'hit',q,time,{by:p.id});
   if(!q.hp){p.kos++;drop(s,q,time);q.respawnAt=time+2400;q.superCharge=Math.floor(q.superCharge*combatRules.chargeRetainedOnKo);q.superResolveAt=0;q.wardCharges=0;q.resolveAt=0;q.skillResolveAt=0;q.guardUntil=0;q.dashUntil=0;q.dx=0;q.dy=0;event(s,'ko',q,time,{by:p.id});}
  }
  tickBox(s,time);
  if(!s.box.carrier&&time>=s.box.availableAt){const near=s.bodies.filter(p=>!p.respawnAt&&!(s.box.bannedId===p.id&&time<s.box.bannedUntil)&&!(s.box.thrownBy===p.id&&time<s.box.selfCatchAt)&&Math.hypot(p.x-s.box.x,p.y-s.box.y)<(s.box.flightUntil?32:40)&&clearLine(p.x,p.y,s.box.x,s.box.y)).sort((a,b)=>Math.hypot(a.x-s.box.x,a.y-s.box.y)-Math.hypot(b.x-s.box.x,b.y-s.box.y));s.box.contested=near.some(q=>enemies(near[0],q)&&Math.abs(Math.hypot(near[0].x-s.box.x,near[0].y-s.box.y)-Math.hypot(q.x-s.box.x,q.y-s.box.y))<1);const p=near[0];if(p&&!s.box.contested){const b=s.box,from=s.bodies.find(q=>q.id===b.thrownBy);if(b.flightUntil&&from&&from.id!==p.id){if(enemies(from,p)){p.interceptions++;chargeSuper(p,combatRules.chargeInterception);event(s,'intercept',p,time,{by:from.id});b.assistBy=null;}else{from.passes++;if(time>=from.passChargeAt){chargeSuper(from,combatRules.chargePass);from.passChargeAt=time+combatRules.passChargeCooldownMs;}b.assistBy=from.id;b.assistAt=time;event(s,'pass',p,time,{by:from.id});}}b.carrier=p.id;if(s.chicken)b.panicAt=time+chickenRules.carryLimitMs;b.flightUntil=0;b.vx=0;b.vy=0;b.thrownBy=null;p.locked=true;event(s,'pickup',p,time);}}
  if(s.box.carrier){const p=s.bodies.find(p=>p.id===s.box.carrier);s.box.x=p.x;s.box.y=p.y;
   if(Math.hypot(p.x-homeX(p),p.y-300)<52){p.captures++;chargeSuper(p,combatRules.chargeCapture);if(s.box.assistBy&&time-s.box.assistAt<5000){const passer=s.bodies.find(q=>q.id===s.box.assistBy);if(passer&&passer.id!==p.id)passer.assists++;}event(s,'capture',p,time);s.box={x:450,y:300,carrier:null,availableAt:time+1200};if(s.bodies.filter(q=>team(q)===team(p)).reduce((n,q)=>n+q.captures,0)>=3){finish(g);return;}}
  }
 }
 if(now>=g.deadline)finish(g);
}
function publicSnack(g,now){const s=g.snack;if(!s)return;return{chicken:s.chicken?publicChicken(s,now):undefined,teamMode:s.teamMode,winnerTeam:s.winnerTeam,teamScores:[0,1].map(t=>s.bodies.filter(p=>team(p)===t).reduce((n,p)=>n+p.captures,0)),zones:s.zones.map(z=>({...z,activeIn:Math.max(0,z.activeAt-now),remaining:Math.max(0,z.until-now)})),elapsed:s.tickAt-s.startedAt,walls:s.walls,winnerId:s.winnerId,box:{x:s.box.x,y:s.box.y,carrier:s.box.carrier,contested:!!s.box.contested,readyIn:Math.max(0,s.box.availableAt-now),vx:s.box.vx||0,vy:s.box.vy||0,flying:!!s.box.flightUntil,thrownBy:s.box.thrownBy||null,bounces:s.box.bounces||0},events:s.events.filter(e=>now-e.at<1500).map(e=>({...e,age:Math.max(0,now-e.at)})),bodies:s.bodies.map(p=>({id:p.id,slot:p.slot,ammo:p.ammo,ammoMax:combatRules.ammoCapacity,ammoReloadIn:p.ammo<combatRules.ammoCapacity?Math.max(0,p.ammoNextAt-now):0,superCharge:p.superCharge,superWindup:Math.max(0,p.superResolveAt-now),superAimX:p.superAimX,superAimY:p.superAimY,supersUsed:p.supersUsed,wardRemaining:p.wardCharges?Math.max(0,p.wardUntil-now):0,regenIn:p.hp<character(p.character).hp?Math.max(0,p.regenAt-now):0,hasted:!!p.hasted,team:team(p),throws:p.throws,passes:p.passes,interceptions:p.interceptions,assists:p.assists,character:p.character,maxHp:character(p.character).hp,speed:character(p.character).speed*(s.box.carrier===p.id?165/215:1)*(p.slowed?.55:1)*(p.hasted?1.18:1),slowed:p.slowed,selectionLocked:p.locked||p.chosen||now-s.startedAt>5000,skillCooldown:Math.max(0,p.skillAt-now),skillWindup:Math.max(0,p.skillResolveAt-now),guardRemaining:Math.max(0,p.guardUntil-now),guardX:p.guardX,guardY:p.guardY,range:character(p.character).range,bot:p.bot,x:p.x,y:p.y,ax:p.resolveAt?p.strikeX:p.ax,ay:p.resolveAt?p.strikeY:p.ay,hp:p.hp,kos:p.kos,captures:p.captures,dx:p.dx,dy:p.dy,carrying:s.box.carrier===p.id,attackCooldown:Math.max(0,p.attackAt-now),windup:Math.max(0,p.resolveAt-now),dashCooldown:Math.max(0,p.dashAt-now),dashing:p.dashUntil>now,respawnIn:Math.max(0,p.respawnAt-now),shielded:p.shieldUntil>now}))};}
function pauseSnack(g,delta){const s=g.snack;if(!s)return;pauseChicken(s,delta);s.startedAt+=delta;s.tickAt+=delta;s.box.availableAt+=delta;for(const k of ['flightUntil','selfCatchAt','throwAt','assistAt'])if(s.box[k])s.box[k]+=delta;for(const z of s.zones){z.activeAt+=delta;z.until+=delta;}for(const e of s.events)e.at+=delta;for(const p of s.bodies){for(const k of ['attackAt','resolveAt','dashAt','dashUntil','respawnAt','shieldUntil','skillAt','skillResolveAt','guardUntil','botReactAt','botSkillDecisionAt','botLastPlanAt','ammoNextAt','regenAt','superResolveAt','wardUntil','passChargeAt'])if(p[k])p[k]+=delta;p.inputAt=0;p.dx=0;p.dy=0;}}
module.exports={beginSnack,actSnack,tickSnack,publicSnack,pauseSnack,WALLS};
