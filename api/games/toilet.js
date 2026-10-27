// Fixed-step soap physics. Clients send directions, never positions or loot.
const STEP=1000/60,DURATION=25000,R=25;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BUMPERS=[{x:155,y:155,r:28},{x:445,y:445,r:28}];
function startPosition(index){return [[110,490],[490,110],[110,110],[490,490]][index];}
function duckPosition(index){const a=index*2.399963;return {x:300+Math.cos(a)*(110+(index%3)*48),y:300+Math.sin(a)*(110+(index%3)*48)};}
function beginToilet(g,now){
 const bots=g.players.length===1?['toilet-bot-1','toilet-bot-2','toilet-bot-3']:[];
 g.phase='brawl';g.deadline=now+DURATION;
 g.toilet={startedAt:now,tickAt:now,serial:7,event:null,
  bodies:[...g.players,...bots].map((id,i)=>{const [x,y]=startPosition(i);return {id,bot:bots.includes(id),slot:i,x,y,vx:0,vy:0,dx:0,dy:0,inputAt:now,thinkAt:now+300+i*100,readyAt:now,boostAt:-1e6,stunUntil:0,hitAt:-1e6,loot:0,collected:0,flushes:0};}),
  ducks:Array.from({length:7},(_,i)=>({id:i,...duckPosition(i),readyAt:now,value:1}))};
}
function boost(t,p,now){
 if(now<p.readyAt||now<p.stunUntil)return false;
 const d=Math.hypot(p.dx,p.dy),v=Math.hypot(p.vx,p.vy);
 const dx=d?p.dx/d:v?p.vx/v:0,dy=d?p.dy/d:v?p.vy/v:-1;
 p.vx=dx*17;p.vy=dy*17;p.boostAt=now;p.readyAt=now+2800;
 t.event={kind:'boost',id:p.id,x:p.x,y:p.y,at:now};return true;
}
function actToilet(g,id,action,now){
 tickToilet(g,now);if(g.phase!=='brawl')return false;
 const t=g.toilet,p=t.bodies.find(p=>p.id===id&&!p.bot);if(!p)return false;
 if(action.action==='boost')return boost(t,p,now);
 if(action.action!=='steer')return false;
 const {dx,dy}=action;if(![dx,dy].every(v=>typeof v==='number'&&Number.isFinite(v))||Math.abs(dx)>1||Math.abs(dy)>1)return false;
 const d=Math.hypot(dx,dy);p.dx=dx/Math.max(1,d);p.dy=dy/Math.max(1,d);p.inputAt=now;return true;
}
function phaseAt(elapsed){const cycle=elapsed%6000;return cycle>=4500?'flush':cycle>=3500?'warning':'calm';}
function tickToilet(g,now){
 if(g.phase!=='brawl')return;
 const t=g.toilet,end=Math.min(now,g.deadline);
 while(t.tickAt+STEP<=end+.001){
  t.tickAt+=STEP;const time=t.tickAt,elapsed=time-t.startedAt,flush=phaseAt(elapsed)==='flush';
  for(const p of t.bodies){
   if(p.bot&&(time>=p.thinkAt||(flush&&Math.hypot(p.x-300,p.y-300)<170))){
    p.thinkAt=time+300+p.slot*40;
    const nearest=t.ducks.filter(d=>time>=d.readyAt).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
    let dx=(nearest?.x||300)-p.x,dy=(nearest?.y||300)-p.y;
    if(flush&&Math.hypot(p.x-300,p.y-300)<170){dx=p.x-300;dy=p.y-300;}
    const distance=Math.hypot(dx,dy)||1;p.dx=dx/distance;p.dy=dy/distance;
    if(time>=p.readyAt&&(flush||distance>200)&&Math.sin(time/700+p.slot)>.2)boost(t,p,time);
   }else if(!p.bot&&time-p.inputAt>400){p.dx=0;p.dy=0;}
   if(time<p.stunUntil){p.vx*=.8;p.vy*=.8;continue;}
   p.vx+=p.dx*.5;p.vy+=p.dy*.5;
   if(flush){const dx=300-p.x,dy=300-p.y,d=Math.max(35,Math.hypot(dx,dy)),pull=.25+70/d;p.vx+=dx/d*pull-dy/d*.14;p.vy+=dy/d*pull+dx/d*.14;}
   const speed=Math.hypot(p.vx,p.vy),max=time-p.boostAt<350?18:p.bot?6:8;
   if(speed>max){p.vx*=max/speed;p.vy*=max/speed;}
   p.x+=p.vx;p.y+=p.vy;p.vx*=.94;p.vy*=.94;
   for(const axis of ['x','y'])if(p[axis]<R+12||p[axis]>588-R){p[axis]=clamp(p[axis],R+12,588-R);p[axis==='x'?'vx':'vy']*=-.85;}
   for(const b of BUMPERS){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;if(d<R+b.r){p.x=b.x+dx/d*(R+b.r);p.y=b.y+dy/d*(R+b.r);p.vx=dx/d*11;p.vy=dy/d*11;t.event={kind:'bonk',id:p.id,x:b.x,y:b.y,at:time};}}
   if(flush&&Math.hypot(p.x-300,p.y-300)<43){const lost=Math.min(3,p.loot);p.loot-=lost;p.flushes++;const [x,y]=startPosition(p.slot);p.x=x;p.y=y;p.vx=0;p.vy=0;p.stunUntil=time+650;t.event={kind:'flush',id:p.id,x:300,y:300,at:time,value:lost};continue;}
   for(const duck of t.ducks)if(time>=duck.readyAt&&Math.hypot(p.x-duck.x,p.y-duck.y)<R+13){
    const value=elapsed>=18000&&duck.id%2===0?3:1;p.loot+=value;p.collected+=value;
    t.event={kind:'duck',id:p.id,x:duck.x,y:duck.y,at:time,value};
    let pos;do{pos=duckPosition(t.serial++);}while(t.bodies.some(q=>Math.hypot(q.x-pos.x,q.y-pos.y)<75)&&t.serial%20!==0);
    duck.x=pos.x;duck.y=pos.y;duck.readyAt=time+700;
   }
  }
  for(let i=0;i<t.bodies.length;i++)for(let j=i+1;j<t.bodies.length;j++){
   const a=t.bodies[i],b=t.bodies[j];if(time<a.stunUntil||time<b.stunUntil)continue;
   let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=R*2)continue;if(d<.001){dx=1;dy=0;d=1;}
   const nx=dx/d,ny=dy/d,o=R*2-d;a.x-=nx*o/2;a.y-=ny*o/2;b.x+=nx*o/2;b.y+=ny*o/2;
   const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
   if(closing>0){a.vx-=nx*closing*.95;a.vy-=ny*closing*.95;b.vx+=nx*closing*.95;b.vy+=ny*closing*.95;
    if(closing>3&&time-Math.max(a.hitAt,b.hitAt)>450){
     const aPowered=time-a.boostAt<400,bPowered=time-b.boostAt<400;
     const attacker=aPowered===bPowered?null:aPowered?a:b,victim=attacker===a?b:a;
     if(attacker&&victim.loot>0){victim.loot--;attacker.loot++;t.event={kind:'steal',id:attacker.id,x:(a.x+b.x)/2,y:(a.y+b.y)/2,at:time,value:1};}
     else t.event={kind:'bonk',id:a.id,x:(a.x+b.x)/2,y:(a.y+b.y)/2,at:time};a.hitAt=time;b.hitAt=time;
    }
   }
  }
  for(const id of g.players)g.scores[id]=t.bodies.find(p=>p.id===id).loot*800;
 }
 if(now>=g.deadline){const ranked=[...t.bodies].sort((a,b)=>b.loot-a.loot||b.collected-a.collected);const tied=g.players.length===2&&ranked[0].loot===ranked[1].loot;g.winnerId=tied?null:ranked[0].id;g.phase=tied?'draw':'done';g.summary='toilet-duck-heist';}
}
function publicToilet(g,now){const t=g.toilet;if(!t)return undefined;const elapsed=Math.max(0,t.tickAt-t.startedAt);return {elapsed,flush:phaseAt(elapsed),golden:elapsed>=18000,bumpers:BUMPERS,
 bodies:t.bodies.map(p=>({id:p.id,bot:p.bot,slot:p.slot,x:p.x,y:p.y,vx:p.vx,vy:p.vy,loot:p.loot,collected:p.collected,flushes:p.flushes,cooldown:Math.max(0,p.readyAt-now),boosting:now-p.boostAt<350,stunned:now<p.stunUntil})),
 ducks:t.ducks.filter(d=>now>=d.readyAt).map(d=>({id:d.id,x:d.x,y:d.y,value:elapsed>=18000&&d.id%2===0?3:1})),event:t.event&&now-t.event.at<750?{...t.event,age:Math.max(0,now-t.event.at)}:null};}
function pauseToilet(g,delta){const t=g.toilet;if(!t)return;t.startedAt+=delta;t.tickAt+=delta;if(t.event)t.event.at+=delta;for(const p of t.bodies){for(const key of ['readyAt','boostAt','stunUntil','hitAt','thinkAt'])p[key]+=delta;p.dx=0;p.dy=0;p.inputAt=0;}for(const d of t.ducks)d.readyAt+=delta;}
module.exports={beginToilet,actToilet,tickToilet,publicToilet,pauseToilet,phaseAt};
