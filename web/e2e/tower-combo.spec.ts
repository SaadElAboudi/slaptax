import {test,expect} from '@playwright/test';
import {interpolateTower,type PartyRun} from '../src/gameplay/party';
test('three real perfect drops earn a visible lifeline without inventing score or spending funds',async({page},info)=>{
 test.setTimeout(35000);let run:PartyRun|undefined;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('websocket',socket=>socket.on('framereceived',event=>{try{const data=JSON.parse(String(event.payload));if(data.type==='arena.state'&&data.party?.id==='onemore'){run=Object.values(data.party.runs)[0] as PartyRun;}}catch{}}));
 await page.addInitScript(()=>{
  const Native=window.WebSocket;
  window.WebSocket=class extends Native{constructor(url:string|URL,protocols?:string|string[]){super(url,protocols);this.addEventListener('message',event=>{try{const data=JSON.parse(String(event.data));if(data.type==='arena.state'&&data.party?.id==='onemore')(window as unknown as {towerSample:unknown}).towerSample={run:Object.values(data.party.runs)[0],at:performance.now()};}catch{}});}};
  localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','onemore');});await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 for(let i=1;i<=3;i++){
  // Time the DOM click in the browser frame, avoiding a second RPC delay.
  await page.evaluate(({level,source})=>new Promise<void>((resolve,reject)=>{
   const predict=eval(`(${source})`) as typeof interpolateTower,deadline=performance.now()+10000;
   const tick=()=>{const sample=(window as unknown as {towerSample?:{run:PartyRun;at:number}}).towerSample;
    const current=sample?.run,base=current?.layers?.slice(-1)[0],predicted=predict(current,sample?performance.now()-sample.at:0);
    if(current?.level===level-1&&base&&predicted?.moving&&(current.motion?.ageMs||0)>=180&&Math.abs(predicted.moving.x-base.x)<.003){
     const button=document.querySelector<HTMLButtonElement>('button[aria-label="Poser le bloc"]');if(button&&!button.disabled){button.click();resolve();return;}
    }
    if(performance.now()>deadline){reject(new Error('No real aligned drop window'));return;}requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
  }),{level:i,source:interpolateTower.toString()});await expect(page.getByTestId('stack-canvas')).toHaveAttribute('data-level',String(i));
  await expect.poll(()=>run?.perfectStreak).toBe(i);
 }
 await expect(page.getByTestId('stack-combo')).toHaveAttribute('data-protected','true');await expect(page.getByTestId('stack-combo')).toContainText('BOUÉE PRÊTE');await page.screenshot({path:info.outputPath('earned-lifeline.png'),fullPage:true});
 await page.getByRole('button',{name:'Securiser',exact:true}).click();await expect(page.getByTestId('solo-victory').getByRole('progressbar',{name:'Score de maîtrise'})).toHaveAttribute('aria-valuenow','150');await expect(page.getByTestId('player-wallet')).toHaveAttribute('data-balance','25');expect(errors).toEqual([]);
});
