import {test,expect} from '@playwright/test';
import {createServer,loadConfigFromFile} from 'vite';
import {WebSocket} from 'ws';
import path from 'node:path';

test('development proxy forwards authenticated practice WebSockets for all server-backed games',async({request},info)=>{
 test.skip(info.project.name!=='desktop-chromium','Transport behavior does not depend on viewport.');
 test.setTimeout(45000);
 const loaded=await loadConfigFromFile({command:'serve',mode:'test'},path.resolve('vite.config.ts'));
 if(!loaded)throw Error('Missing Vite config');
 const rule=loaded.config.server?.proxy?.['/api'];
 if(!rule||typeof rule==='string')throw Error('Missing API proxy configuration');
 // Preserve the production dev proxy options, changing only the test backend.
 rule.target='http://127.0.0.1:3100';
 const server=await createServer({...loaded.config,configFile:false,server:{...loaded.config.server,host:'127.0.0.1',port:0,open:false}});
 try{
  await server.listen();const address=server.httpServer!.address();
  if(!address||typeof address==='string')throw Error('Missing Vite port');
  const clientId=crypto.randomUUID();const joined=await request.post('/api/session/join',{data:{clientId,playerName:'ProxyQA'}});
  expect(joined.ok()).toBe(true);const {userId}=await joined.json();
  for(const gameId of ['table','mat','garde','trace','decoupe','chroma','ricochet','contrepied','falsestart','onesecond','onemore']){
   await new Promise<void>((resolve,reject)=>{
    const socket=new WebSocket(`ws://127.0.0.1:${address.port}/api/realtime?userId=${userId}&clientId=${clientId}`);
    const timer=setTimeout(()=>{socket.terminate();reject(Error(`${gameId}: no game state through Vite proxy`));},3000);
    function finish(error?:Error){clearTimeout(timer);socket.close();error?reject(error):resolve();}
    socket.on('open',()=>socket.send(JSON.stringify({type:'party.practice',practiceId:crypto.randomUUID(),gameId})));
    socket.on('error',error=>finish(error));
    socket.on('message',raw=>{const data=JSON.parse(String(raw));if(data.type==='arena.error')finish(Error(`${gameId}: ${JSON.stringify(data)}`));if(data.type==='arena.state'&&data.party?.id===gameId)finish();});
   });
  }
 }finally{await server.close();}
});
