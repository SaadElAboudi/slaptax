import {test,expect} from '@playwright/test';
import selection from '../../shared/game-selection.json' with {type:'json'};
for(const game of selection)test(`${game.id}: live scene renders, fits and suspends canvas drawing in background`,async({page},info)=>{
 if(info.project.name.includes('mobile'))await page.setViewportSize({width:320,height:740});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');(window as any).__arenaDraws=0;for(const name of ['clearRect','fillRect'] as const){const original=CanvasRenderingContext2D.prototype[name];CanvasRenderingContext2D.prototype[name]=function(...args:Parameters<typeof original>){(window as any).__arenaDraws++;return original.apply(this,args);};}});
 await page.goto(`/?tab=training&game=${game.id}`);await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 if(game.id==='bombpass')await expect(page.getByTestId('bomb-track')).toBeVisible();
 else{await expect(page.getByTestId('party-arena')).toBeVisible();await expect(page.getByTestId('party-arena')).not.toHaveAttribute('data-phase','ready');}
 if(!['bombpass','garde'].includes(game.id)){
  await expect.poll(()=>page.evaluate(()=>(window as any).__arenaDraws)).toBeGreaterThan(0);
  await page.evaluate(()=>{document.documentElement.dataset.appActive='false';window.dispatchEvent(new CustomEvent('slaptax:app-state',{detail:{isActive:false}}));});await page.waitForTimeout(100);
  const before=await page.evaluate(()=>(window as any).__arenaDraws);await page.waitForTimeout(200);expect(await page.evaluate(()=>(window as any).__arenaDraws)).toBe(before);
  await page.evaluate(()=>{document.documentElement.dataset.appActive='true';window.dispatchEvent(new CustomEvent('slaptax:app-state',{detail:{isActive:true}}));});await expect.poll(()=>page.evaluate(()=>(window as any).__arenaDraws)).toBeGreaterThan(before);
 }
 if(!['snack','chicken'].includes(game.id)){
  const session=page.locator(`[data-game-session="${game.id}"]`);await expect(session).toBeVisible();expect(await page.evaluate(()=>document.getElementById('root')?.inert)).toBe(true);
  const help=session.getByRole('button',{name:/Commandes/});await help.click();await expect(help).toHaveAttribute('aria-expanded','true');await expect(session.getByRole('complementary',{name:'Aide de jeu'})).toContainText('La partie continue');await help.click();
  await expect(session.getByRole('button',{name:'Quitter l exercice'})).toHaveCount(1);await expect(session.getByRole('button',{name:'Quitter l exercice'})).toBeVisible();
 }
 const actions=page.locator('[data-testid="party-arena"] button:visible');for(const button of await actions.all()){const r=await button.boundingBox();if(r){expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(page.viewportSize()!.height);}}
 const scene=page.locator('canvas:visible').first();if(await scene.count()){const r=(await scene.boundingBox())!,v=page.viewportSize()!;expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(v.height);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`${game.id}-polished.png`),fullPage:true});expect(errors).toEqual([]);
});

test('balloon keyboard holds and releases a real banked balloon without a stuck pump',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=balloon');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const root=page.getByTestId('carnival-game');await expect(root.getByRole('button',{name:/^GONFLE/})).toBeEnabled();await root.focus();await page.keyboard.down(' ');await page.waitForTimeout(900);await page.keyboard.up(' ');await expect(page.getByTestId('game-moment')).toContainText('encaissé');await expect(root.getByRole('button',{name:/^GONFLE/})).toBeEnabled();
});

test('pigeon and lift keyboard shortcuts trigger authoritative actions',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 await page.goto('/?tab=training&game=pigeon');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const pigeon=page.getByTestId('absurd-game');await expect(pigeon.getByRole('button',{name:/^LARGUE/})).toBeEnabled();await pigeon.focus();await page.keyboard.press('j');await expect(pigeon.getByRole('button',{name:/^LARGUE/})).toBeDisabled();
 await page.goto('/?tab=training&game=lift');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const lift=page.getByTestId('absurd-game');await expect(lift.getByRole('button',{name:'DROITE',exact:true})).toBeEnabled();await lift.focus();await page.keyboard.press('3');await expect(lift.getByRole('button',{name:'DROITE',exact:true})).toHaveAttribute('aria-pressed','true');
});


test('native background releases a pumping balloon instead of inflating out of sight',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=balloon');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const game=page.getByTestId('carnival-game');await expect(game.getByRole('button',{name:/^GONFLE/})).toBeEnabled();await game.focus();await page.keyboard.down(' ');await page.waitForTimeout(900);
 await page.evaluate(()=>{document.documentElement.dataset.appActive='false';window.dispatchEvent(new CustomEvent('slaptax:app-state',{detail:{isActive:false}}));});await page.keyboard.up(' ');
 await page.evaluate(()=>{document.documentElement.dataset.appActive='true';window.dispatchEvent(new CustomEvent('slaptax:app-state',{detail:{isActive:true}}));});await expect(page.getByTestId('game-moment')).toContainText('encaissé');await expect(game.getByRole('button',{name:/^GONFLE/})).toBeEnabled();
});

test('Garde keyboard picks a real action without clicking inside the game first',async({page},info)=>{
 test.skip(info.project.name.includes('mobile'),'Automatic keyboard focus applies to a fine pointer');await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=garde');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const group=page.getByRole('group',{name:'Ton action'});await expect(group.getByRole('button',{name:'Charge',exact:true})).toBeEnabled();await page.keyboard.press('2');await expect(group.getByRole('button',{name:'Charge',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByTestId('garde')).toHaveAttribute('data-phase','reveal');await expect(page.getByTestId('garde')).toHaveAttribute('data-phase','choose');await page.keyboard.press('1');await expect(group.getByRole('button',{name:'Attaque',exact:true})).toHaveAttribute('aria-pressed','true');await page.getByRole('button',{name:'Quitter l exercice'}).click();await expect(page.getByRole('button',{name:'Entrer dans l arene'})).toBeVisible();expect(await page.evaluate(()=>document.getElementById('root')?.inert)).toBe(false);
});

test('cancelled cutting gesture leaves no line to validate',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));await page.goto('/?tab=training&game=decoupe');await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect(page.getByTestId('drawing')).toHaveAttribute('data-phase','drawpath',{timeout:15000});const canvas=page.getByTestId('drawing-canvas');
 const r=(await canvas.boundingBox())!;await page.mouse.move(r.x+20,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width-20,r.y+r.height/2);await canvas.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
 await expect(page.getByRole('button',{name:'Valider la coupe'})).toBeDisabled();
});
