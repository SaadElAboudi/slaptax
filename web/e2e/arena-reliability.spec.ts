import {test,expect} from '@playwright/test';
import {WebSocket} from 'ws';

test('a canvas failure while entering a staked duel recovers visibly and refunds both players without a winner',async({page,request})=>{
 test.setTimeout(45000);
 const users=[];for(const name of ['CrashEntryA','CrashEntryB']){const clientId=crypto.randomUUID();const r=await request.post('/api/session/join',{data:{clientId,playerName:name}});users.push({...await r.json(),clientId,playerName:name});}
 const [a,b]=users,headers=(u:typeof a)=>({'X-SlapTax-User':u.userId,'X-SlapTax-Client':u.clientId});
 const post=async(path:string,data:object,u=a)=>{const r=await request.post(path,{data,headers:headers(u)});expect(r.ok(),await r.text()).toBe(true);return r.json();};
 const {duel}=await post('/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:5,bestOf:1,draft:{challenger:{pick:'snack',ban:'onemore'},opponent:{pick:'snack',ban:'onemore'}}});
 for(const u of users)await post(`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'},u);
 for(const u of users)await post(`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true},u);
 await post(`/api/duels/${duel.id}/start`,{userId:a.userId});
 const rival=new WebSocket(`ws://127.0.0.1:3100/api/realtime?userId=${b.userId}&clientId=${b.clientId}`);
 try{
  await new Promise<void>((resolve,reject)=>{rival.once('open',resolve);rival.once('error',reject);});rival.send(JSON.stringify({type:'arena.join',duelId:duel.id,round:1}));
  await page.addInitScript(u=>{for(const[k,v]of Object.entries({lang:'fr',onboarded:'1',client_id:u.clientId,user_id:u.userId,player_name:u.playerName}))localStorage.setItem('slaptax_'+k,v);
   const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args:any[]){if(this.dataset.testid==='snack-canvas')throw Error('Injected canvas failure');return original.apply(this,args as any);} as typeof original;
  },a);
  await page.goto('/?tab=defy');await page.getByRole('button',{name:'Entrer dans l arene'}).click();
  await expect(page.getByRole('heading',{name:'La partie a rencontré un problème.'})).toBeVisible();await expect(page.getByRole('button',{name:'Recharger',exact:true})).toBeEnabled();
  expect(await page.evaluate(()=>document.getElementById('root')?.inert)).toBe(false);
  await expect.poll(async()=>{const r=await request.get(`/api/duels/${duel.id}/match?userId=${b.userId}`,{headers:headers(b)});return (await r.json()).match.status;},{timeout:27000}).toBe('cancelled');
  const result=await(await request.get(`/api/duels/${duel.id}/match?userId=${b.userId}`,{headers:headers(b)})).json();expect(result.match.winnerId).toBeNull();expect(result.match.rounds).toHaveLength(0);
  for(const u of users){const w=await(await request.get('/api/tokens',{headers:headers(u)})).json();expect(w.balance).toBe(25);expect(w.journal.filter((e:any)=>e.reason==='payout')).toHaveLength(0);}
 }finally{rival.close();}
});

test('mobile arena has large simple controls, a readable field and optional two-thumb aim',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'Touch layout');await page.setViewportSize({width:320,height:650});
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','snack');});
 let state:any;const actions:string[]=[];page.on('websocket',ws=>{ws.on('framereceived',e=>{try{const a=JSON.parse(String(e.payload));if(a.party?.snack)state=a.party.snack;}catch{}});ws.on('framesent',e=>{try{const a=JSON.parse(String(e.payload));if(a.type==='arena.action')actions.push(a.action);}catch{}});});
 await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const arena=page.getByTestId('snack-game');await expect(arena).toHaveAttribute('data-phase','brawl');
 await expect(page.getByTestId('snack-aim-pad')).toBeHidden();const canvas=await page.getByTestId('snack-canvas').boundingBox();expect(canvas!.width).toBeGreaterThanOrEqual(280);
 const attack=arena.getByRole('button',{name:'BAFFE !',exact:true}),rect=(await attack.boundingBox())!;expect(rect.height).toBeGreaterThanOrEqual(48);expect(rect.y+rect.height).toBeLessThanOrEqual(650);
 const move=(await page.getByTestId('snack-move-pad').boundingBox())!,x=state.bodies[0].x;
 const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:move.x+move.width*.8,y:move.y+move.height/2,id:1}]});await expect.poll(()=>state.bodies[0].x).toBeGreaterThan(x+12);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await attack.tap();expect(actions).toContain('attack');await arena.getByRole('checkbox',{name:'Stick de visée'}).check();await expect(page.getByTestId('snack-aim-pad')).toBeVisible();
 await page.screenshot({path:info.outputPath('mobile-simple-arena.png')});
});

test('touch landscape keeps the field and combat controls in the viewport',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'Touch landscape');await page.setViewportSize({width:800,height:390});
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','snack');});
 await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const arena=page.getByTestId('snack-game');await expect(arena).toHaveAttribute('data-phase','brawl');
 const canvas=(await arena.getByTestId('snack-canvas').boundingBox())!;expect(canvas.width).toBeGreaterThanOrEqual(300);expect(canvas.height).toBeGreaterThanOrEqual(190);
 for(const id of ['snack-move-pad','snack-super','snack-skill'])await expect(arena.getByTestId(id)).toBeInViewport();
 await expect(arena.getByRole('button',{name:'BAFFE !',exact:true})).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const move=(await arena.getByTestId('snack-move-pad').boundingBox())!,attack=(await arena.getByRole('button',{name:'BAFFE !',exact:true}).boundingBox())!;expect(move.x+move.width).toBeLessThan(canvas.x);expect(attack.x).toBeGreaterThan(canvas.x+canvas.width);
 await page.screenshot({path:info.outputPath('mobile-landscape-arena.png')});
});
