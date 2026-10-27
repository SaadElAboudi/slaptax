import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
async function post(r:APIRequestContext,path:string,data:object){const response=await r.post(path,{data});expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function player(r:APIRequestContext,name:string){const clientId=crypto.randomUUID();return {...await post(r,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};}
async function identify(p:Page,u:{userId:string;clientId:string;playerName:string}){await p.addInitScript(u=>{localStorage.setItem('slaptax_user_id',u.userId);localStorage.setItem('slaptax_client_id',u.clientId);localStorage.setItem('slaptax_player_name',u.playerName);localStorage.setItem('slaptax_lang','fr');},u);}
test('table solo uses a real drag, three declared bots, live physics and a replay before the result',async({page},info)=>{
 test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/');
 await page.getByRole('button',{name:'Jouer Bagarre de Table',exact:true}).click();
 await expect(page.getByRole('heading',{level:3,name:'Bagarre de Table',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 const game=page.getByTestId('table-game'),canvas=page.getByTestId('table-canvas');await expect(game).toHaveAttribute('data-phase','brawl');
 await expect(canvas).toHaveAttribute('data-opponents','3');await expect(page.getByText('SOLO CONTRE 3 BOTS',{exact:true})).toBeVisible();
 const box=(await canvas.boundingBox())!,x=Number(await canvas.getAttribute('data-player-x')),y=Number(await canvas.getAttribute('data-player-y'));
 const start={x:box.x+x/600*box.width,y:box.y+y/600*box.height},end={x:start.x,y:start.y-100/600*box.height};
 if(info.project.name.includes('mobile')){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
 else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:5});await page.mouse.up();}
 await expect.poll(async()=>Number(await canvas.getAttribute('data-player-y'))).toBeLessThan(y-5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const pixels=await canvas.evaluate((c:HTMLCanvasElement)=>new Set(c.getContext('2d')!.getImageData(0,0,c.width,c.height).data).size);expect(pixels).toBeGreaterThan(30);
 await page.screenshot({path:info.outputPath('table-playing.png'),fullPage:true});
 await expect(page.getByText('REPLAY · DERNIÈRES SECONDES',{exact:true})).toBeVisible({timeout:22000});
 await expect(page.getByTestId('solo-victory')).toBeVisible();await expect(page.getByRole('button',{name:'Rejouer',exact:true})).toBeVisible();
 await page.screenshot({path:info.outputPath('table-result.png'),fullPage:true});
 await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');expect(errors).toEqual([]);
});
test('table duel runs two human players with a server-owned result and no disguised bots',async({browser,request},info)=>{
 test.setTimeout(60000);const a=await player(request,'TableA'),b=await player(request,'TableB');
 const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'table',ban:'bounce'},opponent:{pick:'table',ban:'bounce'}}});
 for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'bounce'});
 for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});
 const started=await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});expect(started.match.games[0]).toBe('table');
 const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
 try{
  const first=await ca.newPage(),second=await cb.newPage();await identify(first,a);await identify(second,b);
  await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of [first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();
  for(const p of [first,second]){await expect(p.getByTestId('table-game')).toHaveAttribute('data-phase','brawl');await expect(p.getByText('DUEL · 2 JOUEURS HUMAINS',{exact:true})).toBeVisible();await expect(p.getByTestId('table-canvas')).toHaveAttribute('data-opponents','1');}
  await expect(first.getByTestId('table-cloth')).toContainText('ATTENTION AU COUP DE NAPPE',{timeout:10000});
  await expect.poll(async()=>Number(await first.getByTestId('table-canvas').getAttribute('data-player-x')),{timeout:4000}).toBeGreaterThan(310);
  await first.getByTestId('table-canvas').focus();await first.keyboard.press('ArrowUp');await first.keyboard.press('Space');
  await expect.poll(async()=>Number(await first.getByTestId('table-canvas').getAttribute('data-player-y'))).toBeLessThan(405);
  await expect(first.getByTestId('round-recap')).toBeVisible({timeout:26000});
  await expect(first.getByTestId('round-chaos')).toContainText('coups de nappe');await expect(first.getByTestId('round-evidence').locator('canvas')).toBeVisible();
  const result=await (await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`)).json();expect(result.match.status).toBe('done');
  expect(result.match.rounds[0].moment.gameId).toBe('table');expect(result.match.rounds[0].moment.replay.some((f:{state:{table?:{bodies:unknown[]}}})=>f.state.table?.bodies.length===2)).toBe(true);
 }finally{await ca.close();await cb.close();}
});
