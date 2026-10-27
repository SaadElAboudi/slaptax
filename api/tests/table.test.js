const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
function game(players=['a']){const g=createParty('table',players);beginParty(g,1000);return g;}
const dash=(g,id='a',now=1000,extra={})=>actParty(g,id,{action:'dash',turn:g.turn,dx:0,dy:-1,power:.8,...extra},now);
test('table solo declares three bots; a duel only contains its two real players',()=>{
 const solo=game();assert.equal(solo.table.bodies.length,4);assert.equal(solo.table.bodies.filter(p=>p.bot).length,3);
 const duel=game(['a','b']);assert.equal(duel.table.bodies.length,2);assert.ok(duel.table.bodies.every(p=>!p.bot));
 assert.equal(publicParty(solo,'a',1000).table.bodies.length,4);
});
test('table rejects forged, stale, nonfinite, oversized and cooldown actions',()=>{
 const g=game();assert.equal(dash(g,'outsider'),false);
 for(const extra of [{dx:NaN},{dy:Infinity},{dx:2},{power:-1},{power:2},{dx:0,dy:0},{dx:'1'},{turn:0}])assert.equal(dash(g,'a',1000,extra),false);
 assert.equal(dash(g),true);assert.equal(dash(g,'a',1100),false);
 tickParty(g,2000);if(!g.table.bodies[0].out)assert.equal(dash(g,'a',2000),true);
});
test('table collisions transfer momentum, eject a rival and attribute a real knockout',()=>{
 const g=game();for(const p of g.table.bodies)p.readyAt=Infinity;
 Object.assign(g.table.bodies[0],{x:490,y:300,vx:12});Object.assign(g.table.bodies[1],{x:540,y:300,vx:0});
 Object.assign(g.table.bodies[2],{x:200,y:200});Object.assign(g.table.bodies[3],{x:200,y:400});
 tickParty(g,1300);assert.equal(g.table.bodies[1].out,true);assert.equal(g.table.bodies[0].kos,1);assert.ok(g.table.hits>0);
});
test('table fixed stepping produces the same result for differently batched ticks',()=>{
 const a=game(),b=game();dash(a);dash(b);
 tickParty(a,21000);for(let now=1050;now<=21000;now+=50)tickParty(b,now);
 assert.deepEqual(a.table,b.table);assert.deepEqual(a.scores,b.scores);assert.equal(a.phase,'done');assert.ok(a.scores.a>=0&&a.scores.a<=1000);
});
test('table pauses all physics and cooldown clocks, and resolves a tied duel with mutual retry',()=>{
 const g=game(['a','b']);tickParty(g,1500);const before=structuredClone(g.table);
 pauseParty(g,5000,6500);assert.equal(g.table.tickAt,before.tickAt+5000);assert.equal(g.deadline,26000);
 assert.equal(g.table.bodies[0].x,before.bodies[0].x);assert.equal(g.table.bodies[0].readyAt,before.bodies[0].readyAt+5000);
 tickParty(g,26000);assert.equal(g.phase,'draw');
 for(const id of ['a','b'])assert.equal(actParty(g,id,{action:'retry',turn:g.turn},27000),true);
 assert.equal(g.phase,'brawl');assert.equal(g.table.hits,0);
});

test('tablecloth warns ahead, pulls all humans identically once, and preserves symmetric duel fairness',()=>{
 const g=game(['a','b']);tickParty(g,5900);let s=publicParty(g,'a',5900).table;assert.equal(s.cloth.phase,'warning');assert.equal(s.cloth.direction,1);assert.equal(g.table.pulls,0);
 tickParty(g,7100);assert.equal(g.table.pulls,1);assert.ok(g.table.bodies.every(p=>p.x>300));assert.ok(Math.abs(g.table.bodies[0].x-g.table.bodies[1].x)<.001);
 const x=g.table.bodies[0].x;tickParty(g,7200);assert.equal(g.table.pulls,1);assert.ok(g.table.bodies[0].x>x);
 tickParty(g,21000);assert.equal(g.phase,'draw');assert.equal(g.table.pulls,3);
});
test('tablecloth warning and pull schedule freeze across a disconnect',()=>{
 const g=game(['a','b']);tickParty(g,6000);const before=publicParty(g,'a',6000).table.cloth;pauseParty(g,5000,11000);assert.deepEqual(publicParty(g,'a',11000).table.cloth,before);tickParty(g,12100);assert.equal(g.table.pulls,1);
});

test('tablecloth affects ready bots and humans equally instead of being overwritten by bot dashes',()=>{
 const a=game(),b=game();for(const g of [a,b]){g.table.tickAt=7000-1000/60;for(const p of g.table.bodies)p.readyAt=7000;}b.table.pulls=1;
 tickParty(a,7000);tickParty(b,7000);for(let i=0;i<4;i++){assert.ok(Math.abs(a.table.bodies[i].x-b.table.bodies[i].x-6)<.001);assert.ok(Math.abs(a.table.bodies[i].vx-b.table.bodies[i].vx-5.52)<.001);}
});
