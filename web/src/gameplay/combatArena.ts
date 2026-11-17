/** Local combat laboratory. No network authority, wallet or ranked rewards. */
export type Kit='volt'|'brick'|'echo';
export const KITS:Record<Kit,{name:string;hp:number;speed:number;damage:number;range:number;reload:number;pellets:number;color:string}>={
 volt:{name:'VOLT',hp:100,speed:205,damage:22,range:410,reload:.32,pellets:1,color:'#ffdf65'},
 brick:{name:'BRICK',hp:150,speed:175,damage:13,range:255,reload:.65,pellets:5,color:'#ff996c'},
 echo:{name:'ECHO',hp:80,speed:215,damage:46,range:650,reload:.8,pellets:1,color:'#bca1ff'},
};
export const FIELD={width:960,height:1200,limit:90,target:100,zone:{x:480,y:600,r:122}};
export const WALLS=[{x:180,y:260,w:170,h:66},{x:610,y:260,w:170,h:66},{x:90,y:510,w:160,h:92},{x:710,y:598,w:160,h:92},{x:180,y:874,w:170,h:66},{x:610,y:874,w:170,h:66},{x:400,y:370,w:160,h:54},{x:400,y:776,w:160,h:54}];
export type Fighter={id:number;team:0|1;kit:Kit;x:number;y:number;hp:number;aimX:number;aimY:number;cooldown:number;dash:number;dashTime:number;charge:number;respawn:number;kills:number;deaths:number;hurt:number;dashX:number;dashY:number;navAt:number;navX:number;navY:number};
export type Shot={id:number;owner:number;x:number;y:number;vx:number;vy:number;left:number;damage:number;super:boolean};
export type Spark={x:number;y:number;life:number;color:string;size:number};
export type Combat={time:number;players:Fighter[];shots:Shot[];sparks:Spark[];score:[number,number];winner:0|1|2|null;nextId:number;zone:0|1|2;seed:number};
export type Command={mx:number;my:number;ax:number;ay:number;fire:boolean;dash:boolean;super:boolean};
export const neutral=():Command=>({mx:0,my:0,ax:0,ay:-1,fire:false,dash:false,super:false});
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function unit(x:number,y:number){const n=Math.hypot(x,y);return n>.001?{x:x/n,y:y/n}:{x:0,y:0};}
function random(s:Combat){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
export function createCombat(kit:Kit='volt',seed=42):Combat{
 const players:Fighter[]=Array.from({length:6},(_,id)=>({id,team:id<3?0:1,kit:id===0?kit:((['brick','echo','volt'] as Kit[])[id%3]),x:290+(id%3)*190,y:id<3?1040:160,hp:0,aimX:0,aimY:id<3?-1:1,cooldown:0,dash:0,dashTime:0,charge:0,respawn:0,kills:0,deaths:0,hurt:0,dashX:0,dashY:0,navAt:0,navX:0,navY:0}));
 for(const p of players)p.hp=KITS[p.kit].hp;
 return {time:0,players,shots:[],sparks:[],score:[0,0],winner:null,nextId:1,zone:2,seed:seed>>>0};
}
function blocked(x:number,y:number,r=23){return WALLS.some(w=>x+r>w.x&&x-r<w.x+w.w&&y+r>w.y&&y-r<w.y+w.h);}
function move(p:Fighter,dx:number,dy:number){const x=clamp(p.x+dx,27,FIELD.width-27),y=clamp(p.y+dy,27,FIELD.height-27);if(!blocked(x,p.y))p.x=x;if(!blocked(p.x,y))p.y=y;}
function burst(s:Combat,x:number,y:number,color:string,size=8){for(let i=0;i<6;i++)s.sparks.push({x:x+(random(s)-.5)*32,y:y+(random(s)-.5)*32,life:.22+random(s)*.18,color,size});}
export function shoot(s:Combat,p:Fighter,ax:number,ay:number,superShot=false){
 if(p.hp<=0||p.cooldown>0||!Number.isFinite(ax)||!Number.isFinite(ay))return false;
 const u=unit(ax,ay);if(!u.x&&!u.y)return false;
 if(superShot&&p.charge<100)return false;
 const kit=KITS[p.kit],count=superShot?9:kit.pellets,angle=Math.atan2(u.y,u.x);
 for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*(superShot?.12:.1);s.shots.push({id:s.nextId++,owner:p.id,x:p.x+u.x*29,y:p.y+u.y*29,vx:Math.cos(a)*800,vy:Math.sin(a)*800,left:superShot?520:kit.range,damage:superShot?22:kit.damage,super:superShot});}
 p.aimX=u.x;p.aimY=u.y;p.cooldown=superShot?.5:kit.reload;if(superShot)p.charge=0;
 return true;
}
function visible(a:{x:number;y:number},b:{x:number;y:number}){const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/15);for(let i=1;i<n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,6))return false;return true;}
function waypoint(p:Fighter,target:{x:number;y:number}){
 if(visible(p,target)&&!blocked(target.x,target.y,27)){
  // Visibility of a bullet alone does not guarantee enough clearance for a fighter.
  const steps=Math.ceil(Math.hypot(target.x-p.x,target.y-p.y)/20);let clear=true;
  for(let i=1;i<=steps;i++)if(blocked(p.x+(target.x-p.x)*i/steps,p.y+(target.y-p.y)*i/steps,27)){clear=false;break;}
  if(clear)return target;
 }
 const cols=24,rows=30,index=(x:number,y:number)=>clamp(Math.floor(y/40),0,rows-1)*cols+clamp(Math.floor(x/40),0,cols-1),start=index(p.x,p.y),end=index(target.x,target.y),queue=[start],parent=new Int32Array(cols*rows).fill(-1);parent[start]=start;
 for(let at=0;at<queue.length;at++){
  const id=queue[at];if(id===end)break;const x=id%cols,y=Math.floor(id/cols);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,n=ny*cols+nx;if(nx<1||ny<1||nx>=cols-1||ny>=rows-1||parent[n]!==-1||blocked(nx*40+20,ny*40+20,27))continue;parent[n]=id;queue.push(n);}
 }
 if(parent[end]===-1)return target;
 let next=end;while(parent[next]!==start&&next!==start)next=parent[next];return{x:next%cols*40+20,y:Math.floor(next/cols)*40+20};
}
function botCommand(s:Combat,p:Fighter):Command{
 const enemies=s.players.filter(e=>e.team!==p.team&&e.hp>0&&visible(p,e)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 const enemy=enemies[0],kit=KITS[p.kit],angle=(p.id%3)*Math.PI*2/3+(p.team?Math.PI:0),target={x:FIELD.zone.x+Math.cos(angle)*65,y:FIELD.zone.y+Math.sin(angle)*65};
 if(s.time>=p.navAt){const next=waypoint(p,target);p.navX=next.x;p.navY=next.y;p.navAt=s.time+.25;}
 let u=unit(p.navX-p.x,p.navY-p.y);if(Math.hypot(target.x-p.x,target.y-p.y)<20)u={x:0,y:0};
 const threat=s.shots.find(b=>s.players[b.owner].team!==p.team&&Math.hypot(b.x-p.x,b.y-p.y)<95);
 if(threat&&Math.hypot(p.x-480,p.y-600)<170){const v=unit(-threat.vy,threat.vx);if(!blocked(p.x+v.x*50,p.y+v.y*50))u=v;}
 return {mx:u.x,my:u.y,ax:enemy?enemy.x-p.x:0,ay:enemy?enemy.y-p.y:-1,fire:!!enemy&&Math.hypot(enemy.x-p.x,enemy.y-p.y)<kit.range,super:p.charge>=100&&!!enemy,dash:!!threat&&p.dash===0};
}
/** Fixed small steps prevent projectiles tunnelling through covers at low frame rates. */
export function stepCombat(s:Combat,input:Command,elapsed:number){
 if(s.winner!==null)return;
 const dt=clamp(Number.isFinite(elapsed)?elapsed:0,0,.05);if(!dt)return;s.time+=dt;
 for(const p of s.players){
  p.cooldown=Math.max(0,p.cooldown-dt);p.dash=Math.max(0,p.dash-dt);p.dashTime=Math.max(0,p.dashTime-dt);p.hurt=Math.max(0,p.hurt-dt);
  if(p.hp<=0){p.respawn-=dt;if(p.respawn<=0){p.hp=KITS[p.kit].hp;p.x=290+(p.id%3)*190;p.y=p.team===0?1040:160;burst(s,p.x,p.y,'#efffff');}continue;}
  const c=p.id===0?input:botCommand(s,p),u=unit(Number.isFinite(c.mx)?c.mx:0,Number.isFinite(c.my)?c.my:0);
  if(c.dash&&p.dash===0){p.dash=3.5;p.dashTime=.16;p.dashX=u.x||u.y?u.x:p.aimX;p.dashY=u.x||u.y?u.y:p.aimY;burst(s,p.x,p.y,'#a8f8ff',5);}
  const speed=KITS[p.kit].speed*(p.dashTime>0?3.5:Math.min(1,Math.hypot(Number.isFinite(c.mx)?c.mx:0,Number.isFinite(c.my)?c.my:0)));const direction=p.dashTime>0?{x:p.dashX,y:p.dashY}:u;
  // Small collision steps also keep a dash from crossing a wall.
  for(let i=0;i<4;i++)move(p,direction.x*speed*dt/4,direction.y*speed*dt/4);
  if(Math.hypot(c.ax,c.ay)>.1){const a=unit(c.ax,c.ay);p.aimX=a.x;p.aimY=a.y;}
  if(c.super)shoot(s,p,c.ax,c.ay,true);else if(c.fire)shoot(s,p,c.ax,c.ay);
  if(p.hurt===0)p.hp=Math.min(KITS[p.kit].hp,p.hp+dt*7);
 }
 for(const shot of s.shots){
  // Swept ray sampling at <= 10 world units guarantees hit checks across a whole tick.
  const distance=Math.min(shot.left,800*dt),steps=Math.max(1,Math.ceil(distance/10));
  for(let i=0;i<steps&&shot.left>0;i++){
   shot.x+=shot.vx/800*distance/steps;shot.y+=shot.vy/800*distance/steps;shot.left-=distance/steps;
   if(blocked(shot.x,shot.y,5)||shot.x<0||shot.x>FIELD.width||shot.y<0||shot.y>FIELD.height){shot.left=0;burst(s,shot.x,shot.y,'#f8da8b',4);break;}
   const owner=s.players[shot.owner],hit=s.players.find(p=>p.team!==owner.team&&p.hp>0&&Math.hypot(shot.x-p.x,shot.y-p.y)<27);
   if(hit){hit.hp=Math.max(0,hit.hp-shot.damage);hit.hurt=3;owner.charge=Math.min(100,owner.charge+(shot.super?0:shot.damage));shot.left=0;burst(s,hit.x,hit.y,hit.team===0?'#6cf5ff':'#ff8099');if(!hit.hp){hit.deaths++;hit.respawn=3;owner.kills++;burst(s,hit.x,hit.y,'#fff',14);}break;}
  }
 }
 s.shots=s.shots.filter(b=>b.left>0);s.sparks=s.sparks.filter(p=>(p.life-=dt)>0).slice(-150);
 const present=[0,0];for(const p of s.players)if(p.hp>0&&Math.hypot(p.x-FIELD.zone.x,p.y-FIELD.zone.y)<FIELD.zone.r)present[p.team]++;
 s.zone=present[0]>0&&present[1]===0?0:present[1]>0&&present[0]===0?1:2;
 if(s.zone!==2)s.score[s.zone]=Math.min(100,s.score[s.zone]+dt*8);
 if(s.score[0]>=100||s.score[1]>=100||s.time>=FIELD.limit)s.winner=s.score[0]===s.score[1]?2:s.score[0]>s.score[1]?0:1;
}
