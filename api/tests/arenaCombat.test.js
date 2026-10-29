const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
const {rules,chargeSuper}=require('../games/arenaCombat');
function game(players=['a','b'],id='snack'){const g=createParty(id,players);beginParty(g,1000);g.snack.box={x:450,y:550,carrier:null,availableAt:1e9};return g;}
function action(g,id,action,now=1000,data={}){return actParty(g,id,{action,turn:g.turn,...data},now);}
function place(g,index,x,y){Object.assign(g.snack.bodies[index],{x,y,shieldUntil:0,kx:0,ky:0});}
function choose(g,id,character){assert.equal(action(g,id,'character',1000,{character}),true);}
function input(g,id,ax=1,ay=0,now=1000){return action(g,id,'input',now,{dx:0,dy:0,ax,ay});}
function charged(g,index=0){g.snack.bodies[index].superCharge=100;}
test('ammo has a bounded magazine, reloads on server time and cannot be forged',()=>{
 const g=game(),p=g.snack.bodies[0];assert.equal(p.ammo,3);for(const t of [1000,1520,2040,2560]){tickParty(g,t);assert.equal(action(g,'a','attack',t),true);}tickParty(g,3080);assert.equal(action(g,'a','attack',3080),false);assert.equal(p.ammo,0);tickParty(g,3210);assert.equal(p.ammo,1);assert.equal(action(g,'a','ammo',3210,{ammo:999}),false);assert.equal(p.ammo,1);
});
test('throwing a real objective does not consume slap ammo',()=>{const g=game();g.snack.box={x:80,y:300,carrier:'a',availableAt:0};assert.equal(action(g,'a','throw'),true);assert.equal(g.snack.bodies[0].ammo,3);});
test('retreat regenerates one HP at a time, never beyond the selected fighter maximum',()=>{
 const g=game();choose(g,'a','toast');const p=g.snack.bodies[0];p.hp=2;tickParty(g,5400);assert.equal(p.hp,2);tickParty(g,5520);assert.equal(p.hp,3);tickParty(g,6840);assert.equal(p.hp,4);tickParty(g,8200);assert.equal(p.hp,5);tickParty(g,14000);assert.equal(p.hp,5);
});
test('attacking interrupts recovery and carrying the objective prevents regeneration',()=>{
 const g=game(),p=g.snack.bodies[0];p.hp=2;tickParty(g,5000);action(g,'a','attack',5000);tickParty(g,5600);assert.equal(p.hp,2);
 g.snack.box={x:450,y:300,carrier:'a',availableAt:0};place(g,0,450,300);tickParty(g,11000);assert.equal(p.hp,2);
});
test('real damage charges both sides, misses do not, and charge is capped',()=>{
 const g=game();place(g,0,420,300);place(g,1,490,300);input(g,'a');action(g,'a','attack');tickParty(g,1160);assert.equal(g.snack.bodies[0].superCharge,20);assert.equal(g.snack.bodies[1].superCharge,7);chargeSuper(g.snack.bodies[0],500);assert.equal(g.snack.bodies[0].superCharge,100);
 const h=game();action(h,'a','attack');tickParty(h,1500);assert.equal(h.snack.bodies[0].superCharge,0);
});
test('unearned or forged supers and foreign identities are rejected without spending charge',()=>{
 const g=game();assert.equal(action(g,'a','super',1000,{superCharge:100}),false);charged(g);assert.equal(action(g,'evil','super'),false);assert.equal(g.snack.bodies[0].superCharge,100);assert.equal(actParty(g,'a',{action:'super',turn:0},1000),false);
});
test('flan super has a visible windup, hits for two and never charges itself',()=>{
 const g=game();place(g,0,420,300);place(g,1,550,300);input(g,'a');charged(g);assert.equal(action(g,'a','super'),true);assert.equal(action(g,'a','super',1010),false);tickParty(g,1300);assert.equal(g.snack.bodies[1].hp,4);assert.ok(publicParty(g,'a',1300).snack.bodies[0].superWindup>0);tickParty(g,1400);assert.equal(g.snack.bodies[1].hp,2);assert.equal(g.snack.bodies[0].superCharge,0);assert.equal(g.snack.bodies[0].supersUsed,1);
});
test('super waves respect cover and a correctly timed evade',()=>{
 const covered=game();place(covered,0,220,175);place(covered,1,355,175);charged(covered);action(covered,'a','super');tickParty(covered,1400);assert.equal(covered.snack.bodies[1].hp,4);
 const g=game();place(g,0,420,300);place(g,1,550,300);input(g,'a');charged(g);action(g,'a','super');action(g,'b','evade',1330);tickParty(g,1400);assert.equal(g.snack.bodies[1].hp,4);
});
test('toast protects only nearby allies for one hit, including in a real four-player arena',()=>{
 const g=game(['a','b','c','d']);choose(g,'a','toast');place(g,0,420,300);place(g,2,420,380);place(g,1,500,300);place(g,3,820,450);charged(g);action(g,'a','super');assert.equal(g.snack.bodies[0].wardCharges,1);assert.equal(g.snack.bodies[2].wardCharges,1);assert.equal(g.snack.bodies[1].wardCharges,0);input(g,'b',-1);action(g,'b','attack');tickParty(g,1160);assert.equal(g.snack.bodies[0].hp,5);assert.equal(g.snack.bodies[0].wardCharges,0);assert.equal(g.snack.bodies[0].superCharge,rules.chargeBlock);
});
test('toast protection expires and does not stack',()=>{const g=game();choose(g,'a','toast');charged(g);action(g,'a','super');charged(g);action(g,'a','super',1100);assert.equal(g.snack.bodies[0].wardCharges,1);tickParty(g,5300);assert.equal(publicParty(g,'a',5300).snack.bodies[0].wardRemaining,0);});
test('pickle super boosts teammates, slows rivals and stays behind cover',()=>{
 const g=game(['a','b','c','d']);choose(g,'a','pickle');place(g,0,400,300);place(g,1,530,300);place(g,2,460,350);place(g,3,820,450);input(g,'a');charged(g);action(g,'a','super');assert.equal(g.snack.zones.length,3);tickParty(g,1400);assert.equal(g.snack.bodies[1].slowed,true);assert.equal(g.snack.bodies[2].hasted,true);assert.equal(g.snack.bodies[0].superCharge,0);
 const h=game();choose(h,'a','pickle');place(h,0,220,175);charged(h);action(h,'a','super');assert.ok(h.snack.zones.every(z=>z.x<250));
});
test('passing charges only real teammate catches and is capped by a per-passer window',()=>{
 const g=game(['a','b','c','d']);place(g,0,450,300);place(g,2,620,300);g.snack.box={x:450,y:300,carrier:'a',availableAt:0};action(g,'a','throw');tickParty(g,1280);assert.equal(g.snack.bodies[0].superCharge,12);assert.ok(g.snack.bodies[0].passChargeAt>1280);assert.equal(g.snack.bodies[2].superCharge,0);
 tickParty(g,1500);place(g,0,450,300);place(g,2,620,300);g.snack.box={x:450,y:300,carrier:'a',availableAt:0};action(g,'a','throw',1500);tickParty(g,1780);assert.equal(g.snack.bodies[0].passes,2);assert.equal(g.snack.bodies[0].superCharge,12);
 tickParty(g,4500);place(g,0,450,300);place(g,2,620,300);g.snack.box={x:450,y:300,carrier:'a',availableAt:0};action(g,'a','throw',4500);tickParty(g,4780);assert.equal(g.snack.bodies[0].superCharge,24);
});
test('pause preserves reload, heal, super windup and ward timers',()=>{
 const g=game();g.snack.bodies[0].hp=3;charged(g);action(g,'a','super');const before=publicParty(g,'a',1100).snack.bodies[0];pauseParty(g,6000,7100);const after=publicParty(g,'a',7100).snack.bodies[0];assert.equal(after.superWindup,before.superWindup);assert.equal(after.regenIn,before.regenIn);
});
test('a KO retains only 75 percent charge and clears pending supers and protection',()=>{
 const g=game();place(g,0,420,300);place(g,1,490,300);g.snack.bodies[1].hp=1;g.snack.bodies[1].superCharge=80;input(g,'a');action(g,'a','attack');tickParty(g,1160);assert.equal(g.snack.bodies[1].superCharge,Math.floor(87*.75));assert.ok(g.snack.bodies[1].respawnAt);assert.equal(g.snack.bodies[1].wardCharges,0);
});
