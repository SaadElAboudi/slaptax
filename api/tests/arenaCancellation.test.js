const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {randomUUID}=require('node:crypto');
const {makeDefaultState}=require('../infrastructure/db');
const {createService}=require('../application/service');
const {createSharedArenaManager}=require('../games/sharedArena');
function setup(t){let now=10000,db=makeDefaultState();t.mock.method(Date,'now',()=>now);
 const store={read:()=>structuredClone(db),write:value=>{db=structuredClone(value);},flush:async()=>{}};
 const service=createService(store),users=['EntryA','EntryB'].map(name=>{const clientId=randomUUID();return {...service.joinSession(name,clientId),clientId};});
 const {duel}=service.createDuel(users[0].userId,users[1].userId,5,null,1);let state=store.read(),d=state.duels.find(d=>d.id===duel.id);d.veto=null;store.write(state);
 for(const u of users)service.setDuelReady(duel.id,u.userId,true);assert.equal(service.startLiveDuel(duel.id,users[0].userId).ok,true);
 state=store.read();state.duels.find(d=>d.id===duel.id).games=['snack'];store.write(state);
 const manager=createSharedArenaManager(store,service);t.after(()=>manager.close());
 const connect=i=>{const c=new EventEmitter();Object.assign(c,{userId:users[i].userId,readyState:1,bufferedAmount:0,send:()=>{}});manager.attach(c);c.emit('message',JSON.stringify({type:'arena.join',duelId:duel.id,round:1}));return c;};
 const tick=async ms=>{now+=ms;await new Promise(r=>setTimeout(r,75));};
 const verify=()=>{const d=store.read().duels.find(d=>d.id===duel.id);assert.equal(d.status,'cancelled');assert.equal(d.winnerId,null);assert.equal(d.rounds.length,0);assert.equal(d.tokenEscrow.status,'refunded');for(const u of users){const state=service.getState(u.userId,u.clientId);assert.equal(state.wallet,25);assert.equal(state.progression.winStreak,0);}assert.equal(manager.sessions.get(`${duel.id}:1`).winnerId,null);};
 return {manager,store,service,users,duel,connect,tick,verify};
}
for(const started of [false,true])test(`technical disconnect ${started?'during play':'before both players enter'} refunds instead of inventing a win`,async t=>{
 const f=setup(t),a=f.connect(0);if(started){f.connect(1);await f.tick(2300);assert.equal(f.manager.sessions.get(`${f.duel.id}:1`).phase,'playing');}
 a.emit('close');await f.tick(21000);f.verify();a.emit('message',JSON.stringify({type:'arena.forfeit'}));assert.equal(f.manager.sessions.get(`${f.duel.id}:1`).phase,'cancelled');await f.tick(1000);f.verify();assert.equal(f.service.cancelInterruptedDuel(f.duel.id).ignored,true);f.verify();
});
test('two disconnected players never create a winner',async t=>{const f=setup(t),a=f.connect(0),b=f.connect(1);await f.tick(2300);a.emit('close');b.emit('close');await f.tick(21000);f.verify();});
test('explicit exit before countdown finishes refunds without a scored round',async t=>{const f=setup(t),a=f.connect(0);f.connect(1);a.emit('message',JSON.stringify({type:'arena.forfeit'}));await f.tick(10);f.verify();});
test('a player who never enters causes a bounded entry cancellation and refund',async t=>{const f=setup(t);f.connect(0);await f.tick(91000);f.verify();});
