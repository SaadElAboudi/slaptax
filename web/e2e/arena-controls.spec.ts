import {test,expect} from '@playwright/test';

test('arena preferences survive reload and the character guide does not trigger combat shortcuts',async({page},info)=>{
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','snack');});
 const skills:string[]=[];
 page.on('websocket',ws=>ws.on('framesent',e=>{try{const a=JSON.parse(String(e.payload));if(a.action==='skill')skills.push(a.action);}catch{}}));
 await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();
 const arena=page.getByTestId('snack-game'),assist=arena.getByRole('checkbox');await expect(arena).toBeVisible();await expect(arena).toHaveAttribute('data-phase','brawl');
 await assist.uncheck();await expect(assist).not.toBeChecked();
 const guide=arena.locator('summary');await guide.click();await expect(arena.locator('details')).toContainText('Une onde annoncée');
 await guide.focus();await page.keyboard.press('e');expect(skills).toHaveLength(0);await guide.click();await arena.focus();await page.keyboard.press('e');await expect.poll(()=>skills.length).toBe(1);
 if(!info.project.name.includes('mobile')){await arena.focus();await page.keyboard.press('Escape');await expect(arena.getByRole('button',{name:'Agrandir la vue'})).toBeVisible();}
 await page.reload();await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect(arena).toBeVisible();await expect(assist).not.toBeChecked();
 if(!info.project.name.includes('mobile')){await expect(arena.getByRole('button',{name:'Agrandir la vue'})).toBeVisible();expect(await page.evaluate(()=>document.getElementById('root')?.inert)).toBe(false);}
 await page.screenshot({path:info.outputPath('arena-controls.png')});
});

test('arena controls remain usable when preference writes are blocked',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','snack');const save=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('slaptax.snack.'))throw new DOMException('Blocked','SecurityError');return save.call(this,key,value);};});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const assist=page.getByTestId('snack-game').getByRole('checkbox');await assist.uncheck();await expect(assist).not.toBeChecked();await assist.check();await expect(assist).toBeChecked();expect(errors).toEqual([]);
});
