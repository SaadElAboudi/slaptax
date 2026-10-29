import test from 'node:test';
import assert from 'node:assert/strict';
import {gameFeedback} from '../src/gameplay/gameFeedback.ts';
import type {PartyState} from '../src/gameplay/party.ts';
function state(id:string,extra:object={}){return {id,turn:1,runs:{},...extra} as unknown as PartyState;}
test('rival scores and replay resets cannot create a personal reward cue',()=>{
 const a=state('pie',{carnival:{bodies:[{id:'me',score:0},{id:'rival',score:0}]}}),b=structuredClone(a);b.carnival!.bodies[1].score=100;assert.equal(gameFeedback(a,b,'me'),null);b.carnival!.bodies[0].score=200;b.turn++;assert.equal(gameFeedback(a,b,'me'),null);
});
test('pie feedback shows the exact server delta rather than invented bonus points',()=>{const a=state('pie',{carnival:{bodies:[{id:'me',score:100,hits:1,combo:1}]}}),b=structuredClone(a);b.carnival!.bodies[0].score=325;b.carnival!.bodies[0].combo=2;assert.equal(gameFeedback(a,b,'me')?.value,'+225');});
test('a successful defensive move has feedback even without scoring',()=>{const a=state('pie',{carnival:{bodies:[{id:'me',score:0,dodges:0}]}}),b=structuredClone(a);b.carnival!.bodies[0].dodges=1;assert.equal(gameFeedback(a,b,'me')?.kind,'skill');});
test('delivering a royal chicken reports the real capture count',()=>{const a=state('chicken',{snack:{bodies:[{id:'me',captures:0,kos:0}]}}),b=structuredClone(a);b.snack!.bodies[0].captures=1;assert.equal(gameFeedback(a,b,'me')?.value,'1 / 3');});
test('interceptions reward skill without adding fabricated points',()=>{const a=state('snack',{snack:{bodies:[{id:'me',captures:0,kos:0,interceptions:0}]}}),b=structuredClone(a);b.snack!.bodies[0].interceptions=1;const cue=gameFeedback(a,b,'me');assert.equal(cue?.kind,'skill');assert.equal(cue?.value,undefined);});
test('toilet losses remain a warning and gold ducks use the actual loot delta',()=>{const a=state('toilet',{toilet:{bodies:[{id:'me',loot:1,flushes:0}],golden:true}}),b=structuredClone(a);b.toilet!.bodies[0].loot=4;assert.equal(gameFeedback(a,b,'me')?.value,'+3 🦆');b.toilet!.bodies[0].flushes=1;assert.equal(gameFeedback(a,b,'me')?.kind,'warning');});
test('stack perfects and lifeline saves use real run state',()=>{const a=state('onemore',{runs:{me:{level:1,perfects:0}}}),b=state('onemore',{runs:{me:{level:2,perfects:1}}});assert.match(gameFeedback(a,b,'me')!.fr,/Pile poil/);b.runs.me.rescues=1;assert.match(gameFeedback(a,b,'me')!.fr,/bouée/);});
test('balloon banking, pigeon defence, lift scores, table KOs and cuts have distinct feedback',()=>{
 for(const [id,extra,change]of[
 ['balloon',{carnival:{bodies:[{id:'me',score:0}]}},(b:PartyState)=>b.carnival!.bodies[0].score=100],
 ['pigeon',{absurd:{bodies:[{id:'me',score:0,blocks:0,ownGoals:0}]}},(b:PartyState)=>b.absurd!.bodies[0].blocks=1],
 ['lift',{absurd:{bodies:[{id:'me',score:0,blocks:0,ownGoals:0,pranks:0}]}},(b:PartyState)=>b.absurd!.bodies[0].score=80],
 ['table',{table:{bodies:[{id:'me',kos:0}]}},(b:PartyState)=>b.table!.bodies[0].kos=1],
 ['decoupe',{drawing:{history:[]}},(b:PartyState)=>b.drawing!.history.push({attempt:1,target:{},results:{me:{score:940}}})],
 ]as const){const a=state(id,extra),b=structuredClone(a);change(b);assert.ok(gameFeedback(a,b,'me'),id);}
});
test('pigeon precision and parry feedback requires personal server evidence',()=>{
 const a=state('pigeon',{absurd:{bodies:[{id:'me',score:0,blocks:0,ownGoals:0,perfects:0,parries:0},{id:'rival',score:0,perfects:0,parries:0}]}}),b=structuredClone(a);
 b.absurd!.bodies[1].perfects=1;assert.equal(gameFeedback(a,b,'me'),null);
 b.absurd!.bodies[0].perfects=1;b.absurd!.bodies[0].score=180;assert.equal(gameFeedback(a,b,'me')?.value,'+180');
 b.absurd!.bodies[0].parries=1;assert.match(gameFeedback(a,b,'me')!.fr,/Parade/);
});
test('tower repair feedback follows the real personal counter without adding score',()=>{
 const a=state('onemore',{runs:{me:{level:4,repairs:0}}}),b=state('onemore',{runs:{me:{level:4,repairs:1}}});assert.equal(gameFeedback(a,b,'me')?.kind,'skill');assert.equal(gameFeedback(a,b,'me')?.value,undefined);
});

test('cut feedback reports the actual portion rather than converting accuracy into portion size',()=>{
 const a=state('decoupe',{drawing:{history:[]}}),b=state('decoupe',{drawing:{history:[{attempt:1,target:{percent:71},results:{me:{percent:50,error:21,score:790}}}]}});const cue=gameFeedback(a,b,'me');assert.equal(cue?.value,'50 %');assert.equal(cue?.fr,'Portion servie !');b.drawing!.history[0].results.me.error=1;assert.equal(gameFeedback(a,b,'me')?.fr,'Coupe de chef !');
});
