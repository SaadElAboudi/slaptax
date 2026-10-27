const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty,recordParty,partyMoment}=require('../games/partyGames');
const {carX,windAt}=require('../games/absurd');const {normalizePractice}=require('../domain/soloProgression');
function game(id,players=['a','b']){const g=createParty(id,players,min=>min);beginParty(g,1000);return g;}
function act(g,id,action,now=1001){return actParty(g,id,{turn:g.turn,...action},now);}
function aim(g,slot){let drift=0;for(let t=50;t<=900;t+=50)drift+=windAt(t-25)*.05;const p=g.absurd.bodies[0];p.x=p.targetX=carX(slot,900)-drift;return p;}
for(const id of ['pigeon','lift']){
 test(`${id}: initial state is safe, solo declares its bot, duels contain only the humans`,()=>{assert.equal(publicParty(createParty(id,['a']),'a',1000).absurd,undefined);assert.equal(game(id,['a']).absurd.bodies.filter(p=>p.bot).length,1);assert.ok(game(id).absurd.bodies.every(p=>!p.bot));});
 test(`${id}: wrong turns, outsiders and forged scores cannot change the result`,()=>{const g=game(id);assert.equal(act(g,'outsider',{action:'drop'}),false);assert.equal(actParty(g,'a',{turn:0,action:'prout'},1001),false);assert.equal(act(g,'a',{action:'score',score:99999}),false);assert.equal(g.scores.a,0);});
 test(`${id}: simulation is independent of tick batching`,()=>{const a=game(id,['a']),b=game(id,['a']);tickParty(a,10000);for(let t=1050;t<=10000;t+=50)tickParty(b,t);assert.deepEqual(publicParty(a,'a',10000),publicParty(b,'a',10000));});
 test(`${id}: inactive humans score zero and tied duels need mutual retry`,()=>{const g=game(id);tickParty(g,g.deadline);assert.equal(g.phase,'draw');assert.deepEqual(g.scores,{a:0,b:0});assert.equal(normalizePractice(g,'a'),0);act(g,'a',{action:'retry'},g.deadline+1);assert.equal(g.phase,'draw');act(g,'b',{action:'retry'},g.deadline+2);assert.equal(g.phase,'brawl');assert.equal(g.absurd.events.length,0);});
 test(`${id}: pauses preserve simulation, pending effects and replay evidence`,()=>{const g=game(id);act(g,'a',{action:id==='pigeon'?'drop':'prout'});tickParty(g,1200);const before=publicParty(g,'a',1200).absurd;pauseParty(g,5000,6200);const after=publicParty(g,'a',6200).absurd;assert.equal(after.elapsed,before.elapsed);assert.equal(after.bodies[0].score,before.bodies[0].score);if(id==='pigeon')assert.equal(after.shots[0].progress,before.shots[0].progress);else assert.equal(after.strikes[0].remaining,before.strikes[0].remaining);recordParty(g,6200,true);assert.ok(partyMoment(g).replay.at(-1).state.absurd);});
}
test('pigeon: bounded steering and cooldowns, no client teleports or scores',()=>{const g=game('pigeon'),p=g.absurd.bodies[0];for(const x of [NaN,Infinity,-1,2,'0.5'])assert.equal(act(g,'a',{action:'steer',x}),false);assert.equal(act(g,'a',{action:'steer',x:1}),true);assert.equal(p.x,150);tickParty(g,1200);assert.ok(p.x>150&&p.x<550);assert.equal(act(g,'a',{action:'drop'},1201),true);assert.equal(act(g,'a',{action:'drop'},1202),false);assert.equal(act(g,'a',{action:'umbrella'},1202),true);assert.equal(act(g,'a',{action:'umbrella'},1203),false);});
test('pigeon: actual flight drift lands a bullseye on the rival, not instantly on fire',()=>{const g=game('pigeon');aim(g,1);assert.equal(act(g,'a',{action:'drop'},1000),true);tickParty(g,1850);assert.equal(g.scores.a,0);tickParty(g,1900);assert.equal(g.scores.a,180);assert.equal(g.absurd.bodies[0].hits,1);assert.equal(g.absurd.events.at(-1).kind,'splat');});
test('pigeon: own goals cost real points and umbrella protection rewards the defender',()=>{
 const g=game('pigeon'),p=aim(g,0);p.score=100;act(g,'a',{action:'drop'},1000);tickParty(g,1900);assert.equal(g.scores.a,50);assert.equal(p.ownGoals,1);
 const h=game('pigeon');aim(h,1);act(h,'a',{action:'drop'},1000);act(h,'b',{action:'umbrella'},1500);tickParty(h,1900);assert.equal(h.scores.a,0);assert.equal(h.scores.b,40);assert.equal(h.absurd.bodies[1].blocks,1);
});
test('lift: hidden gas is revealed only during warning; safe confirmations earn beans and refill ammo',()=>{
 const g=game('lift');assert.equal(publicParty(g,'a',1000).absurd.wave.gas,null);tickParty(g,1900);assert.equal(publicParty(g,'a',1900).absurd.wave.gas,0);
 act(g,'a',{action:'lane',lane:1},2000);tickParty(g,2600);assert.equal(g.scores.a,120);assert.equal(g.scores.b,0);assert.equal(g.absurd.bodies[0].beans,1);
 act(g,'a',{action:'lane',lane:1},3400);tickParty(g,3900);assert.equal(g.scores.a,240);assert.equal(g.absurd.bodies[0].ammo,2);tickParty(g,5200);assert.equal(g.scores.a,240);
});
test('lift: lane validation, movement cooldown, targeted fart warning and real dodge',()=>{
 const g=game('lift');for(const lane of [-1,3,NaN,1.2,'1'])assert.equal(act(g,'a',{action:'lane',lane}),false);
 assert.equal(act(g,'a',{action:'prout'},1001),true);assert.equal(g.absurd.bodies[0].ammo,0);assert.equal(g.absurd.strikes[0].lane,1);assert.equal(act(g,'a',{action:'prout'},1002),false);
 assert.equal(act(g,'b',{action:'lane',lane:2},1400),true);assert.equal(act(g,'b',{action:'lane',lane:0},1401),false);tickParty(g,1800);assert.equal(g.absurd.bodies[1].stinks,0);assert.equal(g.absurd.bodies[1].blocks,1);assert.equal(g.scores.a,0);
});
test('lift: a targeted fart earns points only if the rival remains in the announced lane',()=>{const g=game('lift');act(g,'a',{action:'prout'},1001);tickParty(g,1800);assert.equal(g.scores.a,100);assert.equal(g.scores.b,0);assert.equal(g.absurd.bodies[0].pranks,1);assert.equal(g.absurd.bodies[1].stinks,1);assert.equal(g.absurd.events.at(-1).kind,'gas');});
test('new solo ratings use server points and remain bounded',()=>{for(const [id,raw]of [['pigeon',1500],['lift',1250]]){const g=game(id,['a']);g.scores.a=raw;assert.equal(normalizePractice(g,'a'),500);g.scores.a=999999;assert.equal(normalizePractice(g,'a'),1000);}});

test('pigeon: covering an own goal prevents the penalty but cannot farm block points',()=>{
 const g=game('pigeon');aim(g,0);act(g,'a',{action:'drop'},1000);act(g,'a',{action:'umbrella'},1500);tickParty(g,1900);assert.equal(g.scores.a,0);assert.equal(g.absurd.bodies[0].blocks,1);assert.equal(g.absurd.events.at(-1).value,0);
});
