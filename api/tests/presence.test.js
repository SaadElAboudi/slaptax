const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { WebSocket } = require('ws');
const { createServer } = require('../server');

test('live presence counts session owners once, excludes stale and unverified sockets, and ignores persisted flags', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(),'slaptax-presence-'));
    const server = createServer({dbPath:path.join(dir,'db.json')});
    await server.store.ready;
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}`, sockets=[];
    t.after(async()=>{
        for(const socket of sockets)socket.terminate();
        for(const socket of server.realtime.wss.clients)socket.terminate();
        await new Promise(resolve=>server.close(resolve));
        await server.store.close();
        fs.rmSync(dir,{recursive:true,force:true});
    });
    const join=async(clientId)=>(await (await fetch(`${base}/api/session/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId,playerName:clientId})})).json()).userId;
    const a=await join('owner-a'),b=await join('owner-b');
    const count=async()=>{
        const response=await fetch(`${base}/api/presence`);
        assert.equal(response.headers.get('cache-control'),'no-store');
        const data=await response.json();assert.equal(data.scope,'instance');
        assert.equal('userIds' in data,false);return data.onlinePlayers;
    };
    const connect=async(userId,clientId)=>{
        const socket=new WebSocket(`${base.replace('http','ws')}/api/realtime?userId=${userId}&clientId=${clientId}`);
        sockets.push(socket);await once(socket,'open');return socket;
    };
    assert.equal(await count(),0);
    const first=await connect(a,'owner-a');await connect(a,'owner-a');
    await connect(b,'wrong-owner');await connect('missing','owner-b');
    assert.equal(await count(),1);
    first.close();await once(first,'close');assert.equal(await count(),1);
    await connect(b,'owner-b');assert.equal(await count(),2);
    for(const socket of server.realtime.wss.clients)if(socket.userId===a)socket.lastPongAt=Date.now()-61000;
    assert.equal(await count(),1);
    for(const socket of server.realtime.wss.clients)socket.terminate();
    assert.equal(await count(),0);
    const db=server.store.read();db.users.forEach(user=>{user.presence={online:true,lastSeenAt:new Date().toISOString()};});server.store.write(db);
    assert.equal(await count(),0);
});
