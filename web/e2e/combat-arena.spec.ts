import {test,expect} from '@playwright/test';
test.use({trace:'off'});
test.beforeEach(async({page},info)=>{if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:650});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=combat');});
test('combat starts immediately, moves on input, stops on release and pauses without progressing',async({page},info)=>{
 const errors:string[]=[],assets:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>assets.push(r.url()));
 await page.getByRole('button',{name:'ECHO',exact:false}).click();await page.getByRole('button',{name:'Lancer le combat',exact:true}).click();
 const canvas=page.getByTestId('combat-canvas');await expect(canvas).toBeVisible();await expect.poll(async()=>Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(10);
 const move=page.getByTestId('combat-move'),box=(await move.boundingBox())!,x=Number(await canvas.getAttribute('data-player-x'));
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width-5,box.y+box.height/2);
 await expect.poll(async()=>Number(await canvas.getAttribute('data-player-x'))).toBeGreaterThan(x+20);await page.mouse.up();
 const stopped=Number(await canvas.getAttribute('data-player-x'));await page.waitForTimeout(180);expect(Math.abs(Number(await canvas.getAttribute('data-player-x'))-stopped)).toBeLessThan(4);
 const aim=(await page.getByTestId('combat-aim').boundingBox())!;await page.mouse.move(aim.x+aim.width/2,aim.y+8);await page.mouse.down();await expect.poll(async()=>Number(await canvas.getAttribute('data-shots'))).toBeGreaterThan(0);await page.mouse.up();
 await page.getByRole('button',{name:'Pause',exact:true}).click();const time=await canvas.getAttribute('data-elapsed');await page.waitForTimeout(250);expect(await canvas.getAttribute('data-elapsed')).toBe(time);
 await page.getByRole('button',{name:'Reprendre le combat',exact:true}).click();await expect.poll(async()=>Number(await canvas.getAttribute('data-elapsed'))).toBeGreaterThan(Number(time));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width+1);
 expect(assets.filter(a=>/CinematicStage-|raceWorker-|SurvivalGame-/.test(a))).toEqual([]);expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('combat-playing.png')});
});
test('mobile supports moving and aiming with two fingers and cancels both on interruption',async({page,context},info)=>{
 test.skip(!info.project.name.includes('mobile'),'Touchscreen interaction');
 await page.getByRole('button',{name:'Lancer le combat',exact:true}).click();const canvas=page.getByTestId('combat-canvas');await expect.poll(async()=>Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(3);
 const move=(await page.getByTestId('combat-move').boundingBox())!,aim=(await page.getByTestId('combat-aim').boundingBox())!,x=Number(await canvas.getAttribute('data-player-x'));
 const session=await context.newCDPSession(page);const points=[{id:1,x:move.x+move.width-10,y:move.y+move.height/2},{id:2,x:aim.x+aim.width/2,y:aim.y+8}];
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
 await expect.poll(async()=>Number(await canvas.getAttribute('data-player-x'))).toBeGreaterThan(x+15);await expect.poll(async()=>Number(await canvas.getAttribute('data-shots'))).toBeGreaterThan(0);
 await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});const stopped=Number(await canvas.getAttribute('data-player-x'));await page.waitForTimeout(200);expect(Math.abs(Number(await canvas.getAttribute('data-player-x'))-stopped)).toBeLessThan(5);
 await session.detach();
});

test('a complete bot match produces a result and a rematch starts with clean scores',async({page})=>{
 test.setTimeout(90000);await page.clock.install();await page.getByRole('button',{name:'Lancer le combat',exact:true}).click();
 for(let i=0;i<19;i++){await page.clock.runFor(5000);if(await page.getByRole('button',{name:'Revanche',exact:true}).isVisible())break;}
 await expect(page.getByRole('heading',{name:/VICTOIRE|DÉFAITE|ÉGALITÉ/})).toBeVisible();
 await page.getByRole('button',{name:'Revanche',exact:true}).click();await page.clock.runFor(100);
 await expect(page.getByRole('progressbar',{name:'Score de ton équipe',exact:true})).toHaveAttribute('value','0');
 await expect(page.getByRole('progressbar',{name:'Score adverse',exact:true})).toHaveAttribute('value','0');
 expect(Number(await page.getByTestId('combat-canvas').getAttribute('data-elapsed'))).toBeLessThan(1);
});
