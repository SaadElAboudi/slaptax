import {test,expect} from '@playwright/test';
test.use({trace:'off'});
test.beforeEach(async({page})=>{await page.setViewportSize({width:320,height:650});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));});
test('a fast continuous cookie trace is preserved through release and validated by the real engine',async({page})=>{
 test.setTimeout(40000);await page.goto('/?tab=training&game=fragile');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();const canvas=page.getByTestId('fragile-canvas');await expect(canvas).toBeVisible();const r=(await canvas.boundingBox())!;
 const points=[[.2,.2],[.8,.2],[.5,.8],[.2,.2]];await page.mouse.move(r.x+r.width*.2,r.y+r.height*.2);await page.mouse.down();for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let n=1;n<=8;n++){await page.mouse.move(r.x+r.width*(a[0]+(b[0]-a[0])*n/8),r.y+r.height*(a[1]+(b[1]-a[1])*n/8));await page.waitForTimeout(12);}}await page.mouse.up();await expect(page.getByTestId('solo-victory')).toHaveAttribute('data-medal','gold',{timeout:15000});await expect(page.getByTestId('practice-next-goal')).toContainText('Score parfait');
});
test('losing focus cancels a table gesture so releasing later does not cause an accidental dash',async({page})=>{
 let dashes=0;page.on('websocket',ws=>ws.on('framesent',e=>{try{const action=JSON.parse(String(e.payload));if(action.type==='arena.action'&&action.action==='dash')dashes++;}catch{}}));
 await page.goto('/?tab=training&game=table');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();const canvas=page.getByTestId('table-canvas');await expect(canvas).toBeVisible();const r=(await canvas.boundingBox())!;await page.mouse.move(r.x+r.width*.5,r.y+r.height*.5);await page.mouse.down();await page.mouse.move(r.x+r.width*.6,r.y+r.height*.4);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();await page.waitForTimeout(200);expect(dashes).toBe(0);
});
test('worker-rendered 3D race keeps the real hold heartbeat alive until a perfect finish',async({page})=>{
 test.setTimeout(45000);let state:any;page.on('websocket',ws=>ws.on('framereceived',e=>{try{const a=JSON.parse(String(e.payload));if(a.party?.id==='stopgo')state=a.party;}catch{}}));
 await page.goto('/?tab=training&game=stopgo');await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();const control=page.getByTestId('stopgo-control');await expect(control).toBeVisible();const scene=page.getByTestId('race-scene-3d');await expect(scene).toHaveAttribute('data-renderer','webgl');await expect.poll(async()=>Number(await scene.getAttribute('data-frames'))).toBeGreaterThan(2);await expect(scene).toHaveAttribute('data-thread','worker');await control.focus();let held=false;const deadline=Date.now()+33000;
 while(state?.phase==='survival'&&Date.now()<deadline){const go=state.survival.signal==='go';if(go&&!held){await page.keyboard.down('Space');held=true;}else if(!go&&held){await page.keyboard.up('Space');held=false;}await page.waitForTimeout(40);}
 if(held)await page.keyboard.up('Space');await expect(page.getByTestId('practice-next-goal')).toContainText('Score parfait',{timeout:5000});
});

for(const game of ['stopgo','table'])test(`${game}: a blocked renderer worker recovers into playable main-thread 3D`,async({page})=>{
 test.setTimeout(30000);await page.addInitScript(()=>{window.Worker=class{constructor(){throw new Error('Worker blocked for compatibility test');}} as unknown as typeof Worker;});await page.goto(`/?tab=training&game=${game}`);await page.getByRole('button',{name:'Entrer dans l arene',exact:true}).click();const scene=page.getByTestId(`${game==='stopgo'?'race':'table'}-scene-3d`);await expect(scene).toHaveAttribute('data-renderer','webgl');await expect.poll(async()=>Number(await scene.getAttribute('data-frames'))).toBeGreaterThan(2);await expect(scene).not.toHaveAttribute('data-thread','worker');await expect(game==='stopgo'?page.getByTestId('stopgo-control'):page.getByRole('button',{name:'Se propulser',exact:true})).toBeEnabled();
});
