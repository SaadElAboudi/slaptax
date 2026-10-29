import {test,expect} from '@playwright/test';
import {WebSocket} from 'ws';
test.use({trace:'off'});
test('four identities join one night, reconnect and keep the shared journey',async({page,request},info)=>{
 test.setTimeout(210000);
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 let state:any;
 page.on('websocket',ws=>ws.on('framereceived',e=>{try{const a=JSON.parse(String(e.payload));if(a.type==='snack.team.state')state=a;}catch{}}));
 const guests:{ws:WebSocket;userId:string;clientId:string;state:any}[]=[];
 const connect=async(g:typeof guests[number],code:string)=>{
  const ws=new WebSocket(`ws://127.0.0.1:3100/api/realtime?userId=${g.userId}&clientId=${g.clientId}`);g.ws=ws;
  ws.on('message',raw=>{try{const a=JSON.parse(String(raw));if(a.type==='snack.team.state')g.state=a;}catch{}});
  await new Promise<void>((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
  ws.send(JSON.stringify({type:'snack.team.join',code}));
 };
 const send=(g:typeof guests[number],type:string)=>g.ws.send(JSON.stringify({type:`snack.team.${type}`}));
 try{
  await page.goto('/');
  await expect(page.getByRole('tabpanel').locator('article')).toHaveCount(4);
  await page.getByRole('button',{name:'Créer une soirée à quatre',exact:true}).click();
  await page.getByRole('button',{name:'Créer une soirée à quatre',exact:true}).click();
  const code=await page.getByTestId('snack-team-code').innerText();
  const url=new URL((await page.getByRole('textbox',{name:'Lien d’invitation'}).inputValue()));
  expect(url.searchParams.get('mode')).toBe('night');expect(url.searchParams.has('userId')).toBe(false);
  for(let i=0;i<3;i++){
   const clientId=crypto.randomUUID(),res=await request.post('/api/session/join',{data:{clientId,playerName:`Pote${i+1}`}});
   expect(res.ok()).toBe(true);const {userId}=await res.json();
   const g={clientId,userId,state:null,ws:null as unknown as WebSocket};guests.push(g);await connect(g,code);
  }
  await expect.poll(()=>state?.players.length).toBe(4);
  await expect(page.getByRole('button',{name:'Lancer la soirée · 4/4',exact:true})).toBeDisabled();
  for(const g of guests)send(g,'ready');
  await page.getByRole('button',{name:/^Je suis prêt !/}).click();
  await page.getByRole('button',{name:'Lancer la soirée · 4/4',exact:true}).click();
  await expect(page.getByTestId('snack-game')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('room')).toBe(code);
  await page.screenshot({path:info.outputPath('night-heist.png')});
  guests[2].ws.close();await expect(page.getByRole('heading',{name:'Un ami revient…'})).toBeVisible();
  await connect(guests[2],code);await expect(page.getByTestId('snack-game')).toBeVisible();
  if(!info.project.name.includes('mobile')){
   await expect(page.getByTestId('night-standings')).toBeVisible({timeout:100000});
   for(const g of guests)send(g,'next');
   await page.getByRole('button',{name:/^Prêt pour la suite/}).click();
   await expect(page.getByTestId('pie-canvas')).toBeVisible();
   for(const g of guests)expect(Object.keys(g.state.party.scores)).toHaveLength(2);
   await expect(page.getByTestId('night-standings')).toBeVisible({timeout:30000});
   for(const g of guests)send(g,'next');
   await page.getByRole('button',{name:/^Prêt pour la suite/}).click();
   await expect(page.getByTestId('stack-challenge')).toBeVisible();
   await page.getByRole('button',{name:'Poser le bloc',exact:true}).click();
   await expect(page.getByTestId('stack-canvas')).toHaveAttribute('data-level','1');
   await page.getByRole('button',{name:'Sécuriser ma tour · 1',exact:true}).click();
   await expect(page.getByRole('button',{name:'Partager le bilan',exact:true})).toBeVisible({timeout:35000});
   await expect(page.getByRole('table',{name:'Classement de la soirée'}).getByRole('row')).toHaveCount(5);
   expect(state.results).toHaveLength(3);expect(new URL(page.url()).searchParams.get('room')).toBe(code);
   await page.screenshot({path:info.outputPath('night-podium.png')});
   for(const g of guests)send(g,'rematch');
   await page.getByRole('button',{name:/^Revanche à quatre/}).click();
   await expect(page.getByTestId('snack-game')).toBeVisible();expect(state.results).toHaveLength(0);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Quitter le salon',exact:true}).click();
  await expect(page.getByRole('button',{name:'Créer une soirée à quatre',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
 }finally{for(const g of guests)g.ws.close();}
});
