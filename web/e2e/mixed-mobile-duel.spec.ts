import {test,expect,webkit,chromium,devices,type APIRequestContext,type TestInfo} from '@playwright/test';

type User={userId:string;clientId:string;playerName:string};
async function setup(request:APIRequestContext,info:TestInfo,iosChallenger=true){
 const users:User[]=[];
 for(const playerName of ['IOSWebKit','AndroidChromium']){const clientId=crypto.randomUUID(),r=await request.post('/api/session/join',{data:{clientId,playerName}});expect(r.ok()).toBe(true);users.push({...await r.json(),clientId,playerName});}
 const [ios,android]=users,challenger=iosChallenger?ios:android,opponent=iosChallenger?android:ios;
 const headers=(u:User)=>({'X-SlapTax-User':u.userId,'X-SlapTax-Client':u.clientId});
 const post=async(path:string,data:object,u=challenger)=>{const r=await request.post(path,{data,headers:headers(u)});expect(r.ok(),await r.text()).toBe(true);return r.json();};
 const {duel}=await post('/api/duels',{challengerId:challenger.userId,opponentId:opponent.userId,stake:5,bestOf:1,draft:{challenger:{pick:'chicken',ban:'onemore'},opponent:{pick:'chicken',ban:'onemore'}}});
 for(const u of users)await post(`/api/duels/${duel.id}/ban`,{userId:u.userId,gameId:'onemore'},u);
 for(const u of users)await post(`/api/duels/${duel.id}/ready`,{userId:u.userId,ready:true},u);
 await post(`/api/duels/${duel.id}/start`,{userId:challenger.userId});
 const safari=await webkit.launch(),chrome=await chromium.launch();
 const iosContext=await safari.newContext({...devices['iPhone 13'],locale:'fr-FR'}),androidContext=await chrome.newContext({...devices['Pixel 7'],locale:'fr-FR'});
 const iosPage=await iosContext.newPage(),androidPage=await androidContext.newPage(),errors:string[]=[];let snapshot:any,sawEgg=false;
 for(const [page,u]of [[iosPage,ios],[androidPage,android]] as const){
  page.on('pageerror',e=>errors.push(`${u.playerName}: ${e.message}`));
  page.on('websocket',ws=>ws.on('framereceived',e=>{try{const a=JSON.parse(String(e.payload));if(a.party?.snack){snapshot=a.party.snack;if(snapshot.chicken?.eggs.length)sawEgg=true;}}catch{}}));
  await page.addInitScript(u=>{for(const[k,v]of Object.entries({lang:'fr',onboarded:'1',client_id:u.clientId,user_id:u.userId,player_name:u.playerName}))localStorage.setItem('slaptax_'+k,v);},u);
 }
 // Exercise the compatibility path used by older supported Safari releases.
 await iosPage.addInitScript(()=>Object.defineProperty(CanvasRenderingContext2D.prototype,'roundRect',{value:undefined,configurable:true,writable:true}));
 await Promise.all([iosPage.goto('/?tab=defy'),androidPage.goto('/?tab=defy')]);
 for(const p of [iosPage,androidPage])await p.getByRole('button',{name:'Entrer dans l arene'}).click();
 for(const p of [iosPage,androidPage]){await expect(p.getByTestId('snack-game')).toHaveAttribute('data-variant','chicken');await expect(p.getByTestId('snack-game')).toHaveAttribute('data-phase','brawl');}
 const match=async()=>{const r=await request.get(`/api/duels/${duel.id}/match?userId=${ios.userId}`,{headers:headers(ios)});expect(r.ok()).toBe(true);return (await r.json()).match;};
 expect((await match()).games[0]).toBe('chicken');expect(snapshot.bodies.every((p:any)=>!p.bot)).toBe(true);
 return{ios,android,users,iosPage,androidPage,errors,snapshot:()=>snapshot,sawEgg:()=>sawEgg,match,
  wallet:async(u:User)=>(await(await request.get('/api/tokens',{headers:headers(u)})).json()),
  close:async()=>{for(const [name,page]of [['ios',iosPage],['android',androidPage]] as const){if(!page.isClosed())await info.attach(name,{body:await page.screenshot(),contentType:'image/png'}).catch(()=>{});}await safari.close();await chrome.close();},
 };
}

for(const failing of ['ios','android'] as const)test(`Poultry Panic: ${failing} drawing failure cancels for WebKit and Chromium without reversing the result`,async({request},info)=>{
 const f=await setup(request,info,failing==='ios');
 try{
  await expect.poll(f.sawEgg,{timeout:12000}).toBe(true);
  await f.iosPage.waitForTimeout(1700);
  const failed=failing==='ios'?f.iosPage:f.androidPage,other=failing==='ios'?f.androidPage:f.iosPage;
  for(const p of [failed,other])await expect(p.getByRole('heading',{name:'La partie a rencontré un problème.'})).toHaveCount(0);
  expect(f.errors).toEqual([]);
  await failed.evaluate((silent)=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args:any[]){if(this.dataset.testid==='snack-canvas'){if(silent)return null;throw Error('Cross-browser injected drawing failure');}return original.apply(this,args as any);} as typeof original;},failing==='ios');
  await expect(failed.getByRole('heading',{name:'La partie a rencontré un problème.'})).toBeVisible();
  await expect.poll(async()=>(await f.match()).status,{timeout:27000}).toBe('cancelled');
  const result=await f.match();expect(result.winnerId).toBeNull();expect(result.rounds).toHaveLength(0);
  for(const u of f.users){const w=await f.wallet(u);expect(w.balance).toBe(25);expect(w.journal.some((e:any)=>e.reason==='payout')).toBe(false);}
  await expect(other.getByTestId('round-recap')).toHaveCount(0);await expect(other.getByTestId('club-result')).toHaveCount(0);
  await expect(other.getByText(/ta mise a été remboursée/)).toBeVisible();
 }finally{await f.close();}
});

test('Poultry Panic: a played WebKit win is shown as a win to iOS and a loss to Android',async({request},info)=>{
 const f=await setup(request,info,false);
 try{
  let held='';const start=Date.now();await f.iosPage.getByTestId('snack-game').focus();
  while(Date.now()-start<65000){const s=f.snapshot(),p=s.bodies.find((p:any)=>p.id===f.ios.userId);if(s.winnerId||s.bodies.some((p:any)=>p.captures>=3))break;
   const target=p.carrying?{x:820,y:300}:s.box,dx=target.x-p.x,dy=target.y-p.y,next=Math.abs(dy)>22?(dy>0?'s':'w'):Math.abs(dx)>10?(dx>0?'d':'a'):'';
   if(next!==held){if(held)await f.iosPage.keyboard.up(held);if(next)await f.iosPage.keyboard.down(next);held=next;}await f.iosPage.waitForTimeout(70);
  }
  if(held)await f.iosPage.keyboard.up(held);
  await expect(f.iosPage.getByTestId('round-recap')).toHaveAttribute('data-won','true',{timeout:10000});
  await expect(f.androidPage.getByTestId('round-recap')).toHaveAttribute('data-won','false');
  const result=await f.match();expect(result.winnerId).toBe(f.ios.userId);expect(result.rounds[0].detail).toBe('chicken-deliveries');expect(result.rounds[0].moment.replay.at(-1).state.snack.bodies.find((p:any)=>p.id===f.ios.userId).captures).toBeGreaterThan(0);
  expect((await f.wallet(f.ios)).balance).toBe(28.5);expect((await f.wallet(f.android)).balance).toBe(20);expect(f.errors).toEqual([]);
 }finally{await f.close();}
});
