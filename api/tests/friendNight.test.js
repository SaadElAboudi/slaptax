const test=require('node:test'),assert=require('node:assert/strict');
const {createSnackTeams}=require('../games/snackTeams');
function fixture(t){
 let now=1000;t.mock.method(Date,'now',()=>now);
 let db={users:['a','b','c','d','e'].map(id=>({id,playerName:id}))};
 const manager=createSnackTeams({read:()=>structuredClone(db),write:v=>{db=structuredClone(v);}},(c,e)=>c.events.push(e));
 t.after(()=>manager.close());
 const clients=Object.fromEntries(['a','b','c','d','e'].map(userId=>{const c={userId,readyState:1,events:[]};manager.attach(c);return[userId,c];}));
 const send=(id,type,data={})=>manager.handle(clients[id],{type:'snack.team.'+type,...data});
 send('a','create',{mode:'night'});const room=[...manager.rooms.values()][0];
 for(const id of ['b','c','d'])send(id,'join',{code:room.code});
 return {manager,clients,send,room,db:()=>db,time:n=>{now=n;manager.tick(now);},ready:()=>{for(const id of ['a','b','c','d'])send(id,'ready');},next:()=>{for(const id of ['a','b','c','d'])send(id,'next');}};
}
test('night requires four explicit ready players and protects its shared playlist',t=>{
 const x=fixture(t);x.send('a','start');assert.equal(x.room.phase,'lobby');x.ready();x.send('b','start');assert.equal(x.room.phase,'lobby');x.send('a','start');x.time(3300);
 assert.equal(x.room.mode,'night');assert.equal(x.room.groups.length,1);assert.equal(x.room.game.id,'snack');assert.equal(x.room.game.players.length,4);
 assert.equal(x.db().productEvents.filter(e=>e.type==='night_started').length,4);
});
test('three rounds keep four friends, rotate opponents, score draws once, then reset by unanimous rematch',t=>{
 const x=fixture(t),r=x.room;x.ready();x.send('a','start');x.time(3300);x.time(93400);
 assert.equal(r.phase,'intermission');assert.equal(r.results.length,1);assert.deepEqual(r.scores,{a:1,b:1,c:1,d:1});
 x.time(94000);assert.equal(r.results.length,1);x.send('e','next');x.send('a','next');x.send('a','next');assert.equal(r.votes.length,1);
 x.next();x.time(96300);assert.equal(r.stage,1);assert.deepEqual(r.groups.map(g=>g.players),[['a','b'],['c','d']]);
 const event=x.clients.d.events.at(-1);assert.deepEqual(Object.keys(event.party.scores),['c','d']);assert.equal(event.party.id,'pie');
 x.time(118400);assert.equal(r.phase,'intermission');assert.equal(r.results.length,2);assert.deepEqual(r.scores,{a:2,b:2,c:2,d:2});
 x.next();x.time(120700);assert.equal(r.stage,2);assert.deepEqual(r.groups.map(g=>g.players),[['a','d'],['b','c']]);
 x.send('a','action',{round:r.round-1,turn:r.groups[0].turn,action:'bank'});assert.equal(r.groups[0].runs.a.status,'playing');
 x.time(150800);assert.equal(r.phase,'done');assert.equal(r.results.length,3);assert.deepEqual(r.scores,{a:3,b:3,c:3,d:3});
 assert.equal(x.db().productEvents.filter(e=>e.type==='night_completed').length,4);assert.equal(x.db().productEvents.filter(e=>e.type==='night_round_completed').length,12);
 for(const id of ['a','b','c'])x.send(id,'rematch');assert.equal(r.phase,'done');x.send('d','rematch');assert.equal(r.phase,'countdown');assert.equal(r.stage,0);assert.deepEqual(r.scores,{a:0,b:0,c:0,d:0});assert.equal(r.results.length,0);assert.equal(x.db().productEvents.filter(e=>e.type==='night_started').length,8);
});
test('team victory awards both teammates and duel victory awards only its winner',t=>{
 const x=fixture(t),r=x.room;x.ready();x.send('a','start');x.time(3300);
 r.game.snack.bodies[0].captures=3;r.game.deadline=3400;x.time(3400);assert.equal(r.phase,'intermission');assert.deepEqual(r.scores,{a:3,b:0,c:3,d:0});
 x.next();x.time(5700);r.groups[0].carnival.bodies[0].score=200;x.time(27800);
 assert.deepEqual(r.results[1].points,{a:3,b:0,c:1,d:1});assert.deepEqual(r.scores,{a:6,b:0,c:4,d:1});
});
test('a finished pair waits for the other pair, and disconnect pauses every unfinished game',t=>{
 const x=fixture(t),r=x.room;x.ready();x.send('a','start');x.time(3300);x.time(93400);x.next();x.time(95700);
 r.groups[0].phase='done';r.groups[0].winnerId='a';x.time(96000);assert.equal(r.phase,'playing');assert.equal(r.results.length,1);
 const deadline=r.groups[1].deadline;x.manager.detach(x.clients.d);assert.equal(r.phase,'paused');x.time(98000);x.manager.attach(x.clients.d);x.send('d','join',{code:r.code});x.time(98000);x.time(100300);
 assert.equal(r.phase,'playing');assert.equal(r.groups[1].deadline,deadline+4300);assert.equal(r.groups[0].phase,'done');
});
test('interrupted nights award no unfinished points and leaving resets the lobby scoreboard',t=>{
 const x=fixture(t),r=x.room;x.ready();x.send('a','start');x.time(3300);x.manager.detach(x.clients.d);x.time(24000);
 assert.equal(r.phase,'done');assert.equal(r.reason,'disconnect');assert.equal(r.results.length,0);assert.deepEqual(r.scores,{a:0,b:0,c:0,d:0});
 x.send('a','leave');assert.equal(r.phase,'lobby');assert.equal(r.groups.length,0);assert.equal(r.results.length,0);assert.equal(r.players.length,3);
});
