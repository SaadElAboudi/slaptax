import economy from '../../shared/token-economy.json' with {type:'json'};
import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
// Continuous trace snapshots stall the main-thread WebGL renderer on this host.
test.use({trace:'off'});
const identities=new Map<string,string>();
async function post(r:APIRequestContext,path:string,data:object){const response=await r.post(path,{data,headers:identities.has((data as any).userId||(data as any).challengerId)?{'X-SlapTax-User':(data as any).userId||(data as any).challengerId,'X-SlapTax-Client':identities.get((data as any).userId||(data as any).challengerId)!}:{}});expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function player(r:APIRequestContext,name:string){const clientId=crypto.randomUUID();const u={...await post(r,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};identities.set(u.userId,clientId);return u;}
async function identify(p:Page,u:{userId:string;clientId:string;playerName:string}){await p.addInitScript(u=>{localStorage.setItem('slaptax_user_id',u.userId);localStorage.setItem('slaptax_client_id',u.clientId);localStorage.setItem('slaptax_player_name',u.playerName);localStorage.setItem('slaptax_lang','fr');},u);}
test('table solo uses a real drag, three declared bots, live physics and a replay before the result',async({page},info)=>{
 test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/');
 await page.getByRole('button',{name:'Jouer Bagarre de Table',exact:true}).click();
 await expect(page.getByRole('heading',{level:3,name:'Bagarre de Table',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 const game=page.getByTestId('table-game'),canvas=page.getByTestId('table-canvas');await expect(game).toHaveAttribute('data-phase','brawl');
 await expect(canvas).toHaveAttribute('data-opponents','3');await expect(page.getByText('3 ROBOT(S) DANS L’ARÈNE',{exact:true})).toBeVisible();
 await expect(page.getByTestId('table-scene-3d')).toHaveAttribute('data-renderer','webgl');await expect(page.getByTestId('table-scene-3d')).toHaveAttribute('data-thread','worker');await expect(page.getByRole('button',{name:'Se propulser',exact:true})).toBeEnabled();
 const box=(await canvas.boundingBox())!,x=Number(await canvas.getAttribute('data-player-x')),y=Number(await canvas.getAttribute('data-player-y'));
 const start={x:box.x+box.width*.5,y:box.y+box.height*.5},end={x:box.x+box.width*.5,y:box.y+box.height*.3};
 if(info.project.name.includes('mobile')){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
 else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:5});await page.mouse.up();}
 await expect.poll(async()=>Math.hypot(Number(await canvas.getAttribute('data-player-x'))-x,Number(await canvas.getAttribute('data-player-y'))-y)).toBeGreaterThan(4);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect.poll(async()=>Number(await page.getByTestId('table-scene-3d').getAttribute('data-frames'))).toBeGreaterThan(2);
 await page.screenshot({path:info.outputPath('table-playing.png'),fullPage:true});
 await expect(page.getByText('REPLAY · DERNIÈRES SECONDES',{exact:true})).toBeVisible({timeout:22000});
 await expect(page.getByTestId('solo-victory')).toBeVisible();await expect(page.getByRole('button',{name:'Je prends ma revanche',exact:true})).toBeVisible();
 await page.screenshot({path:info.outputPath('table-result.png'),fullPage:true});
 await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance',String(economy.welcome+economy.practiceReward));expect(errors).toEqual([]);
});
test('table duel runs two human players with a server-owned result and no disguised bots',async({browser,request},info)=>{
 test.setTimeout(60000);const a=await player(request,'TableA'),b=await player(request,'TableB');
 const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'table',ban:'onemore'},opponent:{pick:'table',ban:'onemore'}}});
 for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'});
 for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});
 const started=await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});expect(started.match.games[0]).toBe('table');
 const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
 try{
  const first=await ca.newPage(),second=await cb.newPage();await identify(first,a);await identify(second,b);
  await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of [first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();
  for(const p of [first,second]){await expect(p.getByTestId('table-game')).toHaveAttribute('data-phase','brawl');await expect(p.getByText('2 JOUEURS HUMAINS',{exact:true})).toBeVisible();await expect(p.getByTestId('table-canvas')).toHaveAttribute('data-opponents','1');}
  await expect(first.getByRole('button',{name:'Se propulser',exact:true})).toBeEnabled();
  const surface=first.getByTestId('table-canvas'),beforeY=Number(await surface.getAttribute('data-player-y'));
  await surface.focus();await first.keyboard.press('ArrowUp');await first.keyboard.press('Space');
  await expect.poll(async()=>Number(await surface.getAttribute('data-player-y'))).toBeLessThan(beforeY-4);
  await expect(first.getByTestId('table-cloth')).toContainText('ATTENTION AU COUP DE NAPPE',{timeout:10000});
  await expect(first.getByTestId('round-recap')).toBeVisible({timeout:26000});
  await expect(first.getByTestId('round-chaos')).toContainText('coups de nappe');await expect(first.getByTestId('round-evidence').locator('canvas')).toBeVisible();
  const result=await (await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`,{headers:{'X-SlapTax-User':a.userId,'X-SlapTax-Client':a.clientId}})).json();expect(result.match.status).toBe('done');
  expect(result.match.rounds[0].moment.gameId).toBe('table');expect(result.match.rounds[0].moment.replay.some((f:{state:{table?:{bodies:unknown[]}}})=>f.state.table?.bodies.length===2)).toBe(true);
 }finally{await ca.close();await cb.close();}
});
