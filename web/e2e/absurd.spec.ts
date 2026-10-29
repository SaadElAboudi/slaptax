import economy from '../../shared/token-economy.json' with {type:'json'};
import {test,expect,type Page,type APIRequestContext,type Locator} from '@playwright/test';
import {pigeonLanding} from '../src/gameplay/absurd';
import type {AbsurdState} from '../src/gameplay/party';
const identities=new Map<string,string>();
async function post(r:APIRequestContext,path:string,data:object){const values=data as Record<string,string>,actor=values.userId||values.challengerId,client=identities.get(actor);const response=await r.post(path,{data,headers:client?{'X-SlapTax-User':actor,'X-SlapTax-Client':client}:{}});expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function player(r:APIRequestContext,name:string){const clientId=crypto.randomUUID();const user={...await post(r,'/api/session/join',{clientId,playerName:name}),clientId,playerName:name};identities.set(user.userId,clientId);return user;}
async function identify(p:Page,u:{userId:string;clientId:string;playerName:string}){await p.addInitScript(u=>{for(const [key,value] of Object.entries({user_id:u.userId,client_id:u.clientId,player_name:u.playerName,lang:'fr'}))localStorage.setItem(`slaptax_${key}`,value);},u);}
function observe(page:Page){let state:AbsurdState|undefined;page.on('websocket',socket=>socket.on('framereceived',event=>{try{const d=JSON.parse(String(event.payload));if(d.type==='arena.state'&&d.party?.absurd)state=d.party.absurd;}catch{}}));return()=>state;}
async function tap(page:Page,button:Locator,mobile:boolean){const box=(await button.boundingBox())!,x=box.x+box.width/2,y=box.y+box.height/2;if(mobile){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else await page.mouse.click(x,y);}
async function play(page:Page,snapshot:()=>AbsurdState|undefined,id:string,mobile:boolean){const start=Date.now();
 if(snapshot()?.kind==='pigeon'){
  const canvas=page.getByTestId('pigeon-canvas');await tap(page,canvas,mobile);await page.waitForTimeout(300);expect(snapshot()!.bodies.find(p=>p.id===id)!.x).not.toBe(150);
  while(Date.now()-start<14000){const s=snapshot(),p=s?.bodies.find(p=>p.id===id),rival=s?.bodies.find(p=>p.id!==id);if((p?.score||0)>0)return;
   if(s&&p&&rival){const future=300+Math.sin((s.elapsed+1150)/1050+rival.slot*2.3)*205,drift=Math.sin((s.elapsed+450)/2300)*58*.9,aim=Math.max(50,Math.min(550,future-drift));
    await page.getByRole('slider',{name:'Piloter le pigeon'}).fill(String(Math.round((aim-50)/5)/100));
    // Re-read after the UI steering action: that action takes real time on a
    // phone. Aim for arrival, and bait the bot's umbrella before the next gift.
    const current=snapshot(),body=current?.bodies.find(q=>q.id===id),target=current?.bodies.find(q=>q.id!==id);
    if(current&&body&&target&&!body.cooldown&&!target.umbrella){
     const arrival=current.elapsed+1000,car=300+Math.sin(arrival/1050+target.slot*2.3)*205,ownCar=300+Math.sin(arrival/1050+body.slot*2.3)*205;
     if(Math.abs(pigeonLanding(body.x,current.elapsed)-car)<32&&Math.abs(ownCar-car)>95)await tap(page,page.getByRole('button',{name:'LARGUE !',exact:true}),mobile);
    }
   }await page.waitForTimeout(100);
  }
 }else{
  let fired=false;while(Date.now()-start<19500){const s=snapshot(),p=s?.bodies.find(p=>p.id===id);if((p?.score||0)>0&&fired&&(s?.elapsed||0)>18500)return;
   if(p&&!fired&&p.ammo&&!p.proutCooldown){await tap(page,page.getByRole('button',{name:'PROUT CIBLÉ !',exact:false}),mobile);fired=true;}
   if(s?.wave?.bean!=null&&p&&!p.cooldown&&!p.confirmed){const attack=s.strikes.find(a=>a.target===id),lane=attack?.lane===s.wave.bean?[0,1,2].find(l=>l!==s.wave!.gas&&l!==attack.lane)!:s.wave.bean;await tap(page,page.getByRole('button',{name:['GAUCHE','MILIEU','DROITE'][lane],exact:true}),mobile);}
   await page.waitForTimeout(80);
  }
 }expect(snapshot()?.bodies.find(p=>p.id===id)?.score).toBeGreaterThan(0);
}
for(const game of [{id:'pigeon',name:'Pigeon Express'},{id:'lift',name:'Ascenseur à Prouts'}]){
 test(`${game.id} solo has real controls, scores and a declared bot`,async({page,request},info)=>{
  test.setTimeout(45000);const u=await player(request,'AbsurdSolo'),snapshot=observe(page),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await identify(page,u);await page.goto(`/?tab=training&game=${game.id}`);await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>snapshot()?.bodies.length).toBe(2);expect(snapshot()!.bodies.filter(p=>p.bot).length).toBe(1);await play(page,snapshot,u.userId,info.project.name.includes('mobile'));
  if(game.id==='pigeon'){await tap(page,page.getByRole('button',{name:'PARASOL !',exact:true}),info.project.name.includes('mobile'));await expect.poll(()=>snapshot()?.bodies.find(p=>p.id===u.userId)?.umbrella).toBe(true);}
  await page.screenshot({path:info.outputPath(`${game.id}-playing.png`),fullPage:true});await expect(page.getByTestId('solo-victory')).toBeVisible({timeout:27000});await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance',String(economy.welcome+economy.practiceReward));expect(errors).toEqual([]);
 });
 test(`${game.id} live duel has two humans and actual exportable results`,async({browser,request},info)=>{
  test.setTimeout(50000);const a=await player(request,'AbsurdA'),b=await player(request,'AbsurdB');const {duel}=await post(request,'/api/duels',{challengerId:a.userId,opponentId:b.userId,stake:2,bestOf:1,draft:{challenger:{pick:game.id,ban:'onemore'},opponent:{pick:game.id,ban:'onemore'}}});for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'});for(const u of [a,b])await post(request,`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true});await post(request,`/api/duels/${duel.id}/start`,{userId:a.userId});
  const ca=await browser.newContext(info.project.use),cb=await browser.newContext(info.project.use);try{const first=await ca.newPage(),second=await cb.newPage(),snapshot=observe(first),errors:string[]=[];for(const p of [first,second])p.on('pageerror',e=>errors.push(e.message));await identify(first,a);await identify(second,b);await first.goto('/?tab=defy');await second.goto('/?tab=defy');for(const p of [first,second])await p.getByRole('button',{name:'Entrer dans l arene'}).click();await expect.poll(()=>snapshot()?.bodies.length).toBe(2);expect(snapshot()!.bodies.every(p=>!p.bot)).toBe(true);await play(first,snapshot,a.userId,info.project.name.includes('mobile'));await expect(first.getByTestId('round-recap')).toBeVisible({timeout:27000});await expect(first.getByTestId('round-evidence')).toContainText('pts');
   const result=await(await request.get(`/api/duels/${duel.id}/match?userId=${a.userId}`,{headers:{'X-SlapTax-User':a.userId,'X-SlapTax-Client':a.clientId}})).json();expect(result.match.rounds[0].winnerId).toBe(a.userId);expect(result.match.rounds[0].moment.replay.at(-1).state.absurd.bodies.length).toBe(2);expect(errors).toEqual([]);await first.screenshot({path:info.outputPath(`${game.id}-duel.png`),fullPage:true});
  }finally{await ca.close();await cb.close();}
 });
}
