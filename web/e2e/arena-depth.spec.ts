import {test,expect,type APIRequestContext,type Page} from '@playwright/test';
import type {SnackState} from '../src/gameplay/party';
const clients=new Map<string,string>();
async function post(request:APIRequestContext,path:string,data:Record<string,unknown>){const id=String(data.userId||data.challengerId||''),client=clients.get(id);const r=await request.post(path,{data,headers:client?{'X-SlapTax-User':id,'X-SlapTax-Client':client}:{}});expect(r.ok(),await r.text()).toBe(true);return r.json();}
async function user(request:APIRequestContext,name:string){const clientId=crypto.randomUUID(),u={...await post(request,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};clients.set(u.userId,clientId);return u;}
async function identify(page:Page,u:{userId:string;clientId:string;playerName:string}){await page.addInitScript(u=>{for(const[k,v]of Object.entries({lang:'fr',user_id:u.userId,client_id:u.clientId,player_name:u.playerName,snack_character:'flan'}))localStorage.setItem('slaptax_'+k,v);},u);}
function observe(page:Page){let state:SnackState|undefined;page.on('websocket',ws=>ws.on('framereceived',f=>{try{const d=JSON.parse(String(f.payload));if(d.type==='arena.state'&&d.party?.snack)state=d.party.snack;}catch{}}));return()=>state;}
async function walk(page:Page,state:()=>SnackState|undefined,id:string,x:number){await page.getByTestId('snack-game').focus();const start=Date.now();let held='';try{while(Date.now()-start<9000){const p=state()?.bodies.find(p=>p.id===id);if(!p){await page.waitForTimeout(40);continue;}const dx=x-p.x,next=Math.abs(dx)<10?'':dx>0?'d':'a';if(next!==held){if(held)await page.keyboard.up(held);if(next)await page.keyboard.down(next);held=next;}if(!next)return;await page.waitForTimeout(50);}throw Error('Movement timed out');}finally{if(held)await page.keyboard.up(held);await page.waitForTimeout(120);}}

test('fighters explain distinct supers and resources fit a small screen',async({page},info)=>{
 if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=snack');
 for(const name of ['CATAPULTE !','BOCAL GÉANT','BRUNCH SOLIDAIRE'])await expect(page.getByRole('group',{name:'Choisis ton combattant'})).toContainText(name);
 await page.getByText('Toutes les règles',{exact:true}).click();await expect(page.getByText(/Combat tactique : 3 baffes/)).toBeVisible();await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect(page.getByTestId('snack-skill')).toBeEnabled();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);await expect(page.getByTestId('snack-super')).toBeDisabled();await expect(page.getByTestId('snack-game').getByLabel('Baffes disponibles : 3 sur 3')).toBeVisible();
 for(const id of (info.project.name.includes('mobile')?['snack-super','snack-skill','snack-move-pad','snack-aim-pad']:['snack-super','snack-skill'])){const r=(await page.getByTestId(id).boundingBox())!,v=page.viewportSize()!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(v.height);expect(r.x+r.width).toBeLessThanOrEqual(v.width);}
 await page.screenshot({path:info.outputPath('arena-combat-ui.png'),fullPage:true});
});

