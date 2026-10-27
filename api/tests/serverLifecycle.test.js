const test=require('node:test'),assert=require('node:assert/strict');
const {once}=require('node:events'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {WebSocket}=require('ws');const {createServer}=require('../server');
for(const unresponsive of [false,true])test(`server shutdown drains ${unresponsive?'unresponsive':'live'} upgraded sockets and releases the listener`,{timeout:20000},async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slaptax-shutdown-')),server=createServer({dbPath:path.join(dir,'db.json')});let socket;
 t.after(async()=>{socket?.terminate();for(const client of server.realtime.wss.clients)client.terminate();if(server.listening)await new Promise(resolve=>server.close(resolve));await server.store.close();fs.rmSync(dir,{recursive:true,force:true});});
 await server.store.ready;await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const socketClosed=new Promise(resolve=>{socket=new WebSocket(`ws://127.0.0.1:${server.address().port}/api/realtime?userId=shutdown-test`);socket.once('close',code=>resolve(code));});await once(socket,'open');
 if(unresponsive)socket._socket.pause();
 const started=Date.now();await new Promise(resolve=>server.close(resolve));assert.ok(Date.now()-started<2500);assert.equal(server.listening,false);assert.equal(server.realtime.wss.clients.size,0);
 if(unresponsive)socket._socket.resume();else assert.equal(await socketClosed,1001);
});
