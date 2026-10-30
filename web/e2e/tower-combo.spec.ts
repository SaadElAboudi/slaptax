import economy from '../../shared/token-economy.json' with {type:'json'};
import {test,expect} from '@playwright/test';
import {interpolateTower,type PartyRun} from '../src/gameplay/party';
for(const mode of ['practice','shared'])test(`three real perfect drops earn automatic protection without a repair choice in ${mode}`,async({page},info)=>{
 test.setTimeout(35000);if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:650});let run:PartyRun|undefined;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',async response=>{if(response.url().includes('/api/link-challenges/')){try{const data=await response.json();if(data.party?.id==='onemore')run=Object.values(data.party.runs)[0] as PartyRun;}catch{}}});
 page.on('websocket',socket=>socket.on('framereceived',event=>{try{const data=JSON.parse(String(event.payload));if(data.type==='arena.state'&&data.party?.id==='onemore'){run=Object.values(data.party.runs)[0] as PartyRun;}}catch{}}));
 await page.addInitScript(()=>{
  const original=window.fetch;window.fetch=async(...args:Parameters<typeof fetch>)=>{const sentAt=performance.now(),response=await original(...args);if(response.url.includes('/api/link-challenges/')){try{const data=await response.clone().json();if(data.party?.id==='onemore')(window as unknown as {towerSample:unknown}).towerSample={run:Object.values(data.party.runs)[0],at:(sentAt+performance.now())/2};}catch{}}return response;};
  const Native=window.WebSocket;
  window.WebSocket=class extends Native{constructor(url:string|URL,protocols?:string|string[]){super(url,protocols);this.addEventListener('message',event=>{try{const data=JSON.parse(String(event.data));if(data.type==='arena.state'&&data.party?.id==='onemore')(window as unknown as {towerSample:unknown}).towerSample={run:Object.values(data.party.runs)[0],at:performance.now()};}catch{}});}};
  localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','onemore');});await page.goto(mode==='shared'?'/?tab=training&link=new&game=onemore':'/?tab=training');if(mode==='shared')await page.getByRole('button',{name:'Creer mon defi',exact:true}).click();await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 const actor=await page.evaluate(()=>({userId:localStorage.getItem('slaptax_user_id')!,clientId:localStorage.getItem('slaptax_client_id')!}));
 const endpoint=`/api/link-challenges/${new URL(page.url()).searchParams.get('link')}`;
 async function sharedDrop(perfect:boolean){
  // Real HTTP inputs at real server positions establish the earned resource.
  // UI drop input is separately exercised by friend-vision; repair stays a real tap/click.
  const headers={'Content-Type':'application/json','X-SlapTax-User':actor.userId,'X-SlapTax-Client':actor.clientId},sentAt=Date.now();
  const response=await fetch(`http://127.0.0.1:3100${endpoint}/state`,{method:'POST',body:JSON.stringify(actor),headers});expect(response.ok).toBe(true);const data=await response.json(),r=data.party.runs[actor.userId] as PartyRun,base=r.layers!.slice(-1)[0],speed=r.motion!.speed;
  const target=(base.x+(perfect?0:.08))/(1-base.width)/speed*1000,period=2000/speed,age=r.motion!.ageMs+(Date.now()-sentAt);
  let at=target;while(at<age+25)at+=period;
  await new Promise(resolve=>setTimeout(resolve,Math.max(0,at-age-12)));
  const action=await fetch(`http://127.0.0.1:3100${endpoint}/action`,{method:'POST',body:JSON.stringify({...actor,action:'drop',turn:data.party.turn}),headers});expect(action.ok).toBe(true);

 }
 for(let i=1;i<=3;i++){
  // Time the DOM click in the browser frame, avoiding a second RPC delay.
  if(mode==='shared')await sharedDrop(true);else await page.evaluate(({level,source})=>new Promise<void>((resolve,reject)=>{
   const predict=eval(`(${source})`) as typeof interpolateTower,deadline=performance.now()+10000;
   const tick=()=>{const sample=(window as unknown as {towerSample?:{run:PartyRun;at:number}}).towerSample;
    const current=sample?.run,base=current?.layers?.slice(-1)[0],predicted=predict(current,sample?performance.now()-sample.at:0);
    if(current?.level===level-1&&base&&predicted?.moving&&(current.motion?.ageMs||0)>=180&&predicted.moving.x-base.x>-.014&&predicted.moving.x-base.x<-.009){
     const button=document.querySelector<HTMLButtonElement>('button[aria-label="Poser le bloc"]');if(button&&!button.disabled){button.click();resolve();return;}
    }
    if(performance.now()>deadline){reject(new Error('No real aligned drop window'));return;}requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
  }),{level:i,source:interpolateTower.toString()});await expect(page.getByTestId('stack-canvas')).toHaveAttribute('data-level',String(i));
  await expect.poll(()=>run?.perfectStreak).toBe(i);
 }
 await expect(page.getByTestId('tower-support')).toHaveAttribute('data-protected','true');await expect(page.getByTestId('tower-support')).toContainText('BOUÉE AUTOMATIQUE');await page.screenshot({path:info.outputPath('earned-lifeline.png'),fullPage:true});
 // Deliberately place one offset block, using real movement and server collision.
 if(mode==='shared')await sharedDrop(false);else await page.evaluate(source=>new Promise<void>((resolve,reject)=>{
  const predict=eval(`(${source})`) as typeof interpolateTower,deadline=performance.now()+10000;
  const tick=()=>{const sample=(window as unknown as {towerSample?:{run:PartyRun;at:number}}).towerSample,current=sample?.run,base=current?.layers?.slice(-1)[0],moving=predict(current,sample?performance.now()-sample.at:0)?.moving;
   const gap=base&&moving?Math.abs(base.x-moving.x):0;
   if(current?.level===3&&gap>.075&&gap<.09){const b=document.querySelector<HTMLButtonElement>('button[aria-label="Poser le bloc"]');if(b&&!b.disabled){b.click();resolve();return;}}
   if(performance.now()>deadline){reject(new Error('No real offset drop window'));return;}requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
 }),interpolateTower.toString());
 await expect(page.getByTestId('stack-canvas')).toHaveAttribute('data-level','4');const narrow=run!.layers!.slice(-1)[0].width;
 await expect(page.getByTestId('tower-repair')).toHaveCount(0);expect(run!.layers!.slice(-1)[0].width).toBe(narrow);expect(run?.level).toBe(4);expect(run?.buoy).toBe(true);
 await page.screenshot({path:info.outputPath('tower-automatic-protection.png')});
 await page.getByRole('button',{name:mode==='shared'?'Sécuriser ma tour · 4':'Securiser',exact:true}).click();if(mode==='shared'){await expect(page.getByText('DEFI PRET',{exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'4 blocs'})).toBeVisible();}else await expect(page.getByTestId('solo-victory').getByRole('progressbar',{name:'Score de maîtrise'})).toHaveAttribute('aria-valuenow','200');await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance',String(economy.welcome+(mode==='shared'?0:economy.practiceReward)));expect(errors).toEqual([]);
});
