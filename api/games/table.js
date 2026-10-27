// Fixed-step, server-owned cartoon knock-out arena. No client positions/scores.
const STEP=1000/60,RADIUS=30,DURATION=20000,COOLDOWN=950;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function beginTable(g,now){
 const bots=g.players.length===1?['table-bot-1','table-bot-2','table-bot-3']:[];
 const ids=[...g.players,...bots],starts=ids.length===2?[[300,410],[300,190]]:[[300,420],[300,180],[180,300],[420,300]];
 g.phase='brawl';g.deadline=now+DURATION;
 g.table={startedAt:now,tickAt:now,bound:40,winnerId:null,hits:0,lastHit:null,pulls:0,
  bodies:ids.map((id,i)=>({id,bot:bots.includes(id),x:starts[i][0],y:starts[i][1],vx:0,vy:0,radius:RADIUS,out:false,outAt:null,readyAt:now+(i?800+i*200:0),kos:0,lastTouchedBy:null,lastTouchAt:0}))};
}
function launch(t,p,dx,dy,power,now){
 const d=Math.hypot(dx,dy);if(!d||p.out||now<p.readyAt)return false;
 const speed=3+clamp(power,0,1)*10;
 p.vx=dx/d*speed;p.vy=dy/d*speed;p.readyAt=now+COOLDOWN;return true;
}
function actTable(g,id,action,now){
 if(g.phase!=='brawl'||action.action!=='dash')return false;
 const {dx,dy,power}=action;
 if(![dx,dy,power].every(v=>typeof v==='number'&&Number.isFinite(v))||Math.abs(dx)>1||Math.abs(dy)>1||power<0||power>1||Math.hypot(dx,dy)<.1)return false;
 const p=g.table.bodies.find(p=>p.id===id);if(!p||p.bot)return false;
 return launch(g.table,p,dx,dy,power,now);
}
function endTable(g,now){
 const t=g.table,alive=t.bodies.filter(p=>!p.out);
 // Survivors are ranked by proximity to the center when time expires.
 const ranked=[...alive].sort((a,b)=>Math.hypot(a.x-300,a.y-300)-Math.hypot(b.x-300,b.y-300));
 const tied=g.players.length>1&&(ranked.length===0||(ranked.length>1&&Math.abs(Math.hypot(ranked[0].x-300,ranked[0].y-300)-Math.hypot(ranked[1].x-300,ranked[1].y-300))<.1));
 t.winnerId=tied?null:ranked[0]?.id||null;
 for(const id of g.players){const p=t.bodies.find(p=>p.id===id),survival=clamp(((p.outAt||now)-t.startedAt)/DURATION,0,1);
  g.scores[id]=Math.min(t.winnerId===id?1000:450,Math.round(survival*300+p.kos*80+(t.winnerId===id?500:0)));
 }
 g.winnerId=t.winnerId;g.summary='table-last-standing';g.phase=tied?'draw':'done';
}
function tickTable(g,now){
 if(g.phase!=='brawl')return;
 const t=g.table,end=Math.min(now,g.deadline);
 while(t.tickAt+STEP<=end+.001){
  t.tickAt+=STEP;const time=t.tickAt;
  t.bound=40+clamp((time-t.startedAt-10000)/10000,0,1)*95;
  const alive=t.bodies.filter(p=>!p.out);
  const elapsed=time-t.startedAt,at=[6000,12000,16000][t.pulls];
  for(const [i,p]of alive.entries())if(p.bot&&time>=p.readyAt){
   const targets=alive.filter(q=>q.id!==p.id).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   const q=targets[0];if(q){const edge=Math.min(p.x-t.bound,p.y-t.bound,600-t.bound-p.x,600-t.bound-p.y);
    const dx=edge<50?300-p.x:q.x-p.x,dy=edge<50?300-p.y:q.y-p.y;
    const wobble=Math.sin(time/790+i)*.18,angle=Math.atan2(dy,dx)+wobble;
    launch(t,p,Math.cos(angle),Math.sin(angle),.58,time);p.readyAt=time+1550+i*170;
   }
  }
  if(at!==undefined&&elapsed+.001>=at){const direction=t.pulls%2===0?1:-1;for(const p of alive)p.vx+=direction*6;t.pulls++;}
  for(const p of alive){p.x+=p.vx;p.y+=p.vy;p.vx*=.92;p.vy*=.92;}
  for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){
   const a=alive[i],b=alive[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
   if(d>=RADIUS*2)continue;if(d<.001){dx=1;dy=0;d=1;}
   const nx=dx/d,ny=dy/d,overlap=RADIUS*2-d;
   a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2;
   const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
   if(closing>0){const as=Math.hypot(a.vx,a.vy),bs=Math.hypot(b.vx,b.vy),impulse=closing*.96;
    a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse;
    if(as>bs+.5){b.lastTouchedBy=a.id;b.lastTouchAt=time;}else if(bs>as+.5){a.lastTouchedBy=b.id;a.lastTouchAt=time;}
    if(closing>2){t.hits++;t.lastHit={x:(a.x+b.x)/2,y:(a.y+b.y)/2,at:time,strength:closing};}
   }
  }
  for(const p of alive)if(p.x<t.bound||p.x>600-t.bound||p.y<t.bound||p.y>600-t.bound){
   p.out=true;p.outAt=time;const attacker=t.bodies.find(a=>a.id===p.lastTouchedBy);
   if(attacker&&time-p.lastTouchAt<1500)attacker.kos++;
  }
  const survivors=t.bodies.filter(p=>!p.out);
  if(survivors.length<=1||(g.players.length===1&&t.bodies.find(p=>p.id===g.players[0]).out)){endTable(g,time);return;}
 }
 if(now>=g.deadline)endTable(g,g.deadline);
}
function publicTable(g,now){
 const t=g.table;if(!t)return undefined;
 const elapsed=Math.max(0,t.tickAt-t.startedAt),next=[6000,12000,16000][t.pulls],last=[6000,12000,16000][t.pulls-1];
 const cloth=next!==undefined&&elapsed>=next-1200?{phase:'warning',direction:t.pulls%2===0?1:-1}:last!==undefined&&elapsed-last<650?{phase:'pull',direction:(t.pulls-1)%2===0?1:-1}:{phase:'calm',direction:0};
 return {cloth,pulls:t.pulls,bound:t.bound,elapsed:Math.max(0,t.tickAt-t.startedAt),hits:t.hits,lastHit:t.lastHit?{...t.lastHit,age:Math.max(0,now-t.lastHit.at)}:null,winnerId:t.winnerId,
  bodies:t.bodies.map(p=>({id:p.id,bot:p.bot,x:p.x,y:p.y,vx:p.vx,vy:p.vy,out:p.out,fallAge:p.outAt?Math.max(0,now-p.outAt):0,cooldown:Math.max(0,p.readyAt-now),kos:p.kos}))};
}
function pauseTable(g,delta){const t=g.table;if(!t)return;t.startedAt+=delta;t.tickAt+=delta;if(t.lastHit)t.lastHit.at+=delta;for(const p of t.bodies){p.readyAt+=delta;if(p.outAt)p.outAt+=delta;p.lastTouchAt+=delta;}}
module.exports={beginTable,actTable,tickTable,publicTable,pauseTable};
