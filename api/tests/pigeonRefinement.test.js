const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
const {carX,windAt}=require('../games/absurd');
function game(){const g=createParty('pigeon',['a','b'],min=>min);beginParty(g,1000);return g;}
function act(g,id,action,now){return actParty(g,id,{turn:g.turn,...action},now);}
function fire(g,now,slot=1,offset=0){tickParty(g,now);let drift=0;for(let t=0;t<900;t+=50)drift+=windAt(now-1000+t+25)*.05;const p=g.absurd.bodies[0];p.x=p.targetX=carX(slot,now-1000+900)-drift+offset;assert.ok(p.x>=50&&p.x<=550);assert.ok(Math.abs(carX(0,now-1000+900)-carX(1,now-1000+900))>80);assert.equal(act(g,'a',{action:'drop'},now),true);}
test('pigeon: personal bullseye streak rewards actual collisions and caps bonus',()=>{
 const g=game(),p=g.absurd.bodies[0];let score=0;
 for(const [i,time] of [1000,2100,3200,4300,5400].entries()){fire(g,time);tickParty(g,time+900);score+=180+Math.min(60,i*20);assert.equal(p.score,score);assert.equal(p.deliveryStreak,i+1);}
 const state=publicParty(g,'a',6300).absurd;assert.equal(state.bodies[0].perfects,5);assert.equal(state.bodies[1].deliveryStreak,0);
 assert.equal(act(g,'a',{action:'score',score:9999,deliveryStreak:50},6301),false);assert.equal(p.score,score);
});
test('pigeon: off-center delivery, blocked delivery, own goal and miss break the streak',()=>{
 for(const mode of ['off-center','own','miss']){const g=game(),p=g.absurd.bodies[0];fire(g,1000);tickParty(g,1900);assert.equal(p.deliveryStreak,1);
 fire(g,2500,mode==='own'?0:1,mode==='off-center'?25:mode==='miss'?70:0);
 if(mode==='blocked')act(g,'b',{action:'umbrella'},3000);
 tickParty(g,3400);assert.equal(p.deliveryStreak,0,mode);assert.equal(p.perfects,1,mode);
 }
});
test('pigeon: pause preserves a real shot and cannot activate a removed defense',()=>{
 const g=game();fire(g,1000);assert.equal(act(g,'b',{action:'umbrella'},1750),false);tickParty(g,1800);pauseParty(g,5000,6800);tickParty(g,6900);const s=publicParty(g,'b',6900).absurd;assert.equal(s.bodies[0].score,180);assert.equal(s.bodies[1].parries,0);assert.equal(s.events.at(-1).kind,'bullseye');
});
