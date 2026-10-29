const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
const {normalizePractice}=require('../domain/soloProgression');
const {rules}=require('../games/chicken');
function game(players=['a','b']){const g=createParty('chicken',players);beginParty(g,1000);return g;}
function act(g,id,action,time=1000,data={}){return actParty(g,id,{action,turn:g.turn,...data},time);}
function place(g,id,x,y){Object.assign(g.snack.bodies.find(p=>p.id===id),{x,y,shieldUntil:0});}
function carry(g,id='a'){place(g,id,450,300);tickParty(g,1020);assert.equal(g.snack.box.carrier,id);}
test('poultry has a bounded 60-second arena, one declared practice bot and no fake human rival',()=>{
 const solo=game(['a']),duel=game();assert.equal(duel.deadline,61000);assert.equal(solo.snack.bodies.filter(p=>p.bot).length,1);assert.ok(duel.snack.bodies.every(p=>!p.bot));assert.throws(()=>game(['a','b','c']));
 assert.equal(publicParty(duel,'a',1000).snack.chicken.carryLimit,rules.carryLimitMs);
});
test('the living objective flees nearby players without crossing an industrial obstacle',()=>{
 const g=game();place(g,'a',350,300);tickParty(g,1200);assert.ok(g.snack.box.x>450);assert.equal(g.snack.box.carrier,null);
 const h=game();h.snack.box={x:220,y:175,carrier:null,availableAt:0};place(h,'a',100,175);tickParty(h,1900);assert.ok(h.snack.box.x<=227);
});
test('the chicken escapes after holding too long and cannot instantly be reclaimed by its owner',()=>{
 const g=game();carry(g);const deadline=g.snack.box.panicAt;tickParty(g,deadline+30);assert.equal(g.snack.box.carrier,null);assert.equal(g.snack.box.bannedId,'a');assert.ok(g.snack.events.some(e=>e.kind==='chicken-escape'));
 place(g,'a',g.snack.box.x,g.snack.box.y);tickParty(g,deadline+800);assert.notEqual(g.snack.box.carrier,'a');
});
test('a real throw resets the holding clock when another human intercepts',()=>{
 const g=game();carry(g);place(g,'b',620,300);assert.ok(act(g,'a','throw',1020));tickParty(g,1280);assert.equal(g.snack.box.carrier,'b');assert.equal(g.snack.bodies[1].interceptions,1);assert.ok(g.snack.box.panicAt>6500);
});
test('egg targets lock before impact, announce their radius, knock back and drop without inventing damage',()=>{
 const g=game();carry(g);g.snack.box.panicAt=20000;tickParty(g,8050);const egg=g.snack.chicken.eggs[0];assert.ok(egg);const pub=publicParty(g,'a',8050).snack.chicken.eggs[0];assert.equal(pub.radius,100);assert.ok(pub.landsIn>1200);const hp=g.snack.bodies[0].hp;
 const x=egg.x,y=egg.y;place(g,'a',x+10,y);tickParty(g,egg.landsAt+20);assert.equal(egg.x,x);assert.equal(egg.y,y);assert.equal(g.snack.box.carrier,null);assert.equal(g.snack.bodies[0].hp,hp);assert.ok(Math.abs(g.snack.bodies[0].kx)>0);
});
test('moving out of the announced circle avoids the egg and preserves possession',()=>{
 const g=game();carry(g);g.snack.box.panicAt=20000;tickParty(g,8050);const egg=g.snack.chicken.eggs[0];place(g,'a',egg.x,egg.y+150);tickParty(g,egg.landsAt+20);assert.equal(g.snack.box.carrier,'a');
});
test('a correctly timed evade avoids an egg impact',()=>{
 const g=game();carry(g);g.snack.box.panicAt=20000;tickParty(g,8050);const egg=g.snack.chicken.eggs[0];act(g,'a','evade',egg.landsAt-40);tickParty(g,egg.landsAt+20);assert.equal(g.snack.box.carrier,'a');
});
test('frenzy speeds up egg arrivals, and old splats are bounded',()=>{
 const g=game();tickParty(g,47000);assert.equal(publicParty(g,'a',47000).snack.chicken.frenzy,true);tickParty(g,50000);assert.ok(g.snack.chicken.nextEggAt-g.snack.tickAt<=rules.frenzyIntervalMs);assert.ok(g.snack.chicken.eggs.length<=1);
});
test('disconnect pause preserves carry, egg and match timers instead of consuming them',()=>{
 const g=game();carry(g);g.snack.box.panicAt=20000;tickParty(g,8050);const before=publicParty(g,'a',8050);pauseParty(g,10000,18050);const after=publicParty(g,'a',18050);assert.equal(after.remaining,before.remaining);assert.equal(after.snack.chicken.carryRemaining,before.snack.chicken.carryRemaining);assert.deepEqual(after.snack.chicken.eggs,before.snack.chicken.eggs);
});
test('three delivered chickens win once, normalize to the same score scale and reject late actions',()=>{
 const g=game();g.snack.bodies[0].captures=2;place(g,'a',80,300);g.snack.box={x:80,y:300,carrier:'a',availableAt:0,panicAt:5000};tickParty(g,1020);assert.equal(g.winnerId,'a');assert.equal(g.phase,'done');assert.equal(g.snack.bodies[0].captures,3);assert.equal(g.summary,'chicken-deliveries-then-knockouts');assert.equal(normalizePractice(g,'a'),1000);assert.equal(act(g,'a','throw',1100),false);tickParty(g,70000);assert.equal(g.snack.bodies[0].captures,3);
});
test('a tied human match requires both players to agree to a fresh replay',()=>{
 const g=game();tickParty(g,61000);assert.equal(g.phase,'draw');assert.equal(act(g,'a','retry',62000),true);assert.equal(g.phase,'draw');assert.equal(act(g,'b','retry',62000),true);assert.equal(g.phase,'brawl');assert.equal(g.deadline,122000);assert.equal(g.snack.chicken.eggs.length,0);
});
test('client scores, foreign identities and stale turns cannot forge a poultry result',()=>{
 const g=game();assert.equal(act(g,'a','score',1000,{score:1000}),false);assert.equal(act(g,'intruder','evade'),false);assert.equal(actParty(g,'a',{action:'evade',turn:0},1000),false);assert.equal(act(g,'a','input',1000,{dx:Infinity,dy:0,ax:1,ay:0}),false);assert.equal(g.scores.a,0);
});
