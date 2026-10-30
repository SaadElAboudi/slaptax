import {test,expect,type Page,type APIRequestContext} from '@playwright/test';
import type {SnackState} from '../src/gameplay/party';
const identities=new Map<string,string>();
async function post(request:APIRequestContext,path:string,data:object){const d=data as Record<string,string>;const actor=d.userId||d.challengerId;const client=identities.get(actor);const r=await request.post(path,{data,headers:client?{'X-SlapTax-User':actor,'X-SlapTax-Client':client}:{}});expect(r.ok(),await r.text()).toBe(true);return r.json();}
async function user(request:APIRequestContext,name:string){const clientId=crypto.randomUUID();const u={...await post(request,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};identities.set(u.userId,clientId);return u;}
async function identify(page:Page,u:{userId:string;clientId:string;playerName:string}){await page.addInitScript(u=>{for(const [k,v]of Object.entries({lang:'fr',user_id:u.userId,client_id:u.clientId,player_name:u.playerName,training_game:'chicken'}))localStorage.setItem('slaptax_'+k,v);},u);}
function observe(page:Page){let state:SnackState|undefined,sawEgg=false;page.on('websocket',ws=>ws.on('framereceived',f=>{try{const d=JSON.parse(String(f.payload));if(d.type==='arena.state'&&d.party?.snack){state=d.party.snack;if(state?.chicken?.eggs.length)sawEgg=true;}}catch{}}));return Object.assign(()=>state,{sawEgg:()=>sawEgg});}

test('new arena is discoverable, runs real practice and accepts touch or keyboard movement',async({page,request},info)=>{
 test.setTimeout(45000);if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});
 const u=await user(request,'PoultrySolo'),snapshot=observe(page),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await identify(page,u);await page.goto('/');
 await page.getByRole('button',{name:'Essayer Poule Position',exact:true}).click();await expect(page.getByRole('heading',{name:'Poule Position',exact:true})).toBeVisible();await expect(page.getByRole('group',{name:'Choisis ton combattant'})).toHaveCount(0);
 await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>snapshot()?.chicken?.carryLimit).toBe(8000);await expect(page.getByTestId('snack-game')).toHaveAttribute('data-variant','chicken');expect(snapshot()!.bodies.filter(p=>p.bot)).toHaveLength(1);await expect(page.getByTestId('snack-skill')).toHaveCount(0);await expect(page.getByTestId('snack-super')).toHaveCount(0);await expect(page.getByTestId('snack-aim-pad')).toHaveCount(0);await expect(page.getByTestId('snack-game').locator('button').filter({hasText:/^(BAFFE|LANCE)/})).toHaveCount(1);await expect(page.getByTestId('snack-game').getByRole('checkbox')).toHaveCount(0);
 const actionBox=(await page.getByRole('button',{name:'BAFFE !',exact:true}).boundingBox())!;expect(actionBox.height).toBeGreaterThanOrEqual(64);expect(actionBox.y+actionBox.height).toBeLessThanOrEqual(page.viewportSize()!.height);
 const before=snapshot()!.bodies.find(p=>p.id===u.userId)!.x;
 if(info.project.name.includes('mobile')){const pad=(await page.getByTestId('snack-move-pad').boundingBox())!;const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:pad.x+pad.width*.8,y:pad.y+pad.height/2,id:1}]});await page.waitForTimeout(220);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
 else{await page.getByTestId('snack-game').focus();await page.keyboard.down('d');await page.waitForTimeout(220);await page.keyboard.up('d');}
 await expect.poll(()=>snapshot()!.bodies.find(p=>p.id===u.userId)!.x).toBeGreaterThan(before+15);await expect.poll(()=>snapshot()!.bodies.find(p=>p.id===u.userId)!.dx).toBe(0);
 await expect.poll(()=>snapshot.sawEgg(),{timeout:12000}).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('poule-position-live.png'),fullPage:true});expect(errors).toEqual([]);
});

test('two humans play a full poultry duel with a server result and replay',async({browser,request},info)=>{
 test.setTimeout(100000);const a=await user(request,'PouleA'),b=await user(request,'PouleB');
 const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'chicken',ban:'onemore'},opponent:{pick:'chicken',ban:'onemore'}}});
 for(const u of[a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'});
 for(const u of[a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});
 const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
 try{const first=await ca.newPage(),second=await cb.newPage(),snapshot=observe(first);await identify(first,a);await identify(second,b);await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of[first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect.poll(()=>snapshot()?.bodies.length).toBe(2);expect(snapshot()!.bodies.every(p=>!p.bot)).toBe(true);await first.getByTestId('snack-game').focus();
 let held='';const start=Date.now();
 while(Date.now()-start<65000){const s=snapshot()!,p=s.bodies.find(p=>p.id===a.userId)!;if(s.winnerId||s.bodies.some(p=>p.captures>=3))break;
 if(p.carrying&&!p.attackCooldown){const action=first.getByRole('button',{name:'LANCE !',exact:true});if(await action.isEnabled())await action.click();}
 const target=p.carrying?{x:80,y:300}:s.box,dx=target.x-p.x,dy=target.y-p.y;
 const next=Math.abs(dy)>22?(dy>0?'s':'w'):Math.abs(dx)>10?(dx>0?'d':'a'):'';
 if(next!==held){if(held)await first.keyboard.up(held);if(next)await first.keyboard.down(next);held=next;}
 await first.waitForTimeout(70);
 }
 if(held)await first.keyboard.up(held);
 await expect(first.getByTestId('round-recap')).toBeVisible({timeout:10000});
 const result=await(await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`,{headers:{'X-SlapTax-User':a.userId,'X-SlapTax-Client':a.clientId}})).json();expect(result.match.rounds[0].winnerId).toBeTruthy();expect(result.match.tokenSettlement.payout).toBe(3.4);expect(result.match.tokenSettlement.fee).toBe(.6);
 const last=result.match.rounds[0].moment.replay.at(-1).state;expect(last.id).toBe('chicken');expect(last.snack.chicken).toBeTruthy();expect(last.snack.bodies.every((p:{bot:boolean})=>!p.bot)).toBe(true);expect(last.snack.bodies.some((p:{captures:number})=>p.captures>0)).toBe(true);
 await first.screenshot({path:info.outputPath('poule-position-result.png')});await first.getByRole('button',{name:'Voir le resultat',exact:true}).click();await first.locator('summary').filter({hasText:'Le moment decisif'}).click();await expect(first.getByTestId('moment-replay')).toBeVisible();
 }finally{await ca.close();await cb.close();}
});

for(const viewport of [{width:320,height:650},{width:800,height:390}])test(`one-button poultry fits ${viewport.width}x${viewport.height} without hiding the field or controls`,async({page,request},info)=>{
 test.skip(!info.project.name.includes('mobile'),'Touch layout');await page.setViewportSize(viewport);
 const u=await user(request,'SimplePoule');await identify(page,u);await page.goto('/?tab=training&game=chicken');await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect(page.getByTestId('snack-game')).toHaveAttribute('data-phase','brawl');
 for(const target of [page.getByTestId('snack-canvas'),page.getByTestId('snack-move-pad'),page.getByRole('button',{name:'BAFFE !',exact:true})]){
  const b=(await target.boundingBox())!;expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(viewport.width);expect(b.y+b.height).toBeLessThanOrEqual(viewport.height);
 }
 const field=(await page.getByTestId('snack-canvas').boundingBox())!;expect(field.width).toBeGreaterThanOrEqual(280);expect(field.height).toBeGreaterThanOrEqual(180);
 await page.screenshot({path:info.outputPath('poule-simple.png')});
});
