import {test,expect} from '@playwright/test';

test('sharp scenery respects reduced motion and pointer aim in a letterboxed scene',async({page,request},info)=>{
 const clientId=crypto.randomUUID(),playerName='AtelierQA';
 const response=await request.post('/api/session/join',{data:{clientId,playerName}});
 expect(response.ok()).toBe(true);const {userId}=await response.json();
 await page.addInitScript(({clientId,userId,playerName})=>{for(const [k,v]of Object.entries({onboarded:'1',lang:'fr',client_id:clientId,user_id:userId,player_name:playerName,training_game:'pigeon'}))localStorage.setItem(`slaptax_${k}`,v);},{clientId,userId,playerName});
 await page.setViewportSize({width:info.project.name.includes('mobile')?320:1280,height:650});
 await page.emulateMedia({reducedMotion:'reduce'});
 let ready=false;const moves:number[]=[];const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('websocket',socket=>{
  socket.on('framereceived',event=>{try{const state=JSON.parse(String(event.payload));if(state.type==='arena.state'&&state.party?.phase==='brawl')ready=true;}catch{}});
  socket.on('framesent',event=>{try{const action=JSON.parse(String(event.payload));if(action.type==='arena.action'&&action.action==='steer')moves.push(action.x);}catch{}});
 });
 await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 await expect.poll(()=>ready).toBe(true);
 const canvas=page.getByTestId('pigeon-canvas');
 const dimensions=await canvas.evaluate((node:HTMLCanvasElement)=>({width:node.width,height:node.height,ratio:Math.min(2,Math.max(1,devicePixelRatio)),animation:getComputedStyle(node.closest('[data-phase="playing"]')!).animationName}));
 expect(dimensions.width).toBe(600*dimensions.ratio);expect(dimensions.height).toBe(440*dimensions.ratio);
 const rect=(await canvas.boundingBox())!,fittedWidth=Math.min(rect.width,rect.height*600/440);
 await page.mouse.click(rect.x+(rect.width-fittedWidth)/2+fittedWidth*.75,rect.y+rect.height/2);
 await expect.poll(()=>moves.length).toBeGreaterThan(0);
 expect(moves.at(-1)).toBeCloseTo(.8,1);
 await expect(page.getByRole('slider',{name:'Piloter le pigeon'})).toHaveValue(/0\.8/);
 const stage=page.locator('section[data-game="pigeon"] > div').filter({has:canvas}).last();
 expect(await stage.evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
 for(const button of await page.locator('section[data-game="pigeon"] button:enabled').all()){
  const box=(await button.boundingBox())!;expect(box.y+box.height).toBeLessThanOrEqual(650);
 }
 await page.screenshot({path:info.outputPath('industrial-pigeon-short-screen.png')});
 await page.getByRole('button',{name:'Quitter l exercice'}).click();
 await expect(page.getByRole('button',{name:'Entrer dans l arene'})).toBeVisible();expect(errors).toEqual([]);
});
