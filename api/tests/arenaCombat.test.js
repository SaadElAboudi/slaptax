const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty}=require('../games/partyGames');
for(const kind of ['snack','chicken']){
 function game(players=['a','b']){const g=createParty(kind,players);beginParty(g,1000);g.snack.box={x:450,y:550,carrier:null,availableAt:1e9};return g;}
 const action=(g,id,action,now=1000,data={})=>actParty(g,id,{action,turn:g.turn,...data},now);
 test(`${kind}: all players have the same stats and cannot enable removed powers`,()=>{const g=game();for(const id of g.players)for(const command of ['character','evade','skill','super'])assert.equal(action(g,id,command,1000,{character:'toast',superCharge:100}),false);assert.ok(g.snack.bodies.every(p=>p.character==='flan'&&p.hp===4));});
 test(`${kind}: repeated slaps need timing but never a hidden ammunition resource`,()=>{const g=game(),p=g.snack.bodies[0];for(const t of [1000,1520,2040,2560,3080]){tickParty(g,t);assert.equal(action(g,'a','attack',t),true);assert.equal(action(g,'a','attack',t+1),false);}assert.equal(p.ammo,3);assert.equal(action(g,'a','ammo',3100,{ammo:999}),false);});
 test(`${kind}: retreat heals automatically and carrying prevents free regeneration`,()=>{const g=game(),p=g.snack.bodies[0];p.hp=2;tickParty(g,5520);assert.equal(p.hp,3);tickParty(g,6840);assert.equal(p.hp,4);tickParty(g,14000);assert.equal(p.hp,4);p.hp=2;g.snack.box={x:450,y:300,carrier:'a',availableAt:0,panicAt:30000};Object.assign(p,{x:450,y:300});tickParty(g,19000);assert.equal(p.hp,2);});
 test(`${kind}: a slap drops the objective without waiting for a knockout`,()=>{const g=game();Object.assign(g.snack.bodies[0],{x:400,y:300,shieldUntil:0});Object.assign(g.snack.bodies[1],{x:480,y:300,shieldUntil:0});g.snack.box={x:480,y:300,carrier:'b',availableAt:0};action(g,'a','attack');tickParty(g,1200);assert.equal(g.snack.box.carrier,null);assert.equal(g.snack.bodies[1].hp,3);assert.equal(g.snack.bodies[1].respawnAt,0);});
}
