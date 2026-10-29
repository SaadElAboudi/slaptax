const test=require('node:test'),assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const tokens=require('../domain/tokens');
const {createService}=require('../application/service');
const {createServer}=require('../server');
const {makeDefaultState}=require('../infrastructure/db');
const {getStats}=require('../domain/stats');
function fixture(){let data=makeDefaultState();const store={ready:Promise.resolve(),read:()=>structuredClone(data),write:d=>{data=structuredClone(d);},flush:async()=>{},close:async()=>{}};let service=createService(store);const users=['Alpha','Bravo'].map(name=>{const clientId=randomUUID();return {...service.joinSession(name,clientId),clientId};});return {store,service,users};}
function live(f,stake=5){const [a,b]=f.users;const {duel}=f.service.createDuel(a.userId,b.userId,stake,null,1);const db=f.store.read();db.duels.find(d=>d.id===duel.id).veto=null;f.store.write(db);for(const u of f.users)f.service.setDuelReady(duel.id,u.userId,true);assert.equal(f.service.startLiveDuel(duel.id,a.userId).ok,true);return duel.id;}

test('old balances are preserved and ledger rejects tampering, negative balances and fractional precision',()=>{
 const u={wallet:17.25};tokens.account(u);assert.equal(u.wallet,17.25);tokens.post(u,2,'one','daily');assert.equal(u.wallet,19.25);assert.equal(tokens.post(u,2,'one','daily').applied,false);
 assert.throws(()=>tokens.post(u,3,'one','daily'),/Conflicting/);assert.throws(()=>tokens.post(u,.001,'bad','daily'),/precision/);assert.throws(()=>tokens.post(u,-100,'bad','stake'),/Insufficient/);
 u.wallet++;assert.throws(()=>tokens.account(u),/does not match/);
});
test('daily reward is once per UTC day across reloads and clock rollback never duplicates it',()=>{
 const u={id:'u',wallet:25},db={duels:[]},before=Date.parse('2026-10-28T23:59:59Z'),after=before+1000;
 assert.equal(tokens.claim(u,db,'daily',before).amount,10);assert.equal(tokens.claim(u,db,'daily',before).claimed,false);
 assert.equal(tokens.claim(u,db,'daily',after).amount,10);assert.equal(tokens.claim(u,db,'daily',before).claimed,false);assert.equal(u.wallet,45);
});
test('rescue is limited, excludes escrow and never automatically credits losses',()=>{
 const u={id:'a',wallet:1},db={duels:[{id:'d',status:'playing',challengerId:'a',opponentId:'b',stake:5}]},now=Date.parse('2026-10-28T12:00:00Z');
 assert.equal(tokens.claim(u,db,'rescue',now).claimed,false);db.duels=[];
 assert.equal(tokens.claim(u,db,'rescue',now).amount,10);tokens.post(u,-10,'loss','stake');assert.equal(tokens.claim(u,db,'rescue',now).claimed,false);assert.equal(u.wallet,1);
});
test('reservation, payout and refund conserve tokens except the advertised fee and cannot repeat',()=>{
 for(const stake of tokens.policy.stakes){const db={users:[{id:'a',wallet:25},{id:'b',wallet:25}]},duel={id:randomUUID(),challengerId:'a',opponentId:'b',stake};
  assert.equal(tokens.reserve(db,duel),true);assert.equal(tokens.reserve(db,duel),true);const q=tokens.quote(stake);
  assert.equal(tokens.settle(db,duel,'a'),true);assert.equal(tokens.settle(db,duel,'a'),false);assert.equal(tokens.refund(db,duel),false);
  assert.equal(Math.round(db.users.reduce((n,u)=>n+u.wallet,0)*100),5000-tokens.minor(q.fee));for(const u of db.users)tokens.account(u);
 }
 const db={users:[{id:'a',wallet:25},{id:'b',wallet:25}]},d={id:'refund',challengerId:'a',opponentId:'b',stake:5};tokens.reserve(db,d);assert.equal(tokens.refund(db,d),true);assert.equal(tokens.refund(db,d),false);assert.deepEqual(db.users.map(u=>u.wallet),[25,25]);
});
test('insufficient funds do not partially debit either player',()=>{
 const db={users:[{id:'a',wallet:25},{id:'b',wallet:1}]},d={id:'short',challengerId:'a',opponentId:'b',stake:5};assert.equal(tokens.reserve(db,d),false);assert.deepEqual(db.users.map(u=>u.wallet),[25,1]);
});
test('practice rewards are bounded and duplicate runs do not consume another reward',()=>{
 const u={id:'a',wallet:25};for(let i=0;i<20;i++)tokens.practiceReward(u,'run-'+i,Date.parse('2026-10-28T12:00Z'));assert.equal(u.wallet,31);assert.equal(u.tokenAccount.claims.practiceCount,3);
 assert.equal(tokens.practiceReward(u,'run-0',Date.parse('2026-10-29T12:00Z')),0);assert.equal(tokens.practiceReward(u,'next',Date.parse('2026-10-29T12:00Z')),2);
});
test('live settlement uses the full advertised payout, one mastery play, and match-only rank/streak',()=>{
 const f=fixture(),id=live(f),[a,b]=f.users;let db=f.store.read();db.users.find(u=>u.id===a.userId).history=[{result:'WIN',net:9999,date:new Date().toISOString()}];f.store.write(db);
 assert.equal(f.service.resolveAuthoritativeDuelRound(id,1,a.userId,{reason:'pie-fight',duration:22000}).ok,true);
 const result=f.service.getLiveDuel(id,a.userId).match,own=f.service.getState(a.userId,a.clientId),other=f.service.getState(b.userId,b.clientId);
 assert.equal(own.wallet,28.5);assert.equal(other.wallet,20);assert.equal(result.tokenSettlement.payout,8.5);assert.equal(result.tokenSettlement.net,3.5);assert.equal(own.progression.mastery[result.games[0]].plays,1);assert.equal(own.progression.winStreak,1);assert.equal(own.progression.rankedPoints,42);
 assert.equal(f.service.resolveAuthoritativeDuelRound(id,1,a.userId,{}).code,409);assert.equal(f.service.getState(a.userId,a.clientId).wallet,28.5);
});
test('restart recovery refunds escrow exactly once and never invents a winner',()=>{
 const f=fixture(),id=live(f);assert.equal(f.service.recoverInterruptedDuels(),1);assert.equal(f.service.recoverInterruptedDuels(),0);
 assert.deepEqual(f.users.map(u=>f.service.getState(u.userId,u.clientId).wallet),[25,25]);assert.equal(f.service.getLiveDuel(id,f.users[0].userId).match.status,'cancelled');
});
test('a stranded active round expires with a refund while a recent round remains active',()=>{
 const f=fixture(),id=live(f),d=f.store.read().duels.find(d=>d.id===id),start=Date.parse(d.roundStartedAt);
 assert.equal(f.service.expireStalledDuels(start+1000),0);assert.equal(f.service.expireStalledDuels(start+21*60000),1);assert.equal(f.service.getState(f.users[0].userId,f.users[0].clientId).wallet,25);
});
test('credits and refunds cannot skew competitive win rates',()=>{assert.deepEqual(getStats([{result:'CREDIT'},{result:'REFUND'},{result:'WIN'},{result:'LOSS'}]),{matches:2,wins:1,losses:1,winRate:50});});
test('concurrent HTTP claims grant once, preserve balances after timeout retries and isolate accounts',async t=>{
 const f=fixture(),server=createServer({store:f.store,storeDistribution:true});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base=`http://127.0.0.1:${server.address().port}`,a=f.users[0],headers={'Content-Type':'application/json','X-SlapTax-User':a.userId,'X-SlapTax-Client':a.clientId};
 const claims=await Promise.all(Array.from({length:12},()=>fetch(base+'/api/tokens/claim',{method:'POST',headers,body:JSON.stringify({kind:'daily',amount:999999})}).then(r=>r.json())));
 assert.equal(claims.filter(c=>c.claimed).length,1);assert.equal(f.service.getState(a.userId,a.clientId).wallet,35);
 assert.equal((await fetch(base+'/api/tokens')).status,401);assert.equal((await fetch(base+'/api/tokens',{headers:{...headers,'X-SlapTax-Client':f.users[1].clientId}})).status,401);
 const wallet=await fetch(base+'/api/tokens',{headers}).then(r=>r.json());assert.equal(wallet.balance,35);assert.equal(wallet.journal.filter(e=>e.reason==='daily').length,1);
});
test('HTTP never acknowledges a claim whose durable flush failed, and a retry does not double grant',async t=>{
 const f=fixture(),server=createServer({store:f.store,storeDistribution:true});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const a=f.users[0],url=`http://127.0.0.1:${server.address().port}/api/tokens/claim`,headers={'Content-Type':'application/json','X-SlapTax-User':a.userId,'X-SlapTax-Client':a.clientId};
 f.store.flush=async()=>{throw Error('private database detail');};assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify({kind:'daily'})})).status,500);
 f.store.flush=async()=>{};const retry=await fetch(url,{method:'POST',headers,body:JSON.stringify({kind:'daily'})}).then(r=>r.json());assert.equal(retry.balance,35);assert.equal(retry.claimed,false);
});

