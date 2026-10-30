const {lift:REFINEMENT,pigeon:PIGEON}=require('../../shared/party-refinement.json');
// Authoritative short games: flight/ballistics and three-lane dodging.
const STEP=50,carX=(slot,elapsed)=>300+Math.sin(elapsed/1050+slot*2.3)*205;
const windAt=elapsed=>Math.sin(elapsed/2300)*58;
function wave(g,impact,index){const gas=g.random(0,3);return {index,gas,bean:index%REFINEMENT.doubleGasEvery===0?gas:(gas+1+g.random(0,2))%3,gases:index%REFINEMENT.doubleGasEvery===0?[gas,(gas+1)%3]:[gas],impactAt:impact};}
function beginAbsurd(g,now){
 const ids=g.players.length===1?[...g.players,'absurd-bot']:g.players;
 g.phase='brawl';g.deadline=now+(g.id==='pigeon'?24000:22000);
 g.absurd={startedAt:now,tickAt:now,serial:0,events:[],shots:[],strikes:[],wave:g.id==='lift'?wave(g,now+1600,1):null,
  bodies:ids.map((id,slot)=>({id,slot,bot:!g.players.includes(id),score:0,hits:0,misses:0,blocks:0,deliveryStreak:0,perfects:0,parries:0,ownGoals:0,pranks:0,stinks:0,beans:0,streak:0,breathUntil:0,breathReady:now,ammo:1,lane:1,playedWave:-1,x:slot?450:150,targetX:slot?450:150,readyAt:now,umbrellaAt:0,umbrellaUntil:0,shieldReady:now,proutReady:now,thinkAt:now+500+slot*100}))};
}
function emit(g,kind,p,at,value=0){const s=g.absurd;s.events.push({serial:++s.serial,kind,id:p.id,at,value});s.events=s.events.slice(-10);}
function execute(g,p,a,now){const s=g.absurd,other=s.bodies.find(q=>q.id!==p.id);
 if(['umbrella','breath'].includes(a.action))return false;
 if(g.id==='pigeon'){
  if(a.action==='steer'){if(typeof a.x!=='number'||!Number.isFinite(a.x)||a.x<0||a.x>1)return false;p.targetX=50+a.x*500;return true;}
  if(a.action!=='drop'||now<p.readyAt)return false;
  p.readyAt=now+1000;s.shots.push({id:++s.serial,owner:p.id,x:p.x,at:now,landsAt:now+900});emit(g,'drop',p,now);return true;
 }
 if(a.action==='lane'){
  if(!Number.isInteger(a.lane)||a.lane<0||a.lane>2||now<p.readyAt)return false;
  p.lane=a.lane;p.playedWave=s.wave.index;p.readyAt=now+160;return true;
 }
 if(a.action==='prout'){
  if(p.ammo<1||now<p.proutReady)return false;p.ammo--;p.playedWave=s.wave.index;p.proutReady=now+3000;
  s.strikes.push({id:++s.serial,owner:p.id,target:other.id,lane:other.lane,at:now,impactAt:now+700});emit(g,'prout',p,now);return true;
 }
 return false;
}
function actAbsurd(g,id,a,now){tickAbsurd(g,now);if(g.phase!=='brawl')return false;const p=g.absurd.bodies.find(p=>p.id===id&&!p.bot);const ok=!!p&&execute(g,p,a,now);sync(g);return ok;}
function sync(g){for(const id of g.players)g.scores[id]=g.absurd.bodies.find(p=>p.id===id).score;}
function tickAbsurd(g,now,conclude){
 if(g.phase!=='brawl')return;const s=g.absurd,end=Math.min(now,g.deadline);
 while(s.tickAt+STEP<=end){const time=s.tickAt+=STEP,elapsed=time-s.startedAt;
  for(const p of s.bodies)if(p.bot&&time>=p.thinkAt){p.thinkAt=time+250;
   if(g.id==='pigeon'){
    const target=s.bodies.find(q=>q.id!==p.id),aim=carX(target.slot,elapsed+900)-windAt(elapsed)*.9+Math.sin(time/900)*65;p.targetX=Math.max(50,Math.min(550,aim));
    if(Math.abs(p.x-p.targetX)<50)execute(g,p,{action:'drop'},time);

   }else{
    const danger=s.strikes.filter(a=>a.target===p.id&&a.impactAt-time<700).map(a=>a.lane),warning=s.wave.impactAt-time<=700;
    if(warning)danger.push(...s.wave.gases);

    if(warning||danger.includes(p.lane)){const target=warning&&!danger.includes(s.wave.bean)?s.wave.bean:[0,1,2].find(l=>!danger.includes(l));if(target!==undefined&&Math.sin(time/950)>-.8)execute(g,p,{action:'lane',lane:target},time);}
    if(Math.sin(time/1300)>.35)execute(g,p,{action:'prout'},time);
   }
  }
  if(g.id==='pigeon'){
   for(const p of s.bodies)p.x+=Math.max(-16,Math.min(16,p.targetX-p.x));
   for(const b of s.shots){const from=Math.max(time-STEP,b.at),to=Math.min(time,b.landsAt);if(to>from)b.x+=windAt((from+to)/2-s.startedAt)*(to-from)/1000;}
   for(const b of s.shots.filter(b=>b.landsAt<=time)){
    const p=s.bodies.find(p=>p.id===b.owner),ranked=s.bodies.map(q=>({p:q,d:Math.abs(b.x-carX(q.slot,b.landsAt-s.startedAt))})).sort((a,b)=>a.d-b.d),hit=ranked[0];
    if(hit.d>42||Math.abs(hit.d-ranked[1].d)<1){p.deliveryStreak=0;p.misses++;emit(g,'miss',p,time);}
    else if(b.landsAt>=hit.p.umbrellaAt&&b.landsAt<hit.p.umbrellaUntil){p.deliveryStreak=0;hit.p.blocks++;const parry=hit.p.id!==p.id&&b.landsAt-hit.p.umbrellaAt<=PIGEON.parryWindow,value=hit.p.id===p.id?0:parry?PIGEON.parryReward:40;if(parry)hit.p.parries++;hit.p.score+=value;emit(g,parry?'parry':'blocked',hit.p,time,value);}
    else if(hit.p.id===p.id){p.deliveryStreak=0;p.score=Math.max(0,p.score-50);p.ownGoals++;emit(g,'own-goal',p,time,-50);}
    else {p.hits++;const perfect=hit.d<PIGEON.perfectRadius;p.deliveryStreak=perfect?p.deliveryStreak+1:0;if(perfect)p.perfects++;const bonus=perfect?Math.min(PIGEON.maxStreakBonus,(p.deliveryStreak-1)*PIGEON.streakStep):0,value=(perfect?180:100)+bonus;p.score+=value;emit(g,perfect?'bullseye':'splat',hit.p,time,value);}
   }s.shots=s.shots.filter(b=>b.landsAt>time);
  }else{
   if(time>=s.wave.impactAt){const w=s.wave;for(const p of s.bodies){const exposed=w.gases.includes(p.lane),blocked=exposed&&time<p.breathUntil;if(exposed&&!blocked){p.stinks++;p.streak=0;p.score=Math.max(0,p.score-60);emit(g,'gas',p,time,-60);}else if(p.bot||p.playedWave===w.index){if(blocked){p.breathUntil=0;p.blocks++;p.score+=REFINEMENT.blockBonus;emit(g,'breath-block',p,time,REFINEMENT.blockBonus);}p.streak++;const bonus=Math.min(REFINEMENT.maxStreakBonus,(p.streak-1)*REFINEMENT.streakStep);p.score+=80+bonus;p.hits++;if(p.lane===w.bean){p.score+=40;p.beans++;if(p.beans%2===0)p.ammo=Math.min(2,p.ammo+1);emit(g,'bean',p,time,120+bonus);}}else p.streak=0;}s.wave=wave(g,w.impactAt+1300,w.index+1);}
   for(const a of s.strikes.filter(a=>a.impactAt<=time)){const victim=s.bodies.find(p=>p.id===a.target),owner=s.bodies.find(p=>p.id===a.owner);if(victim.lane===a.lane&&time<victim.breathUntil){victim.breathUntil=0;victim.blocks++;victim.score+=REFINEMENT.blockBonus;emit(g,'breath-block',victim,time,REFINEMENT.blockBonus);}else if(victim.lane===a.lane){victim.streak=0;victim.stinks++;victim.score=Math.max(0,victim.score-60);owner.score+=100;owner.pranks++;emit(g,'gas',victim,time,-60);}else{victim.blocks++;emit(g,'dodged',victim,time);}}s.strikes=s.strikes.filter(a=>a.impactAt>time);
  }
 }sync(g);
 if(now>=g.deadline){if(conclude)conclude(g,g.id==='pigeon'?'pigeon-delivery':'elevator-gas');else{g.winnerId=g.players.length===1?g.players[0]:g.scores[g.players[0]]===g.scores[g.players[1]]?null:[...g.players].sort((a,b)=>g.scores[b]-g.scores[a])[0];g.phase=g.winnerId?'done':'draw';g.ready=[];}}
}
function publicAbsurd(g,now){const s=g.absurd;if(!s)return undefined;const at=Math.min(now,s.tickAt,g.deadline),elapsed=at-s.startedAt,w=s.wave,warning=w&&w.impactAt-at<=700;
 return {kind:g.id,elapsed,wind:windAt(elapsed),wave:w?{index:w.index,gas:warning?w.gas:null,gases:warning?w.gases:[],bean:warning?w.bean:null,remaining:Math.max(0,w.impactAt-at)}:null,
  bodies:s.bodies.map(p=>({id:p.id,slot:p.slot,bot:p.bot,score:p.score,deliveryStreak:p.deliveryStreak,perfects:p.perfects,parries:p.parries,hits:p.hits,misses:p.misses,blocks:p.blocks,ownGoals:p.ownGoals,pranks:p.pranks,stinks:p.stinks,beans:p.beans,streak:p.streak,breathing:at<p.breathUntil,breathCooldown:Math.max(0,p.breathReady-at),ammo:p.ammo,lane:p.lane,confirmed:p.playedWave===w?.index,x:p.x,targetX:p.targetX,carX:carX(p.slot,elapsed),cooldown:Math.max(0,p.readyAt-at),umbrella:at<p.umbrellaUntil,shieldCooldown:Math.max(0,p.shieldReady-at),proutCooldown:Math.max(0,p.proutReady-at)})),
  shots:s.shots.map(b=>({...b,progress:Math.max(0,Math.min(1,(at-b.at)/900))})),strikes:s.strikes.map(a=>({...a,remaining:Math.max(0,a.impactAt-at)})),events:s.events.map(e=>({...e,age:Math.max(0,at-e.at)}))};
}
function pauseAbsurd(g,delta){const s=g.absurd;if(!s)return;s.startedAt+=delta;s.tickAt+=delta;if(s.wave)s.wave.impactAt+=delta;for(const p of s.bodies){for(const k of ['readyAt','umbrellaAt','umbrellaUntil','shieldReady','proutReady','thinkAt','breathUntil','breathReady'])p[k]+=delta;p.targetX=p.x;p.playedWave=-1;}for(const b of s.shots){b.at+=delta;b.landsAt+=delta;}for(const a of s.strikes){a.at+=delta;a.impactAt+=delta;}for(const e of s.events)e.at+=delta;}
module.exports={beginAbsurd,actAbsurd,tickAbsurd,publicAbsurd,pauseAbsurd,carX,windAt};
