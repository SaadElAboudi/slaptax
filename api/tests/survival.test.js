const test=require('node:test'),assert=require('node:assert/strict');
const {createParty,beginParty,actParty,tickParty,publicParty,pauseParty}=require('../games/partyGames');
const {pointAt,total}=require('../games/survivalGames');
const {createSurvivalRooms}=require('../games/survivalRooms');
function game(id,ids=['a']){const g=createParty(id,ids,(a)=>a);beginParty(g,1000);return g;}
test('race uses server time, releases, heartbeat expiry and three distinct red faults',()=>{
 const g=game('stopgo',['a','b','c','d']);let seq=0;
 assert.equal(actParty(g,'a',{action:'hold',holding:true,seq:seq++,turn:g.turn},1000),true);
 tickParty(g,2000);assert.ok(Math.abs(g.survival.players.a.progress-400/10000)<.00001);
 assert.equal(actParty(g,'intruder',{action:'hold',holding:true,seq:99,turn:g.turn},2000),false);
 assert.equal(actParty(g,'a',{action:'hold',holding:true,seq:0,turn:g.turn},2000),false);
 for(let now=2100;now<22000;now+=100){actParty(g,'b',{action:'hold',holding:true,seq:seq++,turn:g.turn},now);tickParty(g,now);if(g.survival.players.b.out)break;}
 assert.equal(g.survival.players.b.faults,3);assert.equal(g.survival.players.b.out,true);
 assert.equal(g.survival.players.a.faults,0);const state=publicParty(g,'a',22000);assert.equal(state.survival.players.b.out,true);assert.equal('signalAt' in state.survival,false);
});
test('race can be completed by holding on green and releasing on warning',()=>{
 const g=game('stopgo');let seq=0;for(let now=1000;now<29000;now+=50){tickParty(g,now);if(g.phase!=='survival')break;actParty(g,'a',{turn:g.turn,action:'hold',holding:g.survival.signal==='go',seq:seq++},now);}tickParty(g,29000);assert.equal(g.survival.players.a.progress,1);assert.equal(g.survival.players.a.faults,0);assert.equal(g.phase,'done');assert.equal(g.scores.a,1000);
});
test('ordered outline accepts a human-speed trace, rejects shortcuts, malformed packets and repeated sequences',()=>{
 const g=game('fragile',['a','b']);let seq=0;for(let d=0;d<=total+.01;d+=.012){const now=1000+Math.round(d/0.45*1000);const points=[pointAt(d)];assert.equal(actParty(g,'a',{action:'trace',points,seq:seq++,turn:g.turn},now),true);if(g.survival.players.a.finishedAt)break;}
 assert.equal(g.survival.players.a.progress,1);assert.equal(g.survival.players.a.faults,0);
 assert.equal(actParty(g,'b',{action:'trace',points:[[NaN,.2]],seq:0,turn:g.turn},10000),false);
 for(let i=0;i<3;i++)actParty(g,'b',{action:'trace',points:[[.5,.8]],seq:i,turn:g.turn},11000+i*500);
 assert.equal(g.survival.players.b.out,true);assert.equal(g.phase,'done');assert.equal(g.scores.a,1000);assert.equal(g.scores.b,0);
});
test('pause shifts the authoritative clock and drops held inputs',()=>{const g=game('stopgo');actParty(g,'a',{action:'hold',holding:true,seq:1,turn:g.turn},1100);pauseParty(g,5000,6100);assert.equal(g.deadline,34000);assert.equal(g.survival.signalAt,7800);assert.equal(g.survival.players.a.holding,false);});
function fixture(t){let now=1000;t.mock.method(Date,'now',()=>now);const store={read:()=>({users:['a','b','c','d','e'].map(id=>({id,playerName:id}))})};const manager=createSurvivalRooms(store,(c,e)=>c.events.push(e));t.after(()=>manager.close());const clients=Object.fromEntries(['a','b','c','d','e'].map(userId=>{const c={userId,readyState:1,events:[]};manager.attach(c);return[userId,c];}));const send=(id,type,data={})=>manager.handle(clients[id],{type:'survival.'+type,...data});send('a','create');const r=[...manager.rooms.values()][0];for(const id of ['b','c','d'])send(id,'join',{code:r.code});return{manager,clients,r,send,time:n=>{now=n;manager.tick(n);},start(){for(const id of ['a','b','c','d'])send(id,'ready');send('a','start');now=3300;manager.tick(now);}};}
test('four real ready players required; explicit qualifiers, spectator protection, final and unanimous rematch',t=>{
 const x=fixture(t),r=x.r;x.send('a','start');assert.equal(r.phase,'lobby');x.start();assert.equal(r.game.id,'stopgo');assert.equal(r.game.players.length,4);
 // Simulate authoritative engine completion to isolate room transitions from engine mechanics tested above.
 for(const[id,i]of [['a',0],['b',1],['c',2]]){r.game.survival.players[id].finishedAt=4000+i*300;r.game.survival.players[id].progress=1;}r.game.phase='done';x.time(4500);
 assert.deepEqual(r.activeIds,['a','b','c']);assert.equal(r.stage,1);assert.equal(r.phase,'intermission');x.send('d','next');assert.equal(r.votes.length,0);
 for(const id of r.activeIds)x.send(id,'next');x.time(6800);assert.equal(r.game.id,'fragile');assert.equal(r.game.players.length,3);
 x.send('d','action',{round:r.round,turn:r.game.turn,action:'trace',points:[[.5,.8]],seq:1});assert.equal(r.game.survival.players.d,undefined);
 r.game.survival.players.a.finishedAt=7000;r.game.survival.players.b.finishedAt=7300;r.game.phase='done';x.time(8000);assert.deepEqual(r.activeIds,['a','b']);x.send('a','next');x.send('b','next');x.time(10300);assert.equal(r.game.id,'table');assert.equal(r.game.table.bodies.length,2);assert.ok(r.game.table.bodies.every(p=>!p.bot));
 r.game.phase='done';r.game.winnerId='b';x.time(10400);assert.equal(r.phase,'done');assert.equal(r.winnerId,'b');assert.equal(r.players.length,4);assert.equal(r.results.length,3);for(const id of ['a','b','c'])x.send(id,'rematch');assert.equal(r.phase,'done');x.send('d','rematch');assert.equal(r.phase,'countdown');assert.equal(r.stage,0);assert.equal(r.results.length,0);assert.equal(r.activeIds.length,4);
});
test('ties advance together; four-player table contains no bots, tied final is replayed',t=>{const x=fixture(t);x.start();const r=x.r;for(const p of Object.values(r.game.survival.players))p.finishedAt=4000;r.game.phase='done';x.time(4500);assert.equal(r.activeIds.length,4);for(const id of r.activeIds)x.send(id,'next');x.time(6800);for(const p of Object.values(r.game.survival.players))p.finishedAt=7000;r.game.phase='done';x.time(7500);for(const id of r.activeIds)x.send(id,'next');x.time(9800);assert.equal(r.game.table.bodies.length,4);assert.ok(r.game.table.bodies.every(p=>!p.bot));r.game.phase='draw';r.game.winnerId=null;x.time(10000);assert.equal(r.phase,'intermission');assert.equal(r.stage,2);assert.equal(r.activeIds.length,4);});
test('disconnect pauses active players, reconnect resumes fairly, timeout awards nobody',t=>{const x=fixture(t);x.start();const deadline=x.r.game.deadline;x.time(4000);x.manager.detach(x.clients.d);x.time(4050);assert.equal(x.r.phase,'paused');x.time(5000);x.manager.attach(x.clients.d);x.send('d','join',{code:x.r.code});x.time(5000);x.time(7300);assert.equal(x.r.phase,'playing');assert.equal(x.r.game.deadline,deadline+3250);x.manager.detach(x.clients.d);x.time(7400);x.time(27400);assert.equal(x.r.phase,'done');assert.equal(x.r.reason,'disconnect');assert.equal(x.r.winnerId,null);});
test('spectator disconnect does not pause, stale-round actions rejected and leave clears results',t=>{const x=fixture(t);x.start();x.r.activeIds=['a','b'];x.r.game=createParty('fragile',['a','b']);beginParty(x.r.game,3300);x.manager.detach(x.clients.d);x.time(4000);assert.equal(x.r.phase,'playing');x.send('a','action',{round:x.r.round-1,turn:x.r.game.turn,seq:1,action:'trace',points:[[.5,.8]]});assert.equal(x.r.game.survival.players.a.faults,0);x.send('b','leave');assert.equal(x.r.phase,'lobby');assert.equal(x.r.results.length,0);});
test('zero finishers produces no random winner; duplicate tabs count once',t=>{const x=fixture(t);const tab={userId:'a',readyState:1,events:[]};x.manager.attach(tab);x.manager.handle(tab,{type:'survival.join',code:x.r.code});assert.equal(x.r.players.length,4);x.manager.detach(tab);x.start();x.time(31300);assert.equal(x.r.phase,'done');assert.equal(x.r.winnerId,null);assert.equal(x.r.activeIds.length,0);});

test('public state is safe before a practice countdown starts',()=>{const g=createParty('fragile',['a']);assert.equal(publicParty(g,'a',1000).survival,undefined);});
test('race remains finishable with shortest greens, longest reds and 250ms human response',()=>{const g=createParty('stopgo',['a'],(min,max)=>min===1800?min:max-1);beginParty(g,1000);let seq=0,display='go',reactionAt=1000,desired=true;for(let now=1000;now<=29000;now+=50){tickParty(g,now);if(g.phase!=='survival')break;if(display!==g.survival.signal){display=g.survival.signal;reactionAt=now+250;}if(now>=reactionAt)desired=display==='go';actParty(g,'a',{action:'hold',holding:desired,turn:g.turn,seq:seq++},now);}assert.equal(g.survival.players.a.progress,1);assert.equal(g.survival.players.a.faults,0);});

test('creating again reattaches an existing lobby identity without expiring its seat',t=>{const x=fixture(t);x.manager.detach(x.clients.a);x.time(10000);x.manager.attach(x.clients.a);x.send('a','create');x.time(22000);assert.ok(x.r.players.some(p=>p.id==='a'));assert.equal(x.r.players.length,4);});
