import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import type {CarnivalState} from '../src/gameplay/party';
async function post(r:APIRequestContext,path:string,data:object){const response=await r.post(path,{data});expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function player(r:APIRequestContext,name:string){const clientId=crypto.randomUUID();return {...await post(r,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};}
async function identify(p:Page,u:{userId:string;clientId:string;playerName:string}){await p.addInitScript(u=>{for(const [key,value] of Object.entries({user_id:u.userId,client_id:u.clientId,player_name:u.playerName,lang:'fr'}))localStorage.setItem(`slaptax_${key}`,value);},u);}
function observe(page:Page){let state:CarnivalState|undefined;page.on('websocket',socket=>socket.on('framereceived',event=>{try{const data=JSON.parse(String(event.payload));if(data.type==='arena.state'&&data.party?.carnival)state=data.party.carnival;}catch{}}));return()=>state;}
async function holdPump(page:Page,mobile:boolean){
 const button=page.getByRole('button',{name:'GONFLE…',exact:false}),box=(await button.boundingBox())!;
 if(mobile){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});return async()=>{await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();};}
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();return()=>page.mouse.up();
}
async function bank(page:Page,mobile:boolean,snapshot?:()=>CarnivalState|undefined,id?:string,target=50){const release=await holdPump(page,mobile);if(snapshot&&id)await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===id)?.volume,{intervals:[20],timeout:6500}).toBeGreaterThanOrEqual(target);else await page.waitForTimeout(2800);await release();}
async function shootOnce(page:Page,snapshot:()=>CarnivalState|undefined,id:string,mobile:boolean){
 const deadline=Date.now()+6000;
 while(Date.now()<deadline){const s=snapshot(),self=s?.bodies.find(p=>p.id===id),rival=s?.bodies.find(p=>p.id!==id);
  if(s&&self&&!self.cooldown&&rival&&.5+.34*Math.sin((s.elapsed+350)/700+rival.slot*2.1)>.79){
   const box=(await page.getByTestId('pie-canvas').boundingBox())!,width=Math.min(box.width,box.height*600/420),x=box.x+(box.width-width)/2+(70+.82*460)/600*width,y=box.y+box.height/2;
   if(mobile){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else await page.mouse.click(x,y);return;
  }await page.waitForTimeout(25);
 }throw new Error('No authoritative target window');
}
async function hit(page:Page,snapshot:()=>CarnivalState|undefined,id:string,mobile:boolean){
 // Fix the sight near a turning point, then use the real DOM action when the
 // authoritative moving target enters it. Native mouse/touch tests the direct
 // scene control without Playwright's timed locator-click auto-waits.
 await page.getByRole('slider',{name:'Viser la tarte'}).fill('0.82');
 const deadline=Date.now()+10000;
 while(Date.now()<deadline){const s=snapshot(),self=s?.bodies.find(p=>p.id===id),rival=s?.bodies.find(p=>p.id!==id);if((self?.score||0)>0)return;
  if(s&&self&&!self.cooldown&&rival&&.5+.34*Math.sin((s.elapsed+350)/700+rival.slot*2.1)>.79){
   const box=(await page.getByTestId('pie-canvas').boundingBox())!,width=Math.min(box.width,box.height*600/420),x=box.x+(box.width-width)/2+(70+.82*460)/600*width,y=box.y+box.height/2;
   if(mobile){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else await page.mouse.click(x,y);
  }
  await page.waitForTimeout(50);
 }
 expect(snapshot()?.bodies.find(p=>p.id===id)?.score).toBeGreaterThan(0);
}
for(const game of [{id:'pie',label:'Tarte ta Face'},{id:'balloon',label:'Gonfle ou Pète'}]){
 test(`${game.id} solo real controls score, declared bot and permanent result`,async({page,request},info)=>{
  test.setTimeout(40000);const u=await player(request,'Rigolo'),snapshot=observe(page),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await identify(page,u);await page.goto('/');await page.getByRole('button',{name:`Jouer ${game.label}`,exact:true}).click();await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>snapshot()?.bodies.length).toBe(2);expect(snapshot()!.bodies.filter(p=>p.bot).length).toBe(1);
  if(game.id==='pie'){await hit(page,snapshot,u.userId,info.project.name.includes('mobile'));await page.getByRole('button',{name:'ESQUIVE !',exact:true}).click();await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===u.userId)?.ducking).toBe(true);}else await bank(page,info.project.name.includes('mobile'));
  await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===u.userId)?.score).toBeGreaterThan(0);await page.screenshot({path:info.outputPath(`${game.id}-action.png`),fullPage:true});
  await expect(page.getByTestId('solo-victory')).toBeVisible({timeout:28000});await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');expect(errors).toEqual([]);
 });
 test(`${game.id} duel has two humans, actual winner and exportable authoritative scene`,async({browser,request},info)=>{
  test.setTimeout(45000);const a=await player(request,'FarceA'),b=await player(request,'FarceB');const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:game.id,ban:'onemore'},opponent:{pick:game.id,ban:'onemore'}}});for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'});for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});
  const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);try{const first=await ca.newPage(),second=await cb.newPage(),snapshot=observe(first),errors:string[]=[];for(const p of [first,second])p.on('pageerror',e=>errors.push(e.message));await identify(first,a);await identify(second,b);await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of [first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>snapshot()?.bodies.length).toBe(2);expect(snapshot()!.bodies.every(p=>!p.bot)).toBe(true);
  const mobile=info.project.name.includes('mobile');
  if(game.id==='pie'){
   await shootOnce(second,snapshot,b.userId,mobile);
   await first.getByRole('button',{name:'ESQUIVE !',exact:true}).evaluate((button:HTMLButtonElement)=>button.click());
   await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===a.userId)?.revenge).toBe(true);
   await expect(first.getByTestId('carnival-power')).toContainText('GROSSE TARTE PRÊTE');
   await hit(first,snapshot,a.userId,mobile);
   await expect.poll(()=>snapshot()?.events.some(e=>e.kind==='revenge-hit')).toBe(true);
  }else{
   await bank(first,mobile,snapshot,a.userId,71);await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===a.userId)?.shield).toBe(true);
   await expect(first.getByTestId('carnival-power')).toContainText('CASQUE PASSOIRE');await bank(second,mobile);
   const release=await holdPump(first,mobile);await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===a.userId)?.volume).toBeGreaterThan(12);
   await second.getByRole('button',{name:'COUP DE POMPE !',exact:false}).click();await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===a.userId)?.blocks).toBe(1);await release();
   expect(snapshot()?.bodies.find(p=>p.id===a.userId)?.shield).toBe(false);
  }
  await expect(first.getByTestId('round-recap')).toBeVisible({timeout:28000});await expect(first.getByTestId('round-evidence')).toContainText('pts');const result=await(await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`)).json();expect(result.match.status).toBe('done');expect(result.match.rounds[0].winnerId).toBe(a.userId);expect(result.match.rounds[0].moment.replay.at(-1).state.carnival.bodies.length).toBe(2);expect(errors).toEqual([]);await first.screenshot({path:info.outputPath(`${game.id}-duel.png`),fullPage:true});
  }finally{await ca.close();await cb.close();}
 });
}


test('balloon stops on early release and never resumes a replacement while the old finger stays held',async({page,request},info)=>{
 test.setTimeout(30000);const u=await player(request,'StablePump'),snapshot=observe(page),mobile=info.project.name.includes('mobile');await identify(page,u);await page.goto('/');await page.getByRole('button',{name:'Jouer Gonfle ou Pète',exact:true}).click();await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>snapshot()?.bodies.length).toBe(2);
 let release=await holdPump(page,mobile);await page.waitForTimeout(150);await release();await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===u.userId)?.inflating).toBe(false);
 const volume=snapshot()!.bodies.find(p=>p.id===u.userId)!.volume;await page.waitForTimeout(700);expect(snapshot()!.bodies.find(p=>p.id===u.userId)!.volume).toBe(volume);
 release=await holdPump(page,mobile);await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===u.userId)?.misses,{timeout:7500,intervals:[50]}).toBe(1);
 await page.waitForTimeout(1200);const p=snapshot()!.bodies.find(p=>p.id===u.userId)!;expect(p.volume).toBe(0);expect(p.inflating).toBe(false);await release();
});

test('silent network stalls disable controls, reconnect the same match and preserve banked points',async({page,request},info)=>{
 test.setTimeout(40000);let blocked=false,joins=0,last:CarnivalState|undefined;const practiceIds:string[]=[];
 await page.routeWebSocket('**/api/realtime**',ws=>{const server=ws.connectToServer();let arena=false;ws.onMessage(message=>{const data=JSON.parse(String(message));if(data.type==='party.practice'){arena=true;joins++;practiceIds.push(data.practiceId);}server.send(message);});server.onMessage(message=>{if(blocked&&arena)return;try{const data=JSON.parse(String(message));if(data.party?.carnival)last=data.party.carnival;}catch{}ws.send(message);});});
 const u=await player(request,'Resilient');await identify(page,u);await page.goto('/');await page.getByRole('button',{name:'Jouer Gonfle ou Pète',exact:true}).click();await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>last?.bodies.length).toBe(2);await bank(page,info.project.name.includes('mobile'));await expect.poll(()=>last?.bodies.find(p=>p.id===u.userId)?.score).toBeGreaterThan(0);const saved=last!.bodies.find(p=>p.id===u.userId)!.score;
 blocked=true;await expect(page.getByRole('button',{name:'GONFLE…',exact:false})).toBeDisabled({timeout:5000});await expect(page.getByText('Connexion en cours…',{exact:true})).toBeVisible();
 await expect.poll(()=>joins,{timeout:11000}).toBeGreaterThan(1);blocked=false;await expect(page.getByRole('button',{name:'GONFLE…',exact:false})).toBeEnabled({timeout:7000});expect(new Set(practiceIds).size).toBe(1);expect(last!.bodies.find(p=>p.id===u.userId)!.score).toBe(saved);expect(last!.bodies.find(p=>p.id===u.userId)!.inflating).toBe(false);
});
