const test=require('node:test'),assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {once}=require('node:events');
const {WebSocket}=require('ws');
const {createService}=require('../application/service');
const {createServer}=require('../server');
const {makeDefaultState}=require('../infrastructure/db');
function fixture(){let data=makeDefaultState(),flushed=0;const store={kind:'test',ready:Promise.resolve(),read:()=>structuredClone(data),write:v=>{data=structuredClone(v);},flush:async()=>{flushed++;},close:async()=>{}};const service=createService(store);const join=name=>{const clientId=randomUUID(),u=service.joinSession(name,clientId);return {userId:u.userId,clientId};};return {store,service,a:join('Alpha'),b:join('Beta'),flushed:()=>flushed};}

test('account deletion requires its own session and explicit confirmation',async()=>{const f=fixture();assert.equal((await f.service.deleteAccount({...f.a,clientId:f.b.clientId,confirm:true})).code,403);assert.equal((await f.service.deleteAccount(f.a)).code,400);assert.equal(f.service.authenticateSession(f.a.userId,f.a.clientId),true);});
test('deletion removes private data and sessions, anonymizes shared history and refunds affected live duels once',async()=>{
 const f=fixture(),db=f.store.read();db.duels=[{id:'live',status:'playing',challengerId:f.a.userId,opponentId:f.b.userId,stake:2}];
 const b=db.users.find(u=>u.id===f.b.userId);b.wallet=23;b.favoriteRivalId=f.a.userId;b.history=[{opponentId:f.a.userId,opponentName:'Alpha',net:-2},{opponentId:f.a.userId,opponentName:'OldAlias',net:2}];db.users.find(u=>u.id===f.a.userId).playerName='CurrentAlias';b.linkHistory=[{id:`c:vs:${f.a.userId}`,opponentName:'Alpha'}];
 db.linkChallenges=[{id:'owned',hostId:f.a.userId,attempts:{}},{id:'friend',hostId:f.b.userId,attempts:{[f.a.userId]:{score:2}}}];db.productEvents=[{userId:f.a.userId}];db.clientSessions['another-private-installation']=f.a.userId;db.playerReports=[{targetId:f.a.userId,reporterId:f.b.userId}];f.store.write(db);
 assert.deepEqual(await f.service.deleteAccount({...f.a,confirm:true}),{ok:true});const after=f.store.read(),survivor=after.users.find(u=>u.id===f.b.userId);
 assert.equal(after.users.some(u=>u.id===f.a.userId),false);assert.equal(survivor.wallet,25);assert.equal(survivor.favoriteRivalId,null);assert.equal(survivor.history[0].opponentName,'Joueur supprimé');
 for(const secret of [f.a.userId,f.a.clientId,'Alpha','OldAlias','CurrentAlias','another-private-installation'])assert.equal(JSON.stringify(after).includes(secret),false);
 assert.equal(after.linkChallenges[0].id,'friend');assert.equal(f.flushed(),1);assert.equal((await f.service.deleteAccount({...f.a,confirm:true})).code,403);assert.equal(f.store.read().users.find(u=>u.id===f.b.userId).wallet,25);
 assert.equal(f.service.authenticateSession(f.a.userId,f.a.clientId),false);
});
test('deletion does not acknowledge a failed durable flush',async()=>{const f=fixture();f.store.flush=async()=>{throw new Error('persistence unavailable');};await assert.rejects(()=>f.service.deleteAccount({...f.a,confirm:true}),/persistence unavailable/);});
test('reporting is stored, rate-limited, private and blocks future direct and quick-match duels',()=>{
 const f=fixture();const body={...f.a,targetId:f.b.userId};assert.equal(f.service.playerSafety({...body,action:'report',reason:'name'}).ok,true);assert.equal(f.store.read().playerReports.length,1);
 assert.equal(f.service.playerSafety({...body,clientId:f.b.clientId,action:'block'}).code,403);
 assert.equal(f.service.playerSafety({...body,action:'block'}).ok,true);assert.equal(f.service.createDuel(f.a.userId,f.b.userId,2).code,403);assert.equal(f.service.createDuel(f.b.userId,f.a.userId,2).code,403);
 assert.equal(f.service.joinMatchmaking(f.a.userId,2,'pie').status,'waiting');assert.equal(f.service.joinMatchmaking(f.b.userId,2,'pie').status,'waiting');
 for(let i=0;i<4;i++)assert.equal(f.service.playerSafety({...body,action:'report',reason:'other'}).ok,true);assert.equal(f.service.playerSafety({...body,action:'report',reason:'other'}).code,429);
});
test('store HTTP protects profiles, disables demo endpoints, supports CORS and revokes active native sockets on deletion',async t=>{
 const f=fixture(),server=createServer({store:f.store,storeDistribution:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{for(const c of server.realtime.wss.clients)c.terminate();await new Promise(r=>server.close(r));});
 const base=`http://127.0.0.1:${server.address().port}`,headers={'Content-Type':'application/json','X-SlapTax-User':f.a.userId,'X-SlapTax-Client':f.a.clientId};
 const post=(path,body,extra=headers)=>fetch(`${base}${path}`,{method:'POST',headers:extra,body:JSON.stringify(body)});
 assert.equal((await fetch(`${base}/api/health`).then(r=>r.json())).distribution,'store');
 assert.equal((await post('/api/reset',{},{})).status,403);assert.equal((await fetch(`${base}/api/state`)).status,401);
 assert.equal((await fetch(`${base}/api/state?userId=${f.b.userId}`,{headers})).status,403);
 const self=await fetch(`${base}/api/state`,{headers}).then(r=>r.json());assert.equal(self.activeUserId,f.a.userId);
 assert.equal((await post('/api/stake',{userId:f.b.userId,stake:2})).status,403);
 const preflight=await fetch(`${base}/api/account/delete`,{method:'OPTIONS',headers:{Origin:'capacitor://localhost'}});assert.match(preflight.headers.get('access-control-allow-headers'),/X-SlapTax-Client/);
 const ws=new WebSocket(`${base.replace('http','ws')}/api/realtime?userId=${f.a.userId}&clientId=${f.a.clientId}`);await once(ws,'open');const closed=once(ws,'close');
 assert.equal((await post('/api/account/delete',{...f.a,confirm:true})).status,200);await closed;
 assert.equal((await fetch(`${base}/api/state`,{headers})).status,401);
});
test('store distribution filters obvious abusive names before profile creation',async t=>{
 const f=fixture(),server=createServer({store:f.store,storeDistribution:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const response=await fetch(`http://127.0.0.1:${server.address().port}/api/session/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId:randomUUID(),playerName:'connard'})});assert.equal(response.status,400);
});
test('moderation resolution requires admin access, suspends future access and keeps deletion available',async t=>{
 const f=fixture(),token='native-moderation-test-admin-token-123456';f.service.playerSafety({...f.a,targetId:f.b.userId,action:'report',reason:'harassment'});const report=f.store.read().playerReports[0];
 const server=createServer({store:f.store,storeDistribution:true,adminToken:token});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(`${base}/api/admin/player-reports`)).status,401);
 const url=`${base}/api/admin/player-reports/${report.id}/resolve`,data=JSON.stringify({action:'suspend'});
 assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:data})).status,401);
 assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:data})).status,200);
 assert.equal(f.service.listUsers(f.a.userId,f.a.clientId).users.some(u=>u.id===f.b.userId),false);
 assert.equal(f.service.authenticateSession(f.b.userId,f.b.clientId),false);assert.equal(f.service.joinSession('Beta',f.b.clientId).code,403);assert.equal(f.service.createDuel(f.a.userId,f.b.userId,2).code,403);
 const deleted=await fetch(`${base}/api/account/delete`,{method:'POST',headers:{'Content-Type':'application/json','X-SlapTax-User':f.b.userId,'X-SlapTax-Client':f.b.clientId},body:JSON.stringify({...f.b,confirm:true})});assert.equal(deleted.status,200);
});