test('restart cancels every child of interrupted tournaments and refunds legacy entries once',()=>{
 const f=fixture(),db=f.store.read(),a=f.users[0].userId;
 db.users.find(u=>u.id===a).wallet=20;
 db.tournaments=[{id:'old',userId:a,status:'playing',stake:5},{id:'cup',kind:'multiplayer',status:'playing',stake:0}];
 db.duels=[{id:'pending-cup',tournamentId:'cup',status:'pending',challengerId:a,opponentId:f.users[1].userId,stake:0}];f.store.write(db);
 assert.equal(f.service.recoverInterruptedDuels(),3);assert.equal(f.service.recoverInterruptedDuels(),0);
 const after=f.store.read();assert.equal(after.users.find(u=>u.id===a).wallet,25);assert.ok(after.tournaments.every(t=>t.status==='cancelled'));assert.equal(after.duels[0].status,'cancelled');
});

test('malformed JSON and oversized UTF-8 bodies never trigger a token grant',async t=>{
 const f=fixture(),server=createServer({store:f.store,storeDistribution:true});await server.ready;await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const a=f.users[0],url=`http://127.0.0.1:${server.address().port}/api/tokens/claim`,headers={'Content-Type':'application/json','X-SlapTax-User':a.userId,'X-SlapTax-Client':a.clientId};
 for(const body of ['null','[]','"daily"','{'])assert.equal((await fetch(url,{method:'POST',headers,body})).status,400);
 assert.equal((await fetch(url,{method:'POST',headers,body:JSON.stringify({kind:'daily',padding:'😄'.repeat(260000)})})).status,413);
 assert.equal(f.service.getState(a.userId,a.clientId).wallet,25);
});
