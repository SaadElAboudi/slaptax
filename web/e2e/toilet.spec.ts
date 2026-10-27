import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import type {ToiletState} from '../src/gameplay/party';
async function post(r:APIRequestContext,path:string,data:object){const response=await r.post(path,{data});expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function player(r:APIRequestContext,name:string){const clientId=crypto.randomUUID();return {...await post(r,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};}
async function identify(p:Page,u:{userId:string;clientId:string;playerName:string}){await p.addInitScript(u=>{localStorage.setItem('slaptax_user_id',u.userId);localStorage.setItem('slaptax_client_id',u.clientId);localStorage.setItem('slaptax_player_name',u.playerName);localStorage.setItem('slaptax_lang','fr');},u);}
function observe(page:Page){let state:ToiletState|undefined;page.on('websocket',socket=>socket.on('framereceived',event=>{try{const data=JSON.parse(String(event.payload));if(data.type==='arena.state'&&data.party?.toilet)state=data.party.toilet;}catch{}}));return()=>state;}
async function pointer(page:Page,mobile:boolean){const c=mobile?await page.context().newCDPSession(page):null;let down=false;return {
 move:async(x:number,y:number)=>{const box=(await page.getByTestId('toilet-canvas').boundingBox())!,p={x:box.x+x/600*box.width,y:box.y+y/600*box.height};if(c)await c.send('Input.dispatchTouchEvent',{type:down?'touchMove':'touchStart',touchPoints:[p]});else{await page.mouse.move(p.x,p.y);if(!down)await page.mouse.down();}down=true;},
 release:async()=>{if(down){if(c)await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();}down=false;if(c)await c.detach();}};
}
async function collect(page:Page,state:()=>ToiletState|undefined,id:string,mobile:boolean){const touch=await pointer(page,mobile),deadline=Date.now()+6000;let loot=0;
 while(Date.now()<deadline){const s=state(),p=s?.bodies.find(p=>p.id===id);loot=p?.loot||0;if(loot>=2)break;const duck=s?.ducks.slice().sort((a,b)=>Math.hypot(a.x-(p?.x||0),a.y-(p?.y||0))-Math.hypot(b.x-(p?.x||0),b.y-(p?.y||0)))[0];if(duck)await touch.move(duck.x,duck.y);await page.waitForTimeout(200);}
 await touch.move(599,599);return {touch,loot};
}
test('toilet solo drives with real touch/mouse, collects ducks, boosts and survives successive flushes',async({page,request},info)=>{
 test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const u=await player(request,'CoinCoin');await identify(page,u);const snapshot=observe(page);await page.goto('/');
 await expect(page.getByRole('tabpanel').getByRole('heading',{name:'Palets Panique',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Jouer maintenant',exact:true}).click();await expect(page.getByRole('heading',{level:3,name:'Panique aux Toilettes',exact:true})).toBeVisible();await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect(page.getByTestId('toilet-game')).toHaveAttribute('data-phase','brawl');await expect.poll(()=>snapshot()?.bodies.filter(p=>p.bot).length).toBe(3);await expect(page.getByText('SOLO · CONTRE 3 BOTS',{exact:false})).toBeVisible();
 const p=snapshot()!.bodies.find(p=>p.id===u.userId)!,origin={x:p.x,y:p.y};
 const {touch,loot}=await collect(page,snapshot,u.userId,info.project.name.includes('mobile'));expect(loot).toBeGreaterThan(0);await touch.release();
 await expect.poll(()=>{const p=snapshot()?.bodies.find(p=>p.id===u.userId);return p?Math.hypot(p.x-origin.x,p.y-origin.y):0;}).toBeGreaterThan(30);
 await page.getByTestId('toilet-boost').click();await expect(page.getByTestId('toilet-boost')).toBeDisabled();await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===u.userId)?.boosting).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('toilet-action.png'),fullPage:true});
 await expect(page.getByTestId('solo-victory')).toBeVisible({timeout:30000});await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');expect(errors).toEqual([]);
});
test('toilet duel uses two humans, actual loot and a server-owned exportable final scene',async({browser,request},info)=>{
 test.setTimeout(50000);const a=await player(request,'TurboA'),b=await player(request,'TurboB');const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'toilet',ban:'onemore'},opponent:{pick:'toilet',ban:'onemore'}}});
 for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'});for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});
 const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);try{const first=await ca.newPage(),second=await cb.newPage();await identify(first,a);await identify(second,b);const snapshot=observe(first),errors:string[]=[];for(const p of [first,second])p.on('pageerror',e=>errors.push(e.message));
 await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of [first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect(first.getByTestId('toilet-game')).toHaveAttribute('data-phase','brawl');expect(snapshot()!.bodies.every(p=>!p.bot)).toBe(true);expect(snapshot()!.bodies.length).toBe(2);
 const {touch,loot}=await collect(first,snapshot,a.userId,info.project.name.includes('mobile'));expect(loot).toBeGreaterThan(0);
 await expect(first.getByTestId('round-recap')).toBeVisible({timeout:30000});await touch.release();await expect(first.getByTestId('round-evidence')).toContainText('🦆');
 const result=await (await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`)).json();expect(result.match.status).toBe('done');expect(result.match.rounds[0].moment.gameId).toBe('toilet');expect(result.match.rounds[0].moment.replay.some((f:{state:{toilet?:ToiletState}})=>f.state.toilet?.bodies.length===2)).toBe(true);expect(errors).toEqual([]);
 await first.screenshot({path:info.outputPath('toilet-duel-result.png'),fullPage:true});
 }finally{await ca.close();await cb.close();}
});
