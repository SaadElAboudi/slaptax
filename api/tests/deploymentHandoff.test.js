const test=require('node:test'),assert=require('node:assert/strict');
const {WebSocket}=require('ws');
const {createServer}=require('../server');const {makeDefaultState}=require('../infrastructure/db');
function setup(){let resolve,reject,owns=false,reads=0,writes=0,db=makeDefaultState();const store={startup:Promise.resolve(),ready:new Promise((a,b)=>{resolve=a;reject=b;}),read:()=>{reads++;assert.equal(owns,true,'cache accessed before exclusive writer acquired');return structuredClone(db);},write:v=>{assert.equal(owns,true);writes++;db=structuredClone(v);},flush:async()=>{},close:async()=>{}};
 const server=createServer({store,storeDistribution:true});return {server,store,acquire:()=>{owns=true;resolve();},fail:()=>reject(Error('database unavailable')),counts:()=>({reads,writes}),db:()=>db};}
test('handoff exposes startup separately, rejects HTTP and sockets until exclusive ownership, then becomes ready',async()=>{
 const f=setup();await new Promise(r=>f.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${f.server.address().port}`;
 try{
  const start=await fetch(base+'/api/startup');assert.equal(start.status,200);assert.equal((await start.json()).ready,false);
  assert.equal((await fetch(base+'/api/health')).status,503);const join=await fetch(base+'/api/session/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({playerName:'Pending',clientId:'pending-client-1234567'})});assert.equal(join.status,503);assert.equal(join.headers.get('retry-after'),'3');
  const status=await new Promise((resolve,reject)=>{const ws=new WebSocket(base.replace('http','ws')+'/api/realtime');ws.on('error',()=>{});ws.on('open',()=>reject(Error('socket admitted during handoff')));ws.on('unexpected-response',(_req,res)=>{res.resume();ws.terminate();resolve(res.statusCode);});});assert.equal(status,503);assert.deepEqual(f.counts(),{reads:0,writes:0});
  f.acquire();await f.server.ready;assert.equal((await fetch(base+'/api/health')).status,200);assert.equal((await(await fetch(base+'/api/startup')).json()).ready,true);
 }finally{f.acquire();await f.server.ready;await new Promise(r=>f.server.close(r));}
});
test('startup failure never advertises readiness and never admits a mutation',async()=>{
 const f=setup();await new Promise(r=>f.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${f.server.address().port}`;
 f.fail();await assert.rejects(f.server.ready,/database unavailable/);assert.equal((await fetch(base+'/api/startup')).status,503);assert.equal((await fetch(base+'/api/session/join',{method:'POST'})).status,503);assert.deepEqual(f.counts(),{reads:0,writes:0});await new Promise(r=>f.server.close(r));
});
