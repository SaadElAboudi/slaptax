const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
const {phaseAt}=require('../games/toilet');
function game(players=['a','b']){const g=createParty('toilet',players);beginParty(g,1000);return g;}
function act(g,id,action,now=1001){return actParty(g,id,{turn:g.turn,...action},now);}
test('toilet has four declared participants in solo and two humans in duel, with no missing ready snapshot',()=>{
 const waiting=createParty('toilet',['a']);assert.equal(publicParty(waiting,'a',1000).toilet,undefined);
 const solo=game(['a']);assert.equal(solo.toilet.bodies.filter(p=>p.bot).length,3);
 assert.equal(game().toilet.bodies.some(p=>p.bot),false);assert.equal(solo.deadline,26000);
});
test('toilet accepts bounded directions and a cooldown-limited turbo, never client loot or positions',()=>{
 const g=game(),p=g.toilet.bodies[0];
 for(const action of [{action:'steer',dx:NaN,dy:0},{action:'steer',dx:2,dy:0},{action:'steer',dx:'1',dy:0},{action:'score',loot:999}])assert.equal(act(g,'a',action),false);
 assert.equal(act(g,'outsider',{action:'boost'}),false);assert.equal(actParty(g,'a',{turn:0,action:'boost'},1001),false);
 assert.equal(act(g,'a',{action:'steer',dx:1,dy:1,loot:99,x:500}),true);assert.equal(p.loot,0);assert.equal(p.x,110);assert.ok(Math.hypot(p.dx,p.dy)<=1);
 assert.equal(act(g,'a',{action:'boost'}),true);assert.equal(act(g,'a',{action:'boost'},1002),false);
 tickParty(g,1400);assert.ok(p.x>110);tickParty(g,1900);assert.equal(p.dx,0);assert.equal(p.dy,0);
});
test('fixed-step toilet motion and bot pickups do not depend on broadcast tick batching',()=>{
 const a=game(['a']),b=game(['a']);for(const g of [a,b])act(g,'a',{action:'steer',dx:1,dy:-1});
 tickParty(a,9000);for(let now=1050;now<=9000;now+=50)tickParty(b,now);
 assert.deepEqual(publicParty(a,'a',9000).toilet,publicParty(b,'a',9000).toilet);
 for(const p of a.toilet.bodies)assert.ok([p.x,p.y,p.vx,p.vy].every(Number.isFinite));
});
test('duck pickups and final gold ducks grant server-owned loot and normalized raw points',()=>{
 for(const [gold,value] of [[false,1],[true,3]]){
  const g=game();if(gold)g.toilet.startedAt=-17001;
  g.toilet.ducks=[{id:2,x:110,y:490,readyAt:1000,value:1}];tickParty(g,1017);
  assert.equal(g.toilet.bodies[0].loot,value);assert.equal(g.scores.a,value*800);assert.equal(g.toilet.event.kind,'duck');
  assert.ok(g.toilet.ducks[0].readyAt>1017);
 }
});
test('a real turbo collision steals one duck and cannot farm repeated contact each frame',()=>{
 const g=game(),[a,b]=g.toilet.bodies;g.toilet.ducks=[];Object.assign(a,{x:200,y:300,vx:16,boostAt:1000});Object.assign(b,{x:249,y:300,loot:2});
 tickParty(g,1017);assert.equal(a.loot,1);assert.equal(b.loot,1);assert.equal(g.toilet.event.kind,'steal');
 tickParty(g,1050);assert.equal(a.loot,1);assert.equal(b.loot,1);
});
test('the flush is warned, costs at most three ducks and respawns rather than eliminating',()=>{
 assert.equal(phaseAt(3499),'calm');assert.equal(phaseAt(3500),'warning');assert.equal(phaseAt(4500),'flush');assert.equal(phaseAt(6000),'calm');
 const g=game(),p=g.toilet.bodies[0];g.toilet.startedAt=-3500;g.toilet.ducks=[];Object.assign(p,{x:300,y:300,loot:5});tickParty(g,1017);
 assert.equal(p.loot,2);assert.equal(p.flushes,1);assert.equal(p.x,110);assert.equal(p.y,490);assert.ok(p.stunUntil>1017);assert.equal(g.phase,'brawl');
});
test('pause preserves physics and loot; final standings and mutual retry are server-owned',()=>{
 const g=game();tickParty(g,1500);const before=structuredClone(g.toilet.bodies);pauseParty(g,5000,6500);tickParty(g,6500);
 assert.deepEqual(g.toilet.bodies.map(p=>[p.x,p.y,p.loot]),before.map(p=>[p.x,p.y,p.loot]));
 g.toilet.tickAt=g.deadline-1000/60;g.toilet.ducks=[];g.toilet.bodies[0].loot=4;g.toilet.bodies[1].loot=2;tickParty(g,g.deadline);assert.equal(g.phase,'done');assert.equal(g.winnerId,'a');
 const tie=game();tie.toilet.tickAt=tie.deadline-1000/60;tie.toilet.ducks=[];tickParty(tie,tie.deadline);assert.equal(tie.phase,'draw');
 assert.equal(act(tie,'a',{action:'retry'},27000),true);assert.equal(tie.phase,'draw');assert.equal(act(tie,'b',{action:'retry'},27001),true);assert.equal(tie.phase,'brawl');assert.equal(tie.toilet.bodies[0].loot,0);
});

test('solo bots leave an opening for the human instead of reacting instantly to every duck',()=>{
 const g=game(['a']),starts=g.toilet.bodies.filter(p=>p.bot).map(p=>[p.x,p.y]);act(g,'a',{action:'steer',dx:1,dy:0});tickParty(g,1300);
 assert.ok(g.toilet.bodies[0].x>130);assert.deepEqual(g.toilet.bodies.filter(p=>p.bot).map(p=>[p.x,p.y]),starts);
});
test('normalization cannot turn different large duck hauls into a tied duel',()=>{
 const g=game();g.toilet.tickAt=g.deadline-1000/60;g.toilet.ducks=[];g.toilet.bodies[0].loot=20;g.toilet.bodies[1].loot=18;tickParty(g,g.deadline);
 assert.equal(g.winnerId,'a');assert.equal(g.scores.a,16000);assert.equal(g.scores.b,14400);
});

test('two simultaneous turbos counter each other without granting a first-player steal',()=>{
 const g=game(),[a,b]=g.toilet.bodies;g.toilet.ducks=[];Object.assign(a,{x:200,y:300,vx:16,boostAt:1000,loot:2});Object.assign(b,{x:249,y:300,vx:-16,boostAt:1000,loot:2});tickParty(g,1017);
 assert.equal(a.loot,2);assert.equal(b.loot,2);assert.equal(g.toilet.event.kind,'bonk');
});
