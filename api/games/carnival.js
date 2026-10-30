const REFINEMENT=require('../../shared/party-refinement.json').balloon;
// Two short server-owned party games. No client scores, clocks or balloon limits.
const STEP=50,DURATION=22000;
const position=(slot,elapsed)=>.5+.34*Math.sin(elapsed/700+slot*2.1);
function piePosition(p,time,startedAt){
 for(let i=(p.moves?.length||0)-1;i>=0;i--){const move=p.moves[i];if(move.at<=time){const distance=move.to-move.from,budget=(time-move.at)*.0009;return Math.abs(distance)<=budget?move.to:move.from+Math.sign(distance)*budget;}}
 return position(p.slot,time-startedAt);
}
function newBalloon(g,p,now){p.volume=0;p.inflating=false;p.inputAt=now;p.limit=REFINEMENT.burstAt;p.serial++;}
function beginCarnival(g,now){
 g.phase='brawl';g.deadline=now+DURATION;
 const ids=g.players.length===1?[...g.players,'carnival-bot']:g.players;
 g.carnival={startedAt:now,tickAt:now,shots:[],events:[],serial:0,sabotages:[],bodies:ids.map((id,slot)=>{
  const p={id,slot,bot:!g.players.includes(id),score:0,hits:0,combo:0,misses:0,dodges:0,revenge:false,shield:false,blocks:0,targetBanks:0,ventUntil:0,ventReady:now,volume:0,serial:0,limit:0,inflating:false,inputAt:now,readyAt:now,duckAt:0,duckUntil:0,duckReady:now,pokeReady:now,thinkAt:now+650,creamUntil:0,x:position(slot,0),targetX:position(slot,0),manual:false,moves:[]};newBalloon(g,p,now);return p;
 })};
}
function event(g,kind,p,now,value=0){g.carnival.events.push({kind,id:p.id,at:now,value,serial:++g.carnival.serial});g.carnival.events=g.carnival.events.slice(-8);}
function pop(g,p,now){p.misses++;event(g,'pop',p,now);newBalloon(g,p,now);p.readyAt=now+600;}
function execute(g,p,action,now){
 const c=g.carnival,other=c.bodies.find(q=>q.id!==p.id);
 if(action.action==='vent'||g.id==='pie'&&action.action==='steer')return false;
 if(g.id==='pie'){
  if(action.action==='duck'){
   if(now<p.duckReady)return false;p.duckAt=now;p.duckUntil=now+450;p.duckReady=now+2200;event(g,'duck',p,now);return true;
  }
  if(action.action!=='throw'||now<p.readyAt||typeof action.aim!=='number'||!Number.isFinite(action.aim)||action.aim<0||action.aim>1)return false;
  const revenge=p.revenge;p.revenge=false;p.readyAt=now+950;c.shots.push({id:p.id,target:other.id,aim:action.aim,fromX:piePosition(p,now,c.startedAt),revenge,at:now,landsAt:now+350});event(g,'throw',p,now);return true;
 }
 if(['inflate','bank'].includes(action.action)&&!p.bot&&action.serial!==p.serial)return false;
 if(action.action==='inflate'){
  if(now<p.readyAt)return false;p.inflating=true;p.inputAt=now;return true;
 }
 if(action.action==='bank'){
  p.inflating=false;
  if(p.volume<10)return true;
  if(p.volume>=70&&!p.shield){p.shield=true;event(g,'helmet',p,now);}
  const target=REFINEMENT.targets[(p.serial-1)%REFINEMENT.targets.length],precise=Math.abs(p.volume-target)<=REFINEMENT.targetTolerance;const value=Math.round(p.volume*p.volume/20)+(precise?REFINEMENT.targetBonus:0);if(precise){p.targetBanks++;event(g,'target-bank',p,now,REFINEMENT.targetBonus);}p.score+=value;p.hits++;event(g,'bank',p,now,value);newBalloon(g,p,now);p.readyAt=now+250;return true;
 }
 if(action.action==='poke'){
  if(now<p.pokeReady||p.score<25||other.volume<10)return false;
  p.score-=25;p.pokeReady=now+4000;c.sabotages.push({id:++c.serial,owner:p.id,target:other.id,targetSerial:other.serial,at:now,impactAt:now+REFINEMENT.sabotageDelay});event(g,'sabotage-warning',other,now);return true;
 }
 return false;
}
function actCarnival(g,id,action,now){
 tickCarnival(g,now);if(g.phase!=='brawl')return false;
 const p=g.carnival.bodies.find(p=>p.id===id&&!p.bot);const accepted=!!p&&execute(g,p,action,now);
 for(const user of g.players)g.scores[user]=g.carnival.bodies.find(p=>p.id===user).score;return accepted;
}
function tickCarnival(g,now,conclude){
 if(g.phase!=='brawl')return;
 const c=g.carnival,end=Math.min(now,g.deadline);
 while(c.tickAt+STEP<=end){
  const time=c.tickAt+=STEP;
  for(const p of c.bodies){
   if(g.id==='pie')p.x=piePosition(p,time,c.startedAt);
   if(p.bot&&time>=p.thinkAt){
    p.thinkAt=time+200;
    if(g.id==='pie'){
     const target=c.bodies.find(q=>q.id!==p.id);
     execute(g,p,{action:'throw',aim:Math.max(0,Math.min(1,(target.manual?target.x:position(target.slot,time+350-c.startedAt))+.19*Math.sin(time/930)))},time);
     if(c.shots.some(s=>s.target===p.id&&s.landsAt-time<250)&&Math.sin(time/1700)>.1)execute(g,p,{action:'duck'},time);
    }else{

     if(p.volume>=REFINEMENT.targets[(p.serial-1)%REFINEMENT.targets.length])execute(g,p,{action:'bank'},time);
     else execute(g,p,{action:'inflate'},time);
     if(Math.sin(time/1500)>.5)execute(g,p,{action:'poke'},time);
    }
   }
   if(g.id==='balloon'&&p.inflating){
    if(time-p.inputAt>500)p.inflating=false;
    else if(time>=p.readyAt){p.volume+=STEP*.018;if(p.volume>=p.limit)pop(g,p,time);}
   }
  }
  for(const attack of c.sabotages.filter(a=>a.impactAt<=time)){const victim=c.bodies.find(p=>p.id===attack.target);if(victim.serial!==attack.targetSerial){event(g,'sabotage-missed',victim,time);continue;}if(time<victim.ventUntil||victim.shield){if(time<victim.ventUntil)victim.ventUntil=0;else victim.shield=false;victim.blocks++;event(g,'blocked',victim,time);}else{victim.volume+=12;event(g,'poke',victim,time,12);if(victim.volume>=victim.limit)pop(g,victim,time);}}c.sabotages=c.sabotages.filter(a=>a.impactAt>time);
  for(const shot of c.shots.filter(s=>s.landsAt<=time)){
   const p=c.bodies.find(p=>p.id===shot.id),target=c.bodies.find(p=>p.id===shot.target);
   const targetX=piePosition(target,shot.landsAt,c.startedAt);
   const error=Math.abs(shot.aim-targetX);
   if(error<(shot.revenge?.17:.12)&&shot.landsAt>=target.duckAt&&shot.landsAt<target.duckUntil){p.combo=0;target.dodges++;target.revenge=true;event(g,'dodged',target,time);}
   else if(error<(shot.revenge?.17:.12)){p.hits++;p.combo++;const value=(error<.045?200:100)+Math.min(3,p.combo-1)*25+(shot.revenge?100:0);p.score+=value;target.creamUntil=time+650;event(g,shot.revenge?'revenge-hit':error<.045?'bullseye':'splat',target,time,value);}
   else {p.misses++;p.combo=0;event(g,'miss',p,time);}
  }
  c.shots=c.shots.filter(s=>s.landsAt>time);
 }
 for(const id of g.players)g.scores[id]=c.bodies.find(p=>p.id===id).score;
 if(now>=g.deadline){
  if(conclude)conclude(g,g.id==='pie'?'pie-fight':'balloon-burst');
  else if(g.players.length===2&&g.scores[g.players[0]]===g.scores[g.players[1]]){g.phase='draw';g.ready=[];}
  else {g.phase='done';g.winnerId=[...g.players].sort((a,b)=>g.scores[b]-g.scores[a])[0];}
 }
}
function publicCarnival(g,now){
 const c=g.carnival;if(!c)return undefined;const at=Math.min(now,c.tickAt,g.deadline);
 return {kind:g.id,sabotages:c.sabotages.map(a=>({target:a.target,remaining:Math.max(0,a.impactAt-at)})),elapsed:Math.max(0,Math.min(DURATION,at-c.startedAt)),shots:c.shots.map(s=>({...s,progress:Math.max(0,Math.min(1,(at-s.at)/350))})),events:c.events.map(e=>({...e,age:Math.max(0,at-e.at)})),bodies:c.bodies.map(p=>({id:p.id,slot:p.slot,bot:p.bot,score:p.score,hits:p.hits,combo:p.combo,misses:p.misses,dodges:p.dodges,revenge:p.revenge,shield:p.shield,blocks:p.blocks,targetVolume:REFINEMENT.targets[(p.serial-1)%REFINEMENT.targets.length],targetBanks:p.targetBanks,venting:at<p.ventUntil,ventCooldown:Math.max(0,p.ventReady-at),volume:p.volume,serial:p.serial,inflating:p.inflating,x:g.id==='pie'?p.x:position(p.slot,at-c.startedAt),manual:p.manual,targetX:p.manual?p.targetX:p.x,cooldown:Math.max(0,p.readyAt-at),ducking:at<p.duckUntil,duckCooldown:Math.max(0,p.duckReady-at),pokeCooldown:Math.max(0,p.pokeReady-at),creamed:at<p.creamUntil}))};
}
function pauseCarnival(g,delta){const c=g.carnival;if(!c)return;c.startedAt+=delta;c.tickAt+=delta;for(const p of c.bodies){for(const key of ['inputAt','readyAt','duckAt','duckUntil','duckReady','pokeReady','thinkAt','creamUntil','ventUntil','ventReady'])p[key]+=delta;p.inflating=false;p.targetX=p.x;if(p.manual)p.moves=[{at:c.tickAt,from:p.x,to:p.x}];if(g.id==='balloon')p.serial++;}for(const a of c.sabotages){if(g.id==='balloon')a.targetSerial++;a.at+=delta;a.impactAt+=delta;}for(const s of c.shots){s.at+=delta;s.landsAt+=delta;}for(const e of c.events)e.at+=delta;}
module.exports={beginCarnival,actCarnival,tickCarnival,publicCarnival,pauseCarnival,position};
