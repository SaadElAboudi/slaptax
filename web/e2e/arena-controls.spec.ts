import {test,expect} from '@playwright/test';
for(const game of ['snack','chicken'])test(`${game}: simple controls ignore old advanced preferences and do not fire removed shortcuts`,async({page},info)=>{
 await page.addInitScript(game=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game',game);localStorage.setItem('slaptax.snack.manualAim','true');localStorage.setItem('slaptax.snack.assist','false');},game);
 const commands:string[]=[];page.on('websocket',ws=>ws.on('framesent',e=>{try{const a=JSON.parse(String(e.payload));if(a.type==='arena.action')commands.push(a.action);}catch{}}));
 await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();const arena=page.getByTestId('snack-game');await expect(arena).toHaveAttribute('data-phase','brawl');await expect(arena.getByRole('checkbox')).toHaveCount(0);await expect(page.getByTestId('snack-aim-pad')).toHaveCount(0);await expect(page.getByTestId('snack-skill')).toHaveCount(0);await expect(page.getByTestId('snack-super')).toHaveCount(0);
 await arena.focus();await page.keyboard.press('e');await page.keyboard.press('f');await page.keyboard.press('Shift');expect(commands.some(c=>['skill','super','evade'].includes(c))).toBe(false);
 await page.keyboard.press(' ');await expect.poll(()=>commands.includes('attack')).toBe(true);
 if(!info.project.name.includes('mobile')){await page.keyboard.press('Escape');await expect(arena.getByRole('button',{name:'Agrandir la vue'})).toBeVisible();await page.reload();await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect(arena.getByRole('button',{name:'Agrandir la vue'})).toBeVisible();}
});
test('simple arena remains playable with restricted storage',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('slaptax_lang','fr');localStorage.setItem('slaptax_training_game','snack');const save=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('slaptax.snack.'))throw new DOMException('Blocked','SecurityError');return save.call(this,key,value);};});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?tab=training');await page.getByRole('button',{name:'Entrer dans l arene'}).click();await expect(page.getByRole('button',{name:'BAFFE !',exact:true})).toBeEnabled();expect(errors).toEqual([]);
});
