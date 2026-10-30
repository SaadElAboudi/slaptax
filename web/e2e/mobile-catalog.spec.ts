import {test,expect} from '@playwright/test';
import selection from '../../shared/game-selection.json' with {type:'json'};

test('every selected game enters its mobile scene without a crash or horizontal overflow',async({page},info)=>{
 test.skip(!info.project.name.includes('mobile'),'Mobile catalogue');test.setTimeout(120000);
 await page.setViewportSize({width:320,height:650});await page.addInitScript(()=>localStorage.setItem('slaptax_lang','fr'));
 let actions:string[]=[];page.on('websocket',ws=>ws.on('framesent',e=>{try{const a=JSON.parse(String(e.payload));if(a.type==='arena.action')actions.push(a.action);}catch{}}));
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const game of selection){
  actions=[];await page.goto(`/?tab=training&game=${game.id}`);await page.getByRole('button',{name:'Entrer dans l arene'}).click();
  const scene=page.locator(`[data-game-session="${game.id}"]`);await expect(scene,game.labelFr).toBeVisible();
  if(!['garde','bombpass'].includes(game.id))await expect(scene.locator('canvas').first(),game.labelFr).toBeVisible();
  if(game.id!=='bombpass')await expect(scene.locator('[data-testid=party-arena]'),game.labelFr).not.toHaveAttribute('data-phase','ready');
  if(['snack','chicken','pie','pigeon'].includes(game.id))await expect(scene.getByRole('slider')).toHaveCount(0);
  if(['snack','chicken'].includes(game.id)){await expect(scene.getByTestId('snack-skill')).toHaveCount(0);await expect(scene.getByTestId('snack-super')).toHaveCount(0);}
  if(game.id==='table'){await expect(scene.getByTestId('table-game')).toHaveAttribute('data-phase','brawl');const c=scene.getByTestId('table-canvas'),r=(await c.boundingBox())!;await page.touchscreen.tap(r.x+r.width*.85,r.y+r.height*.2);await expect.poll(()=>actions.includes('dash')).toBe(true);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),game.labelFr).toBe(true);
  await expect(page.getByRole('heading',{name:'La partie a rencontré un problème.'})).toHaveCount(0);
  await expect(scene.getByRole('button',{name:'Quitter l exercice'})).toBeInViewport();
  await page.screenshot({path:info.outputPath(`${game.id}-mobile.png`)});
 }
 expect(errors).toEqual([]);
});