test('a human earns and spends a super through real combat against another human',async({browser,request},info)=>{
 test.setTimeout(90000);const a=await user(request,'SuperA'),b=await user(request,'SuperB');
 const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:'snack',ban:'onemore'},opponent:{pick:'snack',ban:'onemore'}}});
 for(const u of[a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'});for(const u of[a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});
 const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);
 try{const first=await ca.newPage(),second=await cb.newPage(),state=observe(first),errors:string[]=[];first.on('pageerror',e=>errors.push(e.message));await identify(first,a);await identify(second,b);await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of[first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>state()?.bodies.length).toBe(2);
 await walk(first,state,a.userId,735);const canvas=(await first.getByTestId('snack-canvas').boundingBox())!;await first.mouse.move(canvas.x+4,canvas.y+canvas.height/2);await first.getByRole('button',{name:'LANCE !',exact:true}).click();await expect.poll(()=>state()!.box.carrier).not.toBe(a.userId);await walk(first,state,a.userId,795);
 const start=Date.now();while(Date.now()-start<24000&&(state()!.bodies.find(p=>p.id===a.userId)!.superCharge||0)<100){const p=state()!.bodies.find(p=>p.id===a.userId)!,r=state()!.bodies.find(p=>p.id===b.userId)!;if(!r.respawnIn&&!r.shielded&&!p.attackCooldown&&(p.ammo||0)>0){const rect=(await first.getByTestId('snack-canvas').boundingBox())!;await first.mouse.move(rect.x+rect.width-3,rect.y+rect.height/2);await first.getByTestId('snack-game').focus();await first.keyboard.press('j');}await first.waitForTimeout(150);}
 const button=first.getByTestId('snack-super');await expect(button).toBeEnabled();expect(state()!.bodies.find(p=>p.id===a.userId)!.superCharge).toBe(100);await first.screenshot({path:info.outputPath('super-earned.png')});await button.click();await expect.poll(()=>state()!.bodies.find(p=>p.id===a.userId)!.supersUsed).toBe(1);await expect.poll(()=>state()!.bodies.find(p=>p.id===a.userId)!.superCharge).toBe(0);await expect(button).toBeDisabled();expect(errors).toEqual([]);
 }finally{await ca.close();await cb.close();}
});


test('desktop arena gives the board room and keeps aim on a stationary cursor while moving',async({page},info)=>{
 test.skip(info.project.name.includes('mobile'),'Mouse and keyboard layout');
 await page.setViewportSize({width:1366,height:768});
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 const state=observe(page);await page.goto('/?tab=training&game=snack');
 await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect(page.getByTestId('snack-skill')).toBeEnabled();
 await expect(page.getByTestId('snack-move-pad')).toBeHidden();
 const board=page.getByTestId('snack-canvas'),r=(await board.boundingBox())!;
 expect(await page.evaluate(()=>document.getElementById('root')?.inert)).toBe(true);expect(r.width).toBeGreaterThan(800);expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThan(768);
 const id=await page.evaluate(()=>localStorage.getItem('slaptax_user_id'));
 await expect.poll(()=>state()?.bodies.find(p=>p.id===id)?.x).toBeDefined();
 const me=()=>state()!.bodies.find(p=>p.id===id)!;
 // Pointer stays still, well above and ahead of the player. Its world position must
 // remain the aim target after the player moves, even beyond the old assist timeout.
 await page.mouse.move(r.x+r.width*.54,r.y+r.height*.16);
 await page.getByTestId('snack-game').focus();
 const initial=me().x;await page.keyboard.down('d');await page.waitForTimeout(1750);await page.keyboard.up('d');
 await expect.poll(()=>me().x).toBeGreaterThan(initial+40);
 await page.waitForTimeout(150);
 const p=me(),dx=486-p.x,dy=96-p.y,d=Math.hypot(dx,dy);
 expect(p.ax).toBeCloseTo(dx/d,1);expect(p.ay).toBeCloseTo(dy/d,1);
 await page.screenshot({path:info.outputPath('pc-immersive.png')});
 await page.getByRole('button',{name:'Réduire la vue'}).click();await expect(page.getByRole('button',{name:'Agrandir la vue'})).toBeVisible();
 await page.getByRole('button',{name:'Agrandir la vue'}).click();await expect(page.getByRole('button',{name:'Réduire la vue'})).toBeVisible();
 await page.getByTestId('snack-game').focus();await page.keyboard.down('s');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('s');await expect.poll(()=>Math.abs(me().dx)+Math.abs(me().dy)).toBe(0);
 await page.getByTestId('snack-game').focus();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Agrandir la vue'})).toBeVisible();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');expect(await page.evaluate(()=>document.getElementById('root')?.inert)).toBe(false);
});
